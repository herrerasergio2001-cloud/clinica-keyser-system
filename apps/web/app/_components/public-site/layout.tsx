'use client';

import Link from 'next/link';
import { ReactNode, useState } from 'react';
import { LockKeyhole, Menu, X } from 'lucide-react';
import type { PublicData } from './types';
import { Footer } from './footer';
import { PrivateAccessModal } from './modals/private-access';
import { AppointmentLink } from './ui/appointment-link';
import { mediaUrl } from './utils';

export function PublicLayout({ data, children }: { data: PublicData; children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [privateAccessOpen, setPrivateAccessOpen] = useState(false);
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
            <button type="button" onClick={() => setPrivateAccessOpen(true)} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-[#1f2f66]">
              <LockKeyhole className="h-4 w-4" />
              Acceso
            </button>
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
              <button type="button" onClick={() => { setMenuOpen(false); setPrivateAccessOpen(true); }} className="rounded-full border border-slate-300 px-5 py-3 text-center text-sm font-semibold">Acceso privado</button>
            </div>
          </aside>
        </div>
      )}

      {children}
      <Footer settings={data.settings} />
      {privateAccessOpen && <PrivateAccessModal onClose={() => setPrivateAccessOpen(false)} />}
    </main>
  );
}
