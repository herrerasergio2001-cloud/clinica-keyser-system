import { SimplifiedClinicalRecord } from '../../_components/simplified-record';

export default function MedicalRecordDetail({ params }: { params: { id: string; recordId: string } }) {
  return <SimplifiedClinicalRecord patientId={params.id} recordId={params.recordId} />;
}
