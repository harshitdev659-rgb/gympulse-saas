// In-browser mock and offline storage engine for standalone/mobile PWA deployment
// Allows GymPulse on Android, Apple iPhone & iPad to run the exact same full app ditto as Windows

const STORAGE_KEY = 'gympulse_standalone_db';
const DB_VERSION = 2;

const defaultDb = {
  version: DB_VERSION,
  currentGymId: 1,
  currentUserId: 1,
  gyms: [
    {
      id: 1,
      name: 'Apex Fitness Club',
      slug: 'apex-fitness-club',
      email: 'owner@apexfitness.com',
      phone: '+91 98765 43210',
      address: '402 Fitness Boulevard, Cyber City',
      currency: 'INR',
      logo_url: '/gympulse.png',
      plan_tier: 'pro',
      is_approved: true,
      approval_status: 'approved',
      member_capacity: 150,
      website_subdomain: 'apex-fitness-club'
    }
  ],
  users: [
    {
      id: 1,
      gym_id: 1,
      email: 'owner@apexfitness.com',
      name: 'Vikram Malhotra',
      role: 'owner',
      is_superadmin: false
    },
    {
      id: 2,
      gym_id: null,
      email: 'admin@gympulse.com',
      name: 'Harshit (Super Admin)',
      role: 'superadmin',
      is_superadmin: true
    },
    {
      id: 3,
      gym_id: 1,
      email: 'trainer@apexfitness.com',
      name: 'Karan Mehra',
      role: 'trainer',
      is_superadmin: false
    }
  ],
  plans: [
    { id: 1, gym_id: 1, name: 'Monthly Standard', duration_days: 30, price: 1500, description: 'Full gym access, lockers, cardio zone' },
    { id: 2, gym_id: 1, name: 'Quarterly Pro', duration_days: 90, price: 4000, description: 'Gym access, sauna, trainer consult' },
    { id: 3, gym_id: 1, name: 'Annual Elite VIP', duration_days: 365, price: 12000, description: 'All-inclusive VIP access + personal trainer credits' }
  ],
  trainers: [
    { id: 1, gym_id: 1, name: 'Karan Mehra', email: 'karan@apexfitness.com', phone: '+91 98765 00001', specialty: 'Strength & Conditioning', hourly_rate: 1200, is_active: true, assigned_members_count: 3 },
    { id: 2, gym_id: 1, name: 'Simran Kaur', email: 'simran@apexfitness.com', phone: '+91 98765 00002', specialty: 'HIIT & CrossFit', hourly_rate: 1000, is_active: true, assigned_members_count: 2 },
    { id: 3, gym_id: 1, name: 'Rohit Verma', email: 'rohit@apexfitness.com', phone: '+91 98765 00003', specialty: 'Yoga & Mobility', hourly_rate: 800, is_active: true, assigned_members_count: 1 }
  ],
  members: [
    { id: 1, gym_id: 1, first_name: 'Rahul', last_name: 'Sharma', full_name: 'Rahul Sharma', email: 'rahul.s@example.com', phone: '+91 98765 11111', status: 'active', join_date: '2026-08-01', current_plan_name: 'Quarterly Pro', membership_expiry_date: '2026-10-30', is_expiring_soon: false, assigned_trainer_id: 1 },
    { id: 2, gym_id: 1, first_name: 'Priya', last_name: 'Patel', full_name: 'Priya Patel', email: 'priya.p@example.com', phone: '+91 98765 22222', status: 'active', join_date: '2026-08-15', current_plan_name: 'Monthly Standard', membership_expiry_date: '2026-09-28', is_expiring_soon: true, assigned_trainer_id: 2 },
    { id: 3, gym_id: 1, first_name: 'Amit', last_name: 'Kumar', full_name: 'Amit Kumar', email: 'amit.k@example.com', phone: '+91 98765 33333', status: 'active', join_date: '2026-07-10', current_plan_name: 'Annual Elite VIP', membership_expiry_date: '2027-07-10', is_expiring_soon: false, assigned_trainer_id: 1 },
    { id: 4, gym_id: 1, first_name: 'Sneha', last_name: 'Reddy', full_name: 'Sneha Reddy', email: 'sneha.r@example.com', phone: '+91 98765 44444', status: 'active', join_date: '2026-09-01', current_plan_name: 'Monthly Standard', membership_expiry_date: '2026-10-01', is_expiring_soon: false, assigned_trainer_id: 2 },
    { id: 5, gym_id: 1, first_name: 'Rohan', last_name: 'Verma', full_name: 'Rohan Verma', email: 'rohan.v@example.com', phone: '+91 98765 55555', status: 'active', join_date: '2026-08-20', current_plan_name: 'Quarterly Pro', membership_expiry_date: '2026-11-20', is_expiring_soon: false, assigned_trainer_id: 3 },
    { id: 6, gym_id: 1, first_name: 'Ananya', last_name: 'Sen', full_name: 'Ananya Sen', email: 'ananya.s@example.com', phone: '+91 98765 66666', status: 'active', join_date: '2026-09-05', current_plan_name: 'Monthly Standard', membership_expiry_date: '2026-10-05', is_expiring_soon: false, assigned_trainer_id: null },
    { id: 7, gym_id: 1, first_name: 'Deepak', last_name: 'Joshi', full_name: 'Deepak Joshi', email: 'deepak.j@example.com', phone: '+91 98765 77777', status: 'expired', join_date: '2026-06-01', current_plan_name: 'Monthly Standard', membership_expiry_date: '2026-08-01', is_expiring_soon: false, assigned_trainer_id: null },
    { id: 8, gym_id: 1, first_name: 'Pooja', last_name: 'Nair', full_name: 'Pooja Nair', email: 'pooja.n@example.com', phone: '+91 98765 88888', status: 'active', join_date: '2026-07-25', current_plan_name: 'Annual Elite VIP', membership_expiry_date: '2027-07-25', is_expiring_soon: false, assigned_trainer_id: 1 }
  ],
  attendance: [
    { id: 1, gym_id: 1, member_id: 1, member_name: 'Rahul Sharma', check_in_time: new Date(Date.now() - 3600000 * 2).toISOString(), check_out_time: null, method: 'manual', notes: 'Leg day workout' },
    { id: 2, gym_id: 1, member_id: 2, member_name: 'Priya Patel', check_in_time: new Date(Date.now() - 3600000 * 1.5).toISOString(), check_out_time: null, method: 'qr_scan', notes: 'Cardio interval' },
    { id: 3, gym_id: 1, member_id: 3, member_name: 'Amit Kumar', check_in_time: new Date(Date.now() - 3600000 * 1).toISOString(), check_out_time: null, method: 'manual', notes: 'Personal trainer session' },
    { id: 4, gym_id: 1, member_id: 4, member_name: 'Sneha Reddy', check_in_time: new Date(Date.now() - 3600000 * 0.5).toISOString(), check_out_time: null, method: 'qr_scan', notes: 'Upper body' }
  ],
  payments: [
    { id: 1, gym_id: 1, member_id: 1, member_name: 'Rahul Sharma', plan_name: 'Quarterly Pro', amount: 4000, payment_method: 'upi', status: 'completed', payment_date: '2026-08-01', invoice_number: 'INV-2026-001' },
    { id: 2, gym_id: 1, member_id: 2, member_name: 'Priya Patel', plan_name: 'Monthly Standard', amount: 1500, payment_method: 'card', status: 'completed', payment_date: '2026-08-28', invoice_number: 'INV-2026-002' },
    { id: 3, gym_id: 1, member_id: 3, member_name: 'Amit Kumar', plan_name: 'Annual Elite VIP', amount: 12000, payment_method: 'bank_transfer', status: 'completed', payment_date: '2026-07-10', invoice_number: 'INV-2026-003' },
    { id: 4, gym_id: 1, member_id: 4, member_name: 'Sneha Reddy', plan_name: 'Monthly Standard', amount: 1500, payment_method: 'upi', status: 'completed', payment_date: '2026-09-01', invoice_number: 'INV-2026-004' },
    { id: 5, gym_id: 1, member_id: 5, member_name: 'Rohan Verma', plan_name: 'Quarterly Pro', amount: 4000, payment_method: 'cash', status: 'completed', payment_date: '2026-08-20', invoice_number: 'INV-2026-005' },
    { id: 6, gym_id: 1, member_id: 8, member_name: 'Pooja Nair', plan_name: 'Annual Elite VIP', amount: 12000, payment_method: 'upi', status: 'completed', payment_date: '2026-07-25', invoice_number: 'INV-2026-006' }
  ],
  settings: {
    gym_id: 1,
    business_hours: '06:00 - 22:00',
    tax_percentage: 18.0,
    expiry_alert_days: 7,
    receipt_footer_text: 'Thank you for training with Apex Fitness Club!',
    primary_color: '#4f46e5'
  },
  website: {
    website_subdomain: 'apex-fitness-club',
    website_enabled: true,
    website_headline: 'Welcome to Apex Fitness Club',
    website_tagline: 'Elevate Your Fitness Journey With Us',
    website_about: 'Premier fitness destination equipped with Olympic free weights, cutting-edge cardio, and certified coaches.',
    website_amenities: 'Olympic Free Weights, Cardio Theatre, Strength Machines, Certified Trainers, Steam & Sauna, Lockers',
    website_cover_image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&auto=format&fit=crop&q=80',
    website_custom_domain: ''
  },
  inquiries: [
    { id: 1, gym_id: 1, name: 'Kavita Roy', email: 'kavita@example.com', phone: '+91 98765 99991', message: 'Interested in annual membership and personal trainer options.', status: 'new', created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 2, gym_id: 1, name: 'Rajiv Menon', email: 'rajiv@example.com', phone: '+91 98765 99992', message: 'What are your peak hours and steam room timings?', status: 'contacted', created_at: new Date(Date.now() - 172800000).toISOString() }
  ]
};

