import Link from 'next/link';
import type { Settings } from './types';
import { mediaUrl } from './utils';

export function Footer({ settings }: { settings: Settings }) {
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
