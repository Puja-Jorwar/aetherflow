import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import SidebarLayout from './components/layout/SidebarLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ChatbotPage from './pages/ChatbotPage';
import PdfChatPage from './pages/PdfChatPage';
import PromptsPage from './pages/PromptsPage';
import ContentGeneratorPage from './pages/ContentGeneratorPage';
import ResumeAnalyzerPage from './pages/ResumeAnalyzerPage';
import WorkflowsPage from './pages/WorkflowsPage';
import JobAgentPage from './pages/JobAgentPage';
import ClassManagerPage from './pages/ClassManagerPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Dashboard Workspace Pages */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <SidebarLayout>
                <DashboardPage />
              </SidebarLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/chatbot" 
          element={
            <ProtectedRoute>
              <SidebarLayout>
                <ChatbotPage />
              </SidebarLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/pdf-chat" 
          element={
            <ProtectedRoute>
              <SidebarLayout>
                <PdfChatPage />
              </SidebarLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/prompts" 
          element={
            <ProtectedRoute>
              <SidebarLayout>
                <PromptsPage />
              </SidebarLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/content-generator" 
          element={
            <ProtectedRoute>
              <SidebarLayout>
                <ContentGeneratorPage />
              </SidebarLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/resume-analyzer" 
          element={
            <ProtectedRoute>
              <SidebarLayout>
                <ResumeAnalyzerPage />
              </SidebarLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/workflows" 
          element={
            <ProtectedRoute>
              <SidebarLayout>
                <WorkflowsPage />
              </SidebarLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/job-agent" 
          element={
            <ProtectedRoute>
              <SidebarLayout>
                <JobAgentPage />
              </SidebarLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/class-manager" 
          element={
            <ProtectedRoute>
              <SidebarLayout>
                <ClassManagerPage />
              </SidebarLayout>
            </ProtectedRoute>
          } 
        />

        {/* Fallback 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
