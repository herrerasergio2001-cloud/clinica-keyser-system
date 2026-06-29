import { ReactNode } from 'react';

export function ContactLine({ icon, label, value, href, external = false }: { icon: ReactNode; label: string; value: string; href?: string; external?: boolean }) {
  const content = (
    <>
      <span className="mt-1 text-[#1f2f66] [&_svg]:h-5 [&_svg]:w-5">{icon}</span>
      <span>
        <span className="block text-xs font-semibold uppercase tracking-[.15em] text-slate-400">{label}</span>
        <span className="mt-1 block text-sm leading-6 text-slate-700">{value}</span>
      </span>
    </>
  );
  return href ? (
    <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} className="flex gap-4 py-5 hover:bg-white">{content}</a>
  ) : (
    <div className="flex gap-4 py-5">{content}</div>
  );
}
