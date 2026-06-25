import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { InventoryMovementType } from '@prisma/client';

export class MovementDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @IsString()
  batchId?: string;

  @IsEnum(InventoryMovementType)
  type!: InventoryMovementType;

  @IsInt()
  @Min(1)
  @Max(999_999)
  quantity!: number;

  @IsOptional()
  @IsString()
  observation?: string;
}
