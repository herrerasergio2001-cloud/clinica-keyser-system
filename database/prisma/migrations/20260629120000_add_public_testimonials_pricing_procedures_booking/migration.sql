-- CreateTable PublicTestimonial
CREATE TABLE IF NOT EXISTS "PublicTestimonial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quote" TEXT NOT NULL,
    "patientName" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "photoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable PublicPricingPlan
CREATE TABLE IF NOT EXISTS "PublicPricingPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "kicker" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'C$',
    "unit" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'medical',
    "features" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable PublicProcedure
CREATE TABLE IF NOT EXISTS "PublicProcedure" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "icon" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable PublicBookingRequest
CREATE TABLE IF NOT EXISTS "PublicBookingRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "service" TEXT NOT NULL,
    "requestedDate" TIMESTAMP(3) NOT NULL,
    "requestedTime" TEXT,
    "patientName" TEXT NOT NULL,
    "patientPhone" TEXT NOT NULL,
    "patientEmail" TEXT NOT NULL,
    "patientNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "appointmentId" TEXT UNIQUE,
    "respondedAt" TIMESTAMP(3),
    "respondedBy" TEXT,
    "responseNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PublicBookingRequest_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment" ("id") ON DELETE SET NULL
);

-- CreateIndex PublicTestimonial_isActive_idx
CREATE INDEX IF NOT EXISTS "PublicTestimonial_isActive_idx" ON "PublicTestimonial"("isActive");

-- CreateIndex PublicTestimonial_sortOrder_idx
CREATE INDEX IF NOT EXISTS "PublicTestimonial_sortOrder_idx" ON "PublicTestimonial"("sortOrder");

-- CreateIndex PublicPricingPlan_isActive_idx
CREATE INDEX IF NOT EXISTS "PublicPricingPlan_isActive_idx" ON "PublicPricingPlan"("isActive");

-- CreateIndex PublicPricingPlan_category_idx
CREATE INDEX IF NOT EXISTS "PublicPricingPlan_category_idx" ON "PublicPricingPlan"("category");

-- CreateIndex PublicPricingPlan_sortOrder_idx
CREATE INDEX IF NOT EXISTS "PublicPricingPlan_sortOrder_idx" ON "PublicPricingPlan"("sortOrder");

-- CreateIndex PublicProcedure_isActive_idx
CREATE INDEX IF NOT EXISTS "PublicProcedure_isActive_idx" ON "PublicProcedure"("isActive");

-- CreateIndex PublicProcedure_specialty_idx
CREATE INDEX IF NOT EXISTS "PublicProcedure_specialty_idx" ON "PublicProcedure"("specialty");

-- CreateIndex PublicProcedure_sortOrder_idx
CREATE INDEX IF NOT EXISTS "PublicProcedure_sortOrder_idx" ON "PublicProcedure"("sortOrder");

-- CreateIndex PublicBookingRequest_status_idx
CREATE INDEX IF NOT EXISTS "PublicBookingRequest_status_idx" ON "PublicBookingRequest"("status");

-- CreateIndex PublicBookingRequest_patientEmail_idx
CREATE INDEX IF NOT EXISTS "PublicBookingRequest_patientEmail_idx" ON "PublicBookingRequest"("patientEmail");

-- CreateIndex PublicBookingRequest_requestedDate_idx
CREATE INDEX IF NOT EXISTS "PublicBookingRequest_requestedDate_idx" ON "PublicBookingRequest"("requestedDate");

-- CreateIndex PublicBookingRequest_createdAt_idx
CREATE INDEX IF NOT EXISTS "PublicBookingRequest_createdAt_idx" ON "PublicBookingRequest"("createdAt");

-- AlterTable PublicService
ALTER TABLE "PublicService"
ADD COLUMN IF NOT EXISTS "pricing" TEXT,
ADD COLUMN IF NOT EXISTS "exclusiveTag" TEXT,
ADD COLUMN IF NOT EXISTS "procedures" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable Appointment
ALTER TABLE "Appointment"
ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'IN_PERSON',
ADD COLUMN IF NOT EXISTS "publicRequestId" TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Appointment_publicRequestId_key'
    ) THEN
        ALTER TABLE "Appointment"
        ADD CONSTRAINT "Appointment_publicRequestId_key" UNIQUE ("publicRequestId");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Appointment_publicRequestId_fkey'
    ) THEN
        ALTER TABLE "Appointment"
        ADD CONSTRAINT "Appointment_publicRequestId_fkey"
        FOREIGN KEY ("publicRequestId") REFERENCES "PublicBookingRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
