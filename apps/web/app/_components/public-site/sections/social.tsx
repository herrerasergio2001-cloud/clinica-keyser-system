import { ReactNode } from 'react';
import { Facebook, Instagram } from 'lucide-react';
import type { Settings } from '../types';
import { TikTokIcon } from '../ui/tiktok-icon';

export function SocialSection({ settings }: { settings: Settings }) {
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
