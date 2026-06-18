import { DocumentFormPage } from '../../../_components/medical-admin';

export default function Page({ params }: { params: { id: string } }) {
  return <DocumentFormPage kind="lab" initialPatientId={params.id} />;
}
