import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditAction, FileOwnerType, MedicalRecordStatus, Prisma } from '@prisma/client';
import { createReadStream } from 'fs';
import { join } from 'path';
import PDFDocument from 'pdfkit';
import { AuditService } from '../audit/audit.service';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { SafeDeleteDto } from '../../shared/dto/safe-delete.dto';
import { FileStorage } from '../../shared/storage/file-storage';
import { CreateEvolutionNoteDto, UpdateEvolutionNoteDto } from './dto/create-evolution-note.dto';
import { CreateMedicalAttachmentDto, UpdateMedicalAttachmentDto } from './dto/create-medical-attachment.dto';
import {
  CreateBodyMapFindingDto,
  CreateClinicalDocumentDto,
  CreateDentalFindingDto,
  CreateImagingOrderDto,
  CreateLabOrderDto,
  CreatePregnancyControlDto,
  CreateVaccineRecordDto,
} from './dto/clinical-resource.dto';
import {
  ClinicalHistoryDto,
  CreateMedicalRecordDto,
  DiagnosisDto,
  PhysicalExamDto,
  PrescriptionDto,
  VitalSignsDto,
} from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { MedicalRecordsRepository } from './medical-records.repository';

type PdfKind = 'record' | 'prescription' | 'evolution';

@Injectable()
export class MedicalRecordsService {
  constructor(
    private readonly records: MedicalRecordsRepository,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
    @Inject('FileStorage') private readonly storage: FileStorage,
  ) {}

  list(search?: string) {
    return this.records.list(search);
  }

  byPatient(patientId: string) {
    return this.records.byPatient(patientId);
  }

  async findById(id: string) {
    const record = await this.records.findById(id);
    if (!record || record.isDeleted) throw new NotFoundException('Medical record not found');
    return record;
  }

  async open(id: string, actor: CurrentUser, ipAddress?: string) {
    const record = await this.findById(id);
    await this.audit.record({ actorId: actor.sub, action: AuditAction.VIEW, entity: 'MedicalRecord', entityId: id, ipAddress, after: { recordNumber: record.recordNumber, patientId: record.patientId } });
    return record;
  }

  async create(dto: CreateMedicalRecordDto, actor: CurrentUser, ipAddress?: string) {
    const patient = await this.records.findPatient(dto.patientId);
    if (!patient) throw new NotFoundException('Patient not found');

    const doctorId = dto.doctorId ?? actor.sub;
    const recordNumber = await this.records.nextRecordNumber();
    const history = this.mergeHistory(dto, dto.clinicalHistory);

    const record = await this.records.create({
      patient: { connect: { id: dto.patientId } },
      doctor: { connect: { id: doctorId } },
      createdBy: { connect: { id: actor.sub } },
      updatedBy: { connect: { id: actor.sub } },
      recordNumber,
      consultationDate: dto.consultationDate ? new Date(dto.consultationDate) : new Date(),
      reasonForVisit: dto.reasonForVisit,
      chiefComplaint: dto.chiefComplaint,
      currentIllness: dto.currentIllness,
      ...history.recordFields,
      diagnosisText: dto.diagnosisText,
      treatmentPlan: dto.treatmentPlan,
      recommendations: dto.recommendations,
      nextAppointmentDate: dto.nextAppointmentDate ? new Date(dto.nextAppointmentDate) : undefined,
      status: dto.status ?? MedicalRecordStatus.DRAFT,
      clinicalHistory: { create: this.sectionBase(dto.patientId, doctorId, actor.sub, history.clinicalHistory) },
      vitalSigns: dto.vitalSigns ? { create: this.vitalSigns(dto.patientId, doctorId, actor.sub, dto.vitalSigns) } : undefined,
      physicalExam: dto.physicalExam ? { create: this.sectionBase(dto.patientId, doctorId, actor.sub, dto.physicalExam) } : undefined,
      diagnoses: dto.diagnoses?.length
        ? { create: dto.diagnoses.map((diagnosis) => this.sectionBase(dto.patientId, doctorId, actor.sub, diagnosis)) }
        : undefined,
      prescriptions: dto.prescriptions?.length
        ? { create: dto.prescriptions.map((prescription) => this.sectionBase(dto.patientId, doctorId, actor.sub, prescription)) }
        : undefined,
    });

    await this.audit.record({
      actorId: actor.sub,
      action: AuditAction.CREATE,
      entity: 'MedicalRecord',
      entityId: record.id,
      ipAddress,
      after: record,
    });

    return record;
  }

