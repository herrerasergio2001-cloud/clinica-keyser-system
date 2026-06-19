import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { DigitalPrescriptionsController } from './digital-prescriptions.controller';
import { DigitalPrescriptionsService } from './digital-prescriptions.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [DigitalPrescriptionsController],
  providers: [DigitalPrescriptionsService],
})
export class DigitalPrescriptionsModule {}
