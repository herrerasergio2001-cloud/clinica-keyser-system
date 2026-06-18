import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { StorageModule } from '../../shared/storage/storage.module';
import { AppointmentsController } from './appointments.controller';
import { FilesController } from './files.controller';
import { PatientsController } from './patients.controller';
import { PatientsRepository } from './patients.repository';
import { PatientsService } from './patients.service';

@Module({
  imports: [AuditModule, StorageModule],
  controllers: [PatientsController, AppointmentsController, FilesController],
  providers: [PatientsService, PatientsRepository],
  exports: [PatientsService],
})
export class PatientsModule {}
