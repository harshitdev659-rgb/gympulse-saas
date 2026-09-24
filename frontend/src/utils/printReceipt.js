/**
 * Professional Printable Receipt Utility
 * Generates an isolated, printable invoice window that works across all browsers,
 * WebViews, and platforms without iframe security blocking or missing headers.
 */

export function printReceiptDocument({ gym, payment, member }) {
  const gymName = gym?.name || 'GymPulse Fitness Facility';
  const gymEmail = gym?.email || '';
  const gymPhone = gym?.phone || '';
  const gymAddress = gym?.address || '';
  const currency = gym?.currency || 'INR';

  const receiptNumber = payment?.receipt_number || `INV-${String(payment?.id || '0').padStart(6, '0')}`;
  const paymentDate = payment?.payment_date 
    ? new Date(payment.payment_date).toLocaleString() 
    : new Date().toLocaleString();
  
  const memberName = member 
    ? `${member.first_name || ''} ${member.last_name || ''}`.trim() 
    : (payment?.member_name || 'Valued Member');
  const memberPhone = member?.phone || payment?.member_phone || 'N/A';
  const memberEmail = member?.email || payment?.member_email || 'N/A';

  const amount = Number(payment?.amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const paymentMethod = (payment?.payment_method || 'Cash').toUpperCase();
  const paymentStatus = (payment?.status || 'Completed').toUpperCase();
  const notes = payment?.notes || 'Gym Membership & Facility Access';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Receipt - ${receiptNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      background-color: #ffffff;
      color: #0f172a;
      padding: 24px;
      font-size: 14px;
      line-height: 1.5;
    }
    .invoice-card {
      max-width: 650px;
      margin: 0 auto;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 32px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .gym-brand h1 {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .gym-brand p {
      font-size: 13px;
      color: #64748b;
      margin-top: 4px;
    }
    .invoice-meta {
      text-align: right;
    }
    .invoice-meta .receipt-badge {
      display: inline-block;
      background: #ecfdf5;
      color: #059669;
      font-weight: 700;
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
      border: 1px solid #a7f3d0;
    }
    .invoice-meta h2 {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
    }
    .invoice-meta p {
      font-size: 12px;
      color: #64748b;
    }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 28px;
      background-color: #f8fafc;
      padding: 16px;
      border-radius: 8px;
    }
    .details-box h3 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748b;
      margin-bottom: 6px;
      font-weight: 700;
    }
    .details-box p {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
    }
    .details-box .subtext {
      font-size: 12px;
      font-weight: normal;
      color: #64748b;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 28px;
    }
    th {
      background-color: #f1f5f9;
      color: #475569;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 14px;
      text-align: left;
    }
    td {
      padding: 14px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
    }
    .text-right {
      text-align: right;
    }
    .total-box {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 32px;
    }
    .total-table {
      width: 280px;
    }
    .total-table td {
      border: none;
      padding: 6px 12px;
    }
    .total-table .grand-total {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      border-top: 2px solid #cbd5e1;
      padding-top: 10px;
    }
    .footer {
      border-top: 1px dashed #cbd5e1;
      padding-top: 20px;
      text-align: center;
      color: #64748b;
      font-size: 12px;
    }
    .footer strong {
      color: #334155;
    }
    @media print {
      body {
        padding: 0;
        background: transparent;
      }
      .invoice-card {
        border: none;
        padding: 0;
        max-width: 100%;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div class="gym-brand">
        <h1>${gymName}</h1>
        ${gymAddress ? `<p>${gymAddress}</p>` : ''}
        ${gymPhone || gymEmail ? `<p>${[gymPhone, gymEmail].filter(Boolean).join(' • ')}</p>` : ''}
      </div>
      <div class="invoice-meta">
        <span class="receipt-badge">${paymentStatus}</span>
        <h2>${receiptNumber}</h2>
        <p>Date: ${paymentDate}</p>
      </div>
    </div>

    <div class="details-grid">
      <div class="details-box">
        <h3>Billed To (Member)</h3>
        <p>${memberName}</p>
        <p class="subtext">Phone: ${memberPhone}</p>
        ${memberEmail !== 'N/A' ? `<p class="subtext">Email: ${memberEmail}</p>` : ''}
      </div>
      <div class="details-box">
        <h3>Payment Information</h3>
        <p>Method: ${paymentMethod}</p>
        <p class="subtext">Transaction Status: ${paymentStatus}</p>
        <p class="subtext">Issued by: ${gymName} Management</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Payment Mode</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>Facility Membership & Training Access</strong><br>
            <span style="font-size: 12px; color: #64748b;">${notes}</span>
          </td>
          <td>${paymentMethod}</td>
          <td class="text-right" style="font-weight: 700;">${currency} ${amount}</td>
        </tr>
      </tbody>
    </table>

    <div class="total-box">
      <table class="total-table">
        <tr>
          <td>Subtotal:</td>
          <td class="text-right">${currency} ${amount}</td>
        </tr>
        <tr>
          <td>Tax (Included):</td>
          <td class="text-right">${currency} 0.00</td>
        </tr>
        <tr class="grand-total">
          <td>Total Paid:</td>
          <td class="text-right">${currency} ${amount}</td>
        </tr>
      </table>
    </div>

    <div class="footer">
      <p>Thank you for training with <strong>${gymName}</strong>!</p>
      <p style="margin-top: 4px; font-size: 11px;">Computer generated receipt • No physical signature required</p>
    </div>
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=800,height=900,menubar=no,toolbar=no,location=no,status=no');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    // Wait for DOM to render then trigger print
    setTimeout(() => {
      printWindow.print();
    }, 300);
  } else {
    // If popups blocked, inject a temporary printable iframe in current window
    const tempIframe = document.createElement('iframe');
    tempIframe.style.position = 'fixed';
    tempIframe.style.right = '0';
    tempIframe.style.bottom = '0';
    tempIframe.style.width = '0';
    tempIframe.style.height = '0';
    tempIframe.style.border = '0';
    document.body.appendChild(tempIframe);
    
    const doc = tempIframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
    tempIframe.contentWindow.focus();
    setTimeout(() => {
      tempIframe.contentWindow.print();
      document.body.removeChild(tempIframe);
    }, 500);
  }
}
