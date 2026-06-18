import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { SafeDeleteDto } from '../../shared/dto/safe-delete.dto';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class LaboratoryService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async dashboard() {
    const [orders, urgent, reagents, recent] = await Promise.all([
      this.prisma.labOrder.count({ where: { status: { not: 'CANCELLED' } } }),
      this.prisma.labOrder.count({ where: { priority: 'URGENT', status: { notIn: ['DELIVERED', 'COMPLETED'] } } }),
      this.prisma.labReagent.findMany({ where: { isDeleted: false }, orderBy: { expiresAt: 'asc' } }),
      this.prisma.labOrder.findMany({ include: { patient: true }, orderBy: { createdAt: 'desc' }, take: 10 }),
    ]);
    const expiringLimit = this.daysFromNow(90);
    return {
      orders,
      urgent,
      reagents: reagents.filter((reagent) => reagent.quantity <= reagent.minimumStock || (reagent.expiresAt !== null && reagent.expiresAt <= expiringLimit)).slice(0, 20),
      recent,
    };
  }

  orders() {
    return this.prisma.labOrder.findMany({ where: { status: { not: 'CANCELLED' } }, include: { patient: true, labResults: { where: { isDeleted: false }, include: { template: true } } }, orderBy: { createdAt: 'desc' } });
  }

  async createOrder(data: Prisma.LabOrderUncheckedCreateInput, actor: CurrentUser) {
    const order = await this.prisma.labOrder.create({ data: { ...data, doctorId: data.doctorId ?? actor.sub, createdById: actor.sub, updatedById: actor.sub }, include: { patient: true } });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.CREATE, entity: 'LabOrder', entityId: order.id, after: order });
    return order;
  }

  updateOrder(id: string, data: Prisma.LabOrderUncheckedUpdateInput) {
    return this.prisma.labOrder.update({ where: { id }, data, include: { patient: true } });
  }

  templates() {
    return this.prisma.labTemplate.findMany({ where: { isDeleted: false }, include: { analytes: { orderBy: { sortOrder: 'asc' } } }, orderBy: { name: 'asc' } });
  }

  createTemplate(data: Prisma.LabTemplateUncheckedCreateInput, actor: CurrentUser) {
    return this.prisma.labTemplate.create({ data }).then(async (template) => {
      await this.audit.record({ actorId: actor.sub, action: AuditAction.CREATE, entity: 'LabTemplate', entityId: template.id, after: template });
      return template;
    });
  }

  upsertAnalyte(templateId: string, data: Prisma.LabAnalyteUncheckedCreateInput, actor: CurrentUser) {
    return this.prisma.labAnalyte.create({ data: { ...data, templateId } }).then(async (analyte) => {
      await this.audit.record({ actorId: actor.sub, action: AuditAction.UPDATE, entity: 'LabAnalyte', entityId: analyte.id, after: analyte });
      return analyte;
    });
  }

  async updateAnalyte(id: string, data: Prisma.LabAnalyteUncheckedUpdateInput, actor: CurrentUser) {
    const before = await this.prisma.labAnalyte.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Analyte not found');
    const analyte = await this.prisma.labAnalyte.update({ where: { id }, data });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.UPDATE, entity: 'LabAnalyte', entityId: id, before, after: analyte });
    return analyte;
  }

  result(id: string) {
    return this.prisma.labResult.findUnique({ where: { id }, include: { patient: true, order: true, template: { include: { analytes: { orderBy: { sortOrder: 'asc' } } } }, values: { include: { analyte: true } } } });
  }

  async createResult(data: { orderId?: string; patientId: string; templateId: string; medicalRecordId?: string; observations?: string; values: Array<{ analyteId: string; value: string }> }, actor: CurrentUser) {
    const template = await this.prisma.labTemplate.findUnique({ where: { id: data.templateId }, include: { analytes: true } });
    if (!template) throw new NotFoundException('Template not found');
    const analytes = new Map(template.analytes.map((item) => [item.id, item]));
    const result = await this.prisma.labResult.create({
      data: {
        orderId: data.orderId,
        patientId: data.patientId,
        templateId: data.templateId,
        medicalRecordId: data.medicalRecordId,
        observations: data.observations,
        createdById: actor.sub,
        values: {
          create: data.values.map((value) => {
            const analyte = analytes.get(value.analyteId);
            const numeric = Number(value.value);
            return { analyteId: value.analyteId, value: value.value, numericValue: Number.isFinite(numeric) ? numeric : undefined, unit: analyte?.unit, reference: this.referenceText(analyte), flag: this.flagValue(Number.isFinite(numeric) ? numeric : undefined, analyte) };
          }),
        },
      },
      include: { patient: true, template: true, values: { include: { analyte: true } } },
    });
    if (data.orderId) await this.prisma.labOrder.update({ where: { id: data.orderId }, data: { status: 'COMPLETED' } });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.CREATE, entity: 'LabResult', entityId: result.id, after: result });
    return result;
  }

  async voidResult(id: string, dto: SafeDeleteDto, actor: CurrentUser) {
    const before = await this.result(id);
    if (!before) throw new NotFoundException('Result not found');
    if (before.status === 'VALIDATED' || before.status === 'DELIVERED') throw new BadRequestException('No se puede anular un resultado validado o entregado');
    const result = await this.prisma.labResult.update({
      where: { id },
      data: { status: 'VOIDED', isDeleted: true, voidedAt: new Date(), voidedBy: actor.sub, voidReason: dto.reason },
      include: { patient: true, order: true, template: true, values: { include: { analyte: true } } },
    });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.LAB_RESULT_VOIDED, entity: 'LabResult', entityId: id, before, after: { result, reason: dto.reason } });
    return result;
  }

  reagents() {
    return this.prisma.labReagent.findMany({ where: { isDeleted: false }, include: { movements: { orderBy: { createdAt: 'desc' }, take: 10 } }, orderBy: { name: 'asc' } });
  }

  async createReagent(data: Prisma.LabReagentUncheckedCreateInput, actor: CurrentUser) {
    const reagent = await this.prisma.labReagent.create({ data });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.CREATE, entity: 'LabReagent', entityId: reagent.id, after: reagent });
    return reagent;
  }

  async disableReagent(id: string, dto: SafeDeleteDto, actor: CurrentUser) {
    const before = await this.prisma.labReagent.findUnique({ where: { id }, include: { movements: true } });
    if (!before) throw new NotFoundException('Reagent not found');
    const reagent = await this.prisma.labReagent.update({ where: { id }, data: { status: 'INACTIVE', isDeleted: true, deletedAt: new Date(), deletedBy: actor.sub, deleteReason: dto.reason }, include: { movements: true } });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.DELETE, entity: 'LabReagent', entityId: id, before, after: { reagent, reason: dto.reason } });
    return reagent;
  }

  async reagentMovement(reagentId: string, data: { type: string; quantity: number; observation?: string }, actor: CurrentUser) {
    const sign = data.type === 'ENTRY' ? 1 : -1;
    const movement = await this.prisma.$transaction(async (tx) => {
      const reagent = await tx.labReagent.findUnique({ where: { id: reagentId } });
      if (!reagent) throw new NotFoundException('Reagent not found');
      const nextQuantity = Number(reagent.quantity) + sign * Number(data.quantity);
      if (nextQuantity < 0) throw new BadRequestException('Cantidad insuficiente de reactivo');
      await tx.labReagent.update({ where: { id: reagentId }, data: { quantity: { increment: sign * data.quantity } } });
      return tx.labReagentMovement.create({ data: { reagentId, type: data.type, quantity: data.quantity, observation: data.observation, createdById: actor.sub } });
    });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.CREATE, entity: 'LabReagentMovement', entityId: movement.id, after: movement });
    return movement;
  }

  expiringReagents(days = 90) {
    return this.prisma.labReagent.findMany({ where: { isDeleted: false, expiresAt: { lte: this.daysFromNow(days) } }, orderBy: { expiresAt: 'asc' } });
  }

  async pdf(id: string, actor: CurrentUser) {
    const result = await this.result(id);
    if (!result || result.isDeleted || result.status === 'VOIDED') throw new NotFoundException('Result not found');
    const doc = new PDFDocument({ size: 'LETTER', margin: 48 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));
    doc.fontSize(18).fillColor('#0f766e').text('Clínica Keyser');
    doc.fontSize(14).fillColor('#0f172a').text('Resultado de laboratorio');
    doc.moveDown().fontSize(10).fillColor('#334155').text(`Paciente: ${result.patient.fullName}`);
    doc.text(`Expediente: ${result.patient.patientCode} | Sexo: ${result.patient.gender}`);
    doc.text(`Examen: ${result.template.name} | Fecha: ${result.createdAt.toLocaleDateString('es-NI')}`);
    doc.moveDown();
    result.values.forEach((value) => doc.text(`${value.analyte.name}: ${value.value} ${value.unit ?? ''} | Ref: ${value.reference ?? '-'} | ${value.flag ?? 'NORMAL'}`));
    if (result.observations) doc.moveDown().text(`Observaciones: ${result.observations}`);
    doc.moveDown(2).text('Firma / sello laboratorio: __________________________');
    doc.end();
    await this.audit.record({ actorId: actor.sub, action: AuditAction.EXPORT, entity: 'LabResult', entityId: id });
    return done;
  }

  private flagValue(value?: number, analyte?: { referenceMin: unknown; referenceMax: unknown; criticalLow: unknown; criticalHigh: unknown } | null) {
    if (value === undefined || !analyte) return undefined;
    if (analyte.criticalLow !== null && value <= Number(analyte.criticalLow)) return 'CRITICAL_LOW';
    if (analyte.criticalHigh !== null && value >= Number(analyte.criticalHigh)) return 'CRITICAL_HIGH';
    if (analyte.referenceMin !== null && value < Number(analyte.referenceMin)) return 'LOW';
    if (analyte.referenceMax !== null && value > Number(analyte.referenceMax)) return 'HIGH';
    return 'NORMAL';
  }

  private referenceText(analyte?: { referenceMin: unknown; referenceMax: unknown; referenceText: string | null } | null) {
    if (!analyte) return undefined;
    if (analyte.referenceText) return analyte.referenceText;
    return [analyte.referenceMin, analyte.referenceMax].every((value) => value !== null) ? `${analyte.referenceMin} - ${analyte.referenceMax}` : undefined;
  }

  private daysFromNow(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
}
