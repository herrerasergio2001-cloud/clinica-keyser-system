'use client';

import { useEffect, useState } from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import { AppSidebar, ProtectedModule, UserMenu } from '../_components/session';

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type AuditEntry = {
  id: string;
  actorName?: string | null;
  actorEmail?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  after?: { reason?: string } | null;
  createdAt: string;
};

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const token = localStorage.getItem('accessToken');
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    const response = await fetch(`${apiBase}/api/audit?${params}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!response.ok) {
      setError('No se pudo cargar la auditoría');
      return;
    }
    const result = await response.json() as { data: AuditEntry[] };
    setEntries(result.data);
    setError('');
  }

  return (
    <ProtectedModule module="audit">
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="grid min-h-screen grid-cols-[260px_1fr] max-lg:grid-cols-1">
          <AppSidebar active="Auditoría" />
          <section className="min-w-0">
            <header className="border-b bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="mx-auto flex max-w-7xl items-center justify-between">
                <div><p className="text-xs font-semibold uppercase tracking-wide text-clinic-teal">Historial administrativo</p><h1 className="text-2xl font-semibold">Auditoría</h1></div>
                <UserMenu />
              </div>
            </header>
            <div className="mx-auto max-w-7xl space-y-4 p-5">
              <div className="flex gap-2 rounded-xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <label className="flex h-10 flex-1 items-center gap-2 rounded-md border px-3"><Search className="h-4 w-4" /><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void load(); }} placeholder="Usuario, correo, módulo o registro" className="w-full bg-transparent text-sm outline-none" /></label>
                <button onClick={() => void load()} className="rounded-md bg-clinic-teal px-4 text-sm font-semibold text-white">Buscar</button>
              </div>
              {error && <p className="rounded-md bg-red-50 p-3 text-red-800">{error}</p>}
              <div className="overflow-hidden rounded-xl border bg-white dark:border-slate-800 dark:bg-slate-900">
                <table className="w-full min-w-[780px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950"><tr><th className="p-3">Fecha</th><th className="p-3">Usuario</th><th className="p-3">Acción</th><th className="p-3">Recurso</th><th className="p-3">Motivo</th></tr></thead>
                  <tbody className="divide-y dark:divide-slate-800">
                    {entries.map((entry) => <tr key={entry.id}><td className="p-3">{new Date(entry.createdAt).toLocaleString('es-NI')}</td><td className="p-3">{entry.actorName ?? 'Usuario eliminado'}<p className="text-xs text-slate-500">{entry.actorEmail ?? '-'}</p></td><td className="p-3"><span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800"><ShieldCheck className="h-3 w-3" />{entry.action}</span></td><td className="p-3">{entry.entity}<p className="text-xs text-slate-500">{entry.entityId ?? '-'}</p></td><td className="max-w-sm p-3">{entry.after?.reason ?? '-'}</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </main>
    </ProtectedModule>
  );
}
