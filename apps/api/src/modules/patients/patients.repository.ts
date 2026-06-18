import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { PatientListQueryDto } from './dto/patient-list-query.dto';

const patientInclude = {
  files: true,
  category: true,
  assignedDoctor: { select: { id: true, fullName: true, email: true } },
  clinicalAlerts: { where: { isActive: true }, orderBy: { createdAt: 'desc' as const } },
  emergencyContacts: { orderBy: { isPrimary: 'desc' as const } },
  patientAttachments: { orderBy: { createdAt: 'desc' as const }, take: 6 },
  appointments: { orderBy: { startsAt: 'desc' as const }, take: 5 },
  medicalRecords: {
    orderBy: { consultationDate: 'desc' as const },
    take: 3,
    include: {
      vitalSigns: true,
      diagnoses: { take: 3 },
      evolutionNotes: { orderBy: { noteDate: 'desc' as const }, take: 2 },
      attachments: { orderBy: { createdAt: 'desc' as const }, take: 4 },
      doctor: { select: { id: true, fullName: true } },
    },
  },
} satisfies Prisma.PatientInclude;

@Injectable()
export class PatientsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(query: PatientListQueryDto = {}): Prisma.PatientWhereInput {
    const where: Prisma.PatientWhereInput = query.status === 'all'
      ? {}
      : query.status === 'archived'
        ? { isDeleted: true }
        : { isDeleted: false };
    const and: Prisma.PatientWhereInput[] = [];

    if (query.search) {
      and.push({
        OR: [
          { fullName: { contains: query.search, mode: 'insensitive' } },
          { patientCode: { contains: query.search, mode: 'insensitive' } },
          { idNumber: { contains: query.search, mode: 'insensitive' } },
          { phone: { contains: query.search, mode: 'insensitive' } },
          { city: { contains: query.search, mode: 'insensitive' } },
          { category: { name: { contains: query.search, mode: 'insensitive' } } },
          { allergies: { contains: query.search, mode: 'insensitive' } },
          { chronicDiseases: { contains: query.search, mode: 'insensitive' } },
          { medicalRecords: { some: { diagnosisText: { contains: query.search, mode: 'insensitive' } } } },
          { medicalRecords: { some: { diagnoses: { some: { mainDiagnosis: { contains: query.search, mode: 'insensitive' } } } } } },
        ],
      });
    }

