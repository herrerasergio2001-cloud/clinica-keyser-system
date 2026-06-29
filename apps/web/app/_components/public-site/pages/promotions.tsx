'use client';

import { PublicLayout } from '../layout';
import { usePublicData } from '../utils';
import { InteriorHero } from '../ui/interior-hero';
import { SimpleCards } from '../ui/simple-cards';

export function PublicPromotionsPage() {
  const data = usePublicData();
  return (
    <PublicLayout data={data}>
      <InteriorHero title="Información de la clínica" text="Consulte campañas y novedades directamente con nuestro equipo." />
      <SimpleCards items={data.promotions.map((item) => ({ id: item.id, title: item.title, text: item.description }))} />
    </PublicLayout>
  );
}
