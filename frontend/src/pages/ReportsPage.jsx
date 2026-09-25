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
  RefreshCw,
  AlertTriangle,
  MessageCircle,
  CheckCircle2,
  Clock,
  UserX
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
  const [atRiskMembers, setAtRiskMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const [sum, rev, members, attendance] = await Promise.all([
        api.getReportsSummary().catch(() => null),
        api.getRevenueReport(startDate || null, endDate || null).catch(() => null),
        api.getMembers().catch(() => []),
        api.getAttendanceHistory().catch(() => [])
      ]);
      setSummary(sum);
      setRevenueData(rev);

      // Compute At-Risk Members (Active members with no check-in in last 7+ days)
      const now = new Date();
      const lastCheckInMap = {};
      if (Array.isArray(attendance)) {
        attendance.forEach((att) => {
          const mId = att.member_id;
          const attTime = new Date(att.check_in_time).getTime();
          if (!isNaN(attTime) && (!lastCheckInMap[mId] || attTime > lastCheckInMap[mId])) {
            lastCheckInMap[mId] = attTime;
          }
        });
      }

      if (Array.isArray(members)) {
        const atRisk = members
          .filter((m) => m.status === 'active' || m.status === 'expiring')
          .map((m) => {
            const lastTime = lastCheckInMap[m.id];
            let daysInactive = 999;
            let lastVisitText = 'Never checked in';
            if (lastTime) {
              const diffMs = now.getTime() - lastTime;
              daysInactive = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
              lastVisitText = daysInactive === 0 ? 'Today' : `${daysInactive} day${daysInactive > 1 ? 's' : ''} ago`;
            }
            return {
              ...m,
              daysInactive,
              lastVisitText,
              lastCheckInTimestamp: lastTime || 0
            };
          })
          .filter((m) => m.daysInactive >= 7)
          .sort((a, b) => b.daysInactive - a.daysInactive);

        setAtRiskMembers(atRisk);
      }
    } catch (err) {
      toast.error('Failed to load reports analytics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const handleReEngageWhatsApp = (member) => {
    if (!member.phone) {
      toast.error('No phone number recorded for this athlete.');
      return;
    }
    const cleanPhone = member.phone.replace(/[^0-9]/g, '');
    const gymName = gym?.name || 'our fitness facility';
    const memberName = member.first_name || member.full_name || 'Champion';
    const daysText = member.daysInactive >= 900 ? 'a while' : `${member.daysInactive} days`;
    
    const message = `Hello ${memberName}! 🏋️\n\nWe noticed you haven't visited *${gymName}* in ${daysText}. We miss seeing you crushing your workouts!\n\nConsistency is key to hitting your goals, and your fitness team is here to support you. Let us know if your schedule changed or if you'd like a quick workout refresh with one of our trainers! 💪🔥\n\nSee you on the gym floor soon!`;
    
    const targetPhone = cleanPhone.startsWith('91') || cleanPhone.length > 10 ? cleanPhone : `91${cleanPhone}`;
    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

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

      {/* Athlete Retention & At-Risk Churn Alerts */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Athlete Retention & Churn Prevention</h3>
                {atRiskMembers.length > 0 ? (
                  <span className="px-2.5 py-0.5 text-xs font-black rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                    {atRiskMembers.length} At-Risk
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 text-xs font-black rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                    Optimal
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Active paying members who haven't checked into your gym in 7+ days. Re-engage them directly before they drop out.
              </p>
            </div>
          </div>
          {atRiskMembers.length > 0 && (
            <span className="text-xs text-slate-400 font-medium">
              Showing top inactive athletes
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">
            <RefreshCw className="w-4 h-4 animate-spin mx-auto text-brand-600 mb-2" />
            Evaluating member attendance records...
          </div>
        ) : atRiskMembers.length === 0 ? (
          <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">High Member Engagement!</h4>
              <p className="text-xs text-emerald-700 mt-0.5">
                All currently active members have checked into the facility within the last 7 days. Athlete retention is looking great!
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Athlete</th>
                  <th className="py-3 px-4">Membership Pass</th>
                  <th className="py-3 px-4">Last Gym Check-In</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4 text-right">Instant Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {atRiskMembers.slice(0, 10).map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{member.full_name || `${member.first_name} ${member.last_name}`}</div>
                      <div className="text-[11px] text-slate-400">{member.phone || 'No phone'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{member.current_plan_name || 'Standard Pass'}</div>
                      <div className="text-[11px] text-slate-400">
                        {member.membership_expiry_date ? `Expires ${member.membership_expiry_date}` : 'Ongoing'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{member.lastVisitText}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {member.daysInactive >= 21 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          Critical ({member.daysInactive >= 900 ? 'Never' : `${member.daysInactive}d`})
                        </span>
                      ) : member.daysInactive >= 14 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          High ({member.daysInactive}d)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">
                          Moderate ({member.daysInactive}d)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleReEngageWhatsApp(member)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                        title="Open WhatsApp chat with pre-written re-engagement message"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Re-Engage on WhatsApp</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
