import React from 'react';
import { MissingKeywordItem } from '../types/resume';
import { KeyRound, Tag, MapPin, Info } from 'lucide-react';

interface MissingKeywordsSectionProps {
  missingKeywords: MissingKeywordItem[];
  targetRole?: string;
}

export const MissingKeywordsSection: React.FC<MissingKeywordsSectionProps> = ({
  missingKeywords,
  targetRole,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Missing Target Terms
            </h3>
            <p className="text-[11px] text-slate-400">
              High-frequency recruitment terms absent from your resume
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
          {missingKeywords.length} Keywords To Add
        </span>
      </div>

      <p className="text-xs text-slate-600">
        These role-related terms were not found in the extracted resume text. Add them only when they accurately describe your skills or experience for{' '}
        <span className="font-semibold text-slate-900">{targetRole || 'target positions'}</span>.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
        {missingKeywords.map((item, index) => (
          <div
            key={index}
            className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-purple-200 hover:shadow-xs transition-all space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-purple-900 font-mono bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200/60">
                {item.keyword}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Tag className="w-2.5 h-2.5" />
                {item.category}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>{item.whyItMatters}</span>
            </p>

            {item.placementSuggestion && (
              <div className="text-[11px] text-indigo-700 bg-indigo-50/70 p-2 rounded-lg flex items-center gap-1.5 font-medium">
                <MapPin className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                <span>Suggested placement: {item.placementSuggestion}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