function getDb() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDb));
      return defaultDb;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.version || parsed.version < DB_VERSION || !Array.isArray(parsed.gyms)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDb));
      return defaultDb;
    }
    return parsed;
  } catch (e) {
    return defaultDb;
  }
}

function saveDb(db) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
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
  let currentGymId = db.currentGymId || 1;
  let currentUser = db.users.find((u) => u.id === db.currentUserId) || db.users[0];
  let currentGym = db.gyms.find((g) => g.id === currentGymId) || db.gyms[0];

  // 1. Auth: Login
  if (endpoint.startsWith('/auth/login') && method === 'POST') {
    const email = (body.email || '').toLowerCase().trim();
    let user = db.users.find((u) => u.email.toLowerCase() === email);

    if (!user) {
      if (email.includes('admin')) {
        user = db.users.find((u) => u.is_superadmin) || {
          id: Date.now(),
          gym_id: null,
          email,
          name: 'Platform Super Admin',
          role: 'superadmin',
          is_superadmin: true
        };
      } else {
        user = {
          id: Date.now(),
          gym_id: currentGymId,
          email: email || 'owner@apexfitness.com',
          name: email.split('@')[0] || 'Gym Owner',
          role: 'owner',
          is_superadmin: false
        };
        db.users.push(user);
      }
    }

    db.currentUserId = user.id;
    if (user.gym_id) {
      db.currentGymId = user.gym_id;
      currentGymId = user.gym_id;
    }
    currentGym = db.gyms.find((g) => g.id === currentGymId) || db.gyms[0];
    saveDb(db);

    return {
      access_token: 'mock-standalone-token-' + Date.now(),
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

    const newGym = {
      id: newGymId,
      name: gymName,
      slug,
      website_subdomain: slug,
      email: body.email || 'owner@newgym.com',
      phone: body.phone || '+91 90000 00000',
      address: 'Fitness Boulevard Suite 100',
      currency: body.currency || 'INR',
      plan_tier: 'pro',
      is_approved: true,
      approval_status: 'approved',
      member_capacity: 150,
      logo_url: '/gympulse.png'
    };
    db.gyms.push(newGym);

    const newUserId = Math.max(...db.users.map((u) => u.id), 0) + 1;
    const newUser = {
      id: newUserId,
      gym_id: newGymId,
      email: body.email,
      name: body.owner_name || 'Gym Owner',
      role: 'owner',
      is_superadmin: false
    };
    db.users.push(newUser);

    // Initial default membership plans for this newly registered gym
    db.plans.push(
      { id: Date.now() + 1, gym_id: newGymId, name: 'Monthly Flex Pass', duration_days: 30, price: 1500, description: 'Standard monthly gym floor access' },
      { id: Date.now() + 2, gym_id: newGymId, name: 'Quarterly Power Plan', duration_days: 90, price: 4000, description: '3 months access with trainer consult' }
    );

    // NOTE: db.members has 0 members for newGymId! It starts completely clean with 0 names.
    db.currentGymId = newGymId;
    db.currentUserId = newUserId;
    saveDb(db);

    return {
      access_token: 'mock-standalone-token-' + Date.now(),
      token_type: 'bearer',
      user: newUser,
      gym: newGym
    };
  }

  // 3. Auth: Current User (/auth/me)
  if (endpoint.startsWith('/auth/me')) {
    const user = db.users.find((u) => u.id === db.currentUserId) || db.users[0];
    const gym = db.gyms.find((g) => g.id === (user.gym_id || db.currentGymId)) || db.gyms[0];
    return {
      user,
      gym
    };
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
      db.website = { ...db.website, ...body };
      saveDb(db);
      return db.website;
    }
    return db.website;
  }
  if (endpoint.startsWith('/gym/inquiries')) {
    return db.inquiries.filter((inq) => inq.gym_id === currentGymId);
  }

  // 15. AI Assistant
  if (endpoint.startsWith('/ai/query') && method === 'POST') {
    const q = (body.query || '').toLowerCase();
    const gymMembers = db.members.filter((m) => m.gym_id === currentGymId);
    const activeCount = gymMembers.filter((m) => m.status === 'active').length;
    const expiringSoon = gymMembers.filter((m) => m.is_expiring_soon).map((m) => m.full_name).join(', ') || 'None';
    const totalRev = db.payments.filter((p) => p.gym_id === currentGymId).reduce((s, p) => s + (p.amount || 0), 0);
    const checkedInToday = db.attendance.filter((a) => a.gym_id === currentGymId).length;

    let reply = `Here is your gym update for ${currentGym.name}:\n`;
    if (q.includes('member') || q.includes('who') || q.includes('active')) {
      reply += `• Active Members: ${activeCount} / ${currentGym.member_capacity} capacity.\n`;
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
      reply = `Hello! I am your AI GymPulse Assistant. Your facility "${currentGym.name}" has ${activeCount} active members, ${checkedInToday} check-ins today, and ₹${totalRev.toLocaleString('en-IN')} total revenue collected. What would you like to check?`;
    }
    return {
      query: body.query,
      answer: reply,
      context_data: { active_members: activeCount, today_attendance: checkedInToday, total_revenue: totalRev }
    };
  }

  // 16. Super Admin: Platform Operations & Gym Deletion
  if (endpoint.startsWith('/platform/metrics')) {
    return {
      total_gyms: db.gyms.length,
      active_gyms: db.gyms.filter((g) => g.is_approved).length,
      total_platform_members: db.members.length,
      monthly_platform_revenue: db.payments.reduce((s, p) => s + (p.amount || 0), 0)
    };
  }

  // Delete Gym as Super Admin
  const matchGymDelete = endpoint.match(/^\/platform\/gyms\/(\d+)$/);
  if (matchGymDelete && method === 'DELETE') {
    const gymId = parseInt(matchGymDelete[1], 10);
    const targetGym = db.gyms.find((g) => g.id === gymId);
    if (!targetGym) {
      return { success: false, message: 'Gym not found' };
    }

    // Permanently purge gym and all associated tenant records
    db.gyms = db.gyms.filter((g) => g.id !== gymId);
    db.members = db.members.filter((m) => m.gym_id !== gymId);
    db.attendance = db.attendance.filter((a) => a.gym_id !== gymId);
    db.payments = db.payments.filter((p) => p.gym_id !== gymId);
    db.plans = db.plans.filter((p) => p.gym_id !== gymId);
    db.trainers = db.trainers.filter((t) => t.gym_id !== gymId);
    db.inquiries = db.inquiries.filter((inq) => inq.gym_id !== gymId);
    db.users = db.users.filter((u) => u.gym_id !== gymId || u.is_superadmin);

    // If the active viewed gym was deleted, switch to first available gym or default
    if (db.currentGymId === gymId) {
      db.currentGymId = db.gyms[0]?.id || 1;
    }
    saveDb(db);

    return {
      success: true,
      message: `Facility "${targetGym.name}" and its records have been permanently deleted.`,
      deleted_id: gymId
    };
  }

  // Approve / Reject Gym as Super Admin
  const matchGymApprove = endpoint.match(/^\/platform\/gyms\/(\d+)\/approve$/);
  if (matchGymApprove && method === 'POST') {
    const gymId = parseInt(matchGymApprove[1], 10);
    const g = db.gyms.find((item) => item.id === gymId);
    if (g) {
      g.is_approved = true;
      g.approval_status = 'approved';
      saveDb(db);
      return g;
    }
  }

  const matchGymReject = endpoint.match(/^\/platform\/gyms\/(\d+)\/reject$/);
  if (matchGymReject && method === 'POST') {
    const gymId = parseInt(matchGymReject[1], 10);
    const g = db.gyms.find((item) => item.id === gymId);
    if (g) {
      g.is_approved = false;
      g.approval_status = 'rejected';
      saveDb(db);
      return g;
    }
  }

  // List all gyms for Super Admin
  if (endpoint.startsWith('/platform/gyms') && method === 'GET') {
    return db.gyms.map((g) => {
      const owner = db.users.find((u) => u.gym_id === g.id && u.role === 'owner') || db.users.find((u) => u.gym_id === g.id);
      return {
        ...g,
        owner_name: owner ? owner.name : 'Gym Owner',
        owner_email: owner ? owner.email : g.email,
        members_count: db.members.filter((m) => m.gym_id === g.id).length
      };
    });
  }

  // Fallback default response
  return { status: 'success', data: null };
}
