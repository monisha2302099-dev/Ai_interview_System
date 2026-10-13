import React, { useState } from 'react';
import { ResumeAnalysisResult } from '../types/resume';
import { ScoreGauges } from './ScoreGauges';
import { CandidateSummaryCard } from './CandidateSummaryCard';
import { SkillsSection } from './SkillsSection';
import { StrengthsWeaknessesSection } from './StrengthsWeaknessesSection';
import { MissingKeywordsSection } from './MissingKeywordsSection';
import { GrammarIssuesSection } from './GrammarIssuesSection';
import { ImprovementSuggestionsSection } from './ImprovementSuggestionsSection';
import { AtsChecklistSection } from './AtsChecklistSection';
import { ExtractedTextDrawer } from './ExtractedTextDrawer';
import {
  Printer,
  FileText,
  RotateCcw,
  Sparkles,
  Layers,
  Award,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';

interface AnalysisDashboardProps {
  data: ResumeAnalysisResult;
  onReset: () => void;
}

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({
  data,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState<
    'all' | 'scores' | 'skills' | 'strengths' | 'grammar' | 'suggestions'
  >('all');
  const [showDrawer, setShowDrawer] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* Top Banner & Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Analysis Report Generated
            </span>
            <span className="text-xs text-slate-400">
              {new Date().toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Evaluation for {data.candidateSummary.fullName || 'Candidate'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Targeting{' '}
            <span className="font-semibold text-slate-800">
              {data.analyzedTargetRole || 'Target Role'}
            </span>
            {data.hasJobDescription ? (
              <span className="text-emerald-600 font-medium ml-1.5">
                • Compared with provided Job Description
              </span>
            ) : (
              <span className="text-slate-400 ml-1.5">
                • Benchmarked against industry standards
              </span>
            )}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            These text-based estimates may miss context. Review each finding and only use suggestions that accurately describe you; they are not an ATS result or hiring prediction.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto no-print">
          {data.extractedTextSample && (
            <button
              onClick={() => setShowDrawer(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Parsed Text</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print / Export PDF</span>
          </button>

          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-xs transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Analyze Another</span>
          </button>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 border-b border-slate-200 text-xs sm:text-sm font-semibold no-print">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Overview & Complete Report
        </button>
        <button
          onClick={() => setActiveTab('scores')}
          className={`px-3 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'scores'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Scores & Checklist
        </button>
        <button
          onClick={() => setActiveTab('skills')}
          className={`px-3 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'skills'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Skills Spectrum ({data.skillsFound.length} / {data.missingSkills.length})
        </button>
        <button
          onClick={() => setActiveTab('strengths')}
          className={`px-3 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'strengths'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Strengths & Weaknesses
        </button>
        <button
          onClick={() => setActiveTab('grammar')}
          className={`px-3 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'grammar'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Grammar & Phrasing ({data.grammarIssues.length})
        </button>
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`px-3 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'suggestions'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Action Plan ({data.improvementSuggestions.length})
        </button>
      </div>

      {/* DASHBOARD SECTIONS */}

      {/* 1. Heuristic scores and checklist */}
      {(activeTab === 'all' || activeTab === 'scores') && (
        <section className="space-y-6">
          <ScoreGauges
            overallScore={data.overallScore}
            atsScore={data.atsScore}
            jobMatchScore={data.jobMatchScore}
            scoreBreakdown={data.scoreBreakdown}
            targetRole={data.analyzedTargetRole}
          />
          <AtsChecklistSection
            checks={data.atsComplianceChecks}
            atsScore={data.atsScore}
          />
        </section>
      )}

      {/* 2. Candidate Summary Card */}
      {(activeTab === 'all' || activeTab === 'scores') && (
        <section>
          <CandidateSummaryCard
            summary={data.candidateSummary}
            targetRole={data.analyzedTargetRole}
          />
        </section>
      )}

      {/* 3. Skills Found, Missing Skills & Recommended Skills */}
      {(activeTab === 'all' || activeTab === 'skills') && (
        <section className="space-y-6">
          <SkillsSection
            skillsFound={data.skillsFound}
            missingSkills={data.missingSkills}
            recommendedSkills={data.recommendedSkills}
            targetRole={data.analyzedTargetRole}
          />
          <MissingKeywordsSection
            missingKeywords={data.missingKeywords}
            targetRole={data.analyzedTargetRole}
          />
        </section>
      )}

      {/* 4. Strengths & Weaknesses */}
      {(activeTab === 'all' || activeTab === 'strengths') && (
        <section>
          <StrengthsWeaknessesSection
            strengths={data.strengths}
            weaknesses={data.weaknesses}
          />
        </section>
      )}

      {/* 5. Grammar Issues */}
      {(activeTab === 'all' || activeTab === 'grammar') && (
        <section>
          <GrammarIssuesSection grammarIssues={data.grammarIssues} />
        </section>
      )}

      {/* 6. Improvement Suggestions */}
      {(activeTab === 'all' || activeTab === 'suggestions') && (
        <section>
          <ImprovementSuggestionsSection
            suggestions={data.improvementSuggestions}
          />
        </section>
      )}

      {/* Extracted Text Drawer Modal */}
      {data.extractedTextSample && (
        <ExtractedTextDrawer
          isOpen={showDrawer}
          onClose={() => setShowDrawer(false)}
          extractedText={data.extractedTextSample}
        />
      )}
    </div>
  );
};
