import unittest
import tempfile
from pathlib import Path

from docx import Document

from backend.resume.analyzer import analyze_resume
from backend.resume.parser import extract_resume, extract_resume_file


class ResumeParserTests(unittest.TestCase):
    def test_extracts_contact_sections_and_skills(self):
        resume = """Asha Kumar
asha@example.com | +91 98765 43210 | https://github.com/asha

EDUCATION
B.Tech Computer Science, State University, 2024

SKILLS
Python, Flask, MongoDB, OpenCV, SQL, React

PROJECTS
- Smart Attendance System using Python, Flask, MongoDB and OpenCV
- Portfolio website using React

EXPERIENCE
Software Intern at Acme, 2023

CERTIFICATIONS
AWS Cloud Practitioner
"""
        profile = extract_resume(resume)
        self.assertEqual(profile["contact"]["emails"], ["asha@example.com"])
        self.assertIn("+91 98765 43210", profile["contact"]["phones"])
        self.assertIn("python", profile["skills"])
        self.assertIn("flask", profile["skills"])
        self.assertEqual(len(profile["projects"]), 2)
        self.assertTrue(profile["education"])
        self.assertTrue(profile["experience"])
        self.assertIn("2024", profile["years"])

    def test_rejects_empty_resume(self):
        with self.assertRaises(ValueError):
            extract_resume(" ")

    def test_resume_analysis_uses_resume_evidence_and_job_requirements(self):
        resume = """Alex Chen
alex@example.com

SKILLS
Python, SQL, Git

EXPERIENCE
- Built a Python service that reduced processing time by 30%.

EDUCATION
B.S. Computer Science
"""
        result = analyze_resume(
            resume,
            target_role="Data Analyst",
            job_description="Python, SQL, Tableau, dashboard reporting",
        )
        self.assertEqual(result["skillsFound"], ["python", "sql"])
        self.assertIn("tableau", result["missingSkills"])
        self.assertEqual(result["candidateSummary"]["fullName"], "Alex Chen")
        self.assertTrue(result["strengths"])
        self.assertIn("profile", result)
        self.assertTrue(all(0 <= score <= 100 for score in result["scoreBreakdown"].values()))

    def test_analysis_does_not_claim_unseen_metrics(self):
        result = analyze_resume(
            "Taylor Reed\n\nSKILLS\nPython\n\nEDUCATION\nB.Sc. Computing",
            target_role="Software Engineer",
        )
        self.assertFalse(result["atsComplianceChecks"][3]["passed"])
        self.assertTrue(any("numeric" in issue["description"] for issue in result["weaknesses"]))

    def test_does_not_claim_role_fallback_skills_came_from_job_description(self):
        result = analyze_resume(
            "Taylor Reed\n\nSKILLS\nPython\n\nEDUCATION\nB.Sc. Computing",
            target_role="Software Engineer",
            job_description="Collaborate with product and engineering teams.",
        )
        self.assertTrue(result["missingKeywords"])
        self.assertTrue(all(
            item["whyItMatters"] == "This is a common skill for Software Engineer."
            for item in result["missingKeywords"]
        ))

    def test_specific_role_requirements_win_over_broader_role_names(self):
        result = analyze_resume(
            "Jordan Lee\n\nSKILLS\nReact, TypeScript, Node.js\n\nPROJECTS\n"
            "- Built a React app for a small team.",
            target_role="Full Stack Software Engineer",
        )
        self.assertIn("react", result["skillsFound"])
        self.assertIn("typescript", result["skillsFound"])
        self.assertNotIn("java", result["skillsFound"])

    def test_extracts_text_from_txt_file(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "resume.txt"
            path.write_text("Taylor Reed\n\nSKILLS\nPython and SQL\n", encoding="utf-8")
            parsed = extract_resume_file(path)
        self.assertIn("Python and SQL", parsed["text"])
        self.assertIn("python", parsed["profile"]["skills"])

    def test_extracts_docx_table_content(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "resume.docx"
            document = Document()
            cells = document.add_table(rows=1, cols=2).rows[0].cells
            cells[0].text = "SKILLS"
            cells[1].text = "Python, SQL"
            document.save(path)
            parsed = extract_resume_file(path)
        self.assertIn("python", parsed["profile"]["skills"])
        self.assertEqual(parsed["profile"]["sections_found"], ["skills"])


if __name__ == "__main__":
    unittest.main()
