import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Ip,
  Param,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
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
import {
  CreateClinicalDocumentDto,
  CreateDentalFindingDto,
  CreateImagingOrderDto,
  CreateLabOrderDto,
  CreatePregnancyControlDto,
  CreateVaccineRecordDto,
} from './dto/clinical-resource.dto';
import { CreateEvolutionNoteDto, UpdateEvolutionNoteDto } from './dto/create-evolution-note.dto';
import { CreateMedicalAttachmentDto, UpdateMedicalAttachmentDto } from './dto/create-medical-attachment.dto';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import {
  CreateClinicalProcedureDto,
  CreateDiagnosticStudyDto,
  UpdateClinicalProcedureDto,
  UpdateDiagnosticStudyDto,
} from './dto/simplified-clinical-record.dto';
import { MedicalRecordsService } from './medical-records.service';

@UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
@Controller('medical-records')
export class MedicalRecordsController {
  constructor(private readonly medicalRecords: MedicalRecordsService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'DOCTOR', 'RECEPTION', 'LABORATORY')
  @Permissions('medical-records:read', 'medical-records:*')
  list(@Query('search') search?: string) {
    return this.medicalRecords.list(search);
  }

  @Get('patient/:patientId')
  @Roles('SUPER_ADMIN', 'DOCTOR', 'RECEPTION', 'LABORATORY')
  @Permissions('medical-records:read', 'medical-records:*')
  byPatient(@Param('patientId') patientId: string) {
    return this.medicalRecords.byPatient(patientId);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'DOCTOR', 'RECEPTION', 'LABORATORY')
  @Permissions('medical-records:read', 'medical-records:*')
  findById(@Param('id') id: string, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.open(id, user, ipAddress);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'DOCTOR')
  @Permissions('medical-records:create', 'medical-records:*')
  create(@Body() dto: CreateMedicalRecordDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.create(dto, user, ipAddress);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('medical-records:update', 'medical-records:*')
  update(@Param('id') id: string, @Body() dto: UpdateMedicalRecordDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.update(id, dto, user, ipAddress);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('medical-records:delete', 'medical-records:*')
  delete(@Param('id') id: string, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.archive(id, { reason: 'Archivado desde acción de eliminación segura' }, user, ipAddress);
  }

  @Patch(':id/archive')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('medical-records:delete', 'medical-records:*')
  archive(@Param('id') id: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.archive(id, dto, user, ipAddress);
  }

  @Patch(':id/restore')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('*', 'medical-records:update')
  restore(@Param('id') id: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.restore(id, dto, user, ipAddress);
  }

  @Post(':id/attachments')
  @Roles('SUPER_ADMIN', 'DOCTOR')
  @Permissions('medical-records:update', 'medical-records:*')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 30 * 1024 * 1024 } }))
  addAttachment(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateMedicalAttachmentDto,
    @CurrentUser() user: CurrentUser,
    @Ip() ipAddress: string,
  ) {
    return this.medicalRecords.addAttachment(id, file, dto, user, ipAddress);
  }

  @Get(':id/attachments')
  @Roles('SUPER_ADMIN', 'DOCTOR', 'RECEPTION', 'LABORATORY')
  @Permissions('medical-records:read', 'medical-records:*')
  listAttachments(@Param('id') id: string) {
    return this.medicalRecords.listAttachments(id);
  }

  @Get(':id/attachments/:attachmentId/download')
  @Roles('SUPER_ADMIN', 'DOCTOR', 'RECEPTION', 'LABORATORY')
  @Permissions('medical-records:read', 'medical-records:*')
  async downloadAttachment(@Param('attachmentId') attachmentId: string, @Res({ passthrough: true }) response: Response) {
    const { attachment, stream } = await this.medicalRecords.attachmentDownload(attachmentId);
    response.set({
      'Content-Type': attachment.mimeType,
      'Content-Disposition': `attachment; filename="${attachment.fileName}"`,
    });
    return new StreamableFile(stream);
  }

  @Post(':id/evolution-notes')
  @Roles('SUPER_ADMIN', 'DOCTOR')
  @Permissions('medical-records:update', 'medical-records:*')
  addEvolutionNote(@Param('id') id: string, @Body() dto: CreateEvolutionNoteDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.addEvolutionNote(id, dto, user, ipAddress);
  }

  @Get(':id/evolution-notes')
  @Roles('SUPER_ADMIN', 'DOCTOR', 'RECEPTION', 'LABORATORY')
  @Permissions('medical-records:read', 'medical-records:*')
  listEvolutionNotes(@Param('id') id: string, @Query('includeArchived') includeArchived: string | undefined, @CurrentUser() user: CurrentUser) {
    return this.medicalRecords.listAllEvolutionNotes(id, includeArchived === 'true' && user.role === 'SUPER_ADMIN');
  }

  @Get(':id/pdf')
  @Permissions('medical-records:read', 'medical-records:*')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'inline; filename="expediente-clinico.pdf"')
  async recordPdf(@Param('id') id: string, @CurrentUser() user: CurrentUser) {
    return new StreamableFile(await this.medicalRecords.recordPdf(id, user));
  }

  @Get(':id/prescription.pdf')
  @Permissions('medical-records:read', 'medical-records:*')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'inline; filename="receta-medica.pdf"')
  async prescriptionPdf(@Param('id') id: string, @CurrentUser() user: CurrentUser) {
    return new StreamableFile(await this.medicalRecords.prescriptionPdf(id, user));
  }

  @Get(':id/vaccines')
  @Permissions('medical-records:read', 'medical-records:*')
  listVaccines(@Param('id') id: string) {
    return this.medicalRecords.listVaccines(id);
  }

  @Post(':id/vaccines')
  @Permissions('medical-records:update', 'medical-records:*')
  createVaccine(@Param('id') id: string, @Body() dto: CreateVaccineRecordDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.createVaccine(id, dto, user, ipAddress);
  }

  @Get(':id/pregnancy-control')
  @Permissions('medical-records:read', 'medical-records:*')
  listPregnancyControls(@Param('id') id: string) {
    return this.medicalRecords.listPregnancyControls(id);
  }

  @Post(':id/pregnancy-control')
  @Permissions('medical-records:update', 'medical-records:*')
  createPregnancyControl(@Param('id') id: string, @Body() dto: CreatePregnancyControlDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.createPregnancyControl(id, dto, user, ipAddress);
  }

  @Get(':id/dental-chart')
  @Permissions('medical-records:read', 'medical-records:*')
  listDentalChart(@Param('id') id: string) {
    return this.medicalRecords.listDentalChart(id);
  }

  @Post(':id/dental-chart')
  @Permissions('medical-records:update', 'medical-records:*')
  createDentalFinding(@Param('id') id: string, @Body() dto: CreateDentalFindingDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.createDentalFinding(id, dto, user, ipAddress);
  }

  @Get(':id/lab-orders')
  @Permissions('medical-records:read', 'medical-records:*')
  listLabOrders(@Param('id') id: string) {
    return this.medicalRecords.listLabOrders(id);
  }

  @Post(':id/lab-orders')
  @Permissions('medical-records:update', 'medical-records:*')
  createLabOrder(@Param('id') id: string, @Body() dto: CreateLabOrderDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.createLabOrder(id, dto, user, ipAddress);
  }

  @Get(':id/imaging-orders')
  @Permissions('medical-records:read', 'medical-records:*')
  listImagingOrders(@Param('id') id: string) {
    return this.medicalRecords.listImagingOrders(id);
  }

  @Post(':id/imaging-orders')
  @Permissions('medical-records:update', 'medical-records:*')
  createImagingOrder(@Param('id') id: string, @Body() dto: CreateImagingOrderDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.createImagingOrder(id, dto, user, ipAddress);
  }

  @Get(':id/documents')
  @Permissions('medical-records:read', 'medical-records:*')
  listClinicalDocuments(@Param('id') id: string) {
    return this.medicalRecords.listClinicalDocuments(id);
  }

  @Post(':id/documents')
  @Permissions('medical-records:update', 'medical-records:*')
  createClinicalDocument(@Param('id') id: string, @Body() dto: CreateClinicalDocumentDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.createClinicalDocument(id, dto, user, ipAddress);
  }

  @Get('evolution-notes/:noteId/pdf')
  @Permissions('medical-records:read', 'medical-records:*')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'inline; filename="nota-evolucion.pdf"')
  async evolutionPdf(@Param('noteId') noteId: string, @CurrentUser() user: CurrentUser) {
    return new StreamableFile(await this.medicalRecords.evolutionPdf(noteId, user));
  }

  @Get('evolution-notes/:noteId')
  @Permissions('medical-records:read', 'medical-records:*')
  findEvolutionNote(@Param('noteId') noteId: string) {
    return this.medicalRecords.findEvolutionNote(noteId);
  }

  @Patch('evolution-notes/:noteId')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('medical-records:update', 'medical-records:*')
  updateEvolutionNote(@Param('noteId') noteId: string, @Body() dto: UpdateEvolutionNoteDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.updateEvolutionNote(noteId, dto, user, ipAddress);
  }

  @Delete('evolution-notes/:noteId')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('medical-records:delete', 'medical-records:*')
  deleteEvolutionNote(@Param('noteId') noteId: string, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.deleteEvolutionNote(noteId, { reason: 'Archivado desde acción de eliminación segura' }, user, ipAddress);
  }

  @Patch('evolution-notes/:noteId/archive')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('medical-records:delete', 'medical-records:*')
  archiveEvolutionNote(@Param('noteId') noteId: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.deleteEvolutionNote(noteId, dto, user, ipAddress);
  }

  @Patch('evolution-notes/:noteId/restore')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('*')
  restoreEvolutionNote(@Param('noteId') noteId: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.restoreEvolutionNote(noteId, dto, user, ipAddress);
  }

  @Get(':id/procedures')
  @Roles('SUPER_ADMIN', 'DOCTOR', 'RECEPTION', 'LABORATORY')
  listProcedures(@Param('id') id: string, @Query('includeArchived') includeArchived: string | undefined, @CurrentUser() user: CurrentUser) {
    return this.medicalRecords.listProcedures(id, includeArchived === 'true' && user.role === 'SUPER_ADMIN');
  }

  @Post(':id/procedures')
  @Roles('SUPER_ADMIN', 'DOCTOR')
  createProcedure(@Param('id') id: string, @Body() dto: CreateClinicalProcedureDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.createProcedure(id, dto, user, ipAddress);
  }

  @Patch('procedures/:procedureId')
  @Roles('SUPER_ADMIN', 'ADMIN')
  updateProcedure(@Param('procedureId') procedureId: string, @Body() dto: UpdateClinicalProcedureDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.updateProcedure(procedureId, dto, user, ipAddress);
  }

  @Patch('procedures/:procedureId/archive')
  @Roles('SUPER_ADMIN', 'ADMIN')
  archiveProcedure(@Param('procedureId') procedureId: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.archiveProcedure(procedureId, dto, user, ipAddress);
  }

  @Patch('procedures/:procedureId/restore')
  @Roles('SUPER_ADMIN', 'ADMIN')
  restoreProcedure(@Param('procedureId') procedureId: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.restoreProcedure(procedureId, dto, user, ipAddress);
  }

  @Post('procedures/:procedureId/attachments')
  @Roles('SUPER_ADMIN', 'DOCTOR')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 30 * 1024 * 1024 } }))
  addProcedureAttachment(
    @Param('procedureId') procedureId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: CurrentUser,
    @Ip() ipAddress: string,
  ) {
    return this.medicalRecords.addProcedureAttachment(procedureId, file, user, ipAddress);
  }

  @Get('procedures/:procedureId/pdf')
  @Roles('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTION', 'LABORATORY')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'inline; filename="procedimiento-clinica-keyser.pdf"')
  async procedurePdf(@Param('procedureId') procedureId: string, @CurrentUser() user: CurrentUser) {
    return new StreamableFile(await this.medicalRecords.procedurePdf(procedureId, user));
  }

  @Get(':id/studies')
  @Roles('SUPER_ADMIN', 'DOCTOR', 'RECEPTION', 'LABORATORY')
  listStudies(@Param('id') id: string, @Query('includeArchived') includeArchived: string | undefined, @CurrentUser() user: CurrentUser) {
    return this.medicalRecords.listStudies(id, includeArchived === 'true' && user.role === 'SUPER_ADMIN');
  }

  @Post(':id/studies')
  @Roles('SUPER_ADMIN', 'DOCTOR', 'LABORATORY')
  createStudy(@Param('id') id: string, @Body() dto: CreateDiagnosticStudyDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.createStudy(id, dto, user, ipAddress);
  }

  @Patch('studies/:studyId')
  @Roles('SUPER_ADMIN', 'LABORATORY')
  updateStudy(@Param('studyId') studyId: string, @Body() dto: UpdateDiagnosticStudyDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.updateStudy(studyId, dto, user, ipAddress);
  }

  @Patch('studies/:studyId/archive')
  @Roles('SUPER_ADMIN', 'ADMIN')
  archiveStudy(@Param('studyId') studyId: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.archiveStudy(studyId, dto, user, ipAddress);
  }

  @Patch('studies/:studyId/restore')
  @Roles('SUPER_ADMIN', 'ADMIN')
  restoreStudy(@Param('studyId') studyId: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.restoreStudy(studyId, dto, user, ipAddress);
  }

  @Post('studies/:studyId/attachments')
  @Roles('SUPER_ADMIN', 'DOCTOR', 'LABORATORY')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 30 * 1024 * 1024 } }))
  addStudyAttachment(
    @Param('studyId') studyId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: CurrentUser,
    @Ip() ipAddress: string,
  ) {
    return this.medicalRecords.addStudyAttachment(studyId, file, user, ipAddress);
  }

  @Get('clinical-attachments/:attachmentId/download')
  @Roles('SUPER_ADMIN', 'DOCTOR', 'RECEPTION', 'LABORATORY')
  async downloadClinicalEntryAttachment(@Param('attachmentId') attachmentId: string, @Res({ passthrough: true }) response: Response) {
    const { attachment, stream } = await this.medicalRecords.clinicalEntryAttachmentDownload(attachmentId);
    response.set({
      'Content-Type': attachment.mimeType,
      'Content-Disposition': `inline; filename="${attachment.fileName}"`,
    });
    return new StreamableFile(stream);
  }

  @Get('attachments/:attachmentId')
  @Permissions('medical-records:read', 'medical-records:*', 'attachments:read')
  findAttachment(@Param('attachmentId') attachmentId: string) {
    return this.medicalRecords.findAttachment(attachmentId);
  }

  @Patch('attachments/:attachmentId')
  @Permissions('medical-records:update', 'medical-records:*')
  updateAttachment(@Param('attachmentId') attachmentId: string, @Body() dto: UpdateMedicalAttachmentDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.updateAttachment(attachmentId, dto, user, ipAddress);
  }

  @Delete('attachments/:attachmentId')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('medical-records:delete', 'medical-records:*')
  deleteAttachment(@Param('attachmentId') attachmentId: string, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.deleteAttachment(attachmentId, { reason: 'Eliminado desde acción de eliminación segura' }, user, ipAddress);
  }

  @Patch('attachments/:attachmentId/delete')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('medical-records:delete', 'medical-records:*')
  softDeleteAttachment(@Param('attachmentId') attachmentId: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.deleteAttachment(attachmentId, dto, user, ipAddress);
  }
}
