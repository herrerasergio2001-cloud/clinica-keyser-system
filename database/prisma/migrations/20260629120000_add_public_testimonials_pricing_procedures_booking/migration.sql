-- CreateTable PublicTestimonial
CREATE TABLE "PublicTestimonial" (
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
CREATE TABLE "PublicPricingPlan" (
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
CREATE TABLE "PublicProcedure" (
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
CREATE TABLE "PublicBookingRequest" (
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
CREATE INDEX "PublicTestimonial_isActive_idx" ON "PublicTestimonial"("isActive");

-- CreateIndex PublicTestimonial_sortOrder_idx
CREATE INDEX "PublicTestimonial_sortOrder_idx" ON "PublicTestimonial"("sortOrder");

-- CreateIndex PublicPricingPlan_isActive_idx
CREATE INDEX "PublicPricingPlan_isActive_idx" ON "PublicPricingPlan"("isActive");

-- CreateIndex PublicPricingPlan_category_idx
CREATE INDEX "PublicPricingPlan_category_idx" ON "PublicPricingPlan"("category");

-- CreateIndex PublicPricingPlan_sortOrder_idx
CREATE INDEX "PublicPricingPlan_sortOrder_idx" ON "PublicPricingPlan"("sortOrder");

-- CreateIndex PublicProcedure_isActive_idx
CREATE INDEX "PublicProcedure_isActive_idx" ON "PublicProcedure"("isActive");

-- CreateIndex PublicProcedure_specialty_idx
CREATE INDEX "PublicProcedure_specialty_idx" ON "PublicProcedure"("specialty");

-- CreateIndex PublicProcedure_sortOrder_idx
CREATE INDEX "PublicProcedure_sortOrder_idx" ON "PublicProcedure"("sortOrder");

-- CreateIndex PublicBookingRequest_status_idx
CREATE INDEX "PublicBookingRequest_status_idx" ON "PublicBookingRequest"("status");

-- CreateIndex PublicBookingRequest_patientEmail_idx
CREATE INDEX "PublicBookingRequest_patientEmail_idx" ON "PublicBookingRequest"("patientEmail");

-- CreateIndex PublicBookingRequest_requestedDate_idx
CREATE INDEX "PublicBookingRequest_requestedDate_idx" ON "PublicBookingRequest"("requestedDate");

-- CreateIndex PublicBookingRequest_createdAt_idx
CREATE INDEX "PublicBookingRequest_createdAt_idx" ON "PublicBookingRequest"("createdAt");

-- AlterTable PublicService
ALTER TABLE "PublicService" ADD COLUMN "pricing" TEXT,
ADD COLUMN "exclusiveTag" TEXT,
ADD COLUMN "procedures" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable Appointment
ALTER TABLE "Appointment" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'IN_PERSON',
ADD CONSTRAINT "Appointment_publicRequestId_key" UNIQUE("publicRequestId");
