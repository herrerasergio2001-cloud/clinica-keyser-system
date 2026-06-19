import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateDigitalPrescriptionDto {
  @IsString()
  @MinLength(3)
  patientName!: string;

  @IsOptional()
  @IsString()
  patientAge?: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  indications?: string;

  @IsArray()
  @IsString({ each: true })
  medications!: string[];

  @IsArray()
  @IsString({ each: true })
  studies!: string[];
}

export class UpdateDigitalPrescriptionDto extends CreateDigitalPrescriptionDto {
  @IsString()
  @MinLength(5)
  changeReason!: string;
}

export class DigitalPrescriptionQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'VOIDED', 'ALL'])
  status?: 'ACTIVE' | 'VOIDED' | 'ALL';

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number;
}
