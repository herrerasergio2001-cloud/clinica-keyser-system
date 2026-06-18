import { UsersPage } from '../../_components/medical-admin';

export default function Page({ params }: { params: { id: string } }) {
  return <UsersPage mode="edit" userId={params.id} />;
}
