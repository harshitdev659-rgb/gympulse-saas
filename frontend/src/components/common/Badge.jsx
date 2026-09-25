import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'md' }) => {
  const variants = {
    default: 'bg-slate-200 text-slate-950 border-slate-300 font-extrabold',
    active: 'bg-emerald-100 text-emerald-950 border-emerald-400 font-extrabold shadow-2xs',
    expired: 'bg-rose-100 text-rose-950 border-rose-300 font-extrabold shadow-2xs',
    warning: 'bg-amber-100 text-amber-950 border-amber-300 font-extrabold shadow-2xs',
    info: 'bg-blue-100 text-blue-950 border-blue-300 font-extrabold shadow-2xs',
    purple: 'bg-purple-100 text-purple-950 border-purple-300 font-extrabold shadow-2xs',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs font-bold',
    md: 'px-2.5 py-1 text-xs font-black tracking-wide',
    lg: 'px-3 py-1.5 text-sm font-black tracking-wide',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border capitalize ${variants[variant] || variants.default} ${sizes[size]}`}>
      <span className="w-2 h-2 rounded-full bg-current opacity-80"></span>
      {children}
    </span>
  );
};

