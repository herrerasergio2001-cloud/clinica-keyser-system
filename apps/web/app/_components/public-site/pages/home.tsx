'use client';

import { Hero } from '../hero';
import { PublicLayout } from '../layout';
import { usePublicData } from '../utils';
import { InstitutionalSection } from '../sections/institutional';
import { ServicesSection } from '../sections/services';
import { ProceduresGallery } from '../sections/procedures';
import { PricingPlans } from '../sections/pricing';
import { GallerySection } from '../sections/gallery';
import { TeamSection } from '../sections/team';
import { BookingForm } from '../sections/booking-form';
import { ContactSection } from '../sections/contact';
import { SocialSection } from '../sections/social';

export function PublicHome() {
  const data = usePublicData();
  return (
    <PublicLayout data={data}>
      <Hero settings={data.settings} />
      <InstitutionalSection settings={data.settings} />
      <ServicesSection services={data.services} />
      <ProceduresGallery />
      <PricingPlans />
      <GallerySection gallery={data.gallery} />
      <TeamSection team={data.team} />
      <BookingForm />
      <ContactSection settings={data.settings} />
      <SocialSection settings={data.settings} />
    </PublicLayout>
  );
}
