import React from 'react';
import { CandidateSummary } from '../types/resume';
import { User, Briefcase, GraduationCap, Sparkles, Star } from 'lucide-react';

interface CandidateSummaryCardProps {
  summary: CandidateSummary;
  targetRole?: string;
}

export const CandidateSummaryCard: React.FC<CandidateSummaryCardProps> = ({
  summary,
  targetRole,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              {summary.fullName || 'Candidate Profile'}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-indigo-700">
                {summary.detectedRole || 'Detected Role'}
              </span>
              <span>•</span>
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[11px] font-medium">
                {summary.experienceLevel || 'Experience Detected'}
              </span>
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 text-[11px] font-bold">
          <Star className="w-3 h-3 fill-current" />
          Role Fit Snapshot
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
            <Briefcase className="w-3.5 h-3.5" />
            Target role
          </div>
          <p className="mt-2 text-sm font-bold text-slate-900">{targetRole || summary.detectedRole || 'Target Role'}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
            <GraduationCap className="w-3.5 h-3.5" />
            Education
          </div>
          <p className="mt-2 text-sm font-bold text-slate-900">{summary.education || 'Education not extracted'}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            Key highlight
          </div>
          <p className="mt-2 text-sm font-bold text-slate-900">{summary.keyHighlight || 'Strong skill signals identified'}</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
        <div className="text-[11px] font-bold uppercase tracking-wide text-indigo-700 mb-1">Candidate Overview</div>
        <p className="text-sm text-slate-700 leading-relaxed">{summary.overview || 'Profile overview is available.'}</p>
      </div>
    </div>
  );
};
