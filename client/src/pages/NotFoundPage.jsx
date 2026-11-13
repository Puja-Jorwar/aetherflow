import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 relative overflow-hidden bg-grid-overlay">
      <div className="absolute w-[30%] h-[30%] bg-brand-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="text-center z-10 max-w-md">
        <div className="inline-flex p-4 rounded-3xl bg-slate-900 border border-slate-800 text-brand-400 mb-6 glow-purple animate-bounce">
          <Compass className="h-12 w-12" />
        </div>

        <h1 className="text-8xl font-black tracking-tight text-white mb-2 font-mono">404</h1>
        <h2 className="text-2xl font-bold text-slate-200 mb-4">Pipeline Lost in Space</h2>
        
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          The node or workflow execution sequence you are looking for does not exist or has been deprecated. Let's redirect you back to base.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="bg-brand-600 hover:bg-brand-500 text-white font-medium px-6 py-2.5 rounded-xl transition shadow-lg hover:shadow-brand-500/25 flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4" />
            Return Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-medium px-6 py-2.5 rounded-xl transition flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
