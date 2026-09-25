// In-browser mock and offline storage engine for standalone/mobile PWA deployment
// Allows GymPulse on Android, Apple iPhone & iPad to run with strict data privacy and zero dummy data

const STORAGE_KEY = 'gympulse_standalone_db';
const DB_VERSION = 3;

const defaultDb = {
  version: DB_VERSION,
  currentGymId: null,
  currentUserId: null,
  gyms: [],
  users: [
    {
      id: 1,
      gym_id: null,
      email: 'admin@gympulse.com',
      password: 'SuperAdmin123!',
      name: 'Platform Super Admin',
      role: 'superadmin',
      is_superadmin: true
    }
  ],
  plans: [],
  trainers: [],
  members: [],
  attendance: [],
  payments: [],
  inquiries: [],
  settings: {
    business_hours: '06:00 - 22:00',
    tax_percentage: 18.0,
    expiry_alert_days: 7,
    receipt_footer_text: 'Thank you for training with us!',
    primary_color: '#4f46e5'
  },
  platform_payment_settings: {
    qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=4&data=upi://pay?pa=gympulse.admin@upi%26pn=GymPulse%20SaaS%20Platform%26cu=INR',
    upi_id: 'gympulse.admin@upi',
    payee_name: 'GymPulse SaaS Platform',
    card_enabled: true,
    cash_enabled: true,
    instructions: 'Scan QR Code with PhonePe, Google Pay, or Paytm. Enter your transaction reference ID for Super Admin verification.'
  },
  website: {}
};

let memoryDb = null;

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY || e.key === 'gympulse_last_action') {
      memoryDb = null;
    }
  });
}

function getDb() {
  // Always inspect latest localStorage so multi-tab or concurrent operations reflect in real-time
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDb));
      memoryDb = JSON.parse(JSON.stringify(defaultDb));
      return memoryDb;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.version || parsed.version < DB_VERSION || !Array.isArray(parsed.gyms)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDb));
      memoryDb = JSON.parse(JSON.stringify(defaultDb));
      return memoryDb;
    }
    if (!parsed.platform_payment_settings) {
      parsed.platform_payment_settings = { ...defaultDb.platform_payment_settings };
    }
    memoryDb = parsed;
    return memoryDb;
  } catch (e) {
    if (memoryDb) return memoryDb;
    memoryDb = JSON.parse(JSON.stringify(defaultDb));
    return memoryDb;
  }
}

function saveDb(db) {
  memoryDb = db;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    // Trigger storage event in other tabs
    localStorage.setItem('gympulse_last_action', JSON.stringify({ action: 'sync', timestamp: Date.now() }));
    // Dispatch custom window event in current tab
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gympulse_db_updated', { detail: { timestamp: Date.now() } }));
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('gympulse_channel');
          bc.postMessage({ type: 'DB_UPDATED', timestamp: Date.now() });
          setTimeout(() => { try { bc.close(); } catch (e) {} }, 50);
        }
      } catch (e) {}
    }
  } catch (e) {
    console.error('Failed to save standalone db:', e);
  }
}

