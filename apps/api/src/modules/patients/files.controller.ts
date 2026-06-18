import { Body, Controller, Ip, Param, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { SafeDeleteDto } from '../../shared/dto/safe-delete.dto';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PatientsService } from './patients.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly patients: PatientsService) {}

  @Patch(':id/delete')
  @Permissions('patients:update', 'medical-records:update', '*')
  delete(@Param('id') id: string, @Body() dto: SafeDeleteDto, @CurrentUser() user: CurrentUser, @Ip() ipAddress: string) {
    return this.patients.deleteAttachment(id, dto, user, ipAddress);
  }
}
