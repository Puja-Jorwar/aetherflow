import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { 
  Plus, 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  AlertCircle, 
  CornerDownLeft,
  Mic,
  Volume2
} from 'lucide-react';

const ChatbotPage = () => {
  const location = useLocation();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onerror = (e) => {
        console.error('Speech Recognition Error:', e);
        setIsListening(false);
      };
      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? prev + ' ' + transcript : transcript));
      };
      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Voice dictation is not supported in this browser. Please try Chrome or Edge.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*_`#]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-Speech is not supported in this browser.');
    }
  };

  // Fetch all chats on load
  useEffect(() => {
    fetchChats();
  }, []);

  // Handle prompt library redirect prefill
  useEffect(() => {
    if (location.state?.prefillPrompt) {
      setInput(location.state.prefillPrompt);
      // Clean location state to avoid repeating prefill on reload
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const fetchChats = async (selectId = null) => {
    try {
      const res = await api.get('/chats');
      setChats(res.data.data);
      
      // If a chat was recently created/updated, activate it
      if (selectId) {
        const found = res.data.data.find(c => c._id === selectId);
        if (found) {
          handleSelectChat(found);
        }
      } else if (res.data.data.length > 0 && !activeChat) {
        handleSelectChat(res.data.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch chats', err);
      setError('Could not load chat sessions.');
    } finally {
      setLoadingChats(false);
    }
  };

  const handleSelectChat = async (chat) => {
    setActiveChat(chat);
    setMessages(chat.messages || []);
    setError('');
    
    // Fetch full messages history just in case
    try {
      const res = await api.get(`/chats/${chat._id}`);
      setMessages(res.data.data.messages);
    } catch (err) {
      console.error('Failed to load chat history', err);
    }
  };

  const handleNewChat = async () => {
    try {
      const res = await api.post('/chats', { title: 'New Conversation' });
      const newChat = res.data.data;
      setChats(prev => [newChat, ...prev]);
      setActiveChat(newChat);
      setMessages([]);
      setInput('');
    } catch (err) {
      console.error('Failed to create new chat', err);
      setError('Could not start a new conversation.');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMessageContent = input;
    setInput('');
    setSending(true);
    setError('');

    // If no active chat exists, create one first
    let currentChat = activeChat;
    if (!currentChat) {
      try {
        const createRes = await api.post('/chats', { title: 'New Conversation' });
        currentChat = createRes.data.data;
        setChats(prev => [currentChat, ...prev]);
        setActiveChat(currentChat);
      } catch (err) {
        console.error('Failed to auto-create chat', err);
        setError('Could not establish chat session.');
        setSending(false);
        return;
      }
    }

    // Optimistically update UI
    const tempUserMessage = {
      _id: Date.now().toString(),
      role: 'user',
      content: userMessageContent,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const res = await api.post(`/chats/${currentChat._id}/messages`, {
        content: userMessageContent
      });
      
      const { chat, reply } = res.data.data;
      
      // Update messages from response
      setMessages(chat.messages);
      
      // Refresh chat list to update titles/sorting
      fetchChats(chat._id);
    } catch (err) {
      console.error('Error sending message', err);
      setError(err.response?.data?.message || 'Failed to get AI response.');
      // Remove the optimistic message on failure
      setMessages(prev => prev.filter(m => m._id !== tempUserMessage._id));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] flex border border-slate-900 bg-slate-950/40 rounded-2xl overflow-hidden backdrop-blur-xl">
      {/* Chats List Sidebar */}
      <div className="w-80 border-r border-slate-900 bg-slate-950/80 flex flex-col h-full shrink-0 hidden md:flex">
        <div className="p-4 border-b border-slate-900/60 flex items-center justify-between">
          <h2 className="font-bold text-sm text-white uppercase tracking-wider font-mono">Chat History</h2>
          <button
            onClick={handleNewChat}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-brand-400 hover:text-white transition"
            title="New Chat"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {loadingChats ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-brand-500"></div>
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              No conversations yet.
            </div>
          ) : (
            chats.map((chat) => (
              <button
                key={chat._id}
                onClick={() => handleSelectChat(chat)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-sm transition duration-200 ${
                  activeChat?._id === chat._id
                    ? 'bg-brand-600/10 border border-brand-500/20 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30 border border-transparent'
                }`}
              >
                <MessageSquare className="h-4 w-4 shrink-0 text-brand-400" />
                <span className="truncate block flex-1 font-medium">{chat.title}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Conversation Box */}
      <div className="flex-1 flex flex-col h-full bg-slate-950/20 relative">
        {/* Active Chat Header */}
        <div className="px-6 py-4 border-b border-slate-900/60 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-500/10 rounded-xl text-brand-400">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                {activeChat ? activeChat.title : 'New AI Assistant Chat'}
              </h3>
              <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">
                Powered by GPT-4o-mini
              </span>
            </div>
          </div>

          <button
            onClick={handleNewChat}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </button>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/50 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {messages.length === 0 && !sending ? (
            <div className="h-full flex flex-col justify-center items-center text-center max-w-lg mx-auto">
              <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 text-brand-400 mb-6 glow-purple">
                <Sparkles className="h-10 w-10 animate-pulse" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Initialize Productive Session</h4>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Ask your assistant to draft communications, optimize software logic, summarize information, or design prompt templates.
              </p>

              {/* Starter Quick Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                <button
                  onClick={() => setInput('Draft a professional email for a software internship application')}
                  className="p-3 text-left rounded-xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition duration-200"
                >
                  ✉️ Draft Internship Email
                </button>
                <button
                  onClick={() => setInput('Generate a LinkedIn post about learning full-stack RAG pipelines')}
                  className="p-3 text-left rounded-xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition duration-200"
                >
                  🚀 Write engaging LinkedIn Post
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((m) => {
                const isUser = m.role === 'user';
                return (
                  <div
                    key={m._id || m.timestamp}
                    className={`flex items-start gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* User/AI avatar */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 text-xs font-bold ${
                        isUser
                          ? 'bg-brand-600/10 border-brand-500/30 text-brand-400'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>

                    {/* Bubble body */}
                    <div
                      className={`max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed shadow-lg whitespace-pre-wrap relative group ${
                        isUser
                          ? 'bg-brand-600 text-white rounded-tr-none'
                          : 'bg-slate-900/80 border border-slate-800/80 text-slate-200 rounded-tl-none'
                      }`}
                    >
                      {m.content}
                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => speakText(m.content)}
                          className="absolute bottom-2 right-2 p-1 rounded-md bg-slate-950/80 hover:bg-slate-950 border border-slate-850 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition duration-200"
                          title="Read Aloud"
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Streaming loading response */}
              {sending && (
                <div className="flex items-start gap-4 flex-row">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-800 bg-slate-900 text-slate-300 shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl p-4 bg-slate-900/80 border border-slate-800/80 text-slate-200 rounded-tl-none max-w-[75%] flex gap-1 items-center">
                    <span className="h-2 w-2 rounded-full bg-brand-400 animate-bounce"></span>
                    <span className="h-2 w-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="h-2 w-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Chat input box */}
        <div className="p-4 border-t border-slate-900/60 bg-slate-950/60 shrink-0">
          <form onSubmit={handleSendMessage} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={sending ? 'AetherFlow is thinking...' : 'Ask AI chatbot or paste prompt template...'}
              disabled={sending}
              className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl pl-4 pr-24 py-4 text-sm focus:outline-none focus:border-brand-500 text-white placeholder-slate-500 transition duration-300"
            />
            
            <div className="absolute right-3 top-3 flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2 rounded-xl transition ${
                  isListening
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                }`}
                title={isListening ? 'Stop Listening' : 'Start Voice Input'}
              >
                <Mic className="h-4 w-4" />
              </button>
              {/* Shortcut Tag */}
              <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono text-slate-500 px-1.5 py-1 bg-slate-950 border border-slate-800 rounded-md">
                <CornerDownLeft className="h-3 w-3" /> Enter
              </span>
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="p-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-50 transition shadow-md hover:shadow-brand-600/30"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;
