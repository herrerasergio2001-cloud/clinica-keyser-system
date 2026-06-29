import type { PublicService } from '../types';
import { SectionLabel } from '../ui/section-label';

export function ServicesSection({ services }: { services: PublicService[] }) {
  return (
    <section id="servicios" className="scroll-mt-24 bg-[#16244d] px-5 py-20 text-white sm:py-28 lg:px-10">
      <div className="mx-auto max-w-[1320px]">
        <div className="max-w-2xl">
          <SectionLabel light>Servicios médicos</SectionLabel>
          <h2 className="font-display mt-5 text-4xl font-medium tracking-[-0.025em] sm:text-6xl">Atención integral, en un solo lugar.</h2>
        </div>
        <div className="mt-14 grid border-t border-white/20 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <article key={service.id} className="group flex min-h-36 items-start gap-5 border-b border-white/20 py-7 pr-5 sm:odd:border-r sm:even:pl-7 lg:border-r lg:px-7 lg:first:pl-0 lg:nth-[3n]:border-r-0">
              <span className="mt-1 text-xs tabular-nums text-white/40">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3 className="text-lg font-medium leading-7 text-white">{service.title}</h3>
                {service.category && <p className="mt-2 text-sm text-white/48">{service.category}</p>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