  async update(id: string, dto: UpdateMedicalRecordDto, actor: CurrentUser, ipAddress?: string) {
    const before = await this.findById(id);
    const patientId = dto.patientId ?? before.patientId;
    const doctorId = dto.doctorId ?? before.doctorId;
    const history = this.mergeHistory(dto, dto.clinicalHistory);

    const record = await this.records.update(id, {
      patient: dto.patientId ? { connect: { id: dto.patientId } } : undefined,
      doctor: dto.doctorId ? { connect: { id: dto.doctorId } } : undefined,
      updatedBy: { connect: { id: actor.sub } },
      consultationDate: dto.consultationDate ? new Date(dto.consultationDate) : undefined,
      reasonForVisit: dto.reasonForVisit,
      chiefComplaint: dto.chiefComplaint,
      currentIllness: dto.currentIllness,
      ...history.recordFields,
      diagnosisText: dto.diagnosisText,
      treatmentPlan: dto.treatmentPlan,
      recommendations: dto.recommendations,
      nextAppointmentDate: dto.nextAppointmentDate ? new Date(dto.nextAppointmentDate) : undefined,
      status: dto.status,
      clinicalHistory: dto.clinicalHistory
        ? { upsert: { create: this.sectionBase(patientId, doctorId, actor.sub, history.clinicalHistory), update: { ...history.clinicalHistory, updatedById: actor.sub } } }
        : undefined,
      vitalSigns: dto.vitalSigns
        ? { upsert: { create: this.vitalSigns(patientId, doctorId, actor.sub, dto.vitalSigns), update: { ...this.vitalSignsValues(dto.vitalSigns), updatedById: actor.sub } } }
        : undefined,
      physicalExam: dto.physicalExam
        ? { upsert: { create: this.sectionBase(patientId, doctorId, actor.sub, dto.physicalExam), update: { ...dto.physicalExam, updatedById: actor.sub } } }
        : undefined,
      diagnoses: dto.diagnoses
        ? { deleteMany: {}, create: dto.diagnoses.map((diagnosis) => this.sectionBase(patientId, doctorId, actor.sub, diagnosis)) }
        : undefined,
      prescriptions: dto.prescriptions
        ? { deleteMany: {}, create: dto.prescriptions.map((prescription) => this.sectionBase(patientId, doctorId, actor.sub, prescription)) }
        : undefined,
    });

    await this.audit.record({
      actorId: actor.sub,
      action: AuditAction.UPDATE,
      entity: 'MedicalRecord',
      entityId: record.id,
      ipAddress,
      before,
      after: record,
    });

    return record;
  }

  async delete(id: string, actor: CurrentUser, ipAddress?: string) {
    return this.archive(id, { reason: 'Archivado desde acción de eliminación segura' }, actor, ipAddress);
  }

