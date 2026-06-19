import { Gender } from '@prisma/client';
import { IsBooleanString, IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PatientListQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  assignedDoctorId?: string;

  @IsOptional()
  @IsString()
  clinicalStatus?: string;

  @IsOptional()
  @IsString()
  status?: 'active' | 'inactive' | 'archived' | 'all';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(130)
  ageMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(130)
  ageMax?: number;

  @IsOptional()
  @IsBooleanString()
  pediatric?: string;

  @IsOptional()
  @IsBooleanString()
  hasAllergies?: string;

  @IsOptional()
  @IsBooleanString()
  hasChronicDiseases?: string;

  @IsOptional()
  @IsDateString()
  lastConsultationFrom?: string;

  @IsOptional()
  @IsDateString()
  lastConsultationTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
