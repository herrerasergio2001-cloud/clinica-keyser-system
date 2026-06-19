-- Extend the public-site configuration without replacing existing content.
ALTER TABLE "PublicSiteSettings"
ADD COLUMN "heroImageUrl" TEXT DEFAULT '/clinic-media/fachada.jpg',
ADD COLUMN "heroVideoUrl" TEXT,
ADD COLUMN "institutionalText" TEXT NOT NULL DEFAULT 'Cuidamos de cada paciente con atención cercana, criterio médico y el respaldo de un equipo comprometido con su bienestar.',
ADD COLUMN "institutionalImageUrl" TEXT DEFAULT '/clinic-media/consulta-medica.jpg',
ADD COLUMN "aestheticFacebookUrl" TEXT,
ADD COLUMN "aestheticInstagramUrl" TEXT,
ADD COLUMN "aestheticTiktokUrl" TEXT;

ALTER TABLE "PublicSiteSettings"
ALTER COLUMN "slogan" SET DEFAULT 'Atención médica integral en Chinandega.';

CREATE TABLE "PublicGalleryImage" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "altText" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicGalleryImage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PublicTeamMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicTeamMember_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PublicGalleryImage_isActive_idx" ON "PublicGalleryImage"("isActive");
CREATE INDEX "PublicGalleryImage_sortOrder_idx" ON "PublicGalleryImage"("sortOrder");
CREATE INDEX "PublicGalleryImage_category_idx" ON "PublicGalleryImage"("category");
CREATE INDEX "PublicTeamMember_isActive_idx" ON "PublicTeamMember"("isActive");
CREATE INDEX "PublicTeamMember_sortOrder_idx" ON "PublicTeamMember"("sortOrder");

INSERT INTO "PublicGalleryImage" ("id", "title", "altText", "imageUrl", "category", "isActive", "sortOrder", "updatedAt")
VALUES
  ('keyser-gallery-facade', 'Fachada', 'Fachada principal de Clínica Keyser', '/clinic-media/fachada.jpg', 'Fachada', true, 1, CURRENT_TIMESTAMP),
  ('keyser-gallery-reception', 'Recepción principal', 'Recepción y área de espera de Clínica Keyser', '/clinic-media/recepcion-principal.jpg', 'Recepción', true, 2, CURRENT_TIMESTAMP),
  ('keyser-gallery-consultation', 'Consulta médica', 'Atención médica personalizada en Clínica Keyser', '/clinic-media/consulta-medica.jpg', 'Consultorios', true, 3, CURRENT_TIMESTAMP),
  ('keyser-gallery-waiting', 'Área de espera', 'Área de espera de Clínica Keyser', '/clinic-media/sala-espera.jpg', 'Área de espera', true, 4, CURRENT_TIMESTAMP),
  ('keyser-gallery-specialties', 'Área de especialidades', 'Pasillo de consultorios y atención especializada', '/clinic-media/pasillo-laboratorio.jpg', 'Atención especializada', true, 5, CURRENT_TIMESTAMP),
  ('keyser-gallery-corridor', 'Instalaciones', 'Instalaciones interiores de Clínica Keyser', '/clinic-media/area-espera.jpg', 'Instalaciones', true, 6, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "PublicTeamMember" ("id", "name", "specialty", "description", "imageUrl", "isActive", "sortOrder", "updatedAt")
VALUES (
  'keyser-team-medical',
  'Equipo médico Clínica Keyser',
  'Atención integral y especialidades médicas',
  'Profesionales comprometidos con una atención cercana, ética y personalizada.',
  '/clinic-media/consulta-medica.jpg',
  true,
  1,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;

-- Keep legacy services available in administration, but publish the curated list requested for the new site.
UPDATE "PublicService"
SET "isActive" = false, "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" NOT IN (
  'medicina-general',
  'medicina-interna',
  'ginecologia',
  'neurologia-pediatrica',
  'cirugia',
  'ortopedia',
  'odontologia',
  'psicologia',
  'cardiologia',
  'ultrasonido',
  'sistema-orion'
);

INSERT INTO "PublicService" ("id", "title", "slug", "description", "content", "icon", "category", "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES
  ('keyser-service-general', 'Medicina General', 'medicina-general', 'Atención médica integral para toda la familia.', 'Evaluación clínica, prevención y seguimiento personalizado.', 'stethoscope', 'Consulta', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('keyser-service-internal', 'Medicina Interna', 'medicina-interna', 'Valoración integral del paciente adulto.', 'Diagnóstico y seguimiento de condiciones médicas complejas.', 'activity', 'Especialidad', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('keyser-service-gynecology', 'Ginecología', 'ginecologia', 'Cuidado integral de la salud femenina.', 'Consulta, prevención y seguimiento ginecológico.', 'venus', 'Especialidad', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('keyser-service-neuropediatrics', 'Neurología Pediátrica', 'neurologia-pediatrica', 'Atención especializada para niñas, niños y adolescentes.', 'Valoración neurológica pediátrica con enfoque familiar.', 'brain', 'Especialidad', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('keyser-service-surgery', 'Cirugía', 'cirugia', 'Valoración quirúrgica y seguimiento clínico.', 'Evaluación y orientación según criterio médico.', 'scissors', 'Especialidad', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('keyser-service-orthopedics', 'Ortopedia', 'ortopedia', 'Evaluación de dolor, lesiones y movilidad.', 'Atención de condiciones musculoesqueléticas.', 'bone', 'Especialidad', true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('keyser-service-dentistry', 'Odontología', 'odontologia', 'Prevención y atención integral de la salud bucal.', 'Valoración y tratamientos odontológicos.', 'tooth', 'Especialidad', true, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('keyser-service-psychology', 'Psicología', 'psicologia', 'Acompañamiento profesional para el bienestar emocional.', 'Atención psicológica personalizada.', 'brain', 'Salud mental', true, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('keyser-service-cardiology', 'Cardiología', 'cardiologia', 'Evaluación y seguimiento de la salud cardiovascular.', 'Consulta y apoyo diagnóstico cardiovascular.', 'heart-pulse', 'Especialidad', true, 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('keyser-service-ultrasound', 'Ultrasonidos', 'ultrasonido', 'Estudios de imagen con atención profesional.', 'Ultrasonidos realizados con criterio clínico y atención cercana.', 'scan', 'Diagnóstico', true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('keyser-service-orion', 'Sistema Orión para la gestión segura del expediente clínico', 'sistema-orion', 'Tecnología para organizar y proteger la información médica.', 'Gestión segura del expediente clínico.', 'shield', 'Tecnología clínica', true, 11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO UPDATE SET
  "title" = EXCLUDED."title",
  "description" = EXCLUDED."description",
  "content" = EXCLUDED."content",
  "icon" = EXCLUDED."icon",
  "category" = EXCLUDED."category",
  "isActive" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = CURRENT_TIMESTAMP;

UPDATE "PublicSiteSettings"
SET
  "slogan" = 'Atención médica integral en Chinandega.',
  "logoUrl" = '/clinic-media/logo.png',
  "heroImageUrl" = COALESCE("heroImageUrl", '/clinic-media/fachada.jpg'),
  "institutionalImageUrl" = COALESCE("institutionalImageUrl", '/clinic-media/consulta-medica.jpg'),
  "instagramUrl" = COALESCE("instagramUrl", 'https://www.instagram.com/clinicakeyser'),
  "aestheticTiktokUrl" = COALESCE("aestheticTiktokUrl", 'https://www.tiktok.com/@centro_estetico_keyser'),
  "updatedAt" = CURRENT_TIMESTAMP;
