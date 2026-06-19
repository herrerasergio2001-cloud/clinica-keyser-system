import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuditService } from './audit.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  list(
    @Query('search') search?: string,
    @Query('entity') entity?: string,
    @Query('action') action?: AuditAction,
    @Query('page') page?: string,
  ) {
    return this.audit.list({ search, entity, action, page: page ? Number(page) : 1 });
  }
}
