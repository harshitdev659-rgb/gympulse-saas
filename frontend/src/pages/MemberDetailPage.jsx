import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Heart,
  CreditCard,
  ClipboardCheck,
  Receipt,
  UserCheck,
  Plus,
  Printer,
  AlertTriangle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ReceiptModal } from '../components/receipts/ReceiptModal';
import { formatCurrency } from '../utils/currency';

export const MemberDetailPage = ({ memberId, onBack }) => {
  const { gym } = useAuth();
  const toast = useToast();
  const [member, setMember] = useState(null);
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('memberships'); // memberships, attendance, payments

  // Assign / Renew Plan Modal
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [renewPlanId, setRenewPlanId] = useState('');
  const [renewStartDate, setRenewStartDate] = useState('');
  const [recordImmediatePayment, setRecordImmediatePayment] = useState(true);
  const [renewPaymentMethod, setRenewPaymentMethod] = useState('cash');

  // Record Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Receipt Modal
  const [selectedReceiptId, setSelectedReceiptId] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMemberDetail = async () => {
    try {
      setIsLoading(true);
      const data = await api.getMemberDetail(memberId);
      setMember(data);
    } catch (err) {
      toast.error('Failed to load member profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const p = await api.getPlans();
      setPlans(p);
      if (p.length > 0) setRenewPlanId(p[0].id);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMemberDetail();
    fetchPlans();
  }, [memberId]);

  const handleRenewMembership = async (e) => {
    e.preventDefault();
    if (!renewPlanId) return;
    setIsSubmitting(true);
    try {
      await api.assignMembership(memberId, {
        plan_id: Number(renewPlanId),
        start_date: renewStartDate || null,
        record_payment: recordImmediatePayment,
        payment_method: renewPaymentMethod
      });
      toast.success('Membership successfully assigned / renewed!');
      setIsRenewModalOpen(false);
      fetchMemberDetail();
    } catch (err) {
      toast.error(err.message || 'Failed to renew membership.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      toast.error('Please enter a valid payment amount.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.recordPayment({
        member_id: Number(memberId),
        amount: Number(paymentAmount),
        payment_method: paymentMethod,
        notes: paymentNotes
      });
      toast.success('Payment recorded successfully!');
      setIsPaymentModalOpen(false);
      setPaymentAmount('');
      setPaymentNotes('');
      fetchMemberDetail();

      // Open receipt automatically for printing
      setSelectedReceiptId(res.id);
      setIsReceiptModalOpen(true);
    } catch (err) {
      toast.error(err.message || 'Failed to record payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickCheckIn = async () => {
    try {
      await api.checkIn(memberId, 'manual');
      toast.success(`${member.full_name} marked present!`);
      fetchMemberDetail();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (isLoading || !member) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  const currency = gym?.currency || 'INR';

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-brand-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Members
      </button>

      {/* Member Profile Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-brand-500/20 flex-shrink-0">
            {member.first_name[0]}{member.last_name[0]}
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-slate-900">{member.full_name}</h2>
              <Badge variant={member.status === 'active' ? 'active' : member.status === 'expired' ? 'expired' : 'warning'}>
                {member.status}
              </Badge>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> {member.phone}
              </span>
              {member.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {member.email}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Joined {member.join_date}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <Button
            onClick={handleQuickCheckIn}
            variant="secondary"
            size="sm"
            icon={ClipboardCheck}
          >
            Mark Check-In
          </Button>

          <Button
            onClick={() => setIsPaymentModalOpen(true)}
            variant="secondary"
            size="sm"
            icon={Receipt}
          >
            Record Payment
          </Button>

          <Button
            onClick={() => setIsRenewModalOpen(true)}
            variant="primary"
            size="sm"
            icon={CreditCard}
          >
            Renew / Assign Plan
          </Button>
        </div>
      </div>

      {/* Meta Highlights Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current Plan</span>
          <div className="text-sm font-extrabold text-slate-900 mt-1">
            {member.current_plan_name || 'No active plan'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {member.membership_expiry_date ? `Expires: ${member.membership_expiry_date}` : 'Not subscribed'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Visits</span>
          <div className="text-sm font-extrabold text-slate-900 mt-1">{member.total_attended} visits</div>
          <div className="text-xs text-slate-500 mt-0.5">All-time check-ins</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Paid</span>
          <div className="text-sm font-extrabold text-emerald-600 mt-1">
            {currency} {member.total_paid.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Completed payments</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Emergency Contact</span>
          <div className="text-sm font-extrabold text-slate-900 mt-1 truncate">
            {member.emergency_contact_name || 'None listed'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{member.emergency_contact_phone || '--'}</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 flex gap-6">
        <button
          onClick={() => setActiveTab('memberships')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'memberships'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Memberships History ({member.memberships?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'attendance'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Attendance Log ({member.attendance_records?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'payments'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Payment Transactions ({member.payments?.length || 0})
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
        {/* Tab 1: Memberships */}
        {activeTab === 'memberships' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-6">Plan Name</th>
                  <th className="py-3 px-6">Start Date</th>
                  <th className="py-3 px-6">End Date</th>
                  <th className="py-3 px-6">Price Paid</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {member.memberships?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                      No membership records found.
                    </td>
                  </tr>
                ) : (
                  member.memberships?.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-6 font-bold text-slate-900">{sub.plan_name}</td>
                      <td className="py-3.5 px-6 text-xs text-slate-600">{sub.start_date}</td>
                      <td className="py-3.5 px-6 text-xs font-semibold text-slate-800">{sub.end_date}</td>
                      <td className="py-3.5 px-6 text-xs font-bold text-slate-900">{formatCurrency(sub.price_paid, currency)}</td>
                      <td className="py-3.5 px-6">
                        <Badge variant={sub.status === 'active' ? 'active' : 'expired'}>{sub.status}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Attendance */}
        {activeTab === 'attendance' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Check-In Time</th>
                  <th className="py-3 px-6">Check-Out Time</th>
                  <th className="py-3 px-6">Method</th>
                  <th className="py-3 px-6">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {member.attendance_records?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                      No attendance visits recorded.
                    </td>
                  </tr>
                ) : (
                  member.attendance_records?.map((att) => {
                    const dt = new Date(att.check_in_time);
                    const checkInStr = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const checkOutStr = att.check_out_time
                      ? new Date(att.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'In Progress';

                    return (
                      <tr key={att.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-6 text-xs font-bold text-slate-900">{dt.toISOString().split('T')[0]}</td>
                        <td className="py-3.5 px-6 text-xs text-slate-600">{checkInStr}</td>
                        <td className="py-3.5 px-6 text-xs text-slate-600">{checkOutStr}</td>
                        <td className="py-3.5 px-6 text-xs uppercase font-medium text-slate-500">{att.method}</td>
                        <td className="py-3.5 px-6 text-xs text-slate-400">{att.notes || '--'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Payments */}
        {activeTab === 'payments' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-6">Invoice #</th>
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Amount</th>
                  <th className="py-3 px-6">Method</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {member.payments?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                      No payment transactions recorded.
                    </td>
                  </tr>
                ) : (
                  member.payments?.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-6 text-xs font-mono font-bold text-slate-900">{pay.invoice_number}</td>
                      <td className="py-3.5 px-6 text-xs text-slate-600">{pay.payment_date}</td>
                      <td className="py-3.5 px-6 text-xs font-bold text-slate-900">{formatCurrency(pay.amount, currency)}</td>
                      <td className="py-3.5 px-6 text-xs capitalize text-slate-600">{pay.payment_method}</td>
                      <td className="py-3.5 px-6">
                        <Badge variant={pay.status === 'completed' ? 'active' : 'warning'}>{pay.status}</Badge>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => {
                            setSelectedReceiptId(pay.id);
                            setIsReceiptModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-bold text-brand-600 hover:bg-brand-50 rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" /> Receipt
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Renew / Assign Membership Modal */}
      <Modal
        isOpen={isRenewModalOpen}
        onClose={() => setIsRenewModalOpen(false)}
        title={`Renew / Assign Membership - ${member.full_name}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleRenewMembership} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Select Membership Plan
            </label>
            <select
              value={renewPlanId}
              onChange={(e) => setRenewPlanId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - {formatCurrency(p.price, currency)} ({p.duration_days} days)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Start Date (Optional)
            </label>
            <input
              type="date"
              value={renewStartDate}
              onChange={(e) => setRenewStartDate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Leave blank to automatically roll forward from current expiry or today.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Record Payment Immediately</label>
              <input
                type="checkbox"
                checked={recordImmediatePayment}
                onChange={(e) => setRecordImmediatePayment(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
            </div>

            {recordImmediatePayment && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Payment Method</label>
                <select
                  value={renewPaymentMethod}
                  onChange={(e) => setRenewPaymentMethod(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsRenewModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Confirm Subscription
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Record Payment for ${member.full_name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Payment Amount ({currency}) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="e.g. 49.99"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="online">Online / UPI</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Notes / Description
            </label>
            <input
              type="text"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="e.g. Personal training fee"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsPaymentModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Save & Print Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        paymentId={selectedReceiptId}
      />
    </div>
  );
};
