-- Safe-delete indexes. This migration is intentionally defensive because some
-- databases were created from an init migration that does not include every
-- soft-delete/status column targeted here.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ConsentDocument' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS "ConsentDocument_status_idx" ON "ConsentDocument"("status");
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ConsentDocument' AND column_name = 'isDeleted') THEN
    CREATE INDEX IF NOT EXISTS "ConsentDocument_isDeleted_idx" ON "ConsentDocument"("isDeleted");
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'EvolutionNote' AND column_name = 'isDeleted') THEN
    CREATE INDEX IF NOT EXISTS "EvolutionNote_isDeleted_idx" ON "EvolutionNote"("isDeleted");
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'EvolutionNote' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS "EvolutionNote_status_idx" ON "EvolutionNote"("status");
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ImagingOrder' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS "ImagingOrder_status_idx" ON "ImagingOrder"("status");
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ImagingOrder' AND column_name = 'isDeleted') THEN
    CREATE INDEX IF NOT EXISTS "ImagingOrder_isDeleted_idx" ON "ImagingOrder"("isDeleted");
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'LabOrder' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS "LabOrder_status_idx" ON "LabOrder"("status");
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'LabOrderExternal' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS "LabOrderExternal_status_idx" ON "LabOrderExternal"("status");
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'LabOrderExternal' AND column_name = 'isDeleted') THEN
    CREATE INDEX IF NOT EXISTS "LabOrderExternal_isDeleted_idx" ON "LabOrderExternal"("isDeleted");
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'LabReagent' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS "LabReagent_status_idx" ON "LabReagent"("status");
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'LabReagent' AND column_name = 'isDeleted') THEN
    CREATE INDEX IF NOT EXISTS "LabReagent_isDeleted_idx" ON "LabReagent"("isDeleted");
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'LabTemplate' AND column_name = 'isActive') THEN
    CREATE INDEX IF NOT EXISTS "LabTemplate_isActive_idx" ON "LabTemplate"("isActive");
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'LabTemplate' AND column_name = 'isDeleted') THEN
    CREATE INDEX IF NOT EXISTS "LabTemplate_isDeleted_idx" ON "LabTemplate"("isDeleted");
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'MedicalAttachment' AND column_name = 'isDeleted') THEN
    CREATE INDEX IF NOT EXISTS "MedicalAttachment_isDeleted_idx" ON "MedicalAttachment"("isDeleted");
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'MedicalCertificate' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS "MedicalCertificate_status_idx" ON "MedicalCertificate"("status");
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'MedicalCertificate' AND column_name = 'isDeleted') THEN
    CREATE INDEX IF NOT EXISTS "MedicalCertificate_isDeleted_idx" ON "MedicalCertificate"("isDeleted");
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'PatientAttachment' AND column_name = 'isDeleted') THEN
    CREATE INDEX IF NOT EXISTS "PatientAttachment_isDeleted_idx" ON "PatientAttachment"("isDeleted");
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'PharmacySale' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS "PharmacySale_status_idx" ON "PharmacySale"("status");
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'PrintableDocument' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS "PrintableDocument_status_idx" ON "PrintableDocument"("status");
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'PrintableDocument' AND column_name = 'isDeleted') THEN
    CREATE INDEX IF NOT EXISTS "PrintableDocument_isDeleted_idx" ON "PrintableDocument"("isDeleted");
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ProductBatch' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS "ProductBatch_status_idx" ON "ProductBatch"("status");
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ProductBatch' AND column_name = 'isDeleted') THEN
    CREATE INDEX IF NOT EXISTS "ProductBatch_isDeleted_idx" ON "ProductBatch"("isDeleted");
  END IF;
END $$;
