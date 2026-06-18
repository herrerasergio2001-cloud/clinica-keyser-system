import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SafeDeleteDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  reason!: string;
}
