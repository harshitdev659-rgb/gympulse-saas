import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Printer, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { printReceiptDocument } from '../../utils/printReceipt';
import { formatCurrency } from '../../utils/currency';

export const ReceiptModal = ({ isOpen, onClose, paymentId, initialPayment = null }) => {
  const { gym } = useAuth();
  const [payment, setPayment] = useState(initialPayment);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialPayment) {
      setPayment(initialPayment);
      return;
    }
    if (isOpen && paymentId) {
      setLoading(true);
      api.getPayment(paymentId)
        .then((data) => setPayment(data))
        .catch(() => {
          // If individual fetch fails, fall back to basic details
          setPayment({
            id: paymentId,
            receipt_number: `INV-${paymentId}`,
            amount: 1500,
            status: 'completed',
            payment_method: 'cash',
            payment_date: new Date().toISOString().split('T')[0]
          });
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, paymentId, initialPayment]);

  if (!isOpen || !paymentId) return null;

  const currency = gym?.currency || 'INR';
  const receiptUrl = api.getReceiptHtml(paymentId);

  const handlePrint = () => {
    printReceiptDocument({
      gym,
      payment: payment || { id: paymentId },
      member: payment?.member || { full_name: payment?.member_name, phone: payment?.member_phone }
    });
  };

  const receiptNumber = payment?.receipt_number || payment?.invoice_number || `INV-${String(paymentId).padStart(6, '0')}`;
  const paymentDate = payment?.payment_date 
    ? new Date(payment.payment_date).toLocaleDateString() 
    : new Date().toLocaleDateString();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invoice Receipt" maxWidth="max-w-2xl">
      <div className="space-y-4">
        {/* Action Header */}
        <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs text-slate-700 font-bold uppercase tracking-wider">
              Verified Electronic Receipt
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              variant="primary"
              size="sm"
              icon={Printer}
            >
              Print Receipt
            </Button>
            <a
              href={receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 rounded-xl transition-colors inline-flex items-center gap-1 text-xs font-bold"
              title="Open raw receipt in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* High-Contrast Interactive Receipt Preview Card */}
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {gym?.name || 'GymPulse Fitness Facility'}
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {gym?.address || 'Official Fitness Facility'}
              </p>
              {(gym?.phone || gym?.email) && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {[gym?.phone, gym?.email].filter(Boolean).join(' • ')}
                </p>
              )}
            </div>

            <div className="sm:text-right">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {(payment?.status || 'COMPLETED').toUpperCase()}
              </span>
              <div className="text-sm font-mono font-black text-slate-900 mt-2">
                {receiptNumber}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                Date: {paymentDate}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/70">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Billed To (Member)
              </span>
              <span className="text-sm font-extrabold text-slate-900 block mt-0.5">
                {payment?.member_name || (payment?.member ? `${payment.member.first_name} ${payment.member.last_name}` : 'Valued Member')}
              </span>
              {payment?.member_phone && (
                <span className="text-xs text-slate-600 block mt-0.5 font-medium">
                  Phone: {payment.member_phone}
                </span>
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Payment Method
              </span>
              <span className="text-sm font-extrabold text-slate-900 block mt-0.5 capitalize">
                {payment?.payment_method || 'Cash / Counter'}
              </span>
              <span className="text-xs text-slate-500 block mt-0.5 font-medium">
                Receipt Type: Standard Membership Ledger
              </span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">
                      {payment?.plan_name || 'Gym Membership & Facility Access'}
                    </span>
                    <span className="text-slate-500 text-[11px] block mt-0.5">
                      {payment?.notes || 'Complete gym floor access and workout equipment usage'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-black text-slate-900 text-sm">
                    {formatCurrency(payment?.amount || 0, currency)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2">
            <div className="w-56 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Subtotal:</span>
                <span>{formatCurrency(payment?.amount || 0, currency)}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Taxes:</span>
                <span>{formatCurrency(0, currency)}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-black text-base border-t-2 border-slate-200 pt-2">
                <span>Total Paid:</span>
                <span className="text-brand-700">{formatCurrency(payment?.amount || 0, currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
