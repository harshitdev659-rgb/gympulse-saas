import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Phone,
  Mail,
  Award,
  DollarSign,
  Users,
  Edit,
  Eye,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const TrainersPage = ({ onSelectMember }) => {
  const { gym } = useAuth();
  const toast = useToast();
  const [trainers, setTrainers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add trainer modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const initialTrainerForm = {
    name: '',
    email: '',
    phone: '',
    specialty: '',
    bio: '',
    hourly_rate: 50.0,
    is_active: true,
    create_user_account: false,
    password: ''
  };
  const [trainerForm, setTrainerForm] = useState(initialTrainerForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Assigned members modal
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [assignedMembers, setAssignedMembers] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);

  const fetchTrainers = async () => {
    try {
      setIsLoading(true);
      const data = await api.getTrainers();
      setTrainers(data);
    } catch (err) {
      toast.error('Failed to load trainers.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, []);

  const handleCreateTrainer = async (e) => {
    e.preventDefault();
    if (!trainerForm.name || !trainerForm.phone) {
      toast.error('Please enter trainer name and phone.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.createTrainer({
        ...trainerForm,
        hourly_rate: Number(trainerForm.hourly_rate)
      });
      toast.success(`Trainer ${trainerForm.name} added successfully!`);
      setIsAddModalOpen(false);
      setTrainerForm(initialTrainerForm);
      fetchTrainers();
    } catch (err) {
      toast.error(err.message || 'Failed to add trainer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewRoster = async (trainer) => {
    setSelectedTrainer(trainer);
    setIsRosterModalOpen(true);
    setIsLoadingMembers(true);
    try {
      const data = await api.getTrainerMembers(trainer.id);
      setAssignedMembers(data);
    } catch (err) {
      toast.error('Failed to load assigned members.');
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const currency = gym?.currency || 'USD';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Trainers & Coaches</h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage fitness trainers, client rosters, specialties, and session rates.
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          variant="primary"
          size="sm"
          icon={Plus}
        >
          Add Trainer
        </Button>
      </div>

      {/* Trainers Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <RefreshCw className="w-8 h-8 text-brand-600 animate-spin" />
        </div>
      ) : trainers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
          <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Trainers Registered Yet</h3>
          <p className="text-xs text-slate-500 mt-1">Add trainers to assign them athletes and track client progress.</p>
          <Button onClick={() => setIsAddModalOpen(true)} size="sm" className="mt-4">
            Add First Trainer
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainers.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-black text-base shadow-md shadow-brand-500/20">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{t.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-brand-600 font-semibold mt-0.5">
                        <Award className="w-3.5 h-3.5" />
                        <span>{t.specialty || 'General Fitness'}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={t.is_active ? 'active' : 'default'} size="sm">
                    {t.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <p className="text-xs text-slate-500 mt-4 leading-relaxed min-h-[36px]">
                  {t.bio || 'Dedicated trainer helping members achieve their personal fitness milestones.'}
                </p>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.phone}</span>
                  </div>
                  {t.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{t.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Rate</span>
                  <div className="text-sm font-bold text-slate-900">{currency} {t.hourly_rate}/hr</div>
                </div>

                <button
                  onClick={() => handleViewRoster(t)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-brand-50 hover:text-brand-600 text-xs font-bold text-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{t.assigned_members_count} Clients</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Trainer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Fitness Trainer"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateTrainer} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={trainerForm.name}
              onChange={(e) => setTrainerForm({ ...trainerForm, name: e.target.value })}
              placeholder="e.g. Marcus Stone"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={trainerForm.phone}
                onChange={(e) => setTrainerForm({ ...trainerForm, phone: e.target.value })}
                placeholder="+1 555-0199"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Email
              </label>
              <input
                type="email"
                value={trainerForm.email}
                onChange={(e) => setTrainerForm({ ...trainerForm, email: e.target.value })}
                placeholder="marcus@gym.com"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Specialty
              </label>
              <input
                type="text"
                value={trainerForm.specialty}
                onChange={(e) => setTrainerForm({ ...trainerForm, specialty: e.target.value })}
                placeholder="e.g. Strength & Conditioning"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Hourly Session Rate ({currency})
              </label>
              <input
                type="number"
                step="5"
                value={trainerForm.hourly_rate}
                onChange={(e) => setTrainerForm({ ...trainerForm, hourly_rate: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Bio / Certifications
            </label>
            <textarea
              rows={2}
              value={trainerForm.bio}
              onChange={(e) => setTrainerForm({ ...trainerForm, bio: e.target.value })}
              placeholder="Background, certifications, coaching style..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
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
              Save Trainer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assigned Roster Modal */}
      <Modal
        isOpen={isRosterModalOpen}
        onClose={() => setIsRosterModalOpen(false)}
        title={`Assigned Athletes - ${selectedTrainer?.name}`}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          {isLoadingMembers ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-brand-600 mb-2" />
              Loading athlete roster...
            </div>
          ) : assignedMembers.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs">No members currently assigned to {selectedTrainer?.name}.</p>
              <p className="text-[11px] text-slate-400 mt-1">Assign members via the Members page.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {assignedMembers.map((m) => (
                <div
                  key={m.id}
                  onClick={() => {
                    setIsRosterModalOpen(false);
                    onSelectMember(m.id);
                  }}
                  className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">
                      {m.first_name[0]}{m.last_name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                        {m.full_name}
                      </div>
                      <div className="text-xs text-slate-400">{m.phone}</div>
                    </div>
                  </div>
                  <Badge variant={m.status === 'active' ? 'active' : 'default'} size="sm">
                    {m.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
