import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditAction } from '@prisma/client';
import { createReadStream } from 'fs';
import { join } from 'path';
import { AuditService } from '../audit/audit.service';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { FileStorage } from '../../shared/storage/file-storage';
import { SafeDeleteDto } from '../../shared/dto/safe-delete.dto';
import { CreatePatientDto } from './dto/create-patient.dto';
import {
  CreateClinicalAlertDto,
  CreatePatientAppointmentDto,
  CreatePatientCategoryDto,
  CreatePatientEvolutionDto,
  UploadPatientAttachmentDto,
} from './dto/patient-actions.dto';
import { PatientListQueryDto } from './dto/patient-list-query.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientsRepository } from './patients.repository';

const allowedPatientFiles = new Set(['image/jpeg', 'image/png', 'application/pdf']);

function optionalText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

@Injectable()
export class PatientsService {
  constructor(
    private readonly patients: PatientsRepository,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
    @Inject('FileStorage') private readonly storage: FileStorage,
  ) {}

  list(query: PatientListQueryDto = {}) {
    return this.patients.list(query);
  }

  listCategories() {
    return this.patients.listCategories();
  }

  async createCategory(dto: CreatePatientCategoryDto, actor?: CurrentUser, ipAddress?: string) {
    const category = await this.patients.createCategory(dto);
    await this.audit.record({ actorId: actor?.sub, action: AuditAction.CREATE, entity: 'PatientCategory', entityId: category.id, ipAddress, after: category });
    return category;
  }

