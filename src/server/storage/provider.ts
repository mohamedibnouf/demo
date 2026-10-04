export interface StoredObject {
  bucket: string;
  path: string;
  size: number;
}

export interface StorageProvider {
  name: string;
  bucket: string;
  private: true;
  put(path: string, bytes: Buffer, contentType: string): Promise<StoredObject>;
  get(path: string): Promise<Buffer>;
  exists(path: string): Promise<boolean>;
  signedUrl(path: string, expiresInSeconds?: number): Promise<string>;
}
