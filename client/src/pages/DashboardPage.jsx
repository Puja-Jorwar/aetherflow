import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Play, 
  ArrowRight, 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  MessageSquare,
  FileText,
  Bookmark,
  Sparkles,
  Zap,
  TrendingUp
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runningWorkflowId, setRunningWorkflowId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data.data);
    } catch (err) {
      console.error('Error fetching dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunWorkflow = (workflowId) => {
    setRunningWorkflowId(workflowId);
    setFeedbackMsg(null);
    
    // Simulate triggering a workflow run
    setTimeout(() => {
      setStats(prev => {
        if (!prev) return prev;
        const updatedWorkflows = prev.workflows.map(wf => {
          if (wf.id === workflowId) {
            return {
              ...wf,
              runs: wf.runs + 1,
              lastRun: 'Just now',
              status: 'active'
            };
          }
          return wf;
        });

        return {
          ...prev,
          workflows: updatedWorkflows,
          metrics: {
            ...prev.metrics,
            totalRuns: prev.metrics.totalRuns + 1
          }
        };
      });

      setRunningWorkflowId(null);
      setFeedbackMsg(`Successfully triggered workflow pipeline run`);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-brand-500"></div>
      </div>
    );
  }

  const usageData = [
    { day: 'Mon', runs: 12, latency: 980 },
    { day: 'Tue', runs: 19, latency: 1100 },
    { day: 'Wed', runs: 15, latency: 950 },
    { day: 'Thu', runs: 27, latency: 1240 },
    { day: 'Fri', runs: 32, latency: 1300 },
    { day: 'Sat', runs: 22, latency: 1050 },
    { day: 'Sun', runs: stats?.metrics?.totalRuns || 35, latency: 1200 },
  ];

  const moduleData = [
    { name: 'Chats', count: stats?.counts?.chats || 2 },
    { name: 'PDF Docs', count: stats?.counts?.documents || 1 },
    { name: 'Prompts', count: stats?.counts?.prompts || 4 },
  ];

  return (
    <div className="space-y-8 animate-scale-up">
      {/* Welcome Hero Panel */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-900/30 to-purple-950/20 border border-brand-500/20 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 text-brand-400">
          <Zap className="h-40 w-40" />
        </div>
        <div className="relative z-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Welcome to AetherFlow, {user?.name || 'Developer'}!</h2>
          <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
            Your unified workspace for conversational AI, document RAG, content generators, resume analyzers, and workflow orchestrators.
          </p>
        </div>
      </div>

      {/* Toast alert */}
      {feedbackMsg && (
        <div className="p-4 rounded-xl bg-brand-950/50 border border-brand-500/30 text-brand-300 text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="h-4.5 w-4.5 text-brand-400" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Module Overview Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Chats module */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-900 flex flex-col justify-between space-y-4 hover:border-slate-800 transition duration-300">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-brand-500/10 rounded-xl text-brand-400">
              <MessageSquare className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-white">{stats?.counts?.chats || 0} chats</span>
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">AI Conversationalist</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">Chat with GPT models with context history storage.</p>
          </div>
          <button 
            onClick={() => navigate('/chatbot')}
            className="flex items-center gap-1 text-xs font-semibold text-brand-400 hover:text-brand-300 transition mt-2 self-start"
          >
            Launch Chatbot <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Documents module */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-900 flex flex-col justify-between space-y-4 hover:border-slate-800 transition duration-300">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400">
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-white">{stats?.counts?.documents || 0} PDFs</span>
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">PDF Chat (RAG)</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">Query your PDF documents using semantic similarity vectors.</p>
          </div>
          <button 
            onClick={() => navigate('/pdf-chat')}
            className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition mt-2 self-start"
          >
            Launch PDF Chat <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Prompts library module */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-900 flex flex-col justify-between space-y-4 hover:border-slate-800 transition duration-300">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
              <Bookmark className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-white">{stats?.counts?.prompts || 0} Prompts</span>
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">Prompt Templates</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">Store customized engineering prompts to inject into chats.</p>
          </div>
          <button 
            onClick={() => navigate('/prompts')}
            className="flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300 transition mt-2 self-start"
          >
            Launch Library <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      {/* Analytics Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/20 border border-slate-900 flex items-center gap-4">
          <div className="p-3 bg-brand-500/10 rounded-xl text-brand-400">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Total Runs</span>
            <span className="text-lg font-bold text-white">{stats?.metrics?.totalRuns || 0}</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/20 border border-slate-900 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Success Rate</span>
            <span className="text-lg font-bold text-white">{stats?.metrics?.successRate || 0}%</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/20 border border-slate-900 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Avg Latency</span>
            <span className="text-lg font-bold text-white">{stats?.metrics?.averageExecutionTime || 0}</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/20 border border-slate-900 flex items-center gap-4">
          <div className="p-3 bg-fuchsia-500/10 rounded-xl text-fuchsia-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Quota Usage</span>
            <span className="text-lg font-bold text-white">{stats?.metrics?.apiUsagePercentage || 0}%</span>
          </div>
        </div>
      </section>

      {/* Charts Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-900 space-y-4">
          <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
            <TrendingUp className="h-4.5 w-4.5 text-brand-400" />
            Execution Volume & Latency Trend
          </h3>
          <div className="h-[250px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRuns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ paddingTop: 10 }} />
                <Area type="monotone" dataKey="runs" name="Runs" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorRuns)" strokeWidth={2} />
                <Area type="monotone" dataKey="latency" name="Latency (ms)" stroke="#06b6d4" fillOpacity={1} fill="url(#colorLatency)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-900 space-y-4">
          <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Activity className="h-4.5 w-4.5 text-cyan-400" />
            Active Library Distribution
          </h3>
          <div className="h-[250px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moduleData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                />
                <Bar dataKey="count" name="Items Count" fill="#a855f7" radius={[4, 4, 0, 0]}>
                  {
                    moduleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#8b5cf6' : index === 1 ? '#06b6d4' : '#e11d48'} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Active Pipelines Table */}
      <section className="bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-900 bg-slate-900/30 flex items-center justify-between">
          <h2 className="font-bold text-sm text-white uppercase tracking-wider font-mono">Active Workflow Pipelines</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-900 text-xs uppercase font-mono text-slate-500">
                <th className="px-6 py-3">Pipeline Name</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-center">Runs</th>
                <th className="px-6 py-3">Last Run</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-sm">
              {stats?.workflows?.map((wf) => (
                <tr key={wf.id} className="hover:bg-slate-900/10 transition-colors">
                  <td className="px-6 py-4 font-semibold text-white">{wf.name}</td>
                  <td className="px-6 py-4">
                    {wf.status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        Running
                      </span>
                    ) : wf.status === 'failed' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                        <AlertCircle className="h-3 w-3" />
                        Failed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/30">
                        Idle
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center font-mono">{wf.runs}</td>
                  <td className="px-6 py-4 text-slate-400 font-mono text-xs">{wf.lastRun}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleRunWorkflow(wf.id)}
                      disabled={runningWorkflowId === wf.id}
                      className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white transition flex items-center gap-1.5 text-xs font-medium inline-flex ml-auto"
                      title="Run workflow"
                    >
                      {runningWorkflowId === wf.id ? (
                        <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <Play className="h-3 w-3 fill-current" />
                      )}
                      <span>Run</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
