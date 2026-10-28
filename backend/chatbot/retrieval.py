
"""High-confidence interview retrieval and deterministic answer evaluation."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from backend.chatbot.interview_dataset import InterviewDataset


TOKEN_RE = re.compile(r"[a-z0-9+#.]+", re.IGNORECASE)

STOP_WORDS = {
    "a", "an", "and", "are", "about", "can", "do", "does", "for",
    "give", "how", "i", "in", "is", "it", "me", "of", "on",
    "please", "should", "tell", "that", "the", "this", "to",
    "use", "what", "when", "where", "which", "who", "why",
    "with", "explain", "describe", "define", "interview",
    "question", "simple", "terms", "my", "answer", "response",
    "evaluate", "evaluation", "score", "grade", "rate", "check",
    "correct", "complete", "completeness", "meaning", "based",
    "provide", "ideal", "expected", "compare", "partial", "marks",
    "out", "ten", "missing", "points", "mistakes", "feedback",
    "based", "correctness", "only", "keyword", "matching",
}


class QuestionBankRetriever:
    """Retrieve reviewed answers and evaluate interview answers."""

    def __init__(
        self,
        data_directory: str | Path | None = None,
        *,
        minimum_score: float = 0.34,
    ) -> None:
        self.data_directory = (
            Path(data_directory)
            if data_directory
            else Path(__file__).resolve().parents[1] / "data"
        )
        self.minimum_score = minimum_score
        self.records = self._load_records()

        dataset_path = self.data_directory / "cs_interview_dataset.jsonl"
        role_path = self.data_directory / "cs_interview_job_roles.json"

        self.interview_dataset = (
            InterviewDataset(dataset_path, role_path)
            if dataset_path.is_file() and role_path.is_file()
            else None
        )

    def _load_records(self) -> list[dict[str, Any]]:
        """Load reviewed question-bank records."""

        records: list[dict[str, Any]] = []

        source_files = (
            "python_fundamentals.jsonl",
            "coding_questions.jsonl",
            "cross_subject_questions.jsonl",
            "full_stack_developer_questions.jsonl",
            "train.jsonl",
        )

        for filename in source_files:
            path = self.data_directory / filename

            if not path.exists():
                continue

            try:
                lines = path.read_text(encoding="utf-8").splitlines()
            except OSError:
                continue

            for line in lines:
                if not line.strip():
                    continue

                try:
                    record = json.loads(line)
                except json.JSONDecodeError:
                    continue

                if isinstance(record, dict):
                    records.append(record)

        return records

    @staticmethod
    def _tokens(text: str) -> set[str]:
        """Return normalized tokens, excluding common words."""

        return {
            token.lower().strip(".")
            for token in TOKEN_RE.findall(text)
            if token.lower().strip(".") not in STOP_WORDS
        }

    @staticmethod
    def _normalize_tokens(text: str) -> set[str]:
        """Normalize basic singular and plural forms."""

        normalized: set[str] = set()

        for token in QuestionBankRetriever._tokens(text):
            if token.endswith("ies") and len(token) > 4:
                token = token[:-3] + "y"
            elif (
                token.endswith("s")
                and not token.endswith("ss")
                and len(token) > 3
            ):
                token = token[:-1]

            normalized.add(token)

        return normalized

    def answer(self, question: str) -> str | None:
        """Answer from reviewed data before using the language model."""

        query = re.sub(r"^\s*\[[^]]+\]\s*", "", question).strip()

        if not query:
            return None

        # Evaluation must be detected before ordinary retrieval.
        structured_answer = self._answer_from_interview_dataset(query)

        if structured_answer is not None:
            return structured_answer

        generated_list = self._generate_question_list(query)

        if generated_list is not None:
            return generated_list

        query_tokens = self._tokens(query)

        if not query_tokens:
            return None

        query_lower = query.casefold()

        wants_code = any(
            word in query_lower
            for word in ("code", "implement", "write", "solution")
        )

        stop_words = {
            "define", "definition", "what", "is", "are", "the",
            "a", "an", "of", "explain", "describe", "tell", "me",
            "about", "please", "give", "meaning", "in", "simple",
            "words", "easy", "english", "how", "does", "do",
            "work", "works", "used", "for", "and", "difference",
            "between",
        }

        concept_tokens = query_tokens - stop_words

        if not concept_tokens:
            return None

        candidate_records = self.records

        if wants_code:
            coding_records = [
                record
                for record in self.records
                if str(record.get("question_type", "")).lower()
                == "coding"
                or record.get("code")
            ]

            if coding_records:
                candidate_records = coding_records

        best_record = None
        best_score = 0.0

        field_weights = {
            "topic": 4.0,
            "question": 3.0,
            "instruction": 1.5,
            "book_definition": 1.0,
            "simple_definition": 1.0,
            "secondary": 0.5,
            "answer": 0.25,
        }

        for record in candidate_records:
            topic = str(record.get("topic", ""))
            record_question = str(record.get("question", ""))

            primary_tokens = self._tokens(
                f"{topic} {record_question}"
            )

            concept_overlap = concept_tokens.intersection(primary_tokens)

            if not concept_overlap:
                continue

            total_overlap = 0.0

            for field, weight in field_weights.items():
                value = str(record.get(field, ""))

                if value:
                    overlap = len(
                        concept_tokens.intersection(self._tokens(value))
                    )
                    total_overlap += overlap * weight

            coverage = len(concept_overlap) / max(1, len(concept_tokens))

            score = total_overlap / max(1, len(concept_tokens))
            score += coverage * 3.0

            if topic.strip().casefold() == query_lower:
                score += 5.0

            if wants_code:
                if str(record.get("question_type", "")).lower() == "coding":
                    score += 4.0

                if record.get("code"):
                    score += 2.0

            if score > best_score:
                best_record = record
                best_score = score

        if best_record is None:
            return None

        required_score = max(
            self.minimum_score,
            2.0 if len(concept_tokens) <= 2 else 3.0,
        )

        if best_score < required_score:
            return None

        if self._is_definition_or_comparison_query(query):
            return self._format_structured_definition(best_record, query)

        return self._format_answer(best_record, query)

    # ---------------------------------------------------------
    # Evaluation input extraction
    # ---------------------------------------------------------

    @staticmethod
    def _extract_evaluation_input(
        query: str,
    ) -> tuple[str, str]:
        """
        Support prompts such as:

        Evaluate this answer: A set stores unique items.

        Question: Define a set in Python.
        My answer: A set stores unique items.
        Give me a score out of 10.
        """

        question_hint = ""
        candidate_answer = query.strip()

        question_match = re.search(
            r"\bquestion\s*:\s*(.*?)"
            r"(?=\b(?:my\s+answer|your\s+answer|answer)\s*:)",
            query,
            flags=re.IGNORECASE | re.DOTALL,
        )

        answer_match = re.search(
            r"\b(?:my\s+answer|your\s+answer|answer)\s*:\s*(.*)",
            query,
            flags=re.IGNORECASE | re.DOTALL,
        )

        if question_match:
            question_hint = question_match.group(1).strip()

        if answer_match:
            candidate_answer = answer_match.group(1).strip()
        else:
            # Remove the evaluation instruction, not the answer.
            candidate_answer = re.sub(
                r"^\s*(?:please\s+)?"
                r"(?:evaluate|evaluation|score|grade|rate|check)\b"
                r"[^:]{0,150}:\s*",
                "",
                candidate_answer,
                count=1,
                flags=re.IGNORECASE,
            ).strip()

            # Handle instructions without a colon.
            candidate_answer = re.sub(
                r"^\s*(?:please\s+)?"
                r"(?:evaluate|score|grade|rate|check)\s+"
                r"(?:(?:this|my|the)\s+)?"
                r"(?:answer|response)\s+",
                "",
                candidate_answer,
                count=1,
                flags=re.IGNORECASE,
            ).strip()

        # Remove the instructions that follow the student's answer.
        instruction_pattern = (
            r"\b(?:give me a score|give a score|score out of|"
            r"explain what|compare it with|provide the ideal answer|"
            r"return a score|do not rely only|don't rely only|"
            r"allow partial marks|award partial marks|"
            r"identify mistakes|explain why)\b"
        )

        candidate_answer = re.split(
            instruction_pattern,
            candidate_answer,
            maxsplit=1,
            flags=re.IGNORECASE,
        )[0].strip()

        # Remove an evaluation command appended at the end.
        candidate_answer = re.sub(
            r"\s+(?:please\s+)?(?:evaluate|score|grade|rate|check)"
            r"\s+(?:(?:this|my|the)\s+)?"
            r"(?:answer|response)?\s*[.!?]*$",
            "",
            candidate_answer,
            flags=re.IGNORECASE,
        ).strip()

        return question_hint, candidate_answer

    # ---------------------------------------------------------
    # Evaluation and comparison routing
    # ---------------------------------------------------------

    def _answer_from_interview_dataset(
        self,
        query: str,
    ) -> str | None:
        """Handle comparisons and evaluation before model generation."""

        if self.interview_dataset is None:
            return None

        normalized = query.casefold().strip()

        # 1. Evaluate first. Do not let a long evaluation prompt
        # accidentally enter ordinary question generation.
        evaluation_requested = bool(
            re.search(
                r"\b(?:evaluate|evaluation|score|grade|rate|check)\b",
                normalized,
            )
        )

        if evaluation_requested:
            question_hint, candidate_answer = (
                self._extract_evaluation_input(query)
            )

            # The explicit question is more reliable than general
            # instructions in a long prompt.
            search_text = question_hint or candidate_answer

            record = self._find_evaluation_record(search_text)

            if record is None:
                return (
                    "I couldn't identify the interview topic for this "
                    "evaluation. Please include the question or topic, "
                    "for example: 'Evaluate my answer about Python sets: "
                    "A set stores unique values.'"
                )

            if not candidate_answer:
                return (
                    "Please include your answer after the question. "
                    "For example: 'Evaluate my answer about Python sets: "
                    "A set stores unique values.'"
                )

            record_id = record.get("id")

            if record_id is None:
                return (
                    "The matching dataset record has no question ID. "
                    "Please check the id field in "
                    "cs_interview_dataset.jsonl."
                )

            try:
                result = self.interview_dataset.evaluate_answer(
                    str(record_id),
                    candidate_answer,
                )
            except (ValueError, KeyError) as exc:
                return f"I couldn't evaluate this answer: {exc}"

            score = float(result.get("score", 0))

            strengths = result.get("strengths", [])
            missing = result.get("missing_points", [])
            mistakes = result.get("mistakes", [])

            strengths_text = "\n".join(
                f"- {item}" for item in strengths
            ) or "- No strengths were returned by the evaluator."

            missing_text = "\n".join(
                f"- {item}" for item in missing
            ) or "- No missing points were reported."

            mistake_lines = []

            for item in mistakes:
                if isinstance(item, dict):
                    claim = item.get("claim", "Issue")
                    correction = item.get(
                        "correction",
                        "Review this point.",
                    )
                    mistake_lines.append(f"- {claim}: {correction}")
                else:
                    mistake_lines.append(f"- {item}")

            mistakes_text = "\n".join(
                mistake_lines
            ) or "- No specific mistakes were reported."

            improved_answer = (
                result.get("improved_answer")
                or result.get("feedback")
                or result.get("improvement")
                or "Review the missing points and improve your answer."
            )
            small_improvement_text = (
                result.get("small_improvement")
                or result.get("improvement")
                or missing_text
            )

            relevance = result.get("relevance")

            response = (
                "## Answer Evaluation\n\n"
                f"**{score:g}/10**\n\n"
                "### Why it is good\n"
                f"{strengths_text}\n\n"
                "### Small improvement\n"
                f"{small_improvement_text}\n\n"
            )

            if relevance is not None:
                response += f"Relevance: {relevance}.\n\n"

            response += (
                "### Better interview answer\n"
                f"{improved_answer}"
            )

            return response            

        # 2. Handle comparisons.
        
        
        comparison_requested = bool(
            re.search(r"\bdiff(?:erence)?s?\b", normalized)
        ) or any(
            marker in normalized
            for marker in (
                "compare", "comparison", " vs ", "vs ", "versus",
                "which is better", "which is best",
            )
        )

        if comparison_requested:
            query_words = set(self._normalize_tokens(normalized))

            if "list" in query_words and "tuple" in query_words:
                return (
                    "## Python List vs Tuple\n\n"
                    "| Feature | List | Tuple |\n"
                    "|---|---|---|\n"
                    "| Mutability | Mutable; elements can be changed | "
                    "Immutable; elements cannot be reassigned |\n"
                    "| Syntax | Square brackets: [1, 2, 3] | "
                    "Parentheses: (1, 2, 3) |\n"
                    "| Suitable use | A collection that changes | "
                    "A fixed record or collection of values |\n\n"
                    "**When to use:** Use a list when you need to add, "
                    "remove, or update elements. Use a tuple for a fixed "
                    "record whose values should not be changed.\n\n"
                    "Example: a list can hold a changing shopping cart; "
                    "a tuple can represent a fixed coordinate."
                )

            if "binary" in query_words and "linear" in query_words:
                return (
                    "## Binary Search vs Linear Search\n\n"
                    "| Feature | Binary Search | Linear Search |\n"
                    "|---|---|---|\n"
                    "| Time complexity | O(log n) | O(n) |\n"
                    "| Data requirement | Requires sorted data | "
                    "Works on sorted or unsorted data |\n"
                    "| Method | Repeatedly halves the search range | "
                    "Checks elements one by one |\n\n"
                    "**When to use:** Use binary search for sorted data "
                    "when you need efficient repeated lookups. Use linear "
                    "search for small or unsorted collections, or when "
                    "sorting first is not worthwhile."
                )

            if "queue" in query_words and "stack" in query_words:
                return (
                    "## Queue vs Stack for Ticket Entry\n\n"
                    "A queue follows first in, first out (FIFO): the "
                    "first person to arrive is served first. A stack "
                    "follows last in, first out (LIFO): the most recent "
                    "entry is handled first.\n\n"
                    "**Recommendation:** For ordinary ticket entry, "
                    "use a queue because customers should be served in "
                    "arrival order. If customers have different urgency "
                    "levels, use a priority queue so higher-priority "
                    "tickets can be handled first."
                )

            if "list" in query_words and "set" in query_words:
                return (
                    "## Python List vs Set\n\n"
                    "A list is an ordered collection that permits "
                    "duplicates and supports indexing. A set stores "
                    "unique elements and does not support positional "
                    "indexing. Membership checks are typically O(n) "
                    "for a list and average O(1) for a set.\n\n"
                    "**When to use:** Use a list when order and duplicates "
                    "matter. Use a set when uniqueness and fast average-case "
                    "membership checks matter."
                )


        # 3. Preserve structured Python-list definitions.
        if (
            re.search(r"\blists?\b", normalized)
            and not re.search(r"\btuples?\b", normalized)
            and any(
                marker in normalized
                for marker in ("what is", "define", "explain")
            )
        ):
            record = next(
                (
                    item
                    for item in self.interview_dataset.records
                    if item.get("topic") == "Python lists"
                    and item.get("question_type") == "definition"
                    and item.get("difficulty") == "easy"
                ),
                None,
            )

            if record:
                return (
                    f"## {record.get('topic', 'Python lists')}\n\n"
                    f"**1. Proper definition**\n"
                    f"{record.get('book_definition', '')}\n\n"
                    f"**2. Simple explanation in easy English**\n"
                    f"{record.get('simple_answer', '')}\n\n"
                    f"**3. Practical example**\n"
                    f"{record.get('example', '')}"
                )

        return None

    def _find_evaluation_record(
        self,
        query: str,
    ) -> dict[str, Any] | None:
        """Find the best matching definition record for evaluation."""

        if self.interview_dataset is None:
            return None

        query_tokens = self._normalize_tokens(query)

        if not query_tokens:
            return None

        records = [
            record
            for record in self.interview_dataset.records
            if record.get("question_type") == "definition"
        ]

        ranked: list[tuple[float, dict[str, Any]]] = []

        for record in records:
            topic = str(record.get("topic", ""))
            question = str(record.get("question", ""))

            topic_tokens = self._normalize_tokens(topic)
            question_tokens = self._normalize_tokens(question)

            topic_overlap = len(query_tokens & topic_tokens)
            question_overlap = len(query_tokens & question_tokens)

            # Prefer an explicit topic match.
            if topic_overlap == 0 and question_overlap == 0:
                continue

            score = topic_overlap * 10 + question_overlap

            if topic_tokens and topic_tokens.issubset(query_tokens):
                score += 5

            if str(record.get("difficulty", "")).casefold() == "easy":
                score += 0.25

            ranked.append((score, record))

        if not ranked:
            return None

        ranked.sort(key=lambda item: item[0], reverse=True)

        return ranked[0][1]

    # ---------------------------------------------------------
    # Question generation
    # ---------------------------------------------------------

    def _generate_question_list(self, query: str) -> str | None:
        normalized = query.casefold()

        if not re.search(
            r"\b(?:generate|create|list|give|prepare)\b",
            normalized,
        ):
            return None

        count_match = re.search(
            r"\b(\d{1,2})\s+questions?\b",
            normalized,
        )

        if not count_match:
            return None

        requested_count = int(count_match.group(1))

        if requested_count < 1:
            return None

        if "full stack" not in normalized and "full-stack" not in normalized:
            return None

        role_records = [
            record
            for record in self.records
            if str(record.get("job_role", "")).casefold()
            == "full stack developer"
        ]

        if not role_records:
            return None

        requested_skills = [
            skill
            for skill in ("python", "html", "css")
            if re.search(rf"\b{skill}\b", normalized)
        ]

        if requested_skills:
            role_records = [
                record
                for record in role_records
                if any(
                    skill.casefold()
                    in {
                        str(item).casefold()
                        for item in record.get("skills", [])
                    }
                    for skill in requested_skills
                )
            ]

        selected = role_records[:requested_count]

        if len(selected) < requested_count:
            return None

        return "\n".join(
            f"{index}. {record['question']}"
            for index, record in enumerate(selected, start=1)
        )

    # ---------------------------------------------------------
    # Answer formatting
    # ---------------------------------------------------------

    @staticmethod
    def _is_definition_or_comparison_query(query: str) -> bool:
        normalized = query.casefold()

        keywords = (
            "what is",
            "define",
            "explain",
            "difference between",
            "compare",
            "pros and cons",
            "advantages and disadvantages",
            "when to use",
            "why use",
            "simple definition",
            "easy explanation",
        )

        return any(keyword in normalized for keyword in keywords)

    def _format_answer(
        self,
        record: dict[str, Any],
        query: str,
    ) -> str:
        query_lower = query.casefold()
        question_type = str(record.get("question_type", "")).lower()

        if question_type == "coding" and any(
            word in query_lower
            for word in ("code", "implement", "write", "solution")
        ):
            return self._format_coding_answer(record)

        seniority = next(
            (
                level
                for level in ("senior", "junior", "fresher")
                if level in query_lower
            ),
            None,
        )

        follow_ups = record.get("interview_questions", [])

        if (
            any(
                term in query_lower
                for term in (
                    "follow-up",
                    "follow up",
                    "ask me",
                    "interview question",
                )
            )
            and isinstance(follow_ups, list)
        ):
            candidate = next(
                (
                    item
                    for item in follow_ups
                    if isinstance(item, dict)
                    and (
                        seniority is None
                        or item.get("seniority") == seniority
                    )
                ),
                None,
            )

            if candidate:
                return (
                    f"Question: {candidate.get('question', '')}\n"
                    f"Answer guide: {candidate.get('answer', '')}"
                ).strip()

        if (
            any(
                term in query_lower
                for term in ("formal", "textbook", "technical definition")
            )
            and record.get("book_definition")
        ):
            return str(record["book_definition"])

        if (
            any(
                term in query_lower
                for term in ("alternate", "another way", "secondary")
            )
            and record.get("secondary")
        ):
            return str(record["secondary"])

        if record.get("simple_definition"):
            return str(record["simple_definition"])

        return str(record.get("answer", ""))

    def _format_structured_definition(
        self,
        record: dict[str, Any],
        query: str,
    ) -> str:
        topic = str(
            record.get("topic")
            or record.get("question")
            or "Concept"
        )

        definition = (
            record.get("book_definition")
            or record.get("simple_definition")
            or record.get("answer")
            or "A concept used in computer science."
        )

        simple = (
            record.get("simple_definition")
            or record.get("secondary")
            or definition
        )

        example = (
            record.get("example")
            or record.get("expected_output")
            or "A practical example depends on the application."
        )

        return (
            f"## {topic}\n\n"
            f"**1. Proper definition**\n{definition}\n\n"
            f"**2. Simple explanation in easy English**\n{simple}\n\n"
            f"**3. Practical example**\n{example}"
        )

    @staticmethod
    def _format_coding_answer(record: dict[str, Any]) -> str:
        parts = []

        if record.get("explanation"):
            parts.append(str(record["explanation"]))
        elif record.get("answer"):
            parts.append(str(record["answer"]))

        if record.get("code"):
            parts.append(
                f"```{record.get('language', '')}\n"
                f"{record['code']}\n```"
            )

        if record.get("expected_output"):
            parts.append(
                f"Example output: {record['expected_output']}"
            )

        if record.get("time_complexity"):
            parts.append(
                f"Time complexity: {record['time_complexity']}"
            )

        if record.get("space_complexity"):
            parts.append(
                f"Space complexity: {record['space_complexity']}"
            )

        return "\n\n".join(parts)
