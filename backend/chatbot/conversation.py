
"""Session-aware conversation handling for interview practice."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any
from uuid import uuid4
import re


@dataclass
class Conversation:
    session_id: str
    messages: list[dict[str, str]] = field(default_factory=list)


class ConversationManager:
    """Maintain conversation history and route requests to the retriever."""

    def __init__(
        self,
        generator: Any,
        *,
        max_history_turns: int = 6,
        retriever: Any | None = None,
    ) -> None:
        if max_history_turns < 1:
            raise ValueError("max_history_turns must be positive")

        self.generator = generator
        self.retriever = retriever
        self.max_history_turns = max_history_turns
        self.sessions: dict[str, Conversation] = {}

    def chat(
        self,
        message: str,
        session_id: str | None = None,
    ) -> dict[str, str]:
        if not isinstance(message, str) or not message.strip():
            raise ValueError("message must be non-empty text")

        message = message.strip()
        conversation = self._get_or_create(session_id)

        # Detect evaluation requests, including common variations.
        evaluation_request = bool(
            re.search(
                r"\b(?:evaluate|evaluation|assess|grade|score|"
                r"rate|mark|check my answer|check this answer)\b",
                message.casefold(),
            )
        )

        response = None

        # IMPORTANT:
        # Evaluation must reach the retriever first.
        # Do not send evaluation requests straight to the LLM.
        if self.retriever is not None:
            try:
                response = self.retriever.answer(message)
            except (ValueError, KeyError) as exc:
                if evaluation_request:
                    response = (
                        "I couldn't evaluate this answer because of a "
                        f"dataset or evaluation error: {exc}"
                    )

        # Use the model for ordinary questions, or when retrieval
        # cannot answer a non-evaluation request.
        if response is None:
            conversation.messages.append(
                {"role": "user", "content": message}
            )

            prompt = self.build_prompt(conversation)

            try:
                response = self.generator.generate(prompt).strip()
            except Exception:
                response = (
                    "I couldn't generate a response right now. "
                    "Please try again."
                )

        else:
            response = str(response).strip()
            conversation.messages.append(
                {"role": "user", "content": message}
            )

        if not response:
            response = "I could not generate a response. Please try again."

        conversation.messages.append(
            {"role": "assistant", "content": response}
        )

        self._trim(conversation)

        return {
            "response": response,
            "session_id": conversation.session_id,
        }

    def build_prompt(self, conversation: Conversation) -> str:
        lines = [
            "Instruction: You are Prepzio, an interview preparation assistant.",
            "Answer the user's latest question clearly and accurately.",
            "When evaluating an answer, explain correctness, mistakes, "
            "missing points, and how to improve it.",
            "Do not repeat unrelated text or invent evaluation results.",
            "Never claim code was executed unless it actually was.",
        ]

        for item in conversation.messages:
            role = item["role"].capitalize()
            lines.append(f"{role}: {item['content']}")

        lines.append("Response:")
        return "\n".join(lines)

    def get_history(self, session_id: str) -> list[dict[str, str]]:
        conversation = self.sessions.get(session_id)

        if conversation is None:
            return []

        return list(conversation.messages)

    def clear(self, session_id: str) -> None:
        self.sessions.pop(session_id, None)

    def _get_or_create(
        self,
        session_id: str | None,
    ) -> Conversation:
        resolved_id = session_id or str(uuid4())

        if resolved_id not in self.sessions:
            self.sessions[resolved_id] = Conversation(
                session_id=resolved_id
            )

        return self.sessions[resolved_id]

    def _trim(self, conversation: Conversation) -> None:
        max_messages = self.max_history_turns * 2

        if len(conversation.messages) > max_messages:
            conversation.messages[:] = conversation.messages[-max_messages:]
