import React from 'react';
import { Modal } from '../common/Modal';
import { Printer, Download, ExternalLink } from 'lucide-react';
import { Button } from '../common/Button';
import { api } from '../../services/api';

export const ReceiptModal = ({ isOpen, onClose, paymentId }) => {
  if (!paymentId) return null;

  const receiptUrl = api.getReceiptHtml(paymentId);

  const handlePrint = () => {
    const iframe = document.getElementById('receipt-iframe');
    if (iframe) {
      iframe.contentWindow.print();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invoice Receipt" maxWidth="max-w-3xl">
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Electronic Payment Receipt</span>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              variant="primary"
              size="sm"
              icon={Printer}
            >
              Print / Save PDF
            </Button>
            <a
              href={receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-inner h-[500px]">
          <iframe
            id="receipt-iframe"
            src={receiptUrl}
            title="Receipt"
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </Modal>
  );
};
