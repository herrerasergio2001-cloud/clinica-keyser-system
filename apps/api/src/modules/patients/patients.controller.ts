import { Body, Controller, Delete, Get, Ip, Param, Patch, Post, Query, Res, StreamableFile, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { SafeDeleteDto } from '../../shared/dto/safe-delete.dto';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePatientDto } from './dto/create-patient.dto';
import {
  CreateClinicalAlertDto,
  CreatePatientAppointmentDto,
  CreatePatientCategoryDto,
  UploadPatientAttachmentDto,
} from './dto/patient-actions.dto';
import { PatientListQueryDto } from './dto/patient-list-query.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientsService } from './patients.service';

@UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patients: PatientsService) {}

  @Get()
  @Permissions('patients:read', 'patients:*')
  list(@Query() query: PatientListQueryDto) {
    return this.patients.list(query);
  }

  @Get('categories')
  @Permissions('patients:read', 'patients:*')
  listCategories() {
    return this.patients.listCategories();
  }

  @Get('duplicates')
  @Permissions('patients:read', 'patients:*')
  findDuplicateCandidates(@Query() query: { idNumber?: string; expediente?: string; fullName?: string; birthDate?: string }) {
    return this.patients.findDuplicateCandidates(query);
  }

  @Post('categories')
  @Permissions('patients:create', 'patients:*')
  createCategory(@Body() dto: CreatePatientCategoryDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.patients.createCategory(dto, user, ipAddress);
  }

  @Get(':id')
  @Permissions('patients:read', 'patients:*')
  findById(@Param('id') id: string) {
    return this.patients.findById(id);
  }

  @Post()
  @Permissions('patients:create', 'patients:*')
  create(@Body() dto: CreatePatientDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.patients.create(dto, user, ipAddress);
  }

  @Patch(':id')
  @Permissions('patients:update', 'patients:*')
  update(@Param('id') id: string, @Body() dto: UpdatePatientDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.patients.update(id, dto, user, ipAddress);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @Permissions('patients:delete', 'patients:*')
  delete(@Param('id') id: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.patients.hardDelete(id, dto, user, ipAddress);
  }

  @Patch(':id/archive')
  @Roles('SUPER_ADMIN')
  @Permissions('patients:delete', 'patients:*')
  archive(@Param('id') id: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.patients.archive(id, dto, user, ipAddress);
  }

  @Patch(':id/restore')
  @Roles('SUPER_ADMIN')
  @Permissions('*', 'patients:update')
  restore(@Param('id') id: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.patients.restore(id, dto, user, ipAddress);
  }

  @Patch(':id/deactivate')
  @Roles('SUPER_ADMIN')
  @Permissions('*', 'patients:delete')
  deactivate(@Param('id') id: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.patients.deactivate(id, dto, user, ipAddress);
  }

  @Patch(':id/activate')
  @Roles('SUPER_ADMIN')
  @Permissions('*', 'patients:update')
  activate(@Param('id') id: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.patients.activate(id, dto, user, ipAddress);
  }

  @Patch('appointments/:appointmentId/cancel')
  @Permissions('patients:update', 'appointments:*')
  cancelAppointment(@Param('appointmentId') appointmentId: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.patients.cancelAppointment(appointmentId, dto, user, ipAddress);
  }

  @Patch(':id/files/:attachmentId/delete')
  @Permissions('patients:update', 'patients:*')
  deleteFile(@Param('attachmentId') attachmentId: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.patients.deleteAttachment(attachmentId, dto, user, ipAddress);
  }

  @Get(':id/alerts')
  @Permissions('patients:read', 'patients:*')
  listAlerts(@Param('id') id: string) {
    return this.patients.listAlerts(id);
  }

  @Post(':id/alerts')
  @Permissions('patients:update', 'patients:*')
  createAlert(@Param('id') id: string, @Body() dto: CreateClinicalAlertDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.patients.createAlert(id, dto, user, ipAddress);
  }

  @Get(':id/files')
  @Permissions('patients:read', 'patients:*')
  listFiles(@Param('id') id: string) {
    return this.patients.listAttachments(id);
  }

  @Get(':id/files/:attachmentId/download')
  @Permissions('patients:read', 'patients:*')
  async downloadFile(@Param('attachmentId') attachmentId: string, @Res({ passthrough: true }) response: Response) {
    const { attachment, stream } = await this.patients.attachmentDownload(attachmentId);
    response.set({
      'Content-Type': attachment.mimeType,
      'Content-Disposition': `attachment; filename="${attachment.fileName}"`,
    });
    return new StreamableFile(stream);
  }

  @Post(':id/files')
  @Permissions('patients:update', 'patients:*')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } }))
  uploadFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadPatientAttachmentDto,
    @CurrentUser() user: CurrentUser,
    @Ip() ipAddress: string,
  ) {
    return this.patients.uploadFile(id, file, dto, user, ipAddress);
  }

  @Get(':id/appointments')
  @Permissions('patients:read', 'patients:*')
  listAppointments(@Param('id') id: string) {
    return this.patients.listAppointments(id);
  }

  @Post(':id/appointments')
  @Permissions('patients:update', 'patients:*')
  createAppointment(@Param('id') id: string, @Body() dto: CreatePatientAppointmentDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.patients.createAppointment(id, dto, user, ipAddress);
  }

}
