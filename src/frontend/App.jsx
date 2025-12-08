import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './hooks/useAuth.jsx';
import { ModalProvider } from './context/ModalContext';
import { ToastProvider } from './context/ToastContext.jsx';

// Import components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PreviewProtectedRoute from './components/auth/PreviewProtectedRoute';
import NotFoundPage from './pages/NotFoundPage';

// Import pages
import RelayMainApp from './components/main/RelayMainApp';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import KeySpaceStoragePage from './pages/KeySpaceStoragePage';

// Import new pages
import VotingDashboardPage from './pages/VotingDashboardPage';
import ChannelExplorerPage from './pages/ChannelExplorerPage';
import AIAssistantPage from './pages/AIAssistantPage';
import OnboardingFlowPage from './pages/OnboardingFlowPage';
import GovernanceCenterPage from './pages/GovernanceCenterPage';
import GlobalMapPage from './pages/GlobalMapPage';
import JuryInterfacePage from './pages/JuryInterfacePage';
import GuardianRecoveryPage from './pages/GuardianRecoveryPage';
import FounderDashboardPage from './pages/FounderDashboardPage';

// Import the Development Center
import RelayDevCenter from './components/development/RelayDevCenter';
import DevEnvironmentLayout from './components/development/DevEnvironmentLayout';

// Import the Chatroom Page
import ChatroomPage from './pages/ChatroomPage';

// Import session monitoring
import sessionManager from './services/sessionManager.js';
import { useSessionMonitor } from './auth/hooks/useSessionMonitor.js';

function AppContent() {
  const { checkSessionStatus, showReauthenticationIfNeeded } = useSessionMonitor();
  
  // Set up activity tracking
  useEffect(() => {
    const trackActivity = () => {
      sessionManager.trackActivity();
    };
    
    // Check session status immediately
    checkSessionStatus();
    
    // Track user interactions
    document.addEventListener('click', trackActivity);
    document.addEventListener('keypress', trackActivity);
    
    // Check for session timeout periodically
    const timeoutInterval = setInterval(() => {
      if (sessionManager.hasSessionTimedOut()) {
        showReauthenticationIfNeeded();
      }
    }, 60000); // Check every minute
    
    return () => {
      document.removeEventListener('click', trackActivity);
      document.removeEventListener('keypress', trackActivity);
      clearInterval(timeoutInterval);
    };
  }, [checkSessionStatus, showReauthenticationIfNeeded]);
  
  return (
    <BrowserRouter>
      <div className="app-container">
        <Header />
        <main className="main-content">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<RelayMainApp />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/onboarding" element={<OnboardingFlowPage />} />
            <Route path="/founder-dashboard" element={<FounderDashboardPage />} />
            
            {/* Development Center - Only in development mode */}
            <Route 
              path="/dev-center" 
              element={
                process.env.NODE_ENV === 'development' ? (
                  <RelayDevCenter />
                ) : (
                  <PreviewProtectedRoute>
                    <RelayDevCenter />
                  </PreviewProtectedRoute>
                )
              } 
            />
            
            {/* Workspace Layout - VSCode-style development environment */}
            <Route 
              path="/workspace" 
              element={
                process.env.NODE_ENV === 'development' ? (
                  <DevEnvironmentLayout />
                ) : (
                  <PreviewProtectedRoute>
                    <DevEnvironmentLayout />
                  </PreviewProtectedRoute>
                )
              } 
            />
            
            {/* Protected Routes - Core Features */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Preview-Enabled Routes - Allow preview mode without authentication */}
            <Route 
              path="/voting" 
              element={
                <PreviewProtectedRoute>
                  <VotingDashboardPage />
                </PreviewProtectedRoute>
              } 
            />
            <Route 
              path="/channels" 
              element={
                <PreviewProtectedRoute>
                  <ChannelExplorerPage />
                </PreviewProtectedRoute>
              } 
            />
            <Route 
              path="/chatroom/:channelId" 
              element={
                <PreviewProtectedRoute>
                  <ChatroomPage />
                </PreviewProtectedRoute>
              } 
            />
            <Route 
              path="/governance" 
              element={
                <PreviewProtectedRoute>
                  <GovernanceCenterPage />
                </PreviewProtectedRoute>
              } 
            />
            
            {/* Standard Protected Routes */}
            <Route 
              path="/ai-assistant" 
              element={
                <ProtectedRoute>
                  <AIAssistantPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/global-map" 
              element={
                <ProtectedRoute>
                  <GlobalMapPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/jury" 
              element={
                <ProtectedRoute>
                  <JuryInterfacePage />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected Routes - User Management */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/keyspace" 
              element={
                <ProtectedRoute>
                  <KeySpaceStoragePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/recovery" 
              element={
                <ProtectedRoute>
                  <GuardianRecoveryPage />
                </ProtectedRoute>
              } 
            />
            
            {/* 404 Page */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <ToastProvider>
          <ModalProvider>
            <AppContent />
          </ModalProvider>
        </ToastProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
