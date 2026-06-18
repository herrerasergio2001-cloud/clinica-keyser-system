"use client";

import { ExpedienteEditor } from '../../_components/expediente-editor';

export default function NewClinicalHistoryPage({ params }: { params: { id: string } }) {
  return <ExpedienteEditor patientId={params.id} mode="new" />;
}
