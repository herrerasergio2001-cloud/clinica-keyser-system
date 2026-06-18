import { ProductFormPage } from '../../_components/pharmacy-client';

export default function Page({ params }: { params: { id: string } }) {
  return <ProductFormPage id={params.id} />;
}
