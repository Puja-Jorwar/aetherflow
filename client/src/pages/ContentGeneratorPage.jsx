import React, { useState } from 'react';
import api from '../services/api';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Bookmark, 
  RefreshCw,
  Send,
  AlertCircle,
  FileText
} from 'lucide-react';

const ContentGeneratorPage = () => {
  const [contentType, setContentType] = useState('LinkedIn');
  const [tone, setTone] = useState('Professional');
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [savedPrompt, setSavedPrompt] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError('');
    setResult('');
    setCopied(false);
    setSavedPrompt(false);

    try {
      const res = await api.post('/content/generate', {
        contentType,
        tone,
        topic,
        keywords
      });
      setResult(res.data.data.content);
    } catch (err) {
      console.error('Generation failed', err);
      setError(err.response?.data?.message || 'Failed to generate content.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToPrompts = async () => {
    if (!result) return;
    try {
      await api.post('/prompts', {
        title: `Auto Gen: ${contentType} - ${topic.substring(0, 15)}...`,
        promptText: result,
        category: contentType === 'LinkedIn' || contentType === 'Tweet' ? 'Marketing' : 'Writing'
      });
      setSavedPrompt(true);
    } catch (err) {
      console.error('Failed to save to prompts library', err);
      setError('Could not export to Prompt Library.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          Content Generator <Sparkles className="h-6 w-6 text-brand-400 animate-pulse" />
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Instantly craft copy for LinkedIn updates, email responses, tweets, or blog articles.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Form Frame */}
        <div className="lg:col-span-5 bg-slate-900/40 border border-slate-900 rounded-2xl p-6 h-fit space-y-6">
          <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">Parameters</h3>
          
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Output Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['LinkedIn', 'Tweet', 'Email', 'Blog'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setContentType(type)}
                    className={`py-3 px-4 rounded-xl text-xs font-semibold border transition ${
                      contentType === type
                        ? 'bg-brand-600 border-brand-500 text-white shadow-lg shadow-brand-600/15'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Tone of Voice
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 text-white"
              >
                <option value="Professional">💼 Professional</option>
                <option value="Casual">☕ Casual</option>
                <option value="Creative">🎨 Creative</option>
                <option value="Informative">📊 Informative</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Keywords (comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. startup, machine learning, hiring"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 text-white placeholder-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Core Topic / Prompt Details
              </label>
              <textarea
                rows={4}
                required
                placeholder="Describe what you want to write about..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 text-white resize-none"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/20 border border-red-900/50 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-lg hover:shadow-brand-600/20"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating Copy...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Generate AI Content
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output Panel Frame */}
        <div className="lg:col-span-7 bg-slate-900/20 border border-slate-900 rounded-2xl p-6 min-h-[450px] flex flex-col justify-between">
          <div className="space-y-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-900/80 pb-3">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">Generated Output</h3>
              
              {result && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyToClipboard}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition flex items-center gap-1.5 text-xs border border-slate-800"
                    title="Copy Content"
                  >
                    {copied ? <Check className="h-4.5 w-4.5 text-green-400" /> : <Copy className="h-4.5 w-4.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={handleSaveToPrompts}
                    disabled={savedPrompt}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-50 transition flex items-center gap-1.5 text-xs border border-slate-800"
                    title="Export Template"
                  >
                    <Bookmark className="h-4.5 w-4.5" />
                    <span>{savedPrompt ? 'Saved' : 'Save as Template'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Content area */}
            <div className="flex-1 flex flex-col justify-center min-h-[300px]">
              {result ? (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex-1 text-slate-300 text-sm whitespace-pre-wrap leading-relaxed overflow-y-auto">
                  {result}
                </div>
              ) : (
                <div className="text-center py-20 text-slate-600 max-w-sm mx-auto space-y-3">
                  <FileText className="h-10 w-10 text-slate-700 mx-auto" />
                  <p className="text-xs">
                    Choose your parameters on the left and click generate. Your custom content output will display here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentGeneratorPage;
