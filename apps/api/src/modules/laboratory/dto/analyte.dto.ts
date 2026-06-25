import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAnalyteDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  referenceMin?: number;

  @IsOptional()
  @IsNumber()
  referenceMax?: number;

  @IsOptional()
  @IsNumber()
  criticalLow?: number;

  @IsOptional()
  @IsNumber()
  criticalHigh?: number;

  @IsOptional()
  @IsString()
  sex?: string;

  @IsOptional()
  @IsNumber()
  ageMin?: number;

  @IsOptional()
  @IsNumber()
  ageMax?: number;

  @IsOptional()
  @IsString()
  referenceText?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class UpdateAnalyteDto {
  @IsOptional()
  @IsNumber()
  referenceMin?: number | null;

  @IsOptional()
  @IsNumber()
  referenceMax?: number | null;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  referenceText?: string;
}
