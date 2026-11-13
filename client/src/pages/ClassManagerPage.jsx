import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  GraduationCap,
  Plus,
  Users,
  Calendar,
  DollarSign,
  Send,
  Loader,
  AlertCircle,
  CheckCircle2,
  Clock,
  UserPlus,
  BookOpen,
  Phone,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  CalendarRange,
  Award,
  FileText,
  HelpCircle,
  MessageSquare,
  TrendingUp,
  Sparkles
} from 'lucide-react';

const ClassManagerPage = () => {
  const [activeTab, setActiveTab] = useState('batches'); // 'batches', 'students', 'fees', 'exams', 'leads', 'doubts'
  
  // Data lists
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [fees, setFees] = useState([]);
  const [exams, setExams] = useState([]);
  const [leads, setLeads] = useState([]);
  const [doubts, setDoubts] = useState([]);
  
  // States
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // stores ID/type of operation
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form inputs
  const [studentForm, setStudentForm] = useState({
    studentName: '',
    parentName: '',
    parentPhone: '',
    email: '',
    admissionNumber: '',
    status: 'Active'
  });

  const [batchForm, setBatchForm] = useState({
    name: '',
    courseName: '',
    timings: ''
  });

  const [feeForm, setFeeForm] = useState({
    studentId: '',
    amount: '',
    dueDate: '',
    status: 'Unpaid'
  });

  const [enrollForm, setEnrollForm] = useState({
    batchId: '',
    studentId: ''
  });

  const [absentForm, setAbsentForm] = useState({
    batchId: '',
    studentId: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [examForm, setExamForm] = useState({
    batchId: '',
    testName: '',
    subject: '',
    maxMarks: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [studentScoresInput, setStudentScoresInput] = useState({}); // studentId -> marks

  const [leadForm, setLeadForm] = useState({
    name: '',
    parentPhone: '',
    email: '',
    courseOfInterest: '',
    source: 'Website',
    status: 'New',
    notes: ''
  });

  const [doubtForm, setDoubtForm] = useState({
    studentName: '',
    question: ''
  });

  const [rescheduleBatchId, setRescheduleBatchId] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    newTimings: '',
    reason: ''
  });

  // UI state modalless toggles
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [showAddFee, setShowAddFee] = useState(false);
  const [showEnroll, setShowEnroll] = useState(false);
  const [showAbsent, setShowAbsent] = useState(false);
  const [showAddExam, setShowAddExam] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [showAddDoubt, setShowAddDoubt] = useState(false);

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [stdRes, btcRes, feeRes, exmRes, ldRes, dbtRes] = await Promise.all([
        api.get('/class-manager/students'),
        api.get('/class-manager/batches'),
        api.get('/class-manager/fees'),
        api.get('/class-manager/exams'),
        api.get('/class-manager/leads'),
        api.get('/class-manager/doubts')
      ]);
      setStudents(stdRes.data.data || []);
      setBatches(btcRes.data.data || []);
      setFees(feeRes.data.data || []);
      setExams(exmRes.data.data || []);
      setLeads(ldRes.data.data || []);
      setDoubts(dbtRes.data.data || []);
    } catch (err) {
      console.error('Failed to load class manager data', err);
      setError('Could not retrieve database records. Please verify API server status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Form handles
  const handleAddStudent = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/class-manager/students', studentForm);
      setSuccess(`Student "${res.data.data.studentName}" enrolled successfully!`);
      setStudentForm({
        studentName: '',
        parentName: '',
        parentPhone: '',
        email: '',
        admissionNumber: '',
        status: 'Active'
      });
      setShowAddStudent(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enroll student');
    }
  };

  const handleAddBatch = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/class-manager/batches', batchForm);
      setSuccess(`Batch "${res.data.data.name}" created successfully!`);
      setBatchForm({ name: '', courseName: '', timings: '' });
      setShowAddBatch(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create batch');
    }
  };

  const handleAddFee = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/class-manager/fees', feeForm);
      setSuccess(`Fee invoice of ₹${res.data.data.amount} logged successfully.`);
      setFeeForm({ studentId: '', amount: '', dueDate: '', status: 'Unpaid' });
      setShowAddFee(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to log fee installment');
    }
  };

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const { batchId, studentId } = enrollForm;
    if (!batchId || !studentId) return;

    try {
      await api.post(`/class-manager/batches/${batchId}/enroll`, { studentId });
      setSuccess('Student enrolled in batch successfully!');
      setEnrollForm({ batchId: '', studentId: '' });
      setShowEnroll(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Enrollment failed');
    }
  };

  const handleSendFeeReminder = async (feeId) => {
    setError('');
    setSuccess('');
    setActionLoading(`remind-${feeId}`);
    try {
      const res = await api.post(`/class-manager/fees/${feeId}/remind`);
      setSuccess(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to trigger reminder');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAbsent = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const { batchId, studentId, date } = absentForm;
    if (!batchId || !studentId) return;

    setActionLoading(`absent-${batchId}`);
    try {
      const res = await api.post(`/class-manager/batches/${batchId}/absent`, { studentId, date });
      setSuccess(res.data.message);
      setAbsentForm({ batchId: '', studentId: '', date: new Date().toISOString().split('T')[0] });
      setShowAbsent(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to notify parent about absence');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddExam = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const scores = Object.keys(studentScoresInput).map(studentId => ({
      studentId,
      marksObtained: Number(studentScoresInput[studentId] || 0),
      remarks: ''
    }));

    try {
      const res = await api.post('/class-manager/exams', {
        ...examForm,
        scores
      });
      setSuccess(`Exam "${res.data.data.testName}" recorded successfully!`);
      setExamForm({
        batchId: '',
        testName: '',
        subject: '',
        maxMarks: '',
        date: new Date().toISOString().split('T')[0]
      });
      setStudentScoresInput({});
      setShowAddExam(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record exam');
    }
  };

  const handlePublishExam = async (examId) => {
    setError('');
    setSuccess('');
    setActionLoading(`publish-${examId}`);
    try {
      const res = await api.post(`/class-manager/exams/${examId}/publish`);
      setSuccess('AI Student Review Cards and WhatsApp report messages dispatched to parents successfully!');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish exam reports');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddLead = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/class-manager/leads', leadForm);
      setSuccess(`Lead for "${res.data.data.name}" added successfully.`);
      setLeadForm({
        name: '',
        parentPhone: '',
        email: '',
        courseOfInterest: '',
        source: 'Website',
        status: 'New',
        notes: ''
      });
      setShowAddLead(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register lead');
    }
  };

  const handleSimulateLeadInquiry = async () => {
    setError('');
    setSuccess('');
    setActionLoading('simulate-lead');
    try {
      const res = await api.post('/class-manager/leads/simulate-inquiry');
      setSuccess(`Simulated incoming ad lead: "${res.data.data.lead.name}". Auto-Response Welcomer: "${res.data.data.nurtureMessage}"`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to simulate lead inquiry');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSolveDoubt = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setActionLoading('solving-doubt');
    try {
      const res = await api.post('/class-manager/doubts', doubtForm);
      setSuccess(`AI Tutor solved query for student ${res.data.data.studentName}!`);
      setDoubtForm({ studentName: '', question: '' });
      setShowAddDoubt(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to solve doubt');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRescheduleBatch = async (batchId) => {
    setError('');
    setSuccess('');
    setActionLoading(`reschedule-${batchId}`);
    try {
      const res = await api.post(`/class-manager/batches/${batchId}/reschedule`, rescheduleForm);
      setSuccess(`Batch rescheduled successfully. WhatsApp alerts sent to ${res.data.data.notifications.length} parents.`);
      setRescheduleBatchId(null);
      setRescheduleForm({ newTimings: '', reason: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reschedule batch');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateLeadStatus = async (leadId, nextStatus) => {
    setError('');
    setSuccess('');
    try {
      const leadToUpdate = leads.find(l => l._id === leadId);
      if (!leadToUpdate) return;
      
      await api.post('/class-manager/leads', {
        ...leadToUpdate,
        status: nextStatus
      });
      setSuccess(`Lead status updated to ${nextStatus}.`);
      fetchData();
    } catch (err) {
      setError('Failed to update lead status');
    }
  };

  const handleSeedData = async () => {
    setError('');
    setSuccess('');
    setActionLoading('seeding');
    try {
      const res = await api.post('/class-manager/seed');
      if (res.data.data.seeded) {
        setSuccess('Demo students, batches, fee records, exams, leads, and doubts seeded successfully!');
      } else {
        setSuccess('Workspace already contains records. Skipping seed.');
      }
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to seed demo data');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8 animate-scale-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            Class Manager <GraduationCap className="h-7 w-7 text-brand-400" />
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Manage batches, student database CRM, fees, exams, and auto-dispatched WhatsApp AI agents.
          </p>
        </div>
        
        {/* Quick action buttons */}
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleSeedData}
            disabled={actionLoading === 'seeding'}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-950/40 border border-indigo-900/40 hover:border-indigo-800 text-xs font-semibold text-indigo-300 rounded-xl transition duration-200"
          >
            {actionLoading === 'seeding' ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            <span>Seed Demo Data</span>
          </button>

          <button
            onClick={() => { setShowAddStudent(true); setShowAddBatch(false); setShowAddFee(false); setShowEnroll(false); setShowAbsent(false); setShowAddExam(false); setShowAddLead(false); setShowAddDoubt(false); }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-white rounded-xl transition duration-200"
          >
            <UserPlus className="h-4 w-4 text-brand-400" />
            <span>Add Student</span>
          </button>
          
          <button
            onClick={() => { setShowAddBatch(true); setShowAddStudent(false); setShowAddFee(false); setShowEnroll(false); setShowAbsent(false); setShowAddExam(false); setShowAddLead(false); setShowAddDoubt(false); }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-white rounded-xl transition duration-200"
          >
            <BookOpen className="h-4 w-4 text-brand-400" />
            <span>New Batch</span>
          </button>

          <button
            onClick={() => { setShowAddFee(true); setShowAddStudent(false); setShowAddBatch(false); setShowEnroll(false); setShowAbsent(false); setShowAddExam(false); setShowAddLead(false); setShowAddDoubt(false); }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-white rounded-xl transition duration-200"
          >
            <DollarSign className="h-4 w-4 text-brand-400" />
            <span>Record Fee Invoice</span>
          </button>

          <button
            onClick={() => { setShowAddExam(true); setShowAddStudent(false); setShowAddBatch(false); setShowAddFee(false); setShowEnroll(false); setShowAbsent(false); setShowAddLead(false); setShowAddDoubt(false); }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 border border-slate-850 hover:border-slate-750 text-xs font-semibold text-white rounded-xl transition duration-200"
          >
            <Award className="h-4 w-4 text-brand-400" />
            <span>Record Exam</span>
          </button>

          <button
            onClick={() => { setShowAddLead(true); setShowAddStudent(false); setShowAddBatch(false); setShowAddFee(false); setShowEnroll(false); setShowAbsent(false); setShowAddExam(false); setShowAddDoubt(false); }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 border border-slate-850 hover:border-slate-750 text-xs font-semibold text-white rounded-xl transition duration-200"
          >
            <Plus className="h-4 w-4 text-brand-400" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="p-4 bg-red-950/15 border border-red-900/40 rounded-xl text-red-400 text-sm flex items-center gap-3 animate-pulse">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-950/15 border border-emerald-900/40 rounded-xl text-emerald-400 text-sm flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Quick Action Forms Section (Rendered on Demand) */}
      {(showAddStudent || showAddBatch || showAddFee || showEnroll || showAbsent || showAddExam || showAddLead || showAddDoubt) && (
        <div className="p-6 bg-slate-900/50 border border-slate-900 rounded-2xl space-y-4 animate-scale-up relative">
          <button
            onClick={() => { setShowAddStudent(false); setShowAddBatch(false); setShowAddFee(false); setShowEnroll(false); setShowAbsent(false); setShowAddExam(false); setShowAddLead(false); setShowAddDoubt(false); }}
            className="absolute top-4 right-4 text-slate-500 hover:text-white text-xs font-mono"
          >
            [Close Form]
          </button>
          
          {showAddStudent && (
            <form onSubmit={handleAddStudent} className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-brand-400" /> Enroll New Student
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono">Student Name *</label>
                  <input
                    type="text"
                    required
                    value={studentForm.studentName}
                    onChange={(e) => setStudentForm(prev => ({ ...prev, studentName: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                    placeholder="E.g. Ayush Gupta"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono">Parent / Guardian Name</label>
                  <input
                    type="text"
                    value={studentForm.parentName}
                    onChange={(e) => setStudentForm(prev => ({ ...prev, parentName: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                    placeholder="E.g. Suresh Gupta"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono">Parent WhatsApp Phone *</label>
                  <input
                    type="text"
                    required
                    value={studentForm.parentPhone}
                    onChange={(e) => setStudentForm(prev => ({ ...prev, parentPhone: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                    placeholder="E.g. +919876543210"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono">Student Email</label>
                  <input
                    type="email"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                    placeholder="E.g. ayush@email.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono">Admission Number *</label>
                  <input
                    type="text"
                    required
                    value={studentForm.admissionNumber}
                    onChange={(e) => setStudentForm(prev => ({ ...prev, admissionNumber: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                    placeholder="E.g. ENROLL-2026-001"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono">Status</label>
                  <select
                    value={studentForm.status}
                    onChange={(e) => setStudentForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white rounded-xl transition"
              >
                Enroll Student
              </button>
            </form>
          )}

          {showAddBatch && (
            <form onSubmit={handleAddBatch} className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-brand-400" /> Create Coaching Batch
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono">Batch Name *</label>
                  <input
                    type="text"
                    required
                    value={batchForm.name}
                    onChange={(e) => setBatchForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                    placeholder="E.g. Standard 10th - Evening"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono">Course / Subject Name *</label>
                  <input
                    type="text"
                    required
                    value={batchForm.courseName}
                    onChange={(e) => setBatchForm(prev => ({ ...prev, courseName: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                    placeholder="E.g. Science & Mathematics"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono">Timings & Schedule *</label>
                  <input
                    type="text"
                    required
                    value={batchForm.timings}
                    onChange={(e) => setBatchForm(prev => ({ ...prev, timings: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                    placeholder="E.g. Mon-Wed-Fri 4PM - 6PM"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white rounded-xl transition"
              >
                Create Batch
              </button>
            </form>
          )}

          {showAddFee && (
            <form onSubmit={handleAddFee} className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-brand-400" /> Log Fee Installment
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono">Select Student *</label>
                  <select
                    required
                    value={feeForm.studentId}
                    onChange={(e) => setFeeForm(prev => ({ ...prev, studentId: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
                  >
                    <option value="">-- Choose Student --</option>
                    {students.map(s => (
                      <option key={s._id} value={s._id}>{s.studentName} ({s.admissionNumber})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={feeForm.amount}
                    onChange={(e) => setFeeForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                    placeholder="E.g. 1500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={feeForm.dueDate}
                    onChange={(e) => setFeeForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono">Status</label>
                  <select
                    value={feeForm.status}
                    onChange={(e) => setFeeForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
                  >
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white rounded-xl transition"
              >
                Log Invoice (Generates Razorpay link)
              </button>
            </form>
          )}

          {showEnroll && (
            <form onSubmit={handleEnrollStudent} className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Users className="h-4 w-4 text-brand-400" /> Enroll Student in Batch
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono">Select Target Batch *</label>
                  <select
                    required
                    value={enrollForm.batchId}
                    onChange={(e) => setEnrollForm(prev => ({ ...prev, batchId: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
                  >
                    <option value="">-- Choose Batch --</option>
                    {batches.map(b => (
                      <option key={b._id} value={b._id}>{b.name} ({b.courseName})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono">Select Student *</label>
                  <select
                    required
                    value={enrollForm.studentId}
                    onChange={(e) => setEnrollForm(prev => ({ ...prev, studentId: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
                  >
                    <option value="">-- Choose Student --</option>
                    {students.map(s => (
                      <option key={s._id} value={s._id}>{s.studentName} ({s.admissionNumber})</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white rounded-xl transition"
              >
                Enroll In Batch
              </button>
            </form>
          )}

          {showAbsent && (
            <form onSubmit={handleMarkAbsent} className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Calendar className="h-4 w-4 text-brand-400" /> Log Student Absence & Alert Parent
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono">Select Batch *</label>
                  <select
                    required
                    value={absentForm.batchId}
                    onChange={(e) => {
                      const bId = e.target.value;
                      setAbsentForm(prev => ({ ...prev, batchId: bId, studentId: '' }));
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
                  >
                    <option value="">-- Choose Batch --</option>
                    {batches.map(b => (
                      <option key={b._id} value={b._id}>{b.name} ({b.courseName})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono">Select Student *</label>
                  <select
                    required
                    value={absentForm.studentId}
                    onChange={(e) => setAbsentForm(prev => ({ ...prev, studentId: e.target.value }))}
                    disabled={!absentForm.batchId}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-500 disabled:opacity-50"
                  >
                    <option value="">-- Choose Student --</option>
                    {batches
                      .find(b => b._id === absentForm.batchId)
                      ?.students.map(s => (
                        <option key={s._id} value={s._id}>{s.studentName}</option>
                      ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono">Date of Absence *</label>
                  <input
                    type="date"
                    required
                    value={absentForm.date}
                    onChange={(e) => setAbsentForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white rounded-xl transition flex items-center gap-1.5"
              >
                {actionLoading === `absent-${absentForm.batchId}` ? (
                  <Loader className="h-3 w-3 animate-spin text-white" />
                ) : (
                  <Send className="h-3.5 w-3.5 text-white" />
                )}
                <span>Send WhatsApp Absent Alert</span>
              </button>
            </form>
          )}

          {showAddExam && (
            <form onSubmit={handleAddExam} className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Award className="h-4 w-4 text-brand-400" /> Record Exam Marks Ledger
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono">Target Batch *</label>
                  <select
                    required
                    value={examForm.batchId}
                    onChange={(e) => {
                      const bId = e.target.value;
                      setExamForm(prev => ({ ...prev, batchId: bId }));
                      // Prep scores dictionary
                      const selectedBatch = batches.find(b => b._id === bId);
                      const scoresDict = {};
                      if (selectedBatch && selectedBatch.students) {
                        selectedBatch.students.forEach(s => {
                          scoresDict[s._id] = '';
                        });
                      }
                      setStudentScoresInput(scoresDict);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
                  >
                    <option value="">-- Choose Batch --</option>
                    {batches.map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono">Test Name *</label>
                  <input
                    type="text"
                    required
                    value={examForm.testName}
                    onChange={(e) => setExamForm(prev => ({ ...prev, testName: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                    placeholder="E.g. Algebra Test 1"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono">Subject *</label>
                  <input
                    type="text"
                    required
                    value={examForm.subject}
                    onChange={(e) => setExamForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                    placeholder="E.g. Mathematics"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono">Max Marks *</label>
                  <input
                    type="number"
                    required
                    value={examForm.maxMarks}
                    onChange={(e) => setExamForm(prev => ({ ...prev, maxMarks: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                    placeholder="E.g. 50"
                  />
                </div>
              </div>

              {examForm.batchId && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                  <h4 className="text-[10px] text-slate-400 uppercase font-mono">Student Grades Input</h4>
                  {batches.find(b => b._id === examForm.batchId)?.students.length === 0 && (
                    <p className="text-xs text-slate-500">No students are currently enrolled in this batch.</p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {batches.find(b => b._id === examForm.batchId)?.students.map(std => (
                      <div key={std._id} className="flex items-center justify-between gap-3 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-xs text-slate-200">{std.studentName}</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            required
                            placeholder="Marks"
                            value={studentScoresInput[std._id] !== undefined ? studentScoresInput[std._id] : ''}
                            onChange={(e) => setStudentScoresInput(prev => ({ ...prev, [std._id]: e.target.value }))}
                            className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white text-center"
                          />
                          <span className="text-slate-500 text-[10px]">/ {examForm.maxMarks || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white rounded-xl transition"
              >
                Record Test Scores
              </button>
            </form>
          )}

          {showAddLead && (
            <form onSubmit={handleAddLead} className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Users className="h-4 w-4 text-brand-400" /> Register Inquired Lead
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono">Student / Parent Name *</label>
                  <input
                    type="text"
                    required
                    value={leadForm.name}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                    placeholder="E.g. Amit Kumar"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono">WhatsApp Phone *</label>
                  <input
                    type="text"
                    required
                    value={leadForm.parentPhone}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, parentPhone: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                    placeholder="E.g. +919876543210"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono">Email Address</label>
                  <input
                    type="email"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                    placeholder="E.g. amit@email.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono">Course of Interest *</label>
                  <input
                    type="text"
                    required
                    value={leadForm.courseOfInterest}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, courseOfInterest: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                    placeholder="E.g. 10th Standard Science"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono">Ad Channel / Source</label>
                  <select
                    value={leadForm.source}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, source: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
                  >
                    <option value="Website">Website</option>
                    <option value="Google Business">Google Business</option>
                    <option value="Facebook Ads">Facebook Ads</option>
                    <option value="Walk-in">Walk-in</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono">Status</label>
                  <select
                    value={leadForm.status}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Demo Scheduled">Demo Scheduled</option>
                    <option value="Enrolled">Enrolled</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-mono">Notes / Reminders</label>
                <textarea
                  value={leadForm.notes}
                  onChange={(e) => setLeadForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 h-20"
                  placeholder="E.g. Callback requested on Monday afternoon."
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white rounded-xl transition"
              >
                Save CRM Lead
              </button>
            </form>
          )}

          {showAddDoubt && (
            <form onSubmit={handleSolveDoubt} className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-brand-400" /> 24/7 AI Tutor Doubt solver
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono">Student Name *</label>
                  <input
                    type="text"
                    required
                    value={doubtForm.studentName}
                    onChange={(e) => setDoubtForm(prev => ({ ...prev, studentName: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                    placeholder="E.g. Rohan Das"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono">Study Doubt / Question *</label>
                  <input
                    type="text"
                    required
                    value={doubtForm.question}
                    onChange={(e) => setDoubtForm(prev => ({ ...prev, question: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                    placeholder="E.g. What is the derivative of x^2 + 5x?"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={actionLoading === 'solving-doubt'}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-55 text-xs font-bold text-white rounded-xl transition flex items-center gap-1.5"
              >
                {actionLoading === 'solving-doubt' ? (
                  <Loader className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                <span>Ask AI Tutor</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* Tabs Menu Navigation */}
      <div className="flex flex-wrap border border-slate-900 bg-slate-900/10 p-1.5 rounded-2xl max-w-4xl gap-1">
        {[
          { id: 'batches', label: 'Active Batches', icon: BookOpen },
          { id: 'students', label: 'Student CRM', icon: Users },
          { id: 'fees', label: 'Fee Ledger', icon: DollarSign },
          { id: 'exams', label: 'Exams & Reports', icon: Award },
          { id: 'leads', label: 'Lead CRM (Ad Welcomer)', icon: TrendingUp },
          { id: 'doubts', label: 'AI Doubt Resolver', icon: HelpCircle }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider font-mono transition duration-300 ${
                activeTab === tab.id
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Render Area */}
      {loading ? (
        <div className="flex items-center justify-center p-20">
          <Loader className="h-8 w-8 animate-spin text-brand-400" />
        </div>
      ) : (
        <div className="animate-scale-up">
          {/* TAB 1: BATCHES */}
          {activeTab === 'batches' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">
                  Batch Timings & Courses ({batches.length})
                </h3>
                <button
                  onClick={() => { setShowEnroll(true); setShowAbsent(false); }}
                  className="text-xs text-brand-400 hover:text-brand-300 font-bold flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Enroll Student in Batch
                </button>
              </div>

              {batches.length === 0 ? (
                <div className="p-10 border border-dashed border-slate-800 rounded-2xl text-center space-y-3">
                  <p className="text-sm text-slate-500">No active batches created yet.</p>
                  <button
                    onClick={() => setShowAddBatch(true)}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white rounded-xl transition"
                  >
                    Setup First Batch
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {batches.map(batch => {
                    const isRescheduling = rescheduleBatchId === batch._id;
                    return (
                      <div
                        key={batch._id}
                        className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 hover:border-slate-800 transition duration-300 space-y-4 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h4 className="font-bold text-base text-white">{batch.name}</h4>
                            <span className="px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-mono">
                              {batch.courseName}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-500" /> {batch.timings}
                          </p>
                        </div>

                        <div className="space-y-3 border-t border-slate-950/80 pt-3">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>Enrolled Student Count:</span>
                            <span className="font-bold text-slate-300 font-mono">{batch.students?.length || 0}</span>
                          </div>

                          {/* List of enrolled students in card */}
                          {batch.students && batch.students.length > 0 ? (
                            <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                              {batch.students.map(std => (
                                <div key={std._id} className="flex items-center justify-between bg-slate-950/30 p-1.5 rounded-lg border border-slate-900/40 text-[11px] text-slate-300">
                                  <span>{std.studentName}</span>
                                  <span className="text-[9px] text-slate-500 font-mono">{std.admissionNumber}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-600 italic">No students enrolled.</p>
                          )}

                          {isRescheduling ? (
                            <div className="bg-slate-950 p-3 rounded-xl border border-red-900/20 space-y-2.5 mt-2">
                              <span className="text-[10px] text-red-400 uppercase font-mono font-bold block">Reschedule Batch Timings</span>
                              <input
                                type="text"
                                required
                                value={rescheduleForm.newTimings}
                                onChange={(e) => setRescheduleForm(prev => ({ ...prev, newTimings: e.target.value }))}
                                placeholder="E.g. Tue-Thu-Sat 6PM-8PM"
                                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                              />
                              <input
                                type="text"
                                value={rescheduleForm.reason}
                                onChange={(e) => setRescheduleForm(prev => ({ ...prev, reason: e.target.value }))}
                                placeholder="Reason (e.g. teacher health issue)"
                                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleRescheduleBatch(batch._id)}
                                  disabled={actionLoading === `reschedule-${batch._id}`}
                                  className="flex-1 py-1 bg-brand-600 hover:bg-brand-500 text-[10px] text-white font-bold rounded"
                                >
                                  {actionLoading === `reschedule-${batch._id}` ? 'Alerting...' : 'Alert & Save'}
                                </button>
                                <button
                                  onClick={() => { setRescheduleBatchId(null); setRescheduleForm({ newTimings: '', reason: '' }); }}
                                  className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-[10px] text-slate-300 font-bold rounded"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={() => {
                                  setAbsentForm(prev => ({ ...prev, batchId: batch._id }));
                                  setShowAbsent(true);
                                  setShowEnroll(false);
                                }}
                                className="flex-1 py-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/20 text-[10px] font-bold uppercase tracking-wider text-red-400 rounded-lg transition text-center"
                              >
                                Mark Absent
                              </button>
                              <button
                                onClick={() => {
                                  setRescheduleBatchId(batch._id);
                                  setRescheduleForm({ newTimings: batch.timings, reason: '' });
                                }}
                                className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold uppercase tracking-wider text-slate-300 rounded-lg transition text-center"
                              >
                                Reschedule
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STUDENT CRM */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">
                  Enrolled Students Directory ({students.length})
                </h3>
              </div>

              {students.length === 0 ? (
                <div className="p-10 border border-dashed border-slate-800 rounded-2xl text-center space-y-3">
                  <p className="text-sm text-slate-500">No students registered in CRM yet.</p>
                  <button
                    onClick={() => setShowAddStudent(true)}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white rounded-xl transition"
                  >
                    Register First Student
                  </button>
                </div>
              ) : (
                <div className="bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-mono font-bold text-[10px] border-b border-slate-900">
                        <tr>
                          <th className="px-6 py-4">Student Details</th>
                          <th className="px-6 py-4">Admission ID</th>
                          <th className="px-6 py-4">Parent Phone</th>
                          <th className="px-6 py-4">Join Date</th>
                          <th className="px-6 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/60 text-slate-300">
                        {students.map(student => (
                          <tr key={student._id} className="hover:bg-slate-900/10 transition">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-brand-600/10 flex items-center justify-center font-bold text-brand-400">
                                  {student.studentName.charAt(0)}
                                </div>
                                <div>
                                  <span className="block font-bold text-white text-sm">{student.studentName}</span>
                                  <span className="block text-[11px] text-slate-500">{student.email || 'No email log'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-mono text-slate-400">{student.admissionNumber}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5">
                                <Phone className="h-3 w-3 text-brand-500" />
                                <span>{student.parentPhone}</span>
                                {student.parentName && <span className="text-[10px] text-slate-500">({student.parentName})</span>}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-400">{new Date(student.joinedDate).toLocaleDateString()}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                                student.status === 'Active'
                                  ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                                  : student.status === 'Suspended'
                                    ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}>
                                {student.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FEE INSTALLMENTS */}
          {activeTab === 'fees' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">
                  Fee Payments Ledger & Razorpay Links ({fees.length})
                </h3>
              </div>

              {fees.length === 0 ? (
                <div className="p-10 border border-dashed border-slate-800 rounded-2xl text-center space-y-3">
                  <p className="text-sm text-slate-500">No payment invoices registered.</p>
                  <button
                    onClick={() => setShowAddFee(true)}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white rounded-xl transition"
                  >
                    Log Fee Dues
                  </button>
                </div>
              ) : (
                <div className="bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden animate-scale-up">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-mono font-bold text-[10px] border-b border-slate-900">
                        <tr>
                          <th className="px-6 py-4">Student</th>
                          <th className="px-6 py-4">Due Amount</th>
                          <th className="px-6 py-4">Due Date</th>
                          <th className="px-6 py-4">Razorpay Reference</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/60">
                        {fees.map(fee => {
                          const isOverdue = new Date(fee.dueDate) < new Date() && fee.status !== 'Paid';
                          const statusColor = fee.status === 'Paid'
                            ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                            : isOverdue || fee.status === 'Overdue'
                              ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                              : 'bg-amber-500/10 border border-amber-500/20 text-amber-400';
                          return (
                            <tr key={fee._id} className="hover:bg-slate-900/10 transition">
                              <td className="px-6 py-4 font-bold text-white">
                                {fee.studentId ? (
                                  <div>
                                    <span>{fee.studentId.studentName}</span>
                                    <span className="block text-[10px] text-slate-500 font-mono font-normal">
                                      ID: {fee.studentId.admissionNumber} | Phone: {fee.studentId.parentPhone}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-red-400 font-normal italic">Student record deleted</span>
                                )}
                              </td>
                              <td className="px-6 py-4 font-mono font-bold text-white">₹{fee.amount}</td>
                              <td className="px-6 py-4 text-slate-400">{new Date(fee.dueDate).toLocaleDateString()}</td>
                              <td className="px-6 py-4 font-mono text-[11px] text-slate-500">
                                {fee.razorpayPaymentLinkId ? (
                                  <a
                                    href={`https://rzp.io/i/${fee.razorpayPaymentLinkId}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-brand-400 hover:underline"
                                  >
                                    {fee.razorpayPaymentLinkId}
                                  </a>
                                ) : (
                                  'N/A'
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${statusColor}`}>
                                  {isOverdue && fee.status !== 'Paid' ? 'Overdue' : fee.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                {fee.status !== 'Paid' && (
                                  <button
                                    onClick={() => handleSendFeeReminder(fee._id)}
                                    disabled={actionLoading === `remind-${fee._id}`}
                                    className="px-3 py-1.5 bg-brand-600/10 border border-brand-500/20 text-brand-400 hover:bg-brand-600 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1.5 ml-auto"
                                  >
                                    {actionLoading === `remind-${fee._id}` ? (
                                      <Loader className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Send className="h-3 w-3" />
                                    )}
                                    <span>Send WhatsApp Reminder</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: EXAMS & REPORTS */}
          {activeTab === 'exams' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">
                  Test Marks & AI Student Analysis ({exams.length})
                </h3>
                <button
                  onClick={() => { setShowAddExam(true); setShowAddLead(false); setShowAddDoubt(false); }}
                  className="text-xs text-brand-400 hover:text-brand-300 font-bold flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Record New Exam
                </button>
              </div>

              {exams.length === 0 ? (
                <div className="p-10 border border-dashed border-slate-800 rounded-2xl text-center space-y-3">
                  <p className="text-sm text-slate-500">No exams have been graded yet.</p>
                  <button
                    onClick={() => setShowAddExam(true)}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white rounded-xl transition"
                  >
                    Create First Test
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {exams.map(exam => (
                    <div key={exam._id} className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 hover:border-slate-850 transition duration-300 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-950 pb-3 gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-lg text-white">{exam.testName}</h4>
                            <span className="px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-mono font-bold">
                              {exam.subject}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-mono">
                            Date: {new Date(exam.date).toLocaleDateString()} | Batch: {exam.batchId?.name || 'Deleted Batch'}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="block text-[10px] text-slate-500 uppercase font-mono">Max Score Possible</span>
                            <span className="block font-extrabold text-xl text-white font-mono">{exam.maxMarks} Marks</span>
                          </div>
                          <button
                            onClick={() => handlePublishExam(exam._id)}
                            disabled={actionLoading === `publish-${exam._id}`}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
                          >
                            {actionLoading === `publish-${exam._id}` ? (
                              <Loader className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                            <span>Send AI Progress Updates</span>
                          </button>
                        </div>
                      </div>

                      {/* Scores List */}
                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Student Score Sheets</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {exam.scores?.map(score => {
                            const studentData = students.find(s => s._id === score.studentId);
                            const pct = ((score.marksObtained / exam.maxMarks) * 100).toFixed(0);
                            return (
                              <div key={score._id} className="bg-slate-950/40 border border-slate-900 rounded-xl p-3.5 space-y-2 flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-200 text-xs">{studentData?.studentName || 'Student'}</span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                    pct >= 75
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : pct >= 50
                                        ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  }`}>
                                    {score.marksObtained} / {exam.maxMarks} ({pct}%)
                                  </span>
                                </div>
                                {score.remarks && (
                                  <p className="text-[11px] text-indigo-300 italic bg-indigo-950/20 p-2 rounded-lg border border-indigo-900/25">
                                    " {score.remarks} "
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: LEAD CRM */}
          {activeTab === 'leads' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">
                    Facebook & Google Ads Lead Pipeline ({leads.length})
                  </h3>
                  <p className="text-xs text-slate-500">Auto-sends custom regional welcomer replies with PDF brochures when web leads register.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSimulateLeadInquiry}
                    disabled={actionLoading === 'simulate-lead'}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    {actionLoading === 'simulate-lead' ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    <span>Simulate Ad Web Lead</span>
                  </button>
                  <button
                    onClick={() => { setShowAddLead(true); setShowAddStudent(false); setShowAddBatch(false); setShowAddFee(false); }}
                    className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition"
                  >
                    Add Lead Manually
                  </button>
                </div>
              </div>

              {leads.length === 0 ? (
                <div className="p-10 border border-dashed border-slate-800 rounded-2xl text-center space-y-3">
                  <p className="text-sm text-slate-500">No active CRM pipeline leads.</p>
                  <button
                    onClick={handleSimulateLeadInquiry}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white rounded-xl transition"
                  >
                    Simulate First Inquiry
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {['New', 'Contacted', 'Demo Scheduled', 'Enrolled'].map(columnStatus => {
                    const columnLeads = leads.filter(l => l.status === columnStatus);
                    return (
                      <div key={columnStatus} className="bg-slate-900/35 border border-slate-900 rounded-2xl p-4 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-950 pb-2">
                          <span className="font-bold text-xs text-white uppercase tracking-wider font-mono">{columnStatus}</span>
                          <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-950 px-2 py-0.5 rounded-full">
                            {columnLeads.length}
                          </span>
                        </div>

                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                          {columnLeads.length === 0 ? (
                            <div className="p-6 text-center border border-dashed border-slate-900 rounded-xl text-[11px] text-slate-600">
                              No leads in this stage.
                            </div>
                          ) : (
                            columnLeads.map(lead => (
                              <div key={lead._id} className="bg-slate-950/40 border border-slate-900 rounded-xl p-3.5 space-y-3 hover:border-slate-800 transition">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-xs text-white block">{lead.name}</span>
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 font-mono">
                                      {lead.source}
                                    </span>
                                  </div>
                                  <span className="block text-[11px] text-indigo-300 font-mono">{lead.courseOfInterest}</span>
                                </div>

                                <div className="space-y-1 text-[10px] text-slate-500 font-mono">
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3 text-slate-600" />
                                    <span>{lead.parentPhone}</span>
                                  </div>
                                  {lead.notes && <p className="text-slate-600 mt-1 italic font-sans">"{lead.notes}"</p>}
                                </div>

                                <div className="flex justify-between items-center gap-2 pt-2 border-t border-slate-900/60">
                                  {columnStatus !== 'Enrolled' ? (
                                    <button
                                      onClick={() => {
                                        const steps = ['New', 'Contacted', 'Demo Scheduled', 'Enrolled'];
                                        const nextIndex = steps.indexOf(columnStatus) + 1;
                                        handleUpdateLeadStatus(lead._id, steps[nextIndex]);
                                      }}
                                      className="text-[10px] font-bold uppercase tracking-wider text-brand-400 hover:text-white flex items-center gap-1 ml-auto"
                                    >
                                      <span>Move Next</span>
                                      <ArrowRight className="h-3 w-3" />
                                    </button>
                                  ) : (
                                    <span className="text-[9px] text-emerald-400 uppercase font-mono font-bold flex items-center gap-1 ml-auto">
                                      <CheckCircle2 className="h-3 w-3" /> Enrolled
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: AI DOUBT RESOLVER */}
          {activeTab === 'doubts' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">
                    24/7 Student Doubt Solver Bot Feed ({doubts.length})
                  </h3>
                  <p className="text-xs text-slate-500">Live logs of doubt queries parsed and resolved using Excellence Academy's WhatsApp AI Agent.</p>
                </div>
                <button
                  onClick={() => { setShowAddDoubt(true); setShowAddStudent(false); setShowAddBatch(false); setShowAddFee(false); }}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
                >
                  <Plus className="h-3.5 w-3.5" /> Submit Student Question
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side: Past Doubts Feed */}
                <div className="lg:col-span-1 bg-slate-900/35 border border-slate-900 rounded-2xl p-4 space-y-4">
                  <span className="font-bold text-xs text-slate-400 uppercase tracking-wider font-mono block">Query History</span>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {doubts.length === 0 ? (
                      <p className="text-xs text-slate-600 italic text-center py-6">No study doubts logged yet.</p>
                    ) : (
                      doubts.map(d => (
                        <div key={d._id} className="bg-slate-950/40 border border-slate-900 rounded-xl p-3.5 space-y-2 hover:border-slate-850 transition">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-200">{d.studentName}</span>
                            <span className="text-[9px] text-emerald-400 font-mono uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              Resolved
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-2">Q: "{d.question}"</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Right Side: Interactive AI Tutor Sim */}
                <div className="lg:col-span-2 bg-slate-900/20 border border-slate-900 rounded-2xl p-6 flex flex-col justify-between min-h-[450px]">
                  <div className="space-y-4">
                    <div className="border-b border-slate-900 pb-3">
                      <span className="font-bold text-sm text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <MessageSquare className="h-4 w-4 text-brand-400" /> WhatsApp Doubt Solver Mock Simulator
                      </span>
                    </div>

                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                      {doubts.slice(0, 3).map((d, index) => (
                        <div key={d._id} className="space-y-3">
                          {/* Student Message bubble */}
                          <div className="flex justify-end">
                            <div className="bg-slate-800 text-white rounded-2xl rounded-tr-none px-4 py-2.5 max-w-md text-xs border border-slate-700/60 shadow-sm">
                              <span className="block font-bold text-[10px] text-slate-400 font-mono mb-1">{d.studentName}</span>
                              {d.question}
                            </div>
                          </div>
                          
                          {/* AI Tutor Response bubble */}
                          <div className="flex justify-start">
                            <div className="bg-indigo-950/30 text-slate-200 rounded-2xl rounded-tl-none px-4 py-2.5 max-w-md text-xs border border-indigo-900/30 shadow-md">
                              <span className="font-bold text-[10px] text-brand-400 font-mono flex items-center gap-1 mb-1.5">
                                <Sparkles className="h-3 w-3" /> WhatsApp AI Study Tutor
                              </span>
                              <div className="whitespace-pre-line leading-relaxed">{d.aiResponse}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleSolveDoubt} className="border-t border-slate-900 pt-4 mt-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        required
                        value={doubtForm.studentName}
                        onChange={(e) => setDoubtForm(prev => ({ ...prev, studentName: e.target.value }))}
                        placeholder="Student Name (e.g. Ishita Patel)"
                        className="bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 sm:w-1/3"
                      />
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          required
                          value={doubtForm.question}
                          onChange={(e) => setDoubtForm(prev => ({ ...prev, question: e.target.value }))}
                          placeholder="Type academic doubt (e.g. What are Newton's Laws?)"
                          className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                        />
                        <button
                          type="submit"
                          disabled={actionLoading === 'solving-doubt'}
                          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-55 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
                        >
                          {actionLoading === 'solving-doubt' ? (
                            <Loader className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Send className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClassManagerPage;
