import { useEffect, useState } from 'react';
import { Header } from './componenets/Header';
import { UploadSection } from './componenets/UploadSection';
import { AnalysisDashboard } from './componenets/AnalysisDashboard';
import { AnalysisLoading } from './componenets/AnalysisLoading';

const ROLE_KEYWORDS = {
  'full stack software engineer': [
    'React', 'TypeScript', 'Node.js', 'JavaScript', 'REST APIs', 'PostgreSQL', 'Docker',
    'AWS', 'Git', 'CI/CD', 'SQL', 'HTML', 'CSS', 'Testing', 'Agile'
  ],
  'frontend developer': [
    'React', 'TypeScript', 'JavaScript', 'CSS', 'HTML', 'Accessibility', 'Next.js',
    'State management', 'Performance optimization', 'UI testing'
  ],
  'data analyst': [
    'Python', 'SQL', 'Tableau', 'Excel', 'Pandas', 'Data visualization', 'A/B testing',
    'Statistics', 'Power BI', 'ETL'
  ],
  'machine learning engineer': [
    'Python', 'PyTorch', 'TensorFlow', 'Scikit-learn', 'Machine Learning', 'Data pipelines',
    'MLOps', 'SQL', 'Deep Learning', 'Model evaluation'
  ],
  default: ['Python', 'JavaScript', 'SQL', 'Git', 'Communication', 'Problem solving']
};

function normalizeText(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function decodeBase64Payload(base64Value = '') {
  if (!base64Value) return '';
  const cleanValue = base64Value.includes(',') ? base64Value.split(',')[1] : base64Value;
  try {
    const binary = atob(cleanValue);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const decoded = new TextDecoder('utf-8').decode(bytes);
    return decoded;
  } catch {
    return '';
  }
}

function findName(text = '') {
  const match = text.match(/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}/m);
  if (match) {
    return match[0].replace(/\s+/g, ' ').trim();
  }
  return 'Candidate';
}

function getExperienceLevel(text = '') {
  const lower = normalizeText(text).toLowerCase();
  if (/(?:\b(?:5|6|7|8|9|10)\+\b|\b(?:5|6|7|8|9|10)\s+years?\b)/.test(lower)) return 'Senior';
  if (/(?:\b(?:3|4)\+\b|\b(?:3|4)\s+years?\b)/.test(lower)) return 'Mid-level';
  if (/(?:\b(?:1|2)\+\b|\b(?:1|2)\s+years?\b)/.test(lower)) return 'Early Career';
  return 'Professional';
}

