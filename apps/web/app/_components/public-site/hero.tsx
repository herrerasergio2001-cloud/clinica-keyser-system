import { ArrowRight, MessageCircle } from 'lucide-react';
import type { Settings } from './types';
import { mediaUrl, whatsappUrl } from './utils';
import { AppointmentLink } from './ui/appointment-link';

export function Hero({ settings }: { settings: Settings }) {
  const heroImage = mediaUrl(settings.heroImageUrl) || '/clinic-media/fachada.jpg';
  const heroVideo = mediaUrl(settings.heroVideoUrl);

  return (
    <section className="relative min-h-[calc(100svh-76px)] overflow-hidden bg-[#101827]">
      {heroVideo ? (
        <video autoPlay muted loop playsInline poster={heroImage} className="absolute inset-0 h-full w-full object-cover">
          <source src={heroVideo} />
        </video>
      ) : (
        <img src={heroImage} alt="Fachada de Clínica Keyser" className="absolute inset-0 h-full w-full object-cover object-center" />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,16,31,.86)_0%,rgba(9,16,31,.58)_46%,rgba(9,16,31,.18)_100%)]" />
      <div className="relative mx-auto flex min-h-[calc(100svh-76px)] max-w-[1440px] items-end px-5 pb-16 pt-24 sm:items-center sm:pb-24 lg:px-10">
        <div className="max-w-3xl text-white">
          <h1 className="font-display text-5xl font-medium leading-[.96] tracking-[-0.035em] sm:text-7xl lg:text-[92px]">{settings.clinicName}</h1>
          <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-white/88 sm:text-2xl">{settings.slogan}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <AppointmentLink settings={settings} className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#1f2f66] transition hover:bg-slate-100">
              Agendar cita <ArrowRight className="h-4 w-4" />
            </AppointmentLink>
            <a href={whatsappUrl(settings)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/55 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
