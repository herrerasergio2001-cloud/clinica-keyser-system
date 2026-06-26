import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditAction } from '@prisma/client';
import { createReadStream, existsSync } from 'fs';
import { join, normalize } from 'path';
import PDFDocument = require('pdfkit');
import { AuditService } from '../audit/audit.service';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { SafeDeleteDto } from '../../shared/dto/safe-delete.dto';
import { FileStorage } from '../../shared/storage/file-storage';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  CreateCertificateDto,
  CreateClinicalEventDto,
  CreateConsentDto,
  CreateImagingOrderDto,
  CreateLabOrderExternalDto,
  CreatePrescriptionDto,
  UpdateClinicSettingsDto,
  UpdateDoctorProfileDto,
} from './dto/clinical-documents.dto';

@Injectable()
export class ClinicalDocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
    @Inject('FileStorage') private readonly storage: FileStorage,
  ) {}

  users() {
    return this.prisma.user.findMany({ include: { role: true, doctorProfile: true }, orderBy: { fullName: 'asc' } });
  }

  doctors() {
    return this.prisma.user.findMany({
      where: {
        isActive: true,
        role: { name: { in: ['SUPER_ADMIN', 'DOCTOR'] } },
        doctorProfile: { isActive: true, minsaCode: { not: null } },
      },
      include: { role: true, doctorProfile: true },
      orderBy: { fullName: 'asc' },
    });
  }

  async doctor(id: string) {
    const doctor = await this.prisma.user.findUnique({ where: { id }, include: { role: true, doctorProfile: true } });
    if (!doctor) throw new NotFoundException('Médico no encontrado');
    return doctor;
  }

  async updateDoctor(id: string, dto: UpdateDoctorProfileDto, actor: CurrentUser, ipAddress?: string) {
    const before = await this.doctor(id);
    const profile = await this.prisma.doctorProfile.upsert({
      where: { userId: id },
      update: dto,
      create: {
        userId: id,
        fullName: dto.fullName ?? before.fullName,
        specialty: dto.specialty,
        minsaCode: dto.minsaCode,
        phone: dto.phone ?? before.phone,
        signatureUrl: dto.signatureUrl,
        stampUrl: dto.stampUrl,
        photoUrl: dto.photoUrl,
        isActive: dto.isActive ?? true,
      },
    });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.UPDATE, entity: 'DoctorProfile', entityId: profile.id, ipAddress, before, after: profile });
    return this.doctor(id);
  }

  async uploadDoctorAsset(id: string, file: Express.Multer.File, type: 'signature' | 'stamp', actor: CurrentUser, ipAddress?: string) {
    if (!file) throw new BadRequestException('Archivo requerido');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) throw new BadRequestException('Solo se permiten JPG, PNG o WEBP');
    const stored = await this.storage.save(file, `doctors/${id}`);
    const url = `/api/doctors/${id}/${type === 'signature' ? 'signature' : 'stamp'}/file?key=${encodeURIComponent(stored.storageKey)}`;
    const profile = await this.prisma.doctorProfile.upsert({
      where: { userId: id },
      update: type === 'signature' ? { signatureUrl: url } : { stampUrl: url },
      create: { userId: id, fullName: (await this.doctor(id)).fullName, [type === 'signature' ? 'signatureUrl' : 'stampUrl']: url },
    });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.UPDATE, entity: type === 'signature' ? 'DoctorSignature' : 'DoctorStamp', entityId: profile.id, ipAddress, after: profile });
    return profile;
  }

  async settings() {
    const existing = await this.prisma.clinicSettings.findFirst({ orderBy: { createdAt: 'asc' } });
    if (existing) return existing;
    return this.prisma.clinicSettings.create({ data: { id: 'clinic-keyser-settings' } });
  }

  async updateSettings(dto: UpdateClinicSettingsDto, actor: CurrentUser, ipAddress?: string) {
    const before = await this.settings();
    const settings = await this.prisma.clinicSettings.update({ where: { id: before.id }, data: dto });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.UPDATE, entity: 'ClinicSettings', entityId: settings.id, ipAddress, before, after: settings });
    return settings;
  }

  async uploadLogo(file: Express.Multer.File, actor: CurrentUser, ipAddress?: string) {
    if (!file) throw new BadRequestException('Archivo requerido');
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(file.mimetype)) throw new BadRequestException('Solo se permiten imágenes');
    const stored = await this.storage.save(file, 'clinic-settings');
    const url = `/api/clinic-settings/logo/file?key=${encodeURIComponent(stored.storageKey)}`;
    const before = await this.settings();
    const settings = await this.prisma.clinicSettings.update({ where: { id: before.id }, data: { logoUrl: url, printLogoUrl: url } });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.UPDATE, entity: 'ClinicSettingsLogo', entityId: settings.id, ipAddress, before, after: settings });
    return settings;
  }

  fileStream(key: string) {
    if (!key.startsWith('doctors/') && !key.startsWith('clinic-settings/')) throw new BadRequestException('Archivo no permitido');
    const root = this.config.get<string>('LOCAL_STORAGE_ROOT') ?? './storage';
    const fullPath = normalize(join(root, key));
    const normalizedRoot = normalize(root);
    if (!fullPath.startsWith(normalizedRoot) || !existsSync(fullPath)) throw new NotFoundException('Archivo no encontrado');
    return createReadStream(fullPath);
  }

  listTemplates() {
    return this.prisma.documentTemplate.findMany({ where: { isActive: true }, orderBy: [{ type: 'asc' }, { name: 'asc' }] });
  }

  listPrintableDocuments(patientId?: string) {
    return this.prisma.printableDocument.findMany({
      where: { isDeleted: false, ...(patientId ? { patientId } : {}) },
      include: { patient: true, doctor: { include: { doctorProfile: true } }, clinicalEvents: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  listClinicalEvents(patientId?: string) {
    return this.prisma.clinicalEvent.findMany({
      where: patientId ? { patientId } : undefined,
      include: { patient: true, doctor: { include: { doctorProfile: true } }, printableDocument: true },
      orderBy: { eventAt: 'desc' },
    });
  }

  async createClinicalEvent(dto: CreateClinicalEventDto, actor: CurrentUser, ipAddress?: string) {
    const event = await this.prisma.clinicalEvent.create({
      data: {
        patientId: dto.patientId,
        medicalRecordId: dto.medicalRecordId,
        doctorId: dto.doctorId ?? actor.sub,
        type: dto.type,
        title: dto.title,
        summary: dto.summary,
        module: dto.module,
        entity: dto.entity,
        entityId: dto.entityId,
        createdById: actor.sub,
      },
      include: { patient: true, doctor: { include: { doctorProfile: true } }, printableDocument: true },
    });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.CREATE, entity: 'ClinicalEvent', entityId: event.id, ipAddress, after: event });
    return event;
  }

  async createPrescription(dto: CreatePrescriptionDto, actor: CurrentUser, ipAddress?: string) {
    await this.assertCanPrescribe(actor, ipAddress);
    if (!dto.items?.length) throw new BadRequestException('Debe agregar al menos un medicamento');
    const doctorId = dto.doctorId ?? actor.sub;
    await this.assertPatient(dto.patientId);
    await this.assertDoctor(doctorId);
    const prescriptionNumber = await this.nextNumber('prescription_number', 'RX', 'prescription', 'prescriptionNumber');
    const printable = await this.prisma.printableDocument.create({
      data: { type: 'PRESCRIPTION', title: `Receta ${prescriptionNumber}`, patientId: dto.patientId, doctorId, medicalRecordId: dto.medicalRecordId, createdById: actor.sub },
    });
    const first = dto.items[0];
    const prescription = await this.prisma.prescription.create({
      data: {
        patientId: dto.patientId,
        doctorId,
        medicalRecordId: dto.medicalRecordId,
        prescriptionNumber,
        diagnosis: dto.diagnosis,
        recommendationsGeneral: dto.recommendationsGeneral,
        medicationName: first.medicationName,
        concentration: first.concentration,
        presentation: first.presentation,
        dose: first.dose,
        route: first.route,
        frequency: first.frequency,
        duration: first.duration,
        instructions: first.instructions,
        printableDocumentId: printable.id,
        createdById: actor.sub,
        updatedById: actor.sub,
        items: { create: dto.items.map((item, index) => ({ ...item, sortOrder: index + 1 })) },
      },
      include: this.prescriptionInclude(),
    });
    const event = await this.attachEvent({
      patientId: dto.patientId,
      medicalRecordId: dto.medicalRecordId,
      doctorId,
      type: 'PRESCRIPTION',
      title: `Receta médica ${prescriptionNumber}`,
      summary: prescription.items.map((item) => item.medicationName).join(', '),
      module: 'Expediente',
      entity: 'Prescription',
      entityId: prescription.id,
      printableDocumentId: printable.id,
      createdById: actor.sub,
    });
    const withEvent = await this.prisma.prescription.update({ where: { id: prescription.id }, data: { clinicalEventId: event.id }, include: this.prescriptionInclude() });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.CREATE, entity: 'Prescription', entityId: prescription.id, ipAddress, after: prescription });
    return withEvent;
  }

  async getPrescription(id: string) {
    const prescription = await this.prisma.prescription.findUnique({ where: { id }, include: this.prescriptionInclude() });
    if (!prescription || prescription.isDeleted || prescription.status === 'VOIDED') throw new NotFoundException('Receta no encontrada');
    return prescription;
  }

  listPrescriptions(medicalRecordId?: string) {
    return this.prisma.prescription.findMany({
      where: medicalRecordId ? { medicalRecordId } : undefined,
      include: this.prescriptionInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async updatePrescription(id: string, dto: Partial<CreatePrescriptionDto>, actor: CurrentUser, ipAddress?: string) {
    await this.assertCanPrescribe(actor, ipAddress);
    const before = await this.getPrescription(id);
    const prescription = await this.prisma.prescription.update({
      where: { id },
      data: {
        diagnosis: dto.diagnosis,
        recommendationsGeneral: dto.recommendationsGeneral,
        updatedById: actor.sub,
        items: dto.items ? { deleteMany: {}, create: dto.items.map((item, index) => ({ ...item, sortOrder: index + 1 })) } : undefined,
      },
      include: this.prescriptionInclude(),
    });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.UPDATE, entity: 'Prescription', entityId: id, ipAddress, before, after: prescription });
    return prescription;
  }

  async voidPrescription(id: string, dto: SafeDeleteDto, actor: CurrentUser, ipAddress?: string) {
    await this.assertCanPrescribe(actor, ipAddress);
    const before = await this.getPrescription(id);
    const prescription = await this.prisma.prescription.update({
      where: { id },
      data: { status: 'VOIDED', isDeleted: true, voidedAt: new Date(), voidedBy: actor.sub, voidReason: dto.reason, updatedById: actor.sub },
      include: this.prescriptionInclude(),
    });
    if (before.printableDocumentId) {
      await this.prisma.printableDocument.update({ where: { id: before.printableDocumentId }, data: { status: 'VOIDED', isDeleted: true, deletedAt: new Date(), deletedBy: actor.sub, deleteReason: dto.reason } });
    }
    await this.audit.record({ actorId: actor.sub, action: AuditAction.PRESCRIPTION_VOIDED, entity: 'Prescription', entityId: id, ipAddress, before, after: { prescription, reason: dto.reason } });
    return prescription;
  }

  async deletePrescription(id: string, dto: SafeDeleteDto, actor: CurrentUser, ipAddress?: string) {
    const before = await this.prisma.prescription.findUnique({ where: { id }, include: this.prescriptionInclude() });
    if (!before) throw new NotFoundException('Receta no encontrada');
    await this.prisma.$transaction(async (tx) => {
      await tx.prescription.delete({ where: { id } });
      if (before.clinicalEventId) await tx.clinicalEvent.deleteMany({ where: { id: before.clinicalEventId } });
      if (before.printableDocumentId) await tx.printableDocument.deleteMany({ where: { id: before.printableDocumentId } });
    });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.DELETE, entity: 'Prescription', entityId: id, ipAddress, before, after: { permanentlyDeleted: true, reason: dto.reason } });
    return { success: true };
  }

  async createLabOrderExternal(dto: CreateLabOrderExternalDto, actor: CurrentUser, ipAddress?: string) {
    if (!dto.exams?.length) throw new BadRequestException('Debe seleccionar al menos un examen');
    const doctorId = dto.doctorId ?? actor.sub;
    const orderNumber = await this.nextNumber('external_lab_order_number', 'LABEXT', 'labOrderExternal', 'orderNumber');
    const printable = await this.prisma.printableDocument.create({ data: { type: 'LAB_ORDER_EXTERNAL', title: `Orden de laboratorio ${orderNumber}`, patientId: dto.patientId, doctorId, medicalRecordId: dto.medicalRecordId, createdById: actor.sub } });
    const order = await this.prisma.labOrderExternal.create({
      data: {
        orderNumber,
        patientId: dto.patientId,
        doctorId,
        medicalRecordId: dto.medicalRecordId,
        diagnosis: dto.diagnosis,
        reason: dto.reason,
        observations: dto.observations,
        printableDocumentId: printable.id,
        createdById: actor.sub,
        updatedById: actor.sub,
        items: { create: dto.exams.map((examName, index) => ({ examName, sortOrder: index + 1 })) },
      },
      include: this.labOrderInclude(),
    });
    const event = await this.attachEvent({
      patientId: dto.patientId,
      medicalRecordId: dto.medicalRecordId,
      doctorId,
      type: 'LAB_ORDER_EXTERNAL',
      title: `Orden de laboratorio ${orderNumber}`,
      summary: dto.exams.join(', '),
      module: 'Expediente',
      entity: 'LabOrderExternal',
      entityId: order.id,
      printableDocumentId: printable.id,
      createdById: actor.sub,
    });
    const withEvent = await this.prisma.labOrderExternal.update({ where: { id: order.id }, data: { clinicalEventId: event.id }, include: this.labOrderInclude() });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.CREATE, entity: 'LabOrderExternal', entityId: order.id, ipAddress, after: order });
    return withEvent;
  }

  async getLabOrderExternal(id: string) {
    const order = await this.prisma.labOrderExternal.findUnique({ where: { id }, include: this.labOrderInclude() });
    if (!order || order.isDeleted || order.status === 'VOIDED') throw new NotFoundException('Orden de laboratorio no encontrada');
    return order;
  }

  listLabOrdersExternal(medicalRecordId?: string) {
    return this.prisma.labOrderExternal.findMany({
      where: medicalRecordId ? { medicalRecordId } : undefined,
      include: this.labOrderInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async voidLabOrderExternal(id: string, dto: SafeDeleteDto, actor: CurrentUser, ipAddress?: string) {
    const before = await this.getLabOrderExternal(id);
    const order = await this.prisma.labOrderExternal.update({
      where: { id },
      data: { status: 'VOIDED', isDeleted: true, voidedAt: new Date(), voidedBy: actor.sub, voidReason: dto.reason, updatedById: actor.sub },
      include: this.labOrderInclude(),
    });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.DELETE, entity: 'LabOrderExternal', entityId: id, ipAddress, before, after: { order, reason: dto.reason } });
    return order;
  }

  async deleteLabOrderExternal(id: string, dto: SafeDeleteDto, actor: CurrentUser, ipAddress?: string) {
    const before = await this.prisma.labOrderExternal.findUnique({ where: { id }, include: this.labOrderInclude() });
    if (!before) throw new NotFoundException('Orden de laboratorio no encontrada');
    await this.prisma.$transaction(async (tx) => {
      await tx.labOrderExternal.delete({ where: { id } });
      if (before.clinicalEventId) await tx.clinicalEvent.deleteMany({ where: { id: before.clinicalEventId } });
      if (before.printableDocumentId) await tx.printableDocument.deleteMany({ where: { id: before.printableDocumentId } });
    });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.DELETE, entity: 'LabOrderExternal', entityId: id, ipAddress, before, after: { permanentlyDeleted: true, reason: dto.reason } });
    return { success: true };
  }

  async createImagingOrder(dto: CreateImagingOrderDto, actor: CurrentUser, ipAddress?: string) {
    const doctorId = dto.doctorId ?? actor.sub;
    const orderNumber = await this.nextNumber('imaging_order_number', 'IMG', 'imagingOrder', 'orderNumber');
    const printable = await this.prisma.printableDocument.create({ data: { type: 'IMAGING_ORDER', title: `Orden de imagen ${orderNumber}`, patientId: dto.patientId, doctorId, medicalRecordId: dto.medicalRecordId, createdById: actor.sub } });
    const order = await this.prisma.imagingOrder.create({
      data: {
        orderNumber,
        patientId: dto.patientId,
        doctorId,
        medicalRecordId: dto.medicalRecordId,
        studyType: dto.studyType,
        imagingType: dto.imagingType,
        clinicalReason: dto.clinicalReason,
        reason: dto.clinicalReason,
        presumptiveDiagnosis: dto.presumptiveDiagnosis,
        observations: dto.observations,
        printableDocumentId: printable.id,
        createdById: actor.sub,
        updatedById: actor.sub,
      },
      include: this.imagingInclude(),
    });
    const event = await this.attachEvent({
      patientId: dto.patientId,
      medicalRecordId: dto.medicalRecordId,
      doctorId,
      type: 'IMAGING_ORDER',
      title: `Orden de imagen ${orderNumber}`,
      summary: [dto.imagingType, dto.studyType].filter(Boolean).join(' · '),
      module: 'Expediente',
      entity: 'ImagingOrder',
      entityId: order.id,
      printableDocumentId: printable.id,
      createdById: actor.sub,
    });
    const withEvent = await this.prisma.imagingOrder.update({ where: { id: order.id }, data: { clinicalEventId: event.id }, include: this.imagingInclude() });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.CREATE, entity: 'ImagingOrder', entityId: order.id, ipAddress, after: order });
    return withEvent;
  }

  async getImagingOrder(id: string) {
    const order = await this.prisma.imagingOrder.findUnique({ where: { id }, include: this.imagingInclude() });
    if (!order || order.isDeleted || order.status === 'VOIDED') throw new NotFoundException('Orden de imagen no encontrada');
    return order;
  }

  listImagingOrders(medicalRecordId?: string) {
    return this.prisma.imagingOrder.findMany({
      where: medicalRecordId ? { medicalRecordId } : undefined,
      include: this.imagingInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async voidImagingOrder(id: string, dto: SafeDeleteDto, actor: CurrentUser, ipAddress?: string) {
    const before = await this.getImagingOrder(id);
    const order = await this.prisma.imagingOrder.update({
      where: { id },
      data: { status: 'VOIDED', isDeleted: true, voidedAt: new Date(), voidedBy: actor.sub, voidReason: dto.reason, updatedById: actor.sub },
      include: this.imagingInclude(),
    });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.DELETE, entity: 'ImagingOrder', entityId: id, ipAddress, before, after: { order, reason: dto.reason } });
    return order;
  }

  async deleteImagingOrder(id: string, dto: SafeDeleteDto, actor: CurrentUser, ipAddress?: string) {
    const before = await this.prisma.imagingOrder.findUnique({ where: { id }, include: this.imagingInclude() });
    if (!before) throw new NotFoundException('Orden de imagen no encontrada');
    await this.prisma.$transaction(async (tx) => {
      await tx.imagingOrder.delete({ where: { id } });
      if (before.clinicalEventId) await tx.clinicalEvent.deleteMany({ where: { id: before.clinicalEventId } });
      if (before.printableDocumentId) await tx.printableDocument.deleteMany({ where: { id: before.printableDocumentId } });
    });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.DELETE, entity: 'ImagingOrder', entityId: id, ipAddress, before, after: { permanentlyDeleted: true, reason: dto.reason } });
    return { success: true };
  }

  async createCertificate(dto: CreateCertificateDto, actor: CurrentUser, ipAddress?: string) {
    const doctorId = dto.doctorId ?? actor.sub;
    const certificateNumber = await this.nextNumber('certificate_number', 'CERT', 'medicalCertificate', 'certificateNumber');
    const printable = await this.prisma.printableDocument.create({ data: { type: dto.documentType, title: dto.title, patientId: dto.patientId, doctorId, medicalRecordId: dto.medicalRecordId, createdById: actor.sub } });
    const certificate = await this.prisma.medicalCertificate.create({
      data: { ...dto, doctorId, certificateNumber, printableDocumentId: printable.id, createdById: actor.sub, updatedById: actor.sub },
      include: this.certificateInclude(),
    });
    const event = await this.attachEvent({
      patientId: dto.patientId,
      medicalRecordId: dto.medicalRecordId,
      doctorId,
      type: dto.documentType,
      title: dto.title,
      summary: dto.diagnosis ?? dto.content.slice(0, 140),
      module: 'Expediente',
      entity: 'MedicalCertificate',
      entityId: certificate.id,
      printableDocumentId: printable.id,
      createdById: actor.sub,
    });
    const withEvent = await this.prisma.medicalCertificate.update({ where: { id: certificate.id }, data: { clinicalEventId: event.id }, include: this.certificateInclude() });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.CREATE, entity: 'MedicalCertificate', entityId: certificate.id, ipAddress, after: certificate });
    return withEvent;
  }

  async voidCertificate(id: string, dto: SafeDeleteDto, actor: CurrentUser, ipAddress?: string) {
    const before = await this.prisma.medicalCertificate.findUnique({ where: { id }, include: this.certificateInclude() });
    if (!before || before.isDeleted || before.status === 'VOIDED') throw new NotFoundException('Certificado no encontrado');
    const certificate = await this.prisma.medicalCertificate.update({
      where: { id },
      data: { status: 'VOIDED', isDeleted: true, voidedAt: new Date(), voidedBy: actor.sub, voidReason: dto.reason, updatedById: actor.sub },
      include: this.certificateInclude(),
    });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.DELETE, entity: 'MedicalCertificate', entityId: id, ipAddress, before, after: { certificate, reason: dto.reason } });
    return certificate;
  }

  async createConsent(dto: CreateConsentDto, actor: CurrentUser, ipAddress?: string) {
    const doctorId = dto.doctorId ?? actor.sub;
    const consentNumber = await this.nextNumber('consent_number', 'CONS', 'consentDocument', 'consentNumber');
    const printable = await this.prisma.printableDocument.create({ data: { type: 'CONSENT', title: dto.title, patientId: dto.patientId, doctorId, medicalRecordId: dto.medicalRecordId, createdById: actor.sub } });
    const consent = await this.prisma.consentDocument.create({
      data: { ...dto, doctorId, consentNumber, printableDocumentId: printable.id, createdById: actor.sub, updatedById: actor.sub },
      include: this.consentInclude(),
    });
    const event = await this.attachEvent({
      patientId: dto.patientId,
      medicalRecordId: dto.medicalRecordId,
      doctorId,
      type: 'CONSENT',
      title: dto.title,
      summary: dto.procedureName,
      module: 'Expediente',
      entity: 'ConsentDocument',
      entityId: consent.id,
      printableDocumentId: printable.id,
      createdById: actor.sub,
    });
    const withEvent = await this.prisma.consentDocument.update({ where: { id: consent.id }, data: { clinicalEventId: event.id }, include: this.consentInclude() });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.CREATE, entity: 'ConsentDocument', entityId: consent.id, ipAddress, after: consent });
    return withEvent;
  }

  async documentPdf(id: string, actor: CurrentUser) {
    const printable = await this.prisma.printableDocument.findUnique({ where: { id }, include: { patient: true, doctor: { include: { doctorProfile: true } }, prescriptions: { include: { items: true } }, labOrders: { include: { items: true } }, imagingOrders: true, certificates: true, consentDocuments: true } });
    if (!printable || printable.isDeleted) throw new NotFoundException('Documento no encontrado');
    await this.audit.record({ actorId: actor.sub, action: AuditAction.EXPORT, entity: 'PrintableDocument', entityId: id });
    return this.pdfBuffer(printable.type, printable);
  }

  prescriptionPdf(id: string, actor: CurrentUser) {
    return this.getPrescription(id).then(async (prescription) => {
      await this.audit.record({ actorId: actor.sub, action: AuditAction.EXPORT, entity: 'Prescription', entityId: id });
      return this.pdfBuffer('PRESCRIPTION', prescription);
    });
  }

  labOrderPdf(id: string, actor: CurrentUser) {
    return this.getLabOrderExternal(id).then(async (order) => {
      await this.audit.record({ actorId: actor.sub, action: AuditAction.EXPORT, entity: 'LabOrderExternal', entityId: id });
      return this.pdfBuffer('LAB_ORDER_EXTERNAL', order);
    });
  }

  imagingOrderPdf(id: string, actor: CurrentUser) {
    return this.getImagingOrder(id).then(async (order) => {
      await this.audit.record({ actorId: actor.sub, action: AuditAction.EXPORT, entity: 'ImagingOrder', entityId: id });
      return this.pdfBuffer('IMAGING_ORDER', order);
    });
  }

  private async pdfBuffer(kind: string, data: any) {
    const settings = await this.settings();
    const doc = new PDFDocument({ size: 'LETTER', margin: 48 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));
    this.header(doc, settings, data.doctor ?? data.doctorId);
    const patient = data.patient;
    const doctor = data.doctor?.doctorProfile ?? data.doctor;
    doc.moveDown().fontSize(11).fillColor('#111827');
    doc.text(`Paciente: ${patient?.fullName ?? 'No registrado'}`);
    doc.text(`Expediente: ${patient?.patientCode ?? '-'} | Sexo: ${patient?.gender ?? '-'} | Teléfono: ${patient?.phone ?? '-'}`);
    doc.text(`Médico: ${doctor?.fullName ?? data.doctor?.fullName ?? 'No registrado'} | MINSA: ${doctor?.minsaCode ?? '-'}`);
    doc.text(`Fecha: ${new Date(data.createdAt ?? data.issuedAt ?? Date.now()).toLocaleDateString('es-NI')}`);
    doc.moveDown();
    if (kind === 'PRESCRIPTION') this.prescriptionBody(doc, data);
    else if (kind === 'LAB_ORDER_EXTERNAL') this.labOrderBody(doc, data);
    else if (kind === 'IMAGING_ORDER') this.imagingBody(doc, data);
    else if (kind === 'CONSENT') this.consentBody(doc, data);
    else this.certificateBody(doc, data);
    this.footer(doc, doctor);
    doc.end();
    return done;
  }

  private header(doc: PDFKit.PDFDocument, settings: Awaited<ReturnType<ClinicalDocumentsService['settings']>>, _doctor: unknown) {
    const logo = this.assetPath(settings.printLogoUrl ?? settings.logoUrl, true);
    if (logo) {
      try {
        doc.image(logo, 48, 38, { width: 54, height: 54, fit: [54, 54] });
      } catch {
        // Un logo incompatible nunca debe impedir la generación del documento.
      }
    }
    doc.fillColor(settings.primaryColor ?? '#1f2f66').fontSize(18).text(settings.clinicName, 112, 42);
    doc.fillColor('#334155').fontSize(9).text(settings.address, 112, 66, { width: 390 });
    doc.text(`Tel: ${settings.phoneMain} | Estética: ${settings.phoneAesthetic ?? '-'} | WhatsApp: ${settings.whatsapp ?? '-'}`, 112, 84);
    doc.moveTo(48, 108).lineTo(564, 108).strokeColor(settings.secondaryColor ?? '#ef2f32').stroke();
  }

  private prescriptionBody(doc: PDFKit.PDFDocument, prescription: any) {
    doc.fillColor('#1f2f66').fontSize(15).text(`Receta médica ${prescription.prescriptionNumber ?? ''}`);
    if (prescription.diagnosis) doc.fontSize(10).fillColor('#111827').text(`Diagnóstico: ${prescription.diagnosis}`);
    doc.moveDown(0.5);
    for (const item of prescription.items ?? []) {
      doc.fontSize(11).fillColor('#111827').text(`${item.sortOrder}. ${item.medicationName} ${item.concentration ?? ''} ${item.presentation ?? ''}`);
      doc.fontSize(10).fillColor('#334155').text(`Dosis: ${item.dose ?? '-'} | Vía: ${item.route ?? '-'} | Frecuencia: ${item.frequency ?? '-'} | Duración: ${item.duration ?? '-'}`);
      if (item.instructions) doc.text(`Indicaciones: ${item.instructions}`);
      doc.moveDown(0.4);
    }
    if (prescription.recommendationsGeneral) doc.moveDown().text(`Recomendaciones: ${prescription.recommendationsGeneral}`);
  }

  private labOrderBody(doc: PDFKit.PDFDocument, order: any) {
    doc.fillColor('#1f2f66').fontSize(15).text(`Orden de laboratorio ${order.orderNumber ?? ''}`);
    if (order.reason) doc.fontSize(10).fillColor('#111827').text(`Motivo: ${order.reason}`);
    if (order.diagnosis) doc.text(`Diagnóstico: ${order.diagnosis}`);
    doc.moveDown(0.5).fontSize(11).text('Exámenes solicitados:');
    for (const item of order.items ?? []) doc.text(`• ${item.examName}`);
    if (order.observations) doc.moveDown().text(`Observaciones: ${order.observations}`);
  }

  private imagingBody(doc: PDFKit.PDFDocument, order: any) {
    doc.fillColor('#1f2f66').fontSize(15).text(`Orden de imagen ${order.orderNumber ?? ''}`);
    doc.fontSize(11).fillColor('#111827').text(`Tipo: ${order.imagingType ?? order.studyType}`);
    doc.text(`Estudio solicitado: ${order.studyType}`);
    doc.text(`Motivo clínico: ${order.clinicalReason ?? order.reason ?? '-'}`);
    doc.text(`Diagnóstico presuntivo: ${order.presumptiveDiagnosis ?? '-'}`);
    if (order.observations) doc.text(`Observaciones: ${order.observations}`);
  }

  private certificateBody(doc: PDFKit.PDFDocument, certificate: any) {
    const item = certificate.certificates?.[0] ?? certificate;
    doc.fillColor('#1f2f66').fontSize(15).text(item.title ?? 'Documento médico');
    doc.moveDown().fontSize(11).fillColor('#111827').text(item.content ?? '', { align: 'justify' });
    if (item.diagnosis) doc.moveDown().text(`Diagnóstico: ${item.diagnosis}`);
    if (item.restDays) doc.text(`Días de reposo: ${item.restDays}`);
  }

  private consentBody(doc: PDFKit.PDFDocument, consent: any) {
    const item = consent.consentDocuments?.[0] ?? consent;
    doc.fillColor('#1f2f66').fontSize(15).text(item.title ?? 'Consentimiento informado');
    doc.moveDown().fontSize(11).fillColor('#111827').text(`Procedimiento: ${item.procedureName ?? '-'}`);
    doc.moveDown().text(item.content ?? '', { align: 'justify' });
    if (item.risks) doc.moveDown().text(`Riesgos: ${item.risks}`);
    if (item.alternatives) doc.text(`Alternativas: ${item.alternatives}`);
  }

  private footer(doc: PDFKit.PDFDocument, doctor?: any) {
    doc.moveDown(3).fontSize(10).fillColor('#111827');
    const signature = this.assetPath(doctor?.signatureUrl);
    if (signature) {
      try {
        doc.image(signature, doc.page.width / 2 - 65, doc.y, { fit: [130, 50], align: 'center' });
        doc.moveDown(4);
      } catch {
        // La firma es opcional; el PDF continúa aunque el archivo esté dañado.
      }
    }
    doc.text('__________________________________', { align: 'center' });
    doc.text(doctor?.fullName ?? 'Médico tratante', { align: 'center' });
    doc.text(`Código MINSA: ${doctor?.minsaCode ?? '-'}`, { align: 'center' });
    doc.moveDown().fontSize(8).fillColor('#64748b').text('Esta receta fue emitida electrónicamente por Clínica Keyser.', { align: 'center' });
  }

  private assetPath(url?: string | null, includeDefaultLogo = false) {
    const root = this.config.get<string>('LOCAL_STORAGE_ROOT') ?? './storage';
    const candidates: string[] = [];
    if (url) {
      try {
        const parsed = new URL(url, 'https://clinicakeyser.local');
        const key = parsed.searchParams.get('key');
        if (key) candidates.push(normalize(join(root, key)));
      } catch {
        // Se intentarán las rutas locales alternativas.
      }
      const relative = url.startsWith('/') ? url.slice(1) : url;
      candidates.push(join(process.cwd(), 'apps/web/public', relative));
      candidates.push(join(process.cwd(), relative));
    }
    if (includeDefaultLogo) {
      candidates.push(join(process.cwd(), 'assets', 'clinica-keyser-logo.jpg'));
      candidates.push(join(process.cwd(), 'apps/api/assets', 'clinica-keyser-logo.jpg'));
      candidates.push(join(process.cwd(), 'apps/web/public', 'clinica-keyser-logo.jpg'));
    }
    return candidates.find((path) => existsSync(path));
  }

  private readonly numberCheckDelegates: Record<string, { findFirst: (args: { where: Record<string, string> }) => Promise<unknown> }> = {
    prescription: { findFirst: (args) => this.prisma.prescription.findFirst(args) },
    labOrderExternal: { findFirst: (args) => this.prisma.labOrderExternal.findFirst(args) },
    imagingOrder: { findFirst: (args) => this.prisma.imagingOrder.findFirst(args) },
    medicalCertificate: { findFirst: (args) => this.prisma.medicalCertificate.findFirst(args) },
    consentDocument: { findFirst: (args) => this.prisma.consentDocument.findFirst(args) },
  };

  private async nextNumber(key: string, prefix: string, model?: string, field?: string) {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const counter = await this.prisma.counter.upsert({ where: { key }, update: { value: { increment: 1 } }, create: { key, value: 1 } });
      const candidate = `${prefix}-${String(counter.value).padStart(6, '0')}`;
      if (!model || !field) return candidate;
      const delegate = this.numberCheckDelegates[model];
      const existing = delegate ? await delegate.findFirst({ where: { [field]: candidate } }) : null;
      if (!existing) return candidate;
    }
    throw new BadRequestException('No se pudo generar numeración única');
  }

  private attachEvent(data: {
    patientId: string;
    medicalRecordId?: string;
    doctorId?: string;
    type: string;
    title: string;
    summary?: string;
    module?: string;
    entity?: string;
    entityId?: string;
    printableDocumentId?: string;
    createdById?: string;
  }) {
    return this.prisma.clinicalEvent.create({ data });
  }

  private assertPatient(id: string) {
    return this.prisma.patient.findUniqueOrThrow({ where: { id } });
  }

  private assertDoctor(id: string) {
    return this.prisma.user.findUniqueOrThrow({ where: { id } });
  }

  private prescriptionInclude() {
    return { patient: true, doctor: { include: { doctorProfile: true } }, items: { orderBy: { sortOrder: 'asc' as const } }, printableDocument: true, clinicalEvent: true };
  }

  private labOrderInclude() {
    return { patient: true, doctor: { include: { doctorProfile: true } }, items: { orderBy: { sortOrder: 'asc' as const } }, printableDocument: true, clinicalEvent: true };
  }

  private imagingInclude() {
    return { patient: true, doctor: { include: { doctorProfile: true } }, printableDocument: true, clinicalEvent: true };
  }

  private certificateInclude() {
    return { patient: true, doctor: { include: { doctorProfile: true } }, printableDocument: true, clinicalEvent: true };
  }

  private consentInclude() {
    return { patient: true, doctor: { include: { doctorProfile: true } }, printableDocument: true, clinicalEvent: true };
  }

  private async assertCanPrescribe(actor: CurrentUser, ipAddress?: string) {
    if (!['SUPER_ADMIN', 'DOCTOR'].includes(actor.role)) {
      await this.audit.record({ actorId: actor.sub, action: AuditAction.VIEW, entity: 'PrescriptionUnauthorizedAttempt', entityId: actor.sub, ipAddress, after: { role: actor.role, email: actor.email } });
      throw new ForbiddenException('No tiene permiso para emitir recetas médicas.');
    }
  }
}
