import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  ArrowRight,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const QuickCheckInModal = ({
  isOpen,
  onClose,
  onSuccess,
  onNavigateAttendance
}) => {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [recentCheckIns, setRecentCheckIns] = useState([]);

  // Load initial members list when modal opens
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setMembers([]);
      return;
    }

    const loadInitialMembers = async () => {
      try {
        setIsLoading(true);
        const data = await api.getMembers({ limit: 10 });
        setMembers(data);
      } catch (err) {
        console.error('Failed to load initial members:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialMembers();
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    if (!searchTerm.trim()) return;

    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const results = await api.getMembers({ search: searchTerm.trim() });
        setMembers(results);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchTerm, isOpen]);

  const handleCheckIn = async (member) => {
    try {
      setProcessingId(member.id);
      const res = await api.checkIn(member.id, 'manual', 'Front desk quick check-in');
      toast.success(`${member.full_name} checked in successfully!`);
      
      // Keep track of recent checkins in this modal session
      setRecentCheckIns((prev) => [
        {
          id: member.id,
          name: member.full_name,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        ...prev
      ]);

      if (onSuccess) {
        onSuccess(member);
      }
    } catch (err) {
      toast.error(err.message || 'Check-in failed. Member may already be checked in.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Front Desk Quick Check-In"
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search athlete by name, phone, or email..."
            className="w-full pl-10 pr-4 py-2.5 text-sm font-extrabold text-slate-950 rounded-xl border-2 border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white placeholder:text-slate-500 placeholder:font-medium shadow-2xs"
          />
        </div>

        {/* Member Results List */}
        <div className="border-2 border-slate-200 rounded-2xl bg-slate-50/70 p-2 max-h-72 overflow-y-auto space-y-1.5">
          {isLoading ? (
            <div className="py-8 text-center text-slate-600 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-brand-600" />
              <span className="text-xs font-bold text-slate-900">Searching member records...</span>
            </div>
          ) : members.length === 0 ? (
            <div className="py-8 text-center text-slate-600 text-xs font-bold">
              {searchTerm ? `No athletes found matching "${searchTerm}".` : 'No athletes registered yet.'}
            </div>
          ) : (
            members.map((m) => {
              const isChecking = processingId === m.id;
              const isCheckedInJustNow = recentCheckIns.some((r) => r.id === m.id);

              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-300 hover:border-brand-500 transition-all shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-brand-100 border border-brand-300 text-brand-950 flex items-center justify-center font-black text-xs shrink-0">
                      {m.first_name?.[0]}{m.last_name?.[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-black text-slate-950 truncate">
                        {m.full_name}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <span>{m.phone || 'No phone'}</span>
                        <span>•</span>
                        <span className={`font-black uppercase tracking-wider ${
                          m.status === 'active' ? 'text-emerald-800' : 'text-slate-700'
                        }`}>
                          {m.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 ml-3">
                    {isCheckedInJustNow ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs font-black">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Checked In
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleCheckIn(m)}
                        disabled={isChecking}
                        icon={QrCode}
                        className="text-xs font-black bg-brand-600 hover:bg-brand-700 text-white shadow-2xs"
                      >
                        {isChecking ? 'Checking In...' : 'Check In'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info & link */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>Tip: Athletes can also check in using QR code scan.</span>
          {onNavigateAttendance && (
            <button
              onClick={onNavigateAttendance}
              className="text-brand-600 hover:text-brand-700 font-bold flex items-center gap-1 hover:underline"
            >
              View Attendance Log <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
