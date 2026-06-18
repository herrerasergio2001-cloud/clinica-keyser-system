import { IsOptional, IsString } from 'class-validator';

export class CreateMedicalAttachmentDto {
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateMedicalAttachmentDto extends CreateMedicalAttachmentDto {}
