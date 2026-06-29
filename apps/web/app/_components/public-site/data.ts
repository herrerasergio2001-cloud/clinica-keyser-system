import type { Settings, PublicGalleryImage, PublicTeamMember, PublicService } from './types';

export const fallbackSettings: Settings = {
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

export const fallbackServices: PublicService[] = serviceNames.map(([slug, title], index) => ({
  id: `fallback-${slug}`,
  slug,
  title,
  description: '',
  category: slug === 'sistema-orion' ? 'Tecnología clínica' : 'Especialidad médica',
  isActive: true,
  sortOrder: index + 1,
}));

export const fallbackGallery: PublicGalleryImage[] = [
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

export const fallbackTeam: PublicTeamMember[] = [{
  id: 'medical-team',
  name: 'Equipo médico Clínica Keyser',
  specialty: 'Atención integral y especialidades médicas',
  description: 'Profesionales comprometidos con una atención cercana, ética y personalizada.',
  imageUrl: '/clinic-media/consulta-medica.jpg',
  isActive: true,
  sortOrder: 1,
}];
