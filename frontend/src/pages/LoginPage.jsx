import React, { useState } from 'react';
import { Dumbbell, Lock, Mail, ArrowRight, ShieldCheck, Sparkles, Building2, User, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';

export const LoginPage = ({ onNavigateRegister, onNavigateForgotPassword, onBackToLanding }) => {
  const { login } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back! Successfully authenticated.');
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setIsLoading(true);
    try {
      await login(demoEmail, demoPassword);
      toast.success(`Logged in as ${demoEmail}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-radial from-slate-100 via-slate-50 to-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <button
          onClick={onBackToLanding}
          className="inline-flex items-center gap-2 mb-6 group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-brand-500/25 group-hover:scale-105 transition-transform">
            <Dumbbell className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-950">GymPulse</span>
        </button>

        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign in to your facility</h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter your credentials or test with one-click demo accounts below.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-200/80">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Work Email
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@yourgym.com"
                  className="block w-full pl-10 pr-4 py-2.5 sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Password
                </label>
                <button
                  type="button"
                  onClick={onNavigateForgotPassword}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-4 py-2.5 sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full mt-2 py-3 font-bold"
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Logins Container */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <span className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 text-center mb-3">
              One-Click Instant Demo Accounts
            </span>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@gympulse.com', 'SuperAdmin123!')}
                className="w-full flex items-center justify-between p-3 rounded-xl border-2 border-indigo-500/80 bg-gradient-to-r from-indigo-900/5 to-brand-900/5 hover:border-brand-500 hover:bg-brand-50/50 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-sm group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      Platform Super Admin (Owner)
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-indigo-600 text-white">OWNER</span>
                    </div>
                    <div className="text-[10px] text-indigo-700 font-semibold">Platform-Wide Authority • Review & Approve Gyms</div>
                  </div>
                </div>
                <span className="text-xs font-black text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                  Login &rarr;
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('owner@apexfitness.com', 'ApexAdmin123!')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-brand-400 hover:bg-brand-50/40 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-brand-100 text-brand-700 group-hover:scale-105 transition-transform">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Apex Fitness Club (Owner)</div>
                    <div className="text-[10px] text-slate-500">Pro Tier • 20+ Members • Full Access</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-brand-600 group-hover:translate-x-0.5 transition-transform">
                  Login &rarr;
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('staff@apexfitness.com', 'Staff123!')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 group-hover:scale-105 transition-transform">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Apex Front Desk (Staff)</div>
                    <div className="text-[10px] text-slate-500">Attendance & Check-in Operator</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                  Login &rarr;
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('admin@ironforge.com', 'IronAdmin123!')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-rose-400 hover:bg-rose-50/40 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-100 text-rose-700 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">IronForge Studio (Separate Tenant)</div>
                    <div className="text-[10px] text-slate-500">Free Tier • Test Tenant Isolation</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-rose-600 group-hover:translate-x-0.5 transition-transform">
                  Login &rarr;
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('owner@olympusgold.com', 'Olympus123!')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-amber-200 bg-amber-50/30 hover:border-amber-400 hover:bg-amber-50 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-700 group-hover:scale-105 transition-transform">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      Olympus Gold Gym (Pending Approval)
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-200 text-amber-900">PENDING</span>
                    </div>
                    <div className="text-[10px] text-amber-700">Test Owner Gate • Awaiting Platform Approval</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-700 group-hover:translate-x-0.5 transition-transform">
                  Login &rarr;
                </span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have a gym account?{' '}
            <button
              type="button"
              onClick={onNavigateRegister}
              className="font-bold text-brand-600 hover:text-brand-700"
            >
              Register your gym free
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
