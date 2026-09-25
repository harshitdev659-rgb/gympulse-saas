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
  Download,
  QrCode,
  CreditCard,
  Flame,
  Check,
  Printer,
  Calendar,
  RefreshCw,
  X,
  Zap,
  UserCheck,
  Search
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/currency';
import { Modal } from '../components/common/Modal';
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

  // Athlete Mobile Check-In State (Auto-opened if URL has action=checkin)
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        return params.get('action') === 'checkin' || window.location.hash.includes('action=checkin');
      }
    } catch (e) {}
    return false;
  });
  const [checkInPhone, setCheckInPhone] = useState(() => {
    try {
      return localStorage.getItem('gympulse_athlete_phone') || '';
    } catch (e) {
      return '';
    }
  });
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInSuccessData, setCheckInSuccessData] = useState(null);

  // Direct Membership Pass Checkout State
  const [isBuyPassModalOpen, setIsBuyPassModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [buyPassForm, setBuyPassForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    payment_method: 'upi',
    payment_ref: ''
  });
  const [isSubmittingPass, setIsSubmittingPass] = useState(false);
  const [activatedPass, setActivatedPass] = useState(null);

  // Athlete Self-Service Portal State
  const [isPortalModalOpen, setIsPortalModalOpen] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        return params.has('portal') || window.location.hash.includes('portal');
      }
    } catch (e) {}
    return false;
  });
  const [portalQuery, setPortalQuery] = useState(() => {
    try {
      return localStorage.getItem('gympulse_athlete_phone') || '';
    } catch (e) {
      return '';
    }
  });
  const [portalData, setPortalData] = useState(null);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  const playSuccessChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {}
  };

  const handlePerformAthleteCheckIn = async (e) => {
    if (e) e.preventDefault();
    if (!checkInPhone.trim()) {
      toast.error('Please enter your registered phone number or Member ID.');
      return;
    }
    setIsCheckingIn(true);
    try {
      const res = await api.publicAthleteCheckIn(slug, checkInPhone.trim());
      setCheckInSuccessData(res);
      playSuccessChime();
      try {
        localStorage.setItem('gympulse_athlete_phone', checkInPhone.trim());
      } catch (err) {}
      toast.success(res?.message || 'Check-in confirmed!');
    } catch (err) {
      toast.error(err.message || 'Check-in failed. Please verify with front desk.');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleOpenBuyPass = (plan) => {
    setSelectedPlan(plan);
    setBuyPassForm((prev) => ({
      ...prev,
      phone: prev.phone || checkInPhone || ''
    }));
    setActivatedPass(null);
    setIsBuyPassModalOpen(true);
  };

  const handleConfirmPassPurchase = async (e) => {
    if (e) e.preventDefault();
    if (!buyPassForm.first_name || !buyPassForm.phone) {
      toast.error('Please provide your name and phone number.');
      return;
    }
    if (!selectedPlan) return;

    setIsSubmittingPass(true);
    try {
      const res = await api.joinPublicFacility(slug, {
        first_name: buyPassForm.first_name.trim(),
        last_name: buyPassForm.last_name.trim(),
        phone: buyPassForm.phone.trim(),
        email: buyPassForm.email.trim() || null,
        plan_id: selectedPlan.id,
        payment_method: buyPassForm.payment_method,
        payment_ref: buyPassForm.payment_ref || `WEB-${Date.now().toString().slice(-6)}`
      });
      playSuccessChime();
      setActivatedPass(res);
      try {
        localStorage.setItem('gympulse_athlete_phone', buyPassForm.phone.trim());
      } catch (err) {}
      toast.success(res.message || 'Membership pass activated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to activate membership pass.');
    } finally {
      setIsSubmittingPass(false);
    }
  };

  const handleFetchPortalData = async (queryVal) => {
    const q = queryVal || portalQuery;
    if (!q || !q.trim()) {
      toast.error('Please enter your phone number or Member ID.');
      return;
    }
    setIsLoadingPortal(true);
    try {
      const res = await api.getAthletePortalData(slug, q.trim());
      setPortalData(res);
      try {
        localStorage.setItem('gympulse_athlete_phone', q.trim());
      } catch (err) {}
    } catch (err) {
      toast.error(err.message || 'No athlete record found for this Phone or ID.');
    } finally {
      setIsLoadingPortal(false);
    }
  };

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

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Quick Check-in Button */}
            <button
              type="button"
              onClick={() => {
                setCheckInSuccessData(null);
                setIsCheckInModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all border cursor-pointer hover:scale-105 shadow-xs"
              style={{ 
                backgroundColor: `${gymPrimaryColor}20`, 
                borderColor: `${gymPrimaryColor}60`,
                color: gymPrimaryColor 
              }}
              title="Quick Athlete Entrance Check-In"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Check-In</span>
            </button>

            {/* Member Portal / My Pass Button */}
            <button
              type="button"
              onClick={() => {
                setIsPortalModalOpen(true);
                if (portalQuery) {
                  handleFetchPortalData(portalQuery);
                }
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 text-xs font-bold transition-all border border-black/10 dark:border-white/15 cursor-pointer"
              title="View Athlete Pass & Workout History"
            >
              <QrCode className="w-3.5 h-3.5" style={{ color: gymPrimaryColor }} />
              <span>My Pass</span>
            </button>

            <button
              onClick={handleDownloadClick}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 text-xs font-bold transition-all border border-black/10 dark:border-white/15 cursor-pointer"
              title="Download & Install Gym App"
            >
              <Download className="w-3.5 h-3.5" style={{ color: gymPrimaryColor }} />
              <span>Download App</span>
            </button>

            {gymPhone && (
              <a
                href={`tel:${gymPhone}`}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/20 text-xs font-semibold opacity-80 hover:opacity-100"
              >
                <Phone className="w-3.5 h-3.5" style={{ color: gymPrimaryColor }} /> {gymPhone}
              </a>
            )}

            <button
              onClick={() => {
                if (gymPlans && gymPlans.length > 0) {
                  handleOpenBuyPass(gymPlans[0]);
                } else {
                  document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="px-4 py-2 rounded-xl text-white text-xs font-extrabold transition-all shadow-md cursor-pointer hover:opacity-95 flex items-center gap-1.5"
              style={{ backgroundColor: gymPrimaryColor }}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Join Facility</span>
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

                <div className="space-y-2 mt-4">
                  <button
                    type="button"
                    onClick={() => handleOpenBuyPass(p)}
                    className="w-full py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer text-white shadow-md hover:opacity-95 flex items-center justify-center gap-1.5"
                    style={{ backgroundColor: gymPrimaryColor }}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Join Now &bull; {formatCurrency(p.price, gymCurrency)}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPlan(p.name)}
                    className="w-full py-1.5 rounded-lg text-[11px] font-semibold opacity-75 hover:opacity-100 transition-opacity cursor-pointer text-center block"
                  >
                    or submit inquiry &rarr;
                  </button>
                </div>
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

      {/* 1. Athlete Mobile Check-In Modal */}
      <Modal
        isOpen={isCheckInModalOpen}
        onClose={() => {
          setIsCheckInModalOpen(false);
          setCheckInSuccessData(null);
        }}
        title="⚡ Athlete Entrance Check-In"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Facility Front Desk</span>
              <h4 className="text-base font-black text-white">{gymName}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{gymAddress || 'Official Complex'}</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: gymPrimaryColor }}>
              <Zap className="w-5 h-5 fill-current" />
            </div>
          </div>

          {checkInSuccessData ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-500/30">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-200 text-emerald-950 border border-emerald-300">
                  {checkInSuccessData.action === 'check_out' ? 'Session Completed' : 'Access Granted'}
                </span>
                <h3 className="text-xl font-black text-slate-950 mt-1.5">{checkInSuccessData.member_name}</h3>
                <p className="text-xs text-slate-700 font-bold mt-1">
                  Recorded at {checkInSuccessData.time} today
                </p>
              </div>

              {checkInSuccessData.monthly_workouts && (
                <div className="p-3 rounded-xl bg-white border border-emerald-200 flex items-center justify-center gap-2 text-xs font-black text-slate-900">
                  <Flame className="w-4 h-4 text-orange-500 fill-current" />
                  <span>{checkInSuccessData.monthly_workouts} Workouts Logged This Month!</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCheckInModalOpen(false);
                    setPortalQuery(checkInPhone);
                    handleFetchPortalData(checkInPhone);
                    setIsPortalModalOpen(true);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  View Digital Pass
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCheckInModalOpen(false);
                    setCheckInSuccessData(null);
                  }}
                  className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePerformAthleteCheckIn} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                  Mobile Number or Member ID *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={checkInPhone}
                  onChange={(e) => setCheckInPhone(e.target.value)}
                  placeholder="e.g. 9876543210 or Member ID"
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 font-extrabold text-slate-950 focus:border-brand-500 focus:outline-none text-base"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Enter your registered phone number or Member ID to mark entrance attendance.
                </p>
              </div>

              <button
                type="submit"
                disabled={isCheckingIn}
                className="w-full py-3.5 rounded-xl text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: gymPrimaryColor }}
              >
                {isCheckingIn ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Athlete Pass...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Confirm Check-In</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </Modal>

      {/* 2. Direct Membership Pass Checkout & Digital ID Card Modal */}
      <Modal
        isOpen={isBuyPassModalOpen}
        onClose={() => {
          setIsBuyPassModalOpen(false);
          setActivatedPass(null);
        }}
        title={activatedPass ? "Official Digital Membership Pass" : "Instant Membership Registration"}
        maxWidth="max-w-lg"
      >
        {activatedPass ? (
          <div className="space-y-5">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950 text-white border-2 border-amber-400/40 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white shadow-xs" style={{ backgroundColor: gymPrimaryColor }}>
                    <Dumbbell className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-white">{gymName}</h4>
                    <span className="text-[10px] text-amber-300 font-extrabold uppercase tracking-widest">Verified Digital Pass</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  {activatedPass.member?.status?.toUpperCase() || 'ACTIVE'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Athlete Name</span>
                  <div className="text-lg font-black text-white mt-0.5">{activatedPass.member?.full_name}</div>
                  
                  <div className="mt-3">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Membership Plan</span>
                    <div className="text-xs font-extrabold text-amber-300">{activatedPass.member?.plan_name}</div>
                  </div>

                  <div className="mt-3">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Valid Until</span>
                    <div className="text-xs font-black text-slate-200">{activatedPass.member?.expiry_date}</div>
                  </div>
                </div>

                <div className="text-center sm:text-right flex flex-col items-center sm:items-end">
                  <div className="bg-white p-2.5 rounded-2xl border-2 border-slate-200 inline-block shadow-md">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`MEM-${activatedPass.member?.id || 'PASS'}`)}`}
                      alt="Digital ID Pass QR"
                      className="w-28 h-28 object-contain"
                    />
                  </div>
                  <span className="text-[10px] font-mono font-black text-slate-400 mt-1.5 block">
                    ID: #{String(activatedPass.member?.id).padStart(6, '0')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Pass</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsBuyPassModalOpen(false);
                  setPortalQuery(activatedPass.member?.phone || '');
                  handleFetchPortalData(activatedPass.member?.phone || '');
                  setIsPortalModalOpen(true);
                }}
                className="flex-1 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                style={{ backgroundColor: gymPrimaryColor }}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Open Athlete Portal</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConfirmPassPurchase} className="space-y-4">
            {selectedPlan && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Selected Plan</span>
                  <div className="font-black text-slate-900 text-sm">{selectedPlan.name}</div>
                  <div className="text-xs text-slate-500">{selectedPlan.duration_days} Days Full Floor Access</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Amount</span>
                  <div className="font-black text-emerald-700 text-base">
                    {formatCurrency(selectedPlan.price, gymCurrency)}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={buyPassForm.first_name}
                  onChange={(e) => setBuyPassForm({ ...buyPassForm, first_name: e.target.value })}
                  placeholder="e.g. Rahul"
                  className="w-full px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={buyPassForm.last_name}
                  onChange={(e) => setBuyPassForm({ ...buyPassForm, last_name: e.target.value })}
                  placeholder="e.g. Sharma"
                  className="w-full px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={buyPassForm.phone}
                  onChange={(e) => setBuyPassForm({ ...buyPassForm, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={buyPassForm.email}
                  onChange={(e) => setBuyPassForm({ ...buyPassForm, email: e.target.value })}
                  placeholder="rahul@example.com"
                  className="w-full px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Payment Options */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'upi', label: 'Instant UPI QR', icon: QrCode },
                  { id: 'card', label: 'Card Payment', icon: CreditCard },
                  { id: 'cash_at_desk', label: 'Pay at Desk', icon: Dumbbell }
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setBuyPassForm({ ...buyPassForm, payment_method: m.id })}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      buyPassForm.payment_method === m.id
                        ? 'border-brand-600 bg-brand-50 text-brand-700 font-black shadow-xs ring-1 ring-brand-500'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <m.icon className="w-4 h-4" />
                    <span className="text-[11px]">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic UPI QR Display */}
            {buyPassForm.payment_method === 'upi' && selectedPlan && (
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center space-y-2">
                <div className="bg-white p-3 rounded-xl border border-emerald-200 inline-block shadow-xs">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=gympulse@okaxis&pn=${encodeURIComponent(gymName)}&am=${selectedPlan.price}&cu=INR`)}`}
                    alt="UPI Payment QR Code"
                    className="w-36 h-36 object-contain"
                  />
                </div>
                <div className="text-xs text-slate-700 font-bold">
                  Scan with GPay / PhonePe / Paytm / BHIM to pay <strong className="text-emerald-950 font-black">{formatCurrency(selectedPlan.price, gymCurrency)}</strong>
                </div>
                <input
                  type="text"
                  value={buyPassForm.payment_ref}
                  onChange={(e) => setBuyPassForm({ ...buyPassForm, payment_ref: e.target.value })}
                  placeholder="UPI Transaction ID / UTR (optional)"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900"
                />
              </div>
            )}

            {buyPassForm.payment_method === 'cash_at_desk' && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium leading-relaxed">
                ℹ️ Your membership pass will be reserved instantly. Settle the fee in cash or card at the front desk upon your first workout.
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmittingPass}
              className="w-full py-3.5 rounded-xl text-white font-extrabold text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer hover:opacity-95 disabled:opacity-50"
              style={{ backgroundColor: gymPrimaryColor }}
            >
              {isSubmittingPass ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Activating Digital Pass...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Activate Pass &bull; {selectedPlan ? formatCurrency(selectedPlan.price, gymCurrency) : ''}</span>
                </>
              )}
            </button>
          </form>
        )}
      </Modal>

      {/* 3. Athlete Self-Service Portal Modal */}
      <Modal
        isOpen={isPortalModalOpen}
        onClose={() => {
          setIsPortalModalOpen(false);
          setPortalData(null);
        }}
        title="Athlete Self-Service Portal"
        maxWidth="max-w-xl"
      >
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={portalQuery}
              onChange={(e) => setPortalQuery(e.target.value)}
              placeholder="Enter Phone Number or Member ID..."
              className="flex-1 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="button"
              onClick={() => handleFetchPortalData(portalQuery)}
              disabled={isLoadingPortal}
              className="px-4 py-2 rounded-xl text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer hover:opacity-95 disabled:opacity-50 flex items-center gap-1.5"
              style={{ backgroundColor: gymPrimaryColor }}
            >
              {isLoadingPortal ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>View Pass</span>
            </button>
          </div>

          {portalData ? (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-white">{portalData.member?.full_name}</h3>
                    <div className="text-xs text-slate-400 font-semibold">{portalData.member?.phone}</div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {portalData.member?.status?.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Plan</span>
                    <strong className="text-amber-300">{portalData.member?.plan_name}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Expiry</span>
                    <strong className="text-slate-200">{portalData.member?.expiry_date || 'N/A'} ({portalData.member?.days_remaining || 0} days left)</strong>
                  </div>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, Math.max(10, ((portalData.member?.days_remaining || 0) / 30) * 100))}%`,
                      backgroundColor: gymPrimaryColor
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" style={{ color: gymPrimaryColor }} />
                  <span>Recent Workouts ({portalData.attendance_count || 0} Total)</span>
                </h4>
                <div className="max-h-36 overflow-y-auto space-y-1 rounded-xl border border-slate-200 divide-y divide-slate-100">
                  {portalData.recent_attendances && portalData.recent_attendances.length > 0 ? (
                    portalData.recent_attendances.map((a, i) => (
                      <div key={i} className="p-2.5 px-3 flex items-center justify-between text-xs bg-white">
                        <span className="font-bold text-slate-900">{a.date}</span>
                        <span className="text-slate-600 font-semibold">{a.check_in}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold uppercase">{a.method}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400 font-medium">No check-in records yet.</div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPortalModalOpen(false);
                    if (gymPlans && gymPlans.length > 0) {
                      handleOpenBuyPass(gymPlans[0]);
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: gymPrimaryColor }}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Renew Membership Pass</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-500 font-medium">
              Enter your mobile number above to inspect your workout streak, active pass, and receipts.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
