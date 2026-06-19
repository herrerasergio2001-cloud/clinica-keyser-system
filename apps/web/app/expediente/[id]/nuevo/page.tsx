import { SimplifiedClinicalRecord } from '../../_components/simplified-record';

export default function NewClinicalHistoryPage({ params }: { params: { id: string } }) {
  return <SimplifiedClinicalRecord patientId={params.id} startNew />;
}
