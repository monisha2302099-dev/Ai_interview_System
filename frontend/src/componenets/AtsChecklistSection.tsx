import React from 'react';
import { AtsCheckItem } from '../types/resume';
import { ShieldCheck, CheckCircle2, XCircle, Cpu } from 'lucide-react';

interface AtsChecklistSectionProps {
  checks: AtsCheckItem[];
  atsScore: number;
}

export const AtsChecklistSection: React.FC<AtsChecklistSectionProps> = ({
  checks,
  atsScore,
}) => {
  const passedCount = checks.filter((c) => c.passed).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Resume Text Checklist
            </h3>
            <p className="text-[11px] text-slate-400">
              Simple checks against extracted text; not an ATS parser simulation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-700">Checks passed:</span>
          <span className="font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            {passedCount} / {checks.length} Rules
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {checks.map((item, idx) => (
          <div
            key={idx}
            className={`p-3.5 rounded-xl border transition-colors flex items-start gap-3 ${
              item.passed
                ? 'bg-emerald-50/30 border-emerald-100 hover:border-emerald-200'
                : 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
            }`}
          >
            {item.passed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  {item.checkName}
                </span>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                    item.passed
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {item.passed ? 'PASSED' : 'NEEDS FIX'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {item.comment}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-600 flex items-center gap-2">
        <Cpu className="w-4 h-4 text-indigo-500 flex-shrink-0" />
        <span>
          <strong>Scope:</strong> These checks inspect text and section headings only. They cannot test visual layout, ATS parsing behavior, or predict hiring outcomes.
        </span>
      </div>
    </div>
  );
};
