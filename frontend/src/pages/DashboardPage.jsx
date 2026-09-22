import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  ClipboardCheck,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
  Sparkles,
  QrCode,
  Calendar,
  CreditCard,
  RefreshCw,
  IndianRupee,
  Download,
  Share2,
  Copy,
  Check,
  Laptop,
  Smartphone,
  Apple
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { DownloadAppModal } from '../components/common/DownloadAppModal';
import { formatCurrency } from '../utils/currency';

export const DashboardPage = ({ setActiveTab, onQuickCheckIn, onOpenAi, refreshTrigger }) => {
  const { gym } = useAuth();
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      toast.error('Failed to load dashboard metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    api.getNetworkInfo()
      .then((data) => setNetworkInfo(data))
      .catch(() => {});
  }, [refreshTrigger]);

  const windowOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000';
  const downloadLink = `${windowOrigin}/api/download/windows`;

  const handleCopyDownloadLink = () => {
    navigator.clipboard.writeText(downloadLink);
    setCopiedShare(true);
    toast.success('Download link copied to clipboard!');
    setTimeout(() => setCopiedShare(false), 2200);
  };

  const handleCheckOut = async (attendanceId, memberName) => {
    try {
      await api.checkOut(attendanceId);
      toast.success(`${memberName} checked out successfully.`);
      fetchDashboardStats();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-slate-500">Loading facility dashboard...</span>
        </div>
      </div>
    );
  }

  const currency = gym?.currency || 'INR';

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-brand-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Operations Console
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {gym?.name}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time overview of active members, attendance, and revenue.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            onClick={fetchDashboardStats}
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
          >
            Refresh
          </Button>
          <Button
            onClick={onQuickCheckIn}
            variant="primary"
            size="sm"
            icon={QrCode}
          >
            Quick Check-In
          </Button>
        </div>
      </div>

      {/* Clean Standalone App Download Bar */}
      <div className="bg-white border border-emerald-200/90 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <span>Download Standalone App</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                PORTABLE ZIP (~20 MB)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Zero Python or setup required. Unzip and run standalone anywhere on Windows.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <a
            href="/api/download/windows"
            download="GymPulse_Windows_Portable.zip"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download App (.zip)</span>
          </a>
          <Button
            onClick={handleCopyDownloadLink}
            variant="secondary"
            size="sm"
            className="shrink-0"
          >
            {copiedShare ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            {copiedShare ? 'Copied' : 'Copy Download Link'}
          </Button>
        </div>
      </div>

      {/* Expiry Warning Box (If any memberships expiring soon) */}
      {stats?.expiring_soon_members > 0 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-200 text-amber-800">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">Renewal Alert</h4>
              <p className="text-sm font-medium text-amber-900">
                <strong>{stats.expiring_soon_members} membership(s)</strong> are expiring within the next 7 days.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('members')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            Review Members <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Active Members"
          value={stats?.active_members || 0}
          subtitle={`Out of ${stats?.total_members || 0} total registered`}
          icon={UserCheck}
          color="emerald"
          onClick={() => setActiveTab('members')}
        />

        <StatCard
          title="Today's Attendance"
          value={stats?.today_attendance || 0}
          subtitle={`${stats?.active_now || 0} on floor right now`}
          icon={ClipboardCheck}
          color="blue"
          onClick={() => setActiveTab('attendance')}
        />

        <StatCard
          title="This Month Revenue"
          value={formatCurrency(stats?.monthly_revenue || 0, currency)}
          subtitle={`Last month: ${formatCurrency(stats?.last_month_revenue || 0, currency)}`}
          icon={IndianRupee}
          color="purple"
          onClick={() => setActiveTab('payments')}
        />

        <StatCard
          title="Expiring Soon (7d)"
          value={stats?.expiring_soon_members || 0}
          subtitle={`${stats?.expired_members || 0} already expired`}
          icon={AlertTriangle}
          color="amber"
          onClick={() => setActiveTab('members')}
        />
      </div>

      {/* Middle Grid: Activity Feed & Chart Overview */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Attendance Activity (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Today's Check-Ins & Floor Activity</h3>
              <p className="text-xs text-slate-500">Live roster of members currently in facility</p>
            </div>
            <button
              onClick={() => setActiveTab('attendance')}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Full Log <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {stats?.recent_checkins && stats.recent_checkins.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {stats.recent_checkins.map((record) => {
                const isCheckedOut = !!record.check_out_time;
                const checkInTime = new Date(record.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const checkOutTime = isCheckedOut
                  ? new Date(record.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : null;

                return (
                  <div key={record.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs">
                        {record.member_name?.charAt(0) || 'M'}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{record.member_name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" /> In: {checkInTime}
                          </span>
                          {checkOutTime && <span>• Out: {checkOutTime}</span>}
                        </div>
                      </div>
                    </div>

                    <div>
                      {isCheckedOut ? (
                        <Badge variant="default" size="sm">Completed</Badge>
                      ) : (
                        <button
                          onClick={() => handleCheckOut(record.id, record.member_name)}
                          className="px-3 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                        >
                          Check Out
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <ClipboardCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-xs">No check-ins recorded yet today.</p>
              <Button onClick={onQuickCheckIn} size="sm" variant="secondary" className="mt-3">
                Check-in Member
              </Button>
            </div>
          )}
        </div>

        {/* AI Insight Sidecard (1 Col) */}
        <div className="bg-gradient-to-br from-brand-900 to-indigo-950 rounded-3xl p-6 text-white flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center gap-2 text-brand-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" /> AI Assistant Copilot
            </div>
            <h3 className="text-lg font-bold text-white leading-snug">
              Instant answers about your gym.
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Ask natural questions about revenue, retention, inactive members, and expiring subscriptions in real-time.
            </p>

            <div className="mt-6 space-y-2">
              <button
                onClick={() => onOpenAi("Who hasn't attended in the last 14 days?")}
                className="w-full text-left px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-between"
              >
                <span>"Who hasn't attended in 14 days?"</span>
                <ArrowRight className="w-3.5 h-3.5 text-brand-300" />
              </button>

              <button
                onClick={() => onOpenAi("What is our monthly revenue?")}
                className="w-full text-left px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-between"
              >
                <span>"What is our monthly revenue?"</span>
                <ArrowRight className="w-3.5 h-3.5 text-brand-300" />
              </button>
            </div>
          </div>

          <Button
            onClick={() => onOpenAi()}
            variant="primary"
            className="mt-6 w-full bg-brand-500 hover:bg-brand-400 text-white font-bold"
          >
            Launch AI Assistant
          </Button>
        </div>
      </div>

      {/* Revenue & Attendance Visual Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Revenue Bars */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Revenue Trends (Past 6 Months)</h3>
              <p className="text-xs text-slate-500">Completed membership & walk-in fees</p>
            </div>
            <span className="text-xs font-bold text-slate-700">{currency}</span>
          </div>

          <div className="space-y-3">
            {stats?.revenue_chart_data?.map((item, idx) => {
              const maxRev = Math.max(...(stats?.revenue_chart_data?.map((d) => d.revenue) || [1]), 100);
              const pct = Math.round((item.revenue / maxRev) * 100);

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-600">
                    <span>{item.month}</span>
                    <span className="font-bold text-slate-900">{formatCurrency(item.revenue, currency)}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Attendance Visits Bars */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Monthly Visits & Footfall</h3>
              <p className="text-xs text-slate-500">Total member check-ins per month</p>
            </div>
            <span className="text-xs font-bold text-slate-700">Visits</span>
          </div>

          <div className="space-y-3">
            {stats?.attendance_chart_data?.map((item, idx) => {
              const maxVisits = Math.max(...(stats?.attendance_chart_data?.map((d) => d.visits) || [1]), 10);
              const pct = Math.round((item.visits / maxVisits) * 100);

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-600">
                    <span>{item.month}</span>
                    <span className="font-bold text-slate-900">{item.visits} visits</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Multi-Platform Download App Modal */}
      <DownloadAppModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        networkInfo={networkInfo}
      />
    </div>
  );
};
