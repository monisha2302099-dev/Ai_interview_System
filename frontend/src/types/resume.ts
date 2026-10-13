export interface CandidateSummary {
  fullName: string;
  detectedRole: string;
  experienceLevel: string;
  overview: string;
  keyHighlight: string;
  education?: string;
}

export interface StrengthItem {
  title: string;
  description: string;
  impact: 'High' | 'Medium' | 'Low';
}

export interface WeaknessItem {
  title: string;
  description: string;
  severity: 'High' | 'Medium' | 'Low';
}

export interface MissingKeywordItem {
  keyword: string;
  category: string;
  whyItMatters: string;
  placementSuggestion?: string;
}

export interface GrammarIssueItem {
  originalText: string;
  suggestedFix: string;
  issueType: string;
  explanation: string;
}

export interface ImprovementSuggestionItem {
  area: string;
  actionableTip: string;
  exampleBeforeAfter?: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface AtsCheckItem {
  checkName: string;
  passed: boolean;
  comment: string;
}

export interface ScoreBreakdown {
  formattingAndStructure: number;
  impactAndActionVerbs: number;
  keywordRelevance: number;
  experienceClarity: number;
}

export interface ResumeAnalysisResult {
  overallScore: number;
  atsScore: number;
  jobMatchScore: number;
  scoreBreakdown: ScoreBreakdown;
  candidateSummary: CandidateSummary;
  skillsFound: string[];
  missingSkills: string[];
  recommendedSkills: string[];
  strengths: StrengthItem[];
  weaknesses: WeaknessItem[];
  missingKeywords: MissingKeywordItem[];
  grammarIssues: GrammarIssueItem[];
  improvementSuggestions: ImprovementSuggestionItem[];
  atsComplianceChecks: AtsCheckItem[];
  extractedTextSample?: string;
  analyzedTargetRole?: string;
  hasJobDescription?: boolean;
}

export interface AnalyzeResumeRequest {
  file?: File;
  fileName?: string;
  fileType?: string;
  resumeText?: string;
  targetRole: string;
  jobDescription?: string;
}
