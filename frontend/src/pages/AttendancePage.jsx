import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Search,
  CheckCircle2,
  Clock,
  QrCode,
  Download,
  Filter,
  UserCheck,
  UserX,
  RefreshCw,
  Plus
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const AttendancePage = ({ isCheckInModalOpen, setIsCheckInModalOpen, refreshTrigger }) => {
  const { gym } = useAuth();
  const toast = useToast();
  const [activeView, setActiveView] = useState('today'); // today, history
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [historyAttendance, setHistoryAttendance] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & checkin
  const [memberSearch, setMemberSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // History filters
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');

  const fetchToday = async () => {
    try {
      setIsLoading(true);
      const data = await api.getTodayAttendance();
      setTodayAttendance(data);
    } catch (err) {
      toast.error('Failed to load today attendance.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAttendanceHistory({
        start_date: historyStartDate || null,
        end_date: historyEndDate || null
      });
      setHistoryAttendance(data);
    } catch (err) {
      toast.error('Failed to load attendance history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeView === 'today') {
      fetchToday();
    } else {
      fetchHistory();
    }
  }, [activeView, historyStartDate, historyEndDate, refreshTrigger]);

  // Handle member search for checkin modal
  useEffect(() => {
    if (!memberSearch.trim()) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await api.getMembers({ search: memberSearch });
        setSearchResults(results);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [memberSearch]);

  const handlePerformCheckIn = async (member) => {
    try {
      await api.checkIn(member.id, 'manual');
      toast.success(`${member.full_name} checked in successfully!`);
      setIsCheckInModalOpen(false);
      setMemberSearch('');
      setSearchResults([]);
      fetchToday();
    } catch (err) {
      toast.error(err.message || 'Check-in failed.');
    }
  };

  const handleCheckOut = async (attendanceId, memberName) => {
    try {
      await api.checkOut(attendanceId);
      toast.success(`${memberName} checked out.`);
      fetchToday();
    } catch (err) {
      toast.error(err.message || 'Check-out failed.');
    }
  };

  const handleExportCsv = () => {
    const url = api.exportAttendanceCsvUrl(historyStartDate, historyEndDate);
    window.open(url, '_blank');
  };

  const onFloorCount = todayAttendance.filter((a) => !a.check_out_time).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Attendance & Front Desk</h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time athlete check-ins, active floor count, and historical visit logs.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {activeView === 'history' && (
            <Button
              onClick={handleExportCsv}
              variant="secondary"
              size="sm"
              icon={Download}
            >
              Export CSV
            </Button>
          )}

          <Button
            onClick={() => setIsCheckInModalOpen(true)}
            variant="primary"
            size="sm"
            icon={QrCode}
          >
            Check-In Member
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveView('today')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeView === 'today'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            Today's Roster ({todayAttendance.length})
          </button>

          <button
            onClick={() => setActiveView('history')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeView === 'history'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            Attendance History Log
          </button>
        </div>

        {activeView === 'today' && (
          <div className="pb-2 hidden sm:flex items-center gap-2 text-xs font-bold text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{onFloorCount} Members on floor now</span>
          </div>
        )}
      </div>

      {/* View 1: Today Roster */}
      {activeView === 'today' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-6">Member</th>
                    <th className="py-3.5 px-6">Check-In Time</th>
                    <th className="py-3.5 px-6">Check-Out Time</th>
                    <th className="py-3.5 px-6">Method</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-brand-600 mb-2" />
                        <span>Loading today's visits...</span>
                      </td>
                    </tr>
                  ) : todayAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <ClipboardCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="text-sm font-semibold text-slate-700">No Check-Ins Recorded Today</p>
                        <p className="text-xs text-slate-400 mt-1">Check-in members as they arrive at the front desk.</p>
                        <Button onClick={() => setIsCheckInModalOpen(true)} size="sm" className="mt-4">
                          Check-In First Member
                        </Button>
                      </td>
                    </tr>
                  ) : (
                    todayAttendance.map((record) => {
                      const isCheckedOut = !!record.check_out_time;
                      const checkInTime = new Date(record.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const checkOutTime = isCheckedOut
                        ? new Date(record.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : null;

                      return (
                        <tr key={record.id} className="hover:bg-slate-50/50">
                          <td className="py-4 px-6">
                            <div className="font-bold text-slate-900">{record.member_name}</div>
                            <div className="text-xs text-slate-400">{record.member_phone}</div>
                          </td>

                          <td className="py-4 px-6 text-xs text-slate-700 font-semibold">
                            {checkInTime}
                          </td>

                          <td className="py-4 px-6 text-xs text-slate-500">
                            {checkOutTime || <span className="text-emerald-600 font-bold">On Floor</span>}
                          </td>

                          <td className="py-4 px-6 text-xs uppercase font-medium text-slate-500">
                            {record.method}
                          </td>

                          <td className="py-4 px-6">
                            <Badge variant={isCheckedOut ? 'default' : 'active'}>
                              {isCheckedOut ? 'Completed' : 'Active Now'}
                            </Badge>
                          </td>

                          <td className="py-4 px-6 text-right">
                            {!isCheckedOut ? (
                              <button
                                onClick={() => handleCheckOut(record.id, record.member_name)}
                                className="px-3 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                              >
                                Check Out
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">--</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* View 2: History Log with Date Range */}
      {activeView === 'history' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={historyStartDate}
                onChange={(e) => setHistoryStartDate(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={historyEndDate}
                onChange={(e) => setHistoryEndDate(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
              />
            </div>

            {(historyStartDate || historyEndDate) && (
              <button
                onClick={() => {
                  setHistoryStartDate('');
                  setHistoryEndDate('');
                }}
                className="mt-4 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Clear Dates
              </button>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-6">Member</th>
                    <th className="py-3.5 px-6">Check-In</th>
                    <th className="py-3.5 px-6">Check-Out</th>
                    <th className="py-3.5 px-6">Method</th>
                    <th className="py-3.5 px-6">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-brand-600 mb-2" />
                        <span>Loading historical logs...</span>
                      </td>
                    </tr>
                  ) : historyAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                        No records found for selected period.
                      </td>
                    </tr>
                  ) : (
                    historyAttendance.map((rec) => {
                      const dt = new Date(rec.check_in_time);
                      const inStr = dt.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
                      const outStr = rec.check_out_time
                        ? new Date(rec.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'In Progress';

                      return (
                        <tr key={rec.id} className="hover:bg-slate-50/50">
                          <td className="py-3.5 px-6">
                            <div className="font-bold text-slate-900">{rec.member_name}</div>
                            <div className="text-xs text-slate-400">{rec.member_phone}</div>
                          </td>
                          <td className="py-3.5 px-6 text-xs text-slate-700">{inStr}</td>
                          <td className="py-3.5 px-6 text-xs text-slate-500">{outStr}</td>
                          <td className="py-3.5 px-6 text-xs uppercase text-slate-500">{rec.method}</td>
                          <td className="py-3.5 px-6 text-xs text-slate-400">{rec.notes || '--'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
