import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditAction, Prisma } from '@prisma/client';
import { existsSync } from 'fs';
import { join, normalize } from 'path';
import PDFDocument = require('pdfkit');
import { AuditService } from '../audit/audit.service';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { SafeDeleteDto } from '../../shared/dto/safe-delete.dto';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  CreateDigitalPrescriptionDto,
  DigitalPrescriptionQueryDto,
  UpdateDigitalPrescriptionDto,
} from './dto/digital-prescription.dto';

@Injectable()
export class DigitalPrescriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  async list(query: DigitalPrescriptionQueryDto = {}) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = 20;
    const where: Prisma.DigitalPrescriptionWhereInput = {
      status: query.status && query.status !== 'ALL' ? query.status : query.status === 'ALL' ? undefined : 'ACTIVE',
      createdAt: query.from || query.to
        ? {
            gte: query.from ? new Date(query.from) : undefined,
            lte: query.to ? new Date(`${query.to.slice(0, 10)}T23:59:59.999Z`) : undefined,
          }
        : undefined,
      OR: query.search
        ? [
            { code: { contains: query.search, mode: 'insensitive' } },
            { patientName: { contains: query.search, mode: 'insensitive' } },
            { doctorName: { contains: query.search, mode: 'insensitive' } },
            { diagnosis: { contains: query.search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.digitalPrescription.findMany({
        where,
        include: {
          doctor: { include: { doctorProfile: true } },
          versions: { orderBy: { version: 'desc' }, take: 5 },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.digitalPrescription.count({ where }),
    ]);
    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) || 1 } };
  }

  async findById(id: string) {
    const prescription = await this.prisma.digitalPrescription.findUnique({
      where: { id },
      include: {
        doctor: { include: { doctorProfile: true } },
        versions: {
          include: { editedBy: { select: { id: true, fullName: true, email: true } } },
          orderBy: { version: 'desc' },
        },
      },
    });
    if (!prescription) throw new NotFoundException('Receta de talonario no encontrada');
    return prescription;
  }

  async create(dto: CreateDigitalPrescriptionDto, actor: CurrentUser, ipAddress?: string) {
    const doctor = await this.resolveDoctor(actor);
    this.assertContent(dto);
    const code = await this.nextCode();
    const prescription = await this.prisma.digitalPrescription.create({
      data: {
        code,
        patientName: dto.patientName.trim(),
        patientAge: this.optional(dto.patientAge),
        diagnosis: this.optional(dto.diagnosis),
        indications: this.optional(dto.indications),
        medications: this.cleanItems(dto.medications),
        studies: this.cleanItems(dto.studies),
        doctorId: actor.sub,
        doctorName: doctor.name,
        doctorCode: doctor.code,
        createdById: actor.sub,
      },
    });
    await this.audit.record({
      actorId: actor.sub,
      action: AuditAction.CREATE,
      entity: 'DigitalPrescription',
      entityId: prescription.id,
      ipAddress,
      after: prescription,
    });
    return prescription;
  }

  async update(id: string, dto: UpdateDigitalPrescriptionDto, actor: CurrentUser, ipAddress?: string) {
    this.assertAdmin(actor, 'Solo el administrador puede editar recetas guardadas');
    const before = await this.findById(id);
    if (before.status !== 'ACTIVE') throw new BadRequestException('Una receta anulada no puede modificarse');
    this.assertContent(dto);
    const prescription = await this.prisma.$transaction(async (tx) => {
      await tx.digitalPrescriptionVersion.create({
        data: {
          digitalPrescriptionId: id,
          version: before.version,
          snapshot: this.snapshot(before),
          changeReason: dto.changeReason.trim(),
          editedById: actor.sub,
        },
      });
      return tx.digitalPrescription.update({
        where: { id },
        data: {
          patientName: dto.patientName.trim(),
          patientAge: this.optional(dto.patientAge),
          diagnosis: this.optional(dto.diagnosis),
          indications: this.optional(dto.indications),
          medications: this.cleanItems(dto.medications),
          studies: this.cleanItems(dto.studies),
          version: { increment: 1 },
        },
      });
    });
    await this.audit.record({
      actorId: actor.sub,
      action: AuditAction.UPDATE,
      entity: 'DigitalPrescription',
      entityId: id,
      ipAddress,
      before,
      after: { prescription, changeReason: dto.changeReason },
    });
    return prescription;
  }

  async void(id: string, dto: SafeDeleteDto, actor: CurrentUser, ipAddress?: string) {
    this.assertAdmin(actor, 'Solo el administrador puede anular recetas guardadas');
    const before = await this.findById(id);
    if (before.status === 'VOIDED') throw new BadRequestException('La receta ya está anulada');
    const prescription = await this.prisma.digitalPrescription.update({
      where: { id },
      data: {
        status: 'VOIDED',
        voidedAt: new Date(),
        voidedBy: actor.sub,
        voidReason: dto.reason,
      },
    });
    await this.audit.record({
      actorId: actor.sub,
      action: AuditAction.DIGITAL_PRESCRIPTION_VOIDED,
      entity: 'DigitalPrescription',
      entityId: id,
      ipAddress,
      before,
      after: { prescription, reason: dto.reason },
    });
    return prescription;
  }

  async hardDelete(id: string, dto: SafeDeleteDto, actor: CurrentUser, ipAddress?: string) {
    if (actor.role !== 'SUPER_ADMIN') throw new ForbiddenException('Solo SUPER_ADMIN puede eliminar recetas definitivamente');
    const before = await this.findById(id);
    await this.prisma.digitalPrescription.delete({ where: { id } });
    await this.audit.record({
      actorId: actor.sub,
      action: AuditAction.DELETE,
      entity: 'DigitalPrescription',
      entityId: id,
      ipAddress,
      before,
      after: { permanentlyDeleted: true, reason: dto.reason },
    });
    return { success: true };
  }

  async pdf(id: string, actor: CurrentUser) {
    const prescription = await this.findById(id);
    const settings = await this.prisma.clinicSettings.findFirst({ orderBy: { createdAt: 'asc' } });
    const doc = new PDFDocument({ size: 'LETTER', margin: 48 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));

    const logo = this.assetPath(settings?.printLogoUrl ?? settings?.logoUrl, 'clinica-keyser-logo.jpg');
    if (logo) {
      try {
        doc.image(logo, 48, 38, { width: 58, height: 58, fit: [58, 58] });
      } catch {
        // Un logotipo inválido no debe impedir la generación de la receta.
      }
    }
    doc.fontSize(19).fillColor(settings?.primaryColor ?? '#1f2f66').text(settings?.clinicName ?? 'Clínica Keyser', 118, 42);
    doc.fontSize(9).fillColor('#475569').text(settings?.address ?? '', 118, 68, { width: 390 });
    doc.text(settings?.phoneMain ? `Teléfono: ${settings.phoneMain}` : '', 118, 84);
    doc.moveTo(48, 112).lineTo(564, 112).strokeColor(settings?.secondaryColor ?? '#ef2f32').stroke();
    doc.y = 128;
    doc.fontSize(15).fillColor('#0f172a').text(`Receta · ${prescription.code}`);
    if (prescription.status === 'VOIDED') {
      doc.fontSize(12).fillColor('#b91c1c').text(`ANULADA · ${prescription.voidReason ?? 'Sin motivo registrado'}`);
    }
    doc.moveDown();
    doc.fontSize(11).fillColor('#0f172a').text(`Paciente: ${prescription.patientName}`);
    if (prescription.patientAge) doc.text(`Edad: ${prescription.patientAge}`);
    doc.text(`Fecha y hora: ${prescription.createdAt.toLocaleString('es-NI')}`);
    if (prescription.diagnosis) doc.moveDown().font('Helvetica-Bold').text('Diagnóstico').font('Helvetica').text(prescription.diagnosis);
    const medications = this.jsonItems(prescription.medications);
    if (medications.length) {
      doc.moveDown().font('Helvetica-Bold').text('Medicamentos').font('Helvetica');
      medications.forEach((item, index) => doc.text(`${index + 1}. ${item}`));
    }
    const studies = this.jsonItems(prescription.studies);
    if (studies.length) {
      doc.moveDown().font('Helvetica-Bold').text('Estudios').font('Helvetica');
      studies.forEach((item, index) => doc.text(`${index + 1}. ${item}`));
    }
    if (prescription.indications) doc.moveDown().font('Helvetica-Bold').text('Indicaciones').font('Helvetica').text(prescription.indications);
    doc.moveDown(2);
    const signature = this.assetPath(prescription.doctor.doctorProfile?.signatureUrl);
    if (signature) {
      try {
        doc.image(signature, doc.page.width / 2 - 65, doc.y, { fit: [130, 55], align: 'center' });
        doc.moveDown(4);
      } catch {
        // La firma es opcional y puede omitirse si el archivo está dañado.
      }
    }
    doc.fontSize(10).fillColor('#111827').text('__________________________________', { align: 'center' });
    doc.text(`Dr(a). ${prescription.doctorName}`, { align: 'center' });
    doc.text(`Código profesional: ${prescription.doctorCode}`, { align: 'center' });
    doc.fontSize(8).fillColor('#64748b').text(`Versión ${prescription.version} · Emitida electrónicamente por Clínica Keyser`, { align: 'center' });
    doc.end();

    await this.audit.record({ actorId: actor.sub, action: AuditAction.PRINT, entity: 'DigitalPrescription', entityId: id });
    return done;
  }

  private async resolveDoctor(actor: CurrentUser) {
    if (!['SUPER_ADMIN', 'DOCTOR'].includes(actor.role)) {
      throw new ForbiddenException('Solo un médico autorizado puede emitir recetas');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: actor.sub },
      include: { doctorProfile: true },
    });
    if (!user?.isActive) throw new ForbiddenException('Usuario médico inactivo');
    const name = user.doctorProfile?.fullName?.trim() || actor.name || user.fullName;
    const code = user.doctorProfile?.minsaCode?.trim() || actor.minsaCode?.trim();
    if (!code) throw new BadRequestException('Configure el código profesional del médico antes de emitir recetas');
    return { name, code };
  }

  private async nextCode() {
    const counter = await this.prisma.counter.upsert({
      where: { key: 'digital_prescription_number' },
      update: { value: { increment: 1 } },
      create: { key: 'digital_prescription_number', value: 1 },
    });
    return `TD-${new Date().getFullYear()}-${String(counter.value).padStart(6, '0')}`;
  }

  private assertContent(dto: CreateDigitalPrescriptionDto) {
    if (!dto.medications?.some((item) => item.trim()) && !dto.studies?.some((item) => item.trim())) {
      throw new BadRequestException('Agregue al menos un medicamento o estudio');
    }
  }

  private cleanItems(items: string[]) {
    return items.map((item) => item.trim()).filter(Boolean) as Prisma.InputJsonValue;
  }

  private optional(value?: string) {
    return value?.trim() || null;
  }

  private snapshot(value: unknown) {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private jsonItems(value: Prisma.JsonValue) {
    return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
  }

  private assertAdmin(actor: CurrentUser, message: string) {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(actor.role)) throw new ForbiddenException(message);
  }

  private assetPath(url?: string | null, fallbackName?: string) {
    const root = this.config.get<string>('LOCAL_STORAGE_ROOT') ?? './storage';
    const candidates: string[] = [];
    if (url) {
      try {
        const parsed = new URL(url, 'https://clinicakeyser.local');
        const key = parsed.searchParams.get('key');
        if (key) candidates.push(normalize(join(root, key)));
      } catch {
        // Una URL inválida no debe impedir la generación del PDF.
      }
      const relative = url.startsWith('/') ? url.slice(1) : url;
      candidates.push(join(process.cwd(), relative));
      candidates.push(join(process.cwd(), 'apps/web/public', relative));
    }
    if (fallbackName) {
      candidates.push(join(process.cwd(), 'assets', fallbackName));
      candidates.push(join(process.cwd(), 'apps/api/assets', fallbackName));
      candidates.push(join(process.cwd(), 'apps/web/public', fallbackName));
    }
    return candidates.find((candidate) => existsSync(candidate));
  }
}
