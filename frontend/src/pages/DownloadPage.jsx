import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Apple,
  Laptop,
  Download,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Dumbbell,
  ArrowLeft,
  Sparkles,
  QrCode
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const DownloadPage = ({ onBack }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('all'); // all, android, iphone, windows
  const [networkInfo, setNetworkInfo] = useState(null);
  const [copiedLink, setCopiedLink] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    fetch('/api/settings/network-info')
      .then((res) => res.json())
      .then((data) => setNetworkInfo(data))
      .catch(() => {});
  }, []);

  const windowOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://gympulse-saas.onrender.com';
  const cloudUrl = networkInfo?.cloud_url || 'https://gympulse-saas.onrender.com';
  const currentPublicUrl = networkInfo?.public_url || windowOrigin;
  // For phone downloads, always prioritize the 24/7 cloud URL
  const phoneDownloadUrl = cloudUrl.startsWith('http') ? cloudUrl : currentPublicUrl;
  const windowsDownloadUrl = `${windowOrigin}/api/download/windows`;

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(key);
    toast.success('Link copied! Open on your device.');
    setTimeout(() => setCopiedLink(''), 2200);
  };

  const handleInstallAndroid = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        toast.success('GymPulse installed on Android!');
      }
      setDeferredPrompt(null);
    } else {
      navigator.clipboard.writeText(phoneDownloadUrl);
      toast.info('Link copied! Open in Google Chrome on your Android phone and tap "Install App".');
    }
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=6&data=${encodeURIComponent(phoneDownloadUrl)}`;

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-brand-500 selection:text-white flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-brand-500/25">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                GymPulse <span className="px-2 py-0.5 text-[10px] font-black bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">24/7 DOWNLOAD HUB</span>
              </div>
              <div className="text-[11px] text-slate-400">Install across Android, iPhone, Mac & Windows</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onBack ? (
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to App</span>
              </button>
            ) : (
              <a
                href="/"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Launch GymPulse</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 w-full flex-1">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Cloud Hosting 24/7 Online • No Same Wi-Fi Needed
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Download GymPulse <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              On Any Device, Anywhere
            </span>
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-400">
            Install on your mobile phone or download standalone for your Windows PC. Instant synchronization across all platforms.
          </p>
        </div>

        {/* 24/7 Cloud Direct URL Bar */}
        <div className="mb-10 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/30 shadow-xl shadow-emerald-950/20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">24/7 Cloud Hosting Public Address</div>
                <div className="text-[11px] text-slate-400 font-mono break-all">{phoneDownloadUrl}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleCopy(phoneDownloadUrl, 'cloud')}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/15"
              >
                {copiedLink === 'cloud' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink === 'cloud' ? 'Copied' : 'Copy Link'}</span>
              </button>
              <a
                href={phoneDownloadUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all shadow-md shadow-emerald-500/30"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open 24/7 Website</span>
              </a>
            </div>
          </div>
        </div>

        {/* Download Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. ANDROID CARD */}
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 flex flex-col justify-between hover:border-emerald-400 transition-all shadow-xl">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Android PWA / WebAPK</span>
                <h3 className="text-xl font-bold text-white mt-0.5">Android Phone & Tablet</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Native full-screen app with home screen icon and offline caching. No Play Store account required.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-white/5 space-y-2 text-xs text-slate-300">
                <div className="font-bold text-white text-xs">Easy Installation:</div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                  <span>Scan QR code with your Android camera or open link in Chrome.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                  <span>Tap <b>"Install app"</b> or Chrome menu <b>⋮</b> &rarr; <b>Install app</b>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
                  <span>App icon appears on your home screen ready to use!</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
              <button
                type="button"
                onClick={handleInstallAndroid}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Download className="w-4 h-4" />
                <span>Install on Android</span>
              </button>
              <button
                type="button"
                onClick={() => handleCopy(phoneDownloadUrl, 'android')}
                className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
              >
                {copiedLink === 'android' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink === 'android' ? 'Copied' : 'Copy Android Link'}</span>
              </button>
            </div>
          </div>

          {/* 2. APPLE iPHONE CARD */}
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 flex flex-col justify-between hover:border-slate-500 transition-all shadow-xl">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-md">
                <Apple className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">iOS Web App</span>
                <h3 className="text-xl font-bold text-white mt-0.5">iPhone & iPad (iOS)</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Adds directly to your iOS Home Screen. Opens in standalone full-screen mode without the Safari browser toolbar.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-white/5 space-y-2 text-xs text-slate-300">
                <div className="font-bold text-white text-xs">Easy Installation:</div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-white/20 text-white text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                  <span>Scan QR code with iPhone camera or open in <b>Safari</b>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-white/20 text-white text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                  <span>Tap Safari's <b>Share</b> icon (square with arrow <b>⎋</b>).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-white/20 text-white text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
                  <span>Tap <b>"Add to Home Screen"</b> &rarr; Tap <b>Add</b>.</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
              <button
                type="button"
                onClick={() => handleCopy(phoneDownloadUrl, 'iphone')}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-white/10"
              >
                {copiedLink === 'iphone' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink === 'iphone' ? 'Safari Link Copied!' : 'Copy iPhone Safari Link'}</span>
              </button>
              <a
                href={phoneDownloadUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Safari Now</span>
              </a>
            </div>
          </div>

          {/* 3. WINDOWS PC CARD */}
          <div className="bg-slate-900 border border-blue-500/40 rounded-3xl p-6 flex flex-col justify-between hover:border-blue-400 transition-all shadow-xl">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-md">
                <Laptop className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">Portable Windows (.ZIP)</span>
                <h3 className="text-xl font-bold text-white mt-0.5">Windows 10 / 11 PC</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Zero setup or Python required. Unzip and double-click <code>Launch_GymPulse.bat</code> to run locally on your desk.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-white/5 space-y-2 text-xs text-slate-300">
                <div className="font-bold text-white text-xs">Easy Installation:</div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                  <span>Click Download button below to get portable ZIP (~20 MB).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                  <span>Extract folder anywhere on your computer.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
                  <span>Double-click <b>Launch_GymPulse.bat</b> to start!</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
              <a
                href={windowsDownloadUrl}
                download="GymPulse_Windows_Portable.zip"
                className="w-full py-3 px-4 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                <Download className="w-4 h-4" />
                <span>Download for Windows (.zip)</span>
              </a>
              <button
                type="button"
                onClick={() => handleCopy(windowsDownloadUrl, 'win')}
                className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
              >
                {copiedLink === 'win' ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink === 'win' ? 'Copied' : 'Copy Download URL'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* QR Code Worldwide Scan Section */}
        <div className="mt-10 p-6 rounded-3xl bg-slate-900/60 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider">
              <QrCode className="w-3.5 h-3.5 text-emerald-400" /> Instant Camera Scan
            </div>
            <h4 className="text-lg font-bold text-white">Scan from your Android or iPhone Camera</h4>
            <p className="text-xs text-slate-400 max-w-md">
              Point your phone camera at this QR code to immediately load the 24/7 online website and download the app directly onto your device.
            </p>
          </div>
          <div className="p-3 bg-white rounded-2xl shadow-xl shrink-0 text-center">
            <img
              src={qrCodeUrl}
              alt="Scan for Mobile Download"
              className="w-36 h-36 object-contain mx-auto"
            />
            <span className="block text-[10px] font-black text-slate-900 mt-1 uppercase tracking-tight">
              Scan to Download
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 px-4 text-center text-xs text-slate-500 bg-slate-950">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>24/7 Verified Multi-Tenant Cloud Engine • GymPulse SaaS</span>
          </div>
          <div className="text-[11px] text-slate-600">
            Android PWA • iOS Web App • Windows Portable Desktop Edition
          </div>
        </div>
      </footer>
    </div>
  );
};
