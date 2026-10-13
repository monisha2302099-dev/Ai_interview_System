
import json
from pathlib import Path

DATA_PATH = Path("backend/data/cs_interview_dataset.jsonl")

records = [
    {
        "id": "python_sets_easy",
        "subject": "Python",
        "topic": "Python sets",
        "skills": ["python", "data structures", "programming"],
        "job_roles": ["Software Developer", "Python Developer", "AI Engineer"],
        "difficulty": "easy",
        "question_type": "definition",
        "question": "What is a Python set? Give a simple explanation and an example.",
        "simple_answer": "A set stores unique values. Duplicate values are removed automatically.",
        "book_definition": "A Python set is an unordered collection of distinct, hashable objects that supports membership testing and set operations.",
        "example": "numbers = {1, 2, 2, 3} produces a set containing 1, 2, and 3.",
        "reference_answer": "A Python set is an unordered collection of unique elements. It automatically removes duplicates and supports fast average-case membership checks. For example, {1, 2, 2, 3} contains the unique values 1, 2, and 3.",
        "key_points": [
            "unique elements",
            "duplicates are removed",
            "unordered collection",
            "fast membership testing"
        ],
        "common_misconceptions": [
            {
                "trigger": "set preserves duplicates",
                "correction": "A set stores each distinct element only once."
            },
            {
                "trigger": "set supports indexing",
                "correction": "Python sets do not support positional indexing."
            }
        ]
    },
    {
        "id": "python_sets_intermediate",
        "subject": "Python",
        "topic": "Python sets",
        "skills": ["python", "data structures"],
        "job_roles": ["Software Developer", "Python Developer"],
        "difficulty": "intermediate",
        "question_type": "definition",
        "question": "Define Python sets, explain how they work, and give a practical example.",
        "simple_answer": "Sets store unique hashable elements and are useful for removing duplicates and testing membership.",
        "book_definition": "A Python set is a mutable set collection of distinct hashable elements that supports union, intersection, difference, and membership testing.",
        "example": "Use set([1, 2, 2, 3]) to remove duplicate values.",
        "reference_answer": "A Python set is a collection of unique hashable elements. It automatically removes duplicates and supports union, intersection, difference, and average-case constant-time membership testing. For example, set([1, 2, 2, 3]) produces {1, 2, 3}. Sets do not support indexing.",
        "key_points": [
            "unique elements",
            "hashable elements",
            "duplicates are removed",
            "set operations",
            "fast membership testing"
        ],
        "common_misconceptions": []
    },
    {
        "id": "python_sets_advanced",
        "subject": "Python",
        "topic": "Python sets",
        "skills": ["python", "data structures", "algorithms"],
        "job_roles": ["Software Developer", "Python Developer", "AI Engineer"],
        "difficulty": "advanced",
        "question_type": "definition",
        "question": "Explain Python sets, their design, limitations, and practical uses.",
        "simple_answer": "Sets use hashing to store distinct hashable elements and efficiently perform membership checks and set operations.",
        "book_definition": "A Python set is a mutable collection of distinct hashable elements implemented using a hash-table-based structure.",
        "example": "Use set_a & set_b to find common elements between two sets.",
        "reference_answer": "Python sets store distinct hashable elements using a hash-table-based implementation. They support union, intersection, difference, and efficient average-case membership checks. Their limitations include no positional indexing, no guaranteed positional order, and the requirement that elements be hashable. They are useful for deduplication and comparing collections.",
        "key_points": [
            "unique elements",
            "hashable elements",
            "hash-table-based implementation",
            "set operations",
            "fast membership testing",
            "no positional indexing"
        ],
        "common_misconceptions": []
    }
]


def main():
    existing = []

    with DATA_PATH.open("r", encoding="utf-8") as file:
        for line in file:
            if line.strip():
                existing.append(json.loads(line))

    existing_ids = {record.get("id") for record in existing}

    added = 0
    for record in records:
        if record["id"] not in existing_ids:
            existing.append(record)
            existing_ids.add(record["id"])
            added += 1

    with DATA_PATH.open("w", encoding="utf-8") as file:
        for record in existing:
            file.write(json.dumps(record, ensure_ascii=False) + "\n")

    print(f"Added {added} Python Set records.")
    print("Dataset now contains:")
    for record in existing:
        if record.get("topic") == "Python sets":
            print(f"- {record['id']} ({record['difficulty']})")


if __name__ == "__main__":
    main()
