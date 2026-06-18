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
    return this.prisma.auditLog.create({ data: { ...input, before, after } });
  }
}
