"""Question generation and deterministic rubric evaluation for interview practice."""

from __future__ import annotations

import json
import math
import re
from collections import defaultdict
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
DEFAULT_DATASET_PATH = DATA_DIR / "cs_interview_dataset.jsonl"
DEFAULT_ROLE_PATH = DATA_DIR / "cs_interview_job_roles.json"

_WORD_RE = re.compile(r"[a-z0-9+#.]+", re.IGNORECASE)
_STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "can", "do", "for",
    "from", "give", "has", "in", "is", "it", "of", "on", "or", "that",
    "the", "their", "then", "this", "to", "use", "when", "with",
}
_CONCEPT_ALIASES: dict[str, set[str]] = {
    "search": {"search", "find", "found", "finding", "locate", "look up", "lookup", "identify", "retrieve"},
    "target": {"target", "element", "item", "value", "desired value", "desired item"},
    "sorted": {"sorted", "ordered array", "ordered data", "ascending", "in order", "pre-sorted", "arranged"},
    "halve": {
        "half", "halves", "halve", "halving", "bisect", "divide", "split",
        "discard", "eliminate", "narrow", "shrink", "reduce", "cut",
        "one side",
    },
    "middle": {"middle", "midpoint", "center", "centre", "central"},
    "mutable": {"mutable", "changeable", "modifiable", "editable", "can change"},
    "immutable": {"immutable", "unchangeable", "fixed", "cannot change", "read only"},
    "ordered sequence": {
        "ordered sequence", "sequence", "preserves order", "keeps order",
        "sequential order", "in sequential order", "sequential sequence",
    },
    "runtime": {"runtime", "execution", "while running", "during execution"},
    "abnormal event": {"exception", "error", "failure", "abnormal event", "unexpected event"},
    "control flow": {"control flow", "normal flow", "program flow", "execution flow"},
    "handle failure": {"handle", "catch", "manage", "deal with"},
    "recovery": {"recover", "continue execution", "restore", "resume"},
    "report failure": {"report", "log", "notify", "explain the error"},
    "fifo": {"fifo", "first in first out", "arrival order", "oldest first", "first arrived"},
    "lifo": {"lifo", "last in first out", "newest first", "most recent first"},
    "key value mapping": {"key value", "key-value", "maps keys", "mapping", "associate"},
    "hashing": {"hash", "hashing", "hash function"},
    "constant time": {"constant time", "o 1", "o1", "instant lookup", "expected constant"},
    "isolation": {"isolated", "isolation", "separate address space", "fault containment"},
    "shared memory": {"shared memory", "share memory", "same address space"},

    # General computer science and programming concepts
    "cryptographic linking": {"cryptographic linking", "cryptographic hashes", "hash-linked blocks", "blocks linked by hashes", "linked using cryptography", "blocks linked together using cryptography", "transactions in blocks linked together using cryptography", "blocks are linked using hashes", "blocks are linked together", "blocks linked using cryptography"},
    "consensus": {"consensus", "agreement among nodes", "network agreement", "agree on valid updates", "agree on the same state", "consensus mechanism", "consensus mechanisms", "validate transactions", "validate updates", "agree on valid transactions"},
    "distributed ledger": {"distributed ledger", "decentralized ledger", "shared digital ledger", "shared transaction record"},
    "decentralization": {"decentralized", "distributed across nodes", "no central authority", "without a central server", "peer to peer"},
    "tamper resistance": {"tamper resistant", "difficult to alter", "hard to modify", "cannot easily be changed", "immutable records"},
    "encapsulation": {"encapsulation", "data hiding", "bundling data and methods", "restricting direct access"},
    "inheritance": {"inheritance", "derived class", "child class", "parent class", "base class", "reuse properties and methods"},
    "polymorphism": {"polymorphism", "many forms", "same interface different behavior", "different implementations"},
    "abstraction": {"abstraction", "hide implementation details", "expose essential features", "show only necessary details"},
    "database normalization": {"normalization", "database normalization", "reduce data redundancy", "avoid duplicate data", "prevent update anomalies"},
    "referential integrity": {"referential integrity", "foreign key constraint", "maintain valid relationships", "references an existing row"},
    "concurrency": {"concurrent execution", "multiple tasks at once", "simultaneous execution", "overlapping execution"},
    "deadlock": {"deadlock", "circular wait", "processes waiting for each other", "mutually waiting processes"},
    "http communication": {"http", "request response protocol", "client server communication", "web requests and responses"},
}
_NEGATION_WORDS = {
    "not", "no", "never", "without", "cannot", "can't", "doesn't", "dont",
    "don't", "isn't", "aren't", "won't", "doesn", "don", "isn", "aren", "won",
}
_RUBRIC_CUES: dict[str, set[str]] = {
    "explain both options": {"both", "option", "options", "versus", "vs"},
    "state their difference": {"difference", "differs", "contrast", "whereas", "while"},
    "give advantages and disadvantages": {"advantage", "advantages", "benefit", "benefits", "pros", "disadvantage", "disadvantages", "drawback", "drawbacks", "cons"},
    "identify use cases": {"use", "when", "suitable", "workload", "case", "cases"},
    "recommend conditionally based on situation": {"depends", "choose", "prefer", "better", "if", "when", "trade"},
    "provide working code": {"```", "def ", "select ", "function", "code"},
    "explain the approach": {"approach", "because", "first", "then", "use"},
    "give a valid example": {"example", "returns", "return", "output"},
    "state time and space complexity": {"o(", "time", "space", "complexity"},
    "identify the relevant constraint": {"latency", "memory", "scale", "constraint", "requirement", "traffic", "risk", "need"},
    "choose an appropriate approach": {"use", "choose", "prefer", "approach", "recommend"},
    "justify the trade-off": {"trade", "because", "however", "cost", "benefit"},
    "state suitable conditions": {"when", "if", "suitable", "use"},
    "state an alternative or limitation": {"alternative", "instead", "limit", "however", "but"},
    "explain the purpose": {"purpose", "why", "because", "helps", "allows"},
    "describe a benefit": {"benefit", "advantage", "improve", "reduce", "faster", "simpler"},
    "mention a relevant trade-off": {"trade", "cost", "however", "but", "limit", "overhead"},
}


