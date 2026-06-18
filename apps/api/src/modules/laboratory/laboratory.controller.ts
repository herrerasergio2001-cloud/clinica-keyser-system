import { Body, Controller, Get, Header, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { SafeDeleteDto } from '../../shared/dto/safe-delete.dto';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LaboratoryService } from './laboratory.service';

@UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
@Controller('laboratory')
export class LaboratoryController {
  constructor(private readonly laboratory: LaboratoryService) {}

  @Get('dashboard')
  @Permissions('laboratory:*', 'medical-records:*', 'appointments:*', '*')
  dashboard() {
    return this.laboratory.dashboard();
  }

  @Get('orders')
  @Permissions('laboratory:*', 'medical-records:read', 'appointments:*', '*')
  orders() {
    return this.laboratory.orders();
  }

  @Post('orders')
  @Roles('SUPER_ADMIN', 'DOCTOR', 'LABORATORY')
  @Permissions('laboratory:*', 'medical-records:*', 'appointments:*', '*')
  createOrder(@Body() body: Prisma.LabOrderUncheckedCreateInput, @CurrentUser() user: CurrentUser) {
    return this.laboratory.createOrder(body, user);
  }

  @Patch('orders/:id')
  @Roles('SUPER_ADMIN', 'LABORATORY')
  @Permissions('laboratory:*', '*')
  updateOrder(@Param('id') id: string, @Body() body: Prisma.LabOrderUncheckedUpdateInput) {
    return this.laboratory.updateOrder(id, body);
  }

  @Get('templates')
  @Permissions('laboratory:*', 'medical-records:read', '*')
  templates() {
    return this.laboratory.templates();
  }

  @Post('templates')
  @Roles('SUPER_ADMIN', 'LABORATORY')
  @Permissions('laboratory:*', '*')
  createTemplate(@Body() body: Prisma.LabTemplateUncheckedCreateInput, @CurrentUser() user: CurrentUser) {
    return this.laboratory.createTemplate(body, user);
  }

  @Post('templates/:id/analytes')
  @Roles('SUPER_ADMIN', 'LABORATORY')
  @Permissions('laboratory:*', '*')
  createAnalyte(@Param('id') id: string, @Body() body: Prisma.LabAnalyteUncheckedCreateInput, @CurrentUser() user: CurrentUser) {
    return this.laboratory.upsertAnalyte(id, body, user);
  }

  @Patch('analytes/:id')
  @Roles('SUPER_ADMIN', 'LABORATORY')
  @Permissions('laboratory:*', '*')
  updateAnalyte(@Param('id') id: string, @Body() body: Prisma.LabAnalyteUncheckedUpdateInput, @CurrentUser() user: CurrentUser) {
    return this.laboratory.updateAnalyte(id, body, user);
  }

  @Get('results/:id')
  @Permissions('laboratory:*', 'medical-records:read', '*')
  result(@Param('id') id: string) {
    return this.laboratory.result(id);
  }

  @Post('results')
  @Roles('SUPER_ADMIN', 'LABORATORY')
  @Permissions('laboratory:*', '*')
  createResult(@Body() body: { orderId?: string; patientId: string; templateId: string; medicalRecordId?: string; observations?: string; values: Array<{ analyteId: string; value: string }> }, @CurrentUser() user: CurrentUser) {
    return this.laboratory.createResult(body, user);
  }

  @Get('results/:id/pdf')
  @Permissions('laboratory:*', 'medical-records:read', '*')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'inline; filename="resultado-laboratorio.pdf"')
  pdf(@Param('id') id: string, @CurrentUser() user: CurrentUser) {
    return this.laboratory.pdf(id, user);
  }

  @Patch('results/:id/void')
  @Roles('SUPER_ADMIN', 'LABORATORY')
  @Permissions('laboratory:*', '*')
  voidResult(@Param('id') id: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser) {
    return this.laboratory.voidResult(id, dto, user);
  }

  @Get('reagents')
  @Permissions('laboratory:*', '*')
  reagents() {
    return this.laboratory.reagents();
  }

  @Post('reagents')
  @Roles('SUPER_ADMIN', 'LABORATORY')
  @Permissions('laboratory:*', '*')
  createReagent(@Body() body: Prisma.LabReagentUncheckedCreateInput, @CurrentUser() user: CurrentUser) {
    return this.laboratory.createReagent(body, user);
  }

  @Patch('reagents/:id/disable')
  @Roles('SUPER_ADMIN', 'LABORATORY')
  @Permissions('laboratory:*', '*')
  disableReagent(@Param('id') id: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser) {
    return this.laboratory.disableReagent(id, dto, user);
  }

  @Post('reagents/:id/movements')
  @Roles('SUPER_ADMIN', 'LABORATORY')
  @Permissions('laboratory:*', '*')
  reagentMovement(@Param('id') id: string, @Body() body: { type: string; quantity: number; observation?: string }, @CurrentUser() user: CurrentUser) {
    return this.laboratory.reagentMovement(id, body, user);
  }

  @Get('reagents/expirations')
  @Permissions('laboratory:*', '*')
  expiringReagents(@Query('days') days?: string) {
    return this.laboratory.expiringReagents(days ? Number(days) : 90);
  }
}
