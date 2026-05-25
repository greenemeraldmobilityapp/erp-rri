export interface UploadResult {
  fileId: string
  webViewLink: string
  webContentLink: string
}

export interface StoredFile {
  fileId: string
  name: string
  webViewLink: string
  webContentLink?: string
  mimeType?: string
  size?: number
}

export interface IStorageService {
  upload(
    buffer: Buffer,
    filePath: string,
    mimeType: string,
  ): Promise<UploadResult>
  getUrl(fileId: string): Promise<{ webViewLink: string; webContentLink: string }>
  delete(fileId: string): Promise<void>
  list(prefix: string): Promise<StoredFile[]>
}
