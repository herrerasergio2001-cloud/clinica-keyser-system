'use client';

import { Hero } from '../hero';
import { PublicLayout } from '../layout';
import { usePublicData } from '../utils';
import { InstitutionalSection } from '../sections/institutional';
import { ServicesSection } from '../sections/services';
import { GallerySection } from '../sections/gallery';
import { TeamSection } from '../sections/team';
import { ContactSection } from '../sections/contact';
import { SocialSection } from '../sections/social';

export function PublicHome() {
  const data = usePublicData();
  return (
    <PublicLayout data={data}>
      <Hero settings={data.settings} />
      <InstitutionalSection settings={data.settings} />
      <ServicesSection services={data.services} />
      <GallerySection gallery={data.gallery} />
      <TeamSection team={data.team} />
      <ContactSection settings={data.settings} />
      <SocialSection settings={data.settings} />
    </PublicLayout>
  );
}
