import { google } from 'googleapis';
import { Readable } from 'stream';

// ── Auth client using service account ────────────────────────────────────
function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return google.drive({ version: 'v3', auth });
}

// ── Get or create month subfolder inside root upload folder ───────────────
export async function getOrCreateMonthFolder(month: string): Promise<string> {
  const drive = getDriveClient();
  const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID!;

  // Check if month folder already exists
  const res = await drive.files.list({
    q: `'${rootFolderId}' in parents and name='${month}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id,name)',
  });

  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id!;
  }

  // Create month folder
  const folder = await drive.files.create({
    requestBody: {
      name: month,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [rootFolderId],
    },
    fields: 'id',
  });

  return folder.data.id!;
}

// ── Upload file to Drive ──────────────────────────────────────────────────
export async function uploadToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  folderId: string
): Promise<{ id: string; webViewLink: string }> {
  const drive = getDriveClient();

  const stream = new Readable();
  stream.push(fileBuffer);
  stream.push(null);

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: 'id,webViewLink',
  });

  return {
    id: res.data.id!,
    webViewLink: res.data.webViewLink!,
  };
}

// ── List uploaded files for a month ──────────────────────────────────────
export async function listMonthUploads(month: string): Promise<Array<{
  brand: string;
  fileName: string;
  uploadedAt: string;
  fileId: string;
  webViewLink: string;
}>> {
  const drive = getDriveClient();
  const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID!;

  // Find month folder
  const folderRes = await drive.files.list({
    q: `'${rootFolderId}' in parents and name='${month}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)',
  });

  if (!folderRes.data.files || folderRes.data.files.length === 0) return [];
  const folderId = folderRes.data.files[0].id!;

  // List files in month folder
  const filesRes = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: 'files(id,name,createdTime,webViewLink)',
    orderBy: 'createdTime desc',
  });

  return (filesRes.data.files || []).map(f => {
    // Extract brand from filename: "BrandName - Cashflow Jun 26 V1.xlsx"
    const brand = f.name?.split(' - ')[0] || 'Unknown';
    return {
      brand,
      fileName: f.name || '',
      uploadedAt: f.createdTime || '',
      fileId: f.id || '',
      webViewLink: f.webViewLink || '',
    };
  });
}

// ── Download file from Drive as Buffer ───────────────────────────────────
export async function downloadFromDrive(fileId: string): Promise<Buffer> {
  const drive = getDriveClient();
  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  );
  return Buffer.from(res.data as ArrayBuffer);
}
