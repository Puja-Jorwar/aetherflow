import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Bookmark, 
  Plus, 
  Trash2, 
  ArrowUpRight, 
  Folder, 
  Sparkles, 
  X,
  AlertCircle
} from 'lucide-react';

const PromptsPage = () => {
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [promptText, setPromptText] = useState('');
  const [category, setCategory] = useState('General');
  const [submitting, setSubmitting] = useState(false);
  
  // Filtering
  const [selectedCategory, setSelectedCategory] = useState('All');
  const categories = ['All', 'General', 'Marketing', 'Development', 'Productivity', 'Writing'];

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const res = await api.get('/prompts');
      setPrompts(res.data.data);
    } catch (err) {
      console.error('Failed to load prompts', err);
      setError('Could not load prompt library.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrompt = async (e) => {
    e.preventDefault();
    if (!title.trim() || !promptText.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await api.post('/prompts', { title, promptText, category });
      setPrompts(prev => [res.data.data, ...prev]);
      setIsModalOpen(false);
      // Reset form
      setTitle('');
      setPromptText('');
      setCategory('General');
    } catch (err) {
      console.error('Create prompt failed', err);
      setError(err.response?.data?.message || 'Could not save prompt.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePrompt = async (id) => {
    if (!window.confirm('Are you sure you want to delete this prompt template?')) return;
    try {
      await api.delete(`/prompts/${id}`);
      setPrompts(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      console.error('Delete failed', err);
      setError('Failed to delete prompt template.');
    }
  };

  const handleUsePrompt = (prompt) => {
    // Redirect to Chatbot page and pre-fill input
    navigate('/chatbot', { state: { prefillPrompt: prompt.promptText } });
  };

  const filteredPrompts = selectedCategory === 'All' 
    ? prompts 
    : prompts.filter(p => p.category === selectedCategory);

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Marketing': return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      case 'Development': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'Productivity': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Writing': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Prompt Library</h2>
          <p className="text-slate-400 text-sm mt-1">
            Store and inject optimized prompt templates into your chatbot to boost response context.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold transition shadow-lg hover:shadow-brand-600/20 self-start sm:self-auto"
        >
          <Plus className="h-4.5 w-4.5" />
          Add Template
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/50 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Category Pills Filters */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-900">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
              selectedCategory === cat
                ? 'bg-brand-600 border-brand-500 text-white'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Prompts Cards Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-brand-500"></div>
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl">
          <Bookmark className="h-10 w-10 text-slate-600 mx-auto mb-4" />
          <h4 className="font-bold text-white text-base">No templates found</h4>
          <p className="text-slate-500 text-xs mt-1">Start by adding a custom template or clear the active filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrompts.map((prompt) => (
            <div
              key={prompt._id}
              className="group relative border border-slate-900 bg-slate-900/40 rounded-2xl p-5 hover:border-slate-800 transition duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Category tag */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2.5 py-0.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${getCategoryColor(prompt.category)}`}>
                    {prompt.category}
                  </span>
                  
                  {prompt.isPreset && (
                    <span className="text-[9px] uppercase font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-900">
                      System Preset
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-white text-base mb-2 group-hover:text-brand-400 transition">
                  {prompt.title}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed mb-6 line-clamp-3">
                  {prompt.promptText}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-900/60 pt-4">
                <button
                  onClick={() => handleUsePrompt(prompt)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300 transition"
                >
                  Use Template <ArrowUpRight className="h-3.5 w-3.5" />
                </button>

                {!prompt.isPreset && (
                  <button
                    onClick={() => handleDeletePrompt(prompt._id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/20 transition"
                    title="Delete Prompt"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Custom Prompt Template Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 relative shadow-2xl glow-purple animate-scale-up">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Bookmark className="h-5 w-5 text-brand-400" />
              <h3 className="font-bold text-lg text-white">Create Prompt Template</h3>
            </div>

            <form onSubmit={handleCreatePrompt} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Template Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LinkedIn Post Generator"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 text-white"
                >
                  <option value="General">General</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Development">Development</option>
                  <option value="Productivity">Productivity</option>
                  <option value="Writing">Writing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Prompt Text
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write instructions for the AI model. Wrap variables in brackets like [Topic]."
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 text-white resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-50 transition"
                >
                  {submitting ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptsPage;