    if (query.gender) where.gender = query.gender;
    if (query.city) where.city = { contains: query.city, mode: 'insensitive' };
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.category) where.category = { name: { contains: query.category, mode: 'insensitive' } };
    if (query.assignedDoctorId) where.assignedDoctorId = query.assignedDoctorId;
    if (query.clinicalStatus) where.clinicalStatus = query.clinicalStatus;

    if (query.pediatric === 'true') {
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 18);
      and.push({ birthDate: { gte: cutoff } });
    }

    if (query.hasAllergies === 'true') and.push({ allergies: { not: null } });
    if (query.hasChronicDiseases === 'true') and.push({ chronicDiseases: { not: null } });

    if (query.ageMin !== undefined || query.ageMax !== undefined) {
      const now = new Date();
      const birthDate: Prisma.DateTimeFilter = {};
      if (query.ageMax !== undefined) {
        const youngest = new Date(now);
        youngest.setFullYear(now.getFullYear() - query.ageMax - 1);
        birthDate.gt = youngest;
      }
      if (query.ageMin !== undefined) {
        const oldest = new Date(now);
        oldest.setFullYear(now.getFullYear() - query.ageMin);
        birthDate.lte = oldest;
      }
      and.push({ birthDate });
    }

    if (query.lastConsultationFrom || query.lastConsultationTo) {
      and.push({
        medicalRecords: {
          some: {
            consultationDate: {
              gte: query.lastConsultationFrom ? new Date(query.lastConsultationFrom) : undefined,
              lte: query.lastConsultationTo ? new Date(query.lastConsultationTo) : undefined,
            },
          },
        },
      });
    }

    if (and.length) where.AND = and;
    return where;
  }

  async list(query: PatientListQueryDto = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const where = this.buildWhere(query);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.patient.findMany({
        where,
        include: patientInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.patient.count({ where }),
    ]);

    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) || 1 } };
  }

  findById(id: string) {
    return this.prisma.patient.findUnique({ where: { id }, include: patientInclude });
  }

  async nextPatientCode() {
    const counter = await this.prisma.counter.upsert({
      where: { key: 'patient_code' },
      update: { value: { increment: 1 } },
      create: { key: 'patient_code', value: 1 },
    });
    return `CK-${String(counter.value).padStart(6, '0')}`;
  }

  findDuplicateCandidates(input: { idNumber?: string | null; expediente?: string | null; fullName?: string | null; birthDate?: Date | null }, excludeId?: string) {
    const or: Prisma.PatientWhereInput[] = [];
    if (input.idNumber) or.push({ idNumber: input.idNumber });
    if (input.expediente) or.push({ expediente: input.expediente });
    if (input.fullName && input.birthDate) {
      or.push({
        fullName: { equals: input.fullName, mode: 'insensitive' },
        birthDate: input.birthDate,
      });
    }
    if (!or.length) return Promise.resolve([]);
    return this.prisma.patient.findMany({
      where: {
        isDeleted: false,
        id: excludeId ? { not: excludeId } : undefined,
        OR: or,
      },
      select: { id: true, patientId: true, patientCode: true, expediente: true, fullName: true, birthDate: true, idNumber: true },
      take: 10,
    });
  }

  create(data: Prisma.PatientUncheckedCreateInput) {
    return this.prisma.patient.create({ data, include: patientInclude });
  }

  update(id: string, data: Prisma.PatientUncheckedUpdateInput) {
    return this.prisma.patient.update({ where: { id }, data, include: patientInclude });
  }

  delete(id: string) {
    return this.prisma.patient.update({ where: { id }, data: { isDeleted: true, status: 'ARCHIVED', clinicalStatus: 'ARCHIVED' }, include: patientInclude });
  }

  archive(id: string, data: Prisma.PatientUncheckedUpdateInput) {
    return this.prisma.patient.update({ where: { id }, data, include: patientInclude });
  }

  restore(id: string, data: Prisma.PatientUncheckedUpdateInput) {
    return this.prisma.patient.update({ where: { id }, data, include: patientInclude });
  }

  listCategories() {
    return this.prisma.patientCategory.findMany({ orderBy: { name: 'asc' } });
  }

  createCategory(data: Prisma.PatientCategoryCreateInput) {
    return this.prisma.patientCategory.upsert({
      where: { name: data.name },
      create: data,
      update: data,
    });
  }

  listAlerts(patientId: string) {
    return this.prisma.clinicalAlert.findMany({ where: { patientId, isActive: true }, orderBy: { createdAt: 'desc' } });
  }

  createAlert(patientId: string, data: Omit<Prisma.ClinicalAlertCreateInput, 'patient'>) {
    return this.prisma.clinicalAlert.create({ data: { ...data, patient: { connect: { id: patientId } } } });
  }

  listAttachments(patientId: string) {
    return this.prisma.patientAttachment.findMany({ where: { patientId, isDeleted: false }, orderBy: { createdAt: 'desc' } });
  }

  findAttachment(id: string) {
    return this.prisma.patientAttachment.findUnique({ where: { id } });
  }

  updateAttachment(id: string, data: Prisma.PatientAttachmentUpdateInput) {
    return this.prisma.patientAttachment.update({ where: { id }, data });
  }

  attachClinicalFile(patientId: string, data: Omit<Prisma.PatientAttachmentCreateInput, 'patient'>) {
    return this.prisma.patientAttachment.create({ data: { ...data, patient: { connect: { id: patientId } } } });
  }

  listAppointments(patientId: string) {
    return this.prisma.appointment.findMany({ where: { patientId, isDeleted: false }, orderBy: { startsAt: 'desc' } });
  }

  findAppointment(id: string) {
    return this.prisma.appointment.findUnique({ where: { id }, include: { patient: true } });
  }

  updateAppointment(id: string, data: Prisma.AppointmentUpdateInput) {
    return this.prisma.appointment.update({ where: { id }, data, include: { patient: true } });
  }

  createAppointment(patientId: string, data: Omit<Prisma.AppointmentCreateInput, 'patient'>) {
    return this.prisma.appointment.create({ data: { ...data, patient: { connect: { id: patientId } } } });
  }

  listEvolutions(patientId: string) {
    return this.prisma.evolutionNote.findMany({
      where: { patientId },
      include: { doctor: { select: { id: true, fullName: true } }, medicalRecord: { select: { id: true, recordNumber: true } } },
      orderBy: { noteDate: 'desc' },
    });
  }

  latestMedicalRecord(patientId: string) {
    return this.prisma.medicalRecord.findFirst({ where: { patientId }, orderBy: { consultationDate: 'desc' } });
  }

  createEvolution(data: Prisma.EvolutionNoteCreateInput) {
    return this.prisma.evolutionNote.create({ data });
  }
}
