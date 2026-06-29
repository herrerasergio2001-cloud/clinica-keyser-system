'use client';

import { useEffect, useState } from 'react';
import { SectionLabel } from '../ui/section-label';

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type Procedure = {
  id: string;
  name: string;
  description: string;
  specialty: string;
  icon?: string;
  imageUrl?: string;
};

export function ProceduresGallery() {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch(`${apiBase}/api/public/procedures`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to load procedures');
        const data = (await response.json()) as Procedure[];
        if (active) setProcedures(data);
      } catch (error) {
        console.error('Error loading procedures:', error);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  if (loading || !procedures.length) return null;

  const bySpecialty = procedures.reduce(
    (acc, proc) => {
      if (!acc[proc.specialty]) acc[proc.specialty] = [];
      acc[proc.specialty].push(proc);
      return acc;
    },
    {} as Record<string, Procedure[]>
  );

  return (
    <section className="scroll-mt-24 px-5 py-20 sm:py-28 lg:px-10">
      <div className="mx-auto max-w-[1320px]">
        <div className="max-w-2xl">
          <SectionLabel>Procedimientos</SectionLabel>
          <h2 className="font-display mt-5 text-4xl font-medium tracking-[-0.025em] text-[#17234c] sm:text-6xl">
            Tratamientos especializados
          </h2>
        </div>

        <div className="mt-14 space-y-14">
          {Object.entries(bySpecialty).map(([specialty, specs]) => (
            <div key={specialty}>
              <h3 className="font-display text-2xl font-medium text-[#1f2f66] mb-6">{specialty}</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {specs.map((proc) => (
                  <article
                    key={proc.id}
                    className="group rounded-[14px] border border-slate-200 overflow-hidden bg-white hover:shadow-lg transition"
                  >
                    {proc.imageUrl && (
                      <div className="aspect-video overflow-hidden bg-slate-100">
                        <img
                          src={proc.imageUrl}
                          alt={proc.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h4 className="font-display text-lg font-medium text-[#17234c]">{proc.name}</h4>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{proc.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
