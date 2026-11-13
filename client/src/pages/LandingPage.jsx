import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Zap, Shield, GitMerge, Terminal, ArrowRight, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden bg-grid-overlay">
      {/* Background Decorative Glow Blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Top Navbar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-600 rounded-lg shadow-[0_0_15px_rgba(124,58,237,0.4)] animate-flow-active">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Aether<span className="text-brand-500">Flow</span>
            </span>
          </div>

          <nav className="flex items-center gap-6">
            <Link to="/features" className="text-sm font-medium text-slate-400 hover:text-white transition">Features</Link>
            <Link to="/pricing" className="text-sm font-medium text-slate-400 hover:text-white transition">Pricing</Link>
            {user ? (
              <Link
                to="/dashboard"
                className="bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition shadow-lg hover:shadow-brand-500/25 flex items-center gap-1.5"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition">
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition shadow-lg hover:shadow-brand-500/25"
                >
                  Get Started
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 pt-20 pb-16 flex flex-col items-center text-center z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-brand-300 mb-8 hover:border-brand-500/30 transition duration-300">
          <Star className="h-3 w-3 fill-brand-300" />
          <span>Introducing Multi-Agent Pipeline Orchestration</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight max-w-4xl">
          Build & Automate with{' '}
          <span className="bg-gradient-to-r from-brand-400 via-fuchsia-400 to-blue-400 bg-clip-text text-transparent">
            Autonomous AI Workflows
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
          Design, run, and scale AI-native applications. Combine vector databases, custom logic prompts, and model routing into a visual pipeline.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <Link
            to={user ? "/dashboard" : "/register"}
            className="w-full sm:w-auto bg-gradient-to-r from-brand-600 to-fuchsia-600 hover:from-brand-500 hover:to-fuchsia-500 text-white font-semibold px-8 py-3.5 rounded-xl transition shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            Start Orchestrating
            <ArrowRight className="h-5 w-5" />
          </Link>
          <a
            href="#demo"
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-semibold px-8 py-3.5 rounded-xl transition"
          >
            Watch Demo
          </a>
        </div>

        {/* Live Scaffolding Workflow Animation Demo */}
        <section id="demo" className="w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-950/40 p-1.5 backdrop-blur-xl shadow-2xl glow-purple mb-24">
          <div className="bg-slate-900/90 rounded-[10px] overflow-hidden border border-slate-800/80">
            {/* Terminal Header */}
            <div className="bg-slate-950/90 px-4 py-3 flex items-center justify-between border-b border-slate-800/50">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/70"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/70"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/70"></div>
              </div>
              <span className="text-xs text-slate-500 font-mono">workflow_orchestrator.py</span>
              <Terminal className="h-4 w-4 text-slate-500" />
            </div>
            
            {/* Mock Flow Diagram representation */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center min-h-[220px]">
              <div className="p-5 rounded-xl bg-slate-950/80 border border-brand-500/30 flex flex-col items-center">
                <Bot className="h-8 w-8 text-brand-400 mb-2" />
                <span className="text-xs font-mono text-slate-400">INPUT SOURCE</span>
                <span className="text-sm font-semibold text-white mt-1">Trigger Event</span>
              </div>
              
              <div className="flex flex-col items-center gap-1.5 py-4">
                <span className="text-xs font-mono text-brand-400 animate-pulse">Running Agents...</span>
                <div className="h-0.5 w-full bg-gradient-to-r from-brand-500 to-blue-500 relative">
                  <div className="absolute top-[-3px] left-0 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_white] animate-ping" style={{ left: '50%' }}></div>
                </div>
                <GitMerge className="h-5 w-5 text-blue-400" />
              </div>

              <div className="p-5 rounded-xl bg-slate-950/80 border border-blue-500/30 flex flex-col items-center">
                <Shield className="h-8 w-8 text-blue-400 mb-2" />
                <span className="text-xs font-mono text-slate-400">OUTPUT DEST</span>
                <span className="text-sm font-semibold text-white mt-1">Webhook Dispatch</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Cards Grid */}
        <section className="w-full">
          <h2 className="text-3xl font-bold mb-12">Engineered for Full-Stack AI Pipelines</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:-translate-y-1 hover:border-brand-500/30 transition duration-300">
              <Bot className="h-10 w-10 text-brand-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Autonomous Agent Chains</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Connect specialized LLM models into self-correcting pipelines. Run routers, loop validators, and code-executors sequentially.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:-translate-y-1 hover:border-fuchsia-500/30 transition duration-300">
              <Zap className="h-10 w-10 text-fuchsia-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Vector Native Integration</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Connect vector storage in a single click. Retrieve relevant database contexts automatically via semantic middleware.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:-translate-y-1 hover:border-blue-500/30 transition duration-300">
              <Shield className="h-10 w-10 text-blue-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Production Security</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Run prompt sanitizers, trace execution costs, and restrict API keys with integrated secret scanning and JWT middleware.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-600">
        <p>&copy; {new Date().getFullYear()} AetherFlow Technologies Inc. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
