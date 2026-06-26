'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home } from 'lucide-react';
import { ActionButton } from '@clinic/types';
import { Button } from '../shared/button';

interface ShellProps {
  title: string;
  subtitle?: string;
  description?: string;
  children: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href: string }>;
  actions?: ActionButton[];
  active?: string;
  showBack?: boolean;
  sidebar?: React.ReactNode;
  userMenu?: React.ReactNode;
}

export function Shell({
  title,
  subtitle,
  description,
  children,
  breadcrumbs,
  actions,
  active,
  showBack = true,
  sidebar,
  userMenu,
}: ShellProps) {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <div className="grid min-h-screen grid-cols-[260px_1fr] max-lg:grid-cols-1">
        {sidebar && <>{sidebar}</>}
        <section className="min-w-0 flex flex-col">
          {/* Header */}
          <header className="border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900 sticky top-0 z-40">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-clinic-teal">{subtitle || title}</p>
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{title}</h1>
                {description && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>}
                {breadcrumbs && breadcrumbs.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <Link href="/panel" className="inline-flex items-center gap-1 text-clinic-teal hover:underline">
                      <Home className="h-3.5 w-3.5" />
                      Inicio
                    </Link>
                    {breadcrumbs.map((crumb, i) => (
                      <React.Fragment key={i}>
                        <span>/</span>
                        <Link href={crumb.href} className="hover:text-clinic-teal hover:underline">
                          {crumb.label}
                        </Link>
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>

              {/* Top-right actions */}
              <nav className="flex flex-wrap gap-2">
                {userMenu && <>{userMenu}</>}
                {actions?.map((action) => (
                  <Button
                    key={action.label}
                    variant={action.danger ? 'danger' : 'secondary'}
                    size="md"
                    disabled={action.disabled}
                    onClick={action.onClick}
                  >
                    {action.icon && <action.icon className="h-4 w-4" />}
                    {action.label}
                  </Button>
                ))}
                {showBack && (
                  <Button variant="secondary" size="md" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    Regresar
                  </Button>
                )}
              </nav>
            </div>
          </header>

          {/* Main content */}
          <div className="flex-1 overflow-auto p-6">{children}</div>
        </section>
      </div>
    </main>
  );
}
