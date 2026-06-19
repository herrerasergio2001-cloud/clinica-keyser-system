'use client';

import Link from 'next/link';
import { ReactNode, useEffect, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Facebook,
  Instagram,
  LockKeyhole,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  ShieldCheck,
  Stethoscope,
  X,
} from 'lucide-react';

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type Settings = {
  clinicName: string;
  slogan: string;
  logoUrl?: string | null;
  heroImageUrl?: string | null;
  heroVideoUrl?: string | null;
  institutionalText: string;
  institutionalImageUrl?: string | null;
  primaryPhone: string;
  aestheticPhone: string;
  whatsapp: string;
  address: string;
  schedule: string;
  mapEmbedUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  aestheticFacebookUrl?: string | null;
  aestheticInstagramUrl?: string | null;
  aestheticTiktokUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
};

type PublicService = {
  id: string;
  title: string;
  slug: string;
  description: string;
  content?: string | null;
  icon?: string | null;
  imageUrl?: string | null;
  category?: string | null;
  whatsappText?: string | null;
  isActive: boolean;
  sortOrder: number;
};

type PublicGalleryImage = {
  id: string;
  title: string;
  altText: string;
  imageUrl: string;
  category?: string | null;
  isActive: boolean;
  sortOrder: number;
};

type PublicTeamMember = {
  id: string;
  name: string;
  specialty: string;
  description: string;
  imageUrl?: string | null;
  isActive: boolean;
  sortOrder: number;
};

