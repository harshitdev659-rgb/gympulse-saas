import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Lock, 
  Mail, 
  Building2, 
  User, 
  Phone, 
  ArrowLeft, 
  QrCode, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  Copy, 
  ShieldCheck, 
  Sparkles,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { api } from '../services/api';

const DEFAULT_PAYMENT_CONFIG = {
  upi_id: 'gympulse.admin@upi',
  upi_name: 'GymPulse Platform SaaS',
  upi_qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi%3A%2F%2Fpay%3Fpa%3Dgympulse.admin%40upi%26pn%3DGymPulse%2BSaaS',
  card_instructions: 'Secure Credit & Debit Card payments processed via platform merchant gateway.',
  bank_name: 'HDFC Bank',
  bank_account: '50200012345678',
  bank_ifsc: 'HDFC0001234',
  bank_account_name: 'GymPulse SaaS Platform Private Ltd',
  bank_instructions: 'Transfer registration fee via NEFT/IMPS/RTGS and submit transaction UTR below.'
};

const PLAN_TIERS = [
  {
    id: 'starter',
    name: 'Starter Plan',
    price: '₹999',
    period: '/month',
    desc: 'For boutique studios & personal gyms',
    features: ['Up to 50 athletes', 'Check-ins & Attendance', 'Standard Invoicing', 'Gym Public Website']
  },
  {
    id: 'pro',
    name: 'Pro Facility',
    price: '₹2,499',
    period: '/month',
    desc: 'Most popular for commercial gyms',
    popular: true,
    features: ['Up to 250 athletes', 'AI Operations Assistant', 'Automated Check-in', 'Custom Website Subdomain', 'CSV Financial Reports']
  },
  {
    id: 'business',
    name: 'Enterprise',
    price: '₹5,999',
    period: '/month',
    desc: 'For multi-floor gyms & fitness chains',
    features: ['Unlimited athletes', 'Priority Support', 'Full AI Suite', 'Multi-staff logins', 'Custom Domain Support']
  }
];

