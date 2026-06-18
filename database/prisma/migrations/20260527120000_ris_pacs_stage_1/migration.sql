-- CreateEnum
CREATE TYPE "UltrasoundPriority" AS ENUM ('ROUTINE', 'URGENT');

-- CreateEnum
CREATE TYPE "UltrasoundOrderStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'PERFORMED', 'REPORTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PacsStudyStatus" AS ENUM ('RECEIVED', 'UNASSOCIATED', 'ERROR');

-- CreateEnum
CREATE TYPE "UltrasoundReportStatus" AS ENUM ('DRAFT', 'SIGNED');

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ULTRASOUND_ORDER_CANCELLED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PACS_STUDY_ASSOCIATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ULTRASOUND_REPORT_SIGNED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DICOM_CONFIG_UPDATED';

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN "patientId" TEXT;
ALTER TABLE "Patient" ADD COLUMN "expediente" TEXT;
ALTER TABLE "Patient" ADD COLUMN "observations" TEXT;

UPDATE "Patient"
SET
  "patientId" = COALESCE(NULLIF("patientCode", ''), "id"),
  "expediente" = COALESCE(NULLIF("patientCode", ''), "id")
WHERE "patientId" IS NULL;

ALTER TABLE "Patient" ALTER COLUMN "patientId" SET NOT NULL;