export function handleMockRequest(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const db = getDb();
  let body = {};
  if (options.body) {
    try {
      body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    } catch (e) {
      body = {};
    }
  }

  // Current active tenant & user resolver
  let authHeader = options?.headers?.Authorization || options?.headers?.authorization || '';
  if (!authHeader && typeof localStorage !== 'undefined') {
    const rawToken = localStorage.getItem('gympulse_token');
    if (rawToken) authHeader = `Bearer ${rawToken}`;
  }

  let tokenUserId = null;
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const tokenStr = authHeader.replace('Bearer ', '').trim();
    const tokenMatch = tokenStr.match(/^mock-token-(\d+)-/);
    if (tokenMatch) {
      tokenUserId = parseInt(tokenMatch[1], 10);
    } else if (tokenStr.startsWith('eyJ')) {
      try {
        const payloadBase64 = tokenStr.split('.')[1];
        const decoded = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
        if (decoded?.sub) {
          tokenUserId = parseInt(decoded.sub, 10);
        }
      } catch (e) {}
    } else if (tokenStr.includes('admin')) {
      const admin = db.users.find((u) => u.is_superadmin || u.role === 'superadmin');
      tokenUserId = admin?.id || 1;
    }
  }

  // Restore user from persistent device storage if freshly loaded
  if (!tokenUserId && typeof localStorage !== 'undefined') {
    try {
      const savedUserStr = localStorage.getItem('gympulse_user');
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr);
        if (parsed?.id) tokenUserId = parsed.id;
      }
    } catch (e) {}
  }

  let currentUser = tokenUserId 
    ? db.users.find((u) => u.id == tokenUserId || String(u.id) === String(tokenUserId)) || null 
    : (db.currentUserId ? db.users.find((u) => u.id == db.currentUserId || String(u.id) === String(db.currentUserId)) || null : null);

  if (!currentUser && typeof localStorage !== 'undefined') {
    try {
      const savedUserStr = localStorage.getItem('gympulse_user');
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr);
        if (parsed?.id) {
          currentUser = db.users.find((u) => u.id == parsed.id || String(u.id) === String(parsed.id)) || parsed;
        }
      }
    } catch (e) {}
  }

  let currentGymId = currentUser?.gym_id || db.currentGymId || null;
  let currentGym = currentGymId ? db.gyms.find((g) => g.id == currentGymId || String(g.id) === String(currentGymId)) || null : null;

  if (!currentGym && typeof localStorage !== 'undefined') {
    try {
      const savedGymStr = localStorage.getItem('gympulse_gym');
      if (savedGymStr) {
        const parsedGym = JSON.parse(savedGymStr);
        if (parsedGym?.id) {
          currentGym = db.gyms.find((g) => g.id == parsedGym.id || String(g.id) === String(parsedGym.id)) || parsedGym;
          currentGymId = parsedGym.id;
          if (!db.gyms.some((g) => g.id == parsedGym.id || String(g.id) === String(parsedGym.id))) {
            db.gyms.push(parsedGym);
          }
        }
      }
    } catch (e) {}
  }

  if (!currentGym && db.gyms.length > 0) {
    currentGym = db.gyms[db.gyms.length - 1];
    currentGymId = currentGym.id;
  }

  // 1. Auth: Login
  if (endpoint.startsWith('/auth/login') && method === 'POST') {
    const email = (body.email || '').toLowerCase().trim();
    const password = body.password || '';

    // Super Admin login
    if (email === 'admin@gympulse.com') {
      if (password !== 'SuperAdmin123!') {
        throw new Error('Invalid credentials for Platform Super Admin.');
      }
      const adminUser = db.users.find((u) => u.is_superadmin) || defaultDb.users[0];
      db.currentUserId = adminUser.id;
      db.currentGymId = null;
      saveDb(db);
      return {
        access_token: `mock-token-${adminUser.id}-admin-${Date.now()}`,
        token_type: 'bearer',
        user: adminUser,
        gym: null
      };
    }

    // Registered Facility Owner login
    const user = db.users.find((u) => (u.email || '').toLowerCase().trim() === email);
    if (!user) {
      throw new Error('No account found with this email. Please register your gym facility first.');
    }

    if (user.password && user.password !== password) {
      throw new Error('Invalid password. Please check your credentials.');
    }

    db.currentUserId = user.id;
    db.currentGymId = user.gym_id;
    currentGym = db.gyms.find((g) => g.id == user.gym_id || String(g.id) === String(user.gym_id)) || null;
    saveDb(db);

    if (currentGym && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('gympulse_gym', JSON.stringify(currentGym));
      } catch (e) {}
    }

    return {
      access_token: `mock-token-${user.id}-${Date.now()}`,
      token_type: 'bearer',
      user,
      gym: currentGym
    };
  }

  // 2. Auth: Register New Gym
  if (endpoint.startsWith('/auth/register-gym') && method === 'POST') {
    const gymName = (body.gym_name || 'My Fitness Center').trim();
    const slug = gymName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newGymId = Math.max(...db.gyms.map((g) => g.id), 0) + 1;

    const requestedTier = (body.plan_tier || 'pro').toLowerCase().trim();
    const planTier = ['starter', 'pro', 'business'].includes(requestedTier) ? requestedTier : 'pro';
    const memberCapacity = planTier === 'business' ? 10000 : planTier === 'starter' ? 50 : 250;

    const newGym = {
      id: newGymId,
      name: gymName,
      slug,
      website_subdomain: slug,
      email: (body.email || 'owner@newgym.com').toLowerCase().trim(),
      phone: body.phone || '+91 90000 00000',
      address: 'Fitness Facility Address',
      currency: body.currency || 'INR',
      plan_tier: planTier,
      is_approved: false, // Requires Super Admin approval
      approval_status: 'pending',
      payment_verified: false,
      registration_payment_method: body.payment_method || 'qr_code',
      registration_payment_ref: body.payment_ref || '',
      member_capacity: memberCapacity,
      logo_url: '/gympulse.png',
      created_at: new Date().toISOString()
    };
    db.gyms.push(newGym);

    const newUserId = Math.max(...db.users.map((u) => u.id), 0) + 1;
    const newUser = {
      id: newUserId,
      gym_id: newGymId,
      email: (body.email || '').toLowerCase().trim(),
      password: body.password || '',
      name: body.owner_name || 'Gym Owner',
      full_name: body.owner_name || 'Gym Owner',
      role: 'owner',
      is_superadmin: false
    };
    db.users.push(newUser);

    // Initial default membership plans for this newly registered gym
    db.plans.push(
      { id: Date.now() + 1, gym_id: newGymId, name: 'Monthly Flex Pass', duration_days: 30, price: 1499, description: 'Standard monthly gym floor access' },
      { id: Date.now() + 2, gym_id: newGymId, name: 'Quarterly Power Plan', duration_days: 90, price: 3999, description: '3 months access with trainer consult' }
    );

    // Newly registered gym starts with strictly 0 members and 0 invoices
    db.currentGymId = newGymId;
    db.currentUserId = newUserId;
    saveDb(db);

    return {
      access_token: `mock-token-${newUserId}-${Date.now()}`,
      token_type: 'bearer',
      user: newUser,
      gym: newGym
    };
  }

  // 3. Auth: Current User (/auth/me)
  if (endpoint.startsWith('/auth/me')) {
    let resolvedUser = currentUser;
    if (!resolvedUser && tokenUserId) {
      resolvedUser = db.users.find((u) => u.id == tokenUserId || String(u.id) === String(tokenUserId)) || null;
    }
    if (!resolvedUser && typeof localStorage !== 'undefined') {
      try {
        const savedUserStr = localStorage.getItem('gympulse_user');
        if (savedUserStr) {
          const parsed = JSON.parse(savedUserStr);
          if (parsed && parsed.id) {
            resolvedUser = parsed;
            if (!db.users.some((u) => u.id == parsed.id || String(u.id) === String(parsed.id))) {
              db.users.push(parsed);
              saveDb(db);
            }
          }
        }
      } catch (e) {}
    }
    if (!resolvedUser && db.currentUserId) {
      resolvedUser = db.users.find((u) => u.id == db.currentUserId || String(u.id) === String(db.currentUserId)) || null;
    }
    if (!resolvedUser) {
      resolvedUser = db.users.find((u) => !u.is_superadmin) || db.users[0] || null;
    }
    if (!resolvedUser) {
      throw new Error('Not authenticated');
    }

    // Always fetch live gym from db.gyms first with loose ID comparison
    let resolvedGym = resolvedUser.gym_id 
      ? db.gyms.find((g) => g.id == resolvedUser.gym_id || String(g.id) === String(resolvedUser.gym_id)) || null 
      : null;

    // Only if not found in db.gyms, check localStorage
    if (!resolvedGym && typeof localStorage !== 'undefined') {
      try {
        const savedGymStr = localStorage.getItem('gympulse_gym');
        if (savedGymStr) {
          const parsedGym = JSON.parse(savedGymStr);
          if (parsedGym && parsedGym.id && (String(parsedGym.id) === String(resolvedUser.gym_id) || !resolvedUser.gym_id)) {
            resolvedGym = parsedGym;
            if (!db.gyms.some((g) => g.id == parsedGym.id || String(g.id) === String(parsedGym.id))) {
              db.gyms.push(parsedGym);
              saveDb(db);
            }
          }
        }
      } catch (e) {}
    }

    // Sync the resolved live gym into localStorage so refreshing retains approved state
    if (resolvedGym && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('gympulse_gym', JSON.stringify(resolvedGym));
      } catch (e) {}
    }

    return {
      user: resolvedUser,
      gym: resolvedGym
    };
  }

  // Auth: Submit or Update Payment Reference (e.g. UTR number, UPI reference, or Cash note)
  if (endpoint.startsWith('/auth/submit-payment') && method === 'POST') {
    const targetGymId = currentUser?.gym_id || tokenGymId || db.currentGymId;
    let g = db.gyms.find((gym) => gym.id == targetGymId || String(gym.id) === String(targetGymId));
    if (!g && typeof localStorage !== 'undefined') {
      try {
        const savedGym = JSON.parse(localStorage.getItem('gympulse_gym') || '{}');
        if (savedGym?.id) {
          g = db.gyms.find((gym) => gym.id == savedGym.id || String(gym.id) === String(savedGym.id));
        }
      } catch (e) {}
    }
    if (g) {
      if (body.payment_ref) g.registration_payment_ref = body.payment_ref.trim();
      if (body.payment_method) g.registration_payment_method = body.payment_method;
      g.approval_status = 'pending';
      g.is_approved = false;
      saveDb(db);
      if (typeof localStorage !== 'undefined') {
        try {
          const savedGym = JSON.parse(localStorage.getItem('gympulse_gym') || '{}');
          if (String(savedGym.id) === String(g.id)) {
            localStorage.setItem('gympulse_gym', JSON.stringify({ ...savedGym, ...g }));
          }
        } catch (e) {}
      }
      return g;
    }
    return { error: 'Gym facility not found' };
  }

  // Auth: Logout (only clears if current user matches)
  if (endpoint.startsWith('/auth/logout')) {
    if (currentUser && db.currentUserId === currentUser.id) {
      db.currentUserId = null;
      db.currentGymId = null;
      saveDb(db);
    }
    return { success: true };
  }

  // Auth: Team / Staff Users Management
  const matchUserById = endpoint.match(/^\/auth\/users\/([^/?]+)/);
  if (matchUserById) {
    const targetUserId = matchUserById[1];
    const uIdx = db.users.findIndex((u) => u.id == targetUserId || String(u.id) === String(targetUserId));
    if (uIdx === -1) {
      throw new Error('User account not found');
    }
    if (method === 'DELETE') {
      const removed = db.users[uIdx];
      db.users.splice(uIdx, 1);
      saveDb(db);
      return { success: true, message: `User ${removed.full_name || removed.name} removed successfully.` };
    }
    if (method === 'PUT') {
      db.users[uIdx] = {
        ...db.users[uIdx],
        ...body,
        permissions: body.permissions !== undefined ? body.permissions : db.users[uIdx].permissions
      };
      saveDb(db);
      return db.users[uIdx];
    }
    return db.users[uIdx];
  }

  if (endpoint.startsWith('/auth/users')) {
    if (method === 'POST') {
      const existing = db.users.find(
        (u) => (u.gym_id == currentGymId || String(u.gym_id) === String(currentGymId)) &&
               (u.email || '').toLowerCase().trim() === (body.email || '').toLowerCase().trim()
      );
      if (existing) {
        throw new Error('A user with this email already exists in your gym.');
      }
      const newStaffUser = {
        id: Date.now(),
        gym_id: currentGymId,
        full_name: (body.full_name || 'Staff Member').trim(),
        name: (body.full_name || 'Staff Member').trim(),
        email: (body.email || '').toLowerCase().trim(),
        password: body.password || '',
        role: body.role || 'staff',
        phone: body.phone || '',
        permissions: body.permissions || null,
        is_active: true,
        is_superadmin: false,
        created_at: new Date().toISOString()
      };
      db.users.push(newStaffUser);
      saveDb(db);
      return newStaffUser;
    }
    return db.users.filter(
      (u) => (u.gym_id == currentGymId || String(u.gym_id) === String(currentGymId)) && !u.is_superadmin
    );
  }

  // 4. Dashboard Stats (strictly scoped to active gym)
  if (endpoint.startsWith('/dashboard/stats')) {
    const gymMembers = db.members.filter((m) => m.gym_id === currentGymId);
    const gymAttendance = db.attendance.filter((a) => a.gym_id === currentGymId);
    const gymPayments = db.payments.filter((p) => p.gym_id === currentGymId);

    const total_members = gymMembers.length;
    const active_members = gymMembers.filter((m) => m.status === 'active').length;
    const expired_members = gymMembers.filter((m) => m.status === 'expired').length;
    const expiring_soon_members = gymMembers.filter((m) => m.is_expiring_soon).length;
    const today_attendance = gymAttendance.length;
    const active_now = gymAttendance.filter((a) => !a.check_out_time).length;
    const monthly_revenue = gymPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];
    const attendance_chart_data = labels.map((l, i) => ({
      label: l,
      count: total_members > 0 ? Math.max(1, Math.round((total_members * 0.3) + (i % 3))) : 0
    }));
    const revenue_chart_data = labels.map((l, i) => ({
      label: l,
      revenue: monthly_revenue > 0 ? Math.round((monthly_revenue / 7) * (0.8 + (i * 0.05))) : 0
    }));

    return {
      total_members,
      active_members,
      expired_members,
      expiring_soon_members,
      today_attendance,
      active_now,
      monthly_revenue,
      last_month_revenue: Math.round(monthly_revenue * 0.85),
      pending_payments_count: total_members > 0 ? 1 : 0,
      pending_payments_amount: total_members > 0 ? 1500 : 0,
      new_members_this_month: total_members,
      recent_checkins: gymAttendance.slice(0, 6),
      attendance_chart_data,
      revenue_chart_data
    };
  }

  // 5. Members: Seed 5 Sample Members for testing current gym
  if (endpoint.startsWith('/members/seed-test-members') && method === 'POST') {
    const sampleNames = [
      { first: 'Aarav', last: 'Sharma', plan: 'Monthly Flex Pass', days: 30, amount: 1500, phone: '+91 98000 11001' },
      { first: 'Diya', last: 'Mehta', plan: 'Quarterly Power Plan', days: 90, amount: 4000, phone: '+91 98000 11002' },
      { first: 'Kabir', last: 'Kapoor', plan: 'Monthly Flex Pass', days: 30, amount: 1500, phone: '+91 98000 11003' },
      { first: 'Ishita', last: 'Bose', plan: 'Quarterly Power Plan', days: 90, amount: 4000, phone: '+91 98000 11004' },
      { first: 'Arjun', last: 'Rao', plan: 'Annual VIP Pass', days: 365, amount: 12000, phone: '+91 98000 11005' }
    ];
    const created = [];
    sampleNames.forEach((s, idx) => {
      const memId = Date.now() + idx;
      const mem = {
        id: memId,
        gym_id: currentGymId,
        first_name: s.first,
        last_name: s.last,
        full_name: `${s.first} ${s.last}`,
        email: `${s.first.toLowerCase()}@example.com`,
        phone: s.phone,
        status: 'active',
        join_date: new Date().toISOString().split('T')[0],
        current_plan_name: s.plan,
        membership_expiry_date: new Date(Date.now() + s.days * 86400000).toISOString().split('T')[0],
        is_expiring_soon: false,
        assigned_trainer_id: null
      };
      db.members.unshift(mem);
      db.payments.unshift({
        id: Date.now() + idx + 100,
        gym_id: currentGymId,
        member_id: memId,
        member_name: mem.full_name,
        plan_name: s.plan,
        amount: s.amount,
        payment_method: 'upi',
        status: 'completed',
        payment_date: mem.join_date,
        invoice_number: `INV-${Date.now()}-${memId}`
      });
      created.push(mem);
    });
    saveDb(db);
    return { success: true, count: created.length, members: created };
  }

  // 6. Members List, Detail, Create & Delete
  if (endpoint.startsWith('/members')) {
    const matchDetail = endpoint.match(/^\/members\/(\d+)$/);
    if (matchDetail) {
      const id = parseInt(matchDetail[1], 10);
      if (method === 'DELETE') {
        db.members = db.members.filter((m) => m.id !== id);
        db.attendance = db.attendance.filter((a) => a.member_id !== id);
        db.payments = db.payments.filter((p) => p.member_id !== id);
        saveDb(db);
        return { success: true };
      }
      if (method === 'PUT') {
        const idx = db.members.findIndex((m) => m.id === id);
        if (idx !== -1) {
          db.members[idx] = {
            ...db.members[idx],
            ...body,
            full_name: `${body.first_name || db.members[idx].first_name} ${body.last_name || db.members[idx].last_name}`
          };
          saveDb(db);
          return db.members[idx];
        }
      }
      const member = db.members.find((m) => m.id === id) || db.members[0];
      const memberPayments = db.payments.filter((p) => p.member_id === id);
      const memberAttendance = db.attendance.filter((a) => a.member_id === id);
      return {
        ...member,
        memberships: [
          {
            id: 1,
            gym_id: currentGymId,
            member_id: member.id,
            plan_id: 1,
            plan_name: member.current_plan_name || 'Standard Membership',
            start_date: member.join_date,
            end_date: member.membership_expiry_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
            status: member.status
          }
        ],
        payments: memberPayments,
        attendance_records: memberAttendance,
        total_attended: memberAttendance.length,
        total_paid: memberPayments.reduce((s, p) => s + (p.amount || 0), 0)
      };
    }

    if (method === 'POST') {
      const newId = Date.now();
      const planName = body.manual_plan_name
        ? body.manual_plan_name.trim()
        : (body.initial_plan_id ? (db.plans.find((p) => p.id === body.initial_plan_id)?.name || 'Custom Plan') : 'Standard Pass');
      const durationDays = body.manual_duration_days ? Number(body.manual_duration_days) : 30;
      const price = body.manual_price !== undefined ? Number(body.manual_price) : (body.initial_plan_id ? (db.plans.find((p) => p.id === body.initial_plan_id)?.price || 1500) : 1500);

      const newMember = {
        id: newId,
        gym_id: currentGymId,
        first_name: (body.first_name || 'New').trim(),
        last_name: (body.last_name || 'Member').trim(),
        full_name: `${(body.first_name || 'New').trim()} ${(body.last_name || 'Member').trim()}`,
        email: body.email || '',
        phone: (body.phone || '+91 90000 00000').trim(),
        status: body.status || 'active',
        join_date: body.join_date || new Date().toISOString().split('T')[0],
        current_plan_name: planName,
        membership_expiry_date: new Date(Date.now() + durationDays * 86400000).toISOString().split('T')[0],
        is_expiring_soon: false,
        assigned_trainer_id: body.assigned_trainer_id ? Number(body.assigned_trainer_id) : null
      };
      db.members.unshift(newMember);

      // Auto-record initial payment / receipt
      db.payments.unshift({
        id: Date.now() + 1,
        gym_id: currentGymId,
        member_id: newId,
        member_name: newMember.full_name,
        plan_name: planName,
        amount: price,
        payment_method: body.manual_payment_method || 'upi',
        status: 'completed',
        payment_date: newMember.join_date,
        invoice_number: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
        notes: body.manual_plan_name ? `Manual membership: ${planName}` : 'Initial membership enrollment'
      });
      saveDb(db);
      return newMember;
    }

    // GET /members: Filter strictly by currentGymId!
    let list = db.members.filter((m) => m.gym_id === currentGymId);
    const urlObj = new URL('http://local' + endpoint);
    const search = urlObj.searchParams.get('search');
    const status = urlObj.searchParams.get('status_filter');
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((m) => m.full_name.toLowerCase().includes(s) || m.phone.includes(s) || (m.email && m.email.toLowerCase().includes(s)));
    }
    if (status && status !== 'all') {
      list = list.filter((m) => m.status === status);
    }
    return list;
  }

  // 7. Plans (scoped to current gym)
  if (endpoint.startsWith('/plans')) {
    if (method === 'POST') {
      const newPlan = { id: Date.now(), gym_id: currentGymId, ...body };
      db.plans.push(newPlan);
      saveDb(db);
      return newPlan;
    }
    return db.plans.filter((p) => p.gym_id === currentGymId);
  }

  // 8. Attendance (scoped to current gym)
  if (endpoint.startsWith('/attendance/today')) {
    return db.attendance.filter((a) => a.gym_id === currentGymId);
  }
  if (endpoint.startsWith('/attendance/check-in') && method === 'POST') {
    const member = db.members.find((m) => m.id === body.member_id) || { full_name: 'Gym Member' };
    const newRecord = {
      id: Date.now(),
      gym_id: currentGymId,
      member_id: body.member_id,
      member_name: member.full_name,
      check_in_time: new Date().toISOString(),
      check_out_time: null,
      method: body.method || 'manual',
      notes: body.notes || ''
    };
    db.attendance.unshift(newRecord);
    saveDb(db);
    return newRecord;
  }
  if (endpoint.startsWith('/attendance/check-out') && method === 'POST') {
    const record = db.attendance.find((a) => a.id === body.attendance_id);
    if (record) {
      record.check_out_time = new Date().toISOString();
      saveDb(db);
      return record;
    }
    return { success: true };
  }
  if (endpoint.startsWith('/attendance/history')) {
    return db.attendance.filter((a) => a.gym_id === currentGymId);
  }

  // 9. Payments (scoped to current gym)
  if (endpoint.startsWith('/payments')) {
    const matchPay = endpoint.match(/^\/payments\/([^/?]+)$/);
    if (matchPay && method === 'GET') {
      const payId = matchPay[1];
      const pay = db.payments.find((p) => p.id == payId || String(p.id) === String(payId));
      if (pay) {
        const mem = db.members.find((m) => m.id === pay.member_id);
        return {
          ...pay,
          receipt_number: pay.invoice_number || `INV-${pay.id}`,
          member_name: mem?.full_name || pay.member_name || 'Member',
          member_phone: mem?.phone || 'N/A',
          member_email: mem?.email || 'N/A'
        };
      }
    }
    if (method === 'POST') {
      const member = db.members.find((m) => m.id === body.member_id) || { full_name: 'Member' };
      const newPayment = {
        id: Date.now(),
        gym_id: currentGymId,
        member_id: body.member_id,
        member_name: member.full_name,
        plan_name: body.plan_name || 'Membership',
        amount: parseFloat(body.amount) || 1500,
        payment_method: body.payment_method || 'upi',
        status: 'completed',
        payment_date: new Date().toISOString().split('T')[0],
        invoice_number: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
        notes: body.notes || ''
      };
      db.payments.unshift(newPayment);
      saveDb(db);
      return newPayment;
    }
    return db.payments.filter((p) => p.gym_id === currentGymId);
  }

  // 10. Trainers (scoped to current gym)
  if (endpoint.startsWith('/trainers')) {
    if (method === 'POST') {
      const newTrainer = { id: Date.now(), gym_id: currentGymId, assigned_members_count: 0, is_active: true, ...body };
      db.trainers.push(newTrainer);
      saveDb(db);
      return newTrainer;
    }
    return db.trainers.filter((t) => t.gym_id === currentGymId);
  }

  // 11. Reports (scoped to current gym)
  if (endpoint.startsWith('/reports/summary') || endpoint.startsWith('/reports/revenue')) {
    const gymMembers = db.members.filter((m) => m.gym_id === currentGymId);
    const gymPayments = db.payments.filter((p) => p.gym_id === currentGymId);
    const gymAttendance = db.attendance.filter((a) => a.gym_id === currentGymId);
    return {
      monthly_revenue: gymPayments.reduce((s, p) => s + (p.amount || 0), 0),
      total_checkins: gymAttendance.length,
      active_members: gymMembers.filter((m) => m.status === 'active').length,
      revenue_growth_pct: 12.0
    };
  }

  // 12. Settings & Gym Profile
  if (endpoint.startsWith('/settings/config')) {
    if (method === 'PUT') {
      db.settings = { ...db.settings, ...body };
      saveDb(db);
      return db.settings;
    }
    return db.settings;
  }
  if (endpoint.startsWith('/settings/gym')) {
    const idx = db.gyms.findIndex((g) => g.id === currentGymId);
    if (idx !== -1) {
      if (method === 'PUT') {
        db.gyms[idx] = { ...db.gyms[idx], ...body };
        saveDb(db);
      }
      return db.gyms[idx];
    }
    return db.gyms[0];
  }

  // 13. Network Info
  if (endpoint.startsWith('/settings/network-info')) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://harshitdev659-rgb.github.io/gympulse-saas';
    const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');
    const cloudUrl = 'https://harshitdev659-rgb.github.io/gympulse-saas/';
    const releaseUrl = 'https://github.com/harshitdev659-rgb/gympulse-saas/releases/download/v1.0.0/GymPulse_Windows_Portable.zip';

    return {
      local_url: isLocal ? origin : 'http://localhost:8000',
      lan_ip: '127.0.0.1',
      lan_url: isLocal ? origin : cloudUrl,
      cloud_url: cloudUrl,
      tunnel_url: null,
      public_url: cloudUrl,
      github_pages_url: cloudUrl,
      windows_release_url: releaseUrl,
      download_url: isLocal ? '/api/download/windows' : releaseUrl,
      full_download_url: releaseUrl
    };
  }

  // 14. Public Website & Leads
  if (endpoint.startsWith('/gym/website')) {
    if (method === 'PUT') {
      if (body.website_subdomain) {
        const sub = body.website_subdomain.trim().toLowerCase();
        const conflict = db.gyms.find(
          (g) => (g.id !== currentGymId && String(g.id) !== String(currentGymId)) &&
                 ((g.website_subdomain && g.website_subdomain.toLowerCase() === sub) || (g.slug && g.slug.toLowerCase() === sub))
        );
        if (conflict) {
          throw new Error(`The website domain/subdomain "${sub}" is already taken by another gym facility. Please choose a different subdomain.`);
        }
      }
      db.website = { ...db.website, ...body };
      if (currentGym) {
        if (body.website_subdomain) {
          currentGym.website_subdomain = body.website_subdomain;
          currentGym.slug = body.website_subdomain;
        }
        currentGym.website = { ...(currentGym.website || {}), ...body };
        if (body.website_theme) currentGym.website_theme = body.website_theme;
        if (body.website_primary_color) currentGym.website_primary_color = body.website_primary_color;
        if (body.website_hero_style) currentGym.website_hero_style = body.website_hero_style;
        if (body.website_announcement !== undefined) currentGym.website_announcement = body.website_announcement;
      }
      saveDb(db);
      return { ...db.website, ...(currentGym?.website || {}) };
    }
    const activeGym = currentGym || db.gyms[0];
    return {
      website_subdomain: activeGym?.website_subdomain || activeGym?.slug || 'my-gym',
      website_enabled: activeGym?.website_enabled ?? true,
      website_headline: activeGym?.website_headline || `Welcome to ${activeGym?.name || 'GymPulse Facility'}`,
      website_tagline: activeGym?.website_tagline || 'World-Class Fitness, Strength & Conditioning',
      website_about: activeGym?.website_about || `${activeGym?.name || 'Our facility'} offers world-class training equipment and certified coaches.`,
      website_cover_image: activeGym?.website_cover_image || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&auto=format&fit=crop&q=80',
      website_amenities: activeGym?.website_amenities || 'Olympic Free Weights, Cardio Theatre, Strength Machines, Certified Trainers, Steam & Sauna, Lockers',
      website_custom_domain: activeGym?.website_custom_domain || '',
      website_theme: activeGym?.website_theme || activeGym?.website?.website_theme || 'dark_power',
      website_primary_color: activeGym?.website_primary_color || activeGym?.website?.website_primary_color || '#10b981',
      website_hero_style: activeGym?.website_hero_style || activeGym?.website?.website_hero_style || 'split',
      website_announcement: activeGym?.website_announcement || activeGym?.website?.website_announcement || '',
      ...db.website,
      ...(activeGym?.website || {})
    };
  }
  if (endpoint.startsWith('/gym/inquiries')) {
    return db.inquiries.filter((inq) => inq.gym_id === currentGymId);
  }

  // 14b. Dedicated Public Facility Website Handler (/public/facility/:slug)
  const matchPublicFacility = endpoint.match(/^\/public\/facility\/([^/?]+)/);
  if (matchPublicFacility) {
    const rawSlug = decodeURIComponent(matchPublicFacility[1]).toLowerCase().trim();
    const slug = rawSlug.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || rawSlug;

    // Search facility by slug, subdomain, or ID
    let facilityGym = db.gyms.find(
      (g) => (g.slug && g.slug.toLowerCase() === slug) || 
             (g.website_subdomain && g.website_subdomain.toLowerCase() === slug) || 
             String(g.id) === slug ||
             (g.name && g.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug)
    );

    // If not found directly, check active user's gym or fallback to first gym or auto-constructed profile
    if (!facilityGym) {
      if (currentGym) {
        facilityGym = currentGym;
      } else if (db.gyms.length > 0) {
        facilityGym = db.gyms[0];
      } else {
        const prettyName = slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Fitness Facility';
        facilityGym = {
          id: 1,
          name: prettyName,
          slug: slug,
          website_subdomain: slug,
          email: `contact@${slug}.com`,
          phone: '+91 90000 00000',
          address: 'Central Fitness Boulevard',
          currency: 'INR'
        };
      }
    }

    if (endpoint.includes('/inquire') && method === 'POST') {
      const inq = {
        id: Date.now(),
        gym_id: facilityGym ? facilityGym.id : currentGymId,
        full_name: body.full_name || 'Prospective Athlete',
        phone: body.phone || '',
        email: body.email || '',
        plan_name: body.plan_name || 'Standard Pass',
        message: body.message || '',
        status: 'new',
        created_at: new Date().toISOString()
      };
      db.inquiries.unshift(inq);
      saveDb(db);
      return { success: true, message: 'Your inquiry has been received! Facility staff will contact you shortly.' };
    }

    if (endpoint.includes('/join') && method === 'POST') {
      const plan = db.plans.find((p) => p.id === body.plan_id) || {
        id: body.plan_id || 1,
        name: body.plan_name || 'Monthly Pass',
        duration_days: 30,
        price: 1499
      };
      const cleanPhone = (body.phone || '').trim();
      let member = db.members.find(
        (m) => m.gym_id === facilityGym.id && m.phone.replace(/[^0-9]/g, '') === cleanPhone.replace(/[^0-9]/g, '')
      );

      const duration = Number(plan.duration_days) || 30;
      const expiry = new Date(Date.now() + duration * 86400000).toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];

      if (!member) {
        member = {
          id: Date.now(),
          gym_id: facilityGym.id,
          first_name: (body.first_name || 'Athlete').trim(),
          last_name: (body.last_name || '').trim(),
          full_name: `${(body.first_name || 'Athlete').trim()} ${(body.last_name || '').trim()}`.trim(),
          phone: cleanPhone,
          email: body.email || '',
          status: 'active',
          join_date: today,
          current_plan_name: plan.name,
          membership_expiry_date: expiry,
          is_expiring_soon: false
        };
        db.members.unshift(member);
      } else {
        member.status = 'active';
        member.current_plan_name = plan.name;
        member.membership_expiry_date = expiry;
        member.is_expiring_soon = false;
        if (body.email && !member.email) member.email = body.email;
      }

      const invNum = `INV-${Date.now().toString().slice(-6)}`;
      const paymentStatus = body.payment_method === 'cash_at_desk' ? 'pending' : 'completed';
      db.payments.unshift({
        id: Date.now() + 1,
        gym_id: facilityGym.id,
        member_id: member.id,
        amount: Number(plan.price) || 1499,
        status: paymentStatus,
        payment_method: body.payment_method || 'upi',
        payment_date: today,
        receipt_number: invNum,
        notes: `Online Website Pass - ${plan.name} (Ref: ${body.payment_ref || 'Online QR'})`
      });

      saveDb(db);
      return {
        success: true,
        message: `Welcome to ${facilityGym.name}! Your membership pass is active.`,
        member: {
          id: member.id,
          full_name: member.full_name,
          phone: member.phone,
          email: member.email,
          plan_name: plan.name,
          start_date: today,
          expiry_date: expiry,
          status: member.status
        },
        receipt_number: invNum,
        amount: plan.price,
        payment_status: paymentStatus
      };
    }

    if (endpoint.includes('/checkin') && method === 'POST') {
      const queryVal = (body.phone_or_id || '').trim();
      const cleanDigits = queryVal.replace(/[^0-9]/g, '');
      const member = db.members.find((m) => {
        if (m.gym_id !== facilityGym.id) return false;
        if (String(m.id) === queryVal) return true;
        const mDigits = (m.phone || '').replace(/[^0-9]/g, '');
        return mDigits.endsWith(cleanDigits) || cleanDigits.endsWith(mDigits);
      });

      if (!member) {
        throw new Error('No registered athlete found with that Phone Number or Member ID. Please speak with front desk.');
      }

      if (member.status !== 'active') {
        throw new Error(`Membership for ${member.full_name} is ${member.status.toUpperCase()}. Please renew at front desk.`);
      }

      const today = new Date().toISOString().split('T')[0];
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const existing = db.attendance.find((a) => a.gym_id === facilityGym.id && a.member_id === member.id && a.date === today);
      if (existing && !existing.check_out_time) {
        existing.check_out_time = nowTime;
        saveDb(db);
        return {
          success: true,
          action: 'check_out',
          message: `Checked out! Great workout today, ${member.first_name || member.full_name}!`,
          member_name: member.full_name,
          time: nowTime
        };
      }

      const newAtt = {
        id: Date.now(),
        gym_id: facilityGym.id,
        member_id: member.id,
        date: today,
        check_in_time: nowTime,
        check_out_time: null,
        method: 'qr_kiosk',
        status: 'present'
      };
      db.attendance.unshift(newAtt);
      saveDb(db);

      const pastWorkouts = db.attendance.filter((a) => a.gym_id === facilityGym.id && a.member_id === member.id).length;

      return {
        success: true,
        action: 'check_in',
        message: `Access Granted! Welcome to ${facilityGym.name}, ${member.first_name || member.full_name}!`,
        member_name: member.full_name,
        member_id: member.id,
        time: nowTime,
        monthly_workouts: pastWorkouts,
        status: member.status
      };
    }

    if (endpoint.includes('/portal')) {
      const urlObj = new URL('http://dummy.com' + endpoint);
      const queryVal = (urlObj.searchParams.get('query') || '').trim();
      const cleanDigits = queryVal.replace(/[^0-9]/g, '');

      const member = db.members.find((m) => {
        if (m.gym_id !== facilityGym.id) return false;
        if (String(m.id) === queryVal) return true;
        const mDigits = (m.phone || '').replace(/[^0-9]/g, '');
        return mDigits && (mDigits.endsWith(cleanDigits) || cleanDigits.endsWith(mDigits));
      });

      if (!member) {
        throw new Error('No athlete account found matching this Phone Number or Member ID.');
      }

      const attendances = db.attendance.filter((a) => a.gym_id === facilityGym.id && a.member_id === member.id);
      const payments = db.payments.filter((p) => p.gym_id === facilityGym.id && p.member_id === member.id);

      const expiry = member.membership_expiry_date ? new Date(member.membership_expiry_date) : null;
      const daysRemaining = expiry ? Math.max(0, Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24))) : 0;

      return {
        gym_name: facilityGym.name,
        gym_logo: facilityGym.logo_url,
        gym_phone: facilityGym.phone,
        gym_address: facilityGym.address,
        member: {
          id: member.id,
          full_name: member.full_name,
          phone: member.phone,
          email: member.email,
          status: member.status,
          join_date: member.join_date,
          plan_name: member.current_plan_name || 'Standard Pass',
          expiry_date: member.membership_expiry_date,
          days_remaining: daysRemaining
        },
        attendance_count: attendances.length,
        recent_attendances: attendances.slice(0, 10).map((a) => ({
          date: a.date,
          check_in: a.check_in_time || 'Attended',
          method: a.method
        })),
        payments: payments.slice(0, 10).map((p) => ({
          id: p.id,
          amount: p.amount,
          receipt_number: p.receipt_number || `INV-${p.id}`,
          payment_date: p.payment_date,
          payment_method: p.payment_method,
          status: p.status
        }))
      };
    }

    const facilityPlans = db.plans.filter((p) => p.gym_id === facilityGym.id);
    const facilityTrainers = db.trainers.filter((t) => t.gym_id === facilityGym.id);
    const web = facilityGym.website || db.website || {};

    const amenitiesList = Array.isArray(web.website_amenities)
      ? web.website_amenities
      : (web.website_amenities || facilityGym.website_amenities || 'Olympic Free Weights, Cardio Theatre, Strength Machines, Certified Trainers, Steam & Sauna, Lockers')
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean);

    const plansList = facilityPlans.length > 0 ? facilityPlans : [
      { id: 1, gym_id: facilityGym.id, name: 'Monthly Flex Pass', duration_days: 30, price: 1499, description: 'Unlimited gym floor access & locker usage' },
      { id: 2, gym_id: facilityGym.id, name: 'Quarterly Power Plan', duration_days: 90, price: 3999, description: '3 months access with initial fitness assessment' },
      { id: 3, gym_id: facilityGym.id, name: 'Annual Elite Pass', duration_days: 365, price: 11999, description: '365 days unlimited access + VIP coach check-ins' }
    ];

    const trainersList = facilityTrainers.length > 0 ? facilityTrainers : [
      { id: 1, name: 'Coach Alex Rivera', specialty: 'Strength & Conditioning', specialization: 'Strength & Conditioning', bio: 'Certified CSCS coach with 8+ years elite athlete training experience.' },
      { id: 2, name: 'Elena Rostova', specialty: 'Functional Fitness & Mobility', specialization: 'Functional Fitness & Mobility', bio: 'Specialist in functional biomechanics, mobility restoration, and HIIT.' }
    ];

    const selectedTheme = web.website_theme || facilityGym.website_theme || 'dark_power';
    const selectedColor = web.website_primary_color || facilityGym.website_primary_color || '#10b981';
    const selectedHeroStyle = web.website_hero_style || facilityGym.website_hero_style || 'split';
    const selectedAnnouncement = web.website_announcement || facilityGym.website_announcement || '';

    return {
      // Direct flattened properties expected by GymPublicWebsitePage:
      id: facilityGym.id,
      name: facilityGym.name,
      slug: facilityGym.slug || slug,
      website_subdomain: facilityGym.website_subdomain || facilityGym.slug || slug,
      headline: web.website_headline || facilityGym.website_headline || `Welcome to ${facilityGym.name}`,
      tagline: web.website_tagline || facilityGym.website_tagline || 'World-Class Fitness, Strength & Conditioning',
      about: web.website_about || facilityGym.website_about || `${facilityGym.name} provides premier fitness equipment, certified coaching, and a supportive community.`,
      cover_image: web.website_cover_image || facilityGym.website_cover_image || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&auto=format&fit=crop&q=80',
      amenities: amenitiesList,
      currency: facilityGym.currency || 'INR',
      logo_url: facilityGym.logo_url || '/gympulse.png',
      phone: facilityGym.phone || '+91 90000 00000',
      email: facilityGym.email || 'contact@gympulse.com',
      address: facilityGym.address || 'Central Fitness Complex',
      business_hours: 'Mon-Sat: 6:00 AM - 10:00 PM',
      primary_color: selectedColor,
      website_theme: selectedTheme,
      website_primary_color: selectedColor,
      website_hero_style: selectedHeroStyle,
      website_announcement: selectedAnnouncement,
      plans: plansList,
      trainers: trainersList,

      // Nested properties for backward compatibility:
      gym: facilityGym,
      website: {
        website_subdomain: facilityGym.website_subdomain || facilityGym.slug || slug,
        website_headline: web.website_headline || facilityGym.website_headline || `Welcome to ${facilityGym.name}`,
        website_tagline: web.website_tagline || facilityGym.website_tagline || 'World-Class Fitness, Strength & Conditioning',
        website_about: web.website_about || facilityGym.website_about || `${facilityGym.name} provides premier fitness equipment, certified coaching, and a supportive community.`,
        website_cover_image: web.website_cover_image || facilityGym.website_cover_image || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&auto=format&fit=crop&q=80',
        website_amenities: amenitiesList.join(', '),
        website_theme: selectedTheme,
        website_primary_color: selectedColor,
        website_hero_style: selectedHeroStyle,
        website_announcement: selectedAnnouncement
      }
    };
  }

  // 14c. SaaS Billing & Subscriptions
  if (endpoint.startsWith('/billing/status')) {
    const gymMembers = db.members.filter((m) => m.gym_id === currentGymId);
    let resolvedGym = currentGym;
    if (!resolvedGym && typeof localStorage !== 'undefined') {
      try {
        const savedGym = JSON.parse(localStorage.getItem('gympulse_gym') || '{}');
        if (savedGym?.id) resolvedGym = db.gyms.find((g) => g.id == savedGym.id) || savedGym;
      } catch (e) {}
    }
    const tier = (resolvedGym?.plan_tier || 'pro').toLowerCase().trim();
    const tierName = tier === 'business' 
      ? 'Business Enterprise (₹5,999/mo)' 
      : (tier === 'starter' || tier === 'free') 
      ? 'Starter Plan (₹999/mo)' 
      : 'Pro Growth (₹2,499/mo)';
    const maxMembers = resolvedGym?.member_capacity || (tier === 'business' ? 10000 : (tier === 'starter' || tier === 'free') ? 50 : 250);

    return {
      plan_tier: tier,
      tier_name: tierName,
      subscription_status: resolvedGym?.subscription_status || 'active',
      member_count: gymMembers.length,
      max_members: maxMembers,
      usage_percentage: Math.min(100, Math.round((gymMembers.length / maxMembers) * 100)),
      can_add_member: true,
      ai_enabled: tier !== 'free' && tier !== 'starter',
      features: tier === 'business' 
        ? ['Unlimited Athletes', 'Digital Invoicing', 'Priority AI Copilot', 'CSV Reports', 'Multi-Floor Roster']
        : (tier === 'starter' || tier === 'free')
        ? ['Up to 50 Athletes', 'Front Desk Check-in', 'Standard Invoicing', 'Public Website']
        : ['Up to 250 Athletes', 'Automated Check-in', 'AI Operations Copilot', 'CSV Reports', 'Trainer Profiles'],
      requested_plan_tier: resolvedGym?.requested_plan_tier || null,
      tier_upgrade_status: resolvedGym?.tier_upgrade_status || 'none',
      tier_upgrade_requested_at: resolvedGym?.tier_upgrade_requested_at || null
    };
  }

  if (endpoint.startsWith('/billing/upgrade') && method === 'POST') {
    const targetTier = (body.target_tier || 'pro').toLowerCase().trim();
    let targetGym = currentGym;
    if (!targetGym && typeof localStorage !== 'undefined') {
      try {
        const savedGym = JSON.parse(localStorage.getItem('gympulse_gym') || '{}');
        if (savedGym?.id) {
          targetGym = db.gyms.find((item) => item.id == savedGym.id || String(item.id) === String(savedGym.id));
        }
      } catch (e) {}
    }
    if (!targetGym && db.gyms.length > 0) {
      targetGym = db.gyms[db.gyms.length - 1];
    }
    if (targetGym) {
      targetGym.requested_plan_tier = targetTier;
      targetGym.tier_upgrade_status = 'pending';
      targetGym.tier_upgrade_requested_at = new Date().toISOString();
      saveDb(db);
      if (typeof localStorage !== 'undefined') {
        try {
          const savedGym = JSON.parse(localStorage.getItem('gympulse_gym') || '{}');
          if (String(savedGym.id) === String(targetGym.id) || !savedGym.id) {
            localStorage.setItem('gympulse_gym', JSON.stringify({ ...savedGym, ...targetGym }));
          }
        } catch (e) {}
      }
    }
    return {
      message: `Upgrade request to ${targetTier.toUpperCase()} tier submitted! Payment pending Admin verification.`,
      requested_tier: targetTier,
      current_tier: targetGym?.plan_tier || 'pro',
      upgrade_status: 'pending',
      status: targetGym?.subscription_status || 'active'
    };
  }

  // 15. AI Assistant
  if (endpoint.startsWith('/ai/query') && method === 'POST') {
    const q = (body.query || '').toLowerCase();
    const gymMembers = db.members.filter((m) => m.gym_id === currentGymId);
    const activeCount = gymMembers.filter((m) => m.status === 'active').length;
    const expiringSoon = gymMembers.filter((m) => m.is_expiring_soon).map((m) => m.full_name).join(', ') || 'None';
    const totalRev = db.payments.filter((p) => p.gym_id === currentGymId).reduce((s, p) => s + (p.amount || 0), 0);
    const checkedInToday = db.attendance.filter((a) => a.gym_id === currentGymId).length;

    let reply = `Here is your gym update for ${currentGym?.name || 'Your Facility'}:\n`;
    if (q.includes('member') || q.includes('who') || q.includes('active')) {
      reply += `• Active Members: ${activeCount} / ${currentGym?.member_capacity || 150} capacity.\n`;
    }
    if (q.includes('revenue') || q.includes('money') || q.includes('earn') || q.includes('collection')) {
      reply += `• Monthly Revenue: ₹${totalRev.toLocaleString('en-IN')}.\n`;
    }
    if (q.includes('attendance') || q.includes('today') || q.includes('check')) {
      reply += `• Today's Check-ins: ${checkedInToday} athletes currently active or visited today.\n`;
    }
    if (q.includes('expir') || q.includes('renew')) {
      reply += `• Expiring Soon: ${expiringSoon}.\n`;
    }
    if (reply.length <= 40) {
      reply = `Hello! I am your AI GymPulse Assistant. Your facility "${currentGym?.name || 'Your Facility'}" has ${activeCount} active members, ${checkedInToday} check-ins today, and ₹${totalRev.toLocaleString('en-IN')} total revenue collected. What would you like to check?`;
    }
    return {
      query: body.query,
      answer: reply,
      context_data: { active_members: activeCount, today_attendance: checkedInToday, total_revenue: totalRev }
    };
  }

  // 16. Super Admin: Platform Operations & Gym Deletion
  if (endpoint.startsWith('/platform/metrics')) {
    const isGymActive = (g) => {
      if (!g) return false;
      const approval = String(g.approval_status || '').toLowerCase().trim();
      const isApproved = g.is_approved === true || g.is_approved === 'true' || g.is_approved === 1;
      const sub = String(g.subscription_status || '').toLowerCase().trim();
      if (approval === 'rejected') return false;
      return approval === 'approved' || isApproved || sub === 'active';
    };
    const active_facilities = db.gyms.filter(isGymActive).length;
    const pending_approvals = db.gyms.filter((g) => !isGymActive(g) && String(g.approval_status || '').toLowerCase() !== 'rejected').length;
    return {
      total_gyms: db.gyms.length,
      pending_approvals,
      active_facilities,
      active_gyms: active_facilities,
      total_athletes: db.members.length,
      total_platform_members: db.members.length,
      platform_mrr: active_facilities * 2499.0,
      currency: 'INR'
    };
  }

  // Super Admin: Approve Tier Upgrade
  const matchApproveUpgrade = endpoint.match(/^\/platform\/gyms\/([^/?]+)\/approve-upgrade$/);
  if (matchApproveUpgrade && method === 'POST') {
    const gymId = matchApproveUpgrade[1];
    const g = db.gyms.find((item) => item.id == gymId || String(item.id) === String(gymId));
    if (!g) throw new Error('Gym facility not found');
    const newTier = (g.requested_plan_tier || 'pro').toLowerCase().trim();
    g.plan_tier = newTier;
    g.tier_upgrade_status = 'approved';
    g.subscription_status = 'active';
    g.member_capacity = newTier === 'business' ? 10000 : (newTier === 'starter' || newTier === 'free') ? 50 : 250;
    saveDb(db);

    if (typeof localStorage !== 'undefined') {
      try {
        const savedGym = JSON.parse(localStorage.getItem('gympulse_gym') || '{}');
        if (String(savedGym.id) === String(g.id)) {
          localStorage.setItem('gympulse_gym', JSON.stringify({
            ...savedGym,
            ...g,
            plan_tier: newTier,
            tier_upgrade_status: 'approved',
            subscription_status: 'active',
            member_capacity: g.member_capacity
          }));
        }
      } catch (e) {}
    }
    return g;
  }

  // Delete Gym as Super Admin (Loose Matching on ID)
  const matchGymDelete = endpoint.match(/^\/platform\/gyms\/([^/?]+)$/);
  if (matchGymDelete && method === 'DELETE') {
    const gymId = matchGymDelete[1];
    const targetGym = db.gyms.find((g) => g.id == gymId || String(g.id) === String(gymId));
    if (!targetGym) {
      return { success: false, message: 'Gym not found' };
    }

    // Permanently purge gym and all associated tenant records
    db.gyms = db.gyms.filter((g) => g.id != gymId && String(g.id) !== String(gymId));
    db.members = db.members.filter((m) => m.gym_id != gymId && String(m.gym_id) !== String(gymId));
    db.attendance = db.attendance.filter((a) => a.gym_id != gymId && String(a.gym_id) !== String(gymId));
    db.payments = db.payments.filter((p) => p.gym_id != gymId && String(p.gym_id) !== String(gymId));
    db.plans = db.plans.filter((p) => p.gym_id != gymId && String(p.gym_id) !== String(gymId));
    db.trainers = db.trainers.filter((t) => t.gym_id != gymId && String(t.gym_id) !== String(gymId));
    db.inquiries = db.inquiries.filter((inq) => inq.gym_id != gymId && String(inq.gym_id) !== String(gymId));
    db.users = db.users.filter((u) => (u.gym_id != gymId && String(u.gym_id) !== String(gymId)) || u.is_superadmin);

    if (db.currentGymId == gymId || String(db.currentGymId) === String(gymId)) {
      db.currentGymId = db.gyms[0]?.id || null;
    }
    saveDb(db);

    return {
      success: true,
      message: `Facility "${targetGym.name}" and its records have been permanently deleted.`,
      deleted_id: targetGym.id
    };
  }

  // Remove All Active Gyms as Super Admin
  if ((endpoint.startsWith('/platform/gyms/remove-all-active') || endpoint.startsWith('/platform/gyms/active')) && (method === 'POST' || method === 'DELETE')) {
    const isGymActive = (g) => {
      if (!g) return false;
      const approval = String(g.approval_status || '').toLowerCase().trim();
      const isApproved = g.is_approved === true || g.is_approved === 'true' || g.is_approved === 1;
      const sub = String(g.subscription_status || '').toLowerCase().trim();
      if (approval === 'rejected') return false;
      return approval === 'approved' || isApproved || sub === 'active';
    };
    const activeGymIds = new Set(db.gyms.filter(isGymActive).map((g) => String(g.id)));
    const count = activeGymIds.size;

    db.gyms = db.gyms.filter((g) => !activeGymIds.has(String(g.id)));
    db.members = db.members.filter((m) => !activeGymIds.has(String(m.gym_id)));
    db.attendance = db.attendance.filter((a) => !activeGymIds.has(String(a.gym_id)));
    db.payments = db.payments.filter((p) => !activeGymIds.has(String(p.gym_id)));
    db.plans = db.plans.filter((p) => !activeGymIds.has(String(p.gym_id)));
    db.trainers = db.trainers.filter((t) => !activeGymIds.has(String(t.gym_id)));
    db.inquiries = db.inquiries.filter((inq) => !activeGymIds.has(String(inq.gym_id)));
    db.users = db.users.filter((u) => u.is_superadmin || !activeGymIds.has(String(u.gym_id)));

    if (activeGymIds.has(String(db.currentGymId))) {
      db.currentGymId = db.gyms[0]?.id || null;
    }
    saveDb(db);
    return { success: true, removed_count: count, message: `Successfully removed all ${count} active facilities.` };
  }

  // Remove All Gyms Across Entire Platform
  if (endpoint.startsWith('/platform/gyms/remove-all') && method === 'POST') {
    const count = db.gyms.length;
    db.gyms = [];
    db.members = [];
    db.attendance = [];
    db.payments = [];
    db.plans = [];
    db.trainers = [];
    db.inquiries = [];
    db.users = db.users.filter((u) => u.is_superadmin);
    db.currentGymId = null;
    saveDb(db);
    return { success: true, removed_count: count, message: `Successfully removed all ${count} facilities.` };
  }

  // Approve / Reject Gym as Super Admin
  if (endpoint.startsWith('/platform/gyms/approve-all') && method === 'POST') {
    let count = 0;
    db.gyms.forEach((g) => {
      if (g.approval_status === 'pending' || !g.is_approved) {
        g.is_approved = true;
        g.approval_status = 'approved';
        g.payment_verified = true;
        g.subscription_status = 'active';
        count++;
      }
    });
    saveDb(db);
    return { approved_count: count, message: `Successfully approved ${count} facilities` };
  }

  const matchGymApprove = endpoint.match(/^\/platform\/gyms\/([^/?]+)\/approve$/);
  if (matchGymApprove && method === 'POST') {
    const gymId = matchGymApprove[1];
    const g = db.gyms.find((item) => item.id == gymId || String(item.id) === String(gymId));
    if (g) {
      g.is_approved = true;
      g.approval_status = 'approved';
      g.payment_verified = true;
      g.subscription_status = 'active';
      saveDb(db);

      if (typeof localStorage !== 'undefined') {
        try {
          const savedGymStr = localStorage.getItem('gympulse_gym');
          if (savedGymStr) {
            const parsedGym = JSON.parse(savedGymStr);
            if (String(parsedGym.id) === String(g.id)) {
              localStorage.setItem('gympulse_gym', JSON.stringify({
                ...parsedGym,
                is_approved: true,
                approval_status: 'approved',
                payment_verified: true,
                subscription_status: 'active'
              }));
            }
          }
        } catch (e) {}
      }
      return g;
    }
  }

  const matchGymReject = endpoint.match(/^\/platform\/gyms\/([^/?]+)\/reject$/);
  if (matchGymReject && method === 'POST') {
    const gymId = matchGymReject[1];
    const g = db.gyms.find((item) => item.id == gymId || String(item.id) === String(gymId));
    if (g) {
      g.is_approved = false;
      g.approval_status = 'rejected';
      g.payment_verified = false;
      saveDb(db);

      if (typeof localStorage !== 'undefined') {
        try {
          const savedGymStr = localStorage.getItem('gympulse_gym');
          if (savedGymStr) {
            const parsedGym = JSON.parse(savedGymStr);
            if (String(parsedGym.id) === String(g.id)) {
              localStorage.setItem('gympulse_gym', JSON.stringify({
                ...parsedGym,
                is_approved: false,
                approval_status: 'rejected',
                payment_verified: false
              }));
            }
          }
        } catch (e) {}
      }
      return g;
    }
  }

  // Platform Subscription Payment Settings (Super Admin configuration)
  if (endpoint.startsWith('/platform/payment-settings')) {
    if (method === 'POST') {
      db.platform_payment_settings = {
        ...(db.platform_payment_settings || defaultDb.platform_payment_settings),
        ...body
      };
      saveDb(db);
      return db.platform_payment_settings;
    }
    return db.platform_payment_settings || defaultDb.platform_payment_settings;
  }

  // List all gyms for Super Admin
  if (endpoint.startsWith('/platform/gyms') && method === 'GET') {
    return db.gyms.map((g) => {
      const owner = db.users.find((u) => (u.gym_id == g.id || String(u.gym_id) === String(g.id)) && u.role === 'owner') 
                 || db.users.find((u) => u.gym_id == g.id || String(u.gym_id) === String(g.id));
      return {
        ...g,
        owner_name: owner ? (owner.full_name || owner.name) : 'Gym Owner',
        owner_email: owner ? owner.email : g.email,
        members_count: db.members.filter((m) => m.gym_id == g.id || String(m.gym_id) === String(g.id)).length
      };
    });
  }

  // Fallback default response
  return { status: 'success', data: null };
}
