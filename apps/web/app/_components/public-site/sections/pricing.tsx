'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { SectionLabel } from '../ui/section-label';

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type PricingPlan = {
  id: string;
  name: string;
  kicker: string;
  description: string;
  price: string;
  currency: string;
  unit: string;
  category: string;
  features: string[];
  isFeatured: boolean;
};

export function PricingPlans() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch(`${apiBase}/api/public/pricing-plans`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to load pricing plans');
        const data = (await response.json()) as PricingPlan[];
        if (active) setPlans(data);
      } catch (error) {
        console.error('Error loading pricing plans:', error);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return null;
  if (!plans.length) return null;

  return (
    <section className="scroll-mt-24 bg-gradient-to-b from-[#fbfaf7] to-[#f1f5fc] px-5 py-20 sm:py-28 lg:px-10">
      <div className="mx-auto max-w-[1320px]">
        <div className="max-w-2xl">
          <SectionLabel>Nuestros planes</SectionLabel>
          <h2 className="font-display mt-5 text-4xl font-medium tracking-[-0.025em] text-[#17234c] sm:text-6xl">
            Atención médica accesible
          </h2>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            Planes flexibles diseñados para tu necesidad
          </p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className={`relative rounded-[16px] p-8 sm:p-9 transition ${
                plan.isFeatured
                  ? 'border-2 border-[#ef2f32] bg-white shadow-2xl shadow-[#ef2f32]/10'
                  : 'border border-slate-200 bg-white'
              }`}
            >
              {plan.isFeatured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#ef2f32] px-4 py-1 text-xs font-bold text-white rounded-full">
                  RECOMENDADO
                </div>
              )}

              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ef2f32]">{plan.kicker}</p>
                <h3 className="font-display mt-3 text-2xl font-medium text-[#17234c]">{plan.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{plan.description}</p>
              </div>

              <div className="mb-7 border-y border-slate-200 py-6">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-4xl font-medium text-[#1f2f66]">{plan.price}</span>
                  <span className="text-sm text-slate-500">{plan.unit}</span>
                </div>
              </div>

              <div className="space-y-3 mb-7">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex gap-3">
                    <Check className="h-5 w-5 text-[#ef2f32] flex-shrink-0 mt-0.5" />
                    <span className="text-sm leading-6 text-slate-600">{feature}</span>
                  </div>
                ))}
              </div>

              <button className={`w-full py-3 px-4 rounded-[12px] font-semibold text-sm transition ${
                plan.isFeatured
                  ? 'bg-[#ef2f32] text-white hover:bg-[#d62a2f]'
                  : 'bg-slate-100 text-[#1f2f66] hover:bg-slate-200'
              }`}>
                Solicitar información
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
