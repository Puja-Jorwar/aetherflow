import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { 
  Upload, 
  File, 
  Send, 
  Bot, 
  User, 
  FileText, 
  Sparkles, 
  AlertCircle, 
  Search,
  CheckCircle,
  FileUp,
  Tag
} from 'lucide-react';

const PdfChatPage = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [chatHistory, setChatHistory] = useState({}); // Stores array of messages per docId
  const [citations, setCitations] = useState([]);
  const [query, setQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [querying, setQuerying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, selectedDoc, querying]);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/pdf/documents');
      setDocuments(res.data.data);
      if (res.data.data.length > 0 && !selectedDoc) {
        setSelectedDoc(res.data.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch documents', err);
      setError('Could not load uploaded documents.');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Only PDF files are supported.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.post('/pdf/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess('PDF parsed, chunked, and vector-indexed successfully!');
      const newDoc = res.data.data;
      
      // Update list
      setDocuments(prev => [newDoc, ...prev]);
      setSelectedDoc(newDoc);
    } catch (err) {
      console.error('Upload failed', err);
      setError(err.response?.data?.message || 'File parsing and indexing failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || querying || !selectedDoc) return;

    const userQueryText = query;
    setQuery('');
    setQuerying(true);
    setError('');

    // Optimistically update chat history for this doc
    const userMsg = { role: 'user', content: userQueryText, id: Date.now().toString() };
    setChatHistory(prev => ({
      ...prev,
      [selectedDoc._id]: [...(prev[selectedDoc._id] || []), userMsg]
    }));

    try {
      const res = await api.post('/pdf/query', {
        documentId: selectedDoc._id,
        query: userQueryText
      });

      const { answer, citations: retrievedCitations } = res.data.data;

      // Update chat with assistant answer
      const assistantMsg = { role: 'assistant', content: answer, id: (Date.now() + 1).toString() };
      setChatHistory(prev => ({
        ...prev,
        [selectedDoc._id]: [...(prev[selectedDoc._id] || []), assistantMsg]
      }));

      // Update right citations view
      setCitations(retrievedCitations);
    } catch (err) {
      console.error('RAG query failed', err);
      setError(err.response?.data?.message || 'Failed to complete document search lookup.');
      // Remove optimistic message on failure
      setChatHistory(prev => ({
        ...prev,
        [selectedDoc._id]: (prev[selectedDoc._id] || []).filter(m => m.id !== userMsg.id)
      }));
    } finally {
      setQuerying(false);
    }
  };

  const activeMessages = selectedDoc ? chatHistory[selectedDoc._id] || [] : [];

  return (
    <div className="h-[calc(100vh-80px)] flex border border-slate-900 bg-slate-950/40 rounded-2xl overflow-hidden backdrop-blur-xl">
      {/* PDF Document List & Drag-Drop Sidebar */}
      <div className="w-80 border-r border-slate-900 bg-slate-950/85 flex flex-col h-full shrink-0 hidden md:flex">
        {/* Upload Button Section */}
        <div className="p-4 border-b border-slate-900/60">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition shadow-md hover:shadow-brand-600/20"
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Processing PDF Vector RAG...' : 'Upload PDF Document'}
          </button>
        </div>

        {/* Upload status indicator */}
        {(uploading || success || error) && (
          <div className="p-3 border-b border-slate-900/60 bg-slate-950/30">
            {uploading && (
              <div className="flex items-center gap-2 text-xs text-brand-400">
                <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-brand-500 shrink-0"></div>
                <span>Extracting paragraphs & generating vector chunks...</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 text-xs text-green-400">
                <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{success}</span>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-xs text-red-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{error}</span>
              </div>
            )}
          </div>
        )}

        {/* Document list container */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <h4 className="px-2 py-1.5 font-bold text-xs text-slate-500 uppercase tracking-wider font-mono">My Documents</h4>
          {documents.length > 0 && (
            <button
              onClick={() => setSelectedDoc({ _id: 'all', filename: 'All Documents (Global)', sizeBytes: 0 })}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-sm transition duration-200 mb-2 ${
                selectedDoc?._id === 'all'
                  ? 'bg-brand-600/10 border border-brand-500/20 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30 border border-transparent'
              }`}
            >
              <Sparkles className="h-4 w-4 shrink-0 text-brand-400" />
              <div className="overflow-hidden flex-1">
                <span className="truncate block font-semibold">Global Search (All PDFs)</span>
                <span className="text-[10px] text-slate-500 block uppercase font-mono">
                  RAG across {documents.length} files
                </span>
              </div>
            </button>
          )}
          {documents.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No documents uploaded.
            </div>
          ) : (
            documents.map((doc) => (
              <button
                key={doc._id}
                onClick={() => setSelectedDoc(doc)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-sm transition duration-200 ${
                  selectedDoc?._id === doc._id
                    ? 'bg-brand-600/10 border border-brand-500/20 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30 border border-transparent'
                }`}
              >
                <FileText className="h-4 w-4 shrink-0 text-brand-400" />
                <div className="overflow-hidden flex-1">
                  <span className="truncate block font-medium">{doc.filename}</span>
                  <span className="text-[10px] text-slate-500 block uppercase font-mono">
                    {(doc.sizeBytes / 1024).toFixed(1)} KB
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex bg-slate-950/20 relative min-w-0">
        {/* Chat Pane */}
        <div className="flex-1 flex flex-col h-full border-r border-slate-900/60 min-w-0">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-900/60 bg-slate-950/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-brand-500/10 rounded-xl text-brand-400">
                <File className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-white text-sm truncate">
                  {selectedDoc ? `Chat: ${selectedDoc.filename}` : 'Select PDF Document'}
                </h3>
                <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">
                  Retrieval-Augmented Generation (RAG)
                </span>
              </div>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="md:hidden p-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <FileUp className="h-4 w-4" />
              Upload
            </button>
          </div>

          {/* Messages viewport */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {!selectedDoc ? (
              <div className="h-full flex flex-col justify-center items-center text-center max-w-sm mx-auto">
                <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 text-brand-400 mb-6">
                  <FileText className="h-10 w-10 animate-pulse" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Initialize PDF Chat</h4>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Upload a PDF document first. AetherFlow will parse, chunk, and create vector embeddings to support semantic chat answers.
                </p>
              </div>
            ) : activeMessages.length === 0 && !querying ? (
              <div className="h-full flex flex-col justify-center items-center text-center max-w-md mx-auto">
                <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 text-brand-400 mb-6">
                  <Sparkles className="h-8 w-8 text-brand-400" />
                </div>
                <h5 className="font-bold text-white mb-2">Document Context Loaded</h5>
                <p className="text-slate-400 text-xs leading-relaxed mb-4">
                  Ask questions related to content inside this document. The AI will retrieve the most relevant paragraphs and answer using that context.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => setQuery('Summarize key points in this document')}
                    className="px-3 py-1.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-[11px] text-slate-300 hover:text-white rounded-lg transition"
                  >
                    📝 Summarize Document
                  </button>
                  <button
                    onClick={() => setQuery('What are the key deadlines or outcomes mentioned?')}
                    className="px-3 py-1.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-[11px] text-slate-300 hover:text-white rounded-lg transition"
                  >
                    ⏰ Check Deliverables/Deadlines
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {activeMessages.map((m) => {
                  const isUser = m.role === 'user';
                  return (
                    <div
                      key={m.id}
                      className={`flex items-start gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 text-xs font-bold ${
                          isUser
                            ? 'bg-brand-600/10 border-brand-500/30 text-brand-400'
                            : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}
                      >
                        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>

                      <div
                        className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap ${
                          isUser
                            ? 'bg-brand-600 text-white rounded-tr-none'
                            : 'bg-slate-900/80 border border-slate-800/80 text-slate-200 rounded-tl-none'
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  );
                })}

                {querying && (
                  <div className="flex items-start gap-4 flex-row">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-800 bg-slate-900 text-slate-300 shrink-0">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="rounded-2xl p-4 bg-slate-900/80 border border-slate-800/80 text-slate-200 rounded-tl-none max-w-[80%] flex gap-1 items-center">
                      <span className="h-2 w-2 rounded-full bg-brand-400 animate-bounce"></span>
                      <span className="h-2 w-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                      <span className="h-2 w-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* Form */}
          <div className="p-4 border-t border-slate-900/60 bg-slate-950/60 shrink-0">
            <form onSubmit={handleQuerySubmit} className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={!selectedDoc ? 'Upload a PDF to start...' : 'Ask question about this document...'}
                disabled={querying || !selectedDoc}
                className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl pl-4 pr-16 py-4 text-sm focus:outline-none focus:border-brand-500 text-white placeholder-slate-500 transition duration-300 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={querying || !query.trim() || !selectedDoc}
                className="absolute right-3 top-3 p-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-50 transition"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Citations Panel */}
        <div className="w-80 bg-slate-950/85 overflow-y-auto p-4 shrink-0 hidden lg:block">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-900/60">
            <Search className="h-4 w-4 text-brand-400" />
            <h4 className="font-bold text-xs uppercase tracking-wider font-mono text-white">Retrieved Citations</h4>
          </div>

          {citations.length === 0 ? (
            <div className="text-slate-500 text-xs py-10 text-center">
              Submit a query to view semantic vector matches.
            </div>
          ) : (
            <div className="space-y-4">
              {citations.map((c, i) => (
                <div 
                  key={i} 
                  className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/60 text-xs space-y-2 hover:border-slate-800 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20 text-brand-400 font-mono text-[9px]">
                      Chunk #{i + 1}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <Tag className="h-3 w-3 text-slate-600" /> Matches: {(c.relevanceScore || 0.85).toFixed(3)}
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed italic">
                    "{c.text.length > 200 ? c.text.substring(0, 197) + '...' : c.text}"
                  </p>
                  {c.filename && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 truncate border-t border-slate-900 pt-1.5">
                      <FileText className="h-3 w-3 text-brand-500/60" />
                      <span className="truncate">{c.filename}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfChatPage;
