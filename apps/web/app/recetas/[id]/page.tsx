import { PrescriptionDetailPage } from '../../_components/medical-admin';

export default function Page({ params }: { params: { id: string } }) {
  return <PrescriptionDetailPage id={params.id} />;
}
