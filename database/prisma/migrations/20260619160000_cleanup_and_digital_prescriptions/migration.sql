ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'USER_DELETED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PATIENT_DISABLED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PATIENT_ENABLED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DIGITAL_PRESCRIPTION_VOIDED';

ALTER TABLE "AuditLog"
  ADD COLUMN IF NOT EXISTS "actorName" TEXT,
  ADD COLUMN IF NOT EXISTS "actorEmail" TEXT;

UPDATE "AuditLog" audit
SET
  "actorName" = COALESCE(audit."actorName", actor."fullName"),
  "actorEmail" = COALESCE(audit."actorEmail", actor.email)
FROM "User" actor
WHERE audit."actorId" = actor.id;

CREATE TABLE IF NOT EXISTS "DigitalPrescription" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "patientName" TEXT NOT NULL,
  "patientAge" TEXT,
  "diagnosis" TEXT,
  "indications" TEXT,
  "medications" JSONB NOT NULL,
  "studies" JSONB NOT NULL,
  "doctorId" TEXT NOT NULL,
  "doctorName" TEXT NOT NULL,
  "doctorCode" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "version" INTEGER NOT NULL DEFAULT 1,
  "voidedAt" TIMESTAMP(3),
  "voidedBy" TEXT,
  "voidReason" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DigitalPrescription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DigitalPrescriptionVersion" (
  "id" TEXT NOT NULL,
  "digitalPrescriptionId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "snapshot" JSONB NOT NULL,
  "changeReason" TEXT NOT NULL,
  "editedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DigitalPrescriptionVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DigitalPrescription_code_key" ON "DigitalPrescription"("code");
CREATE INDEX IF NOT EXISTS "DigitalPrescription_patientName_idx" ON "DigitalPrescription"("patientName");
CREATE INDEX IF NOT EXISTS "DigitalPrescription_doctorId_idx" ON "DigitalPrescription"("doctorId");
CREATE INDEX IF NOT EXISTS "DigitalPrescription_status_idx" ON "DigitalPrescription"("status");
CREATE INDEX IF NOT EXISTS "DigitalPrescription_createdAt_idx" ON "DigitalPrescription"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "DigitalPrescriptionVersion_digitalPrescriptionId_version_key"
  ON "DigitalPrescriptionVersion"("digitalPrescriptionId", "version");
CREATE INDEX IF NOT EXISTS "DigitalPrescriptionVersion_editedById_idx" ON "DigitalPrescriptionVersion"("editedById");
CREATE INDEX IF NOT EXISTS "DigitalPrescriptionVersion_createdAt_idx" ON "DigitalPrescriptionVersion"("createdAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DigitalPrescription_doctorId_fkey') THEN
    ALTER TABLE "DigitalPrescription"
      ADD CONSTRAINT "DigitalPrescription_doctorId_fkey"
      FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DigitalPrescription_createdById_fkey') THEN
    ALTER TABLE "DigitalPrescription"
      ADD CONSTRAINT "DigitalPrescription_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DigitalPrescriptionVersion_digitalPrescriptionId_fkey') THEN
    ALTER TABLE "DigitalPrescriptionVersion"
      ADD CONSTRAINT "DigitalPrescriptionVersion_digitalPrescriptionId_fkey"
      FOREIGN KEY ("digitalPrescriptionId") REFERENCES "DigitalPrescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DigitalPrescriptionVersion_editedById_fkey') THEN
    ALTER TABLE "DigitalPrescriptionVersion"
      ADD CONSTRAINT "DigitalPrescriptionVersion_editedById_fkey"
      FOREIGN KEY ("editedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
