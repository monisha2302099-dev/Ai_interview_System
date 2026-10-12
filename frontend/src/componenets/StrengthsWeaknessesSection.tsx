import React from 'react';
import { StrengthItem, WeaknessItem } from '../types/resume';
import { ThumbsUp, AlertCircle, ShieldAlert, CheckCircle } from 'lucide-react';

interface StrengthsWeaknessesSectionProps {
  strengths: StrengthItem[];
  weaknesses: WeaknessItem[];
}

export const StrengthsWeaknessesSection: React.FC<StrengthsWeaknessesSectionProps> = ({
  strengths,
  weaknesses,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Strengths Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <ThumbsUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Key Strengths
                </h3>
                <p className="text-[11px] text-slate-400">Competitive advantages identified</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {strengths.length} Detected
            </span>
          </div>

          <div className="space-y-3.5">
            {strengths.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-100 hover:border-emerald-200 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    {item.title}
                  </h4>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      item.impact === 'High'
                        ? 'bg-emerald-200 text-emerald-900'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {item.impact} Impact
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed pl-5">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weaknesses Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Weaknesses & Vulnerabilities
                </h3>
                <p className="text-[11px] text-slate-400">Areas that could filter you out</p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              {weaknesses.length} Found
            </span>
          </div>

          <div className="space-y-3.5">
            {weaknesses.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-amber-50/40 border border-amber-100 hover:border-amber-200 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    {item.title}
                  </h4>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      item.severity === 'High'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : item.severity === 'Medium'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.severity} Severity
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed pl-5">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
