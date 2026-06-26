'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../shared/button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnEsc?: boolean;
  closeOnBackdrop?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnEsc = true,
  closeOnBackdrop = false,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, closeOnEsc, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={() => closeOnBackdrop && onClose()}
      />

      {/* Modal */}
      <div className={`relative w-full ${sizeClasses[size]} mx-4 rounded-lg bg-white p-6 shadow-xl dark:bg-slate-900`}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h2>
            {description && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6 max-h-[60vh] overflow-y-auto">{children}</div>

        {footer && (
          <div className="flex gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">{footer}</div>
        )}
      </div>
    </div>
  );
}