  async archive(id: string, dto: SafeDeleteDto, actor: CurrentUser, ipAddress?: string) {
    const before = await this.findById(id);
    const record = await this.records.update(id, {
      isDeleted: true,
      status: MedicalRecordStatus.ARCHIVED,
      deletedAt: new Date(),
      deletedBy: actor.sub,
      archiveReason: dto.reason,
      updatedBy: { connect: { id: actor.sub } },
    });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.MEDICAL_RECORD_ARCHIVED, entity: 'MedicalRecord', entityId: id, ipAddress, before, after: { record, reason: dto.reason } });
    return record;
  }

  async restore(id: string, dto: SafeDeleteDto, actor: CurrentUser, ipAddress?: string) {
    const before = await this.records.findById(id);
    if (!before) throw new NotFoundException('Medical record not found');
    const record = await this.records.update(id, {
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      archiveReason: null,
      status: MedicalRecordStatus.DRAFT,
      updatedBy: { connect: { id: actor.sub } },
    });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.MEDICAL_RECORD_RESTORED, entity: 'MedicalRecord', entityId: id, ipAddress, before, after: { record, reason: dto.reason } });
    return record;
  }

  async addEvolutionNote(id: string, dto: CreateEvolutionNoteDto, actor: CurrentUser, ipAddress?: string) {
    const record = await this.findById(id);
    const note = await this.records.addEvolutionNote({
      medicalRecord: { connect: { id } },
      doctor: { connect: { id: actor.sub } },
      patientId: record.patientId,
      noteDate: dto.noteDate ? new Date(dto.noteDate) : new Date(),
      subjective: dto.subjective,
      objective: dto.objective,
      assessment: dto.assessment,
      plan: dto.plan,
      doctorName: dto.doctorName ?? record.doctor.fullName,
      createdById: actor.sub,
      updatedById: actor.sub,
    });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.CREATE, entity: 'EvolutionNote', entityId: note.id, ipAddress, after: note });
    await this.recordClinicalEvent({
      patientId: record.patientId,
      medicalRecordId: id,
      doctorId: actor.sub,
      type: 'EVOLUTION',
      title: 'Evolución clínica',
      summary: note.assessment ?? note.subjective ?? note.plan ?? 'Nota SOAP',
      entity: 'EvolutionNote',
      entityId: note.id,
      createdById: actor.sub,
    });
    return note;
  }

  async listEvolutionNotes(id: string) {
    await this.findById(id);
    return this.records.listEvolutionNotes(id);
  }

  async addAttachment(id: string, file: Express.Multer.File, dto: CreateMedicalAttachmentDto, actor: CurrentUser, ipAddress?: string) {
    const record = await this.findById(id);
    if (!file) throw new BadRequestException('File is required');
    if (!['image/jpeg', 'image/png', 'application/pdf', 'application/dicom'].includes(file.mimetype)) {
      throw new BadRequestException('Only JPG, PNG, PDF, and DICOM placeholder files are accepted');
    }

    const stored = await this.storage.save(file, 'medical-records');
    const attachment = await this.records.addAttachment({
      medicalRecord: { connect: { id } },
      uploadedBy: { connect: { id: actor.sub } },
      patientId: record.patientId,
      doctorId: record.doctorId,
      fileName: stored.fileName,
      fileType: this.fileType(file.mimetype),
      mimeType: stored.mimeType,
      size: stored.size,
      storageKey: stored.storageKey,
      description: dto.description,
      createdById: actor.sub,
      updatedById: actor.sub,
    });

    await this.audit.record({ actorId: actor.sub, action: AuditAction.CREATE, entity: 'MedicalAttachment', entityId: attachment.id, ipAddress, after: attachment });
    await this.recordClinicalEvent({
      patientId: record.patientId,
      medicalRecordId: id,
      doctorId: record.doctorId,
      type: 'ATTACHMENT',
      title: 'Archivo subido',
      summary: attachment.fileName,
      entity: 'MedicalAttachment',
      entityId: attachment.id,
      createdById: actor.sub,
    });
    return attachment;
  }

  async listAttachments(id: string) {
    await this.findById(id);
    return this.records.listAttachments(id);
  }

  async findEvolutionNote(id: string) {
    const note = await this.records.findEvolutionNote(id);
    if (!note || note.isDeleted) throw new NotFoundException('Evolution note not found');
    return note;
  }

  async updateEvolutionNote(id: string, dto: UpdateEvolutionNoteDto, actor: CurrentUser, ipAddress?: string) {
    const before = await this.findEvolutionNote(id);
    const note = await this.records.updateEvolutionNote(id, {
      noteDate: dto.noteDate ? new Date(dto.noteDate) : undefined,
      subjective: dto.subjective,
      objective: dto.objective,
      assessment: dto.assessment,
      plan: dto.plan,
      doctorName: dto.doctorName,
      updatedById: actor.sub,
    });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.UPDATE, entity: 'EvolutionNote', entityId: note.id, ipAddress, before, after: note });
    return note;
  }

  async deleteEvolutionNote(id: string, dto: SafeDeleteDto, actor: CurrentUser, ipAddress?: string) {
    const before = await this.findEvolutionNote(id);
    const deleted = await this.records.updateEvolutionNote(id, {
      isDeleted: true,
      status: 'ARCHIVED',
      deletedAt: new Date(),
      deletedBy: actor.sub,
      deleteReason: dto.reason,
      updatedById: actor.sub,
    });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.DELETE, entity: 'EvolutionNote', entityId: id, ipAddress, before, after: { deleted, reason: dto.reason } });
    return deleted;
  }

  async findAttachment(id: string) {
    const attachment = await this.records.findAttachment(id);
    if (!attachment || attachment.isDeleted) throw new NotFoundException('Attachment not found');
    return attachment;
  }

  async updateAttachment(id: string, dto: UpdateMedicalAttachmentDto, actor: CurrentUser, ipAddress?: string) {
    const before = await this.findAttachment(id);
    const attachment = await this.records.updateAttachment(id, { description: dto.description, updatedById: actor.sub });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.UPDATE, entity: 'MedicalAttachment', entityId: attachment.id, ipAddress, before, after: attachment });
    return attachment;
  }

  async deleteAttachment(id: string, dto: SafeDeleteDto, actor: CurrentUser, ipAddress?: string) {
    const before = await this.findAttachment(id);
    const deleted = await this.records.updateAttachment(id, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: actor.sub,
      deleteReason: dto.reason,
      updatedById: actor.sub,
    });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.FILE_DELETED, entity: 'MedicalAttachment', entityId: id, ipAddress, before, after: { deleted, reason: dto.reason } });
    return deleted;
  }

  async attachmentDownload(attachmentId: string) {
    const attachment = await this.findAttachment(attachmentId);
    const root = this.config.get<string>('LOCAL_STORAGE_ROOT') ?? './storage';
    return { attachment, stream: createReadStream(join(root, attachment.storageKey)) };
  }

  listVaccines(id: string) {
    return this.records.listClinicalResource('vaccineRecord', id);
  }

  createVaccine(id: string, dto: CreateVaccineRecordDto, actor: CurrentUser, ipAddress?: string) {
    return this.createClinicalResource(id, 'VaccineRecord', 'vaccineRecord', {
      ...dto,
      appliedAt: dto.appliedAt ? new Date(dto.appliedAt) : undefined,
      nextDoseAt: dto.nextDoseAt ? new Date(dto.nextDoseAt) : undefined,
    }, actor, ipAddress);
  }

  listPregnancyControls(id: string) {
    return this.records.listClinicalResource('pregnancyControl', id);
  }

  createPregnancyControl(id: string, dto: CreatePregnancyControlDto, actor: CurrentUser, ipAddress?: string) {
    return this.createClinicalResource(id, 'PregnancyControl', 'pregnancyControl', {
      ...dto,
      lastPeriodDate: dto.lastPeriodDate ? new Date(dto.lastPeriodDate) : undefined,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    }, actor, ipAddress);
  }

  listBodyMap(id: string) {
    return this.records.listClinicalResource('bodyMapFinding', id);
  }

  createBodyMap(id: string, dto: CreateBodyMapFindingDto, actor: CurrentUser, ipAddress?: string) {
    return this.createClinicalResource(id, 'BodyMapFinding', 'bodyMapFinding', { ...dto }, actor, ipAddress);
  }

  listDentalChart(id: string) {
    return this.records.listClinicalResource('dentalFinding', id);
  }

  createDentalFinding(id: string, dto: CreateDentalFindingDto, actor: CurrentUser, ipAddress?: string) {
    return this.createClinicalResource(id, 'DentalFinding', 'dentalFinding', { ...dto }, actor, ipAddress);
  }

  listLabOrders(id: string) {
    return this.records.listClinicalResource('labOrder', id);
  }

  createLabOrder(id: string, dto: CreateLabOrderDto, actor: CurrentUser, ipAddress?: string) {
    return this.createClinicalResource(id, 'LabOrder', 'labOrder', { ...dto, priority: dto.priority ?? 'ROUTINE' }, actor, ipAddress);
  }

  listImagingOrders(id: string) {
    return this.records.listClinicalResource('imagingOrder', id);
  }

  createImagingOrder(id: string, dto: CreateImagingOrderDto, actor: CurrentUser, ipAddress?: string) {
    return this.createClinicalResource(id, 'ImagingOrder', 'imagingOrder', { ...dto, priority: dto.priority ?? 'ROUTINE' }, actor, ipAddress);
  }

  listClinicalDocuments(id: string) {
    return this.records.listClinicalResource('clinicalDocument', id);
  }

  createClinicalDocument(id: string, dto: CreateClinicalDocumentDto, actor: CurrentUser, ipAddress?: string) {
    return this.createClinicalResource(id, 'ClinicalDocument', 'clinicalDocument', { ...dto }, actor, ipAddress);
  }

  async recordPdf(id: string, actor?: CurrentUser) {
    const record = await this.findById(id);
    return this.buildPdf(record, 'record', undefined, actor);
  }

  private async createClinicalResource(
    medicalRecordId: string,
    entity: string,
    model: Parameters<MedicalRecordsRepository['createClinicalResource']>[0],
    values: Record<string, unknown>,
    actor: CurrentUser,
    ipAddress?: string,
  ) {
    const record = await this.findById(medicalRecordId);
    const created = await this.records.createClinicalResource(model, {
      ...values,
      medicalRecordId,
      patientId: record.patientId,
      doctorId: record.doctorId,
      createdById: actor.sub,
      updatedById: actor.sub,
    });
    await this.recordClinicalEvent({
      patientId: record.patientId,
      medicalRecordId,
      doctorId: record.doctorId,
      type: entity,
      title: this.eventTitle(entity),
      summary: this.eventSummary(entity, created),
      entity,
      entityId: created.id,
      createdById: actor.sub,
    });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.CREATE, entity, entityId: created.id, ipAddress, after: created });
    return created;
  }

  private async recordClinicalEvent(data: {
    patientId: string;
    medicalRecordId?: string;
    doctorId?: string;
    type: string;
    title: string;
    summary?: string | null;
    entity: string;
    entityId: string;
    createdById?: string;
  }) {
    try {
      await this.records.createClinicalEvent({
        patient: { connect: { id: data.patientId } },
        medicalRecord: data.medicalRecordId ? { connect: { id: data.medicalRecordId } } : undefined,
        doctor: data.doctorId ? { connect: { id: data.doctorId } } : undefined,
        type: data.type,
        title: data.title,
        summary: data.summary,
        module: 'Expediente',
        entity: data.entity,
        entityId: data.entityId,
        createdBy: data.createdById ? { connect: { id: data.createdById } } : undefined,
      });
    } catch {
      // El evento clínico no debe bloquear el guardado principal.
    }
  }

  private eventTitle(entity: string) {
    const titles: Record<string, string> = {
      BodyMapFinding: 'Hallazgo anatómico',
      DentalFinding: 'Odontograma',
      LabOrder: 'Orden de laboratorio',
      ImagingOrder: 'Orden de imagen',
      ClinicalDocument: 'Documento clínico',
      VaccineRecord: 'Vacuna',
      PregnancyControl: 'Control obstétrico',
    };
    return titles[entity] ?? 'Registro clínico';
  }

  private eventSummary(entity: string, created: any) {
    if (entity === 'BodyMapFinding') return `${created.layer ?? 'Capa'} · ${created.region}: ${created.description ?? 'evaluado'}`;
    if (entity === 'DentalFinding') return `Pieza ${created.toothNumber}: ${created.status}`;
    if (entity === 'LabOrder') return created.orderType;
    if (entity === 'ImagingOrder') return created.studyType;
    if (entity === 'ClinicalDocument') return created.title;
    if (entity === 'VaccineRecord') return created.vaccineName;
    if (entity === 'PregnancyControl') return created.gestationalAge ?? created.observations;
    return undefined;
  }

  async prescriptionPdf(id: string, actor?: CurrentUser) {
    const record = await this.findById(id);
    return this.buildPdf(record, 'prescription', undefined, actor);
  }

  async evolutionPdf(noteId: string, actor?: CurrentUser) {
    const note = await this.records.findEvolutionNote(noteId);
    if (!note) throw new NotFoundException('Evolution note not found');
    return this.buildPdf(note.medicalRecord, 'evolution', note, actor);
  }

  private mergeHistory(dto: Partial<CreateMedicalRecordDto>, nested?: ClinicalHistoryDto) {
    const clinicalHistory = {
      personalPathologicalHistory: nested?.personalPathologicalHistory ?? dto.personalPathologicalHistory,
      personalNonPathologicalHistory: nested?.personalNonPathologicalHistory ?? dto.personalNonPathologicalHistory,
      surgicalHistory: nested?.surgicalHistory ?? dto.surgicalHistory,
      traumaticHistory: nested?.traumaticHistory ?? dto.traumaticHistory,
      allergicHistory: nested?.allergicHistory ?? dto.allergicHistory,
      gynecologicalObstetricHistory: nested?.gynecologicalObstetricHistory ?? dto.gynecologicalObstetricHistory,
      familyHistory: nested?.familyHistory ?? dto.familyHistory,
      toxicHabits: nested?.toxicHabits ?? dto.toxicHabits,
      currentMedications: nested?.currentMedications ?? dto.currentMedications,
      reviewOfSystems: nested?.reviewOfSystems ?? dto.reviewOfSystems,
    };
    return { clinicalHistory, recordFields: clinicalHistory };
  }

  private sectionBase<T extends object>(patientId: string, doctorId: string, userId: string, values: T) {
    return { patientId, doctorId, createdById: userId, updatedById: userId, ...values };
  }

  private vitalSigns(patientId: string, doctorId: string, userId: string, values: VitalSignsDto) {
    return this.sectionBase(patientId, doctorId, userId, this.vitalSignsValues(values));
  }

  private vitalSignsValues(values: VitalSignsDto) {
    const bmi = values.weight && values.height ? values.weight / (values.height * values.height) : undefined;
    return { ...values, bmi: bmi ? Math.round(bmi * 100) / 100 : undefined };
  }

  private fileType(mimeType: string) {
    if (mimeType.startsWith('image/')) return 'IMAGE';
    if (mimeType === 'application/pdf') return 'PDF';
    return 'DICOM_READY';
  }

  private async buildPdf(record: any, kind: PdfKind, note?: any, actor?: CurrentUser): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'LETTER', margin: 48 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));

    const title = kind === 'prescription' ? 'Receta Medica' : kind === 'evolution' ? 'Nota de Evolucion' : 'Expediente Clinico';
    this.pdfHeader(doc, title, record);

    if (kind === 'prescription') {
      this.pdfSection(doc, 'Tratamiento / Prescripcion', record.prescriptions?.map((rx: any) => `${rx.medicationName} ${rx.dose ?? ''} ${rx.route ?? ''} ${rx.frequency ?? ''} ${rx.duration ?? ''}\n${rx.instructions ?? ''}`).join('\n\n') || 'Sin medicamentos registrados.');
      this.pdfSection(doc, 'Plan', record.treatmentPlan);
      this.pdfSection(doc, 'Recomendaciones', record.recommendations);
    } else if (kind === 'evolution') {
      this.pdfSection(doc, 'Subjetivo', note?.subjective);
      this.pdfSection(doc, 'Objetivo', note?.objective);
      this.pdfSection(doc, 'Analisis', note?.assessment);
      this.pdfSection(doc, 'Plan', note?.plan);
      this.pdfSection(doc, 'Doctor', note?.doctorName);
    } else {
      this.pdfSection(doc, 'Motivo de consulta', record.reasonForVisit);
      this.pdfSection(doc, 'Padecimiento actual', record.currentIllness);
      this.pdfSection(doc, 'Antecedentes', [
        record.personalPathologicalHistory,
        record.personalNonPathologicalHistory,
        record.surgicalHistory,
        record.traumaticHistory,
        record.allergicHistory,
        record.gynecologicalObstetricHistory,
        record.familyHistory,
      ].filter(Boolean).join('\n'));
      this.pdfSection(doc, 'Signos vitales', record.vitalSigns ? `PA: ${record.vitalSigns.bloodPressure ?? '-'} FC: ${record.vitalSigns.heartRate ?? '-'} FR: ${record.vitalSigns.respiratoryRate ?? '-'} Temp: ${record.vitalSigns.temperature ?? '-'} SpO2: ${record.vitalSigns.oxygenSaturation ?? '-'} Peso: ${record.vitalSigns.weight ?? '-'} Talla: ${record.vitalSigns.height ?? '-'} IMC: ${record.vitalSigns.bmi ?? '-'}` : undefined);
      this.pdfSection(doc, 'Examen fisico', record.physicalExam ? Object.entries(record.physicalExam).filter(([key, value]) => value && !['id', 'medicalRecordId', 'patientId', 'doctorId', 'createdById', 'updatedById', 'createdAt', 'updatedAt'].includes(key)).map(([key, value]) => `${key}: ${value}`).join('\n') : undefined);
      this.pdfSection(doc, 'Diagnosticos', record.diagnoses?.map((dx: any) => `${dx.mainDiagnosis}${dx.icd10Code ? ` (${dx.icd10Code})` : ''}\n${dx.clinicalImpression ?? ''}`).join('\n\n') || record.diagnosisText);
      this.pdfSection(doc, 'Plan y recomendaciones', [record.treatmentPlan, record.recommendations].filter(Boolean).join('\n'));
    }

    doc.moveDown(2).fontSize(9).fillColor('#64748b').text(`Generado por: ${actor?.email ?? 'Sistema'} | ${new Date().toLocaleString('es-NI')}`);
    doc.end();
    await this.audit.record({ actorId: actor?.sub, action: AuditAction.EXPORT, entity: 'MedicalRecord', entityId: record.id });
    return done;
  }

  private pdfHeader(doc: PDFKit.PDFDocument, title: string, record: any) {
    doc.fontSize(18).fillColor('#0f766e').text('Clinica Keyser');
    doc.fontSize(14).fillColor('#0f172a').text(title);
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#334155');
    doc.text(`Doctor: Sergio Herrera`);
    doc.text(`Fecha: ${new Date(record.consultationDate ?? new Date()).toLocaleDateString('es-NI')}`);
    doc.text(`Paciente: ${record.patient?.fullName ?? ''}`);
    doc.text(`Codigo paciente: ${record.patient?.patientCode ?? ''}`);
    doc.text(`No. expediente: ${record.recordNumber ?? ''}`);
    doc.moveDown();
  }

  private pdfSection(doc: PDFKit.PDFDocument, title: string, value?: string | null) {
    doc.fontSize(12).fillColor('#0f172a').text(title, { underline: true });
    doc.moveDown(0.25);
    doc.fontSize(10).fillColor('#334155').text(value?.trim() || 'No registrado.');
    doc.moveDown();
  }
}
