import React from 'react';
import { GrammarIssueItem } from '../types/resume';
import { SpellCheck, ArrowRight, Check, X, Sparkles } from 'lucide-react';

interface GrammarIssuesSectionProps {
  grammarIssues: GrammarIssueItem[];
}

export const GrammarIssuesSection: React.FC<GrammarIssuesSectionProps> = ({
  grammarIssues,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <SpellCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Phrasing Flags
            </h3>
            <p className="text-[11px] text-slate-400">
              Basic checks for vague phrasing; this is not a full grammar checker
            </p>
          </div>
        </div>
        <span
          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
            grammarIssues.length === 0
              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
              : 'text-blue-700 bg-blue-50 border-blue-200'
          }`}
        >
          {grammarIssues.length === 0 ? 'No Flags' : `${grammarIssues.length} Flags`}
        </span>
      </div>

      {grammarIssues.length === 0 ? (
        <div className="p-6 text-center bg-emerald-50/50 rounded-xl border border-emerald-100">
          <Check className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-emerald-900">No obvious vague phrasing detected</h4>
          <p className="text-xs text-emerald-700 mt-1">
            This lightweight check does not verify spelling or grammar. Proofread the resume before submitting it.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {grammarIssues.map((issue, index) => (
            <div
              key={index}
              className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/40 hover:bg-white hover:border-slate-300 transition-all space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                  {issue.issueType}
                </span>
                <span className="text-xs text-slate-400 font-medium">Issue #{index + 1}</span>
              </div>

              {/* Before and After Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
                {/* Original */}
                <div className="p-3 rounded-lg bg-rose-50/70 border border-rose-200 text-rose-950 font-mono text-xs">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-700 mb-1 font-sans">
                    <X className="w-3 h-3 text-rose-500" /> Original Text
                  </div>
                  <span className="line-through decoration-rose-400/80">
                    &ldquo;{issue.originalText}&rdquo;
                  </span>
                </div>

                {/* Suggested Fix */}
                <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-950 font-mono text-xs">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1 font-sans">
                    <Check className="w-3 h-3 text-emerald-600" /> Suggested Fix
                  </div>
                  <span className="font-semibold text-emerald-800">
                    &ldquo;{issue.suggestedFix}&rdquo;
                  </span>
                </div>
              </div>

              {/* Recruiter Rationale */}
              <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100 flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-800">Why this matters:</strong>{' '}
                  {issue.explanation}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
