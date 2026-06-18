import { Body, Controller, Get, Header, Ip, Param, Patch, Post, Query, StreamableFile, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { ForbiddenMessage, Roles } from '../../shared/decorators/roles.decorator';
import { SafeDeleteDto } from '../../shared/dto/safe-delete.dto';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateCertificateDto,
  CreateClinicalEventDto,
  CreateConsentDto,
  CreateImagingOrderDto,
  CreateLabOrderExternalDto,
  CreatePrescriptionDto,
  UpdateClinicSettingsDto,
  UpdateDoctorProfileDto,
} from './dto/clinical-documents.dto';
import { ClinicalDocumentsService } from './clinical-documents.service';

@UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
@Controller()
export class ClinicalDocumentsController {
  constructor(private readonly documents: ClinicalDocumentsService) {}

  @Get('doctors')
  @Permissions('*', 'medical-records:read', 'documents:*')
  doctors() {
    return this.documents.doctors();
  }

  @Get('doctors/:id')
  @Permissions('*', 'medical-records:read', 'documents:*')
  doctor(@Param('id') id: string) {
    return this.documents.doctor(id);
  }

  @Patch('doctors/:id')
  @Permissions('*')
  updateDoctor(@Param('id') id: string, @Body() dto: UpdateDoctorProfileDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.documents.updateDoctor(id, dto, user, ipAddress);
  }

