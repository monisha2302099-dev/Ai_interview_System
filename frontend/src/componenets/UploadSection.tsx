import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  File,
  X,
  Briefcase,
  AlignLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FolderOpen,
} from 'lucide-react';
import { SAMPLE_RESUMES, SampleResume } from './sampleResumes';

interface UploadSectionProps {
  onAnalyze: (payload: {
    fileName?: string;
    fileType?: string;
    fileBase64?: string;
    resumeText?: string;
    targetRole: string;
    jobDescription?: string;
  }) => void;
  isLoading: boolean;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onAnalyze,
  isLoading,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [resumeText, setResumeText] = useState<string>('');
  const [targetRole, setTargetRole] = useState<string>('Full Stack Software Engineer');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [inputMode, setInputMode] = useState<'upload' | 'text' | 'sample'>('upload');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const popularRoles = [
    'Software Engineer',
    'Frontend Developer',
    'Full Stack Developer',
    'Data Analyst',
    'Machine Learning Engineer',
    'DevOps Engineer',
  ];

  const handleFileChange = (file: File) => {
    setErrorMessage(null);
    const validExtensions = ['.pdf', '.docx', '.doc', '.txt'];
    const lowerName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => lowerName.endsWith(ext));

    if (!isValid) {
      setErrorMessage('Please upload a valid PDF (.pdf) or Word (.docx, .doc) file.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 20MB limit. Please upload a smaller file.');
      return;
    }

    setSelectedFile(file);

    // Read as base64 for server delivery
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFileBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileBase64('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLoadSample = (sample: SampleResume) => {
    setInputMode('sample');
    setResumeText(sample.resumeText);
    setTargetRole(sample.targetRole);
    setJobDescription(sample.jobDescription);
    setSelectedFile(null);
    setFileBase64('');
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!targetRole.trim()) {
      setErrorMessage('Please specify the Target Job Role you are targeting.');
      return;
    }

