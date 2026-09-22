import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const PendingApprovalPage = ({ onPreviewWebsite }) => {
  const { user, gym, logout, refreshGymProfile } = useAuth();
  const toast = useToast();
  const [isChecking, setIsChecking] = useState(false);

  const handleCheckStatus = async () => {
    setIsChecking(true);
    try {
      await refreshGymProfile();
      toast.info('Checked status: Your application is still under review by the platform owner.');
    } catch (e) {
      toast.error('Could not check status right now.');
    } finally {
      setIsChecking(false);
    }
  };

  const publicUrl = `/facility/${gym?.website_subdomain || gym?.slug}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 text-white flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
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

        <button
          onClick={logout}
          className="px-3.5 py-1.5 rounded-xl border border-white/20 text-slate-300 hover:text-white hover:bg-white/10 text-xs font-bold transition-all flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </header>

      {/* Main Review Card */}
      <main className="max-w-3xl w-full mx-auto px-4 py-8">
        <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-extrabold mb-6">
            <Clock className="w-4 h-4 animate-spin-slow" />
            Awaiting Platform Administrator Approval
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
            Facility Registration Received
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Thank you for registering <strong>{gym?.name}</strong> with GymPulse SaaS. Your subscription payment has been received and your facility account is currently queued for platform owner verification. Once approved, your operational dashboard, front-desk check-in, and athlete roster will unlock automatically.
          </p>

          {/* Details Overview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Facility Details</div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand-400" /> {gym?.name}
              </div>
              <div className="text-xs text-slate-400 mt-1">Applicant: {user?.full_name}</div>
              <div className="text-xs text-slate-400">{user?.email} • {user?.phone || 'No phone'}</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payment & Plan Status</div>
              <div className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Payment Verified (₹2,499/mo Pro)
              </div>
              <div className="text-xs text-slate-400 mt-1">Currency: Indian Rupee (₹ INR)</div>
              <div className="text-xs text-slate-400">Status: Verified by Gateway</div>
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
                    Prospective members can already view your plans in ₹ and submit online joining inquiries.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onPreviewWebsite ? onPreviewWebsite(gym?.website_subdomain || gym?.slug) : window.open(publicUrl, '_blank')}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-brand-500/30"
              >
                Preview Live Website <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 text-xs font-mono text-brand-300">
              <span className="text-slate-500">Public URL:</span>
              <span className="underline select-all">https://gympulse.app{publicUrl}</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3 flex-wrap justify-between pt-2">
            <button
              onClick={handleCheckStatus}
              disabled={isChecking}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-900 text-xs font-extrabold transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              {isChecking ? 'Verifying with Platform...' : 'Check Approval Status'}
            </button>

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