export const RegisterPage = ({ onNavigateLogin, onBackToLanding }) => {
  const { register } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    gym_name: '',
    owner_name: '',
    email: '',
    password: '',
    phone: '',
    currency: 'INR'
  });

  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [paymentMethod, setPaymentMethod] = useState('qr_code'); // 'qr_code' | 'card' | 'cash'
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentSettings, setPaymentSettings] = useState(DEFAULT_PAYMENT_CONFIG);
  const [isLoading, setIsLoading] = useState(false);

  // Card simulation state
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await api.getPlatformPaymentSettings();
        if (settings) {
          setPaymentSettings((prev) => ({ ...prev, ...settings }));
        }
      } catch (e) {
        // Fallback to default
      }
    };
    fetchSettings();
  }, []);

  const handleCopyUpi = () => {
    if (paymentSettings?.upi_id) {
      navigator.clipboard?.writeText(paymentSettings.upi_id);
      toast.success(`Copied UPI ID: ${paymentSettings.upi_id}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.gym_name || !formData.owner_name || !formData.email || !formData.password) {
      toast.error('Please complete all required gym facility fields.');
      return;
    }

    if (paymentMethod === 'card') {
      if (!cardData.number || !cardData.expiry || !cardData.cvv) {
        toast.error('Please complete your credit/debit card details.');
        return;
      }
    }

    const effectiveRef = paymentMethod === 'card' 
      ? (paymentRef || `CARD-TXN-${Date.now().toString().slice(-6)}`) 
      : paymentRef;

    setIsLoading(true);
    try {
      await register({
        ...formData,
        plan_tier: selectedPlan,
        payment_method: paymentMethod,
        payment_ref: effectiveRef || (paymentMethod === 'cash' ? 'CASH-COLLECTION-PENDING' : 'QR-UPI-SUBMITTED')
      });
      toast.success('Your gym facility was created successfully! Application submitted for admin payment verification.');
    } catch (err) {
      toast.error(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-8 sm:px-6 lg:px-8">
      {/* Top Navigation Bar with Back Button */}
      <div className="max-w-3xl w-full mx-auto px-4 mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToLanding}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-bold text-xs shadow-xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
          <span>Back to Landing Page</span>
        </button>

        <button
          type="button"
          onClick={onNavigateLogin}
          className="text-xs font-bold text-brand-600 hover:text-brand-800 hover:underline cursor-pointer"
        >
          Already registered? Sign In &rarr;
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-brand-500/25">
            <Dumbbell className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-950">GymPulse SaaS</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Register Your Gym Facility
        </h2>
        <p className="mt-1 text-sm text-slate-500 max-w-lg mx-auto">
          Complete facility operations, automated member attendance, front-desk QR, and dedicated public website.
        </p>
      </div>

      <div className="mt-6 max-w-2xl w-full mx-auto px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-200/80">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* SECTION 1: Facility Details */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <Building2 className="w-4 h-4 text-brand-600" />
                1. Facility & Owner Information
              </h3>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Gym / Facility Name *
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.gym_name}
                      onChange={(e) => setFormData({ ...formData, gym_name: e.target.value })}
                      placeholder="e.g. Iron & Steel Fitness Hub"
                      className="block w-full pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-900 bg-white rounded-xl border-2 border-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-500/20 focus:border-brand-600 caret-brand-600 shadow-xs transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Owner Full Name *
                    </label>
                    <div className="relative rounded-xl shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={formData.owner_name}
                        onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                        placeholder="e.g. Rahul Sharma"
                        className="block w-full pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-900 bg-white rounded-xl border-2 border-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-500/20 focus:border-brand-600 caret-brand-600 shadow-xs transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Contact Phone *
                    </label>
                    <div className="relative rounded-xl shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="block w-full pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-900 bg-white rounded-xl border-2 border-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-500/20 focus:border-brand-600 caret-brand-600 shadow-xs transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Admin Email (Login ID) *
                    </label>
                    <div className="relative rounded-xl shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="owner@ironfitness.com"
                        className="block w-full pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-900 bg-white rounded-xl border-2 border-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-500/20 focus:border-brand-600 caret-brand-600 shadow-xs transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Admin Password *
                    </label>
                    <div className="relative rounded-xl shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Create secure password"
                        className="block w-full pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-900 bg-white rounded-xl border-2 border-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-500/20 focus:border-brand-600 caret-brand-600 shadow-xs transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: Select SaaS Subscription Tier */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <Sparkles className="w-4 h-4 text-brand-600" />
                2. Choose Facility Subscription Tier
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PLAN_TIERS.map((tier) => {
                  const isSelected = selectedPlan === tier.id;
                  return (
                    <div
                      key={tier.id}
                      onClick={() => setSelectedPlan(tier.id)}
                      className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected 
                          ? 'border-brand-600 bg-brand-50/50 shadow-md ring-2 ring-brand-500/20' 
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      {tier.popular && (
                        <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-xs">
                          Popular
                        </span>
                      )}
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-black text-slate-900 text-sm">{tier.name}</h4>
                          <input
                            type="radio"
                            name="plan_tier"
                            checked={isSelected}
                            onChange={() => setSelectedPlan(tier.id)}
                            className="w-4 h-4 text-brand-600 focus:ring-brand-500"
                          />
                        </div>
                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="text-xl font-black text-slate-900">{tier.price}</span>
                          <span className="text-xs text-slate-500 font-semibold">{tier.period}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">{tier.desc}</p>
                      </div>

                      <ul className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                        {tier.features.slice(0, 3).map((f, i) => (
                          <li key={i} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 3: Payment Method Selection */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <QrCode className="w-4 h-4 text-brand-600" />
                3. Subscription Payment Method (Required by Platform)
              </h3>

              {/* Payment Method Selector Tabs */}
              <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('qr_code')}
                  className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                    paymentMethod === 'qr_code'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-brand-600" />
                  <span className="truncate">Online QR / UPI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                    paymentMethod === 'card'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  <span className="truncate">Credit / Debit Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span className="truncate">Cash / Bank Wire</span>
                </button>
              </div>

              {/* TAB 1: QR Code & UPI Payment */}
              {paymentMethod === 'qr_code' && (
                <div className="bg-slate-50 border-2 border-brand-200 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    <div className="w-36 h-36 bg-white p-2 rounded-2xl border-2 border-slate-200 shadow-sm flex items-center justify-center flex-shrink-0">
                      {paymentSettings?.upi_qr_url ? (
                        <img 
                          src={paymentSettings.upi_qr_url} 
                          alt="Platform Admin UPI QR Code" 
                          className="w-full h-full object-contain rounded-xl"
                        />
                      ) : (
                        <div className="text-center text-xs text-slate-400 p-2">
                          <QrCode className="w-12 h-12 mx-auto text-slate-300 mb-1" />
                          Platform QR Code
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 text-center sm:text-left">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-brand-100 text-brand-800 border border-brand-300">
                        Official Platform QR
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-sm">
                        Scan with GPay / PhonePe / Paytm / BHIM
                      </h4>
                      <div className="text-xs text-slate-600">
                        Payee: <strong>{paymentSettings.upi_name || 'GymPulse Platform SaaS'}</strong>
                      </div>
                      
                      <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <code className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-mono text-xs font-bold text-slate-800 select-all">
                          {paymentSettings.upi_id || 'gympulse.admin@upi'}
                        </code>
                        <button
                          type="button"
                          onClick={handleCopyUpi}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600"
                          title="Copy UPI ID"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-500">
                        Amount to pay:{' '}
                        <strong className="text-slate-900 font-black">
                          {selectedPlan === 'starter' ? '₹999' : selectedPlan === 'business' ? '₹5,999' : '₹2,499'}
                        </strong>
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Transaction Reference / UTR ID (From UPI app) *
                    </label>
                    <input
                      type="text"
                      required={paymentMethod === 'qr_code'}
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      placeholder="e.g. 429381749210 or UPI-REF-..."
                      className="block w-full px-4 py-2.5 text-sm font-mono font-bold text-slate-900 bg-white rounded-xl border-2 border-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-500/20 focus:border-brand-600 caret-brand-600 shadow-xs"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Platform Super Admin will verify this UTR before activating your account.
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 2: Credit / Debit Card Payment */}
              {paymentMethod === 'card' && (
                <div className="bg-slate-50 border-2 border-indigo-200 rounded-2xl p-4 sm:p-5 space-y-3.5">
                  <div className="flex items-center gap-2 text-indigo-900 text-xs font-bold">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Secure Platform Card Checkout (256-bit SSL encrypted)</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Card Number *
                    </label>
                    <input
                      type="text"
                      value={cardData.number}
                      onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                      placeholder="4000 1234 5678 9010"
                      maxLength={19}
                      className="block w-full px-4 py-2.5 text-sm font-mono font-semibold text-slate-900 bg-white rounded-xl border-2 border-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-500/20 focus:border-brand-600 shadow-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Expiry Date *
                      </label>
                      <input
                        type="text"
                        value={cardData.expiry}
                        onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="block w-full px-4 py-2.5 text-sm font-mono text-slate-900 bg-white rounded-xl border-2 border-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-500/20 focus:border-brand-600 shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        CVV / CVC *
                      </label>
                      <input
                        type="password"
                        value={cardData.cvv}
                        onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                        placeholder="•••"
                        maxLength={4}
                        className="block w-full px-4 py-2.5 text-sm font-mono text-slate-900 bg-white rounded-xl border-2 border-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-500/20 focus:border-brand-600 shadow-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={cardData.name}
                      onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                      placeholder="e.g. Rahul Sharma"
                      className="block w-full px-4 py-2.5 text-sm text-slate-900 bg-white rounded-xl border-2 border-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-500/20 focus:border-brand-600 shadow-xs"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: Cash / Bank Wire */}
              {paymentMethod === 'cash' && (
                <div className="bg-slate-50 border-2 border-emerald-200 rounded-2xl p-4 sm:p-5 space-y-3.5">
                  <div className="flex items-center gap-2 text-emerald-900 text-xs font-bold">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span>Platform Bank Account for Direct Wire / Cash Deposit</span>
                  </div>

                  <div className="bg-white rounded-xl p-3 border border-slate-200 text-xs space-y-1.5 font-mono text-slate-800">
                    <div>Bank: <strong>{paymentSettings.bank_name || 'HDFC Bank'}</strong></div>
                    <div>Account Name: <strong>{paymentSettings.bank_account_name || 'GymPulse SaaS Ltd'}</strong></div>
                    <div>Account Number: <strong>{paymentSettings.bank_account || '50200012345678'}</strong></div>
                    <div>IFSC Code: <strong>{paymentSettings.bank_ifsc || 'HDFC0001234'}</strong></div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Deposit / Cash Receipt Note / Bank Reference *
                    </label>
                    <input
                      type="text"
                      required={paymentMethod === 'cash'}
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      placeholder="e.g. Bank IMPS Ref: 981240192 or Cash Paid at Headquarters"
                      className="block w-full px-4 py-2.5 text-sm font-semibold text-slate-900 bg-white rounded-xl border-2 border-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-500/20 focus:border-brand-600 shadow-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Note about admin approval and payment verification */}
            <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Important:</strong> Your registration and subscription payment will be queued for Super Admin review. You will receive immediate access once platform admin verifies your transaction and grants approval.
              </span>
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full py-3.5 font-black text-sm shadow-lg shadow-brand-500/25"
            >
              Submit Facility Registration & Payment Details
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onNavigateLogin}
              className="font-bold text-brand-600 hover:text-brand-700 hover:underline cursor-pointer"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
