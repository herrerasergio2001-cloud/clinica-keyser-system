import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, InventoryMovementType, Prisma } from '@prisma/client';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { SafeDeleteDto } from '../../shared/dto/safe-delete.dto';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateSaleDto } from './dto/create-sale.dto';
import { MovementDto } from './dto/movement.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class PharmacyService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  dashboard() {
    const now = new Date();
    const in90 = new Date(now);
    in90.setDate(now.getDate() + 90);
    return Promise.all([
      this.prisma.product.findMany({ where: { isDeleted: false }, select: { quantity: true, minimumStock: true } }),
      this.prisma.productBatch.findMany({ where: { isDeleted: false, expiresAt: { lte: in90 }, availableQuantity: { gt: 0 } }, include: { product: true }, orderBy: { expiresAt: 'asc' }, take: 20 }),
      this.prisma.inventoryMovement.findMany({ include: { product: true, batch: true }, orderBy: { createdAt: 'desc' }, take: 10 }),
    ]).then(([products, expiring, movements]) => ({ products: products.length, lowStock: products.filter((product) => product.quantity <= product.minimumStock).length, expiring, movements }));
  }

  products(search?: string) {
    return this.prisma.product.findMany({
      where: {
        isDeleted: false,
        status: { not: 'INACTIVE' },
        ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { productCode: { contains: search, mode: 'insensitive' } },
              { barcode: { contains: search, mode: 'insensitive' } },
              { activeIngredient: { contains: search, mode: 'insensitive' } },
              { category: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      },
      include: { batches: { orderBy: { expiresAt: 'asc' } } },
      orderBy: { name: 'asc' },
    });
  }

  product(id: string) {
    return this.prisma.product.findUnique({ where: { id }, include: { batches: { where: { isDeleted: false }, orderBy: { expiresAt: 'asc' } }, movements: { orderBy: { createdAt: 'desc' }, take: 30 } } });
  }

  async createProduct(data: CreateProductDto, actor: CurrentUser) {
    const product = await this.prisma.product.create({ data: data as Prisma.ProductUncheckedCreateInput, include: { batches: true } });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.CREATE, entity: 'Product', entityId: product.id, after: product });
    return product;
  }

  async updateProduct(id: string, data: UpdateProductDto, actor: CurrentUser) {
    const before = await this.product(id);
    if (!before) throw new NotFoundException('Product not found');
    const product = await this.prisma.product.update({ where: { id }, data, include: { batches: true } });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.UPDATE, entity: 'Product', entityId: id, before, after: product });
    return product;
  }

  async deleteProduct(id: string, actor: CurrentUser) {
    return this.disableProduct(id, { reason: 'Desactivado desde acción de eliminación segura' }, actor);
  }

  async disableProduct(id: string, dto: SafeDeleteDto, actor: CurrentUser) {
    const before = await this.product(id);
    if (!before) throw new NotFoundException('Product not found');
    const product = await this.prisma.product.update({ where: { id }, data: { status: 'INACTIVE', isDeleted: true, deletedAt: new Date(), deletedBy: actor.sub, deleteReason: dto.reason }, include: { batches: true } });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.PRODUCT_DISABLED, entity: 'Product', entityId: id, before, after: { product, reason: dto.reason } });
    return product;
  }

  async enableProduct(id: string, dto: SafeDeleteDto, actor: CurrentUser) {
    const before = await this.product(id);
    if (!before) throw new NotFoundException('Product not found');
    const product = await this.prisma.product.update({ where: { id }, data: { status: 'ACTIVE', isDeleted: false, deletedAt: null, deletedBy: null, deleteReason: null }, include: { batches: true } });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.PRODUCT_ENABLED, entity: 'Product', entityId: id, before, after: { product, reason: dto.reason } });
    return product;
  }

  async addBatch(productId: string, data: CreateBatchDto, actor: CurrentUser) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    const before = product.quantity;
    const batch = await this.prisma.$transaction(async (tx) => {
      const created = await tx.productBatch.create({ data: { ...(data as Prisma.ProductBatchUncheckedCreateInput), productId } });
      const updated = await tx.product.update({ where: { id: productId }, data: { quantity: { increment: created.availableQuantity } } });
      await tx.inventoryMovement.create({
        data: {
          productId,
          batchId: created.id,
          type: InventoryMovementType.PURCHASE,
          quantity: created.availableQuantity,
          unitCost: created.costPrice,
          reason: 'Entrada por lote',
          stockBefore: before,
          stockAfter: updated.quantity,
          createdById: actor.sub,
        },
      });
      return created;
    });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.CREATE, entity: 'ProductBatch', entityId: batch.id, after: batch });
    return batch;
  }

  inventory() {
    return this.prisma.productBatch.findMany({ where: { isDeleted: false }, include: { product: true }, orderBy: [{ expiresAt: 'asc' }, { availableQuantity: 'asc' }], take: 500 });
  }

  expirations(days = 90) {
    const now = new Date();
    const until = new Date(now);
    until.setDate(now.getDate() + days);
    return this.prisma.productBatch.findMany({ where: { isDeleted: false, expiresAt: { lte: until }, availableQuantity: { gt: 0 } }, include: { product: true }, orderBy: { expiresAt: 'asc' } });
  }

  kardex(productId?: string) {
    return this.prisma.inventoryMovement.findMany({ where: productId ? { productId } : undefined, include: { product: true, batch: true }, orderBy: { createdAt: 'desc' }, take: 200 });
  }

  async movement(data: MovementDto, actor: CurrentUser) {
    const product = await this.prisma.product.findUnique({ where: { id: data.productId } });
    if (!product) throw new NotFoundException('Product not found');
    const sign = data.type === InventoryMovementType.PURCHASE || data.type === InventoryMovementType.RETURN ? 1 : -1;
    const stockAfter = product.quantity + sign * data.quantity;
    if (stockAfter < 0) throw new BadRequestException('Insufficient stock');
    const movement = await this.prisma.$transaction(async (tx) => {
      if (data.batchId) {
        await tx.productBatch.update({ where: { id: data.batchId }, data: { availableQuantity: { increment: sign * data.quantity } } });
      }
      await tx.product.update({ where: { id: data.productId }, data: { quantity: stockAfter } });
      return tx.inventoryMovement.create({ data: { ...data, stockBefore: product.quantity, stockAfter, createdById: actor.sub } });
    });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.CREATE, entity: 'InventoryMovement', entityId: movement.id, after: movement });
    return movement;
  }

  async sale(data: CreateSaleDto, actor: CurrentUser) {
    if (!data.items?.length) throw new BadRequestException('Cart is empty');
    const products = await this.prisma.product.findMany({ where: { id: { in: data.items.map((item) => item.productId) }, isDeleted: false, status: 'ACTIVE' }, include: { batches: { where: { isDeleted: false, availableQuantity: { gt: 0 }, expiresAt: { gt: new Date() } }, orderBy: { expiresAt: 'asc' } } } });
    const byId = new Map(products.map((product) => [product.id, product]));
    const saleNumber = await this.nextCounter('pharmacy_sale_number', 'FAR');
    const lines = data.items.map((item) => {
      const product = byId.get(item.productId);
      if (!product) throw new BadRequestException('Product not found');
      const batch = product.batches[0];
      if (!batch || batch.availableQuantity < item.quantity) throw new BadRequestException(`Insufficient stock for ${product.name}`);
      const unitPrice = item.quantity >= (product.wholesaleMinQuantity ?? 999999) && product.wholesalePrice ? Number(product.wholesalePrice) : Number(batch.salePrice || product.salePrice);
      const lineDiscount = item.discount ?? 0;
      return { item, product, batch, unitPrice, lineDiscount, total: unitPrice * item.quantity - lineDiscount };
    });
    const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.item.quantity, 0);
    const discount = data.discount ?? 0;
    const total = lines.reduce((sum, line) => sum + line.total, 0) - discount;
    const sale = await this.prisma.$transaction(async (tx) => {
      const created = await tx.pharmacySale.create({
        data: {
          saleNumber,
          patientId: data.patientId,
          subtotal,
          discount,
          total,
          createdById: actor.sub,
          items: { create: lines.map((line) => ({ productId: line.product.id, batchId: line.batch.id, quantity: line.item.quantity, unitPrice: line.unitPrice, discount: line.lineDiscount, total: line.total })) },
        },
        include: { items: { include: { product: true, batch: true } }, patient: true },
      });
      for (const line of lines) {
        const before = line.product.quantity;
        await tx.productBatch.update({ where: { id: line.batch.id }, data: { availableQuantity: { decrement: line.item.quantity } } });
        await tx.product.update({ where: { id: line.product.id }, data: { quantity: { decrement: line.item.quantity } } });
        await tx.inventoryMovement.create({ data: { productId: line.product.id, batchId: line.batch.id, type: InventoryMovementType.SALE, quantity: line.item.quantity, reference: created.saleNumber, stockBefore: before, stockAfter: before - line.item.quantity, createdById: actor.sub } });
      }
      return created;
    });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.CREATE, entity: 'PharmacySale', entityId: sale.id, after: sale });
    return sale;
  }

  async voidSale(id: string, dto: SafeDeleteDto, actor: CurrentUser) {
    const before = await this.prisma.pharmacySale.findUnique({ where: { id }, include: { items: { include: { product: true, batch: true } }, patient: true } });
    if (!before) throw new NotFoundException('Sale not found');
    if (before.status === 'VOIDED') throw new BadRequestException('La venta ya fue anulada');
    const sale = await this.prisma.pharmacySale.update({ where: { id }, data: { status: 'VOIDED', voidedAt: new Date(), voidedBy: actor.sub, voidReason: dto.reason }, include: { items: { include: { product: true, batch: true } }, patient: true } });
    await this.audit.record({ actorId: actor.sub, action: AuditAction.SALE_VOIDED, entity: 'PharmacySale', entityId: id, before, after: { sale, reason: dto.reason } });
    return sale;
  }

  private async nextCounter(key: string, prefix: string) {
    const counter = await this.prisma.counter.upsert({ where: { key }, update: { value: { increment: 1 } }, create: { key, value: 1 } });
    return `${prefix}-${String(counter.value).padStart(6, '0')}`;
  }
}
