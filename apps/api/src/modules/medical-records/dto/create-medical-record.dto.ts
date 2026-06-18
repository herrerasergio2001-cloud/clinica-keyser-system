import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { MedicalRecordStatus } from '@prisma/client';

export class ClinicalHistoryDto {
  @IsOptional() @IsString() personalPathologicalHistory?: string;
  @IsOptional() @IsString() personalNonPathologicalHistory?: string;
  @IsOptional() @IsString() surgicalHistory?: string;
  @IsOptional() @IsString() traumaticHistory?: string;
  @IsOptional() @IsString() allergicHistory?: string;
  @IsOptional() @IsString() gynecologicalObstetricHistory?: string;
  @IsOptional() @IsString() familyHistory?: string;
  @IsOptional() @IsString() toxicHabits?: string;
  @IsOptional() @IsString() currentMedications?: string;
  @IsOptional() @IsString() reviewOfSystems?: string;
}

export class VitalSignsDto {
  @IsOptional() @IsString() bloodPressure?: string;
  @IsOptional() @IsInt() heartRate?: number;
  @IsOptional() @IsInt() respiratoryRate?: number;
  @IsOptional() @IsNumber() temperature?: number;
  @IsOptional() @IsInt() oxygenSaturation?: number;
  @IsOptional() @IsNumber() weight?: number;
  @IsOptional() @IsNumber() height?: number;
  @IsOptional() @IsNumber() glucose?: number;
}

export class PhysicalExamDto {
  @IsOptional() @IsString() generalAppearance?: string;
  @IsOptional() @IsString() heent?: string;
  @IsOptional() @IsString() headAndNeck?: string;
  @IsOptional() @IsString() cardiovascular?: string;
  @IsOptional() @IsString() respiratory?: string;
  @IsOptional() @IsString() cardiopulmonary?: string;
  @IsOptional() @IsString() abdomen?: string;
  @IsOptional() @IsString() genitourinary?: string;
  @IsOptional() @IsString() musculoskeletal?: string;
  @IsOptional() @IsString() neurological?: string;
  @IsOptional() @IsString() skin?: string;
  @IsOptional() @IsString() extremities?: string;
  @IsOptional() @IsString() otherFindings?: string;
}

export class DiagnosisDto {
  @IsString() mainDiagnosis!: string;
  @IsOptional() @IsString() secondaryDiagnoses?: string;
  @IsOptional() @IsString() icd10Code?: string;
  @IsOptional() @IsString() clinicalImpression?: string;
  @IsOptional() @IsString() differentialDiagnosis?: string;
}

export class PrescriptionDto {
  @IsString() medicationName!: string;
  @IsOptional() @IsString() dose?: string;
  @IsOptional() @IsString() route?: string;
  @IsOptional() @IsString() frequency?: string;
  @IsOptional() @IsString() duration?: string;
  @IsOptional() @IsString() instructions?: string;
  @IsOptional() @IsString() nonPharmacologicalRecommendations?: string;
  @IsOptional() @IsString() requestedLabTests?: string;
  @IsOptional() @IsString() requestedImagingStudies?: string;
  @IsOptional() @IsString() referral?: string;
}

export class CreateMedicalRecordDto {
  @IsString() patientId!: string;
  @IsOptional() @IsString() doctorId?: string;
  @IsOptional() @IsDateString() consultationDate?: string;
  @IsOptional() @IsString() reasonForVisit?: string;
  @IsString() chiefComplaint!: string;
  @IsOptional() @IsString() currentIllness?: string;
  @IsOptional() @IsString() personalPathologicalHistory?: string;
  @IsOptional() @IsString() personalNonPathologicalHistory?: string;
  @IsOptional() @IsString() surgicalHistory?: string;
  @IsOptional() @IsString() traumaticHistory?: string;
  @IsOptional() @IsString() allergicHistory?: string;
  @IsOptional() @IsString() gynecologicalObstetricHistory?: string;
  @IsOptional() @IsString() familyHistory?: string;
  @IsOptional() @IsString() toxicHabits?: string;
  @IsOptional() @IsString() currentMedications?: string;
  @IsOptional() @IsString() reviewOfSystems?: string;
  @IsOptional() @IsString() diagnosisText?: string;
  @IsOptional() @IsString() treatmentPlan?: string;
  @IsOptional() @IsString() recommendations?: string;
  @IsOptional() @IsDateString() nextAppointmentDate?: string;
  @IsOptional() @IsEnum(MedicalRecordStatus) status?: MedicalRecordStatus;

  @IsOptional() @ValidateNested() @Type(() => ClinicalHistoryDto) clinicalHistory?: ClinicalHistoryDto;
  @IsOptional() @ValidateNested() @Type(() => VitalSignsDto) vitalSigns?: VitalSignsDto;
  @IsOptional() @ValidateNested() @Type(() => PhysicalExamDto) physicalExam?: PhysicalExamDto;

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => DiagnosisDto)
  diagnoses?: DiagnosisDto[];

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => PrescriptionDto)
  prescriptions?: PrescriptionDto[];
}
