import { IsDateString, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateVaccineRecordDto {
  @IsString()
  vaccineName!: string;

  @IsOptional()
  @IsDateString()
  appliedAt?: string;

  @IsOptional()
  @IsDateString()
  nextDoseAt?: string;

  @IsOptional()
  @IsString()
  lotNumber?: string;

  @IsOptional()
  @IsString()
  observations?: string;
}

export class CreatePregnancyControlDto {
  @IsOptional()
  @IsDateString()
  lastPeriodDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  gestationalAge?: string;

  @IsOptional()
  @IsInt()
  gestations?: number;

  @IsOptional()
  @IsInt()
  births?: number;

  @IsOptional()
  @IsInt()
  abortions?: number;

  @IsOptional()
  @IsInt()
  cesareans?: number;

  @IsOptional()
  @IsString()
  fetalMovements?: string;

  @IsOptional()
  @IsString()
  bloodPressure?: string;

  @IsOptional()
  @IsNumber()
  maternalWeight?: number;

  @IsOptional()
  @IsNumber()
  uterineHeight?: number;

  @IsOptional()
  @IsInt()
  fetalHeartRate?: number;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsString()
  alerts?: string;
}

export class CreateDentalFindingDto {
  @IsString()
  toothNumber!: string;

  @IsString()
  status!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  procedure?: string;

  @IsOptional()
  @IsString()
  observations?: string;
}

export class CreateLabOrderDto {
  @IsString()
  orderType!: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  observations?: string;
}

export class CreateImagingOrderDto {
  @IsString()
  studyType!: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  observations?: string;
}

export class CreateClinicalDocumentDto {
  @IsString()
  documentType!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  content?: string;
}
