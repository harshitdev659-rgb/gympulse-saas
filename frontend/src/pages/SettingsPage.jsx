import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Clock,
  DollarSign,
  Users,
  Shield,
  CreditCard,
  Plus,
  Save,
  CheckCircle2,
  Sparkles,
  Mail,
  Phone,
  ArrowUpRight,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Globe,
  ExternalLink,
  Edit3,
  Key,
  Lock,
  CheckSquare,
  Square,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { PERMISSION_DEFINITIONS, ROLE_PRESETS } from '../utils/permissions';

export const SettingsPage = () => {
  const { gym, user, refreshGymProfile, logout } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('profile'); // profile, config, team, billing

  // Danger Zone Decommission State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Gym Profile Form
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    address: '',
    currency: 'INR',
    logo_url: ''
  });

  // Gym Operational Config Form
  const [configForm, setConfigForm] = useState({
    business_hours: '',
    tax_percentage: 0,
    expiry_alert_days: 7,
    receipt_footer_text: '',
    primary_color: '#2563eb'
  });

  // Team & Staff Management
  const [teamUsers, setTeamUsers] = useState([]);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const initialUserForm = {
    full_name: '',
    email: '',
    password: '',
    role: 'staff',
    phone: '',
    permissions: { ...ROLE_PRESETS.front_desk.permissions }
  };
  const [userForm, setUserForm] = useState(initialUserForm);

  // Edit Staff Permissions Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editRole, setEditRole] = useState('staff');
  const [editPermissions, setEditPermissions] = useState({ ...ROLE_PRESETS.front_desk.permissions });

  // 24/7 Cloud Hosting Public Link
  const [cloudUrlInput, setCloudUrlInput] = useState('https://harshitdev659-rgb.github.io/gympulse-saas/');
  const [isSavingCloudUrl, setIsSavingCloudUrl] = useState(false);

  // Billing
  const [billingStatus, setBillingStatus] = useState(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchAllSettings = async () => {
    try {
      setIsLoading(true);
      const [gData, cData, uData, bData, nData] = await Promise.all([
        api.getGymProfile().catch((err) => {
          console.warn('Failed to load gym profile, using local fallback:', err);
          return gym || null;
        }),
        api.getGymSettings().catch((err) => {
          console.warn('Failed to load gym settings, using default fallback:', err);
          return null;
        }),
        api.getUsers().catch((err) => {
          console.warn('Failed to load team users, using empty fallback:', err);
          return [];
        }),
        api.getBillingStatus().catch((err) => {
          console.warn('Failed to load billing status, using default fallback:', err);
          return null;
        }),
        api.getNetworkInfo().catch(() => null)
      ]);

      if (nData?.cloud_url) {
        setCloudUrlInput(nData.cloud_url);
      }

      if (gData) {
        setProfileForm({
          name: gData.name || gym?.name || '',
          phone: gData.phone || gym?.phone || '',
          address: gData.address || gym?.address || '',
          currency: gData.currency || gym?.currency || 'INR',
          logo_url: gData.logo_url || gym?.logo_url || ''
        });
      } else if (gym) {
        setProfileForm({
          name: gym.name || '',
          phone: gym.phone || '',
          address: gym.address || '',
          currency: gym.currency || 'INR',
          logo_url: gym.logo_url || ''
        });
      }

      if (cData) {
        setConfigForm({
          business_hours: cData.business_hours || 'Mon-Sat: 6:00 AM - 10:00 PM',
          tax_percentage: cData.tax_percentage ?? 18,
          expiry_alert_days: cData.expiry_alert_days ?? 7,
          receipt_footer_text: cData.receipt_footer_text || '',
          primary_color: cData.primary_color || '#2563eb'
        });
      }

      setTeamUsers(Array.isArray(uData) ? uData : []);

      setBillingStatus(bData || {
        tier_name: (gym?.plan_tier || 'pro').toUpperCase(),
        plan_tier: gym?.plan_tier || 'pro',
        subscription_status: gym?.subscription_status || 'active',
        member_count: 0,
        max_members: gym?.max_members || 250,
        usage_percentage: 0,
        features: [
          'Full Gym Management',
          'Automated Member Check-in',
          'Invoices & Payments (INR)',
          'AI Copilot & Smart Assistant'
        ]
      });
    } catch (err) {
      console.error('Unexpected error loading settings:', err);
      toast.error('Notice: Running settings in offline-resilient mode.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSettings();

    const handleSync = () => {
      fetchAllSettings();
      refreshGymProfile();
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('gympulse_db_updated', handleSync);

    let bc = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('gympulse_channel');
        bc.onmessage = () => handleSync();
      }
    } catch (e) {}

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('gympulse_db_updated', handleSync);
      if (bc) {
        try { bc.close(); } catch (e) {}
      }
    };
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateGymProfile(profileForm);
      toast.success('Facility profile updated successfully!');
      refreshGymProfile();
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateGymSettings({
        ...configForm,
        tax_percentage: Number(configForm.tax_percentage),
        expiry_alert_days: Number(configForm.expiry_alert_days)
      });
      toast.success('Operational configurations saved!');
    } catch (err) {
      toast.error(err.message || 'Failed to save configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCloudUrl = async (e) => {
    e.preventDefault();
    setIsSavingCloudUrl(true);
    try {
      const res = await api.updateCloudUrl(cloudUrlInput);
      toast.success('24/7 Cloud Hosting URL updated successfully!');
      if (res?.cloud_url) {
        setCloudUrlInput(res.cloud_url);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update cloud URL.');
    } finally {
      setIsSavingCloudUrl(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!userForm.full_name || !userForm.email || !userForm.password) {
      toast.error('Please enter name, email, and password.');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        ...userForm,
        permissions: JSON.stringify(userForm.permissions)
      };
      await api.createUser(payload);
      toast.success(`Account for ${userForm.full_name} created successfully with assigned permissions!`);
      setIsAddUserModalOpen(false);
      setUserForm(initialUserForm);
      fetchAllSettings();
    } catch (err) {
      toast.error(err.message || 'Failed to create team member.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEditUser = (u) => {
    setEditingUser(u);
    let parsedPerms = { ...ROLE_PRESETS.front_desk.permissions };
    if (u.permissions) {
      if (typeof u.permissions === 'string') {
        try {
          parsedPerms = JSON.parse(u.permissions);
        } catch (e) {}
      } else if (typeof u.permissions === 'object') {
        parsedPerms = u.permissions;
      }
    } else if (u.role === 'trainer') {
      parsedPerms = { ...ROLE_PRESETS.trainer.permissions };
    } else if (u.role === 'owner') {
      parsedPerms = { ...ROLE_PRESETS.full_access.permissions };
    }
    setEditPermissions(parsedPerms);
    setEditRole(u.role || 'staff');
    setIsEditUserModalOpen(true);
  };

  const handleSaveUserPermissions = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSaving(true);
    try {
      await api.updateUser(editingUser.id, {
        role: editRole,
        permissions: JSON.stringify(editPermissions)
      });
      toast.success(`Permissions updated for ${editingUser.full_name}!`);
      setIsEditUserModalOpen(false);
      setEditingUser(null);
      fetchAllSettings();
    } catch (err) {
      toast.error(err.message || 'Failed to update user permissions.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStaffUser = async (u) => {
    if (u.role === 'owner') {
      toast.error('The primary gym owner account cannot be deleted.');
      return;
    }
    if (!window.confirm(`Are you sure you want to remove staff member "${u.full_name}"? They will lose access to the gym.`)) {
      return;
    }
    try {
      await api.deleteUser(u.id);
      toast.success(`Staff user ${u.full_name} removed.`);
      fetchAllSettings();
    } catch (err) {
      toast.error(err.message || 'Failed to remove user.');
    }
  };

  const handleUpgradeTier = async (targetTier) => {
    setIsUpgrading(true);
    // Instant optimistic update so pending banner shows in 0ms
    setBillingStatus((prev) => prev ? {
      ...prev,
      requested_plan_tier: targetTier,
      tier_upgrade_status: 'pending',
      tier_upgrade_requested_at: new Date().toISOString()
    } : prev);

    try {
      const res = await api.upgradePlan(targetTier);
      toast.success(res.message || `Upgrade request for ${targetTier.toUpperCase()} submitted! Super Admin has been notified immediately.`);
      await refreshGymProfile();
      await fetchAllSettings();
    } catch (err) {
      toast.error(err.message || 'Upgrade request failed.');
      fetchAllSettings();
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleDeleteGym = async (e) => {
    e.preventDefault();
    if (!deletePassword || !deleteConfirmName) {
      toast.error('Please enter your password and type your gym name to confirm.');
      return;
    }
    setIsDeleting(true);
    try {
      const res = await api.decommissionGym({
        password: deletePassword,
        confirm_gym_name: deleteConfirmName
      });
      toast.success(res.message || 'Gym facility and dedicated public website permanently deleted.');
      setIsDeleteModalOpen(false);
      logout();
    } catch (err) {
      toast.error(err.message || 'Decommissioning failed.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading && !billingStatus) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <RefreshCw className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Facility Settings</h2>
        <p className="text-xs text-slate-500 mt-1">
          Configure branding, currency, receipt templates, staff permissions, and your SaaS subscription tier.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" /> Gym Profile
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'config'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" /> Operational Config
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'team'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" /> Staff & Roles ({teamUsers.length})
        </button>

        <button
          onClick={() => setActiveTab('billing')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'billing'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" /> SaaS Subscription
        </button>
      </div>

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs max-w-2xl">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                Facility Name *
              </label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                placeholder="e.g. Iron Pulse Fitness Hub"
                className="w-full px-3.5 py-2.5 text-sm font-medium text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3.5 py-2.5 text-sm font-medium text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                  Currency Symbol
                </label>
                <select
                  value={profileForm.currency}
                  onChange={(e) => setProfileForm({ ...profileForm, currency: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-bold text-slate-900"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                Physical Facility Address
              </label>
              <textarea
                rows={2}
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                placeholder="e.g. 104, 2nd Floor, MG Road, Koramangala, Bengaluru - 560034"
                className="w-full px-3.5 py-2.5 text-sm font-medium text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                Branding Logo URL
              </label>
              <input
                type="url"
                value={profileForm.logo_url}
                onChange={(e) => setProfileForm({ ...profileForm, logo_url: e.target.value })}
                placeholder="e.g. https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200"
                className="w-full px-3.5 py-2.5 text-sm font-medium text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
            </div>

            <div className="pt-4">
              <Button type="submit" variant="primary" isLoading={isSaving} icon={Save}>
                Save Profile Changes
              </Button>
            </div>
          </form>

          {/* AppSec Danger Zone: Decommission Facility & Erase Public Website */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="bg-rose-50/70 border-2 border-rose-200/80 rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-rose-700 font-extrabold text-xs uppercase tracking-wider mb-1">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Danger Zone: Decommission Facility</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Delete Gym Facility & Its Dedicated Public Website
                  </h4>
                  <p className="text-xs text-slate-700 mt-1 max-w-xl leading-relaxed font-medium">
                    Permanently purges all member profiles, check-in history, invoices, and 
                    <strong> instantly deletes your dedicated public website (/facility/{gym?.website_subdomain || gym?.slug})</strong>.
                    This action is permanent and cannot be undone.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap self-start sm:self-center shrink-0 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Gym & Website
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Operational Config */}
      {activeTab === 'config' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs max-w-2xl">
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                Business Hours Schedule
              </label>
              <input
                type="text"
                value={configForm.business_hours}
                onChange={(e) => setConfigForm({ ...configForm, business_hours: e.target.value })}
                placeholder="e.g. Mon-Sat: 6:00 AM - 10:00 PM, Sun: 7:00 AM - 1:00 PM"
                className="w-full px-3.5 py-2.5 text-sm font-medium text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                  Tax / GST / VAT Percentage (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={configForm.tax_percentage}
                  onChange={(e) => setConfigForm({ ...configForm, tax_percentage: e.target.value })}
                  placeholder="e.g. 18"
                  className="w-full px-3.5 py-2.5 text-sm font-medium text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                  Expiry Alert Window (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={configForm.expiry_alert_days}
                  onChange={(e) => setConfigForm({ ...configForm, expiry_alert_days: e.target.value })}
                  placeholder="e.g. 7"
                  className="w-full px-3.5 py-2.5 text-sm font-medium text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                Receipt Footer Notice
              </label>
              <textarea
                rows={2}
                value={configForm.receipt_footer_text}
                onChange={(e) => setConfigForm({ ...configForm, receipt_footer_text: e.target.value })}
                placeholder="e.g. Thank you for training with us! Please wear clean sports shoes on the floor at all times."
                className="w-full px-3.5 py-2.5 text-sm font-medium text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
            </div>

            <div className="pt-4">
              <Button type="submit" variant="primary" isLoading={isSaving} icon={Save}>
                Save Operational Config
              </Button>
            </div>
          </form>

          {/* 24/7 Cloud Hosting Public Website & Worldwide Download Link */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/50 border border-emerald-200/90 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold text-xs uppercase tracking-wider mb-1">
                    <Globe className="w-4 h-4 text-emerald-600" />
                    <span>24/7 Worldwide Cloud Hosting & Download Hub</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Live Public Domain (Online 24/7 • No Same Wi-Fi Needed)
                  </h4>
                  <p className="text-xs text-slate-700 mt-1 max-w-xl font-medium">
                    This is your permanent 24/7 cloud address. When anyone clicks "Download App" or visits this link, they can download and install GymPulse on Android, iPhone, and Windows.
                  </p>
                </div>
                <span className="hidden sm:inline-flex px-2.5 py-1 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                  24/7 Cloud Online
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="url"
                  value={cloudUrlInput}
                  onChange={(e) => setCloudUrlInput(e.target.value)}
                  placeholder="https://harshitdev659-rgb.github.io/gympulse-saas/"
                  className="flex-1 px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-900 font-semibold"
                />
                <Button
                  onClick={handleSaveCloudUrl}
                  variant="primary"
                  size="sm"
                  isLoading={isSavingCloudUrl}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                >
                  Save Cloud URL
                </Button>
                <a
                  href={`${cloudUrlInput || 'https://harshitdev659-rgb.github.io/gympulse-saas/'}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1 shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open 24/7 Portal</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Team / User Management */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Gym Operators & Staff</h3>
              <p className="text-xs text-slate-700 font-medium">
                Create staff accounts with individual credentials and assign granular permissions for members, payments, attendance, and plans.
              </p>
            </div>
            <Button
              onClick={() => {
                setUserForm(initialUserForm);
                setIsAddUserModalOpen(true);
              }}
              variant="primary"
              size="sm"
              icon={Plus}
            >
              Add Staff User
            </Button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
                  <th className="py-3 px-6">User Account</th>
                  <th className="py-3 px-6">Role</th>
                  <th className="py-3 px-6">Granted Permissions</th>
                  <th className="py-3 px-6">Contact Phone</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {teamUsers.map((u) => {
                  let permsObj = {};
                  if (u.permissions) {
                    if (typeof u.permissions === 'string') {
                      try { permsObj = JSON.parse(u.permissions); } catch (e) {}
                    } else if (typeof u.permissions === 'object') {
                      permsObj = u.permissions;
                    }
                  } else if (u.role === 'owner') {
                    permsObj = { ...ROLE_PRESETS.full_access.permissions };
                  } else {
                    permsObj = { ...ROLE_PRESETS.front_desk.permissions };
                  }

                  const activePermKeys = Object.keys(permsObj).filter((k) => permsObj[k]);

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="font-bold text-slate-900">{u.full_name || u.name}</div>
                        <div className="text-xs text-slate-700 font-medium">{u.email}</div>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${
                          u.role === 'owner'
                            ? 'bg-amber-100/80 text-amber-900 border-amber-300'
                            : u.role === 'admin'
                            ? 'bg-purple-100/80 text-purple-900 border-purple-300'
                            : u.role === 'trainer'
                            ? 'bg-blue-100/80 text-blue-900 border-blue-300'
                            : 'bg-emerald-100/80 text-emerald-900 border-emerald-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        {u.role === 'owner' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                            Full Unrestricted Access
                          </span>
                        ) : activePermKeys.length === 0 ? (
                          <span className="text-xs text-slate-500 italic">No permissions granted</span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {activePermKeys.slice(0, 3).map((k) => {
                              const def = PERMISSION_DEFINITIONS.find((p) => p.key === k);
                              return (
                                <span key={k} className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                  {def ? def.label : k}
                                </span>
                              );
                            })}
                            {activePermKeys.length > 3 && (
                              <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                                +{activePermKeys.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-xs text-slate-800 font-semibold">{u.phone || '--'}</td>
                      <td className="py-3.5 px-6">
                        <Badge variant={u.is_active ? 'active' : 'default'} size="sm">
                          {u.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditUser(u)}
                            className="p-1.5 rounded-lg text-slate-700 hover:text-brand-600 hover:bg-brand-50 border border-slate-200 transition-colors cursor-pointer"
                            title="Edit Permissions & Role"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {u.role !== 'owner' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteStaffUser(u)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                              title="Delete Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: SaaS Subscription */}
      {activeTab === 'billing' && billingStatus && (
        <div className="space-y-6 max-w-4xl">
          {/* Current Tier Overview Banner */}
          <div className="bg-gradient-to-tr from-slate-900 to-brand-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-400">Your Current SaaS Plan</span>
              <h3 className="text-2xl font-black text-white mt-1 capitalize">
                {billingStatus.tier_name}
              </h3>
              <p className="text-xs text-slate-300 mt-2">
                Status: <strong className="text-emerald-400 uppercase">{billingStatus.subscription_status}</strong>
              </p>

              {/* Progress bar */}
              <div className="mt-4 max-w-xs">
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Member Quota:</span>
                  <span className="font-bold">{billingStatus.member_count} / {billingStatus.max_members}</span>
                </div>
                <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      billingStatus.usage_percentage > 90 ? 'bg-rose-500' : 'bg-brand-400'
                    }`}
                    style={{ width: `${Math.min(billingStatus.usage_percentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white/10 border border-white/15 p-4 rounded-2xl text-xs space-y-2 max-w-xs">
              <div className="font-bold text-white uppercase tracking-wider">Plan Features:</div>
              {billingStatus.features?.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Tier Upgrade Alert */}
          {billingStatus.tier_upgrade_status === 'pending' && (
            <div className="bg-amber-50 border-2 border-amber-300 p-5 rounded-2xl flex items-start gap-3 shadow-xs">
              <Clock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0 animate-pulse" />
              <div>
                <h4 className="text-sm font-extrabold text-amber-950">
                  Tier Upgrade Request Submitted (Payment Verification Pending)
                </h4>
                <p className="text-xs text-amber-800 mt-1">
                  You have requested to upgrade your facility plan to <strong className="font-black uppercase">{billingStatus.requested_plan_tier} TIER</strong>.
                  Please complete offline/UPI payment with the Platform Administrator. Once confirmed, your new member quotas and features will be unlocked immediately.
                </p>
              </div>
            </div>
          )}

          {/* Tier Switcher / Request Flow */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Upgrade Facility Subscription Tier</h3>
            <p className="text-xs text-slate-500 mb-6">
              Select your target tier below to submit an upgrade request. Upgrades require Super Admin payment confirmation before activation.
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border border-slate-200 text-center flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">Starter Tier</h4>
                  <div className="text-2xl font-black text-slate-900 my-2">₹999/mo</div>
                  <p className="text-xs text-slate-500">Up to 50 members</p>
                </div>
                <Button
                  onClick={() => handleUpgradeTier('starter')}
                  disabled={billingStatus.plan_tier === 'free' || billingStatus.plan_tier === 'starter' || isUpgrading}
                  variant="secondary"
                  size="sm"
                  className="mt-4 w-full"
                >
                  {billingStatus.plan_tier === 'free' || billingStatus.plan_tier === 'starter' ? 'Current Plan' : 'Switch to Starter'}
                </Button>
              </div>

              <div className="p-4 rounded-2xl border-2 border-brand-500 bg-brand-50/20 text-center flex flex-col justify-between shadow-sm">
                <div>
                  <h4 className="font-bold text-slate-900">Pro Growth</h4>
                  <div className="text-2xl font-black text-brand-600 my-2">₹2,499/mo</div>
                  <p className="text-xs text-slate-500">Up to 250 members + AI Copilot</p>
                </div>
                <Button
                  onClick={() => handleUpgradeTier('pro')}
                  disabled={
                    billingStatus.plan_tier === 'pro' ||
                    (billingStatus.tier_upgrade_status === 'pending' && billingStatus.requested_plan_tier === 'pro') ||
                    isUpgrading
                  }
                  variant="primary"
                  size="sm"
                  className="mt-4 w-full"
                >
                  {billingStatus.plan_tier === 'pro'
                    ? 'Current Plan'
                    : (billingStatus.tier_upgrade_status === 'pending' && billingStatus.requested_plan_tier === 'pro')
                    ? 'Payment Pending Verification'
                    : 'Request Upgrade to Pro'}
                </Button>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 text-center flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">Business Enterprise</h4>
                  <div className="text-2xl font-black text-slate-900 my-2">₹5,999/mo</div>
                  <p className="text-xs text-slate-500">Unlimited members & staff</p>
                </div>
                <Button
                  onClick={() => handleUpgradeTier('business')}
                  disabled={
                    billingStatus.plan_tier === 'business' ||
                    (billingStatus.tier_upgrade_status === 'pending' && billingStatus.requested_plan_tier === 'business') ||
                    isUpgrading
                  }
                  variant="secondary"
                  size="sm"
                  className="mt-4 w-full"
                >
                  {billingStatus.plan_tier === 'business'
                    ? 'Current Plan'
                    : (billingStatus.tier_upgrade_status === 'pending' && billingStatus.requested_plan_tier === 'business')
                    ? 'Payment Pending Verification'
                    : 'Request Upgrade to Business'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff User Modal */}
      <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        title="Invite Staff Member & Grant Permissions"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={userForm.full_name}
                onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3.5 py-2.5 text-sm font-medium text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                Staff Work Email *
              </label>
              <input
                type="email"
                required
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                placeholder="e.g. rahul@yourgym.com"
                className="w-full px-3.5 py-2.5 text-sm font-medium text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                Designated Role
              </label>
              <select
                value={userForm.role}
                onChange={(e) => {
                  const newRole = e.target.value;
                  const preset = newRole === 'trainer' ? ROLE_PRESETS.trainer : newRole === 'admin' ? ROLE_PRESETS.manager : ROLE_PRESETS.front_desk;
                  setUserForm({ ...userForm, role: newRole, permissions: { ...preset.permissions } });
                }}
                className="w-full px-3.5 py-2.5 text-sm font-medium text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white capitalize"
              >
                <option value="staff">Staff (Front Desk)</option>
                <option value="trainer">Fitness Trainer / Coach</option>
                <option value="admin">Manager / Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={userForm.phone}
                onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                placeholder="e.g. +91 98111 22233"
                className="w-full px-3.5 py-2.5 text-sm font-medium text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
              Initial Login Password *
            </label>
            <input
              type="password"
              required
              value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              placeholder="e.g. Pass123! (at least 6 characters)"
              className="w-full px-3.5 py-2.5 text-sm font-medium text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
          </div>

          {/* Granular Permissions Section */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  Allowed App Access & Permissions
                </label>
                <p className="text-[11px] text-slate-600 font-medium">
                  Select which operations this staff user is authorized to perform.
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setUserForm({ ...userForm, permissions: { ...ROLE_PRESETS.front_desk.permissions } })}
                  className="px-2 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors"
                >
                  Front Desk
                </button>
                <button
                  type="button"
                  onClick={() => setUserForm({ ...userForm, permissions: { ...ROLE_PRESETS.trainer.permissions } })}
                  className="px-2 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors"
                >
                  Trainer
                </button>
                <button
                  type="button"
                  onClick={() => setUserForm({ ...userForm, permissions: { ...ROLE_PRESETS.manager.permissions } })}
                  className="px-2 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors"
                >
                  Manager
                </button>
                <button
                  type="button"
                  onClick={() => setUserForm({ ...userForm, permissions: { ...ROLE_PRESETS.full_access.permissions } })}
                  className="px-2 py-1 text-[11px] font-bold rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-800 border border-brand-300 transition-colors"
                >
                  All Access
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto p-1 bg-slate-50/60 rounded-2xl border border-slate-200">
              {PERMISSION_DEFINITIONS.map((perm) => {
                const isChecked = !!userForm.permissions?.[perm.key];
                return (
                  <label
                    key={perm.key}
                    className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-white border-brand-500 shadow-xs'
                        : 'bg-white/60 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        setUserForm({
                          ...userForm,
                          permissions: {
                            ...(userForm.permissions || {}),
                            [perm.key]: e.target.checked
                          }
                        });
                      }}
                      className="mt-0.5 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
                    />
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{perm.label}</span>
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {perm.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                        {perm.description}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddUserModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
            >
              Create Account & Assign Permissions
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Staff User Permissions Modal */}
      <Modal
        isOpen={isEditUserModalOpen}
        onClose={() => {
          setIsEditUserModalOpen(false);
          setEditingUser(null);
        }}
        title={`Edit Permissions: ${editingUser?.full_name || editingUser?.name}`}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveUserPermissions} className="space-y-4">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-extrabold uppercase text-slate-500">Managing Access For</div>
              <div className="text-sm font-black text-slate-900">{editingUser?.full_name || editingUser?.name}</div>
              <div className="text-xs text-slate-700 font-medium">{editingUser?.email}</div>
            </div>
            <div className="w-48">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                Role
              </label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-bold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white capitalize"
              >
                <option value="staff">Staff (Front Desk)</option>
                <option value="trainer">Fitness Trainer</option>
                <option value="admin">Manager / Admin</option>
              </select>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
              Quick Role Presets:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setEditPermissions({ ...ROLE_PRESETS.front_desk.permissions })}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors"
              >
                Front Desk
              </button>
              <button
                type="button"
                onClick={() => setEditPermissions({ ...ROLE_PRESETS.trainer.permissions })}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors"
              >
                Trainer
              </button>
              <button
                type="button"
                onClick={() => setEditPermissions({ ...ROLE_PRESETS.manager.permissions })}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors"
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() => setEditPermissions({ ...ROLE_PRESETS.full_access.permissions })}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-800 border border-brand-300 transition-colors"
              >
                Full Access
              </button>
            </div>
          </div>

          {/* Granular Permission Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto p-1 bg-slate-50/60 rounded-2xl border border-slate-200">
            {PERMISSION_DEFINITIONS.map((perm) => {
              const isChecked = !!editPermissions?.[perm.key];
              return (
                <label
                  key={perm.key}
                  className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-white border-brand-500 shadow-xs'
                      : 'bg-white/60 border-slate-200 hover:bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      setEditPermissions({
                        ...editPermissions,
                        [perm.key]: e.target.checked
                      });
                    }}
                    className="mt-0.5 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
                  />
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{perm.label}</span>
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {perm.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                      {perm.description}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsEditUserModalOpen(false);
                setEditingUser(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
            >
              Update Permissions
            </Button>
          </div>
        </form>
      </Modal>

      {/* AppSec Security Confirmation Modal for Gym Decommission */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletePassword('');
          setDeleteConfirmName('');
        }}
        title="Security Confirmation: Decommission Gym"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleDeleteGym} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs leading-relaxed">
            <div className="font-bold mb-1 flex items-center gap-1.5 text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Permanent Facility & Website Decommission
            </div>
            This will permanently erase all members, attendance, billing, and the dedicated public website 
            <strong> /facility/{gym?.website_subdomain || gym?.slug}</strong>.
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              To confirm, type your gym name: <span className="text-rose-600 font-extrabold select-all">{gym?.name}</span>
            </label>
            <input
              type="text"
              required
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              placeholder={`Type "${gym?.name}"`}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Enter Owner Password *
            </label>
            <input
              type="password"
              required
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Confirm your password"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeletePassword('');
                setDeleteConfirmName('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              isLoading={isDeleting}
              disabled={deleteConfirmName.trim().toLowerCase() !== (gym?.name || '').trim().toLowerCase() || !deletePassword}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Permanently Delete
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
