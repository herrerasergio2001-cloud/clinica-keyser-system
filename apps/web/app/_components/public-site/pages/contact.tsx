'use client';

import { PublicLayout } from '../layout';
import { usePublicData } from '../utils';
import { InteriorHero } from '../ui/interior-hero';
import { ContactSection } from '../sections/contact';

export function PublicContactPage() {
  const data = usePublicData();
  return (
    <PublicLayout data={data}>
      <InteriorHero title="Contacto" text="Estamos en Chinandega y será un gusto atenderle." />
      <ContactSection settings={data.settings} />
    </PublicLayout>
  );
}
