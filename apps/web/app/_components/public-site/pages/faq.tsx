'use client';

import { PublicLayout } from '../layout';
import { usePublicData } from '../utils';
import { InteriorHero } from '../ui/interior-hero';
import { SimpleCards } from '../ui/simple-cards';

export function PublicFAQPage() {
  const data = usePublicData();
  return (
    <PublicLayout data={data}>
      <InteriorHero title="Preguntas frecuentes" text="Información útil antes de su visita." />
      <SimpleCards items={data.faqs.map((item) => ({ id: item.id, title: item.question, text: item.answer }))} />
    </PublicLayout>
  );
}
