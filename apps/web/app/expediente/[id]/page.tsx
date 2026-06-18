"use client";

import { ExpedienteEditor } from '../_components/expediente-editor';

export default function PatientRecordDashboard({ params }: { params: { id: string } }) {
  return <ExpedienteEditor patientId={params.id} mode="dashboard" />;
}
