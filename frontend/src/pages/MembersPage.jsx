import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Download,
  MoreHorizontal,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit,
  Eye,
  CreditCard,
  RefreshCw,
  FileText,
  Sparkles,
  PlusCircle,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { formatCurrency } from '../utils/currency';

export const MembersPage = ({ onSelectMember, isAddModalOpen, setIsAddModalOpen }) => {
  const { gym } = useAuth();
  const toast = useToast();
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expiringSoonFilter, setExpiringSoonFilter] = useState(false);

  // Edit modal
  const [editingMember, setEditingMember] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Delete dialog
  const [deletingMember, setDeletingMember] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Manual Membership Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const initialManualForm = {
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    manual_plan_name: 'Monthly Standard',
    manual_duration_days: 30,
    manual_price: 1500,
    manual_payment_method: 'upi',
    assigned_trainer_id: ''
  };
  const [manualForm, setManualForm] = useState(initialManualForm);
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);
  const [isSeedingLoading, setIsSeedingLoading] = useState(false);

  // Add Member Form
  const initialAddForm = {
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    gender: 'Male',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    assigned_trainer_id: '',
    initial_plan_id: '',
  };
  const [addForm, setAddForm] = useState(initialAddForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const data = await api.getMembers({
        search: searchTerm,
        status_filter: statusFilter,
        expiring_soon: expiringSoonFilter
      });
      setMembers(data);
    } catch (err) {
      toast.error('Failed to load members.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [tData, pData] = await Promise.all([api.getTrainers(), api.getPlans()]);
      setTrainers(tData);
      setPlans(pData);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchMembers();
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm, statusFilter, expiringSoonFilter]);

  const handleCreateMember = async (e) => {
    e.preventDefault();
    if (!addForm.first_name || !addForm.last_name || !addForm.phone) {
      toast.error('Please enter name and phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...addForm,
        assigned_trainer_id: addForm.assigned_trainer_id ? Number(addForm.assigned_trainer_id) : null,
        initial_plan_id: addForm.initial_plan_id ? Number(addForm.initial_plan_id) : null,
        date_of_birth: addForm.date_of_birth || null,
      };
      await api.createMember(payload);
      toast.success(`${addForm.first_name} ${addForm.last_name} added successfully!`);
      setIsAddModalOpen(false);
      setAddForm(initialAddForm);
      fetchMembers();
    } catch (err) {
      toast.error(err.message || 'Failed to create member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateManualMember = async (e) => {
    e.preventDefault();
    if (!manualForm.first_name || !manualForm.last_name || !manualForm.phone) {
      toast.error('Please enter member full name and phone number.');
      return;
    }

    setIsManualSubmitting(true);
    try {
      const payload = {
        first_name: manualForm.first_name.trim(),
        last_name: manualForm.last_name.trim(),
        phone: manualForm.phone.trim(),
        email: manualForm.email ? manualForm.email.trim() : null,
        manual_plan_name: (manualForm.manual_plan_name || 'Standard Pass').trim(),
        manual_duration_days: Number(manualForm.manual_duration_days) || 30,
        manual_price: Number(manualForm.manual_price) || 0,
        manual_payment_method: manualForm.manual_payment_method || 'upi',
        assigned_trainer_id: manualForm.assigned_trainer_id ? Number(manualForm.assigned_trainer_id) : null,
        status: 'active'
      };
      await api.createMember(payload);
      toast.success(`Member "${manualForm.first_name} ${manualForm.last_name}" enrolled with manual membership!`);
      setIsManualModalOpen(false);
      setManualForm(initialManualForm);
      fetchMembers();
    } catch (err) {
      toast.error(err.message || 'Failed to enroll member.');
    } finally {
      setIsManualSubmitting(false);
    }
  };

  const handleLoadSampleMembers = async () => {
    setIsSeedingLoading(true);
    try {
      const res = await api.seedTestMembers();
      toast.success('5 sample members loaded for testing your facility!');
      fetchMembers();
    } catch (err) {
      toast.error(err.message || 'Failed to load test members.');
    } finally {
      setIsSeedingLoading(false);
    }
  };

  const handleUpdateMember = async (e) => {
    e.preventDefault();
    if (!editingMember) return;
    setIsSubmitting(true);
    try {
      await api.updateMember(editingMember.id, {
        first_name: editingMember.first_name,
        last_name: editingMember.last_name,
        phone: editingMember.phone,
        email: editingMember.email,
        status: editingMember.status,
        emergency_contact_name: editingMember.emergency_contact_name,
        emergency_contact_phone: editingMember.emergency_contact_phone,
        address: editingMember.address,
        assigned_trainer_id: editingMember.assigned_trainer_id ? Number(editingMember.assigned_trainer_id) : null
      });
      toast.success('Member updated successfully.');
      setIsEditModalOpen(false);
      setEditingMember(null);
      fetchMembers();
    } catch (err) {
      toast.error(err.message || 'Failed to update member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!deletingMember) return;
    setIsSubmitting(true);
    try {
      await api.deleteMember(deletingMember.id);
      toast.success('Member deleted successfully.');
      setIsDeleteDialogOpen(false);
      setDeletingMember(null);
      fetchMembers();
    } catch (err) {
      toast.error(err.message || 'Failed to delete member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCsv = () => {
    const url = api.exportMembersCsvUrl(statusFilter);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Members Directory</h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage memberships, athlete profiles, emergency contacts, and trainer assignments.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            onClick={handleExportCsv}
            variant="secondary"
            size="sm"
            icon={Download}
          >
            Export CSV
          </Button>

          <Button
            onClick={() => setIsManualModalOpen(true)}
            variant="primary"
            size="sm"
            icon={FileText}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md font-bold"
          >
            Manual Membership
          </Button>

          <Button
            onClick={() => setIsAddModalOpen(true)}
            variant="secondary"
            size="sm"
            icon={UserPlus}
          >
            Add Member
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, phone, or email..."
            className="block w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Status Dropdown & Expiring Toggle */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="frozen">Frozen</option>
          </select>

          <button
            onClick={() => setExpiringSoonFilter(!expiringSoonFilter)}
            className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 ${
              expiringSoonFilter
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Expiring in 7 Days
          </button>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-300 text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
                <th className="py-3.5 px-6">Member</th>
                <th className="py-3.5 px-6">Contact</th>
                <th className="py-3.5 px-6">Current Plan</th>
                <th className="py-3.5 px-6">Expiry Date</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-brand-600" />
                      <span>Loading members...</span>
                    </div>
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center">
                    <div className="max-w-md mx-auto p-6 bg-slate-50/80 border border-slate-200/80 rounded-3xl space-y-4">
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-600 flex items-center justify-center shadow-xs">
                        <Users className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-slate-900">
                          {gym?.name ? `Welcome to ${gym.name}` : 'Welcome to Your Facility'}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          Your member roster is currently fresh and empty. Add members manually with custom plans or load sample profiles to test operations.
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsManualModalOpen(true)}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Manual Membership &amp; Name</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddModalOpen(true)}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-300 shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Standard Form</span>
                        </button>
                      </div>
                      <div className="pt-2 border-t border-slate-200/60 text-center">
                        <button
                          type="button"
                          onClick={handleLoadSampleMembers}
                          disabled={isSeedingLoading}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{isSeedingLoading ? 'Populating test profiles...' : 'Load 5 sample members for evaluation'}</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                members.map((member) => {
                  let statusVariant = 'default';
                  if (member.status === 'active') statusVariant = 'active';
                  else if (member.status === 'expired') statusVariant = 'expired';
                  else if (member.status === 'frozen') statusVariant = 'warning';

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                      onClick={() => onSelectMember(member.id)}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-100 to-indigo-100 text-brand-700 flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
                            {member.first_name[0]}{member.last_name[0]}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                              {member.full_name}
                            </div>
                            <div className="text-xs text-slate-600 font-semibold">
                              Joined {member.join_date}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="text-xs text-slate-900 font-semibold">{member.phone}</div>
                        {member.email && (
                          <div className="text-[11px] text-slate-600 font-medium truncate max-w-[180px]">{member.email}</div>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <span className="font-bold text-xs text-slate-900">
                          {member.current_plan_name || 'No active plan'}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        {member.membership_expiry_date ? (
                          <div className="flex items-center gap-1.5 text-xs">
                            {member.is_expiring_soon && (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                            )}
                            <span className={member.is_expiring_soon ? 'text-amber-700 font-extrabold' : 'text-slate-800 font-bold'}>
                              {member.membership_expiry_date}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-semibold text-xs">--</span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <Badge variant={statusVariant}>{member.status}</Badge>
                      </td>

                      <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onSelectMember(member.id)}
                            className="p-1.5 text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingMember(member);
                              setIsEditModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingMember(member);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Member"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateMember} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={addForm.first_name}
                onChange={(e) => setAddForm({ ...addForm, first_name: e.target.value })}
                placeholder="e.g. John"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={addForm.last_name}
                onChange={(e) => setAddForm({ ...addForm, last_name: e.target.value })}
                placeholder="e.g. Doe"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={addForm.phone}
                onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                placeholder="+1 555-0123"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                placeholder="john.doe@example.com"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={addForm.date_of_birth}
                onChange={(e) => setAddForm({ ...addForm, date_of_birth: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Gender
              </label>
              <select
                value={addForm.gender}
                onChange={(e) => setAddForm({ ...addForm, gender: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Assigned Trainer
              </label>
              <select
                value={addForm.assigned_trainer_id}
                onChange={(e) => setAddForm({ ...addForm, assigned_trainer_id: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="">None / General</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.specialty})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Initial Plan Assignment */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Initial Membership Plan (Optional)
            </label>
            <select
              value={addForm.initial_plan_id}
              onChange={(e) => setAddForm({ ...addForm, initial_plan_id: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="">No Plan (Assign Later)</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - {formatCurrency(p.price, gym?.currency || 'INR')} ({p.duration_days} days)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Emergency Contact Name
              </label>
              <input
                type="text"
                value={addForm.emergency_contact_name}
                onChange={(e) => setAddForm({ ...addForm, emergency_contact_name: e.target.value })}
                placeholder="Name of contact"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Emergency Contact Phone
              </label>
              <input
                type="tel"
                value={addForm.emergency_contact_phone}
                onChange={(e) => setAddForm({ ...addForm, emergency_contact_phone: e.target.value })}
                placeholder="+1 555-9999"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Save Member
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Member Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit ${editingMember?.full_name}`}
        maxWidth="max-w-xl"
      >
        {editingMember && (
          <form onSubmit={handleUpdateMember} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={editingMember.first_name}
                  onChange={(e) => setEditingMember({ ...editingMember, first_name: e.target.value })}
                  placeholder="e.g. John"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={editingMember.last_name}
                  onChange={(e) => setEditingMember({ ...editingMember, last_name: e.target.value })}
                  placeholder="e.g. Doe"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={editingMember.phone}
                  onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                  Status
                </label>
                <select
                  value={editingMember.status}
                  onChange={(e) => setEditingMember({ ...editingMember, status: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white capitalize"
                >
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="frozen">Frozen</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Assigned Trainer
              </label>
              <select
                value={editingMember.assigned_trainer_id || ''}
                onChange={(e) => setEditingMember({ ...editingMember, assigned_trainer_id: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="">None / General</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.specialty})</option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
              >
                Update Member
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteMember}
        title="Delete Member"
        message={`Are you sure you want to permanently delete ${deletingMember?.full_name}? All associated attendance logs and membership records will also be removed.`}
        confirmText="Delete Member"
        isDanger={true}
        isLoading={isSubmitting}
      />

      {/* Manual Membership & Name Modal */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Manual Membership & Name"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateManualMember} className="space-y-4">
          <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-950">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Quick Manual Entry:</strong> Type athlete name and specify any custom plan duration, fee, and payment method directly.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={manualForm.first_name}
                onChange={(e) => setManualForm({ ...manualForm, first_name: e.target.value })}
                placeholder="e.g. Ramesh"
                className="w-full px-3.5 py-2.5 text-sm font-semibold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={manualForm.last_name}
                onChange={(e) => setManualForm({ ...manualForm, last_name: e.target.value })}
                placeholder="e.g. Kumar"
                className="w-full px-3.5 py-2.5 text-sm font-semibold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={manualForm.phone}
                onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                placeholder="+91 98765 00000"
                className="w-full px-3.5 py-2.5 text-sm font-semibold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={manualForm.email}
                onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                placeholder="optional@example.com"
                className="w-full px-3.5 py-2.5 text-sm font-semibold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>

          {/* Membership Customization Box */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Membership Plan / Custom Name *
              </label>
              <input
                type="text"
                required
                value={manualForm.manual_plan_name}
                onChange={(e) => setManualForm({ ...manualForm, manual_plan_name: e.target.value })}
                placeholder="e.g. Monthly Standard, Custom 45-Day, Annual VIP"
                className="w-full px-3.5 py-2 text-sm font-semibold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Presets:</span>
                {[
                  { name: 'Monthly Standard', days: 30, price: 1500 },
                  { name: 'Quarterly Pro', days: 90, price: 4000 },
                  { name: 'Half-Yearly Pass', days: 180, price: 7500 },
                  { name: 'Annual VIP Pass', days: 365, price: 12000 }
                ].map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setManualForm({
                      ...manualForm,
                      manual_plan_name: p.name,
                      manual_duration_days: p.days,
                      manual_price: p.price
                    })}
                    className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 text-slate-600 transition-all shadow-2xs cursor-pointer"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Duration (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={manualForm.manual_duration_days}
                  onChange={(e) => setManualForm({ ...manualForm, manual_duration_days: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm font-semibold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Amount ({gym?.currency || 'INR'})
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={manualForm.manual_price}
                  onChange={(e) => setManualForm({ ...manualForm, manual_price: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm font-semibold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={manualForm.manual_payment_method}
                  onChange={(e) => setManualForm({ ...manualForm, manual_payment_method: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm font-semibold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="upi">UPI / Online</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card / POS</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Assigned Trainer
                </label>
                <select
                  value={manualForm.assigned_trainer_id}
                  onChange={(e) => setManualForm({ ...manualForm, assigned_trainer_id: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm font-semibold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">None / General Floor</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsManualModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isManualSubmitting}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              Enroll &amp; Save Member
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
