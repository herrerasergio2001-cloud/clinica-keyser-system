import { Module } from '@nestjs/common';
import { StorageModule } from '../../shared/storage/storage.module';
import { AuditModule } from '../audit/audit.module';
import { ClinicalDocumentsController } from './clinical-documents.controller';
import { ClinicalDocumentsService } from './clinical-documents.service';

@Module({
  imports: [AuditModule, StorageModule],
  controllers: [ClinicalDocumentsController],
  providers: [ClinicalDocumentsService],
})
export class ClinicalDocumentsModule {}
