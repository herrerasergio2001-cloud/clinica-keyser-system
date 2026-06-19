import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export class CreatePatientCategoryDto {
  @IsString()
  name!: string;

  @IsString()
  color!: string;

  @IsString()
  icon!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateClinicalAlertDto {
  @IsString()
  type!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  severity?: string;
}

export class CreatePatientAppointmentDto {
  @IsString()
  doctorId!: string;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsIn(['SCHEDULED', 'CONFIRMED', 'WAITING', 'CANCELLED', 'COMPLETED'])
  status?: string;
}

export class UploadPatientAttachmentDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
