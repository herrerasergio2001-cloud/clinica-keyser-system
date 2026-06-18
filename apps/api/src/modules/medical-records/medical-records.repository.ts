import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';

export const medicalRecordInclude = {
  patient: true,
  doctor: { select: { id: true, fullName: true, email: true } },
  clinicalHistory: true,
  vitalSigns: true,
  physicalExam: true,
  diagnoses: true,
  prescriptions: true,
  evolutionNotes: { where: { isDeleted: false }, orderBy: { noteDate: 'desc' as const } },
  attachments: { where: { isDeleted: false }, orderBy: { createdAt: 'desc' as const }, include: { uploadedBy: { select: { id: true, fullName: true } } } },
  vaccineRecords: { orderBy: { createdAt: 'desc' as const } },
  pregnancyControls: { orderBy: { createdAt: 'desc' as const } },
  bodyMapFindings: { orderBy: { createdAt: 'desc' as const } },
  dentalFindings: { orderBy: { createdAt: 'desc' as const } },
  labOrders: { orderBy: { createdAt: 'desc' as const } },
  imagingOrders: { orderBy: { createdAt: 'desc' as const } },
  clinicalDocuments: { orderBy: { createdAt: 'desc' as const } },
};

@Injectable()
export class MedicalRecordsRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(search?: string) {
    return this.prisma.medicalRecord.findMany({
      where: {
        isDeleted: false,
        ...(search
        ? {
            OR: [
              { recordNumber: { contains: search, mode: 'insensitive' } },
              { chiefComplaint: { contains: search, mode: 'insensitive' } },
              { patient: { fullName: { contains: search, mode: 'insensitive' } } },
              { patient: { patientCode: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
      },
      include: medicalRecordInclude,
      orderBy: { consultationDate: 'desc' },
    });
  }

  byPatient(patientId: string) {
    return this.prisma.medicalRecord.findMany({
      where: { patientId, isDeleted: false },
      include: medicalRecordInclude,
      orderBy: { consultationDate: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.medicalRecord.findUnique({ where: { id }, include: medicalRecordInclude });
  }

  findPatient(patientId: string) {
    return this.prisma.patient.findUnique({ where: { id: patientId } });
  }

  async nextRecordNumber() {
    const counter = await this.prisma.counter.upsert({
      where: { key: 'medical_record_number' },
      update: { value: { increment: 1 } },
      create: { key: 'medical_record_number', value: 1 },
    });
    return `EXP-${String(counter.value).padStart(6, '0')}`;
  }

  create(data: Prisma.MedicalRecordCreateInput) {
    return this.prisma.medicalRecord.create({ data, include: medicalRecordInclude });
  }

  update(id: string, data: Prisma.MedicalRecordUpdateInput) {
    return this.prisma.medicalRecord.update({ where: { id }, data, include: medicalRecordInclude });
  }

  delete(id: string) {
    return this.prisma.medicalRecord.update({ where: { id }, data: { isDeleted: true, status: 'ARCHIVED' }, include: medicalRecordInclude });
  }

  addEvolutionNote(data: Prisma.EvolutionNoteCreateInput) {
    return this.prisma.evolutionNote.create({ data });
  }

  listEvolutionNotes(medicalRecordId: string) {
    return this.prisma.evolutionNote.findMany({
      where: { medicalRecordId, isDeleted: false },
      orderBy: { noteDate: 'desc' },
      include: { doctor: { select: { id: true, fullName: true } }, medicalRecord: { include: { patient: true } } },
    });
  }

  findEvolutionNote(id: string) {
    return this.prisma.evolutionNote.findUnique({
      where: { id },
      include: { doctor: { select: { id: true, fullName: true } }, medicalRecord: { include: { patient: true, prescriptions: true } } },
    });
  }

  updateEvolutionNote(id: string, data: Prisma.EvolutionNoteUpdateInput) {
    return this.prisma.evolutionNote.update({
      where: { id },
      data,
      include: { doctor: { select: { id: true, fullName: true } }, medicalRecord: { include: { patient: true } } },
    });
  }

  deleteEvolutionNote(id: string) {
    return this.prisma.evolutionNote.update({ where: { id }, data: { isDeleted: true, status: 'ARCHIVED' } });
  }

  addAttachment(data: Prisma.MedicalAttachmentCreateInput) {
    return this.prisma.medicalAttachment.create({ data, include: { uploadedBy: { select: { id: true, fullName: true } } } });
  }

  listAttachments(medicalRecordId: string) {
    return this.prisma.medicalAttachment.findMany({
      where: { medicalRecordId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      include: { uploadedBy: { select: { id: true, fullName: true } } },
    });
  }

  findAttachment(id: string) {
    return this.prisma.medicalAttachment.findUnique({ where: { id }, include: { uploadedBy: { select: { id: true, fullName: true } } } });
  }

  updateAttachment(id: string, data: Prisma.MedicalAttachmentUpdateInput) {
    return this.prisma.medicalAttachment.update({
      where: { id },
      data,
      include: { uploadedBy: { select: { id: true, fullName: true } } },
    });
  }

  deleteAttachment(id: string) {
    return this.prisma.medicalAttachment.update({ where: { id }, data: { isDeleted: true } });
  }

  listClinicalResource(model: ClinicalResourceModel, medicalRecordId: string) {
    return (this.prisma[model] as any).findMany({ where: { medicalRecordId }, orderBy: { createdAt: 'desc' } });
  }

  createClinicalResource(model: ClinicalResourceModel, data: Record<string, unknown>) {
    return (this.prisma[model] as any).create({ data });
  }

  createClinicalEvent(data: Prisma.ClinicalEventCreateInput) {
    return this.prisma.clinicalEvent.create({ data });
  }
}

export type ClinicalResourceModel =
  | 'vaccineRecord'
  | 'pregnancyControl'
  | 'bodyMapFinding'
  | 'dentalFinding'
  | 'labOrder'
  | 'imagingOrder'
  | 'clinicalDocument';
