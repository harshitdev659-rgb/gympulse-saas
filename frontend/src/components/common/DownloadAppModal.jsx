import React, { useState, useEffect } from 'react';
import {
  Download,
  Check,
  Copy,
  Laptop,
  Smartphone,
  Apple,
  Globe,
  ShieldCheck,
  QrCode,
  ExternalLink
} from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const DownloadAppModal = ({ isOpen, onClose }) => {
  const { gym } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('android');
  const [networkInfo, setNetworkInfo] = useState(null);
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedWin, setCopiedWin] = useState(false);
  const [copiedGymWebsite, setCopiedGymWebsite] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Capture PWA install prompt if supported on current browser
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Fetch live network & public tunnel info
  useEffect(() => {
    if (isOpen) {
      fetch('/api/settings/network-info')
        .then((res) => res.json())
        .then((data) => setNetworkInfo(data))
        .catch(() => {});
    }
  }, [isOpen]);

  const windowOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isLocal = windowOrigin.includes('localhost') || windowOrigin.includes('127.0.0.1');
  const isGitHubPages = windowOrigin.includes('github.io') || pathname.includes('/gympulse-saas');
  const baseSubpath = isGitHubPages ? '/gympulse-saas' : '';

  // Primary 24/7 permanent website domain for Apple (iPhone/iPad) and Android
  const official247Url = 'https://harshitdev659-rgb.github.io/gympulse-saas/app.html';
  const permanentReleaseUrl = 'https://github.com/harshitdev659-rgb/gympulse-saas/releases/download/v1.0.0/GymPulse_Windows_Portable.zip';

  // Always use the official 24/7 website domain for Apple and Android
  const phoneDownloadUrl = official247Url;

  const windowsDownloadUrl = isLocal
    ? `${windowOrigin}/api/download/windows`
    : permanentReleaseUrl;

  const gymSlug = (gym?.website_subdomain || gym?.slug || '').trim();
  const gymPublicUrl = gymSlug ? `${windowOrigin}${baseSubpath}/app.html?facility=${encodeURIComponent(gymSlug)}` : null;

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'public') {
      setCopiedPublic(true);
      toast.success('App link copied! Open on your phone to install.');
      setTimeout(() => setCopiedPublic(false), 2200);
    } else if (type === 'gymWebsite') {
      setCopiedGymWebsite(true);
      toast.success('Facility public website link copied!');
      setTimeout(() => setCopiedGymWebsite(false), 2200);
    } else {
      setCopiedWin(true);
      toast.success('Windows download link copied!');
      setTimeout(() => setCopiedWin(false), 2200);
    }
  };

  const handleInstallAndroidPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        toast.success('GymPulse installed successfully on Android!');
      }
      setDeferredPrompt(null);
    } else {
      navigator.clipboard.writeText(phoneDownloadUrl);
      toast.info('Link copied! Open on your Android phone in Chrome and tap "Install app"');
    }
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=4&data=${encodeURIComponent(phoneDownloadUrl)}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Download & Install GymPulse App"
      maxWidth="max-w-lg"
    >
      <div className="space-y-4 text-slate-800">
        {/* Visible Download & App Access URL Card */}
        <div className="p-4 bg-emerald-50/80 border-2 border-emerald-400 rounded-2xl shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
              </span>
              <span className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                Official App URL (Visible Link)
              </span>
            </div>
            <span className="px-2 py-0.5 text-[9px] font-extrabold bg-emerald-200 text-emerald-900 rounded border border-emerald-300 uppercase">
              24/7 Verified
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 px-3 py-2 text-xs font-mono font-black text-slate-950 bg-white border border-slate-300 rounded-xl select-all break-all shadow-inner leading-relaxed">
              {phoneDownloadUrl}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleCopy(phoneDownloadUrl, 'public')}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                {copiedPublic ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copiedPublic ? 'Copied' : 'Copy'}</span>
              </button>
              <a
                href={`${windowOrigin}/download`}
                className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs transition-colors border border-slate-200"
                title="Open Full Download Hub"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                <span>Hub</span>
              </a>
            </div>
          </div>
          <p className="text-[11px] text-emerald-800 font-medium">
            Open this URL on your Android (Chrome) or iPhone (Safari) to install the app directly.
          </p>
        </div>

        {/* Dedicated Live Gym Website Link (Prominently Shown) */}
        {gymPublicUrl && (
          <div className="p-4 bg-indigo-50/80 border-2 border-indigo-300 rounded-2xl shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-950">
                <Globe className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-black uppercase tracking-wider">
                  Your Facility's Live Website
                </span>
              </div>
              <span className="px-2 py-0.5 text-[9px] font-extrabold bg-indigo-200 text-indigo-900 rounded border border-indigo-300 uppercase">
                Public Website
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1 px-3 py-2 text-xs font-mono font-black text-indigo-950 bg-white border border-indigo-200 rounded-xl select-all break-all shadow-inner leading-relaxed">
                {gymPublicUrl}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(gymPublicUrl, 'gymWebsite')}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  {copiedGymWebsite ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedGymWebsite ? 'Copied' : 'Copy'}</span>
                </button>
                <a
                  href={gymPublicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-indigo-900 font-bold text-xs transition-colors border border-indigo-200"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Open</span>
                </a>
              </div>
            </div>
            <p className="text-[11px] text-indigo-800 font-medium">
              Share this website link with prospective members so they can join your gym online.
            </p>
          </div>
        )}

        {/* Device Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'android'
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Android</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('iphone')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'iphone'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Apple className="w-4 h-4 text-slate-900" />
            <span>iPhone (iOS)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('windows')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'windows'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Laptop className="w-4 h-4 text-blue-600" />
            <span>Windows PC</span>
          </button>
        </div>

        {/* 1. ANDROID DOWNLOAD & INSTALL VIEW */}
        {activeTab === 'android' && (
          <div className="space-y-3.5">
            <div className="p-4 bg-gradient-to-br from-emerald-50/90 to-teal-50/50 border border-emerald-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Download on Android</span>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-200 text-emerald-800 rounded">
                  PWA WebAPK
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Installs GymPulse directly onto your Android phone or tablet with its native icon in your app drawer and full-screen standalone mode.
              </p>

              <button
                type="button"
                onClick={handleInstallAndroidPwa}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/25 transition-all text-center"
              >
                <Download className="w-4 h-4" />
                <span>Install GymPulse on Android</span>
              </button>
            </div>

            {/* QR Code for Android */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center gap-4">
              <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-xs shrink-0 text-center">
                <img
                  src={qrCodeUrl}
                  alt="Scan for Android"
                  className="w-24 h-24 object-contain mx-auto"
                />
                <span className="block text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-tight">
                  Android Camera Scan
                </span>
              </div>

              <div className="space-y-1.5 flex-1 text-xs text-slate-700">
                <div className="font-bold text-slate-900 text-xs">How to install on your Android phone:</div>
                <p>1. Point your phone camera at the QR code (or open the public link above).</p>
                <p>2. In <b>Google Chrome</b>, tap the bottom banner <b>"Add GymPulse to Home screen"</b> (or tap Chrome menu <b>⋮</b> &rarr; <b>Install app</b>).</p>
                <p>3. Tap <b>Install</b> &rarr; The app is downloaded onto your phone!</p>
              </div>
            </div>
          </div>
        )}

        {/* 2. iPHONE (APPLE iOS) DOWNLOAD & INSTALL VIEW */}
        {activeTab === 'iphone' && (
          <div className="space-y-3.5">
            <div className="p-4 bg-gradient-to-br from-slate-100 to-slate-200/80 border border-slate-300 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Apple className="w-4 h-4 text-slate-900" />
                  <span>Download on iPhone & iPad</span>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-slate-300 text-slate-900 rounded">
                  iOS Web App
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Add GymPulse to your iPhone Home Screen with the GymPulse app icon. Launches in native full-screen mode without the Safari address bar.
              </p>

              <button
                type="button"
                onClick={() => handleCopy(phoneDownloadUrl, 'public')}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md shadow-slate-900/25 transition-all text-center"
              >
                <Copy className="w-4 h-4" />
                <span>Copy iPhone Safari Link</span>
              </button>
            </div>

            {/* QR Code for iPhone */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center gap-4">
              <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-xs shrink-0 text-center">
                <img
                  src={qrCodeUrl}
                  alt="Scan for iPhone"
                  className="w-24 h-24 object-contain mx-auto"
                />
                <span className="block text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-tight">
                  iPhone Camera Scan
                </span>
              </div>

              <div className="space-y-1.5 flex-1 text-xs text-slate-700">
                <div className="font-bold text-slate-900 text-xs">How to install on your iPhone / iPad:</div>
                <p>1. Point your iPhone camera at the QR code to open in <b>Safari</b>.</p>
                <p>2. Tap the <b>Share</b> button (square box with arrow up <b>⎋</b> at bottom of Safari).</p>
                <p>3. Scroll down and tap <b>"Add to Home Screen"</b> (<b>+</b>).</p>
                <p>4. Tap <b>Add</b> &rarr; GymPulse is placed directly on your iPhone Home Screen!</p>
              </div>
            </div>
          </div>
        )}

        {/* 3. WINDOWS DOWNLOAD VIEW */}
        {activeTab === 'windows' && (
          <div className="space-y-3.5">
            <div className="p-4 bg-gradient-to-br from-blue-50/90 to-indigo-50/50 border border-blue-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-blue-950 text-sm flex items-center gap-1.5">
                  <Laptop className="w-4 h-4 text-blue-600" />
                  <span>Windows Standalone Portable App</span>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-blue-200 text-blue-800 rounded">
                  ~20 MB ZIP
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Includes embedded runtime. Unzip and run standalone on any Windows PC — zero Python or installation required.
              </p>

              <a
                href={windowsDownloadUrl}
                download="GymPulse_Windows_Portable.zip"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/25 transition-all text-center"
              >
                <Download className="w-4 h-4" />
                <span>Download for Windows (.zip)</span>
              </a>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
                Direct Windows Download URL:
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 px-3 py-2 text-xs font-mono font-black text-slate-900 bg-white border border-slate-300 rounded-lg select-all break-all shadow-inner leading-relaxed">
                  {windowsDownloadUrl}
                </div>
                <Button
                  onClick={() => handleCopy(windowsDownloadUrl, 'win')}
                  size="sm"
                  variant="secondary"
                  className="shrink-0 text-xs font-bold"
                >
                  {copiedWin ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  {copiedWin ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Verified Public & Local Engine</span>
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
