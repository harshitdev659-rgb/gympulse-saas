import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Clock, 
  CheckCircle2, 
  Globe, 
  ArrowUpRight, 
  RefreshCw, 
  LogOut, 
  ShieldAlert, 
  Mail, 
  Phone, 
  Building2,
  Sparkles,
  ArrowLeft,
  QrCode,
  CreditCard,
  Banknote,
  Copy,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

export const PendingApprovalPage = ({ onPreviewWebsite, onBackToLanding, onNavigateLogin }) => {
  const { user, gym, logout, refreshGymProfile } = useAuth();
  const toast = useToast();
  const [isChecking, setIsChecking] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [showQrDetails, setShowQrDetails] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await api.getPlatformPaymentSettings();
        if (settings) {
          setPaymentSettings(settings);
        }
      } catch (e) {}
    };
    fetchSettings();
  }, []);

  const handleCheckStatus = async () => {
    setIsChecking(true);
    try {
      await refreshGymProfile();
      // Wait for state update / check current gym
      if (gym?.is_approved || gym?.approval_status === 'approved') {
        toast.success('🎉 Facility Approved! Payment has been verified. Welcome aboard!');
      } else {
        toast.info('Checked status: Payment verification is still pending by the Super Admin.');
      }
    } catch (e) {
      toast.error('Could not check status right now.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleCopyUpi = () => {
    if (paymentSettings?.upi_id) {
      navigator.clipboard?.writeText(paymentSettings.upi_id);
      toast.success(`Copied UPI ID: ${paymentSettings.upi_id}`);
    }
  };

  const publicUrl = `/facility/${gym?.website_subdomain || gym?.slug}`;

  const planTierName = gym?.plan_tier === 'business' 
    ? 'Enterprise (₹5,999/mo)' 
    : gym?.plan_tier === 'starter' 
    ? 'Starter (₹999/mo)' 
    : 'Pro Facility (₹2,499/mo)';

  const paymentMethodLabel = gym?.registration_payment_method === 'card'
    ? 'Credit / Debit Card'
    : gym?.registration_payment_method === 'cash'
    ? 'Cash / Bank Wire'
    : 'Online QR / UPI';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 text-white flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="mr-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-xs font-bold transition-all border border-white/15 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Landing</span>
            </button>
          )}

          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-white font-black shadow-lg shadow-brand-500/25">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-white">GymPulse SaaS</span>
            <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/30">
              PENDING APPROVAL
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateLogin && (
            <button
              onClick={onNavigateLogin}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/15 text-slate-300 hover:text-white hover:bg-white/10 text-xs font-bold transition-all cursor-pointer"
            >
              Switch Account
            </button>
          )}
          <button
            onClick={logout}
            className="px-3.5 py-1.5 rounded-xl border border-white/20 text-slate-300 hover:text-white hover:bg-white/10 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </header>

      {/* Main Review Card */}
      <main className="max-w-3xl w-full mx-auto px-4 py-8">
        <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-extrabold mb-6">
            <Clock className="w-4 h-4 animate-pulse" />
            Awaiting Super Admin Payment Verification & Approval
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
            Facility Registration Received
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Thank you for registering <strong>{gym?.name}</strong> with GymPulse SaaS. Your registration details and payment reference have been queued for platform Super Admin verification. Once payment is confirmed, your operational dashboard, attendance kiosk, and athlete roster will unlock automatically.
          </p>

          {/* Details Overview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Facility Details</div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand-400" /> {gym?.name}
              </div>
              <div className="text-xs text-slate-400 mt-1">Applicant: {user?.full_name || user?.name}</div>
              <div className="text-xs text-slate-400">{user?.email} • {user?.phone || 'No phone'}</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payment & Plan Status</div>
              {gym?.payment_verified ? (
                <div className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Payment Verified ({planTierName})
                </div>
              ) : (
                <div className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 animate-pulse" /> Payment Pending Admin Verification
                </div>
              )}
              <div className="text-xs text-slate-300 mt-1">Plan: <strong>{planTierName}</strong></div>
              <div className="text-xs text-slate-400">
                Method: <strong>{paymentMethodLabel}</strong>
                {gym?.registration_payment_ref && (
                  <span className="font-mono text-slate-300 ml-1">({gym.registration_payment_ref})</span>
                )}
              </div>
              <div className="text-[11px] text-amber-300/80 mt-1">
                Status: {gym?.payment_verified ? 'Verified & Authorized' : 'Awaiting SuperAdmin Payment Confirmation'}
              </div>
            </div>
          </div>

          {/* SuperAdmin Payment QR Reference Box */}
          {paymentSettings && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <QrCode className="w-4 h-4 text-brand-400" />
                  <span>Platform Payment Details (QR &amp; UPI)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQrDetails(!showQrDetails)}
                  className="text-xs font-bold text-brand-400 hover:text-brand-300 underline"
                >
                  {showQrDetails ? 'Hide Payment Details' : 'View QR & Payment Details'}
                </button>
              </div>

              {showQrDetails && (
                <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center gap-4 text-xs">
                  {paymentSettings.upi_qr_url && (
                    <div className="w-28 h-28 bg-white p-1 rounded-xl flex-shrink-0">
                      <img src={paymentSettings.upi_qr_url} alt="Admin UPI QR" className="w-full h-full object-contain" />
                    </div>
                  )}
                  <div className="space-y-1.5 text-center sm:text-left">
                    <div className="text-slate-300">
                      Payee: <strong>{paymentSettings.upi_name || 'GymPulse Platform SaaS'}</strong>
                    </div>
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <code className="px-2 py-0.5 rounded bg-black/40 border border-white/10 font-mono text-xs text-amber-300">
                        {paymentSettings.upi_id || 'gympulse.admin@upi'}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="p-1 rounded bg-white/10 hover:bg-white/20 text-slate-300"
                        title="Copy UPI ID"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Bank Wire: {paymentSettings.bank_name} • A/C: {paymentSettings.bank_account} • IFSC: {paymentSettings.bank_ifsc}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Auto-Generated Website Feature Box */}
          <div className="bg-gradient-to-r from-brand-950/60 to-indigo-950/60 border border-brand-500/30 rounded-2xl p-5 mb-8">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    Your Dedicated Public Website is Live!
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-xs text-slate-300">
                    Prospective members can already view your plans and submit online joining inquiries.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onPreviewWebsite ? onPreviewWebsite(gym?.website_subdomain || gym?.slug) : window.open(publicUrl, '_blank')}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-brand-500/30 cursor-pointer"
              >
                Preview Live Website <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 text-xs font-mono text-brand-300">
              <span className="text-slate-500">Public URL:</span>
              <span className="underline select-all">{typeof window !== 'undefined' ? `${window.location.origin}${publicUrl}` : publicUrl}</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3 flex-wrap justify-between pt-2">
            <div className="flex items-center gap-3">
              <button
                onClick={handleCheckStatus}
                disabled={isChecking}
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-900 text-xs font-extrabold transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                {isChecking ? 'Verifying with Platform...' : 'Check Approval Status'}
              </button>

              {onBackToLanding && (
                <button
                  type="button"
                  onClick={onBackToLanding}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/15 cursor-pointer"
                >
                  &larr; Return to Home
                </button>
              )}
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" /> Support: admin@gympulse.com
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-4 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} GymPulse SaaS Platform. Enterprise Gym Management Network.
      </footer>
    </div>
  );
};
