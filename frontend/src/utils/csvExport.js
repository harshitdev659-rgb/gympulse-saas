/**
 * Universal CSV Export Utility
 * Handles RFC-4180 compliant CSV formatting, UTF-8 BOM encoding for Excel compatibility,
 * and reliable browser file downloading without popup blockers or missing auth headers.
 */

export function downloadCsv(filename, headers, rows) {
  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvRows = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(','))
  ];

  const csvContent = csvRows.join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const safeFilename = filename.toLowerCase().endsWith('.csv') ? filename : `${filename}.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', safeFilename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportRevenueCsv(dailyBreakdown = [], totalRevenue = 0, currency = 'INR') {
  const headers = ['Date', 'Transactions Count', `Total Revenue (${currency})`];
  const rows = dailyBreakdown.map((item) => [
    item.date || 'N/A',
    item.count || item.transactions || 1,
    item.amount || item.total || 0
  ]);
  
  // Append total summary row
  rows.push(['TOTAL REVENUE', dailyBreakdown.reduce((sum, d) => sum + (d.count || 1), 0), totalRevenue]);
  
  const today = new Date().toISOString().split('T')[0];
  downloadCsv(`revenue-report-${today}.csv`, headers, rows);
}

export function exportPaymentsLedgerCsv(payments = [], currency = 'INR') {
  const headers = [
    'Invoice / Receipt #',
    'Date & Time',
    'Member Name',
    'Member Phone',
    `Amount (${currency})`,
    'Payment Method',
    'Status',
    'Notes'
  ];

  const rows = payments.map((p) => {
    const receiptNum = p.receipt_number || `INV-${String(p.id).padStart(5, '0')}`;
    const dateStr = p.payment_date ? new Date(p.payment_date).toLocaleString() : 'N/A';
    const memberName = p.member_name || (p.member ? `${p.member.first_name} ${p.member.last_name}` : 'Walk-in / Guest');
    const memberPhone = p.member_phone || (p.member ? p.member.phone : 'N/A');
    return [
      receiptNum,
      dateStr,
      memberName,
      memberPhone,
      p.amount || 0,
      (p.payment_method || 'cash').toUpperCase(),
      (p.status || 'completed').toUpperCase(),
      p.notes || ''
    ];
  });

  const today = new Date().toISOString().split('T')[0];
  downloadCsv(`payments-ledger-${today}.csv`, headers, rows);
}

export function exportMembersListCsv(members = []) {
  const headers = [
    'Member ID',
    'Full Name',
    'Phone',
    'Email',
    'Status',
    'Membership Plan',
    'Expiry Date',
    'Joined Date'
  ];

  const rows = members.map((m) => {
    const activePlan = m.active_membership?.plan?.name || m.plan_name || 'No Active Plan';
    const expiry = m.active_membership?.end_date || m.expiry_date || 'N/A';
    return [
      m.id,
      `${m.first_name || ''} ${m.last_name || ''}`.trim(),
      m.phone || 'N/A',
      m.email || 'N/A',
      (m.status || 'active').toUpperCase(),
      activePlan,
      expiry,
      m.created_at ? new Date(m.created_at).toLocaleDateString() : 'N/A'
    ];
  });

  const today = new Date().toISOString().split('T')[0];
  downloadCsv(`members-roster-${today}.csv`, headers, rows);
}

export function exportAttendanceLogCsv(attendanceList = []) {
  const headers = [
    'Log ID',
    'Date',
    'Check-in Time',
    'Check-out Time',
    'Member Name',
    'Check-in Method',
    'Notes'
  ];

  const rows = attendanceList.map((a) => {
    const memberName = a.member ? `${a.member.first_name} ${a.member.last_name}` : (a.member_name || 'Member');
    const checkIn = a.check_in_time ? new Date(a.check_in_time).toLocaleTimeString() : 'N/A';
    const checkOut = a.check_out_time ? new Date(a.check_out_time).toLocaleTimeString() : 'In Progress';
    const date = a.date || (a.check_in_time ? new Date(a.check_in_time).toLocaleDateString() : 'N/A');
    return [
      a.id,
      date,
      checkIn,
      checkOut,
      memberName,
      (a.method || 'manual').toUpperCase(),
      a.notes || ''
    ];
  });

  const today = new Date().toISOString().split('T')[0];
  downloadCsv(`attendance-log-${today}.csv`, headers, rows);
}
