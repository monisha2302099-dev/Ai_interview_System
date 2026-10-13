
import re
from difflib import SequenceMatcher


def evaluate(reference_answer: str, student_answer: str) -> dict:
    """
    Compare a student's answer with a reference answer.
    Returns a similarity score and feedback.
    """

    if not student_answer or not student_answer.strip():
        return {
            "score": 0,
            "feedback": "No answer provided.",
            "matched": False,
        }

    if not reference_answer or not reference_answer.strip():
        return {
            "score": 0,
            "feedback": "Reference answer is missing.",
            "matched": False,
        }

    def normalize(text: str) -> str:
        text = text.lower()
        text = re.sub(r"[^a-z0-9\s]", " ", text)
        return " ".join(text.split())

    reference = normalize(reference_answer)
    student = normalize(student_answer)

    similarity = SequenceMatcher(
        None, reference, student
    ).ratio()

    score = round(similarity * 100)

    if score >= 80:
        feedback = "Good answer. It closely matches the reference."
    elif score >= 60:
        feedback = "Fair answer. Add more important concepts."
    elif score >= 35:
        feedback = "Your answer needs more explanation and key points."
    else:
        feedback = "Review the concept and try answering again."

    return {
        "score": score,
        "feedback": feedback,
        "matched": score >= 60,
    }
