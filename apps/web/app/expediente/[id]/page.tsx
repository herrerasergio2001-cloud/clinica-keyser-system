import { SimplifiedClinicalRecord } from '../_components/simplified-record';

export default function PatientRecordDashboard({ params }: { params: { id: string } }) {
  return <SimplifiedClinicalRecord patientId={params.id} />;
}
