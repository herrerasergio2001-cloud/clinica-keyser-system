import { PatientPrintPage } from '../../../_components/medical-admin';

export default function Page({ params }: { params: { id: string } }) {
  return <PatientPrintPage patientId={params.id} />;
}
