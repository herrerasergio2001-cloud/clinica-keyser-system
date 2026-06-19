import { StudyCategory } from '@prisma/client';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateClinicalProcedureDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsDateString()
  performedAt?: string;

  @IsOptional()
  @IsString()
  relatedDiagnosis?: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsOptional()
  @IsString()
  observations?: string;
}

export class UpdateClinicalProcedureDto extends CreateClinicalProcedureDto {}

export class CreateDiagnosticStudyDto {
  @IsEnum(StudyCategory)
  category!: StudyCategory;

  @IsString()
  @IsNotEmpty()
  studyType!: string;

  @IsOptional()
  @IsDateString()
  studyDate?: string;

  @IsOptional()
  @IsString()
  results?: string;

  @IsOptional()
  @IsString()
  observations?: string;
}

export class UpdateDiagnosticStudyDto extends CreateDiagnosticStudyDto {}
