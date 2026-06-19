import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEvolutionNoteDto {
  @IsOptional() @IsDateString() noteDate?: string;
  @IsString() @IsNotEmpty() content!: string;
  @IsOptional() @IsString() doctorName?: string;
}

export class UpdateEvolutionNoteDto extends CreateEvolutionNoteDto {}
