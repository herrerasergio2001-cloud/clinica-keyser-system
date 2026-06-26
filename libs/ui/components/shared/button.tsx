'use client';

import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-clinic-teal text-white hover:bg-clinic-teal/90 disabled:bg-slate-300',
  secondary: 'border border-slate-200 text-slate-900 hover:bg-slate-50 disabled:text-slate-300 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
  ghost: 'text-slate-900 hover:bg-slate-100 disabled:text-slate-300 dark:text-slate-100 dark:hover:bg-slate-800',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon: Icon,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-clinic-teal disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
      ) : (
        Icon && <Icon className="h-4 w-4" />
      )}
      {children}
    </button>
  );
}
