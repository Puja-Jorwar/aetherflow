import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  GitMerge, 
  Play, 
  Loader, 
  CheckCircle2, 
  ArrowRight, 
  Copy, 
  Check, 
  Sparkles,
  Zap,
  Info,
  Terminal,
  Settings,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

const WorkflowsPage = () => {
  const workflows = [
    {
      id: 'slack-router',
      name: 'Slack Sentiment Notification Router',
      description: 'Analyze the sentiment of customer feedback using Llama 3, draft a support response, and post the report to a Slack channel.',
      steps: [
        { title: 'Parse Feedback Inputs', desc: 'Accept feedback text and Slack webhook destination' },
        { title: 'Execute Sentiment Analysis', desc: 'Classify tone and draft response with Llama-3.1' },
        { title: 'Post Webhook Payload', desc: 'Format Slack message block and push notification' }
      ]
    },
    {
      id: 'linkedin-publisher',
      name: 'AI LinkedIn Draft & Discord Publisher',
      description: 'Enter a topic and tone to draft a professional LinkedIn post, and forward the results to Discord.',
      steps: [
        { title: 'Initialize Content Parameters', desc: 'Accept article topic, tone, and Discord webhook' },
        { title: 'Draft Engaging Post Copy', desc: 'Generate copy with emojis & hashtags using Llama-3.1' },
        { title: 'Post Discord Webhook', desc: 'Format JSON payload and dispatch to target channel' }
      ]
    },
    {
      id: 'coaching-admission',
      name: 'Admission Inquiry Auto-responder',
      description: 'Automatically process new incoming student/parent messages asking about batch timings and course fees, then formulate Hinglish replies.',
      steps: [
        { title: 'Listen WhatsApp Event', desc: 'Parse keywords like "fees", "batches", "admission"' },
        { title: 'Llama AI Formulation', desc: 'Cross-reference course list & timings to compose Hinglish text' },
        { title: 'WhatsApp Auto-Reply', desc: 'Send customized message using WhatsApp Business APIs' }
      ]
    },
    {
      id: 'coaching-fee-alert',
      name: 'Automated Fee Overdue Follow-up',
      description: 'Scan fee schedule database for pending installments, generate payment links, and send follow-ups to parents.',
      steps: [
        { title: 'Audit Ledger Dues', desc: 'Identify overdue student fee payment records' },
        { title: 'Razorpay UPI Generation', desc: 'Generate a secure digital payment link/UPI string' },
        { title: 'Dispatch WhatsApp Reminder', desc: 'Send personalized text with payment link to parent' }
      ]
    },
    {
      id: 'coaching-absent-alert',
      name: 'Student Absent Notification Router',
      description: 'Trigger instant warnings to parents immediately when a teacher registers a student absent for a batch.',
      steps: [
        { title: 'Catch Attendance Mark', desc: 'Listen for absent logs in batch controller' },
        { title: 'Draft Alert Template', desc: 'Compile date, student name, and batch info' },
        { title: 'Notify Parent WhatsApp', desc: 'Post instant status update to parent phone' }
      ]
    },
    {
      id: 'coaching-test-report',
      name: 'AI Test Marks & Progress Reports',
      description: 'Automates student grade analysis and uses Llama-3.1 to draft Hinglish review messages and simulate dispatching report cards to parents.',
      steps: [
        { title: 'Analyze Performance', desc: 'Query exam scores, calculate percentiles & trends' },
        { title: 'AI Teacher Feedback', desc: 'Invoke Llama-3.1 to compose custom parent notes' },
        { title: 'Dispatch Report Cards', desc: 'Post simulated academic cards via WhatsApp' }
      ]
    },
    {
      id: 'coaching-lead-nurture',
      name: 'Google / Facebook Leads Auto-Nurturer',
      description: 'Simulate Facebook ads webhook arrivals, construct personalized welcome messages with course catalogs, and track lead nurture pathways.',
      steps: [
        { title: 'Intake Lead Webhook', desc: 'Simulate Facebook or Google Business API lead metadata' },
        { title: 'Formulate Brochure Links', desc: 'Draft welcoming Hinglish greeting + PDF attachment' },
        { title: 'WhatsApp Auto-Dispatch', desc: 'Send immediate auto-responder message to lead parent' }
      ]
    },
    {
      id: 'coaching-doubt-solving',
      name: '24/7 AI Tutor WhatsApp Doubt Solver',
      description: 'Deploy a virtual study coordinator bot that processes student homework questions and explains science/math formulas step-by-step.',
      steps: [
        { title: 'WhatsApp Query Ingestion', desc: 'Receive student academic question text' },
        { title: 'AI Doubt Resolution', desc: 'Execute Llama-3.1 reasoning for step-by-step tutoring' },
        { title: 'Deliver Explanation', desc: 'Return detailed formula explanation to student' }
      ]
    },
    {
      id: 'coaching-batch-reschedule',
      name: 'Teacher Emergency Rescheduling Alerts',
      description: 'Trigger immediate notifications to entire batch parent cohorts detailing lesson timing modifications with single-click coordinator broadcast actions.',
      steps: [
        { title: 'Audit Batch Enrollment', desc: 'Retrieve student phone directory for rescheduled class' },
        { title: 'Draft Alerts Payload', desc: 'Compile time changes, reason, and academy header' },
        { title: 'Broadcast Parent Cohort', desc: 'Simulate WhatsApp bulk messaging for timing alteration' }
      ]
    }
  ];

  const [selectedFlow, setSelectedFlow] = useState(workflows[0]);
  const [inputs, setInputs] = useState({
    textInput: 'The new dashboard layout is super clean and fast! However, I had a hard time finding the PDF RAG uploads section.',
    slackWebhookUrl: '',
    slackChannelId: '',
    slackDispatchMethod: 'channel',
    topic: 'Why developers should learn how to deploy local LLM retrieval networks',
    tone: 'Professional',
    discordWebhookUrl: '',
    inquiryText: 'Hi, what are the batch timings and fees for 10th science standard classes?',
    studentName: 'Rahul Sharma',
    amount: 1500,
    parentPhone: '+91 98765 43210',
    batchName: 'Class 10 - Science',
    // New coaching-related fields
    testName: 'Algebra Midterm 1',
    subject: 'Mathematics',
    marksObtained: 42,
    maxMarks: 50,
    leadName: 'Vikrant Singh',
    courseOfInterest: '12th Standard Physics',
    leadSource: 'Facebook Ads',
    doubtQuestion: 'Explain the difference between plant cells and animal cells.',
    newTimings: 'Tue-Thu-Sat 6:00 PM - 8:00 PM',
    rescheduleReason: 'heavy rain and waterlogging near institute',
    parentPhones: '+919876543210, +919123456789'
  });

  const [running, setRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [logs, setLogs] = useState([]);
  const [outputText, setOutputText] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [slackChannels, setSlackChannels] = useState([]);
  const [loadingChannels, setLoadingChannels] = useState(false);

  const handleInputChange = (name, value) => {
    setInputs(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const fetchSlackChannels = async () => {
    setLoadingChannels(true);
    try {
      const res = await api.get('/integrations/slack/channels');
      setSlackChannels(res.data.data || []);
      if (res.data.data && res.data.data.length > 0) {
        setInputs(prev => ({ ...prev, slackChannelId: res.data.data[0].id }));
      }
    } catch (err) {
      console.error('Failed to fetch Slack channels', err);
    } finally {
      setLoadingChannels(false);
    }
  };

  useEffect(() => {
    if (selectedFlow.id === 'slack-router' && slackChannels.length === 0) {
      fetchSlackChannels();
    }
  }, [selectedFlow]);

  const handleSelectFlow = (flow) => {
    setSelectedFlow(flow);
    // Clear previous runs
    setLogs([]);
    setOutputText('');
    setActiveStep(-1);
    setError('');
  };

  const handleRunWorkflow = async () => {
    setRunning(true);
    setActiveStep(0);
    setLogs(['⚙️ Spawning pipeline container...']);
    setOutputText('');
    setError('');

    try {
      const res = await api.post('/workflows/run', {
        workflowId: selectedFlow.id,
        inputs: {
          textInput: inputs.textInput,
          slackWebhookUrl: inputs.slackDispatchMethod === 'webhook' ? inputs.slackWebhookUrl : '',
          slackChannelId: inputs.slackDispatchMethod !== 'webhook' ? inputs.slackChannelId : '',
          topic: inputs.topic,
          tone: inputs.tone,
          discordWebhookUrl: inputs.discordWebhookUrl,
          // Coaching Classes parameters
          inquiryText: inputs.inquiryText,
          studentName: inputs.studentName,
          amount: inputs.amount,
          parentPhone: inputs.parentPhone,
          batchName: inputs.batchName,
          // New coaching parameters
          testName: inputs.testName,
          subject: inputs.subject,
          marksObtained: inputs.marksObtained,
          maxMarks: inputs.maxMarks,
          name: inputs.leadName,
          courseOfInterest: inputs.courseOfInterest,
          source: inputs.leadSource,
          question: inputs.doubtQuestion,
          newTimings: inputs.newTimings,
          reason: inputs.rescheduleReason,
          parentPhones: inputs.parentPhones
        }
      });

      const backendLogs = res.data.data.logs;
      const finalOutput = res.data.data.outputText;

      let currentStep = 0;
      const displayLogs = [];

      const interval = setInterval(() => {
        if (currentStep < backendLogs.length) {
          displayLogs.push(backendLogs[currentStep]);
          setLogs([...displayLogs]);
          setActiveStep(currentStep);
          currentStep++;
        } else {
          clearInterval(interval);
          setOutputText(finalOutput);
          setRunning(false);
        }
      }, 1000);

    } catch (err) {
      console.error('Workflow run failed', err);
      setError(err.response?.data?.message || 'Workflow pipeline execution failed.');
      setLogs(prev => [...prev, '❌ Container shut down with error.']);
      setRunning(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-scale-up">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          Workflow Automation <GitMerge className="h-7 w-7 text-brand-400" />
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Chains multiple LLM agents, parsing routines, and prompt filters into single-click sequence actions.
        </p>
      </div>

      {/* Info notice */}
      <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-300 flex gap-2.5 max-w-3xl leading-relaxed">
        <Info className="h-4.5 w-4.5 shrink-0 mt-0.5" />
        <p>
          <strong>Portfolio Highlight:</strong> Connecting generative outputs directly to external platforms (Slack / Discord) simulates realistic enterprise integrations. You can paste a real channel webhook URL to verify full end-to-end routing!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Workflows list */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">Available Pipelines</h3>
          
          <div className="space-y-3">
            {workflows.map((flow) => {
              const isSelected = selectedFlow.id === flow.id;
              return (
                <button
                  key={flow.id}
                  onClick={() => handleSelectFlow(flow)}
                  disabled={running}
                  className={`w-full p-5 text-left rounded-2xl border transition duration-300 space-y-3 block ${
                    isSelected 
                      ? 'bg-brand-600/10 border-brand-500/30' 
                      : 'bg-slate-900/40 border-slate-900 hover:border-slate-800'
                  }`}
                >
                  <div>
                    <h4 className={`font-bold text-base flex items-center gap-2 ${isSelected ? 'text-brand-400' : 'text-white'}`}>
                      <Zap className="h-4 w-4 shrink-0" /> {flow.name}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed mt-1">{flow.description}</p>
                  </div>

                  {/* Steps list */}
                  <div className="space-y-1 pl-4 border-l border-slate-800 text-[10px] text-slate-500">
                    {flow.steps.map((s, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-400">{idx + 1}. {s.title}</span>
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Console / Config Execution visualizer */}
        <div className="lg:col-span-8 bg-slate-900/20 border border-slate-900 rounded-2xl p-6 min-h-[500px] flex flex-col justify-between">
          
          {logs.length > 0 || outputText || error ? (
            /* EXECUTION STATUS AND LOGS PANE */
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-900/80 pb-3">
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-brand-400" /> Pipeline Console Logs
                  </h3>
                  <div className="flex items-center gap-2">
                    {running && <span className="h-2 w-2 rounded-full bg-brand-500 animate-ping"></span>}
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase ${
                      running 
                        ? 'bg-brand-500/10 border border-brand-500/20 text-brand-400' 
                        : error 
                          ? 'bg-red-500/10 border border-red-500/20 text-red-400' 
                          : 'bg-green-500/10 border border-green-500/20 text-green-400'
                    }`}>
                      {running ? 'Running' : error ? 'Failed' : 'Success'}
                    </span>
                  </div>
                </div>

                {/* Stepper display */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {selectedFlow.steps.map((step, idx) => {
                    const isCompleted = activeStep > idx;
                    const isActive = activeStep === idx;
                    return (
                      <div 
                        key={idx}
                        className={`p-3 rounded-xl border text-xs space-y-1 transition duration-300 ${
                          isActive 
                            ? 'bg-brand-500/5 border-brand-500/30' 
                            : isCompleted 
                              ? 'bg-slate-900/40 border-slate-900/60 opacity-60' 
                              : 'bg-transparent border-transparent opacity-30'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-white">
                          {isCompleted ? (
                            <span className="text-green-400">✓</span>
                          ) : isActive ? (
                            <Loader className="h-3 w-3 text-brand-400 animate-spin" />
                          ) : (
                            <span className="text-slate-600">○</span>
                          )}
                          <span>{step.title}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">{step.desc}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Console text log */}
                <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl font-mono text-[11px] text-emerald-400 space-y-1.5 h-44 overflow-y-auto shadow-inner">
                  {logs.map((log, i) => (
                    <div key={i} className="leading-relaxed">{log}</div>
                  ))}
                  {running && <div className="animate-pulse">_</div>}
                </div>

                {/* Final generated outputs */}
                {outputText && (
                  <div className="space-y-3 pt-4 border-t border-slate-900/80 animate-scale-up">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs uppercase tracking-wider font-mono text-white flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-brand-400" /> Compiled Post / Summary Content
                      </span>

                      <button
                        onClick={handleCopy}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs flex items-center gap-1"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy Output'}</span>
                      </button>
                    </div>

                    <pre className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                      {outputText}
                    </pre>
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-950/15 border border-red-900/40 rounded-xl text-red-400 text-xs flex items-center gap-2 animate-pulse">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {!running && (
                <button
                  onClick={() => { setLogs([]); setOutputText(''); setError(''); }}
                  className="mt-6 self-start text-xs text-slate-500 hover:text-brand-400 flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Back to Setup Form
                </button>
              )}
            </div>
          ) : (
            /* PIPELINE CONFIGURATION FORM SETUP */
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="border-b border-slate-900 pb-3 flex items-center gap-2">
                  <Settings className="h-4.5 w-4.5 text-brand-400" />
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">
                    Configure Pipeline Node Setup
                  </h3>
                </div>

                <div className="space-y-4">
                  {selectedFlow.id === 'slack-router' && (
                    <>
                      <div className="space-y-2">
                        <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                          Customer Feedback Input
                        </label>
                        <textarea
                          rows={4}
                          value={inputs.textInput}
                          onChange={(e) => handleInputChange('textInput', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 rounded-xl p-3.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500 placeholder-slate-600 transition"
                          placeholder="Type customer reviews or mock feedback text..."
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                          Slack Dispatch Method
                        </label>
                        <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-900">
                          <button
                            type="button"
                            onClick={() => handleInputChange('slackDispatchMethod', 'channel')}
                            className={`py-1.5 rounded-lg text-[10px] uppercase font-mono font-bold tracking-wider transition ${
                              inputs.slackDispatchMethod !== 'webhook' 
                                ? 'bg-brand-600 text-white shadow-sm' 
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Channels
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInputChange('slackDispatchMethod', 'webhook')}
                            className={`py-1.5 rounded-lg text-[10px] uppercase font-mono font-bold tracking-wider transition ${
                              inputs.slackDispatchMethod === 'webhook' 
                                ? 'bg-brand-600 text-white shadow-sm' 
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Webhook URL
                          </button>
                        </div>
                      </div>

                      {inputs.slackDispatchMethod !== 'webhook' ? (
                        <div className="space-y-2">
                          <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                            Select Slack Channel
                          </label>
                          {loadingChannels ? (
                            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-950 px-3.5 py-3 rounded-xl border border-slate-900">
                              <Loader className="h-3 w-3 animate-spin text-brand-400" />
                              <span>Querying Slack channels...</span>
                            </div>
                          ) : (
                            <select
                              value={inputs.slackChannelId}
                              onChange={(e) => handleInputChange('slackChannelId', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-3 text-xs text-slate-300 focus:outline-none focus:border-brand-500 transition"
                            >
                              {slackChannels.length === 0 ? (
                                <option value="">No channels loaded</option>
                              ) : (
                                slackChannels.map(ch => (
                                  <option key={ch.id} value={ch.id}>{ch.name}</option>
                                ))
                              )}
                            </select>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                            Slack Webhook URL
                          </label>
                          <input
                            type="text"
                            value={inputs.slackWebhookUrl}
                            onChange={(e) => handleInputChange('slackWebhookUrl', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-3 text-xs text-slate-300 focus:outline-none focus:border-brand-500 placeholder-slate-600 transition"
                            placeholder="https://hooks.slack.com/services/..."
                          />
                        </div>
                      )}
                    </>
                  )}

                  {selectedFlow.id === 'linkedin-publisher' && (
                    <>
                      <div className="space-y-2">
                        <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                          Article / Topic Pitch
                        </label>
                        <input
                          type="text"
                          value={inputs.topic}
                          onChange={(e) => handleInputChange('topic', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-3 text-xs text-slate-300 focus:outline-none focus:border-brand-500 placeholder-slate-600 transition"
                          placeholder="What topic should Llama write about..."
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                          Creative Pitch Tone
                        </label>
                        <select
                          value={inputs.tone}
                          onChange={(e) => handleInputChange('tone', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-3 text-xs text-slate-300 focus:outline-none focus:border-brand-500 transition"
                        >
                          <option value="Professional">Professional (Thought leadership)</option>
                          <option value="Casual">Casual (Friendly, story-driven)</option>
                          <option value="Tech-savvy">Tech-savvy (Highly technical summary)</option>
                          <option value="Inspiring">Inspiring (Motivating, startup-centric)</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                          Discord Webhook Destination (Optional)
                        </label>
                        <input
                          type="text"
                          value={inputs.discordWebhookUrl}
                          onChange={(e) => handleInputChange('discordWebhookUrl', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-3 text-xs text-slate-300 focus:outline-none focus:border-brand-500 placeholder-slate-600 transition"
                          placeholder="https://discord.com/api/webhooks/..."
                        />
                      </div>
                    </>
                  )}

                  {selectedFlow.id === 'coaching-admission' && (
                    <>
                      <div className="space-y-2">
                        <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                          Mock Incoming Customer Inquiry (WhatsApp Text)
                        </label>
                        <textarea
                          rows={4}
                          value={inputs.inquiryText}
                          onChange={(e) => handleInputChange('inquiryText', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 rounded-xl p-3.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500 placeholder-slate-600 transition"
                          placeholder="E.g. What standard batches do you offer and what is the fee structure?"
                        />
                      </div>
                    </>
                  )}

                  {selectedFlow.id === 'coaching-fee-alert' && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                            Student Name
                          </label>
                          <input
                            type="text"
                            value={inputs.studentName}
                            onChange={(e) => handleInputChange('studentName', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-3 text-xs text-slate-300 focus:outline-none focus:border-brand-500 transition"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                            Due Amount (₹)
                          </label>
                          <input
                            type="number"
                            value={inputs.amount}
                            onChange={(e) => handleInputChange('amount', Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-3 text-xs text-slate-300 focus:outline-none focus:border-brand-500 transition"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                          Parent Contact WhatsApp
                        </label>
                        <input
                          type="text"
                          value={inputs.parentPhone}
                          onChange={(e) => handleInputChange('parentPhone', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-3 text-xs text-slate-300 focus:outline-none focus:border-brand-500 transition"
                        />
                      </div>
                    </>
                  )}

                  {selectedFlow.id === 'coaching-absent-alert' && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                            Student Name
                          </label>
                          <input
                            type="text"
                            value={inputs.studentName}
                            onChange={(e) => handleInputChange('studentName', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-3 text-xs text-slate-300 focus:outline-none focus:border-brand-500 transition"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                            Batch / Course name
                          </label>
                          <input
                            type="text"
                            value={inputs.batchName}
                            onChange={(e) => handleInputChange('batchName', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-3 text-xs text-slate-300 focus:outline-none focus:border-brand-500 transition"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                          Parent Contact WhatsApp
                        </label>
                        <input
                          type="text"
                          value={inputs.parentPhone}
                          onChange={(e) => handleInputChange('parentPhone', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-3 text-xs text-slate-300 focus:outline-none focus:border-brand-500 transition"
                        />
                      </div>
                    </>
                  )}

                  {selectedFlow.id === 'coaching-test-report' && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                            Student Name
                          </label>
                          <input
                            type="text"
                            value={inputs.studentName}
                            onChange={(e) => handleInputChange('studentName', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-3 text-xs text-slate-300 focus:outline-none focus:border-brand-500 transition"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                            Test Name
                          </label>
                          <input
                            type="text"
                            value={inputs.testName}
                            onChange={(e) => handleInputChange('testName', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-3 text-xs text-slate-300 focus:outline-none focus:border-brand-500 transition"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                            Subject
                          </label>
                          <input
                            type="text"
                            value={inputs.subject}
                            onChange={(e) => handleInputChange('subject', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-3 text-xs text-slate-300 focus:outline-none focus:border-brand-500 transition"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                            Marks Obtained
                          </label>
                          <input
                            type="number"
                            value={inputs.marksObtained}
                            onChange={(e) => handleInputChange('marksObtained', Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-3 text-xs text-slate-300 focus:outline-none focus:border-brand-500 transition"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                            Max Marks
                          </label>
                          <input
                            type="number"
                            value={inputs.maxMarks}
                            onChange={(e) => handleInputChange('maxMarks', Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-3 text-xs text-slate-300 focus:outline-none focus:border-brand-500 transition"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                          Parent Contact WhatsApp
                        </label>
                        <input
                          type="text"
                          value={inputs.parentPhone}
                          onChange={(e) => handleInputChange('parentPhone', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-3 text-xs text-slate-300 focus:outline-none focus:border-brand-500 transition"
                        />
                      </div>
                    </>
                  )}

                  {selectedFlow.id === 'coaching-lead-nurture' && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                            Lead Parent / Student Name
                          </label>
                          <input
                            type="text"
                            value={inputs.leadName}
                            onChange={(e) => handleInputChange('leadName', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-3 text-xs text-slate-300 focus:outline-none focus:border-brand-500 transition"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                            Course of Interest
                          </label>
                          <input
                            type="text"
                            value={inputs.courseOfInterest}
                            onChange={(e) => handleInputChange('courseOfInterest', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-3 text-xs text-slate-300 focus:outline-none focus:border-brand-500 transition"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                            Lead Source Channel
                          </label>
                          <select
                            value={inputs.leadSource}
                            onChange={(e) => handleInputChange('leadSource', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-3 text-xs text-slate-300 focus:outline-none focus:border-brand-500 transition"
                          >
                            <option value="Facebook Ads">Facebook Ads</option>
                            <option value="Google Business">Google Business</option>
                            <option value="Website">Website Inquiry</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                            WhatsApp Contact
                          </label>
                          <input
                            type="text"
                            value={inputs.parentPhone}
                            onChange={(e) => handleInputChange('parentPhone', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-3 text-xs text-slate-300 focus:outline-none focus:border-brand-500 transition"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {selectedFlow.id === 'coaching-doubt-solving' && (
                    <>
                      <div className="space-y-2">
                        <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                          Student Name
                        </label>
                        <input
                          type="text"
                          value={inputs.studentName}
                          onChange={(e) => handleInputChange('studentName', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-3 text-xs text-slate-300 focus:outline-none focus:border-brand-500 transition"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                          Academic Question
                        </label>
                        <textarea
                          rows={4}
                          value={inputs.doubtQuestion}
                          onChange={(e) => handleInputChange('doubtQuestion', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 rounded-xl p-3.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500 placeholder-slate-600 transition"
                          placeholder="E.g. What is the difference between speed and velocity?"
                        />
                      </div>
                    </>
                  )}

                  {selectedFlow.id === 'coaching-batch-reschedule' && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                            Batch Name
                          </label>
                          <input
                            type="text"
                            value={inputs.batchName}
                            onChange={(e) => handleInputChange('batchName', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-3 text-xs text-slate-300 focus:outline-none focus:border-brand-500 transition"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                            Course / Subject Name
                          </label>
                          <input
                            type="text"
                            value={inputs.subject}
                            onChange={(e) => handleInputChange('subject', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-3 text-xs text-slate-300 focus:outline-none focus:border-brand-500 transition"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                            Old Timings
                          </label>
                          <input
                            type="text"
                            value="Mon-Wed-Fri 4PM - 6PM"
                            disabled
                            className="w-full bg-slate-950 border border-slate-900/60 opacity-60 rounded-xl px-3.5 py-3 text-xs text-slate-500 animate-pulse"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                            New Rescheduled Timings
                          </label>
                          <input
                            type="text"
                            value={inputs.newTimings}
                            onChange={(e) => handleInputChange('newTimings', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-3 text-xs text-slate-300 focus:outline-none focus:border-brand-500 transition"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                          Reason for Timing Modification
                        </label>
                        <input
                          type="text"
                          value={inputs.rescheduleReason}
                          onChange={(e) => handleInputChange('rescheduleReason', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-3 text-xs text-slate-300 focus:outline-none focus:border-brand-500 transition"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                          Parent Contact WhatsApp List (comma separated)
                        </label>
                        <input
                          type="text"
                          value={inputs.parentPhones}
                          onChange={(e) => handleInputChange('parentPhones', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-3 text-xs text-slate-300 focus:outline-none focus:border-brand-500 transition"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={handleRunWorkflow}
                className="w-full mt-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition hover:shadow-brand-600/20"
              >
                <Play className="h-3.5 w-3.5 fill-current shrink-0" />
                <span>Execute Live Pipeline</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowsPage;
