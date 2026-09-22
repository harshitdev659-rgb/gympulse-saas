import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Sparkles, 
  ExternalLink, 
  Copy, 
  Check, 
  Save, 
  Users, 
  MessageSquare, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle2, 
  RefreshCw,
  Edit3
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const GymWebsiteManagerPage = ({ onPreviewWebsite }) => {
  const { gym } = useAuth();
  const toast = useToast();
  const [activeSubTab, setActiveSubTab] = useState('editor'); // 'editor' | 'leads'
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form state
  const [form, setForm] = useState({
    website_subdomain: '',
    website_enabled: true,
    website_headline: '',
    website_tagline: '',
    website_about: '',
    website_cover_image: '',
    website_amenities: '',
    website_custom_domain: ''
  });

  // Leads state
  const [inquiries, setInquiries] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);

  const fetchWebsiteData = async () => {
    setLoading(true);
    try {
      const data = await api.getGymWebsite();
      setForm({
        website_subdomain: data.website_subdomain || gym?.slug || '',
        website_enabled: data.website_enabled ?? true,
        website_headline: data.website_headline || `Welcome to ${gym?.name || 'Our Gym'}`,
        website_tagline: data.website_tagline || 'Elevate Your Fitness Journey With Us',
        website_about: data.website_about || `${gym?.name || 'Our facility'} offers world-class training equipment and certified coaches.`,
        website_cover_image: data.website_cover_image || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&auto=format&fit=crop&q=80',
        website_amenities: data.website_amenities || 'Olympic Free Weights, Cardio Theatre, Strength Machines, Certified Trainers, Steam & Sauna, Lockers',
        website_custom_domain: data.website_custom_domain || ''
      });
    } catch (err) {
      toast.error('Could not load website settings.');
    } finally {
      setLoading(false);
    }
  };

  const fetchInquiries = async () => {
    setLeadsLoading(true);
    try {
      const data = await api.getGymInquiries();
      setInquiries(data);
    } catch (err) {
      toast.error('Could not load website leads.');
    } finally {
      setLeadsLoading(false);
    }
  };

  useEffect(() => {
    fetchWebsiteData();
    fetchInquiries();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateGymWebsite(form);
      toast.success('Your gym website configuration has been saved and published live!');
    } catch (err) {
      toast.error(err.message || 'Failed to save website configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (inquiryId, newStatus) => {
    try {
      await api.updateGymInquiry(inquiryId, newStatus);
      toast.success(`Inquiry marked as ${newStatus}.`);
      setInquiries((prev) => 
        prev.map((inq) => inq.id === inquiryId ? { ...inq, status: newStatus } : inq)
      );
    } catch (err) {
      toast.error('Failed to update inquiry status.');
    }
  };

  const publicUrl = `/facility/${form.website_subdomain || gym?.slug}`;
  const fullPublicUrl = `https://gympulse.app${publicUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullPublicUrl);
    setCopied(true);
    toast.success('Website link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 text-brand-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Globe className="w-4 h-4 text-brand-400" /> Automated Dedicated Website Generator
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Your Dedicated Facility Website
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Customize your live public website, share your link with prospective athletes, and review online membership inquiries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-white/15"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>

          <button
            type="button"
            onClick={() => onPreviewWebsite ? onPreviewWebsite(form.website_subdomain || gym?.slug) : window.open(publicUrl, '_blank')}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-brand-500/25"
          >
            Visit Live Website <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Live URL Pill Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-slate-500">Live URL:</span>
          <span className="font-mono text-xs font-bold text-brand-700 select-all">{fullPublicUrl}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('editor')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeSubTab === 'editor'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 inline mr-1" /> Website Editor
          </button>
          <button
            onClick={() => setActiveSubTab('leads')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'leads'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5 inline" /> 
            <span>Website Inquiries</span>
            {inquiries.filter((i) => i.status === 'new').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white">
                {inquiries.filter((i) => i.status === 'new').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Subtab 1: Website Editor */}
      {activeSubTab === 'editor' && (
        <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">Branded Website Settings</h2>
            <p className="text-xs text-slate-500 mt-0.5">Edit content displayed to prospective members visiting your public website.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Website Name / Subdomain Slug *
              </label>
              <div className="flex rounded-xl shadow-xs">
                <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 text-slate-500 text-xs font-mono">
                  gympulse.app/facility/
                </span>
                <input
                  type="text"
                  required
                  value={form.website_subdomain}
                  onChange={(e) => setForm({ ...form, website_subdomain: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="e.g. apex-fitness"
                  className="flex-1 block w-full rounded-none rounded-r-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">This forms your unique public web address.</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Custom Domain (Optional)
              </label>
              <input
                type="text"
                value={form.website_custom_domain}
                onChange={(e) => setForm({ ...form, website_custom_domain: e.target.value })}
                placeholder="e.g. www.apexfitnessclub.com"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Point your custom domain CNAME to GymPulse.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Hero Headline *
              </label>
              <input
                type="text"
                required
                value={form.website_headline}
                onChange={(e) => setForm({ ...form, website_headline: e.target.value })}
                placeholder="Welcome to Apex Fitness Club"
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Hero Tagline / Subtitle *
              </label>
              <input
                type="text"
                required
                value={form.website_tagline}
                onChange={(e) => setForm({ ...form, website_tagline: e.target.value })}
                placeholder="Elevate Your Athletic Potential & Peak Health"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              About Your Facility (Story & Mission)
            </label>
            <textarea
              rows={3}
              value={form.website_about}
              onChange={(e) => setForm({ ...form, website_about: e.target.value })}
              placeholder="Tell prospective athletes about your equipment, coaches, and culture..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Amenities & Equipment Highlights (Comma Separated)
            </label>
            <input
              type="text"
              value={form.website_amenities}
              onChange={(e) => setForm({ ...form, website_amenities: e.target.value })}
              placeholder="Olympic Free Weights, Cardio Theatre, Steam & Sauna, Certified Trainers, Lockers"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Hero Cover Photo URL
            </label>
            <input
              type="url"
              value={form.website_cover_image}
              onChange={(e) => setForm({ ...form, website_cover_image: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-brand-500/25 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Publishing Changes...' : 'Save & Publish Website'}
            </button>
          </div>
        </form>
      )}

      {/* Subtab 2: Website Inquiries (Leads) */}
      {activeSubTab === 'leads' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Prospective Athlete Inquiries</h2>
              <p className="text-xs text-slate-500 mt-0.5">Leads submitted via your live gym website join form.</p>
            </div>
            <button
              onClick={fetchInquiries}
              disabled={leadsLoading}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${leadsLoading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-5">Athlete Name</th>
                  <th className="py-3 px-4">Phone / WhatsApp</th>
                  <th className="py-3 px-4">Interested Plan</th>
                  <th className="py-3 px-4">Message / Goal</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inquiries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      No prospective athlete inquiries received yet. Share your website link to start capturing leads!
                    </td>
                  </tr>
                ) : (
                  inquiries.map((inq) => (
                    <tr key={inq.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-900">
                        {inq.full_name}
                        {inq.email && <div className="text-[11px] text-slate-400 font-normal">{inq.email}</div>}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                        {inq.phone}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                          {inq.plan_name || 'General Inquiry'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                        {inq.message || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {new Date(inq.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          inq.status === 'converted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inq.status === 'contacted'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {inq.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`https://wa.me/${inq.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition-colors"
                          >
                            WhatsApp
                          </a>
                          <select
                            value={inq.status}
                            onChange={(e) => handleStatusChange(inq.id, e.target.value)}
                            className="text-[10px] py-1 px-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700"
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="converted">Converted</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
