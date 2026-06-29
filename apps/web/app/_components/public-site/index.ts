// Pages
export { PublicHome } from './pages/home';
export { PublicServicesPage } from './pages/services';
export { PublicPromotionsPage } from './pages/promotions';
export { PublicNewsPage } from './pages/news';
export { PublicContactPage } from './pages/contact';
export { PublicFAQPage } from './pages/faq';

// Sections
export { PricingPlans } from './sections/pricing';
export { BookingForm } from './sections/booking-form';
export { ProceduresGallery } from './sections/procedures';

// Hooks & Utils
export { usePublicData, mediaUrl, whatsappUrl, cleanPhone, formatPhone, galleryClass } from './utils';

// Types
export type { Settings, PublicService, PublicGalleryImage, PublicTeamMember, PublicPromotion, PublicNews, PublicFAQ, PublicData } from './types';
