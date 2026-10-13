
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
        "chain": "blockchain",
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

        self.checkpoints = {
            subject: self.checkpoint_directory / folder / "best_model.pt"
            for subject, folder in self.CHECKPOINTS.items()
            if (self.checkpoint_directory / folder / "best_model.pt").is_file()
        }
        self.fallback_checkpoint = (
            self.checkpoint_directory / "current_vocab_instruction" / "best_model.pt"
        )
        if not self.checkpoints and not self.fallback_checkpoint.is_file():
            raise RuntimeError(
                "No compatible subject or fallback checkpoints could be loaded."
            )
        self.models: dict[str, Any] = {}
        self.fallback: Any | None = None

    @property
    def model_loaded(self) -> bool:
        return bool(self.models) or self.fallback is not None

    def _load_checkpoint(self, checkpoint: Path) -> Any:
        return InferenceEngine.from_checkpoint(
            checkpoint,
            self.vocabulary_path,
            device=self.device,
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

        if subject in self.checkpoints:
            if subject not in self.models:
                self.models[subject] = self._load_checkpoint(self.checkpoints[subject])
            engine = self.models[subject]
        elif self.fallback_checkpoint.is_file():
            if self.fallback is None:
                self.fallback = self._load_checkpoint(self.fallback_checkpoint)
            engine = self.fallback
        elif self.checkpoints:
            selected = next(iter(self.checkpoints))
            if selected not in self.models:
                self.models[selected] = self._load_checkpoint(self.checkpoints[selected])
            engine = self.models[selected]
        else:
            raise RuntimeError("No compatible interview model is available.")

        return engine.generate(prompt)
