import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Send, 
  ArrowRight, 
  MessageSquare, 
  ShieldCheck,
  ChevronRight,
  Star,
  Users,
  Award,
  Download
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/currency';
import { DownloadAppModal } from '../components/common/DownloadAppModal';

export const GymPublicWebsitePage = ({ slug, onBackToApp }) => {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  // Inquiry Form State
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    plan_name: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const fetchWebsite = async () => {
      setLoading(true);
      try {
        const res = await api.getPublicFacility(slug);
        setData(res);
        if (res.plans && res.plans.length > 0) {
          setForm((prev) => ({ ...prev, plan_name: res.plans[0].name }));
        }
      } catch (err) {
        setError(err.message || 'Could not load gym facility website.');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchWebsite();
    }
  }, [slug]);

  const handleSubmitInquiry = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.phone) {
      toast.error('Please enter your name and phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.submitPublicInquiry(slug, form);
      setSubmitSuccess(true);
      toast.success(res.message || 'Inquiry submitted successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to submit inquiry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectPlan = (planName) => {
    setForm((prev) => ({ ...prev, plan_name: planName }));
    const formEl = document.getElementById('inquiry-section');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-sm font-bold text-slate-300">Loading Facility Website...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-5 shadow-xl shadow-rose-950/40">
          <ShieldCheck className="w-8 h-8 text-rose-400" />
        </div>
        <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 mb-3">
          Website Decommissioned or Not Found
        </span>
        <h1 className="text-3xl font-black tracking-tight text-white mb-3">
          Facility Website No Longer Available
        </h1>
        <p className="text-slate-400 text-sm max-w-lg mb-8 leading-relaxed">
          {error?.includes('deleted')
            ? 'This gym facility and its associated HTTPS public website have been permanently deleted by its owner. All records and online pages have been erased.'
            : (error || 'This gym facility website does not exist or has been removed from the platform.')}
        </p>

        <div className="flex items-center gap-3">
          {onBackToApp ? (
            <button
              onClick={onBackToApp}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-lg shadow-brand-600/25"
            >
              &larr; Return to App
            </button>
          ) : (
            <a
              href="/"
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-lg shadow-brand-600/25"
            >
              &larr; Return to GymPulse SaaS
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-brand-500 selection:text-white">
      {/* Top Bar for App Preview */}
      {onBackToApp && (
        <div className="bg-slate-900 border-b border-white/10 px-4 py-2 flex items-center justify-between text-xs sticky top-0 z-50">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live Branded Gym Website Preview: <strong>https://gympulse.app/facility/{data.website_subdomain || data.slug}</strong></span>
          </div>
          <button
            onClick={onBackToApp}
            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-colors"
          >
            &larr; Exit Preview
          </button>
        </div>
      )}

      {/* Website Navigation Header */}
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-brand-500/25">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <div className="text-lg font-black tracking-tight text-white">{data.name}</div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <Clock className="w-3 h-3 text-brand-400" /> {data.business_hours}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDownloadModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/15"
              title="Download & Install Gym App"
            >
              <Download className="w-3.5 h-3.5 text-brand-400" />
              <span>Download App</span>
            </button>
            {data.phone && (
              <a
                href={`tel:${data.phone}`}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/20 text-slate-300 hover:text-white text-xs font-semibold"
              >
                <Phone className="w-3.5 h-3.5 text-brand-400" /> {data.phone}
              </a>
            )}
            <button
              onClick={() => document.getElementById('inquiry-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-lg shadow-brand-500/25"
            >
              Join Facility
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 overflow-hidden border-b border-white/10">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: `url(${data.cover_image})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-extrabold uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Official Facility Website
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight mb-4">
            {data.headline}
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8">
            {data.tagline}
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-sm transition-all shadow-xl shadow-brand-500/30 flex items-center gap-2"
            >
              View Membership Plans <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => document.getElementById('inquiry-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-6 py-3 rounded-xl border border-white/20 hover:bg-white/10 text-white font-bold text-sm transition-all"
            >
              Free Trial / Inquire
            </button>
          </div>
        </div>
      </section>

      {/* About & Amenities Section */}
      <section className="py-16 px-4 sm:px-6 max-w-6xl mx-auto border-b border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-widest text-brand-400 mb-2">About The Facility</div>
            <h2 className="text-3xl font-black text-white tracking-tight mb-4">
              World-Class Training Ground
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              {data.about}
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <MapPin className="w-4 h-4 text-brand-400 shrink-0" />
                <span>{data.address || 'Central Fitness Complex'}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <Clock className="w-4 h-4 text-brand-400 shrink-0" />
                <span>Hours: {data.business_hours}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <Phone className="w-4 h-4 text-brand-400 shrink-0" />
                <span>Phone: {data.phone || 'Contact front desk'}</span>
              </div>
            </div>
          </div>

          {/* Amenities Grid */}
          <div className="bg-slate-900/70 border border-white/10 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-brand-400" /> Featured Amenities & Equipment
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.amenities && data.amenities.length > 0 ? (
                data.amenities.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold">{item}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500">Amenities updating soon.</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Membership Plans Section (Denominated in INR) */}
      <section id="plans-section" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto border-b border-white/10">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs font-extrabold uppercase tracking-widest text-brand-400 mb-2">Pricing & Passes</div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Transparent Membership Plans
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            No hidden admission fees. All prices denominated in Indian Rupees (₹).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.plans && data.plans.map((p, idx) => (
            <div
              key={p.id}
              className={`rounded-3xl p-6 border transition-all flex flex-col justify-between ${
                idx === 1
                  ? 'bg-gradient-to-b from-brand-950/80 via-slate-900 to-slate-900 border-brand-500/50 shadow-2xl shadow-brand-500/10 scale-105'
                  : 'bg-slate-900/60 border-white/10'
              }`}
            >
              <div>
                {idx === 1 && (
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-brand-500 text-white mb-3">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-bold text-white">{p.name}</h3>
                <p className="text-xs text-slate-400 mt-1 min-h-[36px]">{p.description || 'Full facility access and workout floor privileges.'}</p>
                
                <div className="my-6">
                  <span className="text-3xl sm:text-4xl font-black text-white">
                    {formatCurrency(p.price, data.currency || 'INR')}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">/ {p.duration_days} days</span>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Full gym floor access
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Locker room & shower facilities
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Mobile check-in pass
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleSelectPlan(p.name)}
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition-colors ${
                  idx === 1
                    ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                Choose This Plan
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Online Joining / Lead Capture Inquiry Section */}
      <section id="inquiry-section" className="py-20 px-4 sm:px-6 max-w-3xl mx-auto">
        <div className="bg-slate-900 border border-white/15 rounded-3xl p-6 sm:p-10 shadow-2xl">
          <div className="text-center max-w-lg mx-auto mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold mb-2">
              <MessageSquare className="w-3.5 h-3.5" /> Direct Front Desk Connect
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Start Training at {data.name}
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              Leave your details below. Our coaching team will reach out within 2 hours to confirm your membership or free trial session.
            </p>
          </div>

          {submitSuccess ? (
            <div className="p-6 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Inquiry Received!</h3>
              <p className="text-xs text-slate-300 mb-4">
                Thank you, <strong>{form.full_name}</strong>! The {data.name} team has logged your inquiry and will call or WhatsApp you at <strong>{form.phone}</strong>.
              </p>
              <button
                onClick={() => setSubmitSuccess(false)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
              >
                Send Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitInquiry} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Phone / WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="rahul@example.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Interested Plan
                  </label>
                  <select
                    value={form.plan_name}
                    onChange={(e) => setForm({ ...form, plan_name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {data.plans && data.plans.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} - {formatCurrency(p.price, data.currency)}
                      </option>
                    ))}
                    <option value="General Trial">Free 1-Day Trial Pass</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Fitness Goals / Message
                </label>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us about your goals (e.g. weight loss, strength, athletic training)..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-sm transition-all shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Sending to Facility Front Desk...' : 'Submit Membership Request'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Website Footer */}
      <footer className="border-t border-white/10 py-8 px-4 text-center text-xs text-slate-500 bg-slate-950">
        <div className="flex items-center justify-center gap-2 mb-2 text-slate-400">
          <Dumbbell className="w-4 h-4 text-brand-500" />
          <span className="font-bold text-white">{data.name}</span>
        </div>
        <p className="max-w-md mx-auto mb-4">{data.address || 'Premier Fitness Facility'} • {data.phone || 'Phone support available'}</p>
        <div className="text-[11px] text-slate-600">
          Powered by <span className="text-brand-400 font-bold">GymPulse SaaS</span> • Facility Management Platform
        </div>
      </footer>

      {/* Download & Install App Modal */}
      <DownloadAppModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />
    </div>
  );
};
