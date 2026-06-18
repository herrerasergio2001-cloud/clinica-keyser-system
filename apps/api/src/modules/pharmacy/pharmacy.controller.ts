import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { InventoryMovementType, Prisma } from '@prisma/client';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { SafeDeleteDto } from '../../shared/dto/safe-delete.dto';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PharmacyService } from './pharmacy.service';

@UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
@Controller()
export class PharmacyController {
  constructor(private readonly pharmacy: PharmacyService) {}

  @Get('pharmacy/dashboard')
  @Permissions('pharmacy:*', 'inventory:*', '*')
  dashboard() {
    return this.pharmacy.dashboard();
  }

  @Get('pharmacy/products')
  @Permissions('pharmacy:*', 'inventory:*', 'patients:read', '*')
  products(@Query('search') search?: string) {
    return this.pharmacy.products(search);
  }

  @Get('pharmacy/products/:id')
  @Permissions('pharmacy:*', 'inventory:*', '*')
  product(@Param('id') id: string) {
    return this.pharmacy.product(id);
  }

  @Post('pharmacy/products')
  @Roles('SUPER_ADMIN', 'PHARMACY')
  @Permissions('pharmacy:*', 'inventory:*', '*')
  createProduct(@Body() body: Prisma.ProductUncheckedCreateInput, @CurrentUser() user: CurrentUser) {
    return this.pharmacy.createProduct(body, user);
  }

  @Patch('pharmacy/products/:id')
  @Roles('SUPER_ADMIN', 'PHARMACY')
  @Permissions('pharmacy:*', 'inventory:*', '*')
  updateProduct(@Param('id') id: string, @Body() body: Prisma.ProductUncheckedUpdateInput, @CurrentUser() user: CurrentUser) {
    return this.pharmacy.updateProduct(id, body, user);
  }

  @Delete('pharmacy/products/:id')
  @Roles('SUPER_ADMIN', 'PHARMACY')
  @Permissions('pharmacy:*', 'inventory:*', '*')
  deleteProduct(@Param('id') id: string, @CurrentUser() user: CurrentUser) {
    return this.pharmacy.disableProduct(id, { reason: 'Desactivado desde acción de eliminación segura' }, user);
  }

  @Patch('pharmacy/products/:id/disable')
  @Roles('SUPER_ADMIN', 'PHARMACY')
  @Permissions('pharmacy:*', 'inventory:*', '*')
  disableProduct(@Param('id') id: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser) {
    return this.pharmacy.disableProduct(id, dto, user);
  }

  @Patch('pharmacy/products/:id/enable')
  @Roles('SUPER_ADMIN', 'PHARMACY')
  @Permissions('pharmacy:*', 'inventory:*', '*')
  enableProduct(@Param('id') id: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser) {
    return this.pharmacy.enableProduct(id, dto, user);
  }

  @Post('pharmacy/products/:id/batches')
  @Roles('SUPER_ADMIN', 'PHARMACY')
  @Permissions('pharmacy:*', 'inventory:*', '*')
  addBatch(@Param('id') id: string, @Body() body: Prisma.ProductBatchUncheckedCreateInput, @CurrentUser() user: CurrentUser) {
    return this.pharmacy.addBatch(id, body, user);
  }

  @Get('inventory/batches')
  @Permissions('pharmacy:*', 'inventory:*', '*')
  inventory() {
    return this.pharmacy.inventory();
  }

  @Get('inventory/expirations')
  @Permissions('pharmacy:*', 'inventory:*', '*')
  expirations(@Query('days') days?: string) {
    return this.pharmacy.expirations(days ? Number(days) : 90);
  }

  @Get('inventory/movements')
  @Permissions('pharmacy:*', 'inventory:*', '*')
  kardex(@Query('productId') productId?: string) {
    return this.pharmacy.kardex(productId);
  }

  @Post('inventory/movements')
  @Roles('SUPER_ADMIN', 'PHARMACY')
  @Permissions('pharmacy:*', 'inventory:*', '*')
  movement(@Body() body: { productId: string; batchId?: string; type: InventoryMovementType; quantity: number; observation?: string }, @CurrentUser() user: CurrentUser) {
    return this.pharmacy.movement(body, user);
  }

  @Post('pharmacy/sales')
  @Roles('SUPER_ADMIN', 'PHARMACY')
  @Permissions('pharmacy:*', '*')
  sale(@Body() body: { patientId?: string; discount?: number; items: Array<{ productId: string; quantity: number; discount?: number }> }, @CurrentUser() user: CurrentUser) {
    return this.pharmacy.sale(body, user);
  }

  @Patch('pharmacy/sales/:id/void')
  @Roles('SUPER_ADMIN', 'PHARMACY')
  @Permissions('pharmacy:*', '*')
  voidSale(@Param('id') id: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser) {
    return this.pharmacy.voidSale(id, dto, user);
  }
}
