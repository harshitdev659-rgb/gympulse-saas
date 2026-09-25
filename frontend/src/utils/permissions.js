/**
 * Role-Based Access Control (RBAC) & Granular Permissions Helper
 * Gym Owners have 100% full unrestricted access across all features.
 * Staff / Trainers are gated strictly according to permissions granted by their Gym Owner.
 */

export const PERMISSION_DEFINITIONS = [
  {
    key: 'can_manage_members',
    label: 'Manage Members',
    category: 'Operations',
    description: 'Add new members, renew plans, edit profiles, and view roster.'
  },
  {
    key: 'can_record_attendance',
    label: 'Record Attendance',
    category: 'Operations',
    description: 'Perform check-in/out, QR scanning, and view daily check-in logs.'
  },
  {
    key: 'can_collect_payments',
    label: 'Payments & Billing',
    category: 'Finances',
    description: 'Record fee collections, issue digital receipts, and view payment records.'
  },
  {
    key: 'can_manage_plans',
    label: 'Membership Plans',
    category: 'Finances',
    description: 'Create, modify, price, and activate membership subscription tiers.'
  },
  {
    key: 'can_manage_trainers',
    label: 'Trainers & Staff',
    category: 'Management',
    description: 'Manage personal trainer profiles, hourly rates, and client assignments.'
  },
  {
    key: 'can_view_reports',
    label: 'Reports & Analytics',
    category: 'Management',
    description: 'Access financial revenue charts, member retention, and business statistics.'
  },
  {
    key: 'can_manage_website',
    label: 'Gym Public Website',
    category: 'Marketing',
    description: 'Customize public landing page, branding, theme, and process visitor inquiries.'
  },
  {
    key: 'can_manage_settings',
    label: 'Facility Settings',
    category: 'Administration',
    description: 'Update gym operational settings, business hours, tax percentage, and staff.'
  }
];

export const ROLE_PRESETS = {
  front_desk: {
    label: 'Front Desk / Reception',
    description: 'Handles day-to-day athlete check-ins, member onboarding, and payment collections.',
    permissions: {
      can_manage_members: true,
      can_record_attendance: true,
      can_collect_payments: true,
      can_manage_plans: false,
      can_manage_trainers: false,
      can_view_reports: false,
      can_manage_website: false,
      can_manage_settings: false
    }
  },
  trainer: {
    label: 'Fitness Coach / Trainer',
    description: 'Manages athletic workouts, daily attendance logs, and personal trainer client rosters.',
    permissions: {
      can_manage_members: true,
      can_record_attendance: true,
      can_collect_payments: false,
      can_manage_plans: false,
      can_manage_trainers: true,
      can_view_reports: false,
      can_manage_website: false,
      can_manage_settings: false
    }
  },
  manager: {
    label: 'Branch / Shift Manager',
    description: 'Full operational control including reports, website leads, and plans (excludes owner decommissioning).',
    permissions: {
      can_manage_members: true,
      can_record_attendance: true,
      can_collect_payments: true,
      can_manage_plans: true,
      can_manage_trainers: true,
      can_view_reports: true,
      can_manage_website: true,
      can_manage_settings: false
    }
  },
  full_access: {
    label: 'All Permissions (Admin)',
    description: 'Complete access to all operations, reports, website, and settings.',
    permissions: {
      can_manage_members: true,
      can_record_attendance: true,
      can_collect_payments: true,
      can_manage_plans: true,
      can_manage_trainers: true,
      can_view_reports: true,
      can_manage_website: true,
      can_manage_settings: true
    }
  }
};

/**
 * Checks if a user has a specific granular permission.
 * Owners and SuperAdmins unconditionally return true.
 */
export function hasPermission(user, permissionKey) {
  if (!user) return false;
  if (user.is_superadmin || user.role === 'superadmin' || user.role === 'owner') {
    return true;
  }
  if (!permissionKey) return true;

  let perms = user.permissions;
  if (!perms) {
    // Basic defaults if no permissions object was saved
    if (permissionKey === 'can_record_attendance' || permissionKey === 'can_manage_members') {
      return true;
    }
    return false;
  }

  if (typeof perms === 'string') {
    try {
      perms = JSON.parse(perms);
    } catch (e) {
      const arr = perms.split(',').map((p) => p.trim());
      return arr.includes(permissionKey);
    }
  }

  if (typeof perms === 'object' && perms !== null) {
    return !!perms[permissionKey];
  }

  return false;
}

/**
 * Maps sidebar navigation tab IDs to their required permission keys.
 */
export const TAB_PERMISSION_MAP = {
  superadmin: 'superadmin',
  dashboard: null, // Always viewable
  members: 'can_manage_members',
  memberships: 'can_manage_plans',
  attendance: 'can_record_attendance',
  payments: 'can_collect_payments',
  trainers: 'can_manage_trainers',
  website: 'can_manage_website',
  reports: 'can_view_reports',
  settings: 'can_manage_settings'
};

/**
 * Returns whether a tab ID is accessible by the specified user.
 */
export function canAccessTab(user, tabId) {
  if (!user) return false;
  if (user.is_superadmin || user.role === 'superadmin') return true;
  if (tabId === 'superadmin') return false;
  if (user.role === 'owner') return true;

  const requiredPerm = TAB_PERMISSION_MAP[tabId];
  if (!requiredPerm) return true; // Tab without restriction (e.g. dashboard)
  return hasPermission(user, requiredPerm);
}
