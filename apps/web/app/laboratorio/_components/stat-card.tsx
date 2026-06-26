'use client';

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  unit?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
  className?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  trend,
  onClick,
  className = '',
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800 ${onClick ? 'cursor-pointer hover:border-clinic-teal hover:shadow-lg transition-all' : ''} ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</p>
          <p className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">{value}</span>
            {unit && <span className="text-sm text-slate-600 dark:text-slate-400">{unit}</span>}
          </p>
          {trend && (
            <p className="mt-2 flex items-center gap-1 text-sm">
              {trend.isPositive ? (
                <>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">+{trend.value}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-red-600">{trend.value}%</span>
                </>
              )}
            </p>
          )}
        </div>
        <div className="rounded-lg bg-clinic-teal/10 p-3">
          <Icon className="h-6 w-6 text-clinic-teal" />
        </div>
      </div>
    </div>
  );
}
