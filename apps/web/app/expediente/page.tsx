"use client";

import Link from 'next/link';
import { FilePlus2, Stethoscope } from 'lucide-react';
import { ClinicalShell, Field, SectionTitle } from './_components/clinical-shell';
import { samplePatient, sampleRecord } from './_components/sample-data';

const records = [
  { ...sampleRecord, patient: samplePatient },
  {
    id: 'demo-record-2',
    recordNumber: 'EXP-000002',
    consultationDate: '2026-05-10',
    status: 'Borrador',
    reasonForVisit: 'Control general',
    chiefComplaint: 'Seguimiento medico',
    diagnosis: 'Observacion clinica',
    icd10: 'Z00.0',
    patient: { ...samplePatient, id: 'demo-patient-2', fullName: 'Jose Ricardo Martinez', patientCode: 'CK-000002', phone: '+505 8777 3333' },
  },
];

export default function MedicalRecordsPage() {
  return (
    <ClinicalShell title="Expediente Clinico" subtitle="Listado y busqueda de historias clinicas">
      <div className="grid gap-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-600">Consulta expedientes por paciente, codigo o numero de expediente.</p>
          </div>
          <Link href="/expediente/demo-patient/nuevo" className="inline-flex h-10 items-center gap-2 rounded-md bg-clinic-teal px-4 text-sm font-medium text-white">
            <FilePlus2 className="h-4 w-4" />
            Nuevo expediente
          </Link>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <SectionTitle title="Expedientes recientes" icon={Stethoscope} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-3 pr-4">No.</th>
                  <th className="py-3 pr-4">Paciente</th>
                  <th className="py-3 pr-4">Fecha</th>
                  <th className="py-3 pr-4">Diagnostico</th>
                  <th className="py-3 pr-4">Estado</th>
                  <th className="py-3 pr-4">Accion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((record) => (
                  <tr key={record.id}>
                    <td className="py-3 pr-4 font-medium">{record.recordNumber}</td>
                    <td className="py-3 pr-4">
                      <Link className="font-medium text-clinic-teal" href={`/expediente/${record.patient.id}`}>
                        {record.patient.fullName}
                      </Link>
                      <p className="text-xs text-slate-500">{record.patient.patientCode}</p>
                    </td>
                    <td className="py-3 pr-4">{record.consultationDate}</td>
                    <td className="py-3 pr-4">{record.diagnosis}</td>
                    <td className="py-3 pr-4"><span className="rounded bg-slate-100 px-2 py-1 text-xs">{record.status}</span></td>
                    <td className="py-3 pr-4">
                      <Link className="text-clinic-teal" href={`/expediente/${record.patient.id}/${record.id}`}>Abrir</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <Field label="Expedientes activos" value="2" />
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <Field label="Pendientes de completar" value="1" />
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <Field label="Archivos adjuntos" value="0" />
          </article>
        </section>
      </div>
    </ClinicalShell>
  );
}
