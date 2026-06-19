'use client';

import { FormEvent, useEffect, useState } from 'react';
import { BookOpenText, Edit3, Printer, Save, Search, ShieldAlert, XCircle } from 'lucide-react';
import { AppSidebar, ProtectedModule, UserMenu, decodeSession } from '../_components/session';

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type DigitalPrescription = {
  id: string;
  code: string;
  patientName: string;
  patientAge?: string | null;
  diagnosis?: string | null;
  indications?: string | null;
  medications: string[];
  studies: string[];
  doctorName: string;
  doctorCode: string;
  status: string;
  version: number;
  voidReason?: string | null;
  createdAt: string;
  versions?: Array<{ id: string; version: number; changeReason: string; createdAt: string }>;
};

const emptyForm = {
  patientName: '',
  patientAge: '',
  diagnosis: '',
  indications: '',
  medications: '',
  studies: '',
};

function headers(json = true): HeadersInit {
  const token = localStorage.getItem('accessToken');
  return { ...(json ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function request<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(`${apiBase}${path}`, options);
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: 'No se pudo completar la acción' }));
    throw new Error(Array.isArray(body.message) ? body.message.join(', ') : body.message);
  }
  return response.json() as Promise<T>;
}

export default function DigitalPrescriptionPage() {
  const session = decodeSession();
  const canWrite = session?.role === 'SUPER_ADMIN' || session?.role === 'DOCTOR';
  const [items, setItems] = useState<DigitalPrescription[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<DigitalPrescription | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'VOIDED' | 'ALL'>('ACTIVE');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
  }, [status]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ status });
      if (search.trim()) params.set('search', search.trim());
      const result = await request<{ data: DigitalPrescription[] }>(`/api/digital-prescriptions?${params}`, { headers: headers(false) });
      setItems(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el talonario');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(item: DigitalPrescription) {
    setEditing(item);
    setForm({
      patientName: item.patientName,
      patientAge: item.patientAge ?? '',
      diagnosis: item.diagnosis ?? '',
      indications: item.indications ?? '',
      medications: (item.medications ?? []).join('\n'),
      studies: (item.studies ?? []).join('\n'),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setError('');
    const payload = {
      ...form,
      medications: form.medications.split('\n').map((item) => item.trim()).filter(Boolean),
      studies: form.studies.split('\n').map((item) => item.trim()).filter(Boolean),
    };
    try {
      if (editing) {
        const changeReason = window.prompt('Motivo de la modificación. La versión anterior quedará guardada:');
        if (!changeReason?.trim()) return;
        await request(`/api/digital-prescriptions/${editing.id}`, {
          method: 'PATCH',
          headers: headers(),
          body: JSON.stringify({ ...payload, changeReason }),
        });
        setMessage('Receta actualizada. La versión anterior quedó registrada.');
      } else {
        await request('/api/digital-prescriptions', { method: 'POST', headers: headers(), body: JSON.stringify(payload) });
        setMessage('Receta guardada correctamente.');
      }
      setEditing(null);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la receta');
    }
  }

  async function voidPrescription(item: DigitalPrescription) {
    if (!window.confirm(`¿Anular la receta ${item.code}? Permanecerá visible en auditoría.`)) return;
    const reason = window.prompt('Motivo de anulación:');
    if (!reason?.trim()) return;
    try {
      await request(`/api/digital-prescriptions/${item.id}/void`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ reason }),
      });
      setMessage('Receta anulada y registrada en auditoría.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo anular la receta');
    }
  }

  async function printPrescription(item: DigitalPrescription) {
    try {
      const response = await fetch(`${apiBase}/api/digital-prescriptions/${item.id}/pdf`, { headers: headers(false) });
      if (!response.ok) throw new Error('No se pudo generar el PDF');
      const url = URL.createObjectURL(await response.blob());
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo imprimir');
    }
  }

  return (
    <ProtectedModule module="digitalPrescriptions">
      <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
        <div className="grid min-h-screen grid-cols-[260px_1fr] max-lg:grid-cols-1">
          <AppSidebar active="Recetario Digital" />
          <section className="min-w-0">
            <header className="border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-clinic-teal">Documento independiente</p>
                  <h1 className="text-2xl font-semibold">Recetario Digital</h1>
                  <p className="text-sm text-slate-500">Recetas rápidas sin crear expediente de paciente.</p>
                </div>
                <UserMenu />
              </div>
            </header>
            <div className="mx-auto grid max-w-7xl gap-5 p-5 xl:grid-cols-[420px_1fr]">
              {canWrite && (
                <form onSubmit={save} className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <h2 className="mb-4 flex items-center gap-2 font-semibold"><BookOpenText className="h-5 w-5 text-clinic-teal" />{editing ? `Editar ${editing.code}` : 'Nueva receta'}</h2>
                  <div className="grid gap-3">
                    <Field label="Nombre del paciente" value={form.patientName} onChange={(value) => setForm({ ...form, patientName: value })} required />
                    <Field label="Edad" value={form.patientAge} onChange={(value) => setForm({ ...form, patientAge: value })} />
                    <Area label="Diagnóstico" value={form.diagnosis} onChange={(value) => setForm({ ...form, diagnosis: value })} />
                    <Area label="Medicamentos (uno por línea)" value={form.medications} onChange={(value) => setForm({ ...form, medications: value })} />
                    <Area label="Estudios (uno por línea)" value={form.studies} onChange={(value) => setForm({ ...form, studies: value })} />
                    <Area label="Indicaciones" value={form.indications} onChange={(value) => setForm({ ...form, indications: value })} />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button className="inline-flex h-10 items-center gap-2 rounded-md bg-clinic-teal px-4 text-sm font-semibold text-white"><Save className="h-4 w-4" />Guardar</button>
                    {editing && <button type="button" onClick={() => { setEditing(null); setForm(emptyForm); }} className="h-10 rounded-md border px-4 text-sm">Cancelar</button>}
                  </div>
                </form>
              )}

              <section className="space-y-4">
                {(message || error) && <div className={`rounded-md border p-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-teal-200 bg-teal-50 text-teal-900'}`}>{error || message}</div>}
                <div className="flex flex-wrap gap-2 rounded-xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <label className="flex h-10 min-w-[240px] flex-1 items-center gap-2 rounded-md border px-3"><Search className="h-4 w-4" /><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void load(); }} placeholder="Paciente, código, médico o diagnóstico" className="w-full bg-transparent text-sm outline-none" /></label>
                  <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="h-10 rounded-md border bg-white px-3 text-sm dark:bg-slate-950">
                    <option value="ACTIVE">Activas</option>
                    <option value="VOIDED">Anuladas</option>
                    <option value="ALL">Todas</option>
                  </select>
                  <button onClick={() => void load()} className="h-10 rounded-md border px-4 text-sm font-semibold">Buscar</button>
                </div>
                {loading ? <p className="p-5 text-sm text-slate-500">Cargando historial...</p> : items.length === 0 ? <p className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">No hay recetas para este filtro.</p> : (
                  <div className="grid gap-3">
                    {items.map((item) => (
                      <article key={item.id} className="rounded-xl border bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2"><strong>{item.code}</strong><span className={`rounded-full px-2 py-0.5 text-xs ${item.status === 'ACTIVE' ? 'bg-teal-50 text-teal-800' : 'bg-red-50 text-red-800'}`}>{item.status === 'ACTIVE' ? 'Activa' : 'Anulada'}</span></div>
                            <h3 className="mt-1 text-lg font-semibold">{item.patientName}</h3>
                            <p className="text-sm text-slate-500">{new Date(item.createdAt).toLocaleString('es-NI')} · {item.doctorName} · {item.doctorCode}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => void printPrescription(item)} className="rounded-md border p-2" title="Imprimir"><Printer className="h-4 w-4" /></button>
                            {canWrite && item.status === 'ACTIVE' && <button onClick={() => startEdit(item)} className="rounded-md border p-2" title="Editar con historial"><Edit3 className="h-4 w-4" /></button>}
                            {canWrite && item.status === 'ACTIVE' && <button onClick={() => void voidPrescription(item)} className="rounded-md border border-red-200 p-2 text-red-700" title="Anular"><XCircle className="h-4 w-4" /></button>}
                          </div>
                        </div>
                        {item.diagnosis && <p className="mt-3 text-sm"><strong>Diagnóstico:</strong> {item.diagnosis}</p>}
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <List title="Medicamentos" items={item.medications ?? []} />
                          <List title="Estudios" items={item.studies ?? []} />
                        </div>
                        {item.indications && <p className="mt-3 whitespace-pre-wrap text-sm"><strong>Indicaciones:</strong> {item.indications}</p>}
                        <p className="mt-3 flex items-center gap-1 text-xs text-slate-500"><ShieldAlert className="h-3.5 w-3.5" />Versión {item.version}{item.versions?.length ? ` · ${item.versions.length} versión(es) anterior(es) conservada(s)` : ''}</p>
                        {item.voidReason && <p className="mt-2 rounded-md bg-red-50 p-2 text-sm text-red-800">Motivo de anulación: {item.voidReason}</p>}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </section>
        </div>
      </main>
    </ProtectedModule>
  );
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return <label className="grid gap-1 text-sm font-medium">{label}<input required={required} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md border bg-white px-3 dark:bg-slate-950" /></label>;
}

function Area({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1 text-sm font-medium">{label}<textarea rows={3} value={value} onChange={(event) => onChange(event.target.value)} className="rounded-md border bg-white px-3 py-2 dark:bg-slate-950" /></label>;
}

function List({ title, items }: { title: string; items: string[] }) {
  return <div className="rounded-md bg-slate-50 p-3 text-sm dark:bg-slate-950"><strong>{title}</strong>{items.length ? <ol className="mt-1 list-decimal pl-5">{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ol> : <p className="mt-1 text-slate-500">Sin registros</p>}</div>;
}
