import { useEffect, useState } from 'react';
import { Header } from './componenets/Header';
import { UploadSection } from './componenets/UploadSection';
import { AnalysisDashboard } from './componenets/AnalysisDashboard';
import { AnalysisLoading } from './componenets/AnalysisLoading';

const API_URL = import.meta.env.VITE_API_URL || '/api';

async function analyzeResume(payload) {
  const formData = new FormData();
  if (payload.file) {
    formData.append('file', payload.file);
  } else {
    formData.append('resume_text', payload.resumeText || '');
  }
  formData.append('target_role', payload.targetRole);
  formData.append('job_description', payload.jobDescription || '');

  let response;
  try {
    response = await fetch(`${API_URL}/resume/analyze`, {
      method: 'POST',
      body: formData,
    });
  } catch {
    throw new Error('Cannot reach the analysis service. Start FastAPI on port 8000 and try again.');
  }

  const responseText = await response.text();
  let result;
  try {
    result = responseText ? JSON.parse(responseText) : null;
  } catch {
    throw new Error(`The analysis service returned an invalid response (HTTP ${response.status}).`);
  }
  if (!response.ok) {
    const detail = result?.detail;
    throw new Error(typeof detail === 'string' ? detail : `Resume analysis failed (HTTP ${response.status}).`);
  }
  if (!result?.analysis || !Array.isArray(result.analysis.skillsFound)) {
    throw new Error('The analysis service returned an incomplete report. Restart FastAPI and try again.');
  }
  return result.analysis;
}

export default function ResumeChecker() {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = 'Prepzio - Resume Checker';
  }, []);

  const handleAnalyze = async (payload) => {
    setIsLoading(true);
    try {
      const report = await analyzeResume(payload);
      setAnalysis(report);
    } finally {
      setIsLoading(false);
    }
  };

  const resetAnalysis = () => {
    setAnalysis(null);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Header onReset={resetAnalysis} hasResult={Boolean(analysis)} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {!analysis && !isLoading && <UploadSection onAnalyze={handleAnalyze} isLoading={isLoading} />}
        {isLoading && <AnalysisLoading />}
        {analysis && <AnalysisDashboard data={analysis} onReset={resetAnalysis} />}
      </main>
    </div>
  );
}
