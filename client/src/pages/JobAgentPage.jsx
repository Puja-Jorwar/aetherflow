import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { 
  Briefcase, 
  Globe, 
  Send, 
  Terminal, 
  Settings, 
  ShieldAlert, 
  RefreshCw, 
  Play, 
  CheckCircle2, 
  Loader, 
  Layers,
  Check,
  AlertCircle
} from 'lucide-react';

const JobAgentPage = () => {
  const [inputs, setInputs] = useState({
    jobTitle: 'React Developer',
    location: 'Mumbai, India',
    platform: 'indeed',
    email: '',
    password: '',
    selectedResumeId: ''
  });

  const [resumes, setResumes] = useState([]);
  const [status, setStatus] = useState({
    status: 'idle',
    logs: [],
    appliedCount: 0,
    currentJob: '',
    platform: '',
    startTime: null
  });

  const [running, setRunning] = useState(false);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [error, setError] = useState('');
  
  const consoleEndRef = useRef(null);
  let pollInterval = useRef(null);

  const fetchResumes = async () => {
    setLoadingResumes(true);
    try {
      const res = await api.get('/pdf/documents');
      const docs = res.data.data || [];
      setResumes(docs);
      if (docs.length > 0) {
        setInputs(prev => ({ ...prev, selectedResumeId: docs[0]._id }));
      }
    } catch (err) {
      console.error('Failed to load resumes', err);
    } finally {
      setLoadingResumes(false);
    }
  };

  const checkAgentStatus = async () => {
    try {
      const res = await api.get('/job-agent/status');
      const data = res.data.data;
      setStatus(data);

      if (data.status !== 'running') {
        setRunning(false);
        if (pollInterval.current) {
          clearInterval(pollInterval.current);
        }
      }
    } catch (err) {
      console.error('Failed to get status', err);
    }
  };

  useEffect(() => {
    fetchResumes();
    // Initial status check
    checkAgentStatus();

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, []);

  // Auto scroll terminal logs
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [status.logs]);

  // Handle Input Changes
  const handleInputChange = (name, value) => {
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleStartAgent = async () => {
    setError('');
    setRunning(true);
    
    try {
      await api.post('/job-agent/run', {
        jobTitle: inputs.jobTitle,
        location: inputs.location,
        platform: inputs.platform,
        email: inputs.email
      });

      // Instantly start polling every 1.5 seconds
      pollInterval.current = setInterval(checkAgentStatus, 1500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to initialize browser agent process.');
      setRunning(false);
    }
  };

  return (
    <div className="space-y-8 animate-scale-up">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          AI Job Application Agent <Briefcase className="h-7 w-7 text-brand-400" />
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Automates resume parsing, job searches, and form submissions on Indeed and Naukri via browser simulation.
        </p>
      </div>

      {/* Info notice */}
      <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-300 flex gap-2.5 max-w-3xl leading-relaxed">
        <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
        <p>
          <strong>Portfolio Sandbox Mode:</strong> Because Indeed and Naukri block automated scraping attempts via Cloudflare, this agent runs in a **Simulated Puppeteer Mode** to showcase form-mapping and browser actions without security bans.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Configurations Panel */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">Agent Configuration</h3>
          
          <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-2xl space-y-4">
            
            {/* Platform Select */}
            <div className="space-y-2">
              <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                Target Platform
              </label>
              <select
                value={inputs.platform}
                onChange={(e) => handleInputChange('platform', e.target.value)}
                disabled={running}
                className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-3 text-xs text-slate-300 focus:outline-none focus:border-brand-500 transition"
              >
                <option value="indeed">Indeed.com (Global)</option>
                <option value="naukri">Naukri.com (India)</option>
              </select>
            </div>

            {/* Job Title */}
            <div className="space-y-2">
              <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                Target Job Query
              </label>
              <input
                type="text"
                value={inputs.jobTitle}
                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                disabled={running}
                className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-3 text-xs text-slate-300 focus:outline-none focus:border-brand-500 transition"
                placeholder="e.g. React Developer"
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                Location Focus
              </label>
              <input
                type="text"
                value={inputs.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                disabled={running}
                className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-3 text-xs text-slate-300 focus:outline-none focus:border-brand-500 transition"
                placeholder="e.g. Mumbai, India or Remote"
              />
            </div>

            {/* Select Resume */}
            <div className="space-y-2">
              <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold flex justify-between">
                <span>Select Resume Profile</span>
                {loadingResumes && <Loader className="h-3.5 w-3.5 animate-spin text-brand-400" />}
              </label>
              <select
                value={inputs.selectedResumeId}
                onChange={(e) => handleInputChange('selectedResumeId', e.target.value)}
                disabled={running || loadingResumes}
                className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-3 text-xs text-slate-300 focus:outline-none focus:border-brand-500 transition"
              >
                {resumes.length === 0 ? (
                  <option value="">No resumes found. Upload PDF first.</option>
                ) : (
                  resumes.map(r => (
                    <option key={r._id} value={r._id}>{r.filename}</option>
                  ))
                )}
              </select>
            </div>

            {/* Optional Credentials */}
            <div className="border-t border-slate-900/60 pt-4 space-y-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Settings className="h-3.5 w-3.5 text-brand-400" />
                <span>Account Credentials (Optional)</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="email"
                  value={inputs.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={running}
                  placeholder="Login Email"
                  className="bg-slate-950 border border-slate-900 rounded-lg p-2.5 text-[11px] text-slate-300 focus:outline-none focus:border-brand-500 transition"
                />
                <input
                  type="password"
                  value={inputs.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  disabled={running}
                  placeholder="Password"
                  className="bg-slate-950 border border-slate-900 rounded-lg p-2.5 text-[11px] text-slate-300 focus:outline-none focus:border-brand-500 transition"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-950/15 border border-red-900/40 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleStartAgent}
              disabled={running || resumes.length === 0}
              className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5 fill-current shrink-0" />
              <span>Launch Application Agent</span>
            </button>
          </div>
        </div>

        {/* Live Stepper Execution Pane */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Status Indicators Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            
            {/* Status Cell */}
            <div className="p-4 bg-slate-900/20 border border-slate-900 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Agent State</span>
              <span className={`text-sm font-bold mt-2 uppercase font-mono ${
                status.status === 'running' 
                  ? 'text-brand-400 animate-pulse' 
                  : status.status === 'completed' 
                    ? 'text-green-400' 
                    : 'text-slate-400'
              }`}>
                {status.status}
              </span>
            </div>

            {/* Applications Sent */}
            <div className="p-4 bg-slate-900/20 border border-slate-900 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Applied Sent</span>
              <span className="text-xl font-extrabold text-white mt-1">
                {status.appliedCount} <span className="text-xs font-normal text-slate-500">jobs</span>
              </span>
            </div>

            {/* Target platform */}
            <div className="p-4 bg-slate-900/20 border border-slate-900 rounded-2xl flex flex-col justify-between col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Target Node</span>
              <span className="text-xs font-bold text-slate-300 mt-2 uppercase font-mono">
                {status.platform ? `${status.platform}.com` : 'None'}
              </span>
            </div>
          </div>

          {/* Browser Logs Live console */}
          <div className="flex-1 bg-slate-900/20 border border-slate-900 rounded-2xl p-6 flex flex-col justify-between min-h-[350px]">
            
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="border-b border-slate-900 pb-3 flex items-center justify-between">
                <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-brand-400" /> Live Browser Agent logs
                </h3>
                {status.status === 'running' && (
                  <span className="text-[10px] text-brand-300 font-mono flex items-center gap-1.5">
                    <Loader className="h-3 w-3 animate-spin text-brand-400" /> Auto-scrolling
                  </span>
                )}
              </div>

              {/* Logs Console Container */}
              <div className="flex-1 p-4 bg-slate-950 border border-slate-900 rounded-xl font-mono text-[11px] text-emerald-400 space-y-2 h-64 overflow-y-auto shadow-inner">
                {status.logs.length === 0 ? (
                  <div className="text-slate-600 text-center py-20">
                    Console ready. Launch the browser agent to print logs.
                  </div>
                ) : (
                  status.logs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed">{log}</div>
                  ))
                )}
                <div ref={consoleEndRef} />
              </div>

              {/* Current activity panel */}
              {status.currentJob && (
                <div className="p-3.5 bg-brand-500/5 border border-brand-500/20 rounded-xl flex items-center gap-2.5 text-xs text-brand-300 animate-pulse">
                  <Loader className="h-4 w-4 animate-spin text-brand-400 shrink-0" />
                  <span>
                    <strong>Applying to:</strong> {status.currentJob}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobAgentPage;
