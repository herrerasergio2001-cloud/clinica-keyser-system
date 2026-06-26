'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon: Icon, className = '', ...props }, ref) => {
    return (
      <div>
        {label && <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">{label}</label>}
        <div className="relative">
          {Icon && <Icon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />}
          <input
            ref={ref}
            className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-clinic-teal focus:outline-none focus:ring-2 focus:ring-clinic-teal/20 disabled:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:ring-clinic-teal/20 ${Icon ? 'pl-10' : ''} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
