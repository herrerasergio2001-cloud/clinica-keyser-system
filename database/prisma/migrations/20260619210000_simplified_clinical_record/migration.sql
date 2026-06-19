CREATE TYPE "ClinicalEntryStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "StudyCategory" AS ENUM ('LABORATORY', 'IMAGING');

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'EVOLUTION_RESTORED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PROCEDURE_ARCHIVED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PROCEDURE_RESTORED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'STUDY_ARCHIVED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'STUDY_RESTORED';

ALTER TABLE "EvolutionNote" ADD COLUMN "content" TEXT;

UPDATE "Role"
SET "permissions" = array_append(
  CASE
    WHEN NOT ('medical-records:read' = ANY("permissions")) THEN "permissions"
    ELSE array_remove("permissions", 'medical-records:read')
  END,
  'medical-records:read'
)
WHERE "name" = 'LABORATORY';

UPDATE "Role"
SET "permissions" = array_append(
  CASE
    WHEN NOT ('attachments:read' = ANY("permissions")) THEN "permissions"
    ELSE array_remove("permissions", 'attachments:read')
  END,
  'attachments:read'
)
WHERE "name" = 'LABORATORY';

UPDATE "EvolutionNote"
SET "content" = NULLIF(
  concat_ws(
    E'\n\n',
    NULLIF(BTRIM("subjective"), ''),
    NULLIF(BTRIM("objective"), ''),
    NULLIF(BTRIM("assessment"), ''),
    NULLIF(BTRIM("plan"), '')
  ),
  ''
)
WHERE "content" IS NULL;

UPDATE "EvolutionNote"
SET "content" = 'Nota clínica migrada sin contenido.'
WHERE "content" IS NULL OR BTRIM("content") = '';

ALTER TABLE "EvolutionNote"
  ALTER COLUMN "content" SET NOT NULL,
  DROP COLUMN "subjective",
  DROP COLUMN "objective",
  DROP COLUMN "assessment",
  DROP COLUMN "plan";

DROP TABLE IF EXISTS "BodyMapFinding";
ALTER TABLE "ImagingOrder" DROP COLUMN IF EXISTS "anatomyRegion";

CREATE TABLE "ClinicalProcedure" (
  "id" TEXT NOT NULL,
  "medicalRecordId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "performedAt" TIMESTAMP(3) NOT NULL,
  "relatedDiagnosis" TEXT,
  "description" TEXT NOT NULL,
  "observations" TEXT,
  "status" "ClinicalEntryStatus" NOT NULL DEFAULT 'ACTIVE',
  "archivedAt" TIMESTAMP(3),
  "archivedBy" TEXT,
  "archiveReason" TEXT,
  "createdById" TEXT NOT NULL,
  "updatedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClinicalProcedure_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DiagnosticStudy" (
  "id" TEXT NOT NULL,
  "medicalRecordId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "category" "StudyCategory" NOT NULL,
  "studyType" TEXT NOT NULL,
  "studyDate" TIMESTAMP(3) NOT NULL,
  "results" TEXT,
  "observations" TEXT,
  "createdByRole" "RoleName" NOT NULL,
  "status" "ClinicalEntryStatus" NOT NULL DEFAULT 'ACTIVE',
  "archivedAt" TIMESTAMP(3),
  "archivedBy" TEXT,
  "archiveReason" TEXT,
  "createdById" TEXT NOT NULL,
  "updatedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DiagnosticStudy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClinicalEntryAttachment" (
  "id" TEXT NOT NULL,
  "procedureId" TEXT,
  "studyId" TEXT,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "storageKey" TEXT NOT NULL,
  "uploadedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClinicalEntryAttachment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ClinicalEntryAttachment_owner_check" CHECK (
    ("procedureId" IS NOT NULL AND "studyId" IS NULL)
    OR ("procedureId" IS NULL AND "studyId" IS NOT NULL)
  )
);

CREATE INDEX "ClinicalProcedure_medicalRecordId_performedAt_idx" ON "ClinicalProcedure"("medicalRecordId", "performedAt");
CREATE INDEX "ClinicalProcedure_patientId_idx" ON "ClinicalProcedure"("patientId");
CREATE INDEX "ClinicalProcedure_status_idx" ON "ClinicalProcedure"("status");
CREATE INDEX "DiagnosticStudy_medicalRecordId_studyDate_idx" ON "DiagnosticStudy"("medicalRecordId", "studyDate");
CREATE INDEX "DiagnosticStudy_patientId_idx" ON "DiagnosticStudy"("patientId");
CREATE INDEX "DiagnosticStudy_category_idx" ON "DiagnosticStudy"("category");
CREATE INDEX "DiagnosticStudy_status_idx" ON "DiagnosticStudy"("status");
CREATE INDEX "ClinicalEntryAttachment_procedureId_idx" ON "ClinicalEntryAttachment"("procedureId");
CREATE INDEX "ClinicalEntryAttachment_studyId_idx" ON "ClinicalEntryAttachment"("studyId");

ALTER TABLE "ClinicalProcedure"
  ADD CONSTRAINT "ClinicalProcedure_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "ClinicalProcedure_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "ClinicalProcedure_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DiagnosticStudy"
  ADD CONSTRAINT "DiagnosticStudy_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DiagnosticStudy_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DiagnosticStudy_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ClinicalEntryAttachment"
  ADD CONSTRAINT "ClinicalEntryAttachment_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "ClinicalProcedure"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "ClinicalEntryAttachment_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "DiagnosticStudy"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "ClinicalEntryAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