type PublicPromotion = {
  id: string;
  title: string;
  slug: string;
  description: string;
  imageUrl?: string | null;
  category?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

type PublicNews = {
  id: string;
  title: string;
  slug: string;
  description: string;
  imageUrl?: string | null;
  category?: string | null;
  publishedAt?: string | null;
};

type PublicFAQ = {
  id: string;
  question: string;
  answer: string;
};

type PublicData = {
  settings: Settings;
  services: PublicService[];
  gallery: PublicGalleryImage[];
  team: PublicTeamMember[];
  promotions: PublicPromotion[];
  news: PublicNews[];
  faqs: PublicFAQ[];
};

const fallbackSettings: Settings = {
  clinicName: 'Clínica Keyser',
  slogan: 'Atención médica integral en Chinandega.',
  logoUrl: '/clinic-media/logo.png',
  heroImageUrl: '/clinic-media/fachada.jpg',
  heroVideoUrl: '',
  institutionalText: 'Cuidamos de cada paciente con atención cercana, criterio médico y el respaldo de un equipo comprometido con su bienestar.',
  institutionalImageUrl: '/clinic-media/consulta-medica.jpg',
  primaryPhone: '8495-2200',
  aestheticPhone: '7650-7993',
  whatsapp: '50584952200',
  address: 'De Ferretería Luvy, 120 metros al norte, Chinandega, Nicaragua.',
  schedule: 'Lunes a sábado, atención por cita y según disponibilidad médica.',
  mapEmbedUrl: '',
  facebookUrl: '',
  instagramUrl: 'https://www.instagram.com/clinicakeyser',
  tiktokUrl: '',
  aestheticFacebookUrl: '',
  aestheticInstagramUrl: '',
  aestheticTiktokUrl: 'https://www.tiktok.com/@centro_estetico_keyser',
  primaryColor: '#1f2f66',
  secondaryColor: '#ef2f32',
  accentColor: '#087f8c',
};

const serviceNames = [
  ['medicina-general', 'Medicina General'],
  ['medicina-interna', 'Medicina Interna'],
  ['ginecologia', 'Ginecología'],
  ['neurologia-pediatrica', 'Neurología Pediátrica'],
  ['cirugia', 'Cirugía'],
  ['ortopedia', 'Ortopedia'],
  ['odontologia', 'Odontología'],
  ['psicologia', 'Psicología'],
  ['cardiologia', 'Cardiología'],
  ['ultrasonido', 'Ultrasonidos'],
  ['sistema-orion', 'Sistema Orión para la gestión segura del expediente clínico'],
] as const;

const fallbackServices: PublicService[] = serviceNames.map(([slug, title], index) => ({
  id: `fallback-${slug}`,
  slug,
  title,
  description: '',
  category: slug === 'sistema-orion' ? 'Tecnología clínica' : 'Especialidad médica',
  isActive: true,
  sortOrder: index + 1,
}));

const fallbackGallery: PublicGalleryImage[] = [
  ['facade', 'Fachada', 'Fachada principal de Clínica Keyser', '/clinic-media/fachada.jpg', 'Fachada'],
  ['reception', 'Recepción', 'Recepción principal de Clínica Keyser', '/clinic-media/recepcion-principal.jpg', 'Recepción'],
  ['consultation', 'Consultorios', 'Consulta médica en Clínica Keyser', '/clinic-media/consulta-medica.jpg', 'Consultorios'],
  ['waiting', 'Área de espera', 'Sala de espera de Clínica Keyser', '/clinic-media/sala-espera.jpg', 'Área de espera'],
  ['specialties', 'Atención especializada', 'Pasillo de consultorios especializados', '/clinic-media/pasillo-laboratorio.jpg', 'Atención especializada'],
  ['interior', 'Instalaciones', 'Instalaciones interiores de Clínica Keyser', '/clinic-media/area-espera.jpg', 'Instalaciones'],
].map(([id, title, altText, imageUrl, category], index) => ({
  id,
  title,
  altText,
  imageUrl,
  category,
  isActive: true,
  sortOrder: index + 1,
}));

const fallbackTeam: PublicTeamMember[] = [{
  id: 'medical-team',
  name: 'Equipo médico Clínica Keyser',
  specialty: 'Atención integral y especialidades médicas',
  description: 'Profesionales comprometidos con una atención cercana, ética y personalizada.',
  imageUrl: '/clinic-media/consulta-medica.jpg',
  isActive: true,
  sortOrder: 1,
}];

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

export function PublicServicesPage() {
  const data = usePublicData();
  return (
    <PublicLayout data={data}>
      <InteriorHero title="Servicios médicos" text="Especialidades y atención integral para cada etapa de la vida." />
      <ServicesSection services={data.services} />
    </PublicLayout>
  );
}

export function PublicPromotionsPage() {
  const data = usePublicData();
  return (
    <PublicLayout data={data}>
      <InteriorHero title="Información de la clínica" text="Consulte campañas y novedades directamente con nuestro equipo." />
      <SimpleCards items={data.promotions.map((item) => ({ id: item.id, title: item.title, text: item.description }))} />
    </PublicLayout>
  );
}

export function PublicNewsPage() {
  const data = usePublicData();
  return (
    <PublicLayout data={data}>
      <InteriorHero title="Noticias" text="Información reciente de Clínica Keyser." />
      <SimpleCards items={data.news.map((item) => ({ id: item.id, title: item.title, text: item.description }))} />
    </PublicLayout>
  );
}

export function PublicContactPage() {
  const data = usePublicData();
  return (
    <PublicLayout data={data}>
      <InteriorHero title="Contacto" text="Estamos en Chinandega y será un gusto atenderle." />
      <ContactSection settings={data.settings} />
    </PublicLayout>
  );
}

export function PublicFAQPage() {
  const data = usePublicData();
  return (
    <PublicLayout data={data}>
      <InteriorHero title="Preguntas frecuentes" text="Información útil antes de su visita." />
      <SimpleCards items={data.faqs.map((item) => ({ id: item.id, title: item.question, text: item.answer }))} />
    </PublicLayout>
  );
}

function usePublicData(): PublicData {
  const [data, setData] = useState<PublicData>({
    settings: fallbackSettings,
    services: fallbackServices,
    gallery: fallbackGallery,
    team: fallbackTeam,
    promotions: [],
    news: [],
    faqs: [],
  });

  useEffect(() => {
    let active = true;
    async function load() {
      const [settings, services, gallery, team, promotions, news, faqs] = await Promise.all([
        getPublic<Partial<Settings>>('/api/public/settings', {}),
        getPublic<PublicService[]>('/api/public/services', []),
        getPublic<PublicGalleryImage[]>('/api/public/gallery', []),
        getPublic<PublicTeamMember[]>('/api/public/team', []),
        getPublic<PublicPromotion[]>('/api/public/promotions', []),
        getPublic<PublicNews[]>('/api/public/news', []),
        getPublic<PublicFAQ[]>('/api/public/faqs', []),
      ]);
      if (!active) return;
      setData({
        settings: { ...fallbackSettings, ...settings },
        services: services.length ? services : fallbackServices,
        gallery: gallery.length ? gallery : fallbackGallery,
        team: team.length ? team : fallbackTeam,
        promotions,
        news,
        faqs,
      });
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  return data;
}

async function getPublic<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${apiBase}${path}`, { cache: 'no-store' });
    if (!response.ok) return fallback;
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

function PublicLayout({ data, children }: { data: PublicData; children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = [
    ['Clínica', '/#clinica'],
    ['Servicios', '/#servicios'],
    ['Instalaciones', '/#instalaciones'],
    ['Equipo', '/#equipo'],
    ['Contacto', '/#contacto'],
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fbfaf7] text-[#151a24]">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-[#fbfaf7]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 lg:px-10">
          <Link href="/" className="flex items-center gap-3" aria-label="Clínica Keyser, inicio">
            <img src={mediaUrl(data.settings.logoUrl) || '/clinic-media/logo.png'} alt="Clínica Keyser" className="h-11 w-11 object-contain" />
            <span className="text-[15px] font-semibold uppercase tracking-[0.18em] text-[#1f2f66]">Clínica Keyser</span>
          </Link>
          <nav className="hidden items-center gap-7 lg:flex">
            {nav.map(([label, href]) => (
              <Link key={href} href={href} className="text-sm font-medium text-slate-600 transition-colors hover:text-[#1f2f66]">{label}</Link>
            ))}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <Link href="/login" className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-[#1f2f66]">
              <LockKeyhole className="h-4 w-4" />
              Acceso
            </Link>
            <AppointmentLink settings={data.settings} className="rounded-full bg-[#1f2f66] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#17234c]">
              Agendar cita
            </AppointmentLink>
          </div>
          <button type="button" onClick={() => setMenuOpen(true)} className="rounded-full border border-slate-200 p-2.5 lg:hidden" aria-label="Abrir menú">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[70] bg-[#101827]/30 backdrop-blur-sm lg:hidden" onClick={() => setMenuOpen(false)}>
          <aside className="ml-auto flex h-full w-[86%] max-w-sm flex-col bg-[#fbfaf7] p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1f2f66]">Clínica Keyser</span>
              <button type="button" onClick={() => setMenuOpen(false)} className="rounded-full border border-slate-200 p-2" aria-label="Cerrar menú"><X className="h-5 w-5" /></button>
            </div>
            <nav className="mt-12 grid gap-1">
              {nav.map(([label, href]) => (
                <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="border-b border-slate-200 py-4 text-lg font-medium">{label}</Link>
              ))}
            </nav>
            <div className="mt-auto grid gap-3">
              <AppointmentLink settings={data.settings} className="rounded-full bg-[#1f2f66] px-5 py-3 text-center text-sm font-semibold text-white">Agendar cita</AppointmentLink>
              <Link href="/login" className="rounded-full border border-slate-300 px-5 py-3 text-center text-sm font-semibold">Iniciar sesión</Link>
            </div>
          </aside>
        </div>
      )}

      {children}
      <Footer settings={data.settings} />
    </main>
  );
}

function Hero({ settings }: { settings: Settings }) {
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

function InstitutionalSection({ settings }: { settings: Settings }) {
  return (
    <section id="clinica" className="scroll-mt-24 px-5 py-20 sm:py-28 lg:px-10">
      <div className="mx-auto grid max-w-[1320px] items-center gap-12 lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
        <div>
          <SectionLabel>Clínica Keyser</SectionLabel>
          <h2 className="font-display mt-5 text-4xl font-medium leading-tight tracking-[-0.025em] text-[#17234c] sm:text-5xl">
            Medicina cercana, organizada y humana.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">{settings.institutionalText}</p>
        </div>
        <div className="overflow-hidden rounded-[2px] bg-slate-100">
          <img src={mediaUrl(settings.institutionalImageUrl) || '/clinic-media/consulta-medica.jpg'} alt="Atención personalizada en Clínica Keyser" className="aspect-[16/10] h-full w-full object-cover" />
        </div>
      </div>
    </section>
  );
}

function ServicesSection({ services }: { services: PublicService[] }) {
  return (
    <section id="servicios" className="scroll-mt-24 bg-[#16244d] px-5 py-20 text-white sm:py-28 lg:px-10">
      <div className="mx-auto max-w-[1320px]">
        <div className="max-w-2xl">
          <SectionLabel light>Servicios médicos</SectionLabel>
          <h2 className="font-display mt-5 text-4xl font-medium tracking-[-0.025em] sm:text-6xl">Atención integral, en un solo lugar.</h2>
        </div>
        <div className="mt-14 grid border-t border-white/20 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <article key={service.id} className="group flex min-h-36 items-start gap-5 border-b border-white/20 py-7 pr-5 sm:odd:border-r sm:even:pl-7 lg:border-r lg:px-7 lg:first:pl-0 lg:nth-[3n]:border-r-0">
              <span className="mt-1 text-xs tabular-nums text-white/40">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3 className="text-lg font-medium leading-7 text-white">{service.title}</h3>
                {service.category && <p className="mt-2 text-sm text-white/48">{service.category}</p>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function GallerySection({ gallery }: { gallery: PublicGalleryImage[] }) {
  return (
    <section id="instalaciones" className="scroll-mt-24 px-5 py-20 sm:py-28 lg:px-10">
      <div className="mx-auto max-w-[1320px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <SectionLabel>Instalaciones</SectionLabel>
            <h2 className="font-display mt-5 text-4xl font-medium tracking-[-0.025em] text-[#17234c] sm:text-6xl">Espacios pensados para su bienestar.</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-slate-500">Ambientes organizados, cómodos y preparados para brindar atención médica con privacidad.</p>
        </div>
        <div className="mt-14 grid auto-rows-[230px] gap-3 sm:grid-cols-2 sm:auto-rows-[300px] lg:grid-cols-12">
          {gallery.map((image, index) => (
            <figure key={image.id} className={`group relative overflow-hidden bg-slate-200 ${galleryClass(index)}`}>
              <img src={mediaUrl(image.imageUrl)} alt={image.altText} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-5 pb-5 pt-16 text-white">
                <p className="text-sm font-medium">{image.title}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function TeamSection({ team }: { team: PublicTeamMember[] }) {
  return (
    <section id="equipo" className="scroll-mt-24 bg-[#f0f1ee] px-5 py-20 sm:py-28 lg:px-10">
      <div className="mx-auto max-w-[1320px]">
        <SectionLabel>Equipo médico</SectionLabel>
        <h2 className="font-display mt-5 max-w-3xl text-4xl font-medium tracking-[-0.025em] text-[#17234c] sm:text-6xl">Experiencia clínica con atención personal.</h2>
        <div className="mt-14 grid gap-8 md:grid-cols-2">
          {team.map((member) => (
            <article key={member.id} className="grid overflow-hidden bg-white lg:grid-cols-[1.12fr_.88fr]">
              <img src={mediaUrl(member.imageUrl) || '/clinic-media/consulta-medica.jpg'} alt={member.name} className="aspect-[4/3] h-full min-h-72 w-full object-cover" />
              <div className="flex flex-col justify-end p-7 sm:p-9">
                <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#ef2f32]">{member.specialty}</p>
                <h3 className="font-display mt-4 text-3xl font-medium text-[#17234c]">{member.name}</h3>
                <p className="mt-4 text-sm leading-7 text-slate-600">{member.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection({ settings }: { settings: Settings }) {
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
            <ContactLine icon={<MessageCircle />} label="WhatsApp" value={formatPhone(settings.whatsapp)} href={whatsappUrl(settings)} external />
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

function SocialSection({ settings }: { settings: Settings }) {
  const links = [
    settings.facebookUrl && { label: 'Facebook Clínica Keyser', href: settings.facebookUrl, icon: <Facebook /> },
    settings.instagramUrl && { label: 'Instagram Clínica Keyser', href: settings.instagramUrl, icon: <Instagram /> },
    settings.tiktokUrl && { label: 'TikTok Clínica Keyser', href: settings.tiktokUrl, icon: <TikTokIcon /> },
    settings.aestheticFacebookUrl && { label: 'Facebook Centro Estético Keyser', href: settings.aestheticFacebookUrl, icon: <Facebook /> },
    settings.aestheticInstagramUrl && { label: 'Instagram Centro Estético Keyser', href: settings.aestheticInstagramUrl, icon: <Instagram /> },
    settings.aestheticTiktokUrl && { label: 'TikTok Centro Estético Keyser', href: settings.aestheticTiktokUrl, icon: <TikTokIcon /> },
  ].filter(Boolean) as { label: string; href: string; icon: ReactNode }[];

  if (!links.length) return null;
  return (
    <section className="border-t border-slate-200 px-5 py-16 lg:px-10">
      <div className="mx-auto flex max-w-[1320px] flex-col items-center justify-between gap-7 text-center sm:flex-row sm:text-left">
        <p className="font-display text-2xl text-[#17234c]">Síguenos en nuestras redes sociales</p>
        <div className="flex items-center gap-3">
          {links.map((link) => (
            <a key={link.label} href={link.href} target="_blank" rel="noreferrer" aria-label={link.label} title={link.label} className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 text-[#1f2f66] transition hover:border-[#1f2f66] hover:bg-[#1f2f66] hover:text-white [&_svg]:h-5 [&_svg]:w-5">
              {link.icon}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer({ settings }: { settings: Settings }) {
  return (
    <footer className="bg-[#101827] px-5 py-12 text-white lg:px-10">
      <div className="mx-auto flex max-w-[1320px] flex-col justify-between gap-9 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-3">
            <img src={mediaUrl(settings.logoUrl) || '/clinic-media/logo.png'} alt="" className="h-11 w-11 object-contain" />
            <span className="text-sm font-semibold uppercase tracking-[.18em]">Clínica Keyser</span>
          </div>
          <p className="mt-5 max-w-md text-sm leading-6 text-white/55">{settings.address}</p>
        </div>
        <div className="flex items-center gap-5 text-sm text-white/60">
          <span>© {new Date().getFullYear()} Clínica Keyser</span>
          <Link href="/login" className="hover:text-white">Acceso administrativo</Link>
        </div>
      </div>
    </footer>
  );
}

function InteriorHero({ title, text }: { title: string; text: string }) {
  return (
    <section className="bg-[#16244d] px-5 py-24 text-white lg:px-10">
      <div className="mx-auto max-w-[1320px]">
        <SectionLabel light>Clínica Keyser</SectionLabel>
        <h1 className="font-display mt-5 text-5xl font-medium tracking-[-.025em] sm:text-7xl">{title}</h1>
        <p className="mt-5 max-w-xl text-lg text-white/65">{text}</p>
      </div>
    </section>
  );
}

function SimpleCards({ items }: { items: { id: string; title: string; text: string }[] }) {
  return (
    <section className="px-5 py-20 lg:px-10">
      <div className="mx-auto grid max-w-[1320px] gap-px bg-slate-200 md:grid-cols-2">
        {items.length ? items.map((item) => (
          <article key={item.id} className="bg-[#fbfaf7] p-8 sm:p-10">
            <h2 className="font-display text-2xl text-[#17234c]">{item.title}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{item.text}</p>
          </article>
        )) : (
          <p className="bg-[#fbfaf7] p-10 text-slate-500">La información se actualizará próximamente.</p>
        )}
      </div>
    </section>
  );
}

function SectionLabel({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return <p className={`text-xs font-semibold uppercase tracking-[.22em] ${light ? 'text-white/55' : 'text-[#ef2f32]'}`}>{children}</p>;
}

function ContactLine({ icon, label, value, href, external = false }: { icon: ReactNode; label: string; value: string; href?: string; external?: boolean }) {
  const content = (
    <>
      <span className="mt-1 text-[#1f2f66] [&_svg]:h-5 [&_svg]:w-5">{icon}</span>
      <span>
        <span className="block text-xs font-semibold uppercase tracking-[.15em] text-slate-400">{label}</span>
        <span className="mt-1 block text-sm leading-6 text-slate-700">{value}</span>
      </span>
    </>
  );
  return href ? (
    <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} className="flex gap-4 py-5 hover:bg-white">{content}</a>
  ) : (
    <div className="flex gap-4 py-5">{content}</div>
  );
}

function AppointmentLink({ settings, className, children }: { settings: Settings; className: string; children: ReactNode }) {
  return <a href={whatsappUrl(settings, 'Hola Clínica Keyser, deseo agendar una cita.')} target="_blank" rel="noreferrer" className={className}>{children}</a>;
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.6 3c.3 2.3 1.6 3.7 3.9 3.9v3.2a8 8 0 0 1-3.9-1.2v6.2a6.1 6.1 0 1 1-5.3-6V12a3 3 0 1 0 2.1 2.9V3h3.2Z" />
    </svg>
  );
}

function galleryClass(index: number) {
  if (index === 0) return 'sm:col-span-2 lg:col-span-7 lg:row-span-2';
  if (index === 1) return 'lg:col-span-5';
  if (index === 2) return 'lg:col-span-5';
  if (index === 3) return 'lg:col-span-4';
  if (index === 4) return 'lg:col-span-4';
  return 'lg:col-span-4';
}

function mediaUrl(value?: string | null) {
  if (!value) return '';
  if (value.startsWith('/api/')) return `${apiBase}${value}`;
  return value;
}

function whatsappUrl(settings: Settings, message = 'Hola Clínica Keyser, deseo recibir información.') {
  return `https://wa.me/${cleanPhone(settings.whatsapp)}?text=${encodeURIComponent(message)}`;
}

function cleanPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits.startsWith('505') ? digits : `505${digits}`;
}

function formatPhone(value: string) {
  const digits = cleanPhone(value);
  return digits.length === 11 ? `+${digits.slice(0, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}` : value;
}
