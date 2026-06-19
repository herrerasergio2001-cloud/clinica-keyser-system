"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, ArrowRight, CalendarDays, ClipboardList, FileSignature, FlaskConical, Home as HomeIcon, PackageSearch, Pill, TestTube2, UsersRound } from 'lucide-react';
import { MasterActionMenu } from '../_components/master-action-menu';
import { AppSidebar, ProtectedModule, UserMenu, canAccess, useSession } from '../_components/session';

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function Home() {
  const router = useRouter();
  const user = useSession();
  const [patients, setPatients] = useState<any[]>([]);
  const [pharmacy, setPharmacy] = useState<any>();
  const [lab, setLab] = useState<any>();

  useEffect(() => {
    void fetch(`${apiBase}/api/patients`, { headers: authHeaders() }).then((res) => (res.ok ? res.json() : { data: [] })).then((data) => setPatients(data.data ?? [])).catch(() => setPatients([]));
    void fetch(`${apiBase}/api/pharmacy/dashboard`, { headers: authHeaders() }).then((res) => (res.ok ? res.json() : undefined)).then(setPharmacy).catch(() => undefined);
    void fetch(`${apiBase}/api/laboratory/dashboard`, { headers: authHeaders() }).then((res) => (res.ok ? res.json() : undefined)).then(setLab).catch(() => undefined);
  }, []);

  const latestRecords = useMemo(() => patients.flatMap((patient) => (patient.medicalRecords ?? []).map((record: any) => ({ ...record, patient }))).slice(0, 3), [patients]);
  const latestEvolutions = useMemo(() => latestRecords.flatMap((record) => (record.evolutionNotes ?? []).map((note: any) => ({ ...note, patient: record.patient }))).slice(0, 3), [latestRecords]);

  const metrics = [
    ['Pacientes registrados', patients.length, UsersRound],
    ['Expedientes recientes', latestRecords.length, Activity],
    ['Órdenes pendientes', lab?.urgent ?? '...', ClipboardList],
    ['Resultados listos', lab?.recent?.filter((order: any) => order.status === 'COMPLETED').length ?? '...', TestTube2],
    ['Productos por vencer', pharmacy?.expiring?.length ?? '...', Pill],
    ['Reactivos por vencer', lab?.reagents?.length ?? '...', FlaskConical],
    ['Stock bajo', pharmacy?.lowStock ?? '...', PackageSearch],
    ['Últimas evoluciones', latestEvolutions.length, Activity],
  ];
  const panelActions = [
    canAccess(user?.role, 'patients') && { label: 'Nuevo paciente', icon: UsersRound, onClick: () => router.push('/pacientes?nuevo=1') },
    canAccess(user?.role, 'appointments') && { label: 'Nueva cita', icon: CalendarDays, onClick: () => router.push('/citas?nueva=1') },
    canAccess(user?.role, 'prescriptions') && { label: 'Nueva receta', icon: FileSignature, onClick: () => router.push('/recetas/nueva') },
    canAccess(user?.role, 'laboratory') && { label: 'Nueva orden laboratorio', icon: ClipboardList, onClick: () => router.push('/laboratorio/ordenes/nueva') },
    ['SUPER_ADMIN', 'DOCTOR'].includes(user?.role ?? '') && { label: 'Nuevo documento', icon: FileSignature, onClick: () => router.push('/documentos/certificados/nuevo') },
    canAccess(user?.role, 'pharmacy') && { label: 'Nueva venta', icon: PackageSearch, onClick: () => router.push('/farmacia/venta') },
  ].filter(Boolean) as any[];

  return (
    <ProtectedModule module="panel">
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <div className="grid min-h-screen grid-cols-[260px_1fr] max-lg:grid-cols-1">
        <AppSidebar active="Panel principal" />

        <section className="flex min-w-0 flex-col">
          <header className="border-b border-slate-200 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
                  <HomeIcon className="h-3.5 w-3.5 text-clinic-teal" />
                  <span>Inicio</span>
                  <span>/</span>
                  <span>Panel principal</span>
                </div>
                <h2 className="text-2xl font-semibold">Panel principal</h2>
              </div>
              <UserMenu />
            </div>
          </header>

          <div className="grid gap-5 p-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {metrics.map(([label, value, Icon]) => (
                <article key={String(label)} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <Icon className="mb-3 h-5 w-5 text-clinic-teal" />
                  <p className="text-sm text-slate-500">{label as string}</p>
                  <strong className="mt-2 block text-2xl font-semibold">{String(value)}</strong>
                </article>
              ))}
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-semibold">Actividad clínica reciente</h3>
                  <Link href="/expediente" className="inline-flex items-center gap-1 text-sm font-medium text-clinic-teal">Ver expedientes <ArrowRight className="h-4 w-4" /></Link>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {latestRecords.map((record: any) => (
                    <Link key={record.id} href={record.patient?.id ? `/expediente/${record.patient.id}/${record.id}` : '/expediente'} className="flex items-center justify-between gap-3 py-3 text-sm hover:text-clinic-teal">
                      <span className="min-w-0 truncate">{record.patient?.fullName} · {record.reasonForVisit ?? 'Consulta clínica'}</span>
                      <span className="shrink-0 rounded bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">Reciente</span>
                    </Link>
                  ))}
                  {!latestRecords.length && <p className="py-5 text-sm text-slate-500">No hay actividad clínica registrada.</p>}
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-base font-semibold">Alertas operativas</h3>
                <div className="mt-4 space-y-3 text-sm">
                  <AlertLine tone="red" text={`${pharmacy?.expiring?.length ?? 0} productos por vencer en farmacia.`} href="/farmacia/vencimientos" />
                  <AlertLine tone="amber" text={`${pharmacy?.lowStock ?? 0} productos con stock bajo.`} href="/farmacia/inventario" />
                  <AlertLine tone="teal" text={`${lab?.reagents?.length ?? 0} reactivos requieren revisión.`} href="/laboratorio/vencimientos" />
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>
      <MasterActionMenu actions={panelActions} />
    </main>
    </ProtectedModule>
  );
}

function AlertLine({ text, href, tone }: { text: string; href: string; tone: 'red' | 'amber' | 'teal' }) {
  const styles = {
    red: 'border-red-400 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100',
    amber: 'border-amber-400 bg-amber-50 text-amber-950 dark:bg-amber-950 dark:text-amber-100',
    teal: 'border-clinic-teal bg-teal-50 text-teal-950 dark:bg-teal-950 dark:text-teal-100',
  };
  return <Link href={href} className={`block rounded-md border-l-4 p-3 ${styles[tone]}`}>{text}</Link>;
}
