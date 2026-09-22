import React, { useState } from 'react';
import {
  Dumbbell,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Users,
  CreditCard,
  ClipboardCheck,
  BarChart3,
  Shield,
  HelpCircle,
  Play,
  ChevronDown,
  Star,
  Download,
  Smartphone
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { DownloadAppModal } from '../components/common/DownloadAppModal';

export const LandingPage = ({ onNavigateLogin, onNavigateRegister, onQuickDemo }) => {
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly'); // monthly, yearly

  React.useEffect(() => {
    fetch('/api/settings/network-info')
      .then((res) => res.json())
      .then((data) => setNetworkInfo(data))
      .catch(() => {});
  }, []);

  const handleDownloadClick = () => {
    setIsDownloadModalOpen(true);
  };
  const [openFaq, setOpenFaq] = useState(null);
  const [calculatorMembers, setCalculatorMembers] = useState(150);
  const [calculatorPrice, setCalculatorPrice] = useState(55);

  const calculatedRevenue = calculatorMembers * calculatorPrice;
  const calculatedSavings = Math.round(calculatedRevenue * 0.08); // estimated recovery from churn & missed renewals

  const faqs = [
    {
      q: "Can I manage multiple gym locations or facilities?",
      a: "Yes! GymPulse is built on a strict multi-tenant architecture. Each gym facility operates with completely isolated data, custom membership tiers, staff permissions, and branding."
    },
    {
      q: "How does the built-in AI Assistant work?",
      a: "The AI Assistant connects directly and securely to your facility's database. You can ask natural questions like 'Which members haven't visited in 14 days?' or 'How many memberships expire this week?' and receive instant, actionable answers without manual report digging."
    },
    {
      q: "Can members print or receive payment receipts?",
      a: "Yes! GymPulse generates branded electronic receipts and tax-compliant invoice slips that can be printed or saved as PDFs with one click."
    },
    {
      q: "Can I try GymPulse without entering credit card details?",
      a: "Absolutely. We offer a 1-click live demo and a generous Free Starter tier so you can test all core features immediately."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-brand-500 selection:text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-brand-500/25">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-950">GymPulse</span>
              <span className="ml-2 px-2 py-0.5 text-[10px] font-extrabold bg-brand-50 text-brand-600 rounded-md border border-brand-200">SAAS</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-brand-600 transition-colors">Features</a>
            <a href="#demo" className="hover:text-brand-600 transition-colors">Live Preview</a>
            <a href="#calculator" className="hover:text-brand-600 transition-colors">ROI Calculator</a>
            <a href="#pricing" className="hover:text-brand-600 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-brand-600 transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadClick}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-brand-50 to-indigo-50 hover:from-brand-100 hover:to-indigo-100 text-brand-700 text-xs font-bold transition-all border border-brand-200/80 shadow-xs"
              title="Download & Install GymPulse on Mobile (iPhone/Android) or PC"
            >
              <Download className="w-3.5 h-3.5 text-brand-600" />
              <span>Download App</span>
            </button>
            <button
              onClick={onNavigateLogin}
              className="text-sm font-bold text-slate-700 hover:text-brand-600 px-4 py-2 rounded-xl transition-colors"
            >
              Sign In
            </button>
            <Button
              onClick={() => onQuickDemo('owner@apexfitness.com', 'ApexAdmin123!')}
              variant="primary"
              size="md"
              icon={Play}
            >
              Instant Demo
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32 bg-radial from-brand-50/50 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold mb-8 animate-fade-in shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            <span>Next-Generation Multi-Tenant Gym Management Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-950 tracking-tight max-w-5xl mx-auto leading-[1.1]">
            Run Your Fitness Business With <span className="bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">Complete Precision.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Eliminate member churn, prevent expired access, automate payments, and get instant answers with an integrated AI Copilot designed specifically for gym owners and studio operators.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={onNavigateRegister}
              size="lg"
              className="w-full sm:w-auto text-base px-8 py-4 shadow-xl shadow-brand-600/25"
            >
              Start Free 14-Day Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <button
              onClick={handleDownloadClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 text-base font-bold text-slate-900 bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 rounded-xl shadow-sm transition-all"
            >
              <Download className="w-5 h-5 text-amber-600" />
              Download App (Mobile & PC)
            </button>

            <button
              onClick={() => onQuickDemo('owner@apexfitness.com', 'ApexAdmin123!')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 text-base font-bold text-slate-800 bg-white border border-slate-200 hover:border-brand-500 hover:bg-brand-50/30 rounded-xl shadow-sm transition-all"
            >
              <Play className="w-4 h-4 text-brand-600 fill-brand-600" />
              Test Live Dashboard
            </button>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> No credit card required
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Multi-tenant isolated databases
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Integrated AI Assistant
            </div>
          </div>
        </div>
      </section>

      {/* Product Preview / Screenshot Showcase */}
      <section id="demo" className="py-12 bg-slate-900 text-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-400">Live Interactive Application</span>
            <h2 className="text-3xl font-bold text-white mt-2">Engineered for Daily Gym Operations</h2>
            <p className="text-slate-400 text-sm mt-3">
              Switch between pre-configured isolated demo facilities to inspect real-time attendance, billing, and automated expiry workflows.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="p-6 rounded-2xl bg-slate-800/90 border border-slate-700 flex flex-col justify-between hover:border-brand-500 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 text-xs font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30 rounded-lg">
                    TENANT 1: PRO TIER
                  </span>
                  <span className="text-xs text-slate-400">Full Access</span>
                </div>
                <h3 className="text-xl font-bold text-white">Apex Fitness Club</h3>
                <p className="text-slate-400 text-sm mt-2">
                  Full-scale fitness center with 20+ active members, multi-tier plans, trainer rosters, check-in history, and AI analytics.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-700/80 flex items-center justify-between">
                <span className="text-xs text-slate-400">Email: owner@apexfitness.com</span>
                <button
                  onClick={() => onQuickDemo('owner@apexfitness.com', 'ApexAdmin123!')}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  Launch Apex <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/90 border border-slate-700 flex flex-col justify-between hover:border-brand-500 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg">
                    TENANT 2: FREE STARTER
                  </span>
                  <span className="text-xs text-slate-400">Strictly Isolated</span>
                </div>
                <h3 className="text-xl font-bold text-white">IronForge Strength Studio</h3>
                <p className="text-slate-400 text-sm mt-2">
                  Dedicated powerlifting facility demonstrating complete tenant separation: zero shared member data or records.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-700/80 flex items-center justify-between">
                <span className="text-xs text-slate-400">Email: admin@ironforge.com</span>
                <button
                  onClick={() => onQuickDemo('admin@ironforge.com', 'IronAdmin123!')}
                  className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  Launch IronForge <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600">Enterprise Capabilities</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 mt-2">Everything Needed to Run a Gym</h2>
            <p className="text-slate-600 text-base mt-4">
              Designed from the ground up to replace fragmented spreadsheets, paper registers, and clunky legacy software.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:border-brand-200 transition-all">
              <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Member Lifecycle Management</h3>
              <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                Complete profiles with photos, emergency contacts, date of birth, medical notes, membership history, and automated status transitions.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:border-brand-200 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Customizable Membership Plans</h3>
              <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                Configure monthly, quarterly, annual, or custom duration packages with automatic expiry calculations and renewals.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:border-brand-200 transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">AI Assistant Copilot</h3>
              <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                Ask questions in plain English about your gym's metrics, inactive members, upcoming expirations, and popular plans.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:border-brand-200 transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-6">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Live Attendance & Check-In</h3>
              <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                Instant search & check-in, real-time active visitor counter, check-out timestamps, and member visit frequency tracking.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:border-brand-200 transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Financials & Printable Receipts</h3>
              <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                Record cash, card, and transfer payments. Generate professional branded invoice receipts and download complete CSV reports.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:border-brand-200 transition-all">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Multi-Tenancy & Security</h3>
              <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                Role-based access control (Owner, Admin, Trainer, Staff) with strict row-level gym data isolation and encrypted passwords.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ROI / Revenue Recovery Calculator */}
      <section id="calculator" className="py-20 bg-slate-50 border-y border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600">Interactive Estimator</span>
            <h2 className="text-3xl font-extrabold text-slate-950 mt-1">Calculate Your Revenue Recovery</h2>
            <p className="text-slate-600 text-sm mt-2">
              See how automated expiry reminders and member retention analytics protect monthly recurring revenue.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-md grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm font-bold text-slate-800 mb-2">
                  <span>Active Members</span>
                  <span className="text-brand-600">{calculatorMembers} members</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="1000"
                  step="10"
                  value={calculatorMembers}
                  onChange={(e) => setCalculatorMembers(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm font-bold text-slate-800 mb-2">
                  <span>Average Monthly Membership Fee</span>
                  <span className="text-brand-600">${calculatorPrice} / month</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="200"
                  step="5"
                  value={calculatorPrice}
                  onChange={(e) => setCalculatorPrice(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl text-white text-center">
              <div className="text-xs uppercase tracking-wider font-bold text-slate-400">Monthly Gross Revenue</div>
              <div className="text-3xl font-extrabold text-white mt-1">${calculatedRevenue.toLocaleString()}</div>

              <div className="mt-6 pt-6 border-t border-slate-700">
                <div className="text-xs uppercase tracking-wider font-bold text-emerald-400">Estimated Annual Churn Prevented</div>
                <div className="text-3xl font-black text-emerald-400 mt-1">${(calculatedSavings * 12).toLocaleString()}</div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Based on automated 7-day renewal alerts and proactive inactive member engagement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600">Straightforward Pricing</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 mt-2">Transparent SaaS Plans For Every Studio</h2>
            <p className="text-slate-600 text-sm mt-3">
              Upgrade, downgrade, or cancel at any time. No hidden setup fees or locked-in contracts.
            </p>

            {/* Toggle */}
            <div className="mt-8 inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-lg transition-all ${billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${billingCycle === 'yearly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Annual Billing
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-700">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Starter */}
            <div className="rounded-3xl border border-slate-200 p-8 flex flex-col justify-between hover:shadow-lg transition-all">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Free Starter</h3>
                <p className="text-xs text-slate-500 mt-1">For boutique studios & independent trainers.</p>
                <div className="mt-6">
                  <span className="text-4xl font-black text-slate-900">₹0</span>
                  <span className="text-slate-500 text-xs"> / forever</span>
                </div>
                <ul className="mt-8 space-y-3 text-xs text-slate-600 font-medium">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Up to 25 active members
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Automated Gym Public Website (HTTPS)
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Daily attendance check-in/out
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Payment records & receipt generation
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Core operational dashboard
                  </li>
                </ul>
              </div>
              <Button onClick={onNavigateRegister} variant="secondary" className="mt-8 w-full">
                Get Started Free
              </Button>
            </div>

            {/* Pro Plan (Highlighted) */}
            <div className="rounded-3xl border-2 border-brand-500 p-8 flex flex-col justify-between shadow-xl shadow-brand-500/10 relative bg-white">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand-600 text-white text-[10px] font-extrabold tracking-wider uppercase">
                Most Popular
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Pro Growth</h3>
                <p className="text-xs text-slate-500 mt-1">For growing gyms & fitness centers.</p>
                <div className="mt-6">
                  <span className="text-4xl font-black text-slate-900">{billingCycle === 'monthly' ? '₹2,499' : '₹1,999'}</span>
                  <span className="text-slate-500 text-xs"> / month</span>
                </div>
                <ul className="mt-8 space-y-3 text-xs text-slate-600 font-medium">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Up to 250 active members
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Dedicated Public Gym Website & Lead Capture
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Integrated AI Assistant Copilot
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Automated 7-day expiry alerts
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Revenue & visit CSV report exports
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Personal trainer profiles & assignment
                  </li>
                </ul>
              </div>
              <Button onClick={onNavigateRegister} variant="primary" className="mt-8 w-full">
                Start 14-Day Free Trial
              </Button>
            </div>

            {/* Business Enterprise */}
            <div className="rounded-3xl border border-slate-200 p-8 flex flex-col justify-between hover:shadow-lg transition-all">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Business Enterprise</h3>
                <p className="text-xs text-slate-500 mt-1">For high-volume multi-facility gyms.</p>
                <div className="mt-6">
                  <span className="text-4xl font-black text-slate-900">{billingCycle === 'monthly' ? '₹5,999' : '₹4,799'}</span>
                  <span className="text-slate-500 text-xs"> / month</span>
                </div>
                <ul className="mt-8 space-y-3 text-xs text-slate-600 font-medium">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Unlimited members
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Custom Domain Website (gymname.com)
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Unlimited staff & trainer logins
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Priority AI Assistant queries
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Custom branding & priority support
                  </li>
                </ul>
              </div>
              <Button onClick={onNavigateRegister} variant="secondary" className="mt-8 w-full">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600">Frequently Asked Questions</span>
            <h2 className="text-3xl font-extrabold text-slate-950 mt-1">Everything You Need to Know</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 text-left font-bold text-slate-900 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180 text-brand-600' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-tr from-slate-950 via-slate-900 to-brand-950 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Ready to Modernize Your Gym Management?</h2>
          <p className="mt-4 text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Join hundreds of fitness entrepreneurs who rely on GymPulse to streamline memberships, automate attendance, and protect revenue.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button onClick={onNavigateRegister} size="lg" className="w-full sm:w-auto px-8 py-3.5 shadow-xl shadow-brand-500/20">
              Get Started Now
            </Button>
            <button
              onClick={() => onQuickDemo('owner@apexfitness.com', 'ApexAdmin123!')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-sm font-bold text-white transition-colors"
            >
              Open Instant Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-500 text-xs py-12 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-brand-500" />
            <span className="font-bold text-white text-sm">GymPulse SaaS</span>
            <span className="text-slate-600">| Complete Gym Operating System</span>
          </div>
          <div>
            &copy; {new Date().getFullYear()} GymPulse Software. Production-Ready Commercial Edition. All rights reserved.
          </div>
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
