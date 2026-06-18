import { Body, Controller, Delete, Get, Ip, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { SafeDeleteDto } from '../../shared/dto/safe-delete.dto';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Roles('SUPER_ADMIN')
  @Permissions('users:read')
  list() {
    return this.users.list();
  }

  @Post()
  @Roles('SUPER_ADMIN')
  @Permissions('*', 'users:create')
  create(@Body() dto: CreateUserDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.users.create(dto, user, ipAddress);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN')
  @Permissions('*', 'users:update')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.users.update(id, dto, user, ipAddress);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @Permissions('*', 'users:delete')
  delete(@Param('id') id: string, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.users.deactivate(id, { reason: 'Desactivado desde acción de eliminación segura' }, user, ipAddress);
  }

  @Patch(':id/disable')
  @Roles('SUPER_ADMIN')
  @Permissions('*', 'users:delete')
  disable(@Param('id') id: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.users.deactivate(id, dto, user, ipAddress);
  }

  @Patch(':id/enable')
  @Roles('SUPER_ADMIN')
  @Permissions('*', 'users:update')
  enable(@Param('id') id: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.users.enable(id, dto, user, ipAddress);
  }
}
