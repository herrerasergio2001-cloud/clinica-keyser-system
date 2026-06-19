import { Body, Controller, Delete, Get, Header, Ip, Param, Patch, Post, Query, StreamableFile, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { SafeDeleteDto } from '../../shared/dto/safe-delete.dto';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DigitalPrescriptionsService } from './digital-prescriptions.service';
import {
  CreateDigitalPrescriptionDto,
  DigitalPrescriptionQueryDto,
  UpdateDigitalPrescriptionDto,
} from './dto/digital-prescription.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('digital-prescriptions')
export class DigitalPrescriptionsController {
  constructor(private readonly prescriptions: DigitalPrescriptionsService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'DOCTOR', 'PHARMACY')
  list(@Query() query: DigitalPrescriptionQueryDto) {
    return this.prescriptions.list(query);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'DOCTOR', 'PHARMACY')
  findById(@Param('id') id: string) {
    return this.prescriptions.findById(id);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'DOCTOR')
  create(@Body() dto: CreateDigitalPrescriptionDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.prescriptions.create(dto, user, ipAddress);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateDigitalPrescriptionDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.prescriptions.update(id, dto, user, ipAddress);
  }

  @Patch(':id/void')
  @Roles('SUPER_ADMIN', 'ADMIN')
  void(@Param('id') id: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.prescriptions.void(id, dto, user, ipAddress);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  hardDelete(@Param('id') id: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.prescriptions.hardDelete(id, dto, user, ipAddress);
  }

  @Get(':id/pdf')
  @Roles('SUPER_ADMIN', 'DOCTOR', 'PHARMACY')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'inline; filename="talonario-digital-clinica-keyser.pdf"')
  pdf(@Param('id') id: string, @CurrentUser() user: CurrentUser) {
    return this.prescriptions.pdf(id, user).then((buffer) => new StreamableFile(buffer));
  }
}