    if (inputMode === 'upload') {
      if (!selectedFile || !fileBase64) {
        setErrorMessage('Please upload your resume in PDF or DOCX format.');
        return;
      }
      onAnalyze({
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileBase64: fileBase64,
        targetRole: targetRole.trim(),
        jobDescription: jobDescription.trim(),
      });
    } else {
      // Text or Sample mode
      if (!resumeText.trim() || resumeText.trim().length < 30) {
        setErrorMessage('Please enter or paste your resume content (at least 30 characters).');
        return;
      }
      onAnalyze({
        resumeText: resumeText.trim(),
        targetRole: targetRole.trim(),
        jobDescription: jobDescription.trim(),
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
      {/* Title & Intro Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            Resume Scoring & ATS Optimization Engine
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
            AI Resume Checker
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Analyze your resume and improve your chances of getting shortlisted.
            Evaluate ATS compatibility, uncover missing skills, and receive actionable recruiter-grade feedback.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
        {/* Input Mode Selector */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-3">
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs sm:text-sm font-medium">
            <button
              type="button"
              onClick={() => setInputMode('upload')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                inputMode === 'upload'
                  ? 'bg-white text-indigo-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Upload PDF / DOCX
            </button>
            <button
              type="button"
              onClick={() => setInputMode('text')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                inputMode === 'text'
                  ? 'bg-white text-indigo-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paste Resume Text
            </button>
            <button
              type="button"
              onClick={() => {
                setInputMode('sample');
                if (!resumeText) {
                  handleLoadSample(SAMPLE_RESUMES[0]);
                }
              }}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                inputMode === 'sample'
                  ? 'bg-white text-indigo-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Demo Samples
            </button>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            Accepts <span className="font-semibold text-slate-700">PDF</span> and{' '}
            <span className="font-semibold text-slate-700">DOCX</span> files
          </div>
        </div>

        {/* Upload Mode UI */}
        {inputMode === 'upload' && (
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              Upload Resume <span className="text-rose-500">*</span>
            </label>

            {!selectedFile ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-200 ${
                  isDragOver
                    ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                    : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/70 bg-slate-50/30'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                  accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                  className="hidden"
                />
                <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3 shadow-xs">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-1">
                  Click to upload or drag & drop your resume
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-3">
                  PDF and DOCX formats supported. Up to 20MB file size.
                </p>
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 bg-indigo-50/80 px-3 py-1.5 rounded-lg border border-indigo-200/50">
                  <FolderOpen className="w-3.5 h-3.5" />
                  Browse Files
                </div>
              </div>
            ) : (
              <div className="bg-indigo-50/40 border border-indigo-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
                <div className="flex items-center space-x-3.5 overflow-hidden">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    {selectedFile.name.toLowerCase().endsWith('.pdf') ? (
                      <File className="w-6 h-6" />
                    ) : (
                      <FileText className="w-6 h-6" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {selectedFile.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span className="uppercase text-[11px] font-semibold tracking-wide text-indigo-600 bg-indigo-100/70 px-1.5 py-0.2 rounded">
                        {selectedFile.name.split('.').pop()}
                      </span>
                      <span>•</span>
                      <span className="text-emerald-600 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Ready
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-2"
                  title="Remove file"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Paste Text Mode UI */}
        {inputMode === 'text' && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-slate-800">
                Resume Text Content <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-slate-400">
                {resumeText.length} characters
              </span>
            </div>
            <textarea
              rows={8}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your complete resume text here (Summary, Education, Experience, Technical Skills, Projects)..."
              className="w-full text-sm rounded-xl border border-slate-300 p-3.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-mono text-slate-700 transition-all resize-y"
            />
          </div>
        )}

        {/* Demo Samples Mode UI */}
        {inputMode === 'sample' && (
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-800">
              Select a Demo Resume for Instant Evaluation:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SAMPLE_RESUMES.map((sample) => (
                <button
                  type="button"
                  key={sample.id}
                  onClick={() => handleLoadSample(sample)}
                  className={`p-3.5 rounded-xl border text-left transition-all relative ${
                    targetRole === sample.targetRole && resumeText === sample.resumeText
                      ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full mb-1.5">
                    {sample.badge}
                  </span>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    {sample.title}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                    Target: {sample.targetRole}
                  </div>
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
              💡 Pre-loaded resume content and target requirements ready for 1-click evaluation.
            </div>
          </div>
        )}

        {/* Target Job Role & Job Description Inputs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
          {/* Target Job Role */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-800">
              Target Job Role <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Briefcase className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g., Full Stack Software Engineer, Data Scientist"
                className="w-full text-sm rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-800 transition-all font-medium"
              />
            </div>
            {/* Quick role suggestions */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 font-medium py-0.5">Quick picks:</span>
              {popularRoles.map((role) => (
                <button
                  type="button"
                  key={role}
                  onClick={() => setTargetRole(role)}
                  className={`text-[11px] px-2 py-0.5 rounded-md border transition-colors ${
                    targetRole === role
                      ? 'bg-indigo-600 text-white border-indigo-600 font-medium'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Job Description (Optional) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-semibold text-slate-800">
                Job Description <span className="text-xs font-normal text-slate-500">(Optional)</span>
              </label>
              {jobDescription && (
                <button
                  type="button"
                  onClick={() => setJobDescription('')}
                  className="text-xs text-rose-500 hover:underline"
                >
                  Clear JD
                </button>
              )}
            </div>
            <div className="relative">
              <div className="absolute top-3 left-3 text-slate-400 pointer-events-none">
                <AlignLeft className="w-4 h-4" />
              </div>
              <textarea
                rows={3}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste specific job requirements or responsibilities to perform an exact keyword and skill match comparison..."
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-700 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Error notification banner */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs sm:text-sm text-rose-700 animate-fadeIn">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
            <div>{errorMessage}</div>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm sm:text-base text-white shadow-lg transition-all duration-200 flex items-center justify-center gap-2.5 ${
              isLoading
                ? 'bg-slate-400 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600 hover:from-indigo-700 hover:to-blue-700 active:scale-[0.99] shadow-indigo-500/25 cursor-pointer'
            }`}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Analyzing Resume with AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-indigo-200" />
                <span>Analyze Resume</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
