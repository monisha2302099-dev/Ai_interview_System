
"""Route interview prompts to existing subject-specific checkpoints."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

import torch

from backend.chatbot.inference import InferenceEngine


class SubjectModelRouter:
    """Select a trained subject model from the latest user message."""

    CHECKPOINTS = {
        "java": "java",
        "python": "python",
        "c": "c",
        "cpp": "cpp",
        "ds": "ds",
        "dbms": "dbms",
        "os": "os",
        "cn": "cn",
        "html": "html",
        "chain": "chain",
    }

    def __init__(
        self,
        vocabulary_path: str | Path = "backend/data/processed/vocab.json",
        checkpoint_directory: str | Path = "checkpoints",
        device: torch.device | None = None,
    ) -> None:
        self.vocabulary_path = Path(vocabulary_path)
        self.checkpoint_directory = Path(checkpoint_directory)
        self.device = device or torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )

        self.models: dict[str, Any] = {}
        self.fallback: Any | None = None

        # Load the existing trained checkpoints; do not train anything.
        for subject, folder in self.CHECKPOINTS.items():
            checkpoint = self.checkpoint_directory / folder / "best_model.pt"

            if not checkpoint.is_file():
                print(f"[Router] Skipping missing checkpoint: {checkpoint}")
                continue

            try:
                self.models[subject] = InferenceEngine.from_checkpoint(
                    checkpoint,
                    self.vocabulary_path,
                    device=self.device,
                )
                print(f"[Router] Loaded {subject}: {checkpoint}")
            except Exception as exc:
                print(f"[Router] Could not load {subject}: {exc}")

        fallback_path = (
            self.checkpoint_directory
            / "current_vocab_instruction"
            / "best_model.pt"
        )

        if fallback_path.is_file():
            try:
                self.fallback = InferenceEngine.from_checkpoint(
                    fallback_path,
                    self.vocabulary_path,
                    device=self.device,
                )
                print("[Router] Loaded general instruction fallback")
            except Exception as exc:
                print(f"[Router] Could not load fallback model: {exc}")

        if not self.models and self.fallback is None:
            raise RuntimeError(
                "No compatible subject or fallback checkpoints could be loaded."
            )

    @staticmethod
    def _latest_user_message(prompt: str) -> str:
        """Extract the last User: message from ConversationManager's prompt."""
        matches = re.findall(
            r"(?im)^User:\s*(.*)$",
            prompt,
        )
        return matches[-1].strip() if matches else prompt

    @staticmethod
    def _select_subject(message: str) -> str | None:
        text = message.casefold()

        # Check multiword and overlapping names before shorter names.
        rules = [
            ("cpp", r"\bc\+\+\b|\bcpp\b|c plus plus"),
            ("python", r"\bpython\b|\bpythonic\b"),
            ("java", r"\bjava\b|\bjvm\b|\bjdk\b|\bjre\b"),
            ("ds", r"\bdata structures?\b|\bstack\b|\bqueue\b|\blinked lists?\b|\bbinary trees?\b|\bbst\b|\bhash ?maps?\b|\btime complexity\b"),
            ("dbms", r"\bdbms\b|\bsql\b|\bdatabase\b|\bnormalization\b|\bjoins?\b|\btransactions?\b"),
            ("os", r"\boperating systems?\b|\bprocess scheduling\b|\bdeadlocks?\b|\bvirtual memory\b|\bthreads?\b"),
            ("cn", r"\bhttp\b|\bhttps\b|\brest api\b|\bcomputer networks?\b|\bnetworking\b|\btcp\b|\budp\b|\bosi model\b|\bip address\b|\bdns\b"),
            ("html", r"\bhtml\b|\bcss\b|\bjavascript\b|\bdom\b|\bweb page\b"),
            ("chain", r"\bblockchain\b|\bsmart contracts?\b|\bdistributed ledger\b"),
            ("c", r"\blanguage c\b|\bc programming\b|\bpointer\b|\bmalloc\b|\bprintf\b|\bscanf\b"),
        ]

        for subject, pattern in rules:
            if re.search(pattern, text):
                return subject

        return None

    def generate(self, prompt: str) -> str:
        message = self._latest_user_message(prompt)
        subject = self._select_subject(message)

        engine = self.models.get(subject) if subject else None

        if engine is None:
            engine = self.fallback

        # If the general model is unavailable, use any loaded subject model.
        if engine is None and self.models:
            engine = next(iter(self.models.values()))

        if engine is None:
            return "No compatible interview model is available."

        return engine.generate(prompt)
