import { Module } from '@nestjs/common';
import { LocalStorageService } from './local-storage.service';

@Module({
  providers: [{ provide: 'FileStorage', useClass: LocalStorageService }],
  exports: ['FileStorage'],
})
export class StorageModule {}
