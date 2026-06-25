import { IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateBatchDto {
  @IsNotEmpty()
  @IsString()
  batchNumber!: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsInt()
  @Min(0)
  @Max(999_999)
  initialQuantity!: number;

  @IsInt()
  @Min(0)
  @Max(999_999)
  availableQuantity!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(9_999_999)
  costPrice?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(9_999_999)
  salePrice?: number;

  @IsOptional()
  @IsString()
  supplier?: string;

  @IsOptional()
  @IsString()
  observations?: string;
}
