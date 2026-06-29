import { SectionLabel } from './section-label';

export function InteriorHero({ title, text }: { title: string; text: string }) {
  return (
    <section className="bg-[#16244d] px-5 py-24 text-white lg:px-10">
      <div className="mx-auto max-w-[1320px]">
        <SectionLabel light>Clínica Keyser</SectionLabel>
        <h1 className="font-display mt-5 text-5xl font-medium tracking-[-.025em] sm:text-7xl">{title}</h1>
        <p className="mt-5 max-w-xl text-lg text-white/65">{text}</p>
      </div>
    </section>
  );
}
