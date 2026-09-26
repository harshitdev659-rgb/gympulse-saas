/**
 * Universal CSV Export Utility
 * Handles RFC-4180 compliant CSV formatting, UTF-8 BOM encoding for Excel compatibility.
 * Uses File System Access API (showSaveFilePicker) so the user can pick the save location.
 * Falls back to classic <a download> for browsers without showSaveFilePicker support.
 */

function buildCsvBlob(headers, rows) {
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
  return new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
}

export async function downloadCsv(filename, headers, rows) {
  const safeFilename = filename.toLowerCase().endsWith('.csv') ? filename : `${filename}.csv`;
  const blob = buildCsvBlob(headers, rows);

  // Use File System Access API for custom save location if available
  if (typeof window !== 'undefined' && window.showSaveFilePicker) {
    try {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: safeFilename,
        types: [
          {
            description: 'CSV Spreadsheet',
            accept: { 'text/csv': ['.csv'] }
          }
        ]
      });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return; // Successfully saved
    } catch (err) {
      // User cancelled the picker or permission denied – fall through to classic download
      if (err.name === 'AbortError') return; // User cancelled, do nothing
      console.warn('showSaveFilePicker failed, falling back to classic download:', err);
    }
  }

  // Fallback: classic anchor-download (auto-saves to browser Downloads folder)
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', safeFilename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportRevenueCsv(dailyBreakdown = [], totalRevenue = 0, currency = 'INR') {
  const headers = ['Date', 'Transactions Count', `Total Revenue (${currency})`];
  const rows = dailyBreakdown.map((item) => [
    item.date || 'N/A',
    item.count || item.transactions || 1,
    item.amount || item.total || 0
  ]);

  // Append total summary row
  rows.push(['TOTAL REVENUE', dailyBreakdown.reduce((sum, d) => sum + (d.count || 1), 0), totalRevenue]);

  const today = new Date().toISOString().split('T')[0];
  await downloadCsv(`revenue-report-${today}.csv`, headers, rows);
}

export async function exportPaymentsLedgerCsv(payments = [], currency = 'INR') {
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
  await downloadCsv(`payments-ledger-${today}.csv`, headers, rows);
}

export async function exportMembersListCsv(members = []) {
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
    // Support both backend (active_membership) and mock (membership_expiry_date / current_plan_name) field names
    const activePlan = m.active_membership?.plan?.name || m.current_plan_name || m.plan_name || 'No Active Plan';
    const expiry = m.active_membership?.end_date || m.membership_expiry_date || m.expiry_date || 'N/A';
    const joined = m.join_date || (m.created_at ? new Date(m.created_at).toLocaleDateString() : 'N/A');
    return [
      m.id,
      `${m.first_name || ''} ${m.last_name || ''}`.trim() || m.full_name || 'N/A',
      m.phone || 'N/A',
      m.email || 'N/A',
      (m.status || 'active').toUpperCase(),
      activePlan,
      expiry,
      joined
    ];
  });

  const today = new Date().toISOString().split('T')[0];
  await downloadCsv(`members-roster-${today}.csv`, headers, rows);
}


export async function exportAttendanceLogCsv(attendanceList = []) {
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
  await downloadCsv(`attendance-log-${today}.csv`, headers, rows);
}
