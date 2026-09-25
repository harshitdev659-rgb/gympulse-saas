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
  Plus,
  Printer,
  Copy,
  ExternalLink,
  Sparkles,
  ShieldCheck
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
  const [isQrKioskOpen, setIsQrKioskOpen] = useState(false);

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

  const gymSlug = gym?.website_subdomain || gym?.slug || 'gym';
  const checkInUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/app.html?facility=${gymSlug}&action=checkin`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&margin=8&data=${encodeURIComponent(checkInUrl)}`;

  const handleCopyCheckInUrl = () => {
    navigator.clipboard?.writeText(checkInUrl);
    toast.success('Check-in link copied to clipboard!');
  };

  const handlePrintKioskStand = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups in your browser to print the kiosk stand.');
      return;
    }
    const gymName = gym?.name || 'GymPulse Fitness Facility';
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${gymName} - Front Desk Attendance QR</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; padding: 40px 20px; color: #020617; }
            .card { border: 5px solid #0f172a; border-radius: 32px; padding: 48px 36px; max-width: 520px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
            .badge { display: inline-block; background: #0f172a; color: white; padding: 8px 24px; border-radius: 9999px; font-weight: 900; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 24px; }
            h1 { font-size: 34px; font-weight: 900; margin: 0 0 8px; color: #0f172a; }
            p.sub { font-size: 16px; color: #334155; margin: 0 0 32px; font-weight: 700; }
            .qr-box { background: white; border: 3px solid #cbd5e1; border-radius: 24px; padding: 20px; display: inline-block; margin-bottom: 28px; }
            img { width: 280px; height: 280px; display: block; }
            .steps { font-size: 15px; font-weight: 800; color: #1e293b; text-align: left; max-width: 380px; margin: 0 auto; line-height: 1.8; }
            .step-item { margin: 6px 0; }
            .footer { margin-top: 40px; font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; border-top: 2px dashed #cbd5e1; pt: 20px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">Front Desk Self Check-In</div>
            <h1>${gymName}</h1>
            <p class="sub">Scan QR Code Upon Floor Entrance</p>
            <div class="qr-box">
              <img src="${qrImageUrl}" alt="Attendance QR Code" />
            </div>
            <div class="steps">
              <div class="step-item">📱 1. Open your smartphone camera or scanner</div>
              <div class="step-item">🎯 2. Scan this QR code to mark attendance</div>
              <div class="step-item">💪 3. Welcome to your workout!</div>
            </div>
            <div class="footer">GymPulse SaaS &bull; Verified Front Desk Kiosk</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadQr = () => {
    const link = document.createElement('a');
    link.href = qrImageUrl;
    link.download = `${gymSlug}-attendance-qr.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloaded Attendance QR Code image!');
  };

  const onFloorCount = todayAttendance.filter((a) => !a.check_out_time).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-950 tracking-tight">Attendance & Front Desk</h2>
          <p className="text-xs text-slate-700 font-semibold mt-1">
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
            onClick={() => setIsQrKioskOpen(true)}
            variant="secondary"
            size="sm"
            icon={QrCode}
            className="border-2 border-slate-300 text-slate-950 font-extrabold hover:bg-slate-100 shadow-xs"
          >
            Facility Attendance QR Kiosk
          </Button>

          <Button
            onClick={() => setIsCheckInModalOpen(true)}
            variant="primary"
            size="sm"
            icon={Plus}
            className="font-extrabold shadow-xs"
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
            className={`pb-3 text-sm font-extrabold border-b-2 transition-all flex items-center gap-2 ${
              activeView === 'today'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <Clock className="w-4 h-4" />
            Today's Roster ({todayAttendance.length})
          </button>

          <button
            onClick={() => setActiveView('history')}
            className={`pb-3 text-sm font-extrabold border-b-2 transition-all flex items-center gap-2 ${
              activeView === 'history'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            Attendance History Log
          </button>
        </div>

        {activeView === 'today' && (
          <div className="pb-2 hidden sm:flex items-center gap-2 text-xs font-black text-slate-900 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
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
                  <tr className="bg-slate-100/90 border-b border-slate-300 text-xs font-extrabold uppercase tracking-wider text-slate-900">
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
                      <td colSpan={6} className="py-12 text-center text-slate-600 font-bold">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-brand-600 mb-2" />
                        <span>Loading today's visits...</span>
                      </td>
                    </tr>
                  ) : todayAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 font-bold">
                        <ClipboardCheck className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                        <p className="text-sm font-extrabold text-slate-900">No Check-Ins Recorded Today</p>
                        <p className="text-xs text-slate-600 mt-1 font-medium">Check-in members as they arrive or have them scan the QR code.</p>
                        <div className="flex items-center justify-center gap-3 mt-4">
                          <Button onClick={() => setIsQrKioskOpen(true)} size="sm" variant="secondary" icon={QrCode}>
                            Show Attendance QR
                          </Button>
                          <Button onClick={() => setIsCheckInModalOpen(true)} size="sm" icon={Plus}>
                            Check-In First Member
                          </Button>
                        </div>
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
                        <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-extrabold text-slate-950 text-sm">{record.member_name}</div>
                            <div className="text-xs font-bold text-slate-800">{record.member_phone}</div>
                          </td>

                          <td className="py-4 px-6 text-xs text-slate-950 font-black">
                            {checkInTime}
                          </td>

                          <td className="py-4 px-6 text-xs font-bold text-slate-900">
                            {checkOutTime || <span className="text-emerald-700 font-extrabold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>On Floor</span>}
                          </td>

                          <td className="py-4 px-6 text-xs uppercase font-extrabold text-slate-950">
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
                                className="px-3.5 py-1.5 text-xs font-black bg-slate-200 hover:bg-slate-300 text-slate-950 rounded-lg transition-colors border border-slate-300 shadow-2xs cursor-pointer"
                              >
                                Check Out
                              </button>
                            ) : (
                              <span className="text-xs text-slate-500 font-bold">--</span>
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
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={historyStartDate}
                onChange={(e) => setHistoryStartDate(e.target.value)}
                className="px-3.5 py-2 text-xs font-bold text-slate-950 rounded-xl border-2 border-slate-300 bg-white shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-1.5">
                End Date
              </label>
              <input
                type="date"
                value={historyEndDate}
                onChange={(e) => setHistoryEndDate(e.target.value)}
                className="px-3.5 py-2 text-xs font-bold text-slate-950 rounded-xl border-2 border-slate-300 bg-white shadow-2xs"
              />
            </div>

            {(historyStartDate || historyEndDate) && (
              <button
                onClick={() => {
                  setHistoryStartDate('');
                  setHistoryEndDate('');
                }}
                className="mt-5 px-3 py-1.5 text-xs font-black text-slate-700 hover:text-slate-950 underline cursor-pointer"
              >
                Clear Dates
              </button>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 border-b border-slate-300 text-xs font-extrabold uppercase tracking-wider text-slate-900">
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
                      <td colSpan={5} className="py-12 text-center text-slate-500 font-bold">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-brand-600 mb-2" />
                        <span>Loading historical logs...</span>
                      </td>
                    </tr>
                  ) : historyAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 text-xs font-bold">
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
                        <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-6">
                            <div className="font-extrabold text-slate-950 text-sm">{rec.member_name}</div>
                            <div className="text-xs font-bold text-slate-800">{rec.member_phone}</div>
                          </td>
                          <td className="py-3.5 px-6 text-xs text-slate-950 font-bold">{inStr}</td>
                          <td className="py-3.5 px-6 text-xs text-slate-950 font-bold">{outStr}</td>
                          <td className="py-3.5 px-6 text-xs uppercase font-extrabold text-slate-950">{rec.method}</td>
                          <td className="py-3.5 px-6 text-xs text-slate-800 font-semibold">{rec.notes || '--'}</td>
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

      {/* Facility Attendance QR Kiosk Modal */}
      <Modal
        isOpen={isQrKioskOpen}
        onClose={() => setIsQrKioskOpen(false)}
        title="Facility Attendance QR Kiosk"
        maxWidth="max-w-md"
      >
        <div className="space-y-5 text-center">
          <div className="p-1 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-brand-600 inline-block">
            <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-center">
              <img
                src={qrImageUrl}
                alt="Facility Attendance QR Code"
                className="w-56 h-56 object-contain rounded-lg"
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-black text-slate-950">{gym?.name || 'Your Gym Facility'}</h3>
            <p className="text-xs font-bold text-brand-600 uppercase tracking-wider mt-0.5">
              Front Desk Attendance & Floor Access Pass
            </p>
            <p className="text-xs text-slate-700 font-medium mt-2 leading-relaxed max-w-sm mx-auto">
              Place this QR Code stand at your front desk or gym entrance. Athletes can scan with any mobile camera to log their check-in immediately.
            </p>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <Button
              onClick={handlePrintKioskStand}
              variant="primary"
              size="sm"
              icon={Printer}
              className="font-extrabold justify-center"
            >
              Print Stand (A4)
            </Button>

            <Button
              onClick={handleDownloadQr}
              variant="secondary"
              size="sm"
              icon={Download}
              className="font-extrabold justify-center border-2 border-slate-300 text-slate-900"
            >
              Download PNG
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={handleCopyCheckInUrl}
              className="text-xs font-bold text-slate-700 hover:text-brand-600 flex items-center gap-1.5 cursor-pointer underline"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Direct Check-In Link</span>
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
