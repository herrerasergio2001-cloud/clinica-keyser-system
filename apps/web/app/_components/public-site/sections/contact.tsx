import { CalendarDays, Clock3, MapPin, MessageCircle, Phone } from 'lucide-react';
import type { Settings } from '../types';
import { cleanPhone, whatsappUrl } from '../utils';
import { AppointmentLink } from '../ui/appointment-link';
import { ContactLine } from '../ui/contact-line';
import { SectionLabel } from '../ui/section-label';

export function ContactSection({ settings }: { settings: Settings }) {
  const mapUrl = settings.mapEmbedUrl?.trim() || `https://www.google.com/maps?q=${encodeURIComponent(settings.address)}&output=embed`;
  return (
    <section id="contacto" className="scroll-mt-24 px-5 py-20 sm:py-28 lg:px-10">
      <div className="mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-[.78fr_1.22fr] lg:gap-16">
        <div>
          <SectionLabel>Contacto</SectionLabel>
          <h2 className="font-display mt-5 text-4xl font-medium tracking-[-0.025em] text-[#17234c] sm:text-5xl">Será un gusto atenderle.</h2>
          <div className="mt-9 divide-y divide-slate-200 border-y border-slate-200">
            <ContactLine icon={<MapPin />} label="Dirección" value={settings.address} />
            <ContactLine icon={<Phone />} label="Teléfono" value={settings.primaryPhone} href={`tel:${cleanPhone(settings.primaryPhone)}`} />
            <ContactLine icon={<MessageCircle />} label="WhatsApp" value={settings.whatsapp} href={whatsappUrl(settings)} external />
            <ContactLine icon={<Clock3 />} label="Horario" value={settings.schedule} />
          </div>
          <AppointmentLink settings={settings} className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#1f2f66] px-6 py-3.5 text-sm font-semibold text-white">
            Agendar cita <CalendarDays className="h-4 w-4" />
          </AppointmentLink>
        </div>
        <div className="min-h-[440px] overflow-hidden bg-slate-100">
          <iframe title="Mapa de Clínica Keyser" src={mapUrl} className="h-full min-h-[440px] w-full border-0 grayscale-[.2]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </div>
      </div>
    </section>
  );
}
