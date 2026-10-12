import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, Lightbulb, Search } from 'lucide-react';

interface SkillsSectionProps {
  skillsFound: string[];
  missingSkills: string[];
  recommendedSkills: string[];
  targetRole?: string;
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({
  skillsFound,
  missingSkills,
  recommendedSkills,
  targetRole,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filterList = (list: string[]) => {
    if (!searchTerm.trim()) return list;
    return list.filter((item) =>
      item.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );
  };

  const filteredFound = filterList(skillsFound);
  const filteredMissing = filterList(missingSkills);
  const filteredRecommended = filterList(recommendedSkills);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <span>Skills Spectrum & Gap Analysis</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Technical competencies extracted versus prerequisites for {targetRole || 'target role'}
          </p>
        </div>

        {/* Search filter for skills */}
        <div className="relative w-full sm:w-60">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter skills..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Skills Found */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Skills Found</h4>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {skillsFound.length} Detected
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Explicitly verified in candidate&apos;s experience or skills section.
          </p>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {filteredFound.length > 0 ? (
              filteredFound.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs hover:bg-emerald-100 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">No skills matched filter.</span>
            )}
          </div>
        </div>

        {/* 2. Missing Skills */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Missing Skills</h4>
            </div>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              {missingSkills.length} Gap{missingSkills.length === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Critical requirements for this role that are missing from the resume.
          </p>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {filteredMissing.length > 0 ? (
              filteredMissing.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200/80 shadow-2xs hover:bg-rose-100 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-emerald-600 font-medium">
                No major skill gaps detected for this role!
              </span>
            )}
          </div>
        </div>

        {/* 3. Recommended Skills */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Lightbulb className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Recommended Skills</h4>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              {recommendedSkills.length} Suggested
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Trending & adjacent technologies to elevate candidate competitiveness.
          </p>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {filteredRecommended.length > 0 ? (
              filteredRecommended.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200/80 shadow-2xs hover:bg-indigo-100 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">No recommendations found.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
