import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPublicSiteData() {
  console.log('Seeding public site data...');

  // 1. Testimonios
  const testimonials = await Promise.all([
    prisma.publicTestimonial.upsert({
      where: { id: 'testimonial-1' },
      update: {},
      create: {
        id: 'testimonial-1',
        quote: 'Me atendieron el mismo día y el laboratorio me dio resultados rapidísimo. Excelente trato.',
        patientName: 'María G.',
        service: 'Laboratorio clínico',
        rating: 5,
        verified: true,
        sortOrder: 1,
        isActive: true,
      },
    }),
    prisma.publicTestimonial.upsert({
      where: { id: 'testimonial-2' },
      update: {},
      create: {
        id: 'testimonial-2',
        quote: 'El Hollywood Peel dejó mi piel increíble. El equipo es súper profesional y cálido.',
        patientName: 'Andrea L.',
        service: 'Tratamiento estético',
        rating: 5,
        verified: true,
        sortOrder: 2,
        isActive: true,
      },
    }),
    prisma.publicTestimonial.upsert({
      where: { id: 'testimonial-3' },
      update: {},
      create: {
        id: 'testimonial-3',
        quote: 'Llevo a mis hijos a pediatría aquí. Confianza total y atención de primera.',
        patientName: 'Carlos R.',
        service: 'Pediatría',
        rating: 5,
        verified: true,
        sortOrder: 3,
        isActive: true,
      },
    }),
  ]);
  console.log(`✓ Created ${testimonials.length} testimonials`);

  // 2. Planes de Precios
  const plans = await Promise.all([
    prisma.publicPricingPlan.upsert({
      where: { name: 'Consulta general' },
      update: {},
      create: {
        name: 'Consulta general',
        kicker: 'Consulta general',
        description: 'Atención médica general integral con evaluación completa',
        price: 'C$ 500',
        currency: 'C$',
        unit: 'por consulta',
        category: 'medical',
        features: [
          'Atención de medicina general',
          'Receta y plan de tratamiento',
          'Referencia a especialista si aplica',
        ],
        isFeatured: false,
        sortOrder: 1,
        isActive: true,
      },
    }),
    prisma.publicPricingPlan.upsert({
      where: { name: 'Consulta de especialidad' },
      update: {},
      create: {
        name: 'Consulta de especialidad',
        kicker: 'Consulta de especialidad',
        description: 'Consulta con especialista médico certificado',
        price: 'C$ 800',
        currency: 'C$',
        unit: 'por especialista',
        category: 'medical',
        features: [
          'Pediatría, ginecología, interna y más',
          'Evaluación detallada',
          'Seguimiento personalizado',
        ],
        isFeatured: true,
        sortOrder: 2,
        isActive: true,
      },
    }),
    prisma.publicPricingPlan.upsert({
      where: { name: 'Valoración estética' },
      update: {},
      create: {
        name: 'Valoración estética',
        kicker: 'Valoración estética',
        description: 'Valoración inicial de tratamientos estéticos',
        price: '$20',
        currency: '$',
        unit: 'valoración inicial',
        category: 'aesthetic',
        features: [
          'Diagnóstico de piel y necesidades',
          'Plan de tratamiento a medida',
          'Abonable a tu procedimiento',
        ],
        isFeatured: false,
        sortOrder: 3,
        isActive: true,
      },
    }),
  ]);
  console.log(`✓ Created ${plans.length} pricing plans`);

  // 3. Procedimientos Ginecología
  const procedures = await Promise.all([
    prisma.publicProcedure.upsert({
      where: { id: 'procedure-gynec-1' },
      update: {},
      create: {
        id: 'procedure-gynec-1',
        name: 'Papanicolaou (PAP)',
        description: 'Detección temprana del cáncer cervicouterino.',
        specialty: 'Gynecology',
        sortOrder: 1,
        isActive: true,
      },
    }),
    prisma.publicProcedure.upsert({
      where: { id: 'procedure-gynec-2' },
      update: {},
      create: {
        id: 'procedure-gynec-2',
        name: 'Colposcopía',
        description: 'Evaluación detallada del cuello uterino ante resultados alterados.',
        specialty: 'Gynecology',
        sortOrder: 2,
        isActive: true,
      },
    }),
    prisma.publicProcedure.upsert({
      where: { id: 'procedure-gynec-3' },
      update: {},
      create: {
        id: 'procedure-gynec-3',
        name: 'Vacuna contra el VPH',
        description: 'Prevención del virus del papiloma humano.',
        specialty: 'Gynecology',
        sortOrder: 3,
        isActive: true,
      },
    }),
    prisma.publicProcedure.upsert({
      where: { id: 'procedure-gynec-4' },
      update: {},
      create: {
        id: 'procedure-gynec-4',
        name: 'Colocación de DIU',
        description: 'Anticoncepción de larga duración, segura y reversible.',
        specialty: 'Gynecology',
        sortOrder: 4,
        isActive: true,
      },
    }),
    prisma.publicProcedure.upsert({
      where: { id: 'procedure-gynec-5' },
      update: {},
      create: {
        id: 'procedure-gynec-5',
        name: 'Implante subdérmico',
        description: 'Método anticonceptivo discreto y efectivo por varios años.',
        specialty: 'Gynecology',
        sortOrder: 5,
        isActive: true,
      },
    }),
    prisma.publicProcedure.upsert({
      where: { id: 'procedure-gynec-6' },
      update: {},
      create: {
        id: 'procedure-gynec-6',
        name: 'Control ginecológico',
        description: 'Chequeo integral y consejería en salud femenina.',
        specialty: 'Gynecology',
        sortOrder: 6,
        isActive: true,
      },
    }),
  ]);
  console.log(`✓ Created ${procedures.length} procedures`);

  console.log('✅ Seed data completed successfully!');
}

seedPublicSiteData()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
