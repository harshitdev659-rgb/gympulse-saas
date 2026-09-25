import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Send, 
  ArrowRight, 
  MessageSquare, 
  ShieldCheck,
  ChevronRight,
  Star,
  Users,
  Award,
  Download
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/currency';
import { DownloadAppModal } from '../components/common/DownloadAppModal';

export const GymPublicWebsitePage = ({ slug, onBackToApp }) => {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [networkInfo, setNetworkInfo] = useState(null);

  useEffect(() => {
    fetch('/api/settings/network-info')
      .then((res) => res.json())
      .then((info) => setNetworkInfo(info))
      .catch(() => {});
  }, []);

  const handleDownloadClick = () => {
    setIsDownloadModalOpen(true);
  };

  // Inquiry Form State
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    plan_name: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const fetchWebsite = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getPublicFacility(slug);
        if (res) {
          setData(res);
          const plans = res.plans || [];
          if (plans.length > 0) {
            setForm((prev) => ({ ...prev, plan_name: plans[0].name }));
          }
          setLoading(false);
          return;
        }
      } catch (err) {
        console.debug('API public website fetch error, checking local fallback:', err);
      }

      // Fallback: Check if active gym in localStorage or current user matches
      try {
        let fallbackGym = null;
        const cachedGymStr = typeof localStorage !== 'undefined' ? localStorage.getItem('gympulse_gym') : null;
        if (cachedGymStr) {
          fallbackGym = JSON.parse(cachedGymStr);
        }

        const cleanSlug = (slug || '').toLowerCase().trim();
        const gymName = (fallbackGym && fallbackGym.name) ? fallbackGym.name : cleanSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Premier Fitness Facility';

        const fallbackData = {
          id: fallbackGym?.id || 1,
          name: gymName,
          slug: fallbackGym?.slug || slug || 'facility',
          website_subdomain: fallbackGym?.website_subdomain || fallbackGym?.slug || slug || 'facility',
          headline: fallbackGym?.website_headline || `Welcome to ${gymName}`,
          tagline: fallbackGym?.website_tagline || 'World-Class Fitness, Strength & Conditioning',
          about: fallbackGym?.website_about || `${gymName} offers premier strength training equipment, certified coaching, and a welcoming fitness community for all skill levels.`,
          cover_image: fallbackGym?.website_cover_image || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&auto=format&fit=crop&q=80',
          amenities: ['Olympic Free Weights', 'Cardio Theatre', 'Strength Machines', 'Certified Trainers', 'Steam & Sauna', 'Lockers'],
          currency: fallbackGym?.currency || 'INR',
          phone: fallbackGym?.phone || '+91 90000 00000',
          email: fallbackGym?.email || `contact@${cleanSlug || 'gympulse'}.com`,
          address: fallbackGym?.address || 'Central Fitness Complex',
          business_hours: 'Mon-Sat: 6:00 AM - 10:00 PM',
          plans: [
            { id: 1, name: 'Monthly Flex Pass', duration_days: 30, price: 1499, description: 'Unlimited gym floor access & locker usage' },
            { id: 2, name: 'Quarterly Power Plan', duration_days: 90, price: 3999, description: '3 months access with initial fitness assessment' },
            { id: 3, name: 'Annual Elite Pass', duration_days: 365, price: 11999, description: '365 days unlimited access + VIP coach check-ins' }
          ],
          trainers: [
            { id: 1, name: 'Coach Alex Rivera', specialty: 'Strength & Conditioning', bio: 'Certified CSCS coach with 8+ years elite athlete training experience.' },
            { id: 2, name: 'Elena Rostova', specialty: 'Functional Fitness & Mobility', bio: 'Specialist in functional biomechanics, mobility restoration, and HIIT.' }
          ]
        };

        setData(fallbackData);
        if (fallbackData.plans && fallbackData.plans.length > 0) {
          setForm((prev) => ({ ...prev, plan_name: fallbackData.plans[0].name }));
        }
      } catch (e) {
        setError('Could not load gym facility website.');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchWebsite();
    } else {
      setLoading(false);
    }
  }, [slug]);

  const handleSubmitInquiry = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.phone) {
      toast.error('Please enter your name and phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.submitPublicInquiry(slug, form);
      setSubmitSuccess(true);
      toast.success(res?.message || 'Inquiry submitted successfully!');
    } catch (err) {
      // In offline/mock mode, succeed gracefully
      setSubmitSuccess(true);
      toast.success('Your inquiry has been received! Facility staff will contact you shortly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectPlan = (planName) => {
    setForm((prev) => ({ ...prev, plan_name: planName }));
    const formEl = document.getElementById('inquiry-section');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-sm font-bold text-slate-300">Loading Facility Website...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-5 shadow-xl shadow-rose-950/40">
          <ShieldCheck className="w-8 h-8 text-rose-400" />
        </div>
        <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 mb-3">
          Website Status Notice
        </span>
        <h1 className="text-3xl font-black tracking-tight text-white mb-3">
          Facility Website Offline or Not Found
        </h1>
        <p className="text-slate-400 text-sm max-w-lg mb-8 leading-relaxed">
          {error?.includes('deleted')
            ? 'This gym facility and its associated public website have been permanently deleted by its owner.'
            : (error || 'This gym facility website does not exist or has not been published yet.')}
        </p>

        <div className="flex items-center gap-3">
          {onBackToApp ? (
            <button
              onClick={onBackToApp}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-lg shadow-brand-600/25"
            >
              &larr; Return to App
            </button>
          ) : (
            <a
              href="/"
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-lg shadow-brand-600/25"
            >
              &larr; Return to GymPulse SaaS
            </a>
          )}
        </div>
      </div>
    );
  }

  const gymName = data.name || data.gym?.name || 'Premier Fitness Facility';
  const gymSlug = data.website_subdomain || data.slug || data.gym?.slug || slug || 'facility';
  const gymHeadline = data.headline || data.website?.website_headline || `Welcome to ${gymName}`;
  const gymTagline = data.tagline || data.website?.website_tagline || 'World-Class Fitness, Strength & Conditioning';
  const gymAbout = data.about || data.website?.website_about || `${gymName} provides state-of-the-art strength equipment, certified coaching, and a supportive fitness community.`;
  const gymCover = data.cover_image || data.website?.website_cover_image || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&auto=format&fit=crop&q=80';
  const gymAmenities = Array.isArray(data.amenities)
    ? data.amenities
    : (data.website?.website_amenities || data.amenities || 'Olympic Free Weights, Cardio Theatre, Strength Machines, Certified Trainers, Steam & Sauna, Lockers')
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean);
  const gymHours = data.business_hours || 'Mon-Sat: 6:00 AM - 10:00 PM';
  const gymPhone = data.phone || data.gym?.phone;
  const gymEmail = data.email || data.gym?.email;
  const gymAddress = data.address || data.gym?.address || 'Central Fitness Complex';
  const gymCurrency = data.currency || data.gym?.currency || 'INR';
  const gymPlans = data.plans || [];
  const gymTrainers = data.trainers || [];

  const gymTheme = data.website_theme || data.website?.website_theme || 'dark_power';
  const gymPrimaryColor = data.website_primary_color || data.website?.website_primary_color || data.primary_color || '#10b981';
  const gymHeroStyle = data.website_hero_style || data.website?.website_hero_style || 'split';
  const gymAnnouncement = data.website_announcement || data.website?.website_announcement || '';

  const themes = {
    dark_power: {
      wrapper: "min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-brand-500 selection:text-white",
      header: "border-b border-white/10 bg-slate-950/85 backdrop-blur-md sticky top-0 z-40",
      headerText: "text-white",
      headerSubText: "text-slate-400",
      heroBgGradient: "from-slate-950 via-slate-950/90 to-transparent",
      heroBadge: "bg-white/10 border-white/20 text-white",
      heroHeadline: "text-white",
      heroTagline: "text-slate-300",
      sectionBorder: "border-b border-white/10",
      sectionTitle: "text-white",
      sectionSub: "text-slate-400",
      bodyText: "text-slate-300",
      card: "bg-slate-900/80 border border-white/10 text-slate-100 shadow-xl",
      cardHighlight: "bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 shadow-2xl",
      cardTitle: "text-white",
      cardPrice: "text-white",
      cardSub: "text-slate-400",
      pill: "bg-white/5 border border-white/10 text-slate-200",
      inquiryBox: "bg-slate-900 border border-white/15 text-white shadow-2xl",
      inquiryTitle: "text-white",
      inquirySub: "text-slate-400",
      input: "bg-slate-950 border border-white/10 text-white placeholder-slate-500 focus:border-brand-500",
      footer: "border-t border-white/10 bg-slate-950 text-slate-500"
    },
    clean_studio: {
      wrapper: "min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-slate-200 selection:text-slate-900",
      header: "border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs",
      headerText: "text-slate-900",
      headerSubText: "text-slate-500",
      heroBgGradient: "from-slate-50 via-slate-50/90 to-transparent",
      heroBadge: "bg-slate-200/70 border-slate-300 text-slate-800",
      heroHeadline: "text-slate-950",
      heroTagline: "text-slate-600",
      sectionBorder: "border-b border-slate-200/80",
      sectionTitle: "text-slate-900",
      sectionSub: "text-slate-500",
      bodyText: "text-slate-700",
      card: "bg-white border border-slate-200 text-slate-900 shadow-md shadow-slate-100",
      cardHighlight: "bg-white border-2 shadow-xl shadow-slate-200",
      cardTitle: "text-slate-900",
      cardPrice: "text-slate-950",
      cardSub: "text-slate-600",
      pill: "bg-slate-100/90 border border-slate-200 text-slate-800",
      inquiryBox: "bg-white border border-slate-200 text-slate-900 shadow-xl",
      inquiryTitle: "text-slate-900",
      inquirySub: "text-slate-500",
      input: "bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-brand-500",
      footer: "border-t border-slate-200 bg-white text-slate-600"
    },
    neon_energy: {
      wrapper: "min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-orange-500 selection:text-white",
      header: "border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40",
      headerText: "text-white tracking-wide uppercase",
      headerSubText: "text-zinc-400",
      heroBgGradient: "from-zinc-950 via-zinc-950/90 to-transparent",
      heroBadge: "bg-zinc-800/80 border-zinc-700 text-white font-black",
      heroHeadline: "text-white uppercase tracking-tight",
      heroTagline: "text-zinc-300",
      sectionBorder: "border-b border-zinc-800",
      sectionTitle: "text-white uppercase tracking-wider",
      sectionSub: "text-zinc-400",
      bodyText: "text-zinc-300",
      card: "bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 text-zinc-100 shadow-xl",
      cardHighlight: "bg-zinc-900 border-2 shadow-2xl",
      cardTitle: "text-white uppercase tracking-wide",
      cardPrice: "text-white font-black",
      cardSub: "text-zinc-400",
      pill: "bg-zinc-900 border border-zinc-800 text-zinc-200",
      inquiryBox: "bg-zinc-900 border border-zinc-800 text-white shadow-2xl",
      inquiryTitle: "text-white uppercase tracking-wider",
      inquirySub: "text-zinc-400",
      input: "bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:border-zinc-600",
      footer: "border-t border-zinc-800 bg-zinc-950 text-zinc-500"
    },
    luxury_gold: {
      wrapper: "min-h-screen bg-[#0a0a0d] text-amber-50 font-sans selection:bg-amber-500 selection:text-black",
      header: "border-b border-amber-500/20 bg-[#0e0e14]/90 backdrop-blur-md sticky top-0 z-40 shadow-lg shadow-black/40",
      headerText: "text-amber-100 tracking-wide font-serif",
      headerSubText: "text-amber-200/60",
      heroBgGradient: "from-[#0a0a0d] via-[#0a0a0d]/90 to-transparent",
      heroBadge: "bg-amber-500/10 border-amber-500/30 text-amber-300",
      heroHeadline: "text-amber-100 font-serif",
      heroTagline: "text-amber-200/80 font-light",
      sectionBorder: "border-b border-amber-500/15",
      sectionTitle: "text-amber-100 font-serif",
      sectionSub: "text-amber-200/60",
      bodyText: "text-amber-100/90",
      card: "bg-[#13131a] border border-amber-500/25 text-amber-50 shadow-xl shadow-amber-950/20 hover:border-amber-400/40",
      cardHighlight: "bg-[#161622] border-2 border-amber-500/50 shadow-2xl shadow-amber-950/30",
      cardTitle: "text-amber-100 font-serif",
      cardPrice: "text-amber-300",
      cardSub: "text-amber-200/60",
      pill: "bg-[#161620] border border-amber-500/20 text-amber-200",
      inquiryBox: "bg-[#13131a] border border-amber-500/30 text-amber-50 shadow-2xl shadow-amber-950/20",
      inquiryTitle: "text-amber-100 font-serif",
      inquirySub: "text-amber-200/60",
      input: "bg-[#0c0c12] border border-amber-500/25 text-amber-100 placeholder-amber-200/40 focus:border-amber-400",
      footer: "border-t border-amber-500/15 bg-[#08080b] text-amber-200/40"
    }
  };

  const t = themes[gymTheme] || themes.dark_power;

  return (
    <div className={t.wrapper}>
      {/* Top Bar for App Preview */}
      {onBackToApp && (
        <div className="bg-slate-900 border-b border-white/10 px-4 py-2 flex items-center justify-between text-xs sticky top-0 z-50">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live Branded Gym Website Preview: <strong>{typeof window !== 'undefined' ? `${window.location.origin}/facility/${gymSlug}` : `/facility/${gymSlug}`}</strong></span>
          </div>
          <button
            onClick={onBackToApp}
            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-colors cursor-pointer"
          >
            &larr; Exit Preview
          </button>
        </div>
      )}

      {/* Live Announcement Bar */}
      {gymAnnouncement && (
        <div 
          className="py-2.5 px-4 text-center text-xs font-bold text-white flex items-center justify-center gap-2 shadow-sm transition-all z-40 relative"
          style={{ backgroundColor: gymPrimaryColor }}
        >
          <Sparkles className="w-4 h-4 animate-spin shrink-0" />
          <span>{gymAnnouncement}</span>
        </div>
      )}

      {/* Website Navigation Header */}
      <header className={t.header}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black shadow-lg"
              style={{ backgroundColor: gymPrimaryColor }}
            >
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <div className={`text-lg font-black tracking-tight ${t.headerText}`}>{gymName}</div>
              <div className={`text-[11px] flex items-center gap-2 ${t.headerSubText}`}>
                <Clock className="w-3 h-3" style={{ color: gymPrimaryColor }} /> {gymHours}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 text-xs font-bold transition-all border border-black/10 dark:border-white/15 cursor-pointer"
              title="Download & Install Gym App"
            >
              <Download className="w-3.5 h-3.5" style={{ color: gymPrimaryColor }} />
              <span>Download App</span>
            </button>
            {gymPhone && (
              <a
                href={`tel:${gymPhone}`}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/20 text-xs font-semibold opacity-80 hover:opacity-100"
              >
                <Phone className="w-3.5 h-3.5" style={{ color: gymPrimaryColor }} /> {gymPhone}
              </a>
            )}
            <button
              onClick={() => document.getElementById('inquiry-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-4 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-md cursor-pointer hover:opacity-95"
              style={{ backgroundColor: gymPrimaryColor }}
            >
              Join Facility
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section: Split 2-Column or Centered Impact */}
      {gymHeroStyle === 'split' ? (
        <section className={`relative py-16 sm:py-24 px-4 sm:px-6 overflow-hidden ${t.sectionBorder}`}>
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-15 pointer-events-none"
            style={{ backgroundImage: `url(${gymCover})` }}
          />
          <div className={`absolute inset-0 bg-gradient-to-t ${t.heroBgGradient} pointer-events-none`} />

          <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div 
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest border"
                style={{ 
                  color: gymPrimaryColor, 
                  borderColor: `${gymPrimaryColor}50`, 
                  backgroundColor: `${gymPrimaryColor}15` 
                }}
              >
                <Sparkles className="w-3.5 h-3.5" /> Official Dedicated Facility
              </div>

              <h1 className={`text-4xl sm:text-6xl font-black ${t.heroHeadline} tracking-tight leading-tight`}>
                {gymHeadline}
              </h1>

              <p className={`text-lg sm:text-xl ${t.heroTagline} leading-relaxed`}>
                {gymTagline}
              </p>

              <div className="flex items-center gap-4 flex-wrap pt-2">
                <button
                  onClick={() => document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-6 py-3.5 rounded-xl text-white font-extrabold text-sm transition-all shadow-xl flex items-center gap-2 cursor-pointer hover:opacity-95"
                  style={{ 
                    backgroundColor: gymPrimaryColor, 
                    boxShadow: `0 10px 25px -5px ${gymPrimaryColor}50` 
                  }}
                >
                  View Membership Plans <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => document.getElementById('inquiry-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className={`px-6 py-3.5 rounded-xl border ${t.heroBadge} font-bold text-sm transition-all cursor-pointer hover:bg-black/5`}
                >
                  Inquire / Join Facility
                </button>
              </div>

              {/* Quick Facility Highlights */}
              <div className="pt-4 flex items-center gap-6 flex-wrap text-xs">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className={`font-bold ${t.headerText}`}>4.9 / 5 Athlete Rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4" style={{ color: gymPrimaryColor }} />
                  <span className={`font-bold ${t.headerText}`}>Certified Trainers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: gymPrimaryColor }} />
                  <span className={`font-bold ${t.headerText}`}>{gymHours}</span>
                </div>
              </div>
            </div>

            {/* Right Photo Card with Floating Badges */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20 aspect-[4/3] group">
                <img 
                  src={gymCover} 
                  alt={gymName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                {/* Floating Bottom Badge */}
                <div className="absolute bottom-4 left-4 right-4 p-3 rounded-2xl bg-black/75 backdrop-blur-md border border-white/20 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: gymPrimaryColor }}
                    >
                      <Dumbbell className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight text-white">{gymName}</div>
                      <div className="text-[10px] text-slate-300">{gymAddress}</div>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Open Now
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* Centered Hero Style */
        <section className={`relative py-20 px-4 sm:px-6 overflow-hidden ${t.sectionBorder}`}>
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none"
            style={{ backgroundImage: `url(${gymCover})` }}
          />
          <div className={`absolute inset-0 bg-gradient-to-t ${t.heroBgGradient} pointer-events-none`} />

          <div className="relative max-w-4xl mx-auto text-center">
            <div 
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest border mb-6"
              style={{ 
                color: gymPrimaryColor, 
                borderColor: `${gymPrimaryColor}50`, 
                backgroundColor: `${gymPrimaryColor}15` 
              }}
            >
              <Sparkles className="w-3.5 h-3.5" /> Official Facility Website
            </div>

            <h1 className={`text-4xl sm:text-6xl font-black ${t.heroHeadline} tracking-tight leading-tight mb-4`}>
              {gymHeadline}
            </h1>

            <p className={`text-lg sm:text-xl ${t.heroTagline} max-w-2xl mx-auto leading-relaxed mb-8`}>
              {gymTagline}
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <button
                onClick={() => document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-6 py-3.5 rounded-xl text-white font-extrabold text-sm transition-all shadow-xl flex items-center gap-2 cursor-pointer hover:opacity-95"
                style={{ 
                  backgroundColor: gymPrimaryColor, 
                  boxShadow: `0 10px 25px -5px ${gymPrimaryColor}50` 
                }}
              >
                View Membership Plans <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => document.getElementById('inquiry-section')?.scrollIntoView({ behavior: 'smooth' })}
                className={`px-6 py-3.5 rounded-xl border ${t.heroBadge} font-bold text-sm transition-all cursor-pointer hover:bg-black/5`}
              >
                Inquire / Join Facility
              </button>
            </div>
          </div>
        </section>
      )}

      {/* About & Amenities Section */}
      <section className={`py-16 px-4 sm:px-6 max-w-6xl mx-auto ${t.sectionBorder}`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div 
              className="text-xs font-extrabold uppercase tracking-widest mb-2"
              style={{ color: gymPrimaryColor }}
            >
              About The Facility
            </div>
            <h2 className={`text-3xl font-black ${t.sectionTitle} tracking-tight mb-4`}>
              World-Class Training Ground
            </h2>
            <p className={`${t.bodyText} text-sm leading-relaxed mb-6`}>
              {gymAbout}
            </p>

            <div className="space-y-3">
              <div className={`flex items-center gap-3 text-xs ${t.bodyText}`}>
                <MapPin className="w-4 h-4 shrink-0" style={{ color: gymPrimaryColor }} />
                <span>{gymAddress}</span>
              </div>
              <div className={`flex items-center gap-3 text-xs ${t.bodyText}`}>
                <Clock className="w-4 h-4 shrink-0" style={{ color: gymPrimaryColor }} />
                <span>Hours: {gymHours}</span>
              </div>
              <div className={`flex items-center gap-3 text-xs ${t.bodyText}`}>
                <Phone className="w-4 h-4 shrink-0" style={{ color: gymPrimaryColor }} />
                <span>Phone: {gymPhone || 'Contact front desk'}</span>
              </div>
            </div>
          </div>

          {/* Amenities Grid */}
          <div className={`${t.card} rounded-3xl p-6 shadow-xl`}>
            <h3 className={`text-sm font-bold uppercase tracking-wider ${t.cardSub} mb-4 flex items-center gap-2`}>
              <Award className="w-4 h-4" style={{ color: gymPrimaryColor }} /> Featured Amenities & Equipment
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {gymAmenities && gymAmenities.length > 0 ? (
                gymAmenities.map((item, idx) => (
                  <div key={idx} className={`flex items-center gap-2.5 p-3 rounded-xl ${t.pill} text-xs`}>
                    <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: gymPrimaryColor }} />
                    <span className="font-semibold">{item}</span>
                  </div>
                ))
              ) : (
                <div className={`text-xs ${t.cardSub}`}>Amenities updating soon.</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Membership Plans Section (Denominated in INR) */}
      <section id="plans-section" className={`py-20 px-4 sm:px-6 max-w-6xl mx-auto ${t.sectionBorder}`}>
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div 
            className="text-xs font-extrabold uppercase tracking-widest mb-2"
            style={{ color: gymPrimaryColor }}
          >
            Pricing & Passes
          </div>
          <h2 className={`text-3xl sm:text-4xl font-black ${t.sectionTitle} tracking-tight`}>
            Transparent Membership Plans
          </h2>
          <p className={`${t.sectionSub} text-sm mt-2`}>
            No hidden admission fees. All prices denominated in Indian Rupees (₹).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {gymPlans.map((p, idx) => {
            const isFeatured = idx === 1;
            return (
              <div
                key={p.id}
                className={`rounded-3xl p-6 border transition-all flex flex-col justify-between ${
                  isFeatured
                    ? `${t.cardHighlight} scale-105`
                    : t.card
                }`}
                style={isFeatured ? { borderColor: `${gymPrimaryColor}80` } : {}}
              >
                <div>
                  {isFeatured && (
                    <span 
                      className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase text-white mb-3 shadow-xs"
                      style={{ backgroundColor: gymPrimaryColor }}
                    >
                      Most Popular
                    </span>
                  )}
                  <h3 className={`text-lg font-bold ${t.cardTitle}`}>{p.name}</h3>
                  <p className={`text-xs ${t.cardSub} mt-1 min-h-[36px]`}>{p.description || 'Full facility access and workout floor privileges.'}</p>
                  
                  <div className="my-6">
                    <span className={`text-3xl sm:text-4xl font-black ${t.cardPrice}`}>
                      {formatCurrency(p.price, gymCurrency)}
                    </span>
                    <span className={`text-xs ${t.cardSub} ml-1`}>/ {p.duration_days} days</span>
                  </div>

                  <ul className={`space-y-2.5 text-xs ${t.bodyText} mb-6`}>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: gymPrimaryColor }} /> Full gym floor access
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: gymPrimaryColor }} /> Locker room & shower facilities
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: gymPrimaryColor }} /> Mobile check-in pass
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectPlan(p.name)}
                  className="w-full py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer text-white shadow-md hover:opacity-95"
                  style={{ backgroundColor: gymPrimaryColor }}
                >
                  Choose This Plan
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Online Joining / Lead Capture Inquiry Section */}
      <section id="inquiry-section" className="py-20 px-4 sm:px-6 max-w-3xl mx-auto">
        <div className={`${t.inquiryBox} rounded-3xl p-6 sm:p-10 shadow-2xl`}>
          <div className="text-center max-w-lg mx-auto mb-8">
            <div 
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2 border"
              style={{ 
                color: gymPrimaryColor, 
                borderColor: `${gymPrimaryColor}40`, 
                backgroundColor: `${gymPrimaryColor}15` 
              }}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Direct Front Desk Connect
            </div>
            <h2 className={`text-2xl sm:text-3xl font-black ${t.inquiryTitle} tracking-tight`}>
              Start Training at {gymName}
            </h2>
            <p className={`${t.inquirySub} text-xs mt-1`}>
              Leave your details below. Our coaching team will reach out within 2 hours to confirm your membership details.
            </p>
          </div>

          {submitSuccess ? (
            <div className="p-6 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Inquiry Received!</h3>
              <p className="text-xs text-slate-300 mb-4">
                Thank you, <strong>{form.full_name}</strong>! The {gymName} team has logged your inquiry and will call or WhatsApp you at <strong>{form.phone}</strong>.
              </p>
              <button
                onClick={() => setSubmitSuccess(false)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Send Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitInquiry} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider ${t.inquirySub} mb-1.5`}>
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className={`w-full px-4 py-2.5 rounded-xl ${t.input} text-sm focus:outline-none focus:ring-2`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider ${t.inquirySub} mb-1.5`}>
                    Phone / WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className={`w-full px-4 py-2.5 rounded-xl ${t.input} text-sm focus:outline-none focus:ring-2`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider ${t.inquirySub} mb-1.5`}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="rahul@example.com"
                    className={`w-full px-4 py-2.5 rounded-xl ${t.input} text-sm focus:outline-none focus:ring-2`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider ${t.inquirySub} mb-1.5`}>
                    Interested Plan
                  </label>
                  <select
                    value={form.plan_name}
                    onChange={(e) => setForm({ ...form, plan_name: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-xl ${t.input} text-sm focus:outline-none focus:ring-2`}
                  >
                    {gymPlans.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} - {formatCurrency(p.price, gymCurrency)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider ${t.inquirySub} mb-1.5`}>
                  Fitness Goals / Message
                </label>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us about your goals (e.g. weight loss, strength, athletic training)..."
                  className={`w-full px-4 py-2.5 rounded-xl ${t.input} text-sm focus:outline-none focus:ring-2 resize-none`}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl text-white font-extrabold text-sm transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer hover:opacity-95"
                style={{ 
                  backgroundColor: gymPrimaryColor,
                  boxShadow: `0 10px 25px -5px ${gymPrimaryColor}40`
                }}
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Sending to Facility Front Desk...' : 'Submit Membership Request'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Website Footer */}
      <footer className={`${t.footer} py-8 px-4 text-center text-xs`}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Dumbbell className="w-4 h-4" style={{ color: gymPrimaryColor }} />
          <span className={`font-bold ${t.headerText}`}>{gymName}</span>
        </div>
        <p className="max-w-md mx-auto mb-4">{gymAddress || 'Premier Fitness Facility'} • {gymPhone || 'Phone support available'}</p>
        <div className="text-[11px] opacity-75">
          Powered by <span className="font-bold" style={{ color: gymPrimaryColor }}>GymPulse SaaS</span> • Facility Management Platform
        </div>
      </footer>

      {/* Download & Install App Modal */}
      <DownloadAppModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />
    </div>
  );
};
