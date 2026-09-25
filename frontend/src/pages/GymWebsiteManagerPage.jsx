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
  Edit3,
  Palette,
  Layout,
  Megaphone
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const THEME_OPTIONS = [
  {
    id: 'dark_power',
    name: 'Iron & Power',
    tag: 'Athletic / Gritty',
    description: 'Dark charcoal theme with glowing highlights. Perfect for strength, powerlifting & bodybuilding gyms.',
    previewBg: 'bg-slate-950',
    previewCard: 'bg-slate-900 border-slate-700',
    previewAccent: 'bg-emerald-500',
    textColor: 'text-slate-100',
    subColor: 'text-slate-400'
  },
  {
    id: 'clean_studio',
    name: 'Clean Studio',
    tag: 'Modern / Light',
    description: 'High-contrast light background with crisp cards. Ideal for boutique fitness, pilates, yoga, and wellness clubs.',
    previewBg: 'bg-slate-100',
    previewCard: 'bg-white border-slate-300 shadow-sm',
    previewAccent: 'bg-teal-500',
    textColor: 'text-slate-900',
    subColor: 'text-slate-600'
  },
  {
    id: 'neon_energy',
    name: 'Urban CrossFit',
    tag: 'High Voltage',
    description: 'Deep obsidian zinc with high-energy fiery gradients and bold borders. Designed for CrossFit, HIIT & bootcamps.',
    previewBg: 'bg-zinc-950',
    previewCard: 'bg-zinc-900 border-orange-500/40',
    previewAccent: 'bg-orange-500',
    textColor: 'text-orange-100',
    subColor: 'text-orange-400/80'
  },
  {
    id: 'luxury_gold',
    name: 'Luxury Elite',
    tag: 'Prestige / VIP',
    description: 'Deep obsidian with metallic gold accents and refined executive typography for high-end luxury wellness clubs.',
    previewBg: 'bg-[#0a0a0c]',
    previewCard: 'bg-[#131318] border-amber-500/40',
    previewAccent: 'bg-amber-400',
    textColor: 'text-amber-100',
    subColor: 'text-amber-400/80'
  }
];

const COLOR_PRESETS = [
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Cobalt Blue', hex: '#2563eb' },
  { name: 'Sunset Orange', hex: '#f97316' },
  { name: 'Crimson Red', hex: '#e11d48' },
  { name: 'Gold Champagne', hex: '#d97706' },
  { name: 'Electric Violet', hex: '#8b5cf6' },
  { name: 'Cyber Cyan', hex: '#06b6d4' },
  { name: 'Neon Green', hex: '#22c55e' }
];

