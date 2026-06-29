// This file is kept for backwards compatibility
// All components have been reorganized into the public-site directory
// See public-site/index.ts for the actual implementations

export {
  PublicHome,
  PublicServicesPage,
  PublicPromotionsPage,
  PublicNewsPage,
  PublicContactPage,
  PublicFAQPage,
  usePublicData,
  mediaUrl,
  whatsappUrl,
  cleanPhone,
  formatPhone,
  galleryClass,
} from './public-site/index';

export type {
  Settings,
  PublicService,
  PublicGalleryImage,
  PublicTeamMember,
  PublicPromotion,
  PublicNews,
  PublicFAQ,
  PublicData,
} from './public-site/index';