def _normalize(value: str) -> str:
    return " ".join(value.casefold().split())


def _tokens(value: str) -> set[str]:
    return {
        token.casefold()
        for token in _WORD_RE.findall(value)
        if token.casefold() not in _STOP_WORDS and len(token) > 1
    }


def _stem(token: str) -> str:
    if len(token) > 5 and token.endswith("ing"):
        return token[:-3]
    if len(token) > 4 and token.endswith("ied"):
        return token[:-3] + "y"
    if len(token) > 4 and token.endswith("ed"):
        return token[:-2]
    if len(token) > 4 and token.endswith("es"):
        return token[:-2]
    if len(token) > 3 and token.endswith("s"):
        return token[:-1]
    return token


def _semantic_tags(value: str) -> set[str]:
    normalized = _normalize(value)
    words = {_stem(token) for token in _tokens(value)}
    concepts: set[str] = set()
    for concept, aliases in _CONCEPT_ALIASES.items():
        for alias in aliases:
            alias_normalized = _normalize(alias)
            alias_words = {_stem(token) for token in _tokens(alias)}
            if alias_normalized and alias_normalized in normalized:
                concepts.add(concept)
                break
            has_filtered_words = len(_WORD_RE.findall(alias)) != len(_tokens(alias))
            if alias_words and not has_filtered_words and alias_words.issubset(words):
                concepts.add(concept)
                break
    return concepts


def _concepts(value: str) -> set[str]:
    words = {_stem(token) for token in _tokens(value)}
    concepts = _semantic_tags(value)
    concepts.update(words)
    return concepts


