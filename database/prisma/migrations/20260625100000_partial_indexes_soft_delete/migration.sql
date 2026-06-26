-- Partial indexes on isDeleted = false for high-volume soft-delete tables.
-- These replace broad isDeleted B-tree scans with smaller indexes covering
-- only the active rows, which represent the vast majority of queries.

-- Drop existing plain isDeleted indexes before creating partial ones.

DROP INDEX IF EXISTS "Patient_isDeleted_idx";
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Patient_active_idx"
  ON "Patient" ("id") WHERE "isDeleted" = false;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Patient_fullName_active_idx"
  ON "Patient" ("fullName") WHERE "isDeleted" = false;

DROP INDEX IF EXISTS "MedicalRecord_isDeleted_idx";
CREATE INDEX CONCURRENTLY IF NOT EXISTS "MedicalRecord_active_idx"
  ON "MedicalRecord" ("patientId") WHERE "isDeleted" = false;

DROP INDEX IF EXISTS "Prescription_isDeleted_idx";
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Prescription_active_idx"
  ON "Prescription" ("patientId") WHERE "isDeleted" = false;

DROP INDEX IF EXISTS "Product_isDeleted_idx";
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Product_active_idx"
  ON "Product" ("id") WHERE "isDeleted" = false;

DROP INDEX IF EXISTS "ProductBatch_isDeleted_idx";
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ProductBatch_active_idx"
  ON "ProductBatch" ("productId", "availableQuantity") WHERE "isDeleted" = false;

DROP INDEX IF EXISTS "LabReagent_isDeleted_idx";
CREATE INDEX CONCURRENTLY IF NOT EXISTS "LabReagent_active_idx"
  ON "LabReagent" ("id") WHERE "isDeleted" = false;

DROP INDEX IF EXISTS "PrintableDocument_isDeleted_idx";
CREATE INDEX CONCURRENTLY IF NOT EXISTS "PrintableDocument_active_idx"
  ON "PrintableDocument" ("patientId") WHERE "isDeleted" = false;

DROP INDEX IF EXISTS "MedicalCertificate_isDeleted_idx";
CREATE INDEX CONCURRENTLY IF NOT EXISTS "MedicalCertificate_active_idx"
  ON "MedicalCertificate" ("patientId") WHERE "isDeleted" = false;

DROP INDEX IF EXISTS "ConsentDocument_isDeleted_idx";
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ConsentDocument_active_idx"
  ON "ConsentDocument" ("patientId") WHERE "isDeleted" = false;
