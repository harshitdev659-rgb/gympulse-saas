import React from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  ClipboardCheck,
  Receipt,
  UserCheck,
  BarChart3,
  Settings,
  Sparkles,
  LogOut,
  Dumbbell,
  ShieldCheck,
  ChevronRight,
  Globe,
  Crown,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { canAccessTab } from '../../utils/permissions';

export const Sidebar = ({ activeTab, setActiveTab, onOpenAi, isOpen, onClose, onPreviewWebsite }) => {
  const { user, gym, logout } = useAuth();
  const isSuperAdmin = user?.is_superadmin || user?.role === 'superadmin';

  const gymSlug = (gym?.website_subdomain || gym?.slug || '').trim();
  const windowOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isGitHubPages = windowOrigin.includes('github.io') || pathname.includes('/gympulse-saas');
  const baseSubpath = isGitHubPages ? '/gympulse-saas' : '';
  const websiteUrl = gymSlug ? `${windowOrigin}${baseSubpath}/app.html?facility=${encodeURIComponent(gymSlug)}` : null;

  const allNavItems = [
    ...(isSuperAdmin ? [{ id: 'superadmin', label: 'Platform Control', icon: Crown }] : []),
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'memberships', label: 'Memberships', icon: CreditCard },
    { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
    { id: 'payments', label: 'Payments', icon: Receipt },
    { id: 'trainers', label: 'Trainers', icon: UserCheck },
    { id: 'website', label: 'Public Website', icon: Globe },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const navItems = allNavItems.filter((item) => canAccessTab(user, item.id));

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside className={`
        fixed top-0 left-0 z-40 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col justify-between transition-transform duration-300 ease-in-out border-r border-slate-800
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Gym Logo & Brand */}
        <div>
          <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shadow-md shadow-brand-500/20 shrink-0 bg-slate-800">
              <img src="/gympulse.png" alt="GymPulse Logo" className="w-10 h-10 object-contain" />
            </div>
            <div className="overflow-hidden">
              <h1 className="text-base font-bold text-white tracking-tight truncate">
                {isSuperAdmin ? 'GymPulse Platform' : (gym?.name || 'GymPulse')}
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                <span className={`w-2 h-2 rounded-full ${isSuperAdmin ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                <span className="uppercase tracking-wider font-bold text-slate-300">
                  {isSuperAdmin ? 'SUPER ADMIN' : `${gym?.plan_tier || 'PRO'} TIER`}
                </span>
              </div>
            </div>
          </div>

          {/* AI Shortcut Button */}
          <div className="px-4 mt-4">
            <button
              onClick={() => {
                onOpenAi();
                if (onClose) onClose();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600/20 to-indigo-600/20 border border-brand-500/30 text-white hover:border-brand-400 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-brand-500/20 text-brand-400 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-brand-200">AI Assistant</div>
                  <div className="text-[10px] text-slate-400">Ask gym queries</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 mt-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (onClose) onClose();
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all
                    ${isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Dedicated Live Gym Website Quick Link */}
        {!isSuperAdmin && websiteUrl && (
          <div className="px-4 py-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/30 text-xs text-indigo-200 hover:text-white transition-all group">
              <button
                type="button"
                onClick={() => {
                  if (onPreviewWebsite) {
                    onPreviewWebsite(gymSlug);
                  } else {
                    window.open(websiteUrl, '_blank');
                  }
                  if (onClose) onClose();
                }}
                className="flex items-center gap-2 truncate flex-1 text-left cursor-pointer"
                title="Preview facility public website"
              >
                <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="truncate font-bold">Live Gym Website</span>
              </button>
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={`Open in new tab: ${websiteUrl}`}
                className="p-1 text-indigo-400 hover:text-white hover:bg-indigo-800/40 rounded-lg transition-colors ml-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-sm flex-shrink-0">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-white truncate">{user?.full_name}</div>
                <div className="text-[11px] text-slate-400 capitalize flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-brand-400" />
                  {user?.role}
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
