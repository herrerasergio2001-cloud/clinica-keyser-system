'use client';

import { PublicLayout } from '../layout';
import { usePublicData } from '../utils';
import { InteriorHero } from '../ui/interior-hero';
import { ServicesSection } from '../sections/services';

export function PublicServicesPage() {
  const data = usePublicData();
  return (
    <PublicLayout data={data}>
      <InteriorHero title="Servicios médicos" text="Especialidades y atención integral para cada etapa de la vida." />
      <ServicesSection services={data.services} />
    </PublicLayout>
  );
}
