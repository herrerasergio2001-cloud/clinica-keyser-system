import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEmail, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class UpdateDoctorProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsString()
  minsaCode?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  signatureUrl?: string;

  @IsOptional()
  @IsString()
  stampUrl?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateClinicSettingsDto {
  @IsOptional()
  @IsString()
  clinicName?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  printLogoUrl?: string;

  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @IsOptional()
  @IsString()
  accentColor?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phoneMain?: string;

  @IsOptional()
  @IsString()
  phoneAesthetic?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  schedule?: string;
}

export class PrescriptionItemDto {
  @IsString()
  medicationName!: string;

  @IsOptional()
  @IsString()
  concentration?: string;

  @IsOptional()
  @IsString()
  presentation?: string;

  @IsOptional()
  @IsString()
  dose?: string;

  @IsOptional()
  @IsString()
  route?: string;

  @IsOptional()
  @IsString()
  frequency?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsString()
  instructions?: string;
}

export class CreatePrescriptionDto {
  @IsString()
  patientId!: string;

  @IsOptional()
  @IsString()
  medicalRecordId?: string;

  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  recommendationsGeneral?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  items!: PrescriptionItemDto[];
}

export class CreateLabOrderExternalDto {
  @IsString()
  patientId!: string;

  @IsOptional()
  @IsString()
  medicalRecordId?: string;

  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsArray()
  @IsString({ each: true })
  exams!: string[];
}

export class CreateImagingOrderDto {
  @IsString()
  patientId!: string;

  @IsOptional()
  @IsString()
  medicalRecordId?: string;

  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsString()
  studyType!: string;

  @IsOptional()
  @IsString()
  imagingType?: string;

  @IsOptional()
  @IsString()
  clinicalReason?: string;

  @IsOptional()
  @IsString()
  presumptiveDiagnosis?: string;

  @IsOptional()
  @IsString()
  observations?: string;
}

export class CreateCertificateDto {
  @IsString()
  patientId!: string;

  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsOptional()
  @IsString()
  medicalRecordId?: string;

  @IsString()
  documentType!: string;

  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  restDays?: number;
}

export class CreateConsentDto {
  @IsString()
  patientId!: string;

  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsOptional()
  @IsString()
  medicalRecordId?: string;

  @IsString()
  procedureName!: string;

  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  risks?: string;

  @IsOptional()
  @IsString()
  alternatives?: string;

  @IsOptional()
  @IsBoolean()
  patientAgreement?: boolean;
}

export class CreateClinicalEventDto {
  @IsString()
  patientId!: string;

  @IsOptional()
  @IsString()
  medicalRecordId?: string;

  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsString()
  type!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  module?: string;

  @IsOptional()
  @IsString()
  entity?: string;

  @IsOptional()
  @IsString()
  entityId?: string;
}
