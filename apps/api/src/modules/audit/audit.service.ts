import { Injectable } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';

type AuditInput = {
  actorId?: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  ipAddress?: string;
  before?: unknown;
  after?: unknown;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: AuditInput) {
    const before = input.before === undefined ? undefined : (JSON.parse(JSON.stringify(input.before)) as Prisma.InputJsonValue);
    const after = input.after === undefined ? undefined : (JSON.parse(JSON.stringify(input.after)) as Prisma.InputJsonValue);
    const actor = input.actorId
      ? await this.prisma.user.findUnique({ where: { id: input.actorId }, select: { fullName: true, email: true } })
      : null;
    return this.prisma.auditLog.create({
      data: {
        ...input,
        actorName: actor?.fullName,
        actorEmail: actor?.email,
        before,
        after,
      },
    });
  }

  async list(query: { search?: string; entity?: string; action?: AuditAction; page?: number } = {}) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = 30;
    const where: Prisma.AuditLogWhereInput = {
      entity: query.entity || undefined,
      action: query.action || undefined,
      OR: query.search
        ? [
            { actorName: { contains: query.search, mode: 'insensitive' } },
            { actorEmail: { contains: query.search, mode: 'insensitive' } },
            { entity: { contains: query.search, mode: 'insensitive' } },
            { entityId: { contains: query.search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        include: { actor: { select: { id: true, fullName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) || 1 } };
  }
}
