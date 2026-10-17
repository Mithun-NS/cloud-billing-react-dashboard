import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  iconLeft: IconLeft,
  iconRight: IconRight,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const variantStyles = {
    primary:
      'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium shadow-lg shadow-cyan-500/20 active:scale-[0.98]',
    secondary:
      'bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 hover:border-slate-600 active:scale-[0.98]',
    outline:
      'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 active:scale-[0.98]',
    danger:
      'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 hover:border-rose-500/50 active:scale-[0.98]',
    ghost:
      'bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 active:scale-[0.98]',
    success:
      'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 active:scale-[0.98]',
  };

  const sizeStyles = {
    xs: 'px-2.5 py-1 text-xs rounded-md gap-1.5',
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-4 py-2 text-sm rounded-lg gap-2',
    lg: 'px-5 py-2.5 text-base rounded-xl gap-2.5',
    icon: 'p-2 rounded-lg',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 select-none ${
        variantStyles[variant] || variantStyles.primary
      } ${sizeStyles[size] || sizeStyles.md} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : IconLeft ? (
        <IconLeft className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
      {!loading && IconRight ? <IconRight className="w-4 h-4 shrink-0" /> : null}
    </button>
  );
}
