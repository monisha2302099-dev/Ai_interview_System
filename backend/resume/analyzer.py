"""Evidence-based resume checks for role and job-description alignment."""

from __future__ import annotations

import re
from typing import Any

from backend.resume.parser import SKILL_TERMS, extract_resume

ROLE_SKILLS = {
    "full stack": ("react", "typescript", "javascript", "node.js", "sql", "postgresql", "docker", "aws", "git"),
    "frontend": ("react", "typescript", "javascript", "html", "css", "accessibility", "testing"),
    "backend": ("python", "java", "fastapi", "flask", "node.js", "sql", "postgresql", "mongodb", "docker", "aws"),
    "data scientist": ("python", "sql", "pandas", "machine learning", "tensorflow", "pytorch", "statistics"),
    "machine learning": ("python", "pytorch", "tensorflow", "machine learning", "deep learning", "docker", "aws"),
    "devops": ("linux", "docker", "aws", "git", "python", "testing"),
    "qa": ("testing", "python", "java", "javascript", "git", "sql"),
    "data analyst": ("python", "sql", "excel", "tableau", "pandas", "statistics"),
    "software engineer": ("python", "java", "c++", "javascript", "sql", "git", "testing", "docker", "aws"),
}
ACTION_VERBS = (
    "built", "created", "designed", "developed", "delivered", "deployed", "improved",
    "increased", "reduced", "led", "launched", "automated", "implemented", "optimized",
    "managed", "analyzed", "tested", "migrated", "achieved",
)
WEAK_PHRASES = ("responsible for", "worked on", "helped with", "assisted with", "duties included")
STOP_WORDS = {
    "about", "across", "all", "and", "are", "based", "be", "but", "for", "from",
    "have", "into", "its", "job", "our", "over", "role", "that", "the", "their",
    "this", "through", "using", "was", "were", "will", "with", "you",
}


def _contains_term(text: str, term: str) -> bool:
    return bool(
        re.search(
            rf"(?<![\w+#]){re.escape(term.casefold())}(?![\w+#])",
            text.casefold(),
        )
    )


def _requirements(target_role: str, job_description: str) -> tuple[list[str], bool]:
    if job_description.strip():
        mentioned_skills = [skill for skill in SKILL_TERMS if _contains_term(job_description, skill)]
        if mentioned_skills:
            return mentioned_skills, True

    role = target_role.casefold()
    for role_prefix, skills in ROLE_SKILLS.items():
        if role_prefix in role:
            return list(skills), False

    role_terms = [
        token for token in re.findall(r"[a-z][a-z+#.]{2,}", role)
        if token not in STOP_WORDS
    ]
    return (role_terms[:8] or list(ROLE_SKILLS["software engineer"])), False


