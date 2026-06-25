import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

export class SaleItemDto {
  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  @Max(9_999)
  quantity!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(100)
  discount?: number;
}

export class CreateSaleDto {
  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(100)
  discount?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items!: SaleItemDto[];
}