def _semantic_match(candidate: str, expected: str) -> bool:
    candidate_tags = _semantic_tags(candidate)
    expected_tags = _semantic_tags(expected)
    if expected_tags:
        shared_tags = candidate_tags.intersection(expected_tags)
        return len(shared_tags) >= max(1, math.ceil(len(expected_tags) * 0.6))

    candidate_concepts = _concepts(candidate)
    expected_concepts = _concepts(expected)
    if not expected_concepts:
        return False
    shared = candidate_concepts.intersection(expected_concepts)
    return len(shared) >= max(1, math.ceil(len(expected_concepts) * 0.4))


def _is_negated(answer: str, concept: str) -> bool:
    words = _WORD_RE.findall(answer.casefold())
    concept_words = _WORD_RE.findall(concept.casefold())
    if not concept_words:
        return False
    width = len(concept_words)
    for index in range(max(0, len(words) - width + 1)):
        if words[index : index + width] != concept_words:
            continue
        nearby = words[max(0, index - 5) : index] + words[index + width : index + width + 3]
        if any(word in _NEGATION_WORDS for word in nearby):
            return True
    return False


def _concept_is_negated(answer: str, concept: str) -> bool:
    aliases = _CONCEPT_ALIASES.get(concept, {concept})
    return any(_is_negated(answer, alias) for alias in aliases)


def _cue_matches(answer: str, cues: list[str]) -> bool:
    answer_tags = _semantic_tags(answer)
    for cue in cues:
        if _normalize(cue) in _normalize(answer) and not _is_negated(answer, cue):
            return True
        expected_tags = _semantic_tags(cue)
        if expected_tags:
            shared = answer_tags.intersection(expected_tags)
            if len(shared) == len(expected_tags) and not any(
                _concept_is_negated(answer, concept) for concept in shared
            ):
                return True
            continue
        expected_words = {_stem(token) for token in _tokens(cue)}
        answer_words = {_stem(token) for token in _tokens(answer)}
        if expected_words and len(expected_words.intersection(answer_words)) >= max(
            1, math.ceil(len(expected_words) * 0.7)
        ):
            return True
    return False


