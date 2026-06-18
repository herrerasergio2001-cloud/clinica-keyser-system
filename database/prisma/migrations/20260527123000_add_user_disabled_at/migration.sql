-- The application already uses these fields to disable and restore users.
-- Keep this idempotent because some environments have the older safe-delete migration
-- marked as applied even when the columns are missing from the actual database.
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "disabledAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "disabledBy" TEXT,
  ADD COLUMN IF NOT EXISTS "disableReason" TEXT;
