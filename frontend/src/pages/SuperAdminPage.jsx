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
  Trash2
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/currency';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const SuperAdminPage = ({ onPreviewWebsite }) => {
  const toast = useToast();
  const [metrics, setMetrics] = useState(null);
  const [gyms, setGyms] = useState([]);
  const [deletingGym, setDeletingGym] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [m, g] = await Promise.all([
        api.getPlatformMetrics(),
        api.getPlatformGyms()
      ]);
      setMetrics(m);
      setGyms(g);
    } catch (err) {
      toast.error(err.message || 'Failed to load platform data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (gymId, gymName) => {
    setActionLoadingId(gymId);
    try {
      await api.approveGym(gymId);
      toast.success(`Facility "${gymName}" approved & activated successfully!`);
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

  const handleConfirmDeleteFacility = async () => {
    if (!deletingGym) return;
    setActionLoadingId(deletingGym.id);
    try {
      const res = await api.deletePlatformGym(deletingGym.id);
      toast.success(res.message || `Facility "${deletingGym.name}" and its website permanently deleted.`);
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
            Review gym registrations, grant facility approvals, and monitor platform performance.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 border border-white/15"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Platform
        </button>
      </div>

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
          <div className="text-[11px] text-amber-700 mt-1">Requires your authorization</div>
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
                placeholder="Search gyms, owners, emails..."
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
              <option value="approved">Approved & Active</option>
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
                <th className="py-3 px-4">Plan & Fee</th>
                <th className="py-3 px-4">Approval Status</th>
                <th className="py-3 px-4">Public Website</th>
                <th className="py-3 px-5 text-right">Approval Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGyms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
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
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-brand-50 text-brand-700 border border-brand-200">
                          {g.plan_tier} Tier
                        </span>
                        <div className="font-bold text-slate-700 mt-1 text-xs">
                          {g.plan_tier === 'pro' ? '₹2,499/mo' : g.plan_tier === 'business' ? '₹5,999/mo' : '₹0/mo Free'}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-semibold">● Paid & Verified</div>
                      </td>

                      {/* Approval Status Badge */}
                      <td className="py-3.5 px-4">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-600" /> Pending Approval
                          </span>
                        ) : isApproved ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved & Active
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
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 hover:underline"
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
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-xs disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {isActionLoading ? 'Approving...' : 'Approve'}
                              </button>
                              <button
                                onClick={() => handleReject(g.id, g.name)}
                                disabled={isActionLoading}
                                className="px-2.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          ) : isApproved ? (
                            <button
                              onClick={() => handleReject(g.id, g.name)}
                              disabled={isActionLoading}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-[11px] font-semibold transition-colors"
                            >
                              Revoke
                            </button>
                          ) : (
                            <button
                              onClick={() => handleApprove(g.id, g.name)}
                              disabled={isActionLoading}
                              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs transition-colors"
                            >
                              Re-Approve
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteFacility(g)}
                            disabled={isActionLoading}
                            title="Permanently Delete Facility & Public Website"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
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
