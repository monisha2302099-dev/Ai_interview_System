import React from 'react';
import { ScoreBreakdown } from '../types/resume';
import { Award, CheckCheck, Target, TrendingUp, AlertCircle } from 'lucide-react';

interface ScoreGaugesProps {
  overallScore: number;
  atsScore: number;
  jobMatchScore: number;
  scoreBreakdown: ScoreBreakdown;
  targetRole?: string;
}

export const ScoreGauges: React.FC<ScoreGaugesProps> = ({
  overallScore,
  atsScore,
  jobMatchScore,
  scoreBreakdown,
  targetRole,
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) {
      return {
        text: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        stroke: '#10b981',
        badge: 'bg-emerald-100 text-emerald-800',
        label: 'Strong',
      };
    }
    if (score >= 60) {
      return {
        text: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        stroke: '#f59e0b',
        badge: 'bg-amber-100 text-amber-800',
        label: 'Moderate',
      };
    }
    return {
      text: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      stroke: '#f43f5e',
      badge: 'bg-rose-100 text-rose-800',
      label: 'Needs Work',
    };
  };

  const overallColors = getScoreColor(overallScore);
  const atsColors = getScoreColor(atsScore);
  const jobMatchColors = getScoreColor(jobMatchScore);

  // SVG Circular Gauge helper
  const CircularProgress = ({
    score,
    strokeColor,
  }: {
    score: number;
    strokeColor: string;
  }) => {
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg className="w-28 h-28 transform -rotate-90">
          <circle
            cx="56"
            cy="56"
            r={radius}
            className="text-slate-100"
            strokeWidth="9"
            stroke="currentColor"
            fill="transparent"
          />
          <circle
            cx="56"
            cy="56"
            r={radius}
            stroke={strokeColor}
            strokeWidth="9"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {score}
          </span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            / 100
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 3 Main Highlight Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Overall Resume Score */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Resume Checklist Score</h3>
                <p className="text-[11px] text-slate-400">Heuristic content checks</p>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${overallColors.badge}`}
            >
              {overallColors.label}
            </span>
          </div>

          <div className="flex items-center justify-center py-2">
            <CircularProgress score={overallScore} strokeColor={overallColors.stroke} />
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 text-center">
            {overallScore >= 80 ? (
              <span className="text-emerald-700 font-medium">
                Most of the measured checklist signals are present.
              </span>
            ) : overallScore >= 60 ? (
              <span className="text-amber-700 font-medium">
                Solid foundation, with clear opportunities for high-impact polish.
              </span>
            ) : (
              <span className="text-rose-700 font-medium">
                Requires structural, content, and metric improvements.
              </span>
            )}
          </div>
        </div>

        {/* Resume Text Checklist Score */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Structure & Evidence</h3>
                <p className="text-[11px] text-slate-400">Sections, skills, actions, and metrics</p>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${atsColors.badge}`}
            >
              {atsColors.label}
            </span>
          </div>

          <div className="flex items-center justify-center py-2">
            <CircularProgress score={atsScore} strokeColor={atsColors.stroke} />
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 text-center">
            {atsScore >= 80 ? (
              <span className="text-emerald-700 font-medium">
                The text-based structure and evidence checks are mostly present.
              </span>
            ) : atsScore >= 60 ? (
              <span className="text-amber-700 font-medium">
                Some structure or evidence signals can be improved.
              </span>
            ) : (
              <span className="text-rose-700 font-medium">
                Several expected sections or evidence signals were not detected.
              </span>
            )}
          </div>
        </div>

        {/* Job Match Score */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Job Match Score</h3>
                <p className="text-[11px] text-slate-400">
                  Alignment to: {targetRole || 'Target Role'}
                </p>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${jobMatchColors.badge}`}
            >
              {jobMatchColors.label}
            </span>
          </div>

          <div className="flex items-center justify-center py-2">
            <CircularProgress score={jobMatchScore} strokeColor={jobMatchColors.stroke} />
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 text-center">
            {jobMatchScore >= 80 ? (
              <span className="text-emerald-700 font-medium">
                Most tracked role terms appear in the resume text.
              </span>
            ) : jobMatchScore >= 60 ? (
              <span className="text-amber-700 font-medium">
                Some tracked role terms are missing from the resume text.
              </span>
            ) : (
              <span className="text-rose-700 font-medium">
                Few tracked role terms appear in the resume text.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Component Breakdown Progress Bars */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <h4 className="text-sm font-bold text-slate-900">
              Dimensional Score Breakdown
            </h4>
          </div>
          <span className="text-xs text-slate-400">Measured text signals</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Formatting & Structure */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold text-slate-700">
                Formatting & Layout
              </span>
              <span className="text-xs font-bold text-indigo-600">
                {scoreBreakdown.formattingAndStructure}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-700"
                style={{ width: `${scoreBreakdown.formattingAndStructure}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">
              Readability, structure & hierarchy
            </p>
          </div>

          {/* Impact & Action Verbs */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold text-slate-700">
                Impact & Action Verbs
              </span>
              <span className="text-xs font-bold text-blue-600">
                {scoreBreakdown.impactAndActionVerbs}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-700"
                style={{ width: `${scoreBreakdown.impactAndActionVerbs}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">
              Quantifiable metrics & strong verbs
            </p>
          </div>

          {/* Keyword Relevance */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold text-slate-700">
                Role Terms Found
              </span>
              <span className="text-xs font-bold text-emerald-600">
                {scoreBreakdown.keywordRelevance}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-700"
                style={{ width: `${scoreBreakdown.keywordRelevance}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">
              Required terms present in the resume text
            </p>
          </div>

          {/* Experience Clarity */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold text-slate-700">
                Experience Clarity
              </span>
              <span className="text-xs font-bold text-purple-600">
                {scoreBreakdown.experienceClarity}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-700"
                style={{ width: `${scoreBreakdown.experienceClarity}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">
              Count of detected experience and project entries
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
