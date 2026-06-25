'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { FilePlus2, Search, Stethoscope } from 'lucide-react';
import { ClinicalShell, Field, SectionTitle } from './_components/clinical-shell';

import { authenticatedFetch } from '../_components/api-client';

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type RecordItem = {
  id: string;
  recordNumber: string;
  consultationDate: string;
  status: string;
  diagnosisText?: string | null;
  diagnoses?: Array<{ mainDiagnosis?: string | null }>;
  attachments?: unknown[];
  patient: { id: string; fullName: string; patientCode: string };
};

export default function MedicalRecordsPage() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
      void authenticatedFetch(`/api/medical-records${params}`)
        .then(async (response) => {
          if (!response.ok) throw new Error('No se pudieron cargar los expedientes');
          setRecords(await response.json());
          setError('');
        })
        .catch((err) => {
          setRecords([]);
          setError(err instanceof Error ? err.message : 'No se pudieron cargar los expedientes');
        });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const completed = useMemo(() => records.filter((record) => record.status === 'COMPLETED').length, [records]);
  const drafts = useMemo(() => records.filter((record) => record.status === 'DRAFT').length, [records]);
  const attachments = useMemo(() => records.reduce((total, record) => total + (record.attachments?.length ?? 0), 0), [records]);

  return (
    <ClinicalShell title="Expediente Clínico" subtitle="Listado y búsqueda de historias clínicas">
      <div className="grid gap-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex h-11 min-w-[280px] flex-1 items-center gap-2 rounded-md border border-slate-200 bg-white px-3">
            <Search className="h-4 w-4 text-slate-500" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Paciente, código o número de expediente" className="w-full bg-transparent text-sm outline-none" />
          </label>
          <Link href="/pacientes" className="inline-flex h-10 items-center gap-2 rounded-md bg-clinic-teal px-4 text-sm font-medium text-white">
            <FilePlus2 className="h-4 w-4" />
            Seleccionar paciente
          </Link>
        </div>

        {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <SectionTitle title="Expedientes recientes" icon={Stethoscope} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="py-3 pr-4">No.</th><th className="py-3 pr-4">Paciente</th><th className="py-3 pr-4">Fecha</th><th className="py-3 pr-4">Diagnóstico</th><th className="py-3 pr-4">Estado</th><th className="py-3 pr-4">Acción</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((record) => (
                  <tr key={record.id}>
                    <td className="py-3 pr-4 font-medium">{record.recordNumber}</td>
                    <td className="py-3 pr-4"><Link className="font-medium text-clinic-teal" href={`/expediente/${record.patient.id}`}>{record.patient.fullName}</Link><p className="text-xs text-slate-500">{record.patient.patientCode}</p></td>
                    <td className="py-3 pr-4">{new Date(record.consultationDate).toLocaleDateString('es-NI')}</td>
                    <td className="py-3 pr-4">{record.diagnosisText ?? record.diagnoses?.[0]?.mainDiagnosis ?? 'Pendiente'}</td>
                    <td className="py-3 pr-4"><span className="rounded bg-slate-100 px-2 py-1 text-xs">{record.status === 'COMPLETED' ? 'Completado' : 'Borrador'}</span></td>
                    <td className="py-3 pr-4"><Link className="text-clinic-teal" href={`/expediente/${record.patient.id}/${record.id}`}>Abrir</Link></td>
                  </tr>
                ))}
                {!records.length && <tr><td colSpan={6} className="py-8 text-center text-slate-500">No hay expedientes para mostrar.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-lg border border-slate-200 bg-white p-4"><Field label="Expedientes completados" value={String(completed)} /></article>
          <article className="rounded-lg border border-slate-200 bg-white p-4"><Field label="Pendientes de completar" value={String(drafts)} /></article>
          <article className="rounded-lg border border-slate-200 bg-white p-4"><Field label="Archivos adjuntos" value={String(attachments)} /></article>
        </section>
      </div>
    </ClinicalShell>
  );
}
