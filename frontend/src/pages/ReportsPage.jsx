import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  DollarSign,
  Users,
  ClipboardCheck,
  TrendingUp,
  FileSpreadsheet,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { exportRevenueCsv, exportMembersListCsv, exportAttendanceLogCsv } from '../utils/csvExport';

export const ReportsPage = () => {
  const { gym } = useAuth();
  const toast = useToast();
  const [summary, setSummary] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const [sum, rev] = await Promise.all([
        api.getReportsSummary(),
        api.getRevenueReport(startDate || null, endDate || null)
      ]);
      setSummary(sum);
      setRevenueData(rev);
    } catch (err) {
      toast.error('Failed to load reports analytics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const handleExportRevenue = async () => {
    try {
      const rev = await api.getRevenueReport(startDate || null, endDate || null);
      const breakdown = rev?.daily_breakdown || [];
      const total = rev?.total_revenue ?? (summary?.total_revenue || 0);
      exportRevenueCsv(breakdown, total, currency);
      toast.success('Revenue report downloaded!');
    } catch (e) {
      toast.error('Failed to export revenue CSV.');
    }
  };

  const handleExportMembers = async () => {
    try {
      const members = await api.getMembers();
      exportMembersListCsv(members);
      toast.success('Members roster exported!');
    } catch (e) {
      toast.error('Failed to export members CSV.');
    }
  };

  const handleExportAttendance = async () => {
    try {
      const att = await api.getAttendanceHistory({ start_date: startDate || null, end_date: endDate || null });
      exportAttendanceLogCsv(att);
      toast.success('Attendance history exported!');
    } catch (e) {
      toast.error('Failed to export attendance CSV.');
    }
  };

  const currency = gym?.currency || 'USD';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Business Reports & Exports</h2>
          <p className="text-xs text-slate-500 mt-1">
            Analyze facility revenue, member growth, attendance patterns, and download clean CSVs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
          />
        </div>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Total Revenue</span>
            <DollarSign className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {currency} {(summary?.total_revenue || 0).toLocaleString()}
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">All-time collected</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Active Athletes</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {summary?.active_members || 0}
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">Out of {summary?.total_members || 0} total</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Expired Memberships</span>
            <Calendar className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">
            {summary?.expired_members || 0}
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">Opportunity for renewal</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Total Check-Ins</span>
            <ClipboardCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {(summary?.total_visits || 0).toLocaleString()}
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">Facility footfall</span>
        </div>
      </div>

      {/* Export Center Cards */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-1">Download CSV Reports</h3>
        <p className="text-xs text-slate-500 mb-6">Clean, structured spreadsheets ready for accounting and Excel.</p>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 text-brand-700 font-bold text-sm mb-2">
                <FileSpreadsheet className="w-5 h-5 text-brand-600" />
                <span>Revenue & Invoices</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Detailed transaction ledger including invoice numbers, member details, payment methods, and dates.
              </p>
            </div>
            <Button
              onClick={handleExportRevenue}
              variant="primary"
              size="sm"
              icon={Download}
              className="mt-4 w-full"
            >
              Download Revenue CSV
            </Button>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 text-emerald-700 font-bold text-sm mb-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>Member Directory</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Full roster of members with contact info, join dates, status, date of birth, and emergency contacts.
              </p>
            </div>
            <Button
              onClick={handleExportMembers}
              variant="secondary"
              size="sm"
              icon={Download}
              className="mt-4 w-full"
            >
              Download Members CSV
            </Button>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 text-indigo-700 font-bold text-sm mb-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <span>Attendance Logs</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Complete check-in and check-out timestamps, member visit durations, and method of check-in.
              </p>
            </div>
            <Button
              onClick={handleExportAttendance}
              variant="secondary"
              size="sm"
              icon={Download}
              className="mt-4 w-full"
            >
              Download Attendance CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown by Payment Method */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-1">Collections by Payment Method</h3>
        <p className="text-xs text-slate-500 mb-6">Breakdown across cash, card, and digital transactions in period.</p>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">
            <RefreshCw className="w-4 h-4 animate-spin mx-auto text-brand-600 mb-2" />
            Loading breakdown...
          </div>
        ) : revenueData?.by_method ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(revenueData.by_method).map(([method, amount]) => (
              <div key={method} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 capitalize">{method}</span>
                <div className="text-xl font-black text-slate-900 mt-1">
                  {currency} {Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-400">No payment data recorded in this timeframe.</div>
        )}
      </div>
    </div>
  );
};
