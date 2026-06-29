import type { PublicTeamMember } from '../types';
import { mediaUrl } from '../utils';
import { SectionLabel } from '../ui/section-label';

export function TeamSection({ team }: { team: PublicTeamMember[] }) {
  return (
    <section id="equipo" className="scroll-mt-24 bg-[#f0f1ee] px-5 py-20 sm:py-28 lg:px-10">
      <div className="mx-auto max-w-[1320px]">
        <SectionLabel>Equipo médico</SectionLabel>
        <h2 className="font-display mt-5 max-w-3xl text-4xl font-medium tracking-[-0.025em] text-[#17234c] sm:text-6xl">Experiencia clínica con atención personal.</h2>
        <div className="mt-14 grid gap-8 md:grid-cols-2">
          {team.map((member) => (
            <article key={member.id} className="grid overflow-hidden bg-white lg:grid-cols-[1.12fr_.88fr]">
              <img src={mediaUrl(member.imageUrl) || '/clinic-media/consulta-medica.jpg'} alt={member.name} className="aspect-[4/3] h-full min-h-72 w-full object-cover" />
              <div className="flex flex-col justify-end p-7 sm:p-9">
                <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#ef2f32]">{member.specialty}</p>
                <h3 className="font-display mt-4 text-3xl font-medium text-[#17234c]">{member.name}</h3>
                <p className="mt-4 text-sm leading-7 text-slate-600">{member.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
