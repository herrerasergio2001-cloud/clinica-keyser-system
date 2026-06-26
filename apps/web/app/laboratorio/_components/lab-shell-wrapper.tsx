'use client';

import React from 'react';
import { Shell } from '@clinic/ui';
import { AppSidebar, UserMenu } from '../../_components/session';
import type { ActionButton } from '@clinic/types';

interface LabShellProps {
  title: string;
  subtitle?: string;
  description?: string;
  children: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href: string }>;
  actions?: ActionButton[];
  showBack?: boolean;
}

export function LabShell({
  title,
  subtitle,
  description,
  children,
  breadcrumbs,
  actions,
  showBack = true,
}: LabShellProps) {
  return (
    <Shell
      title={title}
      subtitle={subtitle || 'Laboratorio'}
      description={description}
      breadcrumbs={breadcrumbs}
      actions={actions}
      showBack={showBack}
      sidebar={<AppSidebar active="Laboratorio" />}
      userMenu={<UserMenu />}
    >
      {children}
    </Shell>
  );
}
