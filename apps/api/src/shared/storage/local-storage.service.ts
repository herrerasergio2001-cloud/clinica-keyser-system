import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { FileStorage, StoredFile } from './file-storage';

@Injectable()
export class LocalStorageService implements FileStorage {
  constructor(private readonly config: ConfigService) {}

  async save(file: Express.Multer.File, folder?: string): Promise<StoredFile> {
    const root = this.config.get<string>('LOCAL_STORAGE_ROOT') ?? './storage';
    const storageKey = folder ? `${folder}/${randomUUID()}-${file.originalname}` : `${randomUUID()}-${file.originalname}`;
    await mkdir(join(root, folder ?? ''), { recursive: true });
    await writeFile(join(root, storageKey), file.buffer);

    return {
      storageKey,
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }
}
