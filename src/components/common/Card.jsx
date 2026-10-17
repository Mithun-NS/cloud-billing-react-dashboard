import React from 'react';

export default function Card({
  children,
  title,
  subtitle,
  action,
  icon: Icon,
  className = '',
  bodyClassName = '',
  hoverEffect = false,
  ...props
}) {
  return (
    <div
      className={`glass-panel rounded-2xl relative overflow-hidden transition-all duration-200 ${
        hoverEffect ? 'hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5' : ''
      } ${className}`}
      {...props}
    >
      {(title || subtitle || action || Icon) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <div>
              {title && (
                <h3 className="text-sm font-semibold text-slate-100 tracking-tight">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={`p-6 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
