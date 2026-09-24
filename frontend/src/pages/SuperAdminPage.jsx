import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Building2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Globe, 
  ExternalLink, 
  Search, 
  RefreshCw, 
  IndianRupee, 
  Users, 
  AlertCircle,
  Filter,
  Trash2,
  QrCode,
  CreditCard,
  Banknote,
  Settings,
  ChevronDown,
  ChevronUp,
  Save,
  Copy
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/currency';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

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

export const SuperAdminPage = ({ onPreviewWebsite }) => {
  const toast = useToast();
  const [metrics, setMetrics] = useState(null);
  const [gyms, setGyms] = useState([]);
  const [deletingGym, setDeletingGym] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Platform Subscription Payment Settings State
  const [paymentSettings, setPaymentSettings] = useState(DEFAULT_PAYMENT_CONFIG);
  const [isPaymentSettingsOpen, setIsPaymentSettingsOpen] = useState(false);
  const [isSavingPaymentSettings, setIsSavingPaymentSettings] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [m, g, s] = await Promise.all([
        api.getPlatformMetrics(),
        api.getPlatformGyms(),
        api.getPlatformPaymentSettings().catch(() => null)
      ]);
      setMetrics(m);
      setGyms(g);
      if (s) {
        setPaymentSettings((prev) => ({ ...prev, ...s }));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load platform data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSavePaymentSettings = async (e) => {
    e.preventDefault();
    setIsSavingPaymentSettings(true);
    try {
      const updated = await api.updatePlatformPaymentSettings(paymentSettings);
      setPaymentSettings(updated);
      toast.success('Platform subscription payment methods & QR code saved successfully!');
      setIsPaymentSettingsOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to update payment settings.');
    } finally {
      setIsSavingPaymentSettings(false);
    }
  };

  const handleGenerateQrFromUpi = () => {
    if (!paymentSettings.upi_id) {
      toast.error('Please enter a UPI ID first.');
      return;
    }
    const upiUri = `upi://pay?pa=${encodeURIComponent(paymentSettings.upi_id)}&pn=${encodeURIComponent(paymentSettings.upi_name || 'GymPulse SaaS')}`;
    const generatedUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`;
    setPaymentSettings({ ...paymentSettings, upi_qr_url: generatedUrl });
    toast.success('Generated official UPI payment QR code URL!');
  };

  const handleApprove = async (gymId, gymName) => {
    setActionLoadingId(gymId);
    try {
      await api.approveGym(gymId);
      toast.success(`Payment verified! Facility "${gymName}" approved & activated.`);
      await fetchData();
    } catch (err) {
      toast.error(err.message || 'Approval failed.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (gymId, gymName) => {
    if (!window.confirm(`Are you sure you want to reject facility "${gymName}"?`)) return;
    setActionLoadingId(gymId);
    try {
      await api.rejectGym(gymId, 'Documentation verification requirement not met.');
      toast.info(`Facility "${gymName}" was rejected.`);
      await fetchData();
    } catch (err) {
      toast.error(err.message || 'Rejection failed.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteFacility = (gym) => {
    setDeletingGym(gym);
  };

  const handleApproveTierUpgrade = async (gymId, gymName, requestedTier) => {
    setActionLoadingId(gymId);
    try {
      await api.approveUpgrade(gymId);
      toast.success(`Payment verified! Facility "${gymName}" upgraded to ${requestedTier?.toUpperCase()} tier.`);
      await fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to approve tier upgrade.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmDeleteFacility = async () => {
    if (!deletingGym) return;
    setActionLoadingId(deletingGym.id);
    try {
      const res = await api.deletePlatformGym(deletingGym.id);
      toast.success(res.message || `Facility "${deletingGym.name}" permanently deleted.`);
      setDeletingGym(null);
      await fetchData();
    } catch (err) {
      toast.error(err.message || 'Deletion failed.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredGyms = gyms.filter((g) => {
    const matchesSearch = 
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.owner_name && g.owner_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (g.registration_payment_ref && g.registration_payment_ref.toLowerCase().includes(searchTerm.toLowerCase())) ||
      g.slug.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && g.approval_status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 text-brand-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-brand-400" /> Platform Owner Operations Console
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Super Admin Control Center
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Configure payment methods (QR, Card, Cash), verify subscription payments, and authorize gym facilities.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsPaymentSettingsOpen(!isPaymentSettingsOpen)}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-brand-600/30 cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>{isPaymentSettingsOpen ? 'Close Payment Settings' : 'Platform Payment Settings (QR/Card/Cash)'}</span>
            {isPaymentSettingsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 border border-white/15 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Expandable SuperAdmin Payment Settings Card */}
      {isPaymentSettingsOpen && (
        <div className="bg-white rounded-3xl border-2 border-brand-300 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-black text-brand-700 uppercase tracking-wider">
                <Settings className="w-4 h-4 text-brand-600" />
                SaaS Subscription Payment Methods Configuration
              </div>
              <h2 className="text-lg font-black text-slate-900 mt-1">
                Configure Online QR Code, UPI, Card &amp; Bank Transfer Details
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                These payment options are displayed to new facility owners during registration and on their pending status page.
              </p>
            </div>

            <button
              onClick={() => setIsPaymentSettingsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              &times;
            </button>
          </div>

          <form onSubmit={handleSavePaymentSettings} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* LEFT: Online UPI & QR Code Settings */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase">
                  <QrCode className="w-4 h-4 text-brand-600" />
                  1. Online UPI &amp; QR Code Configuration
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    UPI ID (VPA) *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentSettings.upi_id || ''}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, upi_id: e.target.value })}
                    placeholder="gympulse.admin@upi"
                    className="block w-full px-3.5 py-2 text-xs font-mono font-bold text-slate-900 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Payee Name / Merchant Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentSettings.upi_name || ''}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, upi_name: e.target.value })}
                    placeholder="GymPulse Platform SaaS"
                    className="block w-full px-3.5 py-2 text-xs font-semibold text-slate-900 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      QR Code Image URL *
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateQrFromUpi}
                      className="text-[11px] font-bold text-brand-600 hover:text-brand-800 underline"
                    >
                      Generate from UPI ID
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={paymentSettings.upi_qr_url || ''}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, upi_qr_url: e.target.value })}
                    placeholder="https://api.qrserver.com/v1/create-qr-code/..."
                    className="block w-full px-3.5 py-2 text-xs font-mono text-slate-900 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {paymentSettings.upi_qr_url && (
                  <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200">
                    <div className="w-20 h-20 bg-white p-1 rounded-lg border border-slate-200 flex-shrink-0">
                      <img 
                        src={paymentSettings.upi_qr_url} 
                        alt="QR Code Preview" 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="text-xs text-slate-600">
                      <strong className="text-slate-900 block">QR Code Preview</strong>
                      Scan with any UPI app to pay registration fees.
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT: Bank Wire & Card Settings */}
              <div className="space-y-4">
                {/* Bank Wire Details */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    2. Cash / Direct Bank Wire Details
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={paymentSettings.bank_name || ''}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, bank_name: e.target.value })}
                        placeholder="HDFC Bank"
                        className="block w-full px-3 py-1.5 text-xs text-slate-900 bg-white rounded-xl border border-slate-300"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Account Name
                      </label>
                      <input
                        type="text"
                        value={paymentSettings.bank_account_name || ''}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, bank_account_name: e.target.value })}
                        placeholder="GymPulse SaaS Ltd"
                        className="block w-full px-3 py-1.5 text-xs text-slate-900 bg-white rounded-xl border border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={paymentSettings.bank_account || ''}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, bank_account: e.target.value })}
                        placeholder="50200012345678"
                        className="block w-full px-3 py-1.5 text-xs font-mono text-slate-900 bg-white rounded-xl border border-slate-300"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        value={paymentSettings.bank_ifsc || ''}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, bank_ifsc: e.target.value })}
                        placeholder="HDFC0001234"
                        className="block w-full px-3 py-1.5 text-xs font-mono text-slate-900 bg-white rounded-xl border border-slate-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Credit / Debit Card Gateway Note */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    3. Credit / Debit Card Gateway
                  </div>
                  <p className="text-xs text-slate-500">
                    Card payments are simulated and logged during gym registration. You can verify card transaction IDs before approving facilities.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPaymentSettingsOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingPaymentSettings}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-extrabold transition-all flex items-center gap-2 shadow-md shadow-brand-600/30 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                {isSavingPaymentSettings ? 'Saving Settings...' : 'Save Payment Methods'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Facilities</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{metrics?.total_gyms || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Registered gyms across SaaS</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs bg-amber-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Pending Approvals</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-900 mt-2">{metrics?.pending_approvals || 0}</div>
          <div className="text-[11px] text-amber-700 mt-1">Awaiting payment verification</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Facilities</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{metrics?.active_facilities || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Operating live on GymPulse</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Platform GMV</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700 mt-2">
            {formatCurrency(metrics?.platform_mrr || 0, 'INR')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Estimated platform monthly MRR</div>
        </div>
      </div>

      {/* Pending Subscription Upgrades Card (Payment Verification) */}
      {gyms.some((g) => g.tier_upgrade_status === 'pending') && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping"></span>
            <h3 className="text-base font-black text-amber-950">
              Action Required: Pending Subscription Tier Upgrades ({gyms.filter((g) => g.tier_upgrade_status === 'pending').length})
            </h3>
          </div>
          <p className="text-xs text-amber-800">
            The following gym facilities have submitted an upgrade request. Please confirm receipt of offline/UPI payment before approving their tier upgrade.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gyms.filter((g) => g.tier_upgrade_status === 'pending').map((g) => (
              <div key={g.id} className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{g.name}</h4>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Owner: <strong className="text-slate-800">{g.owner_name}</strong> ({g.owner_email})
                  </div>
                  <div className="text-xs font-bold text-amber-900 mt-1 flex items-center gap-1.5 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 uppercase">{g.plan_tier}</span>
                    <span>&rarr;</span>
                    <span className="px-2 py-0.5 rounded bg-brand-100 text-brand-700 font-black uppercase">
                      {g.requested_plan_tier} TIER
                    </span>
                    <span className="text-slate-600 font-semibold">
                      ({g.requested_plan_tier === 'business' ? '₹5,999/mo' : '₹2,499/mo'})
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleApproveTierUpgrade(g.id, g.name, g.requested_plan_tier)}
                  disabled={actionLoadingId === g.id}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-colors flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {actionLoadingId === g.id ? 'Approving...' : 'Confirm Payment & Approve'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Facilities Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Registered Gym Facilities</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {filteredGyms.length}
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search gyms, owners, UTRs..."
                className="pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 w-52 sm:w-64"
              />
            </div>

            {/* Filter Dropdown */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Approval</option>
              <option value="approved">Approved &amp; Active</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-5">Gym / Facility</th>
                <th className="py-3 px-4">Owner Contact</th>
                <th className="py-3 px-4">Plan &amp; Fee</th>
                <th className="py-3 px-4">Payment Method &amp; Ref</th>
                <th className="py-3 px-4">Approval Status</th>
                <th className="py-3 px-4">Public Website</th>
                <th className="py-3 px-5 text-right">Approval Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGyms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No gym facilities match your search filter.
                  </td>
                </tr>
              ) : (
                filteredGyms.map((g) => {
                  const isActionLoading = actionLoadingId === g.id;
                  const isPending = g.approval_status === 'pending';
                  const isApproved = g.approval_status === 'approved';

                  return (
                    <tr key={g.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Gym Info */}
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900 text-sm">{g.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">slug: {g.slug}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Registered: {new Date(g.created_at).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Owner Contact */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{g.owner_name}</div>
                        <div className="text-slate-500 text-[11px]">{g.owner_email}</div>
                        <div className="text-slate-400 text-[11px]">{g.phone || 'No phone'}</div>
                      </td>

                      {/* Plan & Fee */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-brand-50 text-brand-700 border border-brand-200">
                            {g.plan_tier} Tier
                          </span>
                          {g.tier_upgrade_status === 'pending' && (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                              Pending: {g.requested_plan_tier?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-slate-700 mt-1 text-xs">
                          {g.plan_tier === 'pro' ? '₹2,499/mo' : g.plan_tier === 'business' ? '₹5,999/mo' : '₹999/mo Starter'}
                        </div>
                      </td>

                      {/* Payment Method & UTR */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {g.registration_payment_method === 'card' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <CreditCard className="w-3 h-3" /> Card
                            </span>
                          ) : g.registration_payment_method === 'cash' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Banknote className="w-3 h-3" /> Cash / Wire
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <QrCode className="w-3 h-3" /> Online QR
                            </span>
                          )}

                          <div className="font-mono text-[11px] text-slate-800 font-bold truncate max-w-[140px]" title={g.registration_payment_ref}>
                            {g.registration_payment_ref || 'No Ref'}
                          </div>

                          <div>
                            {g.payment_verified ? (
                              <span className="text-[10px] font-bold text-emerald-600">● Verified</span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-600 animate-pulse">● Unverified</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Approval Status Badge */}
                      <td className="py-3.5 px-4">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-600" /> Pending Approval
                          </span>
                        ) : isApproved ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved &amp; Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                            <XCircle className="w-3 h-3 text-rose-600" /> Rejected
                          </span>
                        )}
                      </td>

                      {/* Public Website Preview Link */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => onPreviewWebsite ? onPreviewWebsite(g.website_subdomain || g.slug) : window.open(`/facility/${g.website_subdomain || g.slug}`, '_blank')}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 hover:underline cursor-pointer"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>View Website</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isPending ? (
                            <>
                              <button
                                onClick={() => handleApprove(g.id, g.name)}
                                disabled={isActionLoading}
                                title="Confirm subscription payment and activate facility"
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-xs disabled:opacity-50 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {isActionLoading ? 'Approving...' : 'Verify Payment & Approve'}
                              </button>
                              <button
                                onClick={() => handleReject(g.id, g.name)}
                                disabled={isActionLoading}
                                className="px-2.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          ) : isApproved ? (
                            <button
                              onClick={() => handleReject(g.id, g.name)}
                              disabled={isActionLoading}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              Revoke
                            </button>
                          ) : (
                            <button
                              onClick={() => handleApprove(g.id, g.name)}
                              disabled={isActionLoading}
                              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs transition-colors cursor-pointer"
                            >
                              Re-Approve
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteFacility(g)}
                            disabled={isActionLoading}
                            title="Permanently Delete Facility & Public Website"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permanently Delete Facility Modal */}
      <ConfirmDialog
        isOpen={!!deletingGym}
        onClose={() => setDeletingGym(null)}
        onConfirm={handleConfirmDeleteFacility}
        title={`Permanently Delete "${deletingGym?.name}"?`}
        message={`CRITICAL ACTION: This will permanently delete gym "${deletingGym?.name}", its dedicated public website, and all its members, attendance records, and payment logs immediately.`}
        confirmText="Delete Facility"
        cancelText="Cancel"
        isDanger={true}
        isLoading={actionLoadingId === deletingGym?.id}
      />
    </div>
  );
};
