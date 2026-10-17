import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  className = '',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-5xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full ${sizeClasses[size] || sizeClasses.md} bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-cyan-500/5 z-10 overflow-hidden transform transition-all duration-200 animate-in fade-in zoom-in-95 ${className}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        {(title || subtitle) && (
          <div className="flex items-start justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/80">
            <div>
              {title && (
                <h3 className="text-base font-semibold text-slate-100">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-4"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5 max-h-[calc(85vh-140px)] overflow-y-auto text-sm text-slate-300">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/60">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
