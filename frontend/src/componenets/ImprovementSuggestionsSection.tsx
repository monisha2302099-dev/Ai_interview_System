import React from 'react';
import { ImprovementSuggestionItem } from '../types/resume';
import { Lightbulb, ArrowUpRight, Flame, Layers } from 'lucide-react';

interface ImprovementSuggestionsProps {
  suggestions: ImprovementSuggestionItem[];
}

export const ImprovementSuggestionsSection: React.FC<ImprovementSuggestionsProps> = ({
  suggestions,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Actionable Improvement Plan
            </h3>
            <p className="text-[11px] text-slate-400">
              Clear, practical changes to boost your interview callback rate
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
          {suggestions.length} Recommendations
        </span>
      </div>

      <div className="space-y-4">
        {suggestions.map((suggestion, idx) => (
          <div
            key={idx}
            className="p-4 sm:p-5 rounded-xl border border-slate-200/90 bg-gradient-to-br from-slate-50/70 to-white hover:border-indigo-200 hover:shadow-xs transition-all space-y-3"
          >
            {/* Header / Area / Priority */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-indigo-500" />
                  {suggestion.area}
                </span>
                <span className="text-xs font-bold text-slate-900">
                  Tip #{idx + 1}
                </span>
              </div>

              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 ${
                  suggestion.priority === 'High'
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : suggestion.priority === 'Medium'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {suggestion.priority === 'High' && <Flame className="w-3 h-3 text-rose-600" />}
                {suggestion.priority} Priority
              </span>
            </div>

            {/* Actionable Tip */}
            <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
              {suggestion.actionableTip}
            </p>

            {/* Example Before / After if present */}
            {suggestion.exampleBeforeAfter && (
              <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100/80 text-xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3 text-indigo-600" />
                  Practical Transformation Example:
                </span>
                <p className="text-slate-700 font-mono text-[11px] sm:text-xs whitespace-pre-line leading-relaxed">
                  {suggestion.exampleBeforeAfter}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
