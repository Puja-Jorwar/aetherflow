import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Bookmark,
  Sparkles,
  UserCheck,
  GitMerge,
  Briefcase,
  Power,
  Menu,
  X,
  Zap,
  GraduationCap
} from 'lucide-react';

const SidebarLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Chatbot', path: '/chatbot', icon: MessageSquare },
    { name: 'PDF Chat (RAG)', path: '/pdf-chat', icon: FileText },
    { name: 'Prompt Library', path: '/prompts', icon: Bookmark },
    { name: 'Content Generator', path: '/content-generator', icon: Sparkles },
    { name: 'Resume Analyzer', path: '/resume-analyzer', icon: UserCheck },
    { name: 'AI Job Agent', path: '/job-agent', icon: Briefcase },
    { name: 'Class Manager', path: '/class-manager', icon: GraduationCap },
    { name: 'Workflows', path: '/workflows', icon: GitMerge },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex relative">
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950/80 backdrop-blur-xl border-r border-slate-900 p-6 flex flex-col justify-between transform transition-transform duration-300 lg:translate-x-0 lg:static ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo Branding */}
          <Link to="/" className="flex items-center gap-2 mb-8" onClick={() => setIsOpen(false)}>
            <div className="p-2 bg-brand-600 rounded-lg animate-flow-active">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Aether<span className="text-brand-500">Flow</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition duration-200 ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout footer */}
        <div className="border-t border-slate-900 pt-6 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-brand-600/20 border border-brand-500/30 flex items-center justify-center font-bold text-brand-400 text-sm">
              {(user?.name || user?.email || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <span className="block text-sm font-semibold text-white truncate">{user?.name || 'User'}</span>
              <span className="block text-xs text-slate-500 truncate">{user?.email}</span>
            </div>
          </div>
          
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/20 hover:border-red-900/30 border border-transparent transition duration-200"
          >
            <Power className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen relative lg:pl-0">
        {/* Dynamic content rendering frame */}
        <div className="flex-1 p-6 lg:p-10 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SidebarLayout;