export const GymWebsiteManagerPage = ({ onPreviewWebsite }) => {
  const { gym } = useAuth();
  const toast = useToast();
  const [activeSubTab, setActiveSubTab] = useState('editor'); // 'editor' | 'leads'
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [networkInfo, setNetworkInfo] = useState(null);

  // Form state
  const [form, setForm] = useState({
    website_subdomain: '',
    website_enabled: true,
    website_headline: '',
    website_tagline: '',
    website_about: '',
    website_cover_image: '',
    website_amenities: '',
    website_custom_domain: '',
    website_theme: 'dark_power',
    website_primary_color: '#10b981',
    website_hero_style: 'split',
    website_announcement: ''
  });

  // Leads state
  const [inquiries, setInquiries] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);

  const fetchWebsiteData = async () => {
    setLoading(true);
    try {
      const res = await api.getGymWebsite();
      const data = res || {};
      setForm({
        website_subdomain: data.website_subdomain || gym?.website_subdomain || gym?.slug || '',
        website_enabled: data.website_enabled ?? true,
        website_headline: data.website_headline || `Welcome to ${gym?.name || 'Our Gym'}`,
        website_tagline: data.website_tagline || 'Elevate Your Fitness Journey With Us',
        website_about: data.website_about || `${gym?.name || 'Our facility'} offers world-class training equipment and certified coaches.`,
        website_cover_image: data.website_cover_image || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&auto=format&fit=crop&q=80',
        website_amenities: data.website_amenities || 'Olympic Free Weights, Cardio Theatre, Strength Machines, Certified Trainers, Steam & Sauna, Lockers',
        website_custom_domain: data.website_custom_domain || '',
        website_theme: data.website_theme || gym?.website_theme || 'dark_power',
        website_primary_color: data.website_primary_color || gym?.website_primary_color || '#10b981',
        website_hero_style: data.website_hero_style || gym?.website_hero_style || 'split',
        website_announcement: data.website_announcement || gym?.website_announcement || ''
      });
    } catch (err) {
      console.debug('Could not load website settings, falling back to defaults:', err);
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
    api.getNetworkInfo().then((data) => setNetworkInfo(data)).catch(() => {});
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

  const windowOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isGitHubPages = windowOrigin.includes('github.io') || pathname.includes('/gympulse-saas');
  const baseSubpath = isGitHubPages ? '/gympulse-saas' : '';
  const currentSlug = (form.website_subdomain || gym?.slug || 'my-gym').trim();

  // Universal direct link that works reliably across all environments (GitHub Pages, localhost, mobile)
  const fullPublicUrl = `${windowOrigin}${baseSubpath}/app.html?facility=${encodeURIComponent(currentSlug)}`;

  const handleVisitWebsite = () => {
    // Always open the public website in a new browser tab.
    // This avoids React context errors caused by DownloadAppModal (which uses useAuth/useToast)
    // rendering inside the in-app preview shell. Opening a new tab is also better UX for a live website.
    window.open(fullPublicUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullPublicUrl);
    setCopied(true);
    toast.success('Direct website link copied to clipboard!');
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
            onClick={handleVisitWebsite}
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
            <p className="text-xs text-slate-500 mt-0.5">Customize your live public website's design, colors, hero layout, and content.</p>
          </div>

          {/* Visual Theme Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                  <Palette className="w-3.5 h-3.5 inline mr-1 text-brand-600" /> Facility Website Theme & Visual Identity
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select a unique aesthetic so your gym website stands out distinctly from other fitness centers.
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 border border-brand-200">
                Active: {THEME_OPTIONS.find(t => t.id === form.website_theme)?.name || 'Iron & Power'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
              {THEME_OPTIONS.map((theme) => {
                const isSelected = form.website_theme === theme.id;
                return (
                  <div
                    key={theme.id}
                    onClick={() => setForm({ ...form, website_theme: theme.id })}
                    className={`rounded-2xl p-3.5 border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-brand-600 ring-2 ring-brand-500/20 shadow-md bg-brand-50/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-xs'
                    }`}
                  >
                    <div>
                      {/* Theme Mini Card Preview */}
                      <div className={`h-20 rounded-xl ${theme.previewBg} p-2.5 flex flex-col justify-between mb-3 border border-black/10 shadow-inner relative overflow-hidden`}>
                        <div className="flex items-center justify-between">
                          <div className={`w-12 h-2 rounded-full ${theme.previewAccent} opacity-80`} />
                          <div className={`w-2 h-2 rounded-full ${theme.previewAccent}`} />
                        </div>
                        <div className={`p-1.5 rounded-lg ${theme.previewCard}`}>
                          <div className={`text-[9px] font-black ${theme.textColor} leading-tight truncate`}>
                            {theme.name}
                          </div>
                          <div className={`text-[8px] ${theme.subColor} truncate`}>
                            {theme.tag}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900">{theme.name}</span>
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {theme.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {theme.description}
                      </p>
                    </div>

                    <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className={`text-[11px] font-bold ${isSelected ? 'text-brand-700' : 'text-slate-400'}`}>
                        {isSelected ? '✓ Selected' : 'Choose Theme'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Accent Color & Hero Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-2xl bg-slate-50/80 border border-slate-200">
            {/* Primary Accent Color */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
                <Palette className="w-3.5 h-3.5 inline mr-1 text-brand-600" /> Primary Accent Color
              </label>
              <p className="text-[11px] text-slate-500 mb-2.5">
                Customizes call-to-action buttons, badges, and icons across your public website.
              </p>
              
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => setForm({ ...form, website_primary_color: color.hex })}
                    className={`w-7 h-7 rounded-full transition-transform border flex items-center justify-center ${
                      form.website_primary_color?.toLowerCase() === color.hex.toLowerCase()
                        ? 'scale-110 ring-2 ring-offset-2 ring-slate-800 border-white shadow-xs'
                        : 'border-black/10 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  >
                    {form.website_primary_color?.toLowerCase() === color.hex.toLowerCase() && (
                      <Check className="w-3.5 h-3.5 text-white" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg border border-slate-300 shrink-0 shadow-xs"
                  style={{ backgroundColor: form.website_primary_color || '#10b981' }}
                />
                <input
                  type="text"
                  value={form.website_primary_color}
                  onChange={(e) => setForm({ ...form, website_primary_color: e.target.value })}
                  placeholder="#10b981"
                  className="w-32 px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 text-slate-900 uppercase"
                />
                <span className="text-[11px] text-slate-500">Custom Hex Code</span>
              </div>
            </div>

            {/* Hero Layout Style */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
                <Layout className="w-3.5 h-3.5 inline mr-1 text-brand-600" /> Hero Layout Style
              </label>
              <p className="text-[11px] text-slate-500 mb-2.5">
                Choose how your homepage banner presents your brand to visitors.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setForm({ ...form, website_hero_style: 'split' })}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    form.website_hero_style === 'split'
                      ? 'border-brand-600 bg-white ring-2 ring-brand-500/20 shadow-xs'
                      : 'border-slate-200 bg-white/60 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900 mb-0.5">Split Hero (2-Column)</div>
                  <p className="text-[11px] text-slate-500">Headline & CTA on the left, high-res gym photo & badges on the right.</p>
                </div>

                <div
                  onClick={() => setForm({ ...form, website_hero_style: 'centered' })}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    form.website_hero_style === 'centered'
                      ? 'border-brand-600 bg-white ring-2 ring-brand-500/20 shadow-xs'
                      : 'border-slate-200 bg-white/60 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900 mb-0.5">Centered Impact</div>
                  <p className="text-[11px] text-slate-500">Centered bold headline with prominent floating membership passes.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Announcement Bar */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
              <Megaphone className="w-3.5 h-3.5 inline mr-1 text-brand-600" /> Top Announcement Alert (Optional)
            </label>
            <input
              type="text"
              value={form.website_announcement}
              onChange={(e) => setForm({ ...form, website_announcement: e.target.value })}
              placeholder="e.g. 🎉 Monsoon Flash Sale: 20% OFF on all 6 & 12 Month Memberships! Claim your pass today."
              className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Displays a vibrant alert bar at the very top of your public website for special promotions, holiday hours, or discounts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
                Website Name / Subdomain Slug *
              </label>
              <div className="flex rounded-xl shadow-xs">
                <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 text-slate-600 text-xs font-mono font-bold">
                  {windowOrigin.replace(/^https?:\/\//, '')}{baseSubpath}/app.html?facility=
                </span>
                <input
                  type="text"
                  required
                  value={form.website_subdomain}
                  onChange={(e) => setForm({ ...form, website_subdomain: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="e.g. apex-fitness"
                  className="flex-1 block w-full rounded-none rounded-r-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">This forms your unique public web address.</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
                Custom Domain (Optional)
              </label>
              <input
                type="text"
                value={form.website_custom_domain}
                onChange={(e) => setForm({ ...form, website_custom_domain: e.target.value })}
                placeholder="e.g. www.yourgymname.com"
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Point your custom domain CNAME to GymPulse.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
                Hero Headline *
              </label>
              <input
                type="text"
                required
                value={form.website_headline}
                onChange={(e) => setForm({ ...form, website_headline: e.target.value })}
                placeholder="e.g. Welcome to Apex Elite Fitness"
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
                Hero Tagline / Subtitle *
              </label>
              <input
                type="text"
                required
                value={form.website_tagline}
                onChange={(e) => setForm({ ...form, website_tagline: e.target.value })}
                placeholder="e.g. Transform Your Physique With World-Class Training"
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
              About Your Facility (Story & Mission)
            </label>
            <textarea
              rows={3}
              value={form.website_about}
              onChange={(e) => setForm({ ...form, website_about: e.target.value })}
              placeholder="Tell prospective athletes about your equipment, coaches, and culture..."
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
              Amenities & Equipment Highlights (Comma Separated)
            </label>
            <input
              type="text"
              value={form.website_amenities}
              onChange={(e) => setForm({ ...form, website_amenities: e.target.value })}
              placeholder="e.g. Olympic Free Weights, Cardio Theatre, Steam & Sauna, Certified Trainers, Lockers"
              className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
              Hero Cover Photo URL
            </label>
            <input
              type="url"
              value={form.website_cover_image}
              onChange={(e) => setForm({ ...form, website_cover_image: e.target.value })}
              placeholder="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&auto=format&fit=crop&q=80"
              className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
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