def analyze_resume(
    text: str,
    *,
    target_role: str = "Software Engineer",
    job_description: str = "",
) -> dict[str, Any]:
    profile = extract_resume(text)
    normalized = " ".join(text.casefold().split())
    requirements, requirements_from_job_description = _requirements(target_role, job_description)
    matched = [term for term in requirements if _contains_term(normalized, term)]
    missing = [term for term in requirements if term not in matched]

    section_names = ("education", "skills", "projects", "experience", "certifications")
    sections_present = [name for name in section_names if profile[name]]
    structure_score = round(100 * len(sections_present) / len(section_names))

    evidence_lines = [
        line.strip(" •-*")
        for line in [*profile["experience"], *profile["projects"]]
        if len(line.split()) >= 5
    ]
    if not evidence_lines:
        evidence_lines = [
            line.strip(" •-*")
            for line in text.splitlines()
            if line.lstrip().startswith(("•", "-", "*")) and len(line.split()) >= 5
        ]
    action_lines = [
        line for line in evidence_lines
        if any(re.search(rf"\b{verb}\b", line, re.IGNORECASE) for verb in ACTION_VERBS)
    ]
    quantified_lines = [line for line in evidence_lines if re.search(r"\b\d+(?:[.,]\d+)?%?\b", line)]
    impact_score = round(
        100 * (0.6 * len(action_lines) / max(1, len(evidence_lines))
               + 0.4 * len(quantified_lines) / max(1, len(evidence_lines)))
    )
    keyword_score = round(100 * len(matched) / max(1, len(requirements)))
    clarity_score = min(100, 35 + min(len(profile["experience"]) + len(profile["projects"]), 5) * 13)
    ats_score = round((structure_score + keyword_score + impact_score) / 3)
    job_match_score = keyword_score
    overall_score = round((ats_score + job_match_score + clarity_score) / 3)

    strengths: list[dict[str, str]] = []
    if matched:
        strengths.append({
            "title": "Relevant skills found",
            "description": f"Your resume mentions {', '.join(matched[:5])}, which aligns with the target requirements.",
            "impact": "High" if len(matched) >= 3 else "Medium",
        })
    if quantified_lines:
        strengths.append({
            "title": "Measurable evidence",
            "description": f"Found {len(quantified_lines)} resume line(s) containing numeric results or scope.",
            "impact": "High",
        })
    if not strengths:
        strengths.append({
            "title": "Resume content extracted",
            "description": "The document contains readable text. Add role-specific skills and achievement evidence to strengthen it.",
            "impact": "Low",
        })

    weaknesses: list[dict[str, str]] = []
    if missing:
        weaknesses.append({
            "title": "Some target requirements are not mentioned",
            "description": f"Not found in the resume: {', '.join(missing[:6])}. Include them only where supported by your experience.",
            "severity": "High" if len(missing) > len(requirements) / 2 else "Medium",
        })
    if not quantified_lines:
        weaknesses.append({
            "title": "Few measurable outcomes",
            "description": "No numeric outcomes were detected in experience or project details. Add accurate measures of impact where available.",
            "severity": "Medium",
        })
    if not profile["experience"] and not profile["projects"]:
        weaknesses.append({
            "title": "Experience or project evidence is unclear",
            "description": "Use standard Experience and Projects headings and describe your contribution and outcome.",
            "severity": "High",
        })

    checks = [
        {
            "checkName": "Standard resume sections",
            "passed": structure_score >= 60,
            "comment": f"Detected {len(sections_present)} of {len(section_names)} common sections: {', '.join(sections_present) or 'none'}.",
        },
        {
            "checkName": "Target requirement coverage",
            "passed": keyword_score >= 60,
            "comment": f"Found {len(matched)} of {len(requirements)} tracked requirements in resume text.",
        },
        {
            "checkName": "Action-oriented evidence",
            "passed": bool(action_lines),
            "comment": f"Found action verbs in {len(action_lines)} of {len(evidence_lines)} evidence line(s).",
        },
        {
            "checkName": "Quantified achievements",
            "passed": bool(quantified_lines),
            "comment": f"Detected {len(quantified_lines)} line(s) with numeric evidence; verify every metric is accurate.",
        },
    ]

    grammar_issues = []
    for line in evidence_lines:
        if any(phrase in line.casefold() for phrase in WEAK_PHRASES):
            grammar_issues.append({
                "originalText": line[:240],
                "suggestedFix": "Rewrite with a specific action verb, your contribution, and an accurate result.",
                "issueType": "Vague phrasing",
                "explanation": "This phrasing describes responsibility or participation without showing what you accomplished.",
            })
            if len(grammar_issues) == 5:
                break

    missing_keywords = [
        {
            "keyword": term,
            "category": "Target requirement",
            "whyItMatters": "This skill appears in the supplied job description." if requirements_from_job_description
            else f"This is a common skill for {target_role}.",
            "placementSuggestion": "Add it to Skills or a relevant project/experience bullet only if it accurately reflects your background.",
        }
        for term in missing[:8]
    ]
    suggestions = []
    if missing:
        suggestions.append({
            "area": "Role alignment",
            "actionableTip": f"Address relevant gaps among: {', '.join(missing[:5])}. Keep claims accurate and support skills with examples.",
            "priority": "High",
        })
    if not quantified_lines:
        suggestions.append({
            "area": "Achievement impact",
            "actionableTip": "Where possible, add accurate scale, time saved, quality improvements, or other measurable outcomes to experience and project bullets.",
            "exampleBeforeAfter": "Before: “Improved the reporting process” → After: “Automated weekly reporting, reducing preparation time by [your verified amount].”",
            "priority": "High",
        })
    if structure_score < 100:
        suggestions.append({
            "area": "ATS readability",
            "actionableTip": "Use clear standard headings such as Skills, Experience, Projects, Education, and Certifications.",
            "priority": "Medium",
        })

    first_line = next((line.strip() for line in text.splitlines() if line.strip()), "Candidate")
    candidate_name = re.sub(r"\s*[|•].*$", "", first_line)[:100]
    if "years" in normalized and re.search(r"\b(?:5|6|7|8|9|10)\+?\s+years?\b", normalized):
        experience_level = "Senior"
    elif re.search(r"\b(?:3|4)\+?\s+years?\b", normalized):
        experience_level = "Mid-level"
    elif re.search(r"\b(?:1|2)\+?\s+years?\b", normalized):
        experience_level = "Early Career"
    else:
        experience_level = "Not determined"

    return {
        "overallScore": overall_score,
        "atsScore": ats_score,
        "jobMatchScore": job_match_score,
        "scoreBreakdown": {
            "formattingAndStructure": structure_score,
            "impactAndActionVerbs": impact_score,
            "keywordRelevance": keyword_score,
            "experienceClarity": clarity_score,
        },
        "candidateSummary": {
            "fullName": candidate_name,
            "detectedRole": target_role,
            "experienceLevel": experience_level,
            "overview": f"Extracted {len(profile['skills'])} recognized skills, {len(profile['experience'])} experience entries, and {len(profile['projects'])} projects. Scores are heuristic checks, not hiring predictions.",
            "keyHighlight": strengths[0]["description"],
            "education": "; ".join(profile["education"][:2]) or "Education not detected",
        },
        "skillsFound": matched,
        "missingSkills": missing,
        "recommendedSkills": missing[:5],
        "strengths": strengths,
        "weaknesses": weaknesses,
        "missingKeywords": missing_keywords,
        "grammarIssues": grammar_issues,
        "improvementSuggestions": suggestions,
        "atsComplianceChecks": checks,
        "extractedTextSample": text[:1200],
        "analyzedTargetRole": target_role,
        "hasJobDescription": bool(job_description.strip()),
        "profile": profile,
    }
