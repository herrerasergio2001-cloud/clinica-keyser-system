export type Settings = {
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

export type PublicService = {
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

export type PublicGalleryImage = {
  id: string;
  title: string;
  altText: string;
  imageUrl: string;
  category?: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type PublicTeamMember = {
  id: string;
  name: string;
  specialty: string;
  description: string;
  imageUrl?: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type PublicPromotion = {
  id: string;
  title: string;
  slug: string;
  description: string;
  imageUrl?: string | null;
  category?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

export type PublicNews = {
  id: string;
  title: string;
  slug: string;
  description: string;
  imageUrl?: string | null;
  category?: string | null;
  publishedAt?: string | null;
};

export type PublicFAQ = {
  id: string;
  question: string;
  answer: string;
};

export type PublicData = {
  settings: Settings;
  services: PublicService[];
  gallery: PublicGalleryImage[];
  team: PublicTeamMember[];
  promotions: PublicPromotion[];
  news: PublicNews[];
  faqs: PublicFAQ[];
};
