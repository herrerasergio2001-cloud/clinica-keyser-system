import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class ResultValueDto {
  @IsNotEmpty()
  @IsString()
  analyteId!: string;

  @IsNotEmpty()
  @IsString()
  value!: string;
}

export class CreateResultDto {
  @IsOptional()
  @IsString()
  orderId?: string;

  @IsNotEmpty()
  @IsString()
  patientId!: string;

  @IsNotEmpty()
  @IsString()
  templateId!: string;

  @IsOptional()
  @IsString()
  medicalRecordId?: string;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResultValueDto)
  values!: ResultValueDto[];
}