  async findById(id: string) {
    const patient = await this.patients.findById(id);
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

  async create(dto: CreatePatientDto, actor?: CurrentUser, ipAddress?: string) {
    const birthDate = new Date(dto.birthDate);
    await this.ensureNoDuplicatePatient({
      idNumber: optionalText(dto.idNumber),
      expediente: optionalText(dto.expediente),
      fullName: dto.fullName,
      birthDate,
    });

    const patientCode = await this.patients.nextPatientCode();
    const patient = await this.patients.create({
      ...dto,
      idNumber: optionalText(dto.idNumber),
      expediente: optionalText(dto.expediente) ?? patientCode,
      patientId: patientCode,
      patientCode,
      birthDate,
    });

    await this.audit.record({
      actorId: actor?.sub,
      action: AuditAction.CREATE,
      entity: 'Patient',
      entityId: patient.id,
      ipAddress,
      after: patient,
    });
    return patient;
  }

  async update(id: string, dto: UpdatePatientDto, actor?: CurrentUser, ipAddress?: string) {
    const before = await this.findById(id);
    const birthDate = dto.birthDate ? new Date(dto.birthDate) : before.birthDate;
    const nextIdNumber = dto.idNumber !== undefined ? (optionalText(dto.idNumber) ?? null) : before.idNumber;
    const nextExpediente = dto.expediente !== undefined ? (optionalText(dto.expediente) ?? null) : before.expediente;
    await this.ensureNoDuplicatePatient({
      idNumber: nextIdNumber,
      expediente: nextExpediente,
      fullName: dto.fullName ?? before.fullName,
      birthDate,
    }, id);

    const patient = await this.patients.update(id, {
      ...dto,
      idNumber: dto.idNumber !== undefined ? nextIdNumber : undefined,
      expediente: dto.expediente !== undefined ? nextExpediente : undefined,
      birthDate: dto.birthDate ? birthDate : undefined,
    });

    await this.audit.record({
      actorId: actor?.sub,
      action: AuditAction.UPDATE,
      entity: 'Patient',
      entityId: id,
      ipAddress,
      before,
      after: patient,
    });
    return patient;
  }

  async findDuplicateCandidates(input: { idNumber?: string; expediente?: string; fullName?: string; birthDate?: string }) {
    return this.patients.findDuplicateCandidates({
      idNumber: optionalText(input.idNumber),
      expediente: optionalText(input.expediente),
      fullName: input.fullName,
      birthDate: input.birthDate ? new Date(input.birthDate) : undefined,
    });
  }

  private async ensureNoDuplicatePatient(
    input: { idNumber?: string | null; expediente?: string | null; fullName?: string | null; birthDate?: Date | null },
    excludeId?: string,
  ) {
    const duplicates = await this.patients.findDuplicateCandidates(input, excludeId);
    if (duplicates.length) {
      throw new BadRequestException({
        message: 'Posible paciente duplicado. Revise cédula, expediente o nombre con fecha de nacimiento antes de guardar.',
        duplicates,
      });
    }
  }

  async delete(id: string, actor?: CurrentUser, ipAddress?: string) {
    return this.archive(id, { reason: 'Archivado desde acción de eliminación segura' }, actor, ipAddress);
  }

  async archive(id: string, dto: SafeDeleteDto, actor?: CurrentUser, ipAddress?: string) {
    const before = await this.findById(id);
    const patient = await this.patients.archive(id, {
      isDeleted: true,
      status: 'ARCHIVED',
      clinicalStatus: 'ARCHIVED',
      deletedAt: new Date(),
      deletedBy: actor?.sub,
      deletionReason: dto.reason,
    });
    await this.audit.record({ actorId: actor?.sub, action: AuditAction.PATIENT_ARCHIVED, entity: 'Patient', entityId: id, ipAddress, before, after: { patient, reason: dto.reason } });
    return patient;
  }

  async deactivate(id: string, dto: SafeDeleteDto, actor?: CurrentUser, ipAddress?: string) {
    const before = await this.findById(id);
    if (before.isDeleted) throw new BadRequestException('El paciente ya está archivado');
    const patient = await this.patients.update(id, {
      status: 'INACTIVE',
      clinicalStatus: 'INACTIVE',
      deletedBy: actor?.sub,
      deletionReason: dto.reason,
    });
    await this.audit.record({
      actorId: actor?.sub,
      action: AuditAction.PATIENT_DISABLED,
      entity: 'Patient',
      entityId: id,
      ipAddress,
      before,
      after: { patient, reason: dto.reason },
    });
    return patient;
  }

  async activate(id: string, dto: SafeDeleteDto, actor?: CurrentUser, ipAddress?: string) {
    const before = await this.findById(id);
    if (before.isDeleted) throw new BadRequestException('Restaure primero el paciente archivado');
    const patient = await this.patients.update(id, {
      status: 'ACTIVE',
      clinicalStatus: 'ACTIVE',
      deletedBy: null,
      deletionReason: null,
    });
    await this.audit.record({
      actorId: actor?.sub,
      action: AuditAction.PATIENT_ENABLED,
      entity: 'Patient',
      entityId: id,
      ipAddress,
      before,
      after: { patient, reason: dto.reason },
    });
    return patient;
  }

  async restore(id: string, dto: SafeDeleteDto, actor?: CurrentUser, ipAddress?: string) {
    const before = await this.findById(id);
    const patient = await this.patients.restore(id, {
      isDeleted: false,
      status: 'ACTIVE',
      clinicalStatus: 'ACTIVE',
      deletedAt: null,
      deletedBy: null,
      deletionReason: null,
    });
    await this.audit.record({ actorId: actor?.sub, action: AuditAction.PATIENT_RESTORED, entity: 'Patient', entityId: id, ipAddress, before, after: { patient, reason: dto.reason } });
    return patient;
  }

  async listAlerts(id: string) {
    await this.findById(id);
    return this.patients.listAlerts(id);
  }

  async createAlert(id: string, dto: CreateClinicalAlertDto, actor?: CurrentUser, ipAddress?: string) {
    await this.findById(id);
    const alert = await this.patients.createAlert(id, { type: dto.type, title: dto.title, severity: dto.severity ?? 'INFO' });
    await this.audit.record({ actorId: actor?.sub, action: AuditAction.CREATE, entity: 'ClinicalAlert', entityId: alert.id, ipAddress, after: alert });
    return alert;
  }

  async listAttachments(id: string) {
    await this.findById(id);
    return this.patients.listAttachments(id);
  }

  async attachmentDownload(attachmentId: string) {
    const attachment = await this.patients.findAttachment(attachmentId);
    if (!attachment || attachment.isDeleted) throw new NotFoundException('Patient attachment not found');
    const root = this.config.get<string>('LOCAL_STORAGE_ROOT') ?? './storage';
    return { attachment, stream: createReadStream(join(root, attachment.storageKey)) };
  }

  async uploadFile(id: string, file: Express.Multer.File, dto: UploadPatientAttachmentDto = {}, actor?: CurrentUser, ipAddress?: string) {
    await this.findById(id);
    if (!file) throw new BadRequestException('File is required');
    if (!allowedPatientFiles.has(file.mimetype)) throw new BadRequestException('Only JPG, PNG and PDF files are allowed');

    const stored = await this.storage.save(file, 'medical-records');
    const attachment = await this.patients.attachClinicalFile(id, {
      fileName: stored.fileName,
      fileType: stored.mimeType.includes('pdf') ? 'PDF' : 'IMAGE',
      category: dto.category ?? 'clinico',
      description: dto.description,
      mimeType: stored.mimeType,
      size: stored.size,
      storageKey: stored.storageKey,
      uploadedById: actor?.sub,
    });

    await this.audit.record({
      actorId: actor?.sub,
      action: AuditAction.CREATE,
      entity: 'PatientAttachment',
      entityId: attachment.id,
      ipAddress,
      after: attachment,
    });
    return attachment;
  }

  async deleteAttachment(attachmentId: string, dto: SafeDeleteDto, actor?: CurrentUser, ipAddress?: string) {
    const before = await this.patients.findAttachment(attachmentId);
    if (!before) throw new NotFoundException('Patient attachment not found');
    const attachment = await this.patients.updateAttachment(attachmentId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: actor?.sub,
      deleteReason: dto.reason,
    });
    await this.audit.record({ actorId: actor?.sub, action: AuditAction.FILE_DELETED, entity: 'PatientAttachment', entityId: attachmentId, ipAddress, before, after: { attachment, reason: dto.reason } });
    return attachment;
  }

