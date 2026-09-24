import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Shell } from './components/layout/Shell';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { MembersPage } from './pages/MembersPage';
import { MemberDetailPage } from './pages/MemberDetailPage';
import { PlansPage } from './pages/PlansPage';
import { AttendancePage } from './pages/AttendancePage';
import { PaymentsPage } from './pages/PaymentsPage';
import { TrainersPage } from './pages/TrainersPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { PendingApprovalPage } from './pages/PendingApprovalPage';
import { SuperAdminPage } from './pages/SuperAdminPage';
import { GymPublicWebsitePage } from './pages/GymPublicWebsitePage';
import { GymWebsiteManagerPage } from './pages/GymWebsiteManagerPage';
import { DownloadPage } from './pages/DownloadPage';

function AppContent() {
  const { user, gym, isAuthenticated, loading, login } = useAuth();
  
  // Dedicated /download route
  const [isDownloadCenter, setIsDownloadCenter] = useState(() => {
    try {
      return window.location.pathname.startsWith('/download');
    } catch (e) {
      return false;
    }
  });

  // Public route state: 'landing', 'login', 'register', 'forgot-password'
  const [publicView, setPublicView] = useState('landing');

  // Dedicated gym public website routing & preview state
  const [previewFacilitySlug, setPreviewFacilitySlug] = useState(null);
  const [publicFacilitySlug, setPublicFacilitySlug] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get('facility')) return searchParams.get('facility');
        if (searchParams.get('gym')) return searchParams.get('gym');

        const hash = window.location.hash || '';
        if (hash.includes('/facility/')) {
          return hash.split('/facility/')[1]?.split('?')[0]?.split('/')[0] || null;
        }

        const path = window.location.pathname;
        if (path.includes('/facility/')) {
          return path.split('/facility/')[1]?.split('?')[0]?.split('/')[0] || null;
        }
        if (path.includes('/gym/')) {
          return path.split('/gym/')[1]?.split('?')[0]?.split('/')[0] || null;
        }
      }
    } catch (e) {
      // fallback
    }
    return null;
  });

  // Authenticated tab state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  // Global modals triggered from topbar & pages
  const [isQuickCheckInOpen, setIsQuickCheckInOpen] = useState(false);
  const [isQuickAddMemberOpen, setIsQuickAddMemberOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState('');
  const [dashboardRefreshTrigger, setDashboardRefreshTrigger] = useState(0);

  const isSuperAdmin = user?.is_superadmin || user?.role === 'superadmin';

  // Automatically switch Platform Owners into the Super Admin console
  React.useEffect(() => {
    if (isSuperAdmin && activeTab === 'dashboard') {
      setActiveTab('superadmin');
    }
  }, [isSuperAdmin]);

  const handleOpenAi = (prompt = '') => {
    setAiInitialPrompt(prompt);
    setIsAiOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6 select-none">
        <div className="relative mb-6 flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-500 p-1 shadow-2xl shadow-brand-500/30 flex items-center justify-center">
            <img src="/gympulse.png" alt="GymPulse Logo" className="w-16 h-16 object-contain drop-shadow-md" />
          </div>
          <div className="absolute -inset-2 rounded-3xl border-2 border-brand-400/30 animate-pulse pointer-events-none"></div>
        </div>
        <h1 className="text-xl font-black tracking-tight text-white">GYMPULSE SAAS</h1>
        <p className="text-xs font-semibold text-brand-400 uppercase tracking-widest mt-1">Facility Management Platform</p>
        <div className="flex items-center gap-2 mt-6 text-slate-400 text-xs">
          <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Starting operations console...</span>
        </div>
      </div>
    );
  }

  // Dedicated /download route
  if (isDownloadCenter) {
    return (
      <DownloadPage
        onBack={() => {
          setIsDownloadCenter(false);
          try {
            window.history.pushState({}, '', '/');
          } catch (e) {}
        }}
      />
    );
  }

  // If viewing a gym's public website or previewing it
  if (previewFacilitySlug || publicFacilitySlug) {
    return (
      <GymPublicWebsitePage
        slug={previewFacilitySlug || publicFacilitySlug}
        onBackToApp={() => {
          setPreviewFacilitySlug(null);
          setPublicFacilitySlug(null);
          try {
            window.history.pushState({}, '', '/');
          } catch (e) {}
        }}
      />
    );
  }

  // If not authenticated, render public pages
  if (!isAuthenticated) {
    if (publicView === 'login') {
      return (
        <LoginPage
          onNavigateRegister={() => setPublicView('register')}
          onNavigateForgotPassword={() => setPublicView('forgot-password')}
          onBackToLanding={() => setPublicView('landing')}
        />
      );
    }
    if (publicView === 'register') {
      return (
        <RegisterPage
          onNavigateLogin={() => setPublicView('login')}
          onBackToLanding={() => setPublicView('landing')}
        />
      );
    }
    if (publicView === 'forgot-password') {
      return (
        <ForgotPasswordPage
          onNavigateLogin={() => setPublicView('login')}
        />
      );
    }
    return (
      <LandingPage
        onNavigateLogin={() => setPublicView('login')}
        onNavigateRegister={() => setPublicView('register')}
      />
    );
  }

  // If gym registration is pending approval and user is NOT platform super admin:
  if (!isSuperAdmin && (gym?.approval_status === 'pending' || !gym?.is_approved)) {
    return (
      <PendingApprovalPage
        onPreviewWebsite={(slug) => setPreviewFacilitySlug(slug || gym?.website_subdomain || gym?.slug)}
      />
    );
  }

  // If authenticated & approved (or Super Admin), render SaaS Dashboard Shell
  return (
    <Shell
      activeTab={activeTab}
      setActiveTab={(tab) => {
        setSelectedMemberId(null);
        setActiveTab(tab);
      }}
      isAiOpen={isAiOpen}
      setIsAiOpen={setIsAiOpen}
      aiInitialPrompt={aiInitialPrompt}
      isQuickCheckInOpen={isQuickCheckInOpen}
      setIsQuickCheckInOpen={setIsQuickCheckInOpen}
      onQuickAddMember={() => {
        setActiveTab('members');
        setIsQuickAddMemberOpen(true);
      }}
      onCheckInSuccess={() => {
        setDashboardRefreshTrigger((prev) => prev + 1);
      }}
    >
      {activeTab === 'superadmin' && (
        <SuperAdminPage onPreviewWebsite={(slug) => setPreviewFacilitySlug(slug)} />
      )}

      {activeTab === 'website' && (
        <GymWebsiteManagerPage onPreviewWebsite={(slug) => setPreviewFacilitySlug(slug)} />
      )}

      {activeTab === 'dashboard' && (
        <DashboardPage
          setActiveTab={setActiveTab}
          onQuickCheckIn={() => setIsQuickCheckInOpen(true)}
          onOpenAi={handleOpenAi}
          refreshTrigger={dashboardRefreshTrigger}
        />
      )}

      {activeTab === 'members' && (
        selectedMemberId ? (
          <MemberDetailPage
            memberId={selectedMemberId}
            onBack={() => setSelectedMemberId(null)}
          />
        ) : (
          <MembersPage
            onSelectMember={(id) => setSelectedMemberId(id)}
            isAddModalOpen={isQuickAddMemberOpen}
            setIsAddModalOpen={setIsQuickAddMemberOpen}
          />
        )
      )}

      {activeTab === 'memberships' && <PlansPage />}

      {activeTab === 'attendance' && (
        <AttendancePage
          isCheckInModalOpen={isQuickCheckInOpen}
          setIsCheckInModalOpen={setIsQuickCheckInOpen}
          refreshTrigger={dashboardRefreshTrigger}
        />
      )}

      {activeTab === 'payments' && <PaymentsPage />}

      {activeTab === 'trainers' && (
        <TrainersPage
          onSelectMember={(id) => {
            setActiveTab('members');
            setSelectedMemberId(id);
          }}
        />
      )}

      {activeTab === 'reports' && <ReportsPage />}

      {activeTab === 'settings' && <SettingsPage />}
    </Shell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
