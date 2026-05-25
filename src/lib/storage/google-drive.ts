import { google, type drive_v3 } from 'googleapis'
import type { IStorageService, UploadResult } from './types'

function getAuth() {
  const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL
  const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY

  if (!clientEmail || !privateKey) {
    throw new Error('Google Drive credentials not configured. Set GOOGLE_DRIVE_CLIENT_EMAIL and GOOGLE_DRIVE_PRIVATE_KEY in .env')
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/drive'],
  })

  return auth
}

function getDriveClient(): drive_v3.Drive {
  const auth = getAuth()
  return google.drive({ version: 'v3', auth })
}

function getSharedDriveId(): string {
  const id = process.env.GOOGLE_DRIVE_SHARED_DRIVE_ID
  if (!id) {
    throw new Error('GOOGLE_DRIVE_SHARED_DRIVE_ID not configured in .env')
  }
  return id
}

async function ensureFolderPath(drive: drive_v3.Drive, pathParts: string[]): Promise<string> {
  const sharedDriveId = getSharedDriveId()
  let parentId: string | undefined = sharedDriveId

  for (const part of pathParts) {
    if (!part) continue

    const res = await drive.files.list({
      q: `name = '${part.replace(/'/g, "\\'")}' and '${parentId}' in parents and trashed = false`,
      corpora: 'drive',
      driveId: sharedDriveId,
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
      pageSize: 1,
      fields: 'files(id, name)',
    })
    const data = res.data as { files?: Array<{ id: string; name: string }> }

    if (data.files && data.files.length > 0) {
      parentId = data.files[0].id
    } else {
      const folderRes = await drive.files.create({
        requestBody: {
          name: part,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentId],
        },
        supportsAllDrives: true,
        fields: 'id',
      })
      const created = folderRes.data as { id: string }
      parentId = created.id
    }
  }

  return parentId!
}

function determineMimeType(mimeType: string): string {
  return mimeType || 'application/octet-stream'
}

export const storageService: IStorageService = {
  async upload(buffer, filePath, mimeType): Promise<UploadResult> {
    const drive = getDriveClient()

    const pathParts = filePath.split('/')
    const fileName = pathParts.pop()!
    const folderId = await ensureFolderPath(drive, pathParts)

    const uploadRes = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId],
        mimeType: determineMimeType(mimeType),
      },
      media: {
        mimeType: determineMimeType(mimeType),
        body: buffer as unknown as string,
      },
      supportsAllDrives: true,
      fields: 'id, webViewLink, webContentLink',
    })
    const file = uploadRes.data as { id: string; webViewLink: string; webContentLink: string }

    await drive.permissions.create({
      fileId: file.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
      supportsAllDrives: true,
    })

    return {
      fileId: file.id,
      webViewLink: file.webViewLink,
      webContentLink: file.webContentLink,
    }
  },

  async getUrl(fileId: string) {
    const drive = getDriveClient()

    const getRes = await drive.files.get({
      fileId,
      fields: 'webViewLink, webContentLink',
      supportsAllDrives: true,
    })
    const file = getRes.data as { webViewLink: string; webContentLink: string }

    return {
      webViewLink: file.webViewLink,
      webContentLink: file.webContentLink,
    }
  },

  async delete(fileId: string): Promise<void> {
    const drive = getDriveClient()

    await drive.files.delete({
      fileId,
      supportsAllDrives: true,
    })
  },

  async list(prefix: string) {
    const drive = getDriveClient()
    const sharedDriveId = getSharedDriveId()

    const listRes = await drive.files.list({
      q: `name contains '${prefix}' and trashed = false`,
      corpora: 'drive',
      driveId: sharedDriveId,
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
      pageSize: 200,
      fields: 'files(id, name, webViewLink, webContentLink, mimeType, size)',
    })
    const data = listRes.data as { files?: Array<{ id: string; name: string; webViewLink?: string; webContentLink?: string | null; mimeType?: string; size?: string | null }> }

    return (data.files ?? []).map((f) => ({
      fileId: f.id,
      name: f.name,
      webViewLink: f.webViewLink ?? '',
      webContentLink: f.webContentLink ?? undefined,
      mimeType: f.mimeType ?? undefined,
      size: f.size ? parseInt(f.size) : undefined,
    }))
  },
}
