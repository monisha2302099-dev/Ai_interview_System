import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';

export const AnalysisLoading: React.FC = () => {
  const steps = [
    'Parsing document layout, typography, and section headers...',
    'Extracting technical proficiencies, frameworks, and education...',
    'Evaluating ATS compatibility and machine-readability...',
    'Performing semantic gap match against target job role...',
    'Auditing phrasing, grammar precision, and action verbs...',
    'Generating recruiter-grade insights and action plan...',
  ];

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="bg-white rounded-2xl border border-indigo-100 p-8 sm:p-12 text-center shadow-lg shadow-indigo-50/50 mb-8 animate-fadeIn">
      <div className="max-w-md mx-auto">
        {/* Animated AI Pulse Icon */}
        <div className="relative mx-auto w-20 h-20 mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-indigo-500/20 animate-ping opacity-60"></div>
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/30">
            <Cpu className="w-8 h-8 animate-pulse" />
          </div>
        </div>

        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2">
          Analyzing Your Resume
        </h3>
        <p className="text-sm text-slate-500 mb-8">
          Our AI model is performing a multi-point evaluation across ATS standards, job alignment, and recruiter benchmarks.
        </p>

        {/* Step Progression List */}
        <div className="space-y-3 text-left bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200/80">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 text-xs sm:text-sm transition-all duration-300 ${
                  isCurrent
                    ? 'text-indigo-900 font-bold translate-x-1'
                    : isCompleted
                    ? 'text-slate-600'
                    : 'text-slate-400 opacity-60'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : isCurrent ? (
                  <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                    <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-ping" />
                  </div>
                ) : (
                  <div className="w-4 h-4 flex-shrink-0 rounded-full border border-slate-300" />
                )}
                <span>{step}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-indigo-500" />
          <span>Strict anti-hallucination verification active</span>
        </div>
      </div>
    </div>
  );
};
