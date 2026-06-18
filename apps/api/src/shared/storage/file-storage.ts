export type StoredFile = {
  storageKey: string;
  fileName: string;
  mimeType: string;
  size: number;
};

export interface FileStorage {
  save(file: Express.Multer.File, folder?: string): Promise<StoredFile>;
}
