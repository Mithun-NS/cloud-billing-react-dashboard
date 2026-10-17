import React from 'react';

export default function Badge({ 
  children, 
  variant = 'default', 
  size = 'sm', 
  dot = false, 
  className = '' 
}) {
  const variantStyles = {
    default: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    provisioning: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    warning: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    suspended: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    info: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    primary: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  };

  const dotColors = {
    default: 'bg-slate-400',
    active: 'bg-emerald-400 animate-pulse',
    success: 'bg-emerald-400 animate-pulse',
    provisioning: 'bg-amber-400 animate-spin',
    warning: 'bg-amber-400',
    suspended: 'bg-rose-400',
    danger: 'bg-rose-400',
    info: 'bg-cyan-400',
    primary: 'bg-indigo-400',
  };

  const sizeStyles = {
    xs: 'px-2 py-0.5 text-[11px] font-medium tracking-wide',
    sm: 'px-2.5 py-1 text-xs font-medium tracking-wide',
    md: 'px-3 py-1.5 text-xs font-semibold tracking-wide',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border backdrop-blur-sm transition-colors ${
        variantStyles[variant] || variantStyles.default
      } ${sizeStyles[size] || sizeStyles.sm} ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            dotColors[variant] || dotColors.default
          }`}
        />
      )}
      {children}
    </span>
  );
}
