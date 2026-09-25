import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Download,
  Plus,
  Printer,
  Calendar,
  DollarSign,
  CreditCard,
  RefreshCw,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ReceiptModal } from '../components/receipts/ReceiptModal';
import { formatCurrency } from '../utils/currency';
import { exportPaymentsLedgerCsv } from '../utils/csvExport';

export const PaymentsPage = () => {
  const { gym } = useAuth();
  const toast = useToast();
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Record payment modal
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordMemberId, setRecordMemberId] = useState('');
  const [recordAmount, setRecordAmount] = useState('');
  const [recordMethod, setRecordMethod] = useState('card');
  const [recordNotes, setRecordNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Receipt Modal
  const [selectedReceiptId, setSelectedReceiptId] = useState(null);
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const data = await api.getPayments({
        status_filter: statusFilter,
        start_date: startDate || null,
        end_date: endDate || null
      });
      setPayments(data);
    } catch (err) {
      toast.error('Failed to load payment transactions.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const data = await api.getMembers();
      setMembers(data);
      if (data.length > 0) setRecordMemberId(data[0].id);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchMembers();
  }, [statusFilter, startDate, endDate]);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!recordMemberId || !recordAmount || Number(recordAmount) <= 0) {
      toast.error('Please select member and enter valid amount.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.recordPayment({
        member_id: Number(recordMemberId),
        amount: Number(recordAmount),
        payment_method: recordMethod,
        notes: recordNotes
      });
      toast.success('Payment recorded successfully!');
      setIsRecordModalOpen(false);
      setRecordAmount('');
      setRecordNotes('');
      fetchPayments();

      // Prompt receipt
      setSelectedReceiptId(res.id);
      setSelectedReceiptPayment(res);
      setIsReceiptModalOpen(true);
    } catch (err) {
      toast.error(err.message || 'Failed to record payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCsv = async () => {
    if (payments.length === 0) {
      toast.error('No payments found in current filter to export.');
      return;
    }
    await exportPaymentsLedgerCsv(payments, currency);
    toast.success('Payments ledger ready — choose where to save it!');
  };

  const currency = gym?.currency || 'INR';
  const totalCompletedRevenue = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Payments & Invoicing</h2>
          <p className="text-xs text-slate-500 mt-1">
            Complete transaction ledger, cash/card collections, and printable member receipts.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            onClick={handleExportCsv}
            variant="secondary"
            size="sm"
            icon={Download}
          >
            Export CSV
          </Button>

          <Button
            onClick={() => setIsRecordModalOpen(true)}
            variant="primary"
            size="sm"
            icon={Plus}
          >
            Record Payment
          </Button>
        </div>
      </div>

      {/* Overview Stat Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Filtered Collections</span>
          <div className="text-3xl font-black text-slate-900 mt-1">
            {formatCurrency(totalCompletedRevenue, currency)}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Across {payments.length} transactions in this period</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 text-xs font-black rounded-xl border-2 border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-slate-950 shadow-2xs"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border-2 border-slate-300 bg-white text-slate-950 shadow-2xs"
            title="Start Date"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border-2 border-slate-300 bg-white text-slate-950 shadow-2xs"
            title="End Date"
          />

          {(startDate || endDate || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setStatusFilter('all');
              }}
              className="text-xs font-black text-slate-700 hover:text-slate-950 px-2 py-1 underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-300 text-xs font-extrabold uppercase tracking-wider text-slate-900">
                <th className="py-3.5 px-6">Invoice Number</th>
                <th className="py-3.5 px-6">Member</th>
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6">Amount</th>
                <th className="py-3.5 px-6">Method</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-bold">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-brand-600 mb-2" />
                    <span>Loading transactions...</span>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-bold">
                    <Receipt className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                    <p className="text-sm font-extrabold text-slate-900">No Transactions Found</p>
                    <p className="text-xs text-slate-600 mt-1 font-medium">Record a new payment to generate an invoice.</p>
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs font-black text-slate-950">
                      {p.invoice_number}
                    </td>

                    <td className="py-4 px-6">
                      <span className="font-extrabold text-slate-950 text-sm block">{p.member_name}</span>
                      {p.plan_name && (
                        <div className="text-xs font-bold text-slate-700 mt-0.5">{p.plan_name}</div>
                      )}
                    </td>

                    <td className="py-4 px-6 text-xs text-slate-950 font-black whitespace-nowrap">
                      {p.payment_date}
                    </td>

                    <td className="py-4 px-6 text-xs font-black text-slate-950">
                      {formatCurrency(p.amount, currency)}
                    </td>

                    <td className="py-4 px-6 text-xs capitalize text-slate-950 font-bold">
                      {p.payment_method}
                    </td>

                    <td className="py-4 px-6">
                      <Badge variant={p.status === 'completed' ? 'active' : 'warning'}>
                        {p.status}
                      </Badge>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => {
                          setSelectedReceiptId(p.id);
                          setSelectedReceiptPayment(p);
                          setIsReceiptModalOpen(true);
                        }}
                        className="px-3 py-1.5 text-xs font-black text-brand-700 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 rounded-lg border border-brand-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Record Payment Transaction"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Select Member *
            </label>
            <select
              required
              value={recordMemberId}
              onChange={(e) => setRecordMemberId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name} ({m.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Amount ({currency}) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                min="0.01"
                value={recordAmount}
                onChange={(e) => setRecordAmount(e.target.value)}
                placeholder="49.99"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Payment Method
              </label>
              <select
                value={recordMethod}
                onChange={(e) => setRecordMethod(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="cash">Cash</option>
                <option value="card">Credit/Debit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="online">Online / UPI</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Notes / Description
            </label>
            <input
              type="text"
              value={recordNotes}
              onChange={(e) => setRecordNotes(e.target.value)}
              placeholder="e.g. Monthly membership renewal fee"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsRecordModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Save & View Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setSelectedReceiptPayment(null);
        }}
        paymentId={selectedReceiptId}
        initialPayment={selectedReceiptPayment}
      />
    </div>
  );
};
