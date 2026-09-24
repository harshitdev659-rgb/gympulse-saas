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
  website: {}
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
      // Purge old mock storage and reset to clean version 3
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
  let currentGymId = db.currentGymId || null;
  let currentUser = db.currentUserId ? db.users.find((u) => u.id === db.currentUserId) || null : null;
  let currentGym = currentGymId ? db.gyms.find((g) => g.id === currentGymId) || null : null;

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
        access_token: 'mock-standalone-admin-token-' + Date.now(),
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
    currentGym = db.gyms.find((g) => g.id === user.gym_id) || null;
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
      email: (body.email || 'owner@newgym.com').toLowerCase().trim(),
      phone: body.phone || '+91 90000 00000',
      address: 'Fitness Facility Address',
      currency: body.currency || 'INR',
      plan_tier: 'pro',
      is_approved: false, // Requires Super Admin approval
      approval_status: 'pending',
      member_capacity: 150,
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
      role: 'owner',
      is_superadmin: false
    };
    db.users.push(newUser);

    // Initial default membership plans for this newly registered gym
    db.plans.push(
      { id: Date.now() + 1, gym_id: newGymId, name: 'Monthly Flex Pass', duration_days: 30, price: 1500, description: 'Standard monthly gym floor access' },
      { id: Date.now() + 2, gym_id: newGymId, name: 'Quarterly Power Plan', duration_days: 90, price: 4000, description: '3 months access with trainer consult' }
    );

    // Newly registered gym starts with strictly 0 members and 0 invoices
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
    if (!db.currentUserId) {
      throw new Error('Not authenticated');
    }
    const user = db.users.find((u) => u.id === db.currentUserId);
    if (!user) {
      throw new Error('User not found');
    }
    const gym = user.gym_id ? db.gyms.find((g) => g.id === user.gym_id) || null : null;
    return {
      user,
      gym
    };
  }

  // Auth: Logout
  if (endpoint.startsWith('/auth/logout')) {
    db.currentUserId = null;
    db.currentGymId = null;
    saveDb(db);
    return { success: true };
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
      }
      saveDb(db);
      return db.website;
    }
    return db.website;
  }
  if (endpoint.startsWith('/gym/inquiries')) {
    return db.inquiries.filter((inq) => inq.gym_id === currentGymId);
  }

  // 14b. Dedicated Public Facility Website Handler (/public/facility/:slug)
  const matchPublicFacility = endpoint.match(/^\/public\/facility\/([^/?]+)/);
  if (matchPublicFacility) {
    const slug = decodeURIComponent(matchPublicFacility[1]).toLowerCase();
    const facilityGym = db.gyms.find(
      (g) => (g.slug && g.slug.toLowerCase() === slug) || 
             (g.website_subdomain && g.website_subdomain.toLowerCase() === slug) || 
             String(g.id) === slug
    ) || db.gyms[0];

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

    if (!facilityGym) {
      throw new Error(`Facility with website link "${slug}" not found.`);
    }

    const facilityPlans = db.plans.filter((p) => p.gym_id === facilityGym.id);
    const facilityTrainers = db.trainers.filter((t) => t.gym_id === facilityGym.id);
    return {
      gym: facilityGym,
      plans: facilityPlans.length > 0 ? facilityPlans : [
        { id: 1, gym_id: facilityGym.id, name: 'Monthly Flex Pass', duration_days: 30, price: 1500, description: 'Unlimited gym floor access & locker usage' },
        { id: 2, gym_id: facilityGym.id, name: 'Quarterly Power Plan', duration_days: 90, price: 4000, description: '3 months access with initial fitness assessment' }
      ],
      trainers: facilityTrainers,
      website: facilityGym.website || db.website || {
        website_subdomain: facilityGym.website_subdomain || facilityGym.slug,
        website_headline: `Welcome to ${facilityGym.name}`,
        website_tagline: 'World-Class Fitness, Strength & Conditioning',
        website_about: `${facilityGym.name} provides premier fitness equipment, certified coaching, and a supportive community.`,
        website_cover_image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&auto=format&fit=crop&q=80',
        website_amenities: 'Olympic Free Weights, Cardio Theatre, Strength Machines, Certified Trainers, Steam & Sauna, Lockers'
      }
    };
  }

  // 14c. SaaS Billing & Subscriptions
  if (endpoint.startsWith('/billing/status')) {
    const gymMembers = db.members.filter((m) => m.gym_id === currentGymId);
    const tier = currentGym?.plan_tier || 'free';
    return {
      plan_tier: tier,
      tier_name: tier === 'free' ? 'Free Starter' : tier === 'business' ? 'Business Enterprise' : 'Pro Growth',
      subscription_status: currentGym?.subscription_status || 'active',
      member_count: gymMembers.length,
      max_members: currentGym?.member_capacity || (tier === 'free' ? 25 : tier === 'business' ? 10000 : 250),
      usage_percentage: Math.min(100, Math.round((gymMembers.length / 250) * 100)),
      can_add_member: true,
      ai_enabled: tier !== 'free',
      features: ['Unlimited Check-ins', 'Digital Invoicing', 'AI Assistant', 'CSV Exports'],
      requested_plan_tier: currentGym?.requested_plan_tier || null,
      tier_upgrade_status: currentGym?.tier_upgrade_status || 'none',
      tier_upgrade_requested_at: currentGym?.tier_upgrade_requested_at || null
    };
  }

  if (endpoint.startsWith('/billing/upgrade') && method === 'POST') {
    const targetTier = (body.target_tier || 'pro').toLowerCase();
    if (currentGym) {
      currentGym.requested_plan_tier = targetTier;
      currentGym.tier_upgrade_status = 'pending';
      currentGym.tier_upgrade_requested_at = new Date().toISOString();
      saveDb(db);
    }
    return {
      message: `Upgrade request to ${targetTier.toUpperCase()} tier submitted! Payment pending Admin verification.`,
      requested_tier: targetTier,
      current_tier: currentGym?.plan_tier || 'free',
      upgrade_status: 'pending',
      status: currentGym?.subscription_status || 'active'
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
    return {
      total_gyms: db.gyms.length,
      active_gyms: db.gyms.filter((g) => g.is_approved).length,
      total_platform_members: db.members.length,
      monthly_platform_revenue: db.payments.reduce((s, p) => s + (p.amount || 0), 0)
    };
  }

  // Super Admin: Approve Tier Upgrade
  const matchApproveUpgrade = endpoint.match(/^\/platform\/gyms\/([^/?]+)\/approve-upgrade$/);
  if (matchApproveUpgrade && method === 'POST') {
    const gymId = matchApproveUpgrade[1];
    const g = db.gyms.find((item) => item.id == gymId || String(item.id) === String(gymId));
    if (!g) throw new Error('Gym facility not found');
    g.plan_tier = g.requested_plan_tier || 'pro';
    g.tier_upgrade_status = 'approved';
    g.subscription_status = 'active';
    saveDb(db);
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

  // Approve / Reject Gym as Super Admin
  const matchGymApprove = endpoint.match(/^\/platform\/gyms\/([^/?]+)\/approve$/);
  if (matchGymApprove && method === 'POST') {
    const gymId = matchGymApprove[1];
    const g = db.gyms.find((item) => item.id == gymId || String(item.id) === String(gymId));
    if (g) {
      g.is_approved = true;
      g.approval_status = 'approved';
      saveDb(db);
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
