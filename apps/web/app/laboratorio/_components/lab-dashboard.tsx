'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ClipboardList,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  MoreVertical,
} from 'lucide-react';
import { DataTable, Badge, LoadingSkeleton } from '@clinic/ui';
import { useAsync } from '@clinic/ui';
import { api } from '@clinic/api';
import { LabHeader } from './lab-header';
import { StatCard } from './stat-card';
import { LabShell } from './lab-shell-wrapper';

interface LabDashboardData {
  stats: {
    totalOrders: number;
    completedToday: number;
    pendingResults: number;
    expiringReagents: number;
  };
  recentOrders: Array<{
    id: string;
    patientName: string;
    patientCode: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
    priority: 'ROUTINE' | 'URGENT' | 'STAT';
    createdAt: string;
  }>;
}

export function LabDashboard() {
  const router = useRouter();

  // TODO: Connect to backend API when dashboard endpoint is ready
  // const { data, isLoading } = useAsync<LabDashboardData>('/api/laboratory/dashboard');

  // Mock data for development
  const data: LabDashboardData = {
    stats: {
      totalOrders: 127,
      completedToday: 12,
      pendingResults: 8,
      expiringReagents: 3,
    },
    recentOrders: [
      {
        id: '1',
        patientName: 'Juan Pérez García',
        patientCode: 'CK-000001',
        status: 'PROCESSING',
        priority: 'URGENT',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        patientName: 'María López Rodríguez',
        patientCode: 'CK-000002',
        status: 'PENDING',
        priority: 'ROUTINE',
        createdAt: new Date().toISOString(),
      },
    ],
  };
  const isLoading = false;

  const handleNewOrder = () => router.push('/laboratorio/ordenes/nueva');
  const handleSearch = () => router.push('/laboratorio/ordenes');
  const handleReagents = () => router.push('/laboratorio/reactivos');
  const handleSettings = () => router.push('/laboratorio/configuracion');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'status-active';
      case 'PENDING':
        return 'status-pending';
      case 'PROCESSING':
        return 'status-draft';
      case 'CANCELLED':
        return 'status-cancelled';
      default:
        return 'status-draft';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'ROUTINE':
        return 'priority-routine';
      case 'URGENT':
        return 'priority-urgent';
      case 'STAT':
        return 'priority-stat';
      default:
        return 'priority-routine';
    }
  };

  return (
    <LabShell
      title="Laboratorio"
      subtitle="Sistema de Información de Laboratorio"
      showBack={false}
    >
      <div className="space-y-8">
        {/* Header with Quick Actions */}
        <LabHeader
          onSearch={handleSearch}
          onNewOrder={handleNewOrder}
          onAddExam={handleSearch}
          onReagents={handleReagents}
          onPrintLabels={() => {}}
          onReprint={() => {}}
          onSettings={handleSettings}
        />

        {/* Statistics Grid */}
        {isLoading ? (
          <LoadingSkeleton count={4} />
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={ClipboardList}
              label="Órdenes Totales"
              value={data?.stats.totalOrders ?? 0}
              onClick={handleSearch}
            />
            <StatCard
              icon={CheckCircle}
              label="Completadas Hoy"
              value={data?.stats.completedToday ?? 0}
              trend={{ value: 15, isPositive: true }}
            />
            <StatCard
              icon={Clock}
              label="Resultados Pendientes"
              value={data?.stats.pendingResults ?? 0}
              trend={{ value: 8, isPositive: false }}
            />
            <StatCard
              icon={AlertCircle}
              label="Reactivos Próximos a Vencer"
              value={data?.stats.expiringReagents ?? 0}
              onClick={handleReagents}
            />
          </div>
        )}

        {/* Recent Orders */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Órdenes Recientes</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Últimas órdenes registradas en el sistema
              </p>
            </div>
            <Link
              href="/laboratorio/ordenes"
              className="inline-flex items-center gap-2 text-sm font-medium text-clinic-teal hover:underline"
            >
              Ver todas
              <span>→</span>
            </Link>
          </div>

          {isLoading ? (
            <LoadingSkeleton count={3} />
          ) : (
            <DataTable
              columns={[
                { key: 'patientName', label: 'Paciente', width: '30%' },
                { key: 'priority', label: 'Prioridad', width: '15%', render: (v: string) => <Badge variant={getPriorityColor(v) as any} label={v} /> },
                { key: 'status', label: 'Estado', width: '15%', render: (v: string) => <Badge variant={getStatusColor(v) as any} label={v} /> },
                { key: 'createdAt', label: 'Fecha', width: '25%', render: (v: string) => new Date(v).toLocaleString('es-NI') },
              ]}
              data={data?.recentOrders || []}
              onRowClick={(row) => router.push(`/laboratorio/ordenes/${row.id}`)}
            />
          )}
        </div>

        {/* Module Links */}
        <div>
          <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">Módulos Principales</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/laboratorio/ordenes"
              className="rounded-lg border border-slate-200 p-6 hover:border-clinic-teal hover:shadow-lg transition-all dark:border-slate-700"
            >
              <ClipboardList className="h-8 w-8 text-clinic-teal mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Órdenes</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Crear y gestionar órdenes de laboratorio</p>
            </Link>

            <Link
              href="/laboratorio/resultados"
              className="rounded-lg border border-slate-200 p-6 hover:border-clinic-teal hover:shadow-lg transition-all dark:border-slate-700"
            >
              <CheckCircle className="h-8 w-8 text-clinic-teal mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Resultados</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Ingresar y validar resultados</p>
            </Link>

            <Link
              href="/laboratorio/reactivos"
              className="rounded-lg border border-slate-200 p-6 hover:border-clinic-teal hover:shadow-lg transition-all dark:border-slate-700"
            >
              <TrendingUp className="h-8 w-8 text-clinic-teal mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Reactivos</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Gestión de reactivos e inventario</p>
            </Link>

            <Link
              href="/laboratorio/configuracion"
              className="rounded-lg border border-slate-200 p-6 hover:border-clinic-teal hover:shadow-lg transition-all dark:border-slate-700"
            >
              <AlertCircle className="h-8 w-8 text-clinic-teal mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Configuración</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Plantillas, perfiles y ajustes</p>
            </Link>
          </div>
        </div>
      </div>
    </LabShell>
  );
}
