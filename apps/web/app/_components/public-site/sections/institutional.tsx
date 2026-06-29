import type { Settings } from '../types';
import { mediaUrl } from '../utils';
import { SectionLabel } from '../ui/section-label';

export function InstitutionalSection({ settings }: { settings: Settings }) {
  return (
    <section id="clinica" className="scroll-mt-24 px-5 py-20 sm:py-28 lg:px-10">
      <div className="mx-auto grid max-w-[1320px] items-center gap-12 lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
        <div>
          <SectionLabel>Clínica Keyser</SectionLabel>
          <h2 className="font-display mt-5 text-4xl font-medium leading-tight tracking-[-0.025em] text-[#17234c] sm:text-5xl">
            Medicina cercana, organizada y humana.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">{settings.institutionalText}</p>
        </div>
        <div className="overflow-hidden rounded-[2px] bg-slate-100">
          <img src={mediaUrl(settings.institutionalImageUrl) || '/clinic-media/consulta-medica.jpg'} alt="Atención personalizada en Clínica Keyser" className="aspect-[16/10] h-full w-full object-cover" />
        </div>
      </div>
    </section>
  );
}