  async listAppointments(id: string) {
    await this.findById(id);
    return this.patients.listAppointments(id);
  }

  async createAppointment(id: string, dto: CreatePatientAppointmentDto, actor?: CurrentUser, ipAddress?: string) {
    await this.findById(id);
    const appointment = await this.patients.createAppointment(id, {
      doctorId: dto.doctorId,
      startsAt: new Date(dto.startsAt),
      endsAt: new Date(dto.endsAt),
      reason: dto.reason,
      status: dto.status ?? 'SCHEDULED',
    });
    await this.audit.record({ actorId: actor?.sub, action: AuditAction.CREATE, entity: 'Appointment', entityId: appointment.id, ipAddress, after: appointment });
    return appointment;
  }

  async cancelAppointment(appointmentId: string, dto: SafeDeleteDto, actor?: CurrentUser, ipAddress?: string) {
    const before = await this.patients.findAppointment(appointmentId);
    if (!before) throw new NotFoundException('Appointment not found');
    const appointment = await this.patients.updateAppointment(appointmentId, {
      status: 'CANCELLED',
      isDeleted: true,
      cancelledAt: new Date(),
      cancelledBy: actor?.sub,
      cancelReason: dto.reason,
    });
    await this.audit.record({ actorId: actor?.sub, action: AuditAction.APPOINTMENT_CANCELLED, entity: 'Appointment', entityId: appointmentId, ipAddress, before, after: { appointment, reason: dto.reason } });
    return appointment;
  }

  async listEvolutions(id: string) {
    await this.findById(id);
    return this.patients.listEvolutions(id);
  }

  async createEvolution(id: string, dto: CreatePatientEvolutionDto, actor?: CurrentUser, ipAddress?: string) {
    const patient = await this.findById(id);
    const medicalRecord = dto.medicalRecordId ? patient.medicalRecords.find((record) => record.id === dto.medicalRecordId) : await this.patients.latestMedicalRecord(id);
    if (!medicalRecord) throw new BadRequestException('Patient needs a clinical record before adding an evolution note');
    const doctorId = actor?.sub ?? medicalRecord.doctorId;
    const note = await this.patients.createEvolution({
      medicalRecord: { connect: { id: medicalRecord.id } },
      patientId: id,
      doctor: { connect: { id: doctorId } },
      noteDate: new Date(),
      subjective: dto.subjective,
      objective: dto.objective,
      assessment: dto.assessment,
      plan: dto.plan,
      doctorName: actor?.email ?? 'Medico',
      createdById: doctorId,
      updatedById: doctorId,
    });
    await this.audit.record({ actorId: actor?.sub, action: AuditAction.CREATE, entity: 'EvolutionNote', entityId: note.id, ipAddress, after: note });
    return note;
  }
}