  @Post('doctors/:id/signature')
  @Permissions('*', 'documents:*')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }))
  signature(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.documents.uploadDoctorAsset(id, file, 'signature', user, ipAddress);
  }

  @Post('doctors/:id/stamp')
  @Permissions('*', 'documents:*')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }))
  stamp(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.documents.uploadDoctorAsset(id, file, 'stamp', user, ipAddress);
  }

  @Get('doctors/:id/signature/file')
  @Permissions('*', 'documents:*')
  signatureFile(@Param('id') _id: string, @Query('key') key: string) {
    return new StreamableFile(this.documents.fileStream(key));
  }

  @Get('doctors/:id/stamp/file')
  @Permissions('*', 'documents:*')
  stampFile(@Param('id') _id: string, @Query('key') key: string) {
    return new StreamableFile(this.documents.fileStream(key));
  }

  @Get('clinic-settings')
  @Permissions('*', 'documents:*', 'medical-records:read')
  settings() {
    return this.documents.settings();
  }

  @Patch('clinic-settings')
  @Roles('SUPER_ADMIN')
  @Permissions('*')
  updateSettings(@Body() dto: UpdateClinicSettingsDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.documents.updateSettings(dto, user, ipAddress);
  }

  @Post('clinic-settings/logo')
  @Roles('SUPER_ADMIN')
  @Permissions('*')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }))
  logo(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.documents.uploadLogo(file, user, ipAddress);
  }

  @Get('clinic-settings/logo/file')
  @Permissions('*', 'documents:*', 'medical-records:read')
  logoFile(@Query('key') key: string) {
    return new StreamableFile(this.documents.fileStream(key));
  }

  @Get('document-templates')
  @Permissions('*', 'documents:*', 'medical-records:read')
  templates() {
    return this.documents.listTemplates();
  }

  @Get('printable-documents')
  @Permissions('*', 'documents:*', 'medical-records:read')
  printableDocuments(@Query('patientId') patientId?: string) {
    return this.documents.listPrintableDocuments(patientId);
  }

  @Get('clinical-events')
  @Permissions('*', 'documents:*', 'medical-records:read')
  clinicalEvents(@Query('patientId') patientId?: string) {
    return this.documents.listClinicalEvents(patientId);
  }

  @Post('clinical-events')
  @Permissions('*', 'documents:*', 'medical-records:*')
  createClinicalEvent(@Body() dto: CreateClinicalEventDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.documents.createClinicalEvent(dto, user, ipAddress);
  }

  @Post('prescriptions')
  @ForbiddenMessage('No tiene permiso para emitir recetas médicas.')
  @Roles('SUPER_ADMIN', 'DOCTOR')
  createPrescription(@Body() dto: CreatePrescriptionDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.documents.createPrescription(dto, user, ipAddress);
  }

  @Get('prescriptions/:id')
  @Permissions('*', 'documents:*', 'prescriptions:*', 'medical-records:read')
  prescription(@Param('id') id: string) {
    return this.documents.getPrescription(id);
  }

  @Patch('prescriptions/:id')
  @ForbiddenMessage('No tiene permiso para emitir recetas médicas.')
  @Roles('SUPER_ADMIN', 'DOCTOR')
  updatePrescription(@Param('id') id: string, @Body() dto: Partial<CreatePrescriptionDto>, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.documents.updatePrescription(id, dto, user, ipAddress);
  }

  @Patch('prescriptions/:id/void')
  @ForbiddenMessage('No tiene permiso para emitir recetas médicas.')
  @Roles('SUPER_ADMIN', 'DOCTOR')
  voidPrescription(@Param('id') id: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.documents.voidPrescription(id, dto, user, ipAddress);
  }

  @Get('prescriptions/:id/pdf')
  @Roles('SUPER_ADMIN', 'DOCTOR')
  @Permissions('*', 'documents:*', 'prescriptions:*', 'medical-records:read')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'inline; filename="receta-clinica-keyser.pdf"')
  prescriptionPdf(@Param('id') id: string, @CurrentUser() user: CurrentUser) {
    return this.documents.prescriptionPdf(id, user).then((buffer) => new StreamableFile(buffer));
  }

  @Post('lab-orders-external')
  @Permissions('*', 'documents:*', 'medical-records:*')
  createLabOrder(@Body() dto: CreateLabOrderExternalDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.documents.createLabOrderExternal(dto, user, ipAddress);
  }

  @Get('lab-orders-external/:id')
  @Permissions('*', 'documents:*', 'medical-records:read')
  labOrder(@Param('id') id: string) {
    return this.documents.getLabOrderExternal(id);
  }

  @Get('lab-orders-external/:id/pdf')
  @Permissions('*', 'documents:*', 'medical-records:read')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'inline; filename="orden-laboratorio-clinica-keyser.pdf"')
  labOrderPdf(@Param('id') id: string, @CurrentUser() user: CurrentUser) {
    return this.documents.labOrderPdf(id, user).then((buffer) => new StreamableFile(buffer));
  }

  @Patch('lab-orders-external/:id/void')
  @Permissions('*', 'documents:*', 'medical-records:*')
  voidLabOrder(@Param('id') id: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.documents.voidLabOrderExternal(id, dto, user, ipAddress);
  }

  @Post('imaging-orders')
  @Permissions('*', 'documents:*', 'medical-records:*')
  createImagingOrder(@Body() dto: CreateImagingOrderDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.documents.createImagingOrder(dto, user, ipAddress);
  }

  @Get('imaging-orders/:id')
  @Permissions('*', 'documents:*', 'medical-records:read')
  imagingOrder(@Param('id') id: string) {
    return this.documents.getImagingOrder(id);
  }

  @Get('imaging-orders/:id/pdf')
  @Permissions('*', 'documents:*', 'medical-records:read')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'inline; filename="orden-imagen-clinica-keyser.pdf"')
  imagingPdf(@Param('id') id: string, @CurrentUser() user: CurrentUser) {
    return this.documents.imagingOrderPdf(id, user).then((buffer) => new StreamableFile(buffer));
  }

  @Patch('imaging-orders/:id/void')
  @Permissions('*', 'documents:*', 'medical-records:*')
  voidImagingOrder(@Param('id') id: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.documents.voidImagingOrder(id, dto, user, ipAddress);
  }

  @Post('documents/certificates')
  @Permissions('*', 'documents:*', 'medical-records:*')
  createCertificate(@Body() dto: CreateCertificateDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.documents.createCertificate(dto, user, ipAddress);
  }

  @Patch('documents/certificates/:id/void')
  @Permissions('*', 'documents:*', 'medical-records:*')
  voidCertificate(@Param('id') id: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.documents.voidCertificate(id, dto, user, ipAddress);
  }

  @Post('consents')
  @Permissions('*', 'documents:*', 'medical-records:*')
  createConsent(@Body() dto: CreateConsentDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.documents.createConsent(dto, user, ipAddress);
  }

  @Get('documents/:id/pdf')
  @Permissions('*', 'documents:*', 'medical-records:read')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'inline; filename="documento-clinica-keyser.pdf"')
  documentPdf(@Param('id') id: string, @CurrentUser() user: CurrentUser) {
    return this.documents.documentPdf(id, user).then((buffer) => new StreamableFile(buffer));
  }
}
