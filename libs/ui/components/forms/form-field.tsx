'use client';

import React from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  name,
  required = false,
  error,
  hint,
  children,
  className = '',
}: FormFieldProps) {
  return (
    <div className={`mb-4 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-slate-900 dark:text-white">
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </label>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
      {hint && <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{hint}</p>}
    </div>
  );
}
