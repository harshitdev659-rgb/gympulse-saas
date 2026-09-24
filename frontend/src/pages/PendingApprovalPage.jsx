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
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmittingRef, setIsSubmittingRef] = useState(false);
  const [newPaymentRef, setNewPaymentRef] = useState(gym?.registration_payment_ref || '');
  const [newPaymentMethod, setNewPaymentMethod] = useState(gym?.registration_payment_method || 'qr_code');

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

  // Automatic background polling & cross-tab sync so user is instantly redirected the second SuperAdmin approves
  useEffect(() => {
    if (gym?.is_approved || gym?.approval_status === 'approved') return;

    let isMounted = true;
    const checkApproval = async () => {
      try {
        const data = await api.getMe();
        if (data?.gym && (data.gym.is_approved || data.gym.approval_status === 'approved')) {
          if (isMounted) {
            await refreshGymProfile();
            toast.success('🎉 Request approved! Directing you to your gym management dashboard...');
          }
        }
      } catch (e) {}
    };

    const interval = setInterval(checkApproval, 2000);

    const handleSync = () => {
      checkApproval();
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('gympulse_db_updated', handleSync);

    let bc = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('gympulse_channel');
        bc.onmessage = () => checkApproval();
      }
    } catch (e) {}

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('gympulse_db_updated', handleSync);
      if (bc) {
        try { bc.close(); } catch (e) {}
      }
    };
  }, [gym?.is_approved, gym?.approval_status]);

  const handleCheckStatus = async () => {
    setIsChecking(true);
    try {
      const data = await refreshGymProfile();
      if (data?.gym && (data.gym.is_approved || data.gym.approval_status === 'approved')) {
        toast.success('🎉 Facility Approved! Directing you to your gym management dashboard...');
      } else {
        toast.info('Checked status: Awaiting Super Admin payment verification.');
      }
    } catch (e) {
      toast.error('Could not check status right now.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmitPaymentRef = async (e) => {
    e.preventDefault();
    if (!newPaymentRef.trim()) {
      toast.error('Please enter a transaction ID, UPI UTR number, or cash collection note.');
      return;
    }
    setIsSubmittingRef(true);
    try {
      await api.submitPaymentRef({
        payment_ref: newPaymentRef.trim(),
        payment_method: newPaymentMethod
      });
      await refreshGymProfile();
      toast.success('🚀 Payment reference submitted! Platform Super Admin has been notified immediately.');
      setShowSubmitModal(false);
    } catch (err) {
      toast.error(err.message || 'Failed to submit payment reference.');
    } finally {
      setIsSubmittingRef(false);
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

  const cashAmount = gym?.plan_tier === 'business' 
    ? '₹5,999' 
    : gym?.plan_tier === 'starter' 
    ? '₹999' 
    : '₹2,499';

  const paymentMethodLabel = gym?.registration_payment_method === 'card'
    ? 'Credit / Debit Card'
    : gym?.registration_payment_method === 'cash'
    ? 'Direct Cash Payment'
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

          {/* Payment Details Box */}
          {gym?.registration_payment_method === 'cash' ? (
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-5 mb-6 text-white shadow-lg">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <div className="flex items-center gap-2 text-sm font-extrabold text-emerald-400">
                  <Banknote className="w-5 h-5 text-emerald-400" />
                  <span>Direct Cash Payment Pending</span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Awaiting Admin Collection
                </span>
              </div>
              <div className="bg-white/10 rounded-xl p-4 border border-white/10 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
                    Amount Needed to Pay in Cash
                  </span>
                  <div className="text-3xl font-black text-emerald-400 mt-0.5">
                    {cashAmount}
                    <span className="text-xs font-bold text-slate-300 ml-2 font-sans">
                      ({planTierName})
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                Please hand over the exact subscription amount of <strong className="text-emerald-300">{cashAmount}</strong> directly in cash to the platform administrator. Once received, your facility dashboard will unlock automatically.
              </p>
              {gym?.registration_payment_ref && (
                <div className="mt-2 text-xs text-slate-400 font-mono">
                  Cash Note: <span className="text-white">{gym.registration_payment_ref}</span>
                </div>
              )}
            </div>
          ) : paymentSettings ? (
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
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Payment Confirmation & Direct UTR Submission Card */}
          <div className="bg-gradient-to-r from-brand-900/60 via-indigo-900/50 to-slate-900/80 border border-brand-500/40 rounded-2xl p-5 mb-6 text-white shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-black text-brand-300 uppercase tracking-wider mb-1">
                  <Sparkles className="w-4 h-4 text-brand-400" />
                  Instant Payment Confirmation
                </div>
                <h3 className="text-base font-black text-white">
                  Paid via Online QR, UPI, Card, or Cash?
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-md">
                  Submit your transaction UTR reference number or cash receipt note so the Platform Super Admin is notified immediately to verify and approve your facility.
                </p>
                {gym?.registration_payment_ref && (
                  <div className="mt-2 text-xs text-slate-300">
                    Current Reference on File: <code className="bg-black/50 text-amber-300 px-2 py-0.5 rounded font-mono text-xs border border-white/10">{gym.registration_payment_ref}</code>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setNewPaymentRef(gym?.registration_payment_ref || '');
                  setNewPaymentMethod(gym?.registration_payment_method || 'qr_code');
                  setShowSubmitModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-xs shadow-lg shadow-brand-500/30 transition-all flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>{gym?.registration_payment_ref ? 'Update Payment Reference' : 'I Have Paid / Submit Reference'}</span>
              </button>
            </div>
          </div>

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

      {/* Submit / Update Payment Reference Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/20 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-white shadow-2xl relative">
            <button
              onClick={() => setShowSubmitModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 text-lg font-bold"
            >
              &times;
            </button>

            <div className="flex items-center gap-2 text-brand-400 text-xs font-black uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" /> Direct Admin Notification
            </div>
            <h2 className="text-xl font-black text-white">
              Submit Payment Reference / UTR
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Once you submit, the Platform Super Admin console will immediately receive an alert to verify payment and approve your facility.
            </p>

            <form onSubmit={handleSubmitPaymentRef} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'qr_code', label: 'Online UPI / QR', icon: QrCode },
                    { id: 'card', label: 'Debit / Credit Card', icon: CreditCard },
                    { id: 'cash', label: 'Direct Cash', icon: Banknote },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = newPaymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setNewPaymentMethod(m.id)}
                        className={`p-3 rounded-xl border text-left flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold cursor-pointer ${
                          isSelected
                            ? 'border-brand-500 bg-brand-500/20 text-white ring-1 ring-brand-500'
                            : 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[11px] text-center">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  {newPaymentMethod === 'cash' ? 'Cash Handover Note / Token *' : 'Transaction UTR / Reference ID *'}
                </label>
                <input
                  type="text"
                  required
                  value={newPaymentRef}
                  onChange={(e) => setNewPaymentRef(e.target.value)}
                  placeholder={
                    newPaymentMethod === 'cash'
                      ? 'e.g., Handed ₹999 cash to admin'
                      : 'e.g., 426819284712 (UPI 12-digit UTR)'
                  }
                  className="w-full px-4 py-2.5 bg-black/50 border border-white/20 rounded-xl text-white font-mono text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Found on your PhonePe, Google Pay, Paytm, or bank statement.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 rounded-xl border border-white/20 text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRef}
                  className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmittingRef ? 'Submitting...' : 'Submit & Notify Admin'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-white/10 py-4 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} GymPulse SaaS Platform. Enterprise Gym Management Network.
      </footer>
    </div>
  );
};
