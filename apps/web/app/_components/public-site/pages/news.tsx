'use client';

import { PublicLayout } from '../layout';
import { usePublicData } from '../utils';
import { InteriorHero } from '../ui/interior-hero';
import { SimpleCards } from '../ui/simple-cards';

export function PublicNewsPage() {
  const data = usePublicData();
  return (
    <PublicLayout data={data}>
      <InteriorHero title="Noticias" text="Información reciente de Clínica Keyser." />
      <SimpleCards items={data.news.map((item) => ({ id: item.id, title: item.title, text: item.description }))} />
    </PublicLayout>
  );
}
