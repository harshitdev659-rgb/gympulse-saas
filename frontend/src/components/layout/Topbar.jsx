import React, { useState, useEffect } from 'react';
import {
  Menu,
  Sparkles,
  UserPlus,
  QrCode,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Download,
  Globe,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../common/Button';
import { DownloadAppModal } from '../common/DownloadAppModal';
import { api } from '../../services/api';

export const Topbar = ({ onToggleSidebar, onOpenAi, onQuickCheckIn, onQuickAddMember, activeTab, setActiveTab }) => {
  const { gym, user, switchFacility } = useAuth();
  const toast = useToast();
  const isSuperAdmin = user?.is_superadmin || user?.role === 'superadmin';

  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [copiedApp, setCopiedApp] = useState(false);
  const [copiedWebsite, setCopiedWebsite] = useState(false);
  const [platformGyms, setPlatformGyms] = useState([]);
  const [isGymDropdownOpen, setIsGymDropdownOpen] = useState(false);

  useEffect(() => {
    if (isSuperAdmin) {
      api.getPlatformGyms()
        .then((data) => {
          if (Array.isArray(data)) setPlatformGyms(data);
        })
        .catch(() => {});
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    api.getNetworkInfo()
      .then((data) => setNetworkInfo(data))
      .catch(() => {
        setNetworkInfo({
          local_ip: window.location.hostname || '127.0.0.1',
          mobile_url: window.location.origin
        });
      });
  }, []);

  // Determine ideal URL: If already on a public URL, use it; otherwise use public_url or mobile_url
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isLocalOrigin = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1');
  const isGitHubPages = currentOrigin.includes('github.io') || pathname.includes('/gympulse-saas');
  const baseSubpath = isGitHubPages ? '/gympulse-saas' : '';
  const appUrl = ((isLocalOrigin && networkInfo?.public_url)
    ? networkInfo.public_url
    : (isLocalOrigin && networkInfo?.mobile_url ? networkInfo.mobile_url : currentOrigin)).replace(/\/+$/, '');

  const gymSlug = (gym?.website_subdomain || gym?.slug || 'gymfitness').trim();
  const websiteUrl = gymSlug ? `${currentOrigin}${baseSubpath}/app.html?facility=${encodeURIComponent(gymSlug)}` : null;

  const handleCopyApp = () => {
    navigator.clipboard.writeText(appUrl);
    setCopiedApp(true);
    toast.success('App link copied! Send this link to your phone.');
    setTimeout(() => setCopiedApp(false), 2000);
  };

  const handleCopyWebsite = () => {
    if (!websiteUrl) return;
    navigator.clipboard.writeText(websiteUrl);
    setCopiedWebsite(true);
    toast.success('Public website link copied!');
    setTimeout(() => setCopiedWebsite(false), 2000);
  };

  // Dismiss open topbar modals on global dismiss-modals event
  useEffect(() => {
    const handleDismiss = () => setIsMobileModalOpen(false);
    window.addEventListener('gympulse:dismiss-modals', handleDismiss);
    return () => window.removeEventListener('gympulse:dismiss-modals', handleDismiss);
  }, []);

  const handleDownloadClick = () => {
    window.dispatchEvent(new CustomEvent('gympulse:dismiss-modals'));
    setIsMobileModalOpen(true);
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl lg:hidden transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <img src="/gympulse.png" alt="GymPulse Logo" className="w-8 h-8 rounded-xl object-contain shadow-xs border border-slate-200/80 bg-slate-900 shrink-0" />
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {activeTab === 'superadmin' ? 'Platform Mode:' : 'Current Facility:'}
              </span>
              <span className="text-sm font-black text-slate-900">
                {activeTab === 'superadmin' ? 'Super Admin Console' : (gym?.name || 'gymfitness')}
              </span>
              <span className="px-2 py-0.5 text-[11px] font-bold bg-brand-50 text-brand-700 rounded-md border border-brand-200/60">
                ₹ {gym?.currency || 'INR'}
              </span>

              {/* SuperAdmin Facility Switcher Dropdown */}
              {isSuperAdmin && (
                <div className="relative ml-2">
                  <button
                    type="button"
                    onClick={() => setIsGymDropdownOpen(!isGymDropdownOpen)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold transition-all shadow-xs cursor-pointer"
                    title="Switch facility context to inspect any gym"
                  >
                    <span>🏛️ Switch Gym: {gym?.name || 'Select Facility'}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-purple-700" />
                  </button>

                  {isGymDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Select Facility To Inspect</span>
                        <span className="text-[10px] font-bold text-purple-600">{platformGyms.length} Registered</span>
                      </div>
                      <div className="max-h-64 overflow-y-auto py-1 divide-y divide-slate-50">
                        {platformGyms.map((g) => {
                          const isCurrent = gym?.id === g.id;
                          return (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => {
                                switchFacility(g);
                                setIsGymDropdownOpen(false);
                                toast.success(`Switched active context to ${g.name}!`);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-purple-50/60 transition-colors ${
                                isCurrent ? 'bg-purple-50 font-black text-purple-900' : 'text-slate-700'
                              }`}
                            >
                              <div className="truncate mr-2">
                                <div className="font-bold truncate text-slate-900">{g.name}</div>
                                <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                  <span>#{g.id}</span>
                                  <span>&bull;</span>
                                  <span className="capitalize">{g.plan_tier || 'starter'}</span>
                                  <span>&bull;</span>
                                  <span className={g.is_approved ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                                    {g.is_approved ? 'Active' : 'Pending'}
                                  </span>
                                </div>
                              </div>
                              {isCurrent && <Check className="w-4 h-4 text-purple-600 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isSuperAdmin && activeTab !== 'superadmin' && (
                <button
                  type="button"
                  onClick={() => setActiveTab && setActiveTab('superadmin')}
                  className="ml-1 px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black hover:bg-amber-200 transition-all cursor-pointer"
                  title="Return to Super Admin Platform Control"
                >
                  &larr; Super Admin Console
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Multi-Platform Download App Button */}
          <button
            type="button"
            onClick={handleDownloadClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-300 bg-brand-50 hover:bg-brand-100 text-brand-900 text-xs font-bold transition-all shadow-xs"
            title="Download App for Windows, Android & Apple"
          >
            <Download className="w-3.5 h-3.5 text-brand-600" />
            <span className="hidden xs:inline">Download App</span>
            <span className="xs:hidden">App</span>
          </button>

          {/* Dedicated Live Gym Website Button */}
          {websiteUrl && (
            <div className="flex items-center bg-indigo-50 border border-indigo-200 rounded-xl overflow-hidden shadow-xs">
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-indigo-900 hover:bg-indigo-100/70 transition-colors"
                title={`Visit Live Gym Website: ${websiteUrl}`}
              >
                <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="hidden sm:inline">Gym Website</span>
                <span className="sm:hidden">Website</span>
                <ExternalLink className="w-3 h-3 text-indigo-400 shrink-0" />
              </a>
              <button
                type="button"
                onClick={handleCopyWebsite}
                className="p-1.5 text-indigo-700 hover:bg-indigo-100 border-l border-indigo-200 transition-colors"
                title="Copy Gym Website URL"
              >
                {copiedWebsite ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          {/* Quick Check-In Button - ALWAYS PROMINENT */}
          <Button
            onClick={onQuickCheckIn}
            variant="secondary"
            size="sm"
            icon={QrCode}
            className="border-2 border-slate-300 hover:border-brand-600 hover:text-brand-600 font-black shadow-xs text-xs"
          >
            <span>Check-In</span>
          </Button>

          {/* Quick Add Member Button */}
          <Button
            onClick={onQuickAddMember}
            variant="primary"
            size="sm"
            icon={UserPlus}
          >
            <span className="hidden xs:inline">Add Member</span>
          </Button>

          {/* AI Assistant Quick Toggle */}
          <button
            onClick={onOpenAi}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-200/80 text-brand-700 hover:border-brand-400 text-xs font-bold transition-all shadow-sm"
            title="Open AI Gym Assistant"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-600 animate-pulse" />
            <span className="hidden md:inline">AI Assistant</span>
          </button>
        </div>
      </header>

      {/* Download & Mobile App Modal */}
      <DownloadAppModal
        isOpen={isMobileModalOpen}
        onClose={() => setIsMobileModalOpen(false)}
        targetUrl={appUrl}
        networkInfo={networkInfo}
      />
    </>
  );
};
