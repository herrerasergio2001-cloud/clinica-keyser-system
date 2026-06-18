import { ResultPage } from '../../_components/lab-client';

export default function Page({ params }: { params: { id: string } }) {
  return <ResultPage orderId={params.id} />;
}
