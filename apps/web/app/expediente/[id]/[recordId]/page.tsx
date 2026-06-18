"use client";

import { ExpedienteEditor } from '../../_components/expediente-editor';

export default function MedicalRecordDetail({ params }: { params: { id: string; recordId: string } }) {
  return <ExpedienteEditor patientId={params.id} recordId={params.recordId} mode="edit" />;
}
