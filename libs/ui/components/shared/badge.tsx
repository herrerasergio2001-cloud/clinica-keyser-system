'use client';

import React from 'react';
import { BadgeVariant } from '../../types';

const variantStyles: Record<BadgeVariant, string> = {
  'status-active': 'bg-green-100 text-green-800 border-green-200',
  'status-draft': 'bg-gray-100 text-gray-800 border-gray-200',
  'status-pending': 'bg-amber-100 text-amber-800 border-amber-200',
  'status-cancelled': 'bg-red-100 text-red-800 border-red-200',
  'status-voided': 'bg-slate-100 text-slate-800 border-slate-200',
  'priority-routine': 'bg-blue-100 text-blue-800 border-blue-200',
  'priority-urgent': 'bg-orange-100 text-orange-800 border-orange-200',
  'priority-stat': 'bg-red-100 text-red-800 border-red-200',
  'critical-low': 'bg-red-100 text-red-800 border-red-200',
  'critical-high': 'bg-red-100 text-red-800 border-red-200',
  'warning': 'bg-amber-100 text-amber-800 border-amber-200',
  'success': 'bg-green-100 text-green-800 border-green-200',
  'info': 'bg-blue-100 text-blue-800 border-blue-200',
};

interface BadgeProps {
  variant: BadgeVariant;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export function Badge({ variant, label, icon: Icon, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles[variant]} ${className}`}>
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </span>
  );
}
