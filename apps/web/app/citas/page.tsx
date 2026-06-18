'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, Home, Save } from 'lucide-react';
import { MasterActionMenu } from '../_components/master-action-menu';
import { AppSidebar, ProtectedModule, UserMenu } from '../_components/session';

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type Patient = { id: string; fullName: string; patientCode: string; appointments?: Appointment[] };
type Doctor = { id: string; fullName: string; doctorProfile?: { fullName?: string; minsaCode?: string } | null };
type Appointment = { id: string; startsAt: string; endsAt?: string; reason?: string; status: string; patient?: Patient };

function authHeaders(json = false): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  return { ...(json ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, options);
  if (response.status === 401) {
    window.location.href = '/login?next=/citas';
    throw new Error('Sesión expirada');
  }
  if (!response.ok) throw new Error(await response.text().catch(() => 'No se pudo completar la acción'));
  return response.json() as Promise<T>;
}

export default function CitasPage() {
  return <Suspense fallback={<main className="p-6 text-sm text-slate-500">Cargando citas...</main>}><CitasClient /></Suspense>;
}

function CitasClient() {
  const router = useRouter();
  const params = useSearchParams();
  const initialPatientId = params.get('patientId') ?? '';
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    patientId: initialPatientId,
    doctorId: '',
    date: new Date().toISOString().slice(0, 10),
    time: '09:00',
    service: 'Consulta médica',
    status: 'SCHEDULED',
    observations: '',
  });

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      router.replace('/login?next=/citas');
      return;
    }
    void Promise.all([
      api<{ data?: Patient[] } | Patient[]>('/api/patients', { headers: authHeaders() }),
      api<Doctor[]>('/api/doctors', { headers: authHeaders() }),
    ]).then(([p, d]) => {
      const list = Array.isArray(p) ? p : p.data ?? [];
      setPatients(list);
      setDoctors(d);
      setForm((current) => ({
        ...current,
        patientId: current.patientId || list[0]?.id || '',
        doctorId: current.doctorId || d[0]?.id || '',
      }));
    }).catch((error) => setMessage(error instanceof Error ? error.message : 'No se pudieron cargar los datos'));
  }, [router]);

  const recentAppointments = useMemo(() => patients.flatMap((patient) => (patient.appointments ?? []).map((item) => ({ ...item, patient }))).sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()).slice(0, 12), [patients]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!form.patientId || !form.doctorId || !form.date || !form.time || !form.service.trim()) {
      setMessage('Seleccione paciente, médico, fecha, hora y servicio.');
      return;
    }
    const startsAt = new Date(`${form.date}T${form.time}:00`);
    const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000);
    setSaving(true);
    setMessage('Guardando cita...');
    try {
      await api(`/api/patients/${form.patientId}/appointments`, {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({ doctorId: form.doctorId, startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), reason: `${form.service}${form.observations ? ` - ${form.observations}` : ''}`, status: form.status }),
      });
      setMessage('Cita creada correctamente');
      window.setTimeout(() => window.location.reload(), 600);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar la cita');
    } finally {
      setSaving(false);
    }
  }

  const actions = [
    { label: 'Nueva cita', icon: CalendarDays, onClick: () => document.getElementById('formulario-cita')?.scrollIntoView({ behavior: 'smooth' }) },
  ];

  return (
    <ProtectedModule module="appointments">
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <div className="grid min-h-screen grid-cols-[260px_1fr] max-lg:grid-cols-1">
      <AppSidebar active="Citas" />
      <section className="min-w-0">
      <header className="border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
              <Link href="/panel" className="inline-flex items-center gap-1 text-clinic-teal"><Home className="h-3.5 w-3.5" />Inicio</Link>
              <span>/</span><span>Citas</span>
            </div>
            <h1 className="text-2xl font-semibold">Citas</h1>
          </div>
          <div className="flex items-center gap-2">
            <UserMenu />
            <button type="button" onClick={() => router.back()} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm dark:border-slate-700"><ArrowLeft className="h-4 w-4" />Regresar</button>
          </div>
        </div>
      </header>

      <div className="grid gap-5 p-6 xl:grid-cols-[420px_1fr]">
        <form id="formulario-cita" onSubmit={save} className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 font-semibold">Nueva cita</h2>
          {message && <p className="mb-3 rounded-md bg-teal-50 p-3 text-sm text-teal-900 dark:bg-teal-950 dark:text-teal-100">{message}</p>}
          <div className="grid gap-3">
            <Select label="Paciente" value={form.patientId} onChange={(value) => setForm({ ...form, patientId: value })} options={patients.map((p) => [p.id, `${p.fullName} · ${p.patientCode}`])} />
            <Select label="Médico" value={form.doctorId} onChange={(value) => setForm({ ...form, doctorId: value })} options={doctors.map((d) => [d.id, d.doctorProfile?.fullName ?? d.fullName])} />
            <Input label="Fecha" type="date" value={form.date} onChange={(value) => setForm({ ...form, date: value })} />
            <Input label="Hora" type="time" value={form.time} onChange={(value) => setForm({ ...form, time: value })} />
            <Input label="Servicio" value={form.service} onChange={(value) => setForm({ ...form, service: value })} />
            <Select label="Estado" value={form.status} onChange={(value) => setForm({ ...form, status: value })} options={[['SCHEDULED', 'Programada'], ['CONFIRMED', 'Confirmada'], ['WAITING', 'En espera'], ['COMPLETED', 'Atendida'], ['CANCELLED', 'Cancelada']]} />
            <label className="grid gap-1 text-sm font-medium">Observaciones<textarea value={form.observations} onChange={(event) => setForm({ ...form, observations: event.target.value })} className="rounded-md border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" /></label>
          </div>
          <button disabled={saving} className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-clinic-teal px-4 text-sm font-semibold text-white disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Guardando...' : 'Guardar cita'}</button>
        </form>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 font-semibold">Citas recientes</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {recentAppointments.map((item) => <article key={item.id} className="rounded-lg border border-slate-200 p-4 text-sm dark:border-slate-700"><strong>{item.patient?.fullName}</strong><p className="text-slate-500">{new Date(item.startsAt).toLocaleString('es-NI')} · {statusLabel(item.status)}</p><p className="mt-2">{item.reason ?? 'Consulta'}</p></article>)}
            {!recentAppointments.length && <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-950">No hay citas recientes registradas.</p>}
          </div>
        </section>
      </div>
      </section>
      </div>
      <MasterActionMenu actions={actions} />
    </main>
    </ProtectedModule>
  );
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="grid gap-1 text-sm font-medium">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" /></label>;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) {
  return <label className="grid gap-1 text-sm font-medium">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"><option value="">Seleccione</option>{options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></label>;
}

function statusLabel(status: string) {
  return ({ SCHEDULED: 'Programada', CONFIRMED: 'Confirmada', WAITING: 'En espera', COMPLETED: 'Atendida', CANCELLED: 'Cancelada' } as Record<string, string>)[status] ?? status;
}
