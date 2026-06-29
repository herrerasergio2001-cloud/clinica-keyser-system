import { ReactNode } from 'react';

export function SectionLabel({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return <p className={`text-xs font-semibold uppercase tracking-[.22em] ${light ? 'text-white/55' : 'text-[#ef2f32]'}`}>{children}</p>;
}
