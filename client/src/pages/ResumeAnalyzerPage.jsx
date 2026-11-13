import React, { useState } from 'react';
import api from '../services/api';
import { 
  UserCheck, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

const ResumeAnalyzerPage = () => {
  const [resumeText, setResumeText] = useState('');
  const [file, setFile] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!resumeText.trim() && !file) {
      setError('Please paste your resume text or upload a PDF resume.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    if (file) {
      formData.append('resume', file);
    } else {
      formData.append('text', resumeText);
    }

    try {
      const res = await api.post('/resume/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data.data.analysis);
    } catch (err) {
      console.error('Analysis failed', err);
      setError(err.response?.data?.message || 'Failed to complete resume analysis.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400 border-green-500/20 bg-green-500/10';
    if (score >= 60) return 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10';
    return 'text-red-400 border-red-500/20 bg-red-500/10';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          Resume Analyzer <UserCheck className="h-7 w-7 text-brand-400" />
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Audit your resume against ATS scanner rules, extract skills, and retrieve actionable structural enhancements.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Upload Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-6">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">Resume Source</h3>

            <form onSubmit={handleAnalyze} className="space-y-4">
              {/* File Upload Block */}
              <div className="border border-dashed border-slate-800 rounded-xl p-6 text-center hover:border-slate-700 transition cursor-pointer relative bg-slate-950/20">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="h-8 w-8 text-brand-400 mx-auto mb-2" />
                <span className="block text-xs font-semibold text-white">
                  {file ? file.name : 'Upload Resume PDF'}
                </span>
                <span className="block text-[10px] text-slate-500 mt-1 uppercase font-mono">
                  {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Limit 5MB'}
                </span>
              </div>

              <div className="text-center text-slate-600 text-[10px] uppercase font-mono font-bold">OR PASTE TEXT</div>

              {/* Text Area */}
              <div>
                <textarea
                  rows={6}
                  disabled={!!file}
                  placeholder="Paste the raw text of your resume here to analyze instantly..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-brand-500 text-white placeholder-slate-600 resize-none disabled:opacity-30"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-950/20 border border-red-900/50 text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (!resumeText.trim() && !file)}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-lg hover:shadow-brand-600/20"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                    <span>Auditing Resume Metrics...</span>
                  </div>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4" />
                    <span>Run ATS Audit</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Audit Results Dashboard Column */}
        <div className="lg:col-span-7 bg-slate-900/20 border border-slate-900 rounded-2xl p-6 min-h-[400px] flex flex-col justify-center">
          {result ? (
            <div className="space-y-8 animate-scale-up">
              {/* ATS score overview */}
              <div className="flex items-center justify-between border-b border-slate-900/80 pb-6">
                <div>
                  <h3 className="font-bold text-lg text-white">ATS Scoring Dashboard</h3>
                  <p className="text-xs text-slate-500 mt-0.5 uppercase font-mono tracking-wider">
                    Scanner Status: <span className="font-bold text-slate-300">{result.atsStatus}</span>
                  </p>
                </div>

                {/* score circle */}
                <div className={`w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center font-bold ${getScoreColor(result.atsScore)}`}>
                  <span className="text-2xl font-black">{result.atsScore}</span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 -mt-1">ATS</span>
                </div>
              </div>

              {/* Skills identified/missing grids */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-green-400" /> Matches Found
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {result.skillsIdentified.length === 0 ? (
                      <span className="text-slate-500 text-xs italic">No matching keywords parsed.</span>
                    ) : (
                      result.skillsIdentified.map(s => (
                        <span key={s} className="px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold">
                          {s}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" /> Missing Key Keywords
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {result.skillsMissing.length === 0 ? (
                      <span className="text-slate-500 text-xs italic">Fully optimized list!</span>
                    ) : (
                      result.skillsMissing.map(s => (
                        <span key={s} className="px-2 py-1 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-semibold">
                          {s}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Recommendations list */}
              <div className="space-y-3 border-t border-slate-900/60 pt-6">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider font-mono">Structural Optimization Action Plan</h4>
                <ul className="space-y-2.5">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                      <ArrowRight className="h-3.5 w-3.5 text-brand-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-600 max-w-sm mx-auto space-y-3">
              <FileText className="h-10 w-10 text-slate-700 mx-auto" />
              <p className="text-xs">
                Upload your resume PDF or paste raw text on the left to review match ratings, formatting logs, and missing skill badges.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalyzerPage;
