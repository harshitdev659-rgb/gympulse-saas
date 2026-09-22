import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Calendar,
  Clock,
  DollarSign,
  Layers,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { formatCurrency } from '../utils/currency';

export const PlansPage = () => {
  const { gym } = useAuth();
  const toast = useToast();
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const initialPlanForm = {
    name: '',
    description: '',
    duration_days: 30,
    price: 1999,
    billing_period: 'monthly',
    is_active: true
  };
  const [planForm, setPlanForm] = useState(initialPlanForm);

  // Edit modal
  const [editingPlan, setEditingPlan] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Delete dialog
  const [deletingPlan, setDeletingPlan] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      const data = await api.getPlans();
      setPlans(data);
    } catch (err) {
      toast.error('Failed to load membership plans.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (!planForm.name || !planForm.duration_days || planForm.price === '') {
      toast.error('Please enter name, duration, and price.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.createPlan({
        ...planForm,
        duration_days: Number(planForm.duration_days),
        price: Number(planForm.price)
      });
      toast.success('Membership plan created successfully!');
      setIsAddModalOpen(false);
      setPlanForm(initialPlanForm);
      fetchPlans();
    } catch (err) {
      toast.error(err.message || 'Failed to create plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePlan = async (e) => {
    e.preventDefault();
    if (!editingPlan) return;
    setIsSubmitting(true);
    try {
      await api.updatePlan(editingPlan.id, {
        name: editingPlan.name,
        description: editingPlan.description,
        duration_days: Number(editingPlan.duration_days),
        price: Number(editingPlan.price),
        billing_period: editingPlan.billing_period,
        is_active: editingPlan.is_active
      });
      toast.success('Plan updated successfully.');
      setIsEditModalOpen(false);
      setEditingPlan(null);
      fetchPlans();
    } catch (err) {
      toast.error(err.message || 'Failed to update plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!deletingPlan) return;
    setIsSubmitting(true);
    try {
      await api.deletePlan(deletingPlan.id);
      toast.success('Plan removed or deactivated.');
      setIsDeleteDialogOpen(false);
      setDeletingPlan(null);
      fetchPlans();
    } catch (err) {
      toast.error(err.message || 'Failed to delete plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currency = gym?.currency || 'INR';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Membership Plans</h2>
          <p className="text-xs text-slate-500 mt-1">
            Create and customize subscription plans, duration, and pricing for your gym.
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          variant="primary"
          size="sm"
          icon={Plus}
        >
          Create New Plan
        </Button>
      </div>

      {/* Plans Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <RefreshCw className="w-8 h-8 text-brand-600 animate-spin" />
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Membership Plans Created Yet</h3>
          <p className="text-xs text-slate-500 mt-1">Create your first monthly, quarterly, or custom plan.</p>
          <Button onClick={() => setIsAddModalOpen(true)} size="sm" className="mt-4">
            Add First Plan
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-3xl p-6 border transition-all flex flex-col justify-between shadow-xs hover:shadow-md ${
                plan.is_active ? 'border-slate-200/80 hover:border-brand-400' : 'border-slate-200 opacity-60 bg-slate-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-brand-50 text-brand-700 border border-brand-200/60">
                    {plan.billing_period}
                  </span>
                  <Badge variant={plan.is_active ? 'active' : 'default'} size="sm">
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                <p className="text-xs text-slate-500 mt-2 min-h-[36px] leading-relaxed">
                  {plan.description || 'General gym access and equipment usage.'}
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">{formatCurrency(plan.price, currency)}</span>
                  <span className="text-xs text-slate-500"> / {plan.duration_days} days</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Duration: {plan.duration_days}d</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingPlan(plan);
                      setIsEditModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit Plan"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setDeletingPlan(plan);
                      setIsDeleteDialogOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete / Deactivate Plan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Plan Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create Membership Plan"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreatePlan} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Plan Name *
            </label>
            <input
              type="text"
              required
              value={planForm.name}
              onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
              placeholder="e.g. 3-Month Power Pass"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={planForm.description}
              onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
              placeholder="What does this membership include?"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Duration (Days) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={planForm.duration_days}
                onChange={(e) => setPlanForm({ ...planForm, duration_days: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Price ({currency}) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                min="0"
                value={planForm.price}
                onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Billing Period
            </label>
            <select
              value={planForm.billing_period}
              onChange={(e) => setPlanForm({ ...planForm, billing_period: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly (3 Months)</option>
              <option value="half_yearly">Half-Yearly (6 Months)</option>
              <option value="yearly">Yearly (Annual)</option>
              <option value="custom">Custom Duration</option>
            </select>
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
              Save Plan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Plan Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Membership Plan"
        maxWidth="max-w-lg"
      >
        {editingPlan && (
          <form onSubmit={handleUpdatePlan} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Plan Name
              </label>
              <input
                type="text"
                required
                value={editingPlan.name}
                onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={editingPlan.description || ''}
                onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Duration (Days)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={editingPlan.duration_days}
                  onChange={(e) => setEditingPlan({ ...editingPlan, duration_days: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Price ({currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0"
                  value={editingPlan.price}
                  onChange={(e) => setEditingPlan({ ...editingPlan, price: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <label className="text-xs font-bold text-slate-700">Plan Status</label>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingPlan.is_active}
                  onChange={(e) => setEditingPlan({ ...editingPlan, is_active: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ml-2 text-xs font-bold text-slate-700">
                  {editingPlan.is_active ? 'Active' : 'Inactive'}
                </span>
              </label>
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
                Update Plan
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeletePlan}
        title="Delete Plan"
        message={`Are you sure you want to remove ${deletingPlan?.name}? If members are currently subscribed to this plan, it will be safely deactivated instead.`}
        confirmText="Remove Plan"
        isDanger={true}
        isLoading={isSubmitting}
      />
    </div>
  );
};
