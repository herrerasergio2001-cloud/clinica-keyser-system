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
import { SafeDeleteDto } from '../../shared/dto/safe-delete.dto';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateBodyMapFindingDto,
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
import { MedicalRecordsService } from './medical-records.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('medical-records')
export class MedicalRecordsController {
  constructor(private readonly medicalRecords: MedicalRecordsService) {}

  @Get()
  @Permissions('medical-records:read', 'medical-records:*')
  list(@Query('search') search?: string) {
    return this.medicalRecords.list(search);
  }

  @Get('patient/:patientId')
  @Permissions('medical-records:read', 'medical-records:*')
  byPatient(@Param('patientId') patientId: string) {
    return this.medicalRecords.byPatient(patientId);
  }

  @Get(':id')
  @Permissions('medical-records:read', 'medical-records:*')
  findById(@Param('id') id: string, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.open(id, user, ipAddress);
  }

  @Post()
  @Permissions('medical-records:create', 'medical-records:*')
  create(@Body() dto: CreateMedicalRecordDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.create(dto, user, ipAddress);
  }

  @Patch(':id')
  @Permissions('medical-records:update', 'medical-records:*')
  update(@Param('id') id: string, @Body() dto: UpdateMedicalRecordDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.update(id, dto, user, ipAddress);
  }

  @Delete(':id')
  @Permissions('medical-records:delete', 'medical-records:*')
  delete(@Param('id') id: string, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.archive(id, { reason: 'Archivado desde acción de eliminación segura' }, user, ipAddress);
  }

  @Patch(':id/archive')
  @Permissions('medical-records:delete', 'medical-records:*')
  archive(@Param('id') id: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.archive(id, dto, user, ipAddress);
  }

  @Patch(':id/restore')
  @Permissions('*', 'medical-records:update')
  restore(@Param('id') id: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.restore(id, dto, user, ipAddress);
  }

  @Post(':id/attachments')
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
  @Permissions('medical-records:read', 'medical-records:*')
  listAttachments(@Param('id') id: string) {
    return this.medicalRecords.listAttachments(id);
  }

  @Get(':id/attachments/:attachmentId/download')
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
  @Permissions('medical-records:update', 'medical-records:*')
  addEvolutionNote(@Param('id') id: string, @Body() dto: CreateEvolutionNoteDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.addEvolutionNote(id, dto, user, ipAddress);
  }

  @Get(':id/evolution-notes')
  @Permissions('medical-records:read', 'medical-records:*')
  listEvolutionNotes(@Param('id') id: string) {
    return this.medicalRecords.listEvolutionNotes(id);
  }

  @Get(':id/pdf')
  @Permissions('medical-records:read', 'medical-records:*')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'inline; filename="expediente-clinico.pdf"')
  async recordPdf(@Param('id') id: string, @CurrentUser() user: CurrentUser) {
    return this.medicalRecords.recordPdf(id, user);
  }

  @Get(':id/prescription.pdf')
  @Permissions('medical-records:read', 'medical-records:*')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'inline; filename="receta-medica.pdf"')
  async prescriptionPdf(@Param('id') id: string, @CurrentUser() user: CurrentUser) {
    return this.medicalRecords.prescriptionPdf(id, user);
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

  @Get(':id/body-map')
  @Permissions('medical-records:read', 'medical-records:*')
  listBodyMap(@Param('id') id: string) {
    return this.medicalRecords.listBodyMap(id);
  }

  @Post(':id/body-map')
  @Permissions('medical-records:update', 'medical-records:*')
  createBodyMap(@Param('id') id: string, @Body() dto: CreateBodyMapFindingDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.createBodyMap(id, dto, user, ipAddress);
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
    return this.medicalRecords.evolutionPdf(noteId, user);
  }

  @Get('evolution-notes/:noteId')
  @Permissions('medical-records:read', 'medical-records:*')
  findEvolutionNote(@Param('noteId') noteId: string) {
    return this.medicalRecords.findEvolutionNote(noteId);
  }

  @Patch('evolution-notes/:noteId')
  @Permissions('medical-records:update', 'medical-records:*')
  updateEvolutionNote(@Param('noteId') noteId: string, @Body() dto: UpdateEvolutionNoteDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.updateEvolutionNote(noteId, dto, user, ipAddress);
  }

  @Delete('evolution-notes/:noteId')
  @Permissions('medical-records:delete', 'medical-records:*')
  deleteEvolutionNote(@Param('noteId') noteId: string, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.deleteEvolutionNote(noteId, { reason: 'Archivado desde acción de eliminación segura' }, user, ipAddress);
  }

  @Patch('evolution-notes/:noteId/archive')
  @Permissions('medical-records:delete', 'medical-records:*')
  archiveEvolutionNote(@Param('noteId') noteId: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.deleteEvolutionNote(noteId, dto, user, ipAddress);
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
  @Permissions('medical-records:delete', 'medical-records:*')
  deleteAttachment(@Param('attachmentId') attachmentId: string, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.deleteAttachment(attachmentId, { reason: 'Eliminado desde acción de eliminación segura' }, user, ipAddress);
  }

  @Patch('attachments/:attachmentId/delete')
  @Permissions('medical-records:delete', 'medical-records:*')
  softDeleteAttachment(@Param('attachmentId') attachmentId: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.medicalRecords.deleteAttachment(attachmentId, dto, user, ipAddress);
  }
}
