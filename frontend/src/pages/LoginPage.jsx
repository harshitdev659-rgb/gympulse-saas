import React, { useState } from 'react';
import { Dumbbell, Lock, Mail, ArrowRight, ArrowLeft, ShieldCheck, Sparkles, Building2, User, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';

export const LoginPage = ({ onNavigateRegister, onNavigateForgotPassword, onBackToLanding, onLoginSuccess }) => {
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
      const res = await login(email, password);
      toast.success('Welcome back! Directing you to gym management console...');
      if (onLoginSuccess) {
        onLoginSuccess(res);
      }
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-radial from-slate-100 via-slate-50 to-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Top Navigation Bar with Back Button */}
      <div className="max-w-md w-full mx-auto px-4 mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToLanding}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-bold text-xs shadow-xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
          <span>Back to Landing Page</span>
        </button>

        <button
          type="button"
          onClick={onNavigateRegister}
          className="text-xs font-bold text-brand-600 hover:text-brand-800 hover:underline cursor-pointer"
        >
          Register facility &rarr;
        </button>
      </div>

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
          Enter your verified credentials to access the operations console.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-200/80">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
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
                  className="block w-full pl-10 pr-4 py-3 text-base sm:text-sm font-semibold text-slate-900 bg-white rounded-xl border-2 border-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-500/20 focus:border-brand-600 caret-brand-600 shadow-xs transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
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
                  className="block w-full pl-10 pr-4 py-3 text-base sm:text-sm font-semibold text-slate-900 bg-white rounded-xl border-2 border-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-500/20 focus:border-brand-600 caret-brand-600 shadow-xs transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full mt-2 py-3 font-bold text-sm shadow-md"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have a gym account?{' '}
            <button
              type="button"
              onClick={onNavigateRegister}
              className="font-bold text-brand-600 hover:text-brand-700"
            >
              Register your gym facility
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
