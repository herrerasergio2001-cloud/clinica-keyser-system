import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateEvolutionNoteDto {
  @IsOptional() @IsDateString() noteDate?: string;
  @IsOptional() @IsString() subjective?: string;
  @IsOptional() @IsString() objective?: string;
  @IsOptional() @IsString() assessment?: string;
  @IsOptional() @IsString() plan?: string;
  @IsOptional() @IsString() doctorName?: string;
}

export class UpdateEvolutionNoteDto extends CreateEvolutionNoteDto {}