-- CreateTable
CREATE TABLE "UltrasoundOrder" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "accessionNumber" TEXT NOT NULL,
    "studyType" TEXT NOT NULL,
    "studyDescription" TEXT NOT NULL,
    "requestingPhysician" TEXT,
    "priority" "UltrasoundPriority" NOT NULL DEFAULT 'ROUTINE',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "presumptiveDiagnosis" TEXT,
    "indications" TEXT,
    "status" "UltrasoundOrderStatus" NOT NULL DEFAULT 'PENDING',
    "modality" TEXT NOT NULL DEFAULT 'US',
    "scheduledStationAETitle" TEXT,
    "worklistFilePath" TEXT,
    "sentToWorklistAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UltrasoundOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PacsStudy" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "patientDbId" TEXT,
    "patientId" TEXT NOT NULL,
    "accessionNumber" TEXT,
    "orthancStudyId" TEXT NOT NULL,
    "studyInstanceUID" TEXT NOT NULL,
    "studyDescription" TEXT,
    "studyDate" TIMESTAMP(3),
    "studyTime" TEXT,
    "seriesCount" INTEGER NOT NULL DEFAULT 0,
    "imageCount" INTEGER NOT NULL DEFAULT 0,
    "status" "PacsStudyStatus" NOT NULL DEFAULT 'RECEIVED',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PacsStudy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UltrasoundReport" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "pacsStudyId" TEXT,
    "reportingDoctorId" TEXT,
    "reportingDoctorName" TEXT NOT NULL,
    "reportContent" TEXT NOT NULL,
    "templateUsed" TEXT,
    "diagnosticImpression" TEXT,
    "medicalSignature" TEXT,
    "signedAt" TIMESTAMP(3),
    "status" "UltrasoundReportStatus" NOT NULL DEFAULT 'DRAFT',
    "pdfFilePath" TEXT,
    "manualStudyConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UltrasoundReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DicomConfiguration" (
    "id" TEXT NOT NULL,
    "orthancUrl" TEXT NOT NULL DEFAULT 'http://192.168.0.36:8042',
    "orthancDicomPort" INTEGER NOT NULL DEFAULT 4242,
    "orthancAet" TEXT NOT NULL DEFAULT 'ORTHANC',
    "orthancUser" TEXT,
    "orthancPassword" TEXT,
    "sonoscapeAet" TEXT,
    "worklistDirectory" TEXT,
    "ohifUrl" TEXT,
    "integrationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DicomConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Patient_patientId_key" ON "Patient"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_expediente_key" ON "Patient"("expediente");

-- CreateIndex
CREATE INDEX "Patient_patientId_idx" ON "Patient"("patientId");

-- CreateIndex
CREATE INDEX "Patient_expediente_idx" ON "Patient"("expediente");

-- CreateIndex
CREATE UNIQUE INDEX "UltrasoundOrder_accessionNumber_key" ON "UltrasoundOrder"("accessionNumber");

-- CreateIndex
CREATE INDEX "UltrasoundOrder_patientId_idx" ON "UltrasoundOrder"("patientId");

-- CreateIndex
CREATE INDEX "UltrasoundOrder_accessionNumber_idx" ON "UltrasoundOrder"("accessionNumber");

-- CreateIndex
CREATE INDEX "UltrasoundOrder_scheduledAt_idx" ON "UltrasoundOrder"("scheduledAt");

-- CreateIndex
CREATE INDEX "UltrasoundOrder_status_idx" ON "UltrasoundOrder"("status");

-- CreateIndex
CREATE INDEX "UltrasoundOrder_modality_idx" ON "UltrasoundOrder"("modality");

-- CreateIndex
CREATE INDEX "UltrasoundOrder_scheduledStationAETitle_idx" ON "UltrasoundOrder"("scheduledStationAETitle");

-- CreateIndex
CREATE UNIQUE INDEX "PacsStudy_orthancStudyId_key" ON "PacsStudy"("orthancStudyId");

-- CreateIndex
CREATE UNIQUE INDEX "PacsStudy_studyInstanceUID_key" ON "PacsStudy"("studyInstanceUID");

-- CreateIndex
CREATE INDEX "PacsStudy_orderId_idx" ON "PacsStudy"("orderId");

-- CreateIndex
CREATE INDEX "PacsStudy_patientDbId_idx" ON "PacsStudy"("patientDbId");

-- CreateIndex
CREATE INDEX "PacsStudy_patientId_idx" ON "PacsStudy"("patientId");

-- CreateIndex
CREATE INDEX "PacsStudy_accessionNumber_idx" ON "PacsStudy"("accessionNumber");

-- CreateIndex
CREATE INDEX "PacsStudy_status_idx" ON "PacsStudy"("status");

-- CreateIndex
CREATE INDEX "PacsStudy_receivedAt_idx" ON "PacsStudy"("receivedAt");

-- CreateIndex
CREATE INDEX "UltrasoundReport_orderId_idx" ON "UltrasoundReport"("orderId");

-- CreateIndex
CREATE INDEX "UltrasoundReport_patientId_idx" ON "UltrasoundReport"("patientId");

-- CreateIndex
CREATE INDEX "UltrasoundReport_pacsStudyId_idx" ON "UltrasoundReport"("pacsStudyId");

-- CreateIndex
CREATE INDEX "UltrasoundReport_reportingDoctorId_idx" ON "UltrasoundReport"("reportingDoctorId");

-- CreateIndex
CREATE INDEX "UltrasoundReport_status_idx" ON "UltrasoundReport"("status");

-- CreateIndex
CREATE INDEX "UltrasoundReport_signedAt_idx" ON "UltrasoundReport"("signedAt");

-- AddForeignKey
ALTER TABLE "UltrasoundOrder" ADD CONSTRAINT "UltrasoundOrder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PacsStudy" ADD CONSTRAINT "PacsStudy_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "UltrasoundOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PacsStudy" ADD CONSTRAINT "PacsStudy_patientDbId_fkey" FOREIGN KEY ("patientDbId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UltrasoundReport" ADD CONSTRAINT "UltrasoundReport_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "UltrasoundOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UltrasoundReport" ADD CONSTRAINT "UltrasoundReport_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UltrasoundReport" ADD CONSTRAINT "UltrasoundReport_pacsStudyId_fkey" FOREIGN KEY ("pacsStudyId") REFERENCES "PacsStudy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UltrasoundReport" ADD CONSTRAINT "UltrasoundReport_reportingDoctorId_fkey" FOREIGN KEY ("reportingDoctorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
