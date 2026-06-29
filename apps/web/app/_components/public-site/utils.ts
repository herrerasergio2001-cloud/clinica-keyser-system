'use client';

import { useEffect, useState } from 'react';
import type { PublicData, Settings } from './types';
import { fallbackGallery, fallbackServices, fallbackSettings, fallbackTeam } from './data';

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export function usePublicData(): PublicData {
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
        getPublic<PublicData['services']>('/api/public/services', []),
        getPublic<PublicData['gallery']>('/api/public/gallery', []),
        getPublic<PublicData['team']>('/api/public/team', []),
        getPublic<PublicData['promotions']>('/api/public/promotions', []),
        getPublic<PublicData['news']>('/api/public/news', []),
        getPublic<PublicData['faqs']>('/api/public/faqs', []),
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

export function mediaUrl(value?: string | null) {
  if (!value) return '';
  if (value.startsWith('/api/')) return `${apiBase}${value}`;
  return value;
}

export function whatsappUrl(settings: Settings, message = 'Hola Clínica Keyser, deseo recibir información.') {
  return `https://wa.me/${cleanPhone(settings.whatsapp)}?text=${encodeURIComponent(message)}`;
}

export function cleanPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits.startsWith('505') ? digits : `505${digits}`;
}

export function formatPhone(value: string) {
  const digits = cleanPhone(value);
  return digits.length === 11 ? `+${digits.slice(0, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}` : value;
}

export function galleryClass(index: number) {
  if (index === 0) return 'sm:col-span-2 lg:col-span-7 lg:row-span-2';
  if (index === 1) return 'lg:col-span-5';
  if (index === 2) return 'lg:col-span-5';
  if (index === 3) return 'lg:col-span-4';
  if (index === 4) return 'lg:col-span-4';
  return 'lg:col-span-4';
}
