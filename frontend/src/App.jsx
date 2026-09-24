import React, { useState, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Shell } from './components/layout/Shell';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { MembersPage } from './pages/MembersPage';
import { PendingApprovalPage } from './pages/PendingApprovalPage';

// Code-split dynamic routes for blazing fast initial bundle & load times
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const MemberDetailPage = lazy(() => import('./pages/MemberDetailPage').then(m => ({ default: m.MemberDetailPage })));
const PlansPage = lazy(() => import('./pages/PlansPage').then(m => ({ default: m.PlansPage })));
const AttendancePage = lazy(() => import('./pages/AttendancePage').then(m => ({ default: m.AttendancePage })));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage').then(m => ({ default: m.PaymentsPage })));
const TrainersPage = lazy(() => import('./pages/TrainersPage').then(m => ({ default: m.TrainersPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const SuperAdminPage = lazy(() => import('./pages/SuperAdminPage').then(m => ({ default: m.SuperAdminPage })));
const GymPublicWebsitePage = lazy(() => import('./pages/GymPublicWebsitePage').then(m => ({ default: m.GymPublicWebsitePage })));
const GymWebsiteManagerPage = lazy(() => import('./pages/GymWebsiteManagerPage').then(m => ({ default: m.GymWebsiteManagerPage })));
const DownloadPage = lazy(() => import('./pages/DownloadPage').then(m => ({ default: m.DownloadPage })));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[300px] py-12">
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white border border-slate-200/80 text-xs font-bold text-slate-700 shadow-xs">
      <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      <span>Loading module...</span>
    </div>
  </div>
);

function AppContent() {
  const { user, gym, isAuthenticated, loading, login, logout } = useAuth();
  
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

  // When gym becomes approved or session is established, direct to console
  React.useEffect(() => {
    if (gym?.is_approved) {
      setIsViewingLanding(false);
    }
  }, [gym?.is_approved]);

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
      <Suspense fallback={<LoadingFallback />}>
        <DownloadPage
          onBack={() => {
            setIsDownloadCenter(false);
            try {
              window.history.pushState({}, '', '/');
            } catch (e) {}
          }}
        />
      </Suspense>
    );
  }

  // If viewing a gym's public website or previewing it
  if (previewFacilitySlug || publicFacilitySlug) {
    return (
      <Suspense fallback={<LoadingFallback />}>
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
      </Suspense>
    );
  }

  // Viewing public landing while retaining device login session
  const [isViewingLanding, setIsViewingLanding] = useState(false);

  // If not authenticated, render public pages
  if (!isAuthenticated) {
    if (publicView === 'login') {
      return (
        <LoginPage
          onNavigateRegister={() => setPublicView('register')}
          onNavigateForgotPassword={() => setPublicView('forgot-password')}
          onBackToLanding={() => setPublicView('landing')}
          onLoginSuccess={(authData) => {
            setIsViewingLanding(false);
            setPublicView('landing');
            if (authData?.user?.is_superadmin || authData?.user?.role === 'superadmin') {
              setActiveTab('superadmin');
            } else {
              setActiveTab('dashboard');
            }
          }}
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
        <Suspense fallback={<LoadingFallback />}>
          <ForgotPasswordPage
            onNavigateLogin={() => setPublicView('login')}
            onBackToLanding={() => setPublicView('landing')}
          />
        </Suspense>
      );
    }
    return (
      <LandingPage
        onNavigateLogin={() => setPublicView('login')}
        onNavigateRegister={() => setPublicView('register')}
      />
    );
  }

  // If authenticated user chooses to view the landing page, retain device session
  if (isViewingLanding) {
    return (
      <div className="relative">
        <div className="bg-slate-900 border-b border-brand-500/30 px-4 py-2.5 flex items-center justify-between text-xs text-white sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Device Session Active: Signed in as <strong>{user?.name || user?.email}</strong> ({gym?.name || (isSuperAdmin ? 'Platform Super Admin' : 'Gym Facility')})</span>
            {gym && !gym?.is_approved && !isSuperAdmin && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                PENDING APPROVAL
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsViewingLanding(false)}
              className="px-3 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold transition-all shadow-xs cursor-pointer"
            >
              &larr; Return to {isSuperAdmin ? 'SuperAdmin Console' : gym?.is_approved ? 'Dashboard' : 'Approval Status Screen'}
            </button>
            <button
              onClick={() => {
                logout();
                setIsViewingLanding(false);
              }}
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white font-semibold transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
        <LandingPage
          onNavigateLogin={() => setIsViewingLanding(false)}
          onNavigateRegister={() => setIsViewingLanding(false)}
          currentUser={user}
        />
      </div>
    );
  }

  // If gym registration is pending approval and user is NOT platform super admin:
  if (!isSuperAdmin && (gym?.approval_status === 'pending' || !gym?.is_approved)) {
    return (
      <PendingApprovalPage
        onPreviewWebsite={(slug) => setPreviewFacilitySlug(slug || gym?.website_subdomain || gym?.slug)}
        onBackToLanding={() => {
          setIsViewingLanding(true);
        }}
        onNavigateLogin={() => {
          logout();
          setPublicView('login');
        }}
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
      onPreviewWebsite={(slug) => setPreviewFacilitySlug(slug || gym?.website_subdomain || gym?.slug)}
    >
      <ErrorBoundary onReset={() => setActiveTab('dashboard')}>
        <Suspense fallback={<LoadingFallback />}>
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
              onPreviewWebsite={(slug) => setPreviewFacilitySlug(slug || gym?.website_subdomain || gym?.slug)}
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
        </Suspense>
      </ErrorBoundary>
    </Shell>
  );
}

export default function App() {
  return (
    <ErrorBoundary onReset={() => window.location.reload()}>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
