import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { SafeDeleteDto } from '../../shared/dto/safe-delete.dto';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateAnalyteDto, UpdateAnalyteDto } from './dto/analyte.dto';
import { CreateLabOrderDto, UpdateLabOrderDto } from './dto/create-order.dto';
import { CreateReagentDto, ReagentMovementDto } from './dto/create-reagent.dto';
import { CreateResultDto } from './dto/create-result.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
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
  orders(@Query('status') status?: 'active' | 'cancelled' | 'all', @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.laboratory.orders(status ?? 'active', page ? Number(page) : 1, limit ? Number(limit) : 50);
  }

  @Post('orders')
  @Roles('SUPER_ADMIN', 'DOCTOR', 'LABORATORY', 'RECEPTION')
  @Permissions('laboratory:*', 'medical-records:*', 'appointments:*', 'orders:create', '*')
  createOrder(@Body() dto: CreateLabOrderDto, @CurrentUser() user: CurrentUser) {
    return this.laboratory.createOrder(dto, user);
  }

  @Patch('orders/:id')
  @Roles('SUPER_ADMIN', 'LABORATORY')
  @Permissions('laboratory:*', '*')
  updateOrder(@Param('id') id: string, @Body() dto: UpdateLabOrderDto) {
    return this.laboratory.updateOrder(id, dto);
  }

  @Patch('orders/:id/cancel')
  @Roles('SUPER_ADMIN')
  @Permissions('*')
  cancelOrder(@Param('id') id: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser) {
    return this.laboratory.cancelOrder(id, dto, user);
  }

  @Delete('orders/:id')
  @Roles('SUPER_ADMIN')
  @Permissions('*')
  deleteOrder(@Param('id') id: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser) {
    return this.laboratory.deleteOrder(id, dto, user);
  }

  @Get('templates')
  @Permissions('laboratory:*', 'medical-records:read', '*')
  templates() {
    return this.laboratory.templates();
  }

  @Post('templates')
  @Roles('SUPER_ADMIN', 'LABORATORY')
  @Permissions('laboratory:*', '*')
  createTemplate(@Body() dto: CreateTemplateDto, @CurrentUser() user: CurrentUser) {
    return this.laboratory.createTemplate(dto, user);
  }

  @Post('templates/:id/analytes')
  @Roles('SUPER_ADMIN', 'LABORATORY')
  @Permissions('laboratory:*', '*')
  createAnalyte(@Param('id') id: string, @Body() dto: CreateAnalyteDto, @CurrentUser() user: CurrentUser) {
    return this.laboratory.upsertAnalyte(id, dto, user);
  }

  @Patch('analytes/:id')
  @Roles('SUPER_ADMIN', 'LABORATORY')
  @Permissions('laboratory:*', '*')
  updateAnalyte(@Param('id') id: string, @Body() dto: UpdateAnalyteDto, @CurrentUser() user: CurrentUser) {
    return this.laboratory.updateAnalyte(id, dto, user);
  }

  @Get('results/:id')
  @Permissions('laboratory:*', 'medical-records:read', '*')
  result(@Param('id') id: string) {
    return this.laboratory.result(id);
  }

  @Post('results')
  @Roles('SUPER_ADMIN', 'LABORATORY')
  @Permissions('laboratory:*', '*')
  createResult(@Body() dto: CreateResultDto, @CurrentUser() user: CurrentUser) {
    return this.laboratory.createResult(dto, user);
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
  createReagent(@Body() dto: CreateReagentDto, @CurrentUser() user: CurrentUser) {
    return this.laboratory.createReagent(dto, user);
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
  reagentMovement(@Param('id') id: string, @Body() dto: ReagentMovementDto, @CurrentUser() user: CurrentUser) {
    return this.laboratory.reagentMovement(id, dto, user);
  }

  @Get('reagents/expirations')
  @Permissions('laboratory:*', '*')
  expiringReagents(@Query('days') days?: string) {
    return this.laboratory.expiringReagents(days ? Number(days) : 90);
  }
}