class InterviewDataset:
    """Load question records and expose role/skill-aware selection and evaluation."""

    def __init__(
        self,
        dataset_path: str | Path = DEFAULT_DATASET_PATH,
        role_path: str | Path = DEFAULT_ROLE_PATH,
    ) -> None:
        self.dataset_path = Path(dataset_path)
        self.role_path = Path(role_path)
        self.records = self._load_records()
        self.roles = self._load_roles()
        self._records_by_id = {record["id"]: record for record in self.records}
        if len(self._records_by_id) != len(self.records):
            raise ValueError(f"Duplicate question IDs in {self.dataset_path}")


    def _load_records(self) -> list[dict[str, Any]]:
        if not self.dataset_path.is_file():
            raise FileNotFoundError(
                f"Interview dataset not found at {self.dataset_path}. "
                "Run python backend/data/build_cs_interview_dataset.py."
            )

        required = {
            "id", "subject", "topic", "difficulty",
            "question", "reference_answer", "key_points"
        }

        records: list[dict[str, Any]] = []
        seen_ids: set[str] = set()
        seen_questions: set[str] = set()

        def add_record(record: dict[str, Any]) -> None:
            question = str(record.get("question", "")).strip()
            record_id = str(record.get("id", "")).strip()

            if not question or not record_id:
                return

            question_key = _normalize(question)

            if record_id in seen_ids or question_key in seen_questions:
                return

            seen_ids.add(record_id)
            seen_questions.add(question_key)
            records.append(record)

        # Load the existing structured interview dataset first.
        for line_number, line in enumerate(
            self.dataset_path.read_text(encoding="utf-8").splitlines(), 1
        ):
            if not line.strip():
                continue

            try:
                record = json.loads(line)
            except json.JSONDecodeError as exc:
                raise ValueError(
                    f"Invalid JSON at {self.dataset_path}:{line_number}: {exc}"
                ) from exc

            missing = required - record.keys()
            if missing:
                raise ValueError(
                    f"Missing dataset fields at "
                    f"{self.dataset_path}:{line_number}: {sorted(missing)}"
                )

            add_record(record)

        # Map existing subject-specific training files to display names.
        subject_files = {
            "blockchain": ("Blockchain", ["blockchain"]),
            "c": ("C", ["c", "programming"]),
            "cn": ("Computer Networks", ["computer networks", "cn"]),
            "cpp": ("C++", ["cpp", "programming"]),
            "dbms": ("DBMS", ["dbms", "sql", "database"]),
            "ds": ("Data Science", ["data science", "programming"]),
            "html": ("HTML", ["html", "frontend"]),
            "java": ("Java", ["java", "programming"]),
            "os": ("Operating Systems", ["operating systems", "os"]),
            "python": ("Python", ["python", "programming"]),
        }

        # Add questions from existing subject training files.
        for file_path in sorted(self.dataset_path.parent.glob("*_train.jsonl")):
            subject_key = file_path.name.removesuffix("_train.jsonl")

            # These files do not use the subject-question format.
            if subject_key not in subject_files:
                continue

            subject_name, subject_skills = subject_files[subject_key]

            for line_number, line in enumerate(
                file_path.read_text(encoding="utf-8").splitlines(), 1
            ):
                if not line.strip():
                    continue

                try:
                    source = json.loads(line)
                except json.JSONDecodeError as exc:
                    raise ValueError(
                        f"Invalid JSON at {file_path}:{line_number}: {exc}"
                    ) from exc

                text = str(source.get("text", ""))
                if "Question:" not in text or "Answer:" not in text:
                    continue

                question_text = text.split("Question:", 1)[1].split(
                    "Answer:", 1
                )[0].strip()

                answer_text = text.split("Answer:", 1)[1].strip()

                if not question_text or not answer_text:
                    continue

                # The source files do not provide difficulty or key points.
                # Use a fallback difficulty and derive basic evaluation points.
                key_points = [
                    part.strip(" -*\t")
                    for part in answer_text.replace("\n", " ").split(".")
                    if len(part.strip()) >= 15
                ][:5]

                record = {
                    "id": str(source.get("id", "")).strip(),
                    "subject": subject_name,
                    "topic": subject_name,
                    "difficulty": "intermediate",
                    "question_type": "general",
                    "question": question_text,
                    "reference_answer": answer_text,
                    "key_points": key_points,
                    "skills": subject_skills,
                    "job_roles": [],
                }

                add_record(record)

        if not records:
            raise ValueError(
                f"No usable interview questions found in {self.dataset_path}"
            )

        return records


    def _load_roles(self) -> dict[str, dict[str, Any]]:
        if not self.role_path.is_file():
            raise FileNotFoundError(f"Job-role catalog not found: {self.role_path}")
        try:
            roles = json.loads(self.role_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise ValueError(f"Invalid job-role catalog JSON: {exc}") from exc
        if not isinstance(roles, dict) or not roles:
            raise ValueError(f"Job-role catalog must be a non-empty object: {self.role_path}")
        return roles

    def subjects(self) -> list[str]:
        return sorted({str(record["subject"]) for record in self.records})

    def job_roles(self) -> dict[str, dict[str, Any]]:
        return self.roles

    def generate_questions(
        self,
        *,
        job_role: str | None = None,
        skills: list[str] | None = None,
        subject: str | None = None,
        difficulty: str | None = None,
        count: int = 5,
    ) -> list[dict[str, Any]]:
        if count < 1 or count > 50:
            raise ValueError("count must be between 1 and 50")

        if difficulty is not None and _normalize(difficulty) not in {
            "easy", "intermediate", "advanced"
        }:
            raise ValueError("difficulty must be easy, intermediate, or advanced")

        selected_role = None
        canonical_role = None

        if job_role:
            matched_role = next(
                (
                    (key, value)
                    for key, value in self.roles.items()
                    if _normalize(key) == _normalize(job_role)
                ),
                None,
            )
            if matched_role is None:
                raise ValueError(f"Unknown job role: {job_role}")

            canonical_role, selected_role = matched_role

        normalized_subject = _normalize(subject) if subject else None
        known_subjects = {_normalize(value) for value in self.subjects()}

        if normalized_subject and normalized_subject not in known_subjects:
            raise ValueError(f"Unknown subject: {subject}")

        requested_skills = {
            _normalize(skill)
            for skill in (skills or [])
            if skill.strip()
        }

        role_skills = set()
        role_subjects = set()

        if selected_role:
            role_skills = {
                _normalize(skill)
                for skill in selected_role.get("skills", [])
            }
            role_subjects = {
                _normalize(item)
                for item in selected_role.get("subjects", [])
            }

            invalid_skills = requested_skills - role_skills
            if invalid_skills:
                raise ValueError(
                    f"Skills are not listed for {canonical_role}: "
                    f"{', '.join(sorted(invalid_skills))}"
                )

        candidates = []

        for record in self.records:
            record_subject = _normalize(str(record.get("subject", "")))
            record_skills = {
                _normalize(skill)
                for skill in record.get("skills", [])
            }
            record_roles = {
                _normalize(role)
                for role in record.get("job_roles", [])
            }

            # Apply any explicitly requested subject or difficulty.
            if normalized_subject and record_subject != normalized_subject:
                continue

            if difficulty and _normalize(
                str(record.get("difficulty", ""))
            ) != _normalize(difficulty):
                continue

            # If skills were explicitly requested, require a skill match.
            if requested_skills and not requested_skills.intersection(
                record_skills
            ):
                continue

            priority = 0

            if selected_role:
                subject_match = record_subject in role_subjects
                exact_role_match = _normalize(canonical_role) in record_roles

                # Only allow questions tagged for this role
                # or belonging to its configured subjects.
                if not (exact_role_match or subject_match):
                    continue

                if exact_role_match:
                    priority = 0
                else:
                    priority = 1             

            candidates.append((priority, record))

        # Prioritize role-specific questions without discarding relevant
        # questions from the existing dataset.
        candidates.sort(key=lambda item: item[0])

        if not candidates:
            return []

        # Rotate through topics to provide variety in the question batch.
        by_topic: dict[str, list[dict[str, Any]]] = defaultdict(list)

        for _, record in candidates:
            by_topic[str(record.get("topic", "General"))].append(record)

        result = []
        topic_order = list(by_topic)

        while len(result) < min(count, len(candidates)):
            added = False

            for topic in topic_order:
                if by_topic[topic] and len(result) < count:
                    result.append(by_topic[topic].pop(0))
                    added = True

            if not added:
                break

        public_fields = {
            "id",
            "subject",
            "topic",
            "skills",
            "job_roles",
            "difficulty",
            "question_type",
            "question",
        }

        return [
            {
                key: value
                for key, value in record.items()
                if key in public_fields
            }
            for record in result
        ]

    def evaluate_answer(self, question_id: str, answer: str) -> dict[str, Any]:
        if not isinstance(answer, str) or not answer.strip():
            raise ValueError("answer must be non-empty text")
        record = self._records_by_id.get(question_id)
        if record is None:
            raise ValueError(f"Unknown question ID: {question_id}")

        normalized_answer = _normalize(answer)
        evaluation_rubric = record.get("evaluation_rubric")
        if isinstance(evaluation_rubric, dict):
            return self._evaluate_weighted_rubric(
                question_id,
                record,
                normalized_answer,
                evaluation_rubric,
            )

        
        matched_points: list[str] = []
        missing_points: list[str] = []

        # Recognize different ways candidates can express the same idea.
        extra_cues = {
            "unique elements": (
                "unique elements",
                "different values",
                "distinct values",
                "no duplicates",
                "each value once",
            ),
            "duplicates are removed": (
                "duplicates are removed",
                "duplicate values",
                "same value",
                "only once",
                "keeps it once",
                "repeated values",
                "different values",
                "unique values",
            ),
            "unordered collection": (
                "unordered",
                "no particular order",
                "order is not guaranteed",
                "no positional order",
            ),
            "fast membership testing": (
                "membership testing",
                "membership check",
                "check if a value exists",
                "check whether an element exists",
                "fast lookup",
                "in operator",
            ),
        }

        
        for point in record["key_points"]:
            point_text = str(point)
            point_key = point_text.casefold()

            cue_words = _RUBRIC_CUES.get(point_key)

            if cue_words is None:
                cue_words = extra_cues.get(point_key)

            if cue_words:
                matched = _cue_matches(answer, list(cue_words))
            else:
                matched = _semantic_match(answer, point_text)

            # IMPORTANT: Record the evaluation result.
            if matched:
                matched_points.append(point_text)
            else:
                missing_points.append(point_text)



        relevance = (
            "off-topic"
            if not matched_points
            else "relevant"
            if len(matched_points) == len(record["key_points"])
            else "partially relevant"
        )
        score = round(10 * len(matched_points) / max(1, len(record["key_points"])), 1)
        mistakes = [
            {
                "claim": str(misconception["trigger"]),
                "correction": str(misconception["correction"]),
            }
            for misconception in record.get("common_misconceptions", [])
            if _normalize(str(misconception["trigger"])) in normalized_answer
        ]
        contradiction_records = record.get("evaluation_rubric", {}).get("contradictions", [])
        for contradiction in contradiction_records:
            if not isinstance(contradiction, dict):
                continue
            claim = contradiction.get("claim")
            correction = contradiction.get("correction")
            cue_groups = contradiction.get("cues", [])
            if (
                isinstance(claim, str)
                and isinstance(correction, str)
                and isinstance(cue_groups, list)
                and any(
                    isinstance(group, list)
                    and (
                        any(_normalize(cue) in normalized_answer for cue in group if isinstance(cue, str))
                        or _cue_matches(answer, group)
                    )
                    for group in cue_groups
                )
                and _is_negated(answer, str(contradiction.get("negated_term", "")))
            ):
                mistakes.append({"claim": claim, "correction": correction})
        if mistakes:
            score = max(0.0, round(score - min(3.0, len(mistakes) * 2.0), 1))
        if relevance == "off-topic":
            score = 0.0

        if score >= 8:
            feedback = "Strong answer. It covers the main interview points."
        elif score >= 5:
            feedback = "Partially correct. Add the missing points and clarify the trade-offs."
        else:
            feedback = "The answer needs more key details. Review the improved answer and try again."
        if mistakes:
            feedback += " One or more statements conflict with the reference."

        strengths = matched_points[:]
        improvement = (
            "Add: " + "; ".join(missing_points) + "."
            if missing_points
            else "No key rubric points are missing."
        )
        return {
            "question_id": question_id,
            "score": score,
            "correct": score >= 7 and not mistakes,
            "relevance": relevance,
            "relevance_score": round(len(matched_points) / max(1, len(record["key_points"])), 2),
            "mistakes": mistakes,
            "missing_points": missing_points,
            "matched_points": matched_points,
            "strengths": strengths,
            "improvement": improvement,
            "feedback": feedback,
            "improved_answer": record["reference_answer"],
            "evaluation_note": (
                "Scoring compares order-independent concepts, curated synonyms, relevance, and known contradictions. "
                "It is not a general natural-language-inference model; review nuanced answers."
            ),
        }

    @staticmethod
    def _evaluate_weighted_rubric(
        question_id: str,
        record: dict[str, Any],
        normalized_answer: str,
        rubric: dict[str, Any],
    ) -> dict[str, Any]:
        matched_points: list[str] = []
        missing_points: list[str] = []
        core_points = rubric.get("core_points", [])
        refinement_points = rubric.get("refinement_points", [])
        if not isinstance(core_points, list) or not isinstance(refinement_points, list):
            raise ValueError(f"Invalid evaluation rubric for question {question_id}")

        matched_core = 0
        matched_refinements = 0
        total_core_weight = len(core_points) * 3
        total_refinement_weight = len(refinement_points)
        for points, weight in ((core_points, 3), (refinement_points, 1)):
            for point in points:
                if not isinstance(point, dict) or not isinstance(point.get("label"), str) or not isinstance(point.get("cues"), list):
                    raise ValueError(f"Invalid evaluation rubric point for question {question_id}")
                label = point["label"]
                cues = [cue for cue in point["cues"] if isinstance(cue, str)]
                if _cue_matches(normalized_answer, cues):
                    matched_points.append(label)
                    if weight == 3:
                        matched_core += 1
                    else:
                        matched_refinements += 1
                else:
                    missing_points.append(label)

        matched_weight = matched_core * 3 + matched_refinements
        total_weight = total_core_weight + total_refinement_weight
        relevance = (
            "off-topic"
            if matched_core == 0
            else "relevant"
            if matched_core == len(core_points)
            else "partially relevant"
        )
        score = min(
            10.0,
            round(10 * matched_weight / max(1, total_weight), 1),
        )
        contradictions = rubric.get("contradictions", [])
        mistakes = []
        for contradiction in contradictions:
            if not isinstance(contradiction, dict):
                continue
            claim = contradiction.get("claim")
            correction = contradiction.get("correction")
            cues = contradiction.get("cues", [])
            negated_term = contradiction.get("negated_term")
            if (
                isinstance(claim, str)
                and isinstance(correction, str)
                and isinstance(negated_term, str)
                and isinstance(cues, list)
                and any(
                    isinstance(group, list)
                    and (
                        any(_normalize(cue) in normalized_answer for cue in group if isinstance(cue, str))
                        or _cue_matches(normalized_answer, group)
                    )
                    for group in cues
                )
                and _is_negated(normalized_answer, negated_term)
            ):
                mistakes.append({"claim": claim, "correction": correction})
        if mistakes:
            score = max(0.0, score - min(3.0, len(mistakes) * 2.0))
        if relevance == "off-topic":
            score = 0.0
        if score >= 8:
            feedback = "Strong answer. It covers the main interview points."
        elif score >= 5:
            feedback = "Partially correct. Add the missing points and clarify the idea."
        else:
            feedback = "The answer needs more key details. Review the improved answer and try again."
        improvement = (
            f"To make it more complete, mention {rubric['suggestion']}."
            if missing_points and isinstance(rubric.get("suggestion"), str)
            else "To make it more complete, add: " + "; ".join(missing_points) + "."
            if missing_points
            else "No key rubric points are missing."
        )
        return {
            "question_id": question_id,
            "score": score,
            "correct": score >= 7 and not mistakes,
            "relevance": relevance,
            "relevance_score": round(matched_weight / max(1, total_weight), 2),
            "mistakes": mistakes,
            "missing_points": missing_points,
            "matched_points": matched_points,
            "strengths": matched_points[:],
            "improvement": improvement,
            "feedback": feedback,
            "improved_answer": rubric.get("improved_answer", record["reference_answer"]),
            "evaluation_note": (
                "Scoring compares order-independent concepts, curated synonyms, relevance, and known contradictions. "
                "It is not a general natural-language-inference model; review nuanced answers."
            ),
        }
