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
  Globe
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../common/Button';
import { DownloadAppModal } from '../common/DownloadAppModal';
import { api } from '../../services/api';

export const Topbar = ({ onToggleSidebar, onOpenAi, onQuickCheckIn, onQuickAddMember }) => {
  const { gym, user } = useAuth();
  const toast = useToast();
  const isSuperAdmin = user?.is_superadmin || user?.role === 'superadmin';

  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [copiedApp, setCopiedApp] = useState(false);
  const [copiedWebsite, setCopiedWebsite] = useState(false);

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

  const gymSlug = (gym?.website_subdomain || gym?.slug || '').trim();
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

  const handleDownloadClick = () => {
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
                {isSuperAdmin ? 'Platform Mode:' : 'Current Facility:'}
              </span>
              <span className="text-sm font-bold text-slate-800">
                {isSuperAdmin ? 'Super Admin Console' : (gym?.name || 'Facility')}
              </span>
              <span className="px-2 py-0.5 text-[11px] font-bold bg-brand-50 text-brand-700 rounded-md border border-brand-200/60">
                ₹ {gym?.currency || 'INR'}
              </span>
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
          {!isSuperAdmin && websiteUrl && (
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

          {/* Quick Check-In Button */}
          <Button
            onClick={onQuickCheckIn}
            variant="secondary"
            size="sm"
            icon={QrCode}
            className="hidden sm:inline-flex border-slate-300 hover:border-brand-500 hover:text-brand-600"
          >
            Check-In
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
