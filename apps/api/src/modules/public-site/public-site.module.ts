import { Module } from '@nestjs/common';
import { StorageModule } from '../../shared/storage/storage.module';
import { AuditModule } from '../audit/audit.module';
import { AdminPublicSiteController, PublicSiteController } from './public-site.controller';
import { PublicSiteService } from './public-site.service';

@Module({
  imports: [AuditModule, StorageModule],
  controllers: [PublicSiteController, AdminPublicSiteController],
  providers: [PublicSiteService],
})
export class PublicSiteModule {}
