"""Evaluate a saved InterviewLLM checkpoint on held-out data.

Reports two kinds of metrics:
  1. Token-level metrics from evaluate_model (loss / perplexity) - unchanged.
  2. Semantic metrics - the model GENERATES an answer for each test question and
     the answer is scored by MEANING against the reference (embeddings + NLI),
     not by matching words.
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import asdict
from pathlib import Path

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import torch

from backend.model.model import InterviewLLM
from backend.model.tokenizer import InterviewTokenizer
from backend.training.dataset import create_dataloader
from backend.training.train import evaluate_model

# semantic_eval.py must sit in the same folder as this file.
try:
    from .semantic_eval import evaluate as semantic_evaluate
except ImportError:
    from .semantic_eval import evaluate as semantic_evaluate

# ASSUMPTION 1: this must match how your training text was formatted in
# backend/training/dataset.py. Change it if your dataset uses another template.
PROMPT_TEMPLATE = "Question: {question}\nAnswer:"


def load_checkpoint_model(
    checkpoint_path: str | Path,
    *,
    device: torch.device,
) -> tuple[InterviewLLM, dict]:
    path = Path(checkpoint_path)
    if not path.exists():
        raise FileNotFoundError(f"checkpoint does not exist: {path}")
    checkpoint = torch.load(path, map_location=device, weights_only=False)
    if not isinstance(checkpoint, dict):
        raise ValueError("checkpoint must contain a dictionary")
    model_config = checkpoint.get("model_config")
    state_dict = checkpoint.get("model_state_dict")
    if not isinstance(model_config, dict) or not isinstance(state_dict, dict):
        raise ValueError("checkpoint must contain model_config and model_state_dict")
    model = InterviewLLM(**model_config)
    model.load_state_dict(state_dict)
    model.to(device)
    return model, checkpoint


@torch.no_grad()
def generate_answer(
    model: InterviewLLM,
    tokenizer: InterviewTokenizer,
    prompt: str,
    *,
    device: torch.device,
    max_new_tokens: int = 128,
) -> str:
    """Greedy decoding.

    ASSUMPTION 2: model(input_ids) returns logits shaped [batch, time, vocab]
    (or a tuple whose first item is that, or an object with .logits).
    ASSUMPTION 3: tokenizer has encode(str) -> list[int] and decode(list[int]) -> str,
    and optionally an eos_id attribute.
    """
    model.eval()
    prompt_ids = tokenizer.encode(prompt)
    prompt_ids = prompt_ids[-(model.context_length - 1):]
    input_ids = torch.tensor([prompt_ids], dtype=torch.long, device=device)
    eos_id = getattr(tokenizer, "eos_id", None)

    for _ in range(max_new_tokens):
        window = input_ids[:, -model.context_length:]
        output = model(window)
        if hasattr(output, "logits"):
            output = output.logits
        elif isinstance(output, tuple):
            output = output[0]
        next_id = output[0, -1].argmax()
        if eos_id is not None and next_id.item() == eos_id:
            break
        input_ids = torch.cat([input_ids, next_id.view(1, 1)], dim=1)

    new_ids = input_ids[0, len(prompt_ids):].tolist()
    return tokenizer.decode(new_ids).strip()


def load_test_records(path: Path, max_samples: int) -> list[dict]:
    records = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        record = json.loads(line)
        if record.get("question") and record.get("answer"):
            records.append(record)
        if len(records) >= max_samples:
            break
    return records


def _key_points_for(record: dict) -> list[str]:
    """Use the record's key_points; fall back to sentences of the reference answer."""
    points = record.get("key_points")
    if isinstance(points, list) and points:
        return [str(p) for p in points]
    sentences = [s.strip() for s in str(record["answer"]).replace("\n", " ").split(". ") if s.strip()]
    return sentences or [str(record["answer"])]


def evaluate_semantic(
    model: InterviewLLM,
    tokenizer: InterviewTokenizer,
    records: list[dict],
    *,
    device: torch.device,
    max_new_tokens: int,
) -> tuple[dict[str, float | int], list[dict]]:
    details = []
    for record in records:
        prompt = PROMPT_TEMPLATE.format(question=record["question"])
        generated = generate_answer(model, tokenizer, prompt, device=device, max_new_tokens=max_new_tokens)
        result = semantic_evaluate(
            generated,
            _key_points_for(record),
            str(record["answer"]),
        )
        details.append({
            "id": record.get("id"),
            "question": record["question"],
            "generated_answer": generated,
            "reference_answer": record["answer"],
            **asdict(result),
        })

    count = max(len(details), 1)
    summary = {
        "semantic_samples": len(details),
        "semantic_mean_score": round(sum(d["score"] for d in details) / count, 4),
        "semantic_mean_reference_similarity": round(sum(d["reference_similarity"] for d in details) / count, 4),
        "semantic_contradiction_rate": round(sum(1 for d in details if d["contradictions"]) / count, 4),
    }
    return summary, details


def evaluate_checkpoint(
    checkpoint_path: str | Path,
    test_loader: torch.utils.data.DataLoader,
    *,
    pad_id: int,
    device: torch.device,
) -> dict[str, float | int | str]:
    model, checkpoint = load_checkpoint_model(checkpoint_path, device=device)
    metrics = evaluate_model(model, test_loader, pad_id=pad_id, device=device)
    return {
        "checkpoint": str(checkpoint_path),
        "epoch": int(checkpoint.get("epoch", 0)),
        **metrics,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--checkpoint", type=Path, default=Path("checkpoints/best_model.pt"))
    parser.add_argument("--test-data", type=Path, default=Path("backend/data/processed/test.jsonl"))
    parser.add_argument("--vocabulary", type=Path, default=Path("backend/data/processed/vocab.json"))
    parser.add_argument("--batch-size", type=int, default=2)
    parser.add_argument("--device", default="auto")
    parser.add_argument("--max-samples", type=int, default=50, help="how many test questions to generate answers for")
    parser.add_argument("--max-new-tokens", type=int, default=128)
    parser.add_argument("--details-out", type=Path, default=None, help="optional JSON file with per-question results")
    args = parser.parse_args()

    if args.device == "auto":
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    else:
        device = torch.device(args.device)
    tokenizer = InterviewTokenizer.load(args.vocabulary)
    model, checkpoint = load_checkpoint_model(args.checkpoint, device=device)

    # 1) token-level metrics (unchanged)
    test_loader = create_dataloader(
        args.test_data,
        tokenizer,
        model.context_length,
        args.batch_size,
        shuffle=False,
    )
    metrics = evaluate_model(model, test_loader, pad_id=tokenizer.pad_id, device=device)

    # 2) meaning-based metrics on generated answers
    records = load_test_records(args.test_data, args.max_samples)
    semantic_summary, details = evaluate_semantic(
        model, tokenizer, records, device=device, max_new_tokens=args.max_new_tokens
    )

    report = {
        "checkpoint": str(args.checkpoint),
        "epoch": int(checkpoint.get("epoch", 0)),
        **metrics,
        **semantic_summary,
    }
    print(json.dumps(report, indent=2))

    if args.details_out:
        args.details_out.write_text(json.dumps(details, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"Per-question details written to {args.details_out}")


if __name__ == "__main__":
    main()