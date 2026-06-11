import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
} from "@aws-sdk/client-s3"
import type { IStorageService, UploadResult, StoredFile } from './types'

function getClient() {
  const endpoint = process.env.R2_DOCUMENTS_ENDPOINT
  const accessKeyId = process.env.R2_DOCUMENTS_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_DOCUMENTS_SECRET_ACCESS_KEY
  const bucket = process.env.R2_DOCUMENTS_BUCKET

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("R2_DOCUMENTS_* environment variables not configured")
  }

  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  })

  return { client, bucket }
}

const PUBLIC_URL_BASE = 'https://files.erp.pt-rri.com'

export const storageService: IStorageService = {
  async upload(buffer: Buffer, filePath: string, mimeType: string): Promise<UploadResult> {
    const { client, bucket } = getClient()
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: filePath,
      Body: buffer,
      ContentType: mimeType,
    }))

    return {
      fileId: filePath,
      webViewLink: `${PUBLIC_URL_BASE}/${filePath}`,
      webContentLink: `${PUBLIC_URL_BASE}/${filePath}`,
    }
  },

  async getUrl(fileId: string) {
    return {
      webViewLink: `${PUBLIC_URL_BASE}/${fileId}`,
      webContentLink: `${PUBLIC_URL_BASE}/${fileId}`,
    }
  },

  async copy(fromPath: string, toPath: string) {
    const { client, bucket } = getClient()
    await client.send(new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${fromPath}`,
      Key: toPath,
    }))

    return {
      fileId: toPath,
      webViewLink: `${PUBLIC_URL_BASE}/${toPath}`,
    }
  },

  async delete(fileId: string): Promise<void> {
    const { client, bucket } = getClient()
    await client.send(new DeleteObjectCommand({
      Bucket: bucket,
      Key: fileId,
    }))
  },

  async list(prefix: string): Promise<StoredFile[]> {
    const { client, bucket } = getClient()
    const result = await client.send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: 200,
    }))

    return (result.Contents ?? [])
      .filter((obj) => obj.Key && !obj.Key.endsWith('/'))
      .map((obj) => ({
        fileId: obj.Key!,
        name: obj.Key!.split('/').pop() ?? obj.Key!,
        webViewLink: `${PUBLIC_URL_BASE}/${obj.Key!}`,
        webContentLink: `${PUBLIC_URL_BASE}/${obj.Key!}`,
        size: obj.Size ?? undefined,
      }))
  },
}
