'use client';

import Link from 'next/link';
import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Baby,
  Brain,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FlaskConical,
  HeartPulse,
  Home,
  Loader2,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Scissors,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Syringe,
  X,
} from 'lucide-react';

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type Settings = {
  clinicName: string;
  slogan: string;
  logoUrl?: string | null;
  primaryPhone: string;
  aestheticPhone: string;
  whatsapp: string;
  address: string;
  schedule: string;
  mapEmbedUrl?: string | null;
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

type PublicPromotion = {
  id: string;
  title: string;
  slug: string;
  description: string;
  content?: string | null;
  imageUrl?: string | null;
  category?: string | null;
  whatsappText?: string | null;
  isActive: boolean;
  sortOrder: number;
  startDate?: string | null;
  endDate?: string | null;
};

type PublicNews = {
  id: string;
  title: string;
  slug: string;
  description: string;
  content?: string | null;
  imageUrl?: string | null;
  category?: string | null;
  isActive: boolean;
  publishedAt?: string | null;
};

type PublicFAQ = {
  id: string;
  question: string;
  answer: string;
  category?: string | null;
  isActive: boolean;
  sortOrder: number;
};

type PublicData = {
  settings: Settings;
  services: PublicService[];
  promotions: PublicPromotion[];
  news: PublicNews[];
  faqs: PublicFAQ[];
};

const fallbackSettings: Settings = {
  clinicName: 'Clínica Keyser',
  slogan: 'Atención médica integral, cercana y confiable en Chinandega.',
  logoUrl: '/clinica-keyser-logo.jpg',
  primaryPhone: '8495-2200',
  aestheticPhone: '7650-7993',
  whatsapp: '50584952200',
  address: 'De Ferretería Luvy, 120 metros al norte, Chinandega, Nicaragua.',
  schedule: 'Lunes a sábado, atención por cita y según disponibilidad médica.',
  primaryColor: '#1f2f66',
  secondaryColor: '#ef2f32',
  accentColor: '#087f8c',
};

const fallbackServices: PublicService[] = [
  { id: 'ultra', title: 'Ultrasonido', slug: 'ultrasonido', description: 'Estudios de imagen con atención profesional.', icon: 'scan', category: 'Imagen', isActive: true, sortOrder: 1 },
  { id: 'lab', title: 'Laboratorio clínico', slug: 'laboratorio-clinico', description: 'Exámenes y toma de muestras para apoyar su diagnóstico.', icon: 'flask', category: 'Laboratorio', isActive: true, sortOrder: 2 },
  { id: 'estetica', title: 'Medicina estética', slug: 'medicina-estetica', description: 'Valoración y procedimientos con enfoque médico.', icon: 'sparkles', category: 'Estética', isActive: true, sortOrder: 3 },
  { id: 'pedia', title: 'Pediatría', slug: 'pediatria', description: 'Atención amable para niñas y niños.', icon: 'baby', category: 'Consulta', isActive: true, sortOrder: 4 },
  { id: 'gine', title: 'Ginecología', slug: 'ginecologia', description: 'Cuidado integral de la salud femenina.', icon: 'venus', category: 'Consulta', isActive: true, sortOrder: 5 },
];

const fallbackPromotions: PublicPromotion[] = [
  { id: 'promo-1', title: 'Campañas de ultrasonido', slug: 'campana-ultrasonido', description: 'Fechas especiales para estudios de ultrasonido.', category: 'Ultrasonido', isActive: true, sortOrder: 1 },
  { id: 'promo-2', title: 'Paquetes pediátricos', slug: 'paquetes-pediatricos', description: 'Controles y orientación para niñas y niños.', category: 'Pediatría', isActive: true, sortOrder: 2 },
];

const fallbackNews: PublicNews[] = [
  { id: 'news-1', title: 'Toma de muestras a domicilio', slug: 'muestras-domicilio', description: 'Coordinación por WhatsApp para pacientes que requieren apoyo en casa.', category: 'Laboratorio', isActive: true, publishedAt: '2026-05-01' },
];

const fallbackFaqs: PublicFAQ[] = [
  { id: 'faq-1', question: '¿Necesito cita previa?', answer: 'Recomendamos agendar por WhatsApp para confirmar disponibilidad.', isActive: true, sortOrder: 1 },
  { id: 'faq-2', question: '¿Realizan ultrasonidos?', answer: 'Sí. Puede solicitar información por WhatsApp para confirmar disponibilidad.', isActive: true, sortOrder: 2 },
  { id: 'faq-3', question: '¿Tienen laboratorio?', answer: 'Sí. Contamos con laboratorio clínico y toma de muestras.', isActive: true, sortOrder: 3 },
];

const icons: Record<string, typeof Stethoscope> = {
  stethoscope: Stethoscope,
  scan: Activity,
  flask: FlaskConical,
  baby: Baby,
  venus: ShieldCheck,
  brain: Brain,
  tooth: Stethoscope,
  bone: Activity,
  sparkles: Sparkles,
  scissors: Scissors,
  activity: Activity,
  'heart-pulse': HeartPulse,
  gauge: Activity,
  syringe: Syringe,
  home: Home,
};

export function PublicHome() {
  const data = usePublicData();
  const featured = data.services.slice(0, 5);
  return (
    <PublicLayout data={data}>
      <Hero data={data} />
      <Section eyebrow="Servicios destacados" title="Atención clínica para cada etapa">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {featured.map((service) => <ServiceCard key={service.id} service={service} whatsapp={data.settings.whatsapp} compact />)}
        </div>
      </Section>
      <WhyChooseUs />
      <ServicesSection data={data} limit={12} />
      <PromotionsSection data={data} limit={3} />
      <LocationSection settings={data.settings} />
      <FAQSection faqs={data.faqs.slice(0, 5)} />
    </PublicLayout>
  );
}

export function PublicServicesPage() {
  const data = usePublicData();
  return (
    <PublicLayout data={data}>
      <PageHero title="Servicios médicos" subtitle="Seleccione el servicio que necesita y escríbanos para coordinar información o agendar." />
      <ServicesSection data={data} />
    </PublicLayout>
  );
}

export function PublicPromotionsPage() {
  const data = usePublicData();
  return (
    <PublicLayout data={data}>
      <PageHero title="Promociones y campañas" subtitle="Campañas activas, paquetes y jornadas médicas disponibles para pacientes." />
      <PromotionsSection data={data} />
    </PublicLayout>
  );
}

export function PublicNewsPage() {
  const data = usePublicData();
  return (
    <PublicLayout data={data}>
      <PageHero title="Noticias y campañas" subtitle="Anuncios breves, recomendaciones y campañas de Clínica Keyser." />
      <Section eyebrow="Actualizaciones" title="Información reciente">
        <div className="grid gap-4 md:grid-cols-3">
          {data.news.map((item) => <NewsCard key={item.id} item={item} />)}
        </div>
      </Section>
    </PublicLayout>
  );
}

export function PublicContactPage() {
  const data = usePublicData();
  return (
    <PublicLayout data={data}>
      <PageHero title="Contacto" subtitle="Estamos en Chinandega. Puede escribirnos por WhatsApp o enviar una consulta rápida." />
      <ContactSection settings={data.settings} />
    </PublicLayout>
  );
}

export function PublicFAQPage() {
  const data = usePublicData();
  return (
    <PublicLayout data={data}>
      <PageHero title="Preguntas frecuentes" subtitle="Respuestas rápidas para orientar su visita a Clínica Keyser." />
      <Section eyebrow="Dudas comunes" title="Información para pacientes">
        <FAQAccordion faqs={data.faqs} />
      </Section>
    </PublicLayout>
  );
}

function usePublicData(): PublicData {
  const [data, setData] = useState<PublicData>({
    settings: fallbackSettings,
    services: fallbackServices,
    promotions: fallbackPromotions,
    news: fallbackNews,
    faqs: fallbackFaqs,
  });

  useEffect(() => {
    let active = true;
    async function load() {
      const [settings, services, promotions, news, faqs] = await Promise.all([
        getPublic<Settings>('/api/public/settings', fallbackSettings),
        getPublic<PublicService[]>('/api/public/services', fallbackServices),
        getPublic<PublicPromotion[]>('/api/public/promotions', fallbackPromotions),
        getPublic<PublicNews[]>('/api/public/news', fallbackNews),
        getPublic<PublicFAQ[]>('/api/public/faqs', fallbackFaqs),
      ]);
      if (active) setData({ settings, services, promotions, news, faqs });
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
  const [open, setOpen] = useState(false);
  const nav = [
    ['Inicio', '/'],
    ['Servicios', '/servicios'],
    ['Promociones', '/promociones'],
    ['Noticias', '/noticias'],
    ['Contacto', '/contacto'],
    ['Preguntas', '/preguntas'],
  ];
  return (
    <main className="min-h-screen bg-[#f7fbfb] text-slate-950">
      <header className="sticky top-0 z-30 border-b border-teal-100/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <Link href="/" className="flex items-center gap-3">
            <img src={data.settings.logoUrl ?? '/clinica-keyser-logo.svg'} alt="Logo Clínica Keyser" className="h-12 w-auto max-w-[190px]" />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map(([label, href]) => <Link key={href} href={href} className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-clinic-teal">{label}</Link>)}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <WhatsAppButton settings={data.settings} label="WhatsApp" />
            <Link href="/login" className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-clinic-teal hover:text-clinic-teal">Acceso personal autorizado</Link>
          </div>
          <button onClick={() => setOpen(true)} className="rounded-md border border-slate-200 p-2 md:hidden" aria-label="Abrir menú">
            <Menu className="h-5 w-5" />
          </button>
        </div>
        {open && (
          <div className="fixed inset-0 z-40 bg-slate-950/30 md:hidden" onClick={() => setOpen(false)}>
            <div className="ml-auto h-full w-80 bg-white p-4 shadow-xl" onClick={(event) => event.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <strong>Clínica Keyser</strong>
                <button onClick={() => setOpen(false)} className="rounded-md border p-2" aria-label="Cerrar menú"><X className="h-4 w-4" /></button>
              </div>
              <div className="grid gap-2">
                {nav.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-teal-50">{label}</Link>)}
                <WhatsAppButton settings={data.settings} label="WhatsApp" />
                <Link href="/login" className="rounded-md bg-clinic-teal px-3 py-2 text-center text-sm font-semibold text-white">Acceso al sistema</Link>
              </div>
            </div>
          </div>
        )}
      </header>
      {children}
      <Footer settings={data.settings} />
    </main>
  );
}

function Hero({ data }: { data: PublicData }) {
  return (
    <section className="relative overflow-hidden bg-[#e9f7f6]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_15%,rgba(143,213,200,.65),transparent_30%),linear-gradient(135deg,rgba(8,127,140,.13),transparent_55%)]" />
      <div className="relative mx-auto grid min-h-[660px] max-w-7xl items-center gap-10 px-4 py-12 lg:grid-cols-[1fr_470px] lg:px-6">
        <div>
          <img src={data.settings.logoUrl ?? '/clinica-keyser-logo.svg'} alt="Logo Clínica Keyser" className="mb-7 h-20 w-auto" />
          <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-slate-950 md:text-6xl">{data.settings.clinicName}</h1>
          <p className="mt-5 max-w-2xl text-xl leading-8 text-slate-700">{data.settings.slogan}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <WhatsAppButton settings={data.settings} label="Agendar cita" prominent />
            <Link href="/servicios" className="rounded-md border border-teal-200 bg-white px-5 py-3 text-sm font-semibold text-clinic-teal shadow-sm hover:border-clinic-teal">Ver servicios</Link>
            <WhatsAppButton settings={data.settings} label="WhatsApp" />
            <Link href="/login" className="rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:text-clinic-teal">Acceso al sistema</Link>
          </div>
          <div className="mt-9 grid max-w-3xl gap-3 text-sm text-slate-700 sm:grid-cols-3">
            <InfoPill icon={MapPin} text="Chinandega, Nicaragua" />
            <InfoPill icon={Phone} text={data.settings.primaryPhone} />
            <InfoPill icon={CalendarCheck} text="Atención por cita" />
          </div>
        </div>
        <div className="rounded-lg border border-white/70 bg-white/80 p-5 shadow-xl backdrop-blur">
          <div className="rounded-lg bg-clinic-ink p-6 text-white">
            <p className="text-sm text-teal-100">Servicios disponibles</p>
            <div className="mt-5 grid gap-3">
              {data.services.slice(0, 7).map((service) => <MiniService key={service.id} service={service} />)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PageHero({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section className="bg-gradient-to-br from-teal-50 to-white px-4 py-16 lg:px-6">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-clinic-teal">Clínica Keyser</p>
        <h1 className="mt-2 max-w-3xl text-4xl font-semibold text-slate-950 md:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">{subtitle}</p>
      </div>
    </section>
  );
}

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className="px-4 py-14 lg:px-6">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-clinic-teal">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-950">{title}</h2>
        <div className="mt-7">{children}</div>
      </div>
    </section>
  );
}

function ServicesSection({ data, limit }: { data: PublicData; limit?: number }) {
  const services = typeof limit === 'number' ? data.services.slice(0, limit) : data.services;
  return (
    <Section eyebrow="Servicios" title="Especialidades y atención disponible">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => <ServiceCard key={service.id} service={service} whatsapp={data.settings.whatsapp} />)}
      </div>
    </Section>
  );
}

function ServiceCard({ service, whatsapp, compact = false }: { service: PublicService; whatsapp: string; compact?: boolean }) {
  const Icon = icons[service.icon ?? 'stethoscope'] ?? Stethoscope;
  const message = encodeURIComponent(service.whatsappText ?? `Hola Clínica Keyser, deseo información sobre ${service.title}.`);
  return (
    <article className="group rounded-lg border border-teal-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-clinic-teal hover:shadow-md">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-clinic-teal">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{service.category ?? 'Servicio'}</p>
        <h3 className="mt-1 text-lg font-semibold text-slate-950">{service.title}</h3>
        <p className={`mt-2 text-sm leading-6 text-slate-600 ${compact ? 'line-clamp-3' : ''}`}>{service.description}</p>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <a href={`https://wa.me/${cleanPhone(whatsapp)}?text=${message}`} target="_blank" className="rounded-md bg-clinic-teal px-3 py-2 text-sm font-semibold text-white">Solicitar información</a>
        <a href={`https://wa.me/${cleanPhone(whatsapp)}?text=${encodeURIComponent(`Hola Clínica Keyser, deseo agendar ${service.title}.`)}`} target="_blank" className="rounded-md border border-teal-200 px-3 py-2 text-sm font-semibold text-clinic-teal">Agendar</a>
      </div>
    </article>
  );
}

function PromotionsSection({ data, limit }: { data: PublicData; limit?: number }) {
  const promotions = typeof limit === 'number' ? data.promotions.slice(0, limit) : data.promotions;
  return (
    <Section eyebrow="Promociones" title="Campañas activas">
      <div className="grid gap-4 md:grid-cols-3">
        {promotions.map((promotion) => <PromotionCard key={promotion.id} promotion={promotion} whatsapp={data.settings.whatsapp} />)}
      </div>
    </Section>
  );
}

function PromotionCard({ promotion, whatsapp }: { promotion: PublicPromotion; whatsapp: string }) {
  return (
    <article className="overflow-hidden rounded-lg border border-teal-100 bg-white shadow-sm">
      <div className="h-32 bg-gradient-to-br from-clinic-teal to-clinic-mint p-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-50">{promotion.category ?? 'Campaña'}</p>
        <h3 className="mt-2 text-xl font-semibold">{promotion.title}</h3>
      </div>
      <div className="p-5">
        <p className="text-sm leading-6 text-slate-600">{promotion.description}</p>
        <p className="mt-4 text-xs text-slate-500">Vigencia: {formatDate(promotion.startDate) ?? 'Activa'} - {formatDate(promotion.endDate) ?? 'Consultar'}</p>
        <a href={`https://wa.me/${cleanPhone(whatsapp)}?text=${encodeURIComponent(promotion.whatsappText ?? `Hola Clínica Keyser, deseo información sobre ${promotion.title}.`)}`} target="_blank" className="mt-5 inline-flex rounded-md bg-clinic-teal px-3 py-2 text-sm font-semibold text-white">Consultar por WhatsApp</a>
      </div>
    </article>
  );
}

function NewsCard({ item }: { item: PublicNews }) {
  return (
    <article className="rounded-lg border border-teal-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-clinic-teal">{item.category ?? 'Noticia'} · {formatDate(item.publishedAt) ?? 'Reciente'}</p>
      <h3 className="mt-3 text-xl font-semibold text-slate-950">{item.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
      <button className="mt-5 rounded-md border border-teal-200 px-3 py-2 text-sm font-semibold text-clinic-teal">Leer más</button>
    </article>
  );
}

function WhyChooseUs() {
  const items = [
    ['Atención cercana', 'Comunicación clara, trato humano y seguimiento clínico.'],
    ['Servicios integrados', 'Consulta, laboratorio, ultrasonido y apoyo diagnóstico en un solo lugar.'],
    ['Ubicación práctica', 'Estamos en Chinandega con acceso directo por WhatsApp.'],
  ];
  return (
    <Section eyebrow="Por qué elegirnos" title="Una clínica pensada para atenderle mejor">
      <div className="grid gap-4 md:grid-cols-3">
        {items.map(([title, text]) => (
          <article key={title} className="rounded-lg border border-teal-100 bg-white p-5 shadow-sm">
            <CheckCircle2 className="h-6 w-6 text-clinic-teal" />
            <h3 className="mt-4 text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

function LocationSection({ settings }: { settings: Settings }) {
  return (
    <Section eyebrow="Ubicación" title="Visítenos en Chinandega">
      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-lg border border-teal-100 bg-white p-6 shadow-sm">
          <InfoLine icon={MapPin} title="Dirección" text={settings.address} />
          <InfoLine icon={Phone} title="Teléfono principal" text={settings.primaryPhone} />
          <InfoLine icon={Sparkles} title="Centro estético" text={settings.aestheticPhone} />
          <InfoLine icon={CalendarCheck} title="Horario" text={settings.schedule} />
        </div>
        <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-teal-100 bg-[linear-gradient(135deg,#dff5f2,#ffffff)] p-6 text-center shadow-sm">
          {settings.mapEmbedUrl ? (
            <iframe title="Mapa Clínica Keyser" src={settings.mapEmbedUrl} className="h-full min-h-[320px] w-full rounded-md border-0" loading="lazy" />
          ) : (
            <div>
              <MapPin className="mx-auto h-12 w-12 text-clinic-teal" />
              <p className="mt-3 font-semibold">Mapa de ubicación</p>
              <p className="mt-1 text-sm text-slate-600">{settings.address}</p>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

function ContactSection({ settings }: { settings: Settings }) {
  const [sent, setSent] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = `Hola Clínica Keyser, soy ${form.get('nombre')}. Teléfono: ${form.get('telefono')}. Motivo: ${form.get('motivo')}. Mensaje: ${form.get('mensaje')}`;
    window.open(`https://wa.me/${cleanPhone(settings.whatsapp)}?text=${encodeURIComponent(text)}`, '_blank');
    setSent(true);
  }
  return (
    <section className="px-4 py-14 lg:px-6">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <div className="rounded-lg border border-teal-100 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Datos de contacto</h2>
          <div className="mt-6 grid gap-4">
            <InfoLine icon={Phone} title="Teléfono principal" text={settings.primaryPhone} />
            <InfoLine icon={MessageCircle} title="WhatsApp" text={settings.whatsapp} />
            <InfoLine icon={MapPin} title="Dirección" text={settings.address} />
            <InfoLine icon={CalendarCheck} title="Horario" text={settings.schedule} />
          </div>
        </div>
        <form onSubmit={submit} className="rounded-lg border border-teal-100 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Enviar consulta</h2>
          {sent && <p className="mt-4 rounded-md bg-teal-50 p-3 text-sm text-clinic-teal">Consulta preparada correctamente en WhatsApp.</p>}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <PublicInput name="nombre" label="Nombre" required />
            <PublicInput name="telefono" label="Teléfono" required />
            <PublicInput name="motivo" label="Motivo" required />
            <label className="grid gap-1 text-sm font-medium md:col-span-2">
              Mensaje
              <textarea name="mensaje" rows={5} className="rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-clinic-teal" placeholder="Escriba su consulta" />
            </label>
          </div>
          <button className="mt-5 inline-flex items-center gap-2 rounded-md bg-clinic-teal px-4 py-3 text-sm font-semibold text-white">
            <Send className="h-4 w-4" />
            Enviar por WhatsApp
          </button>
        </form>
      </div>
    </section>
  );
}

function FAQSection({ faqs }: { faqs: PublicFAQ[] }) {
  return (
    <Section eyebrow="Preguntas frecuentes" title="Antes de visitarnos">
      <FAQAccordion faqs={faqs} />
    </Section>
  );
}

function FAQAccordion({ faqs }: { faqs: PublicFAQ[] }) {
  const [open, setOpen] = useState<string | null>(faqs[0]?.id ?? null);
  return (
    <div className="grid gap-3">
      {faqs.map((faq) => (
        <article key={faq.id} className="rounded-lg border border-teal-100 bg-white shadow-sm">
          <button onClick={() => setOpen(open === faq.id ? null : faq.id)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold">
            {faq.question}
            <ChevronDown className={`h-4 w-4 transition ${open === faq.id ? 'rotate-180 text-clinic-teal' : 'text-slate-400'}`} />
          </button>
          {open === faq.id && <p className="border-t border-teal-50 px-5 py-4 text-sm leading-6 text-slate-600">{faq.answer}</p>}
        </article>
      ))}
    </div>
  );
}

function Footer({ settings }: { settings: Settings }) {
  return (
    <footer className="border-t border-teal-100 bg-white px-4 py-8 lg:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-950">{settings.clinicName}</p>
          <p className="mt-1 text-sm text-slate-600">{settings.address}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`tel:${settings.primaryPhone}`} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium">Llamar</a>
          <WhatsAppButton settings={settings} label="WhatsApp" />
          <Link href="/login" className="rounded-md bg-clinic-ink px-3 py-2 text-sm font-semibold text-white">Acceso personal autorizado</Link>
        </div>
      </div>
    </footer>
  );
}

function WhatsAppButton({ settings, label, prominent = false }: { settings: Settings; label: string; prominent?: boolean }) {
  return (
    <a href={`https://wa.me/${cleanPhone(settings.whatsapp)}?text=${encodeURIComponent('Hola Clínica Keyser, deseo recibir información y agendar una cita.')}`} target="_blank" className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-semibold shadow-sm ${prominent ? 'bg-clinic-teal text-white' : 'border border-teal-200 bg-white text-clinic-teal hover:border-clinic-teal'}`}>
      <MessageCircle className="h-4 w-4" />
      {label}
    </a>
  );
}

function MiniService({ service }: { service: PublicService }) {
  const Icon = icons[service.icon ?? 'stethoscope'] ?? Stethoscope;
  return (
    <div className="flex items-center gap-3 rounded-md bg-white/10 p-3">
      <Icon className="h-5 w-5 text-clinic-mint" />
      <span className="text-sm font-medium">{service.title}</span>
    </div>
  );
}

function InfoPill({ icon: Icon, text }: { icon: typeof MapPin; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-white/70 bg-white/70 px-3 py-2">
      <Icon className="h-4 w-4 text-clinic-teal" />
      <span>{text}</span>
    </div>
  );
}

function InfoLine({ icon: Icon, title, text }: { icon: typeof MapPin; title: string; text: string }) {
  return (
    <div className="flex gap-3 border-b border-slate-100 py-4 last:border-0">
      <Icon className="mt-0.5 h-5 w-5 text-clinic-teal" />
      <div>
        <p className="text-sm font-semibold text-slate-950">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
      </div>
    </div>
  );
}

function PublicInput({ label, name, required }: { label: string; name: string; required?: boolean }) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <input name={name} required={required} className="h-11 rounded-md border border-slate-200 px-3 outline-none focus:border-clinic-teal" placeholder={label} />
    </label>
  );
}

function formatDate(value?: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString('es-NI', { day: '2-digit', month: 'short', year: 'numeric' });
}

function cleanPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits.startsWith('505') ? digits : `505${digits}`;
}