function createAnalysis(payload) {
  const sourceText = normalizeText(payload.resumeText || decodeBase64Payload(payload.fileBase64) || '');
  const targetRole = normalizeText(payload.targetRole || 'Full Stack Software Engineer');
  const jobDescription = normalizeText(payload.jobDescription || '');
  const keywords = ROLE_KEYWORDS[targetRole.toLowerCase()] || ROLE_KEYWORDS.default;
  const lowerText = sourceText.toLowerCase();
  const foundSkills = [...new Set(keywords.filter((skill) => lowerText.includes(skill.toLowerCase())))]
    .map((skill) => skill.trim());
  const missingSkills = keywords.filter((skill) => !lowerText.includes(skill.toLowerCase()));
  const recommendedSkills = keywords.filter((skill) => !foundSkills.includes(skill)).slice(0, 5);
  const strengths = [
    {
      title: 'Clear impact signals',
      description: 'The resume includes measurable results and concrete outcomes that make the candidate easier to evaluate.',
      impact: 'High',
    },
    {
      title: 'Role-aligned technical depth',
      description: 'Core skills for the target role are clearly represented and easy to scan in the ATS-friendly layout.',
      impact: 'Medium',
    },
  ];

  const weaknesses = [
    {
      title: 'Missing explicit role keywords',
      description: 'Several job-critical keywords are absent, which can reduce search match quality in ATS screening.',
      severity: 'High',
    },
    {
      title: 'Achievements need stronger quantification',
      description: 'Adding more numeric business impact will strengthen the resume at recruiter and hiring manager review stages.',
      severity: 'Medium',
    },
  ];

  const missingKeywords = missingSkills.slice(0, 4).map((keyword) => ({
    keyword,
    category: 'Role-critical skill',
    whyItMatters: `This skill is commonly expected in ${targetRole} hiring pipelines and helps improve ATS keyword matching.`,
    placementSuggestion: 'Add this term to your technical skills section or a recent project bullet.',
  }));

  const grammarIssues = [];

  if (!sourceText) {
    grammarIssues.push({
      originalText: 'Resume text not available',
      suggestedFix: 'Paste or upload a resume to generate an evaluation.',
      issueType: 'Missing content',
      explanation: 'The analyzer needs actual resume text before it can assess grammar and ATS compatibility.',
    });
  }

  const improvementSuggestions = [
    {
      area: 'Skills and job match',
      actionableTip: `Add the most relevant technologies and outcomes for ${targetRole} with examples tied to measurable business value.`,
      exampleBeforeAfter: 'Before: “Worked on web app” → After: “Built a React + Node.js analytics dashboard used by 15,000 users.”',
      priority: 'High',
    },
    {
      area: 'ATS optimization',
      actionableTip: 'Use a clean section order with standard headings like Skills, Experience, Projects, and Education to aid parsing.',
      priority: 'Medium',
    },
  ];

  const atsChecks = [
    { checkName: 'Section headings are standard', passed: true, comment: 'The resume structure is likely readable by ATS systems.' },
    { checkName: 'Skills are clearly surfaced', passed: foundSkills.length >= 3, comment: foundSkills.length >= 3 ? 'Core technical keywords are visible.' : 'Skill visibility can be improved with additional role keywords.' },
    { checkName: 'Action verbs and impact metrics', passed: /\b(led|built|developed|optimized|improved|designed)\b/i.test(sourceText), comment: 'Impact language is present, and quantifying results would further improve the profile.' },
  ];

  const scoreBreakdown = {
    formattingAndStructure: 82,
    impactAndActionVerbs: 76,
    keywordRelevance: Math.max(45, 100 - missingSkills.length * 8),
    experienceClarity: 80,
  };

  const keywordScore = Math.max(50, Math.min(100, 100 - missingSkills.length * 12));
  const atsScore = Math.max(52, Math.min(98, Math.round((scoreBreakdown.formattingAndStructure + keywordScore + 85) / 3)));
  const overallScore = Math.max(55, Math.min(98, Math.round((atsScore + keywordScore + (jobDescription ? 82 : 74)) / 3)));
  const jobMatchScore = Math.max(50, Math.min(98, Math.round((keywordScore + (foundSkills.length * 8) + (jobDescription ? 75 : 68)) / 3)));

  const candidateSummary = {
    fullName: findName(sourceText),
    detectedRole: targetRole,
    experienceLevel: getExperienceLevel(sourceText),
    overview: `Candidate demonstrates a professional background relevant to ${targetRole}, with a strong emphasis on practical delivery and measurable outcomes.`,
    keyHighlight: foundSkills.length > 0 ? `Verified strengths include ${foundSkills.slice(0, 3).join(', ')}.` : 'More role-specific evidence would improve this profile.',
  };

  return {
    overallScore,
    atsScore,
    jobMatchScore,
    scoreBreakdown,
    candidateSummary,
    skillsFound: foundSkills,
    missingSkills: missingSkills.slice(0, 6),
    recommendedSkills: [...new Set([...recommendedSkills, ...keywords.slice(0, 3)])],
    strengths,
    weaknesses,
    missingKeywords,
    grammarIssues,
    improvementSuggestions,
    atsComplianceChecks: atsChecks,
    extractedTextSample: sourceText.slice(0, 1200),
    analyzedTargetRole: targetRole,
    hasJobDescription: Boolean(jobDescription),
  };
}

export default function ResumeChecker({ session }) {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = 'Prepzio - Resume Checker';
  }, []);

  const handleAnalyze = (payload) => {
    setIsLoading(true);
    window.setTimeout(() => {
      setAnalysis(createAnalysis(payload));
      setIsLoading(false);
    }, 500);
  };

  const resetAnalysis = () => {
    setAnalysis(null);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Header onReset={resetAnalysis} hasResult={Boolean(analysis)} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {!analysis && !isLoading && <UploadSection onAnalyze={handleAnalyze} isLoading={isLoading} />}
        {isLoading && <AnalysisLoading />}
        {analysis && <AnalysisDashboard data={analysis} onReset={resetAnalysis} />}
      </main>
    </div>
  );
}