import { getDriveClient } from './googleAuth.js';

const ROOT_FOLDER_ID = process.env.RAW_SHEETS_FOLDER_ID || '';
const SHEET_PREFIX = process.env.RAW_SHEET_NAME_PREFIX || 'ReviewDoctor_Raw_';

// 한국 시간 기준으로 연/월 계산
function getKoreanDate(): Date {
  const now = new Date();
  const koreaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  return koreaTime;
}

export function getMonthlySheetName(): string {
  const now = getKoreanDate();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${SHEET_PREFIX}${year}_${month}`;
}

async function findFolderByName(parentId: string, folderName: string): Promise<string | null> {
  const drive = getDriveClient();

  const response = await drive.files.list({
    q: `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  const files = response.data.files || [];
  if (files.length > 0 && files[0].id) {
    return files[0].id;
  }

  return null;
}

async function createFolder(parentId: string, folderName: string): Promise<string> {
  const drive = getDriveClient();

  const response = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
  });

  const folderId = response.data.id;
  if (!folderId) {
    throw new Error(`Failed to create folder '${folderName}': no folder ID returned`);
  }

  return folderId;
}

async function getOrCreateFolder(parentId: string, folderName: string): Promise<string> {
  let folderId = await findFolderByName(parentId, folderName);

  if (!folderId) {
    folderId = await createFolder(parentId, folderName);
  }

  return folderId;
}

export async function findSpreadsheetByName(parentId: string, sheetName: string): Promise<string | null> {
  const drive = getDriveClient();

  const response = await drive.files.list({
    q: `name='${sheetName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  const files = response.data.files || [];
  if (files.length > 0 && files[0].id) {
    return files[0].id;
  }

  return null;
}

export async function createSpreadsheet(parentId: string, sheetName: string): Promise<string> {
  const drive = getDriveClient();

  const response = await drive.files.create({
    requestBody: {
      name: sheetName,
      mimeType: 'application/vnd.google-apps.spreadsheet',
      parents: [parentId],
    },
    fields: 'id',
  });

  const fileId = response.data.id;
  if (!fileId) {
    throw new Error('Failed to create spreadsheet: no file ID returned');
  }

  return fileId;
}

export async function getOrCreateMonthlySpreadsheet(): Promise<{ spreadsheetId: string; sheetName: string }> {
  const now = getKoreanDate();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const sheetName = getMonthlySheetName();

  // 1. 연도 폴더 생성/조회 (예: "2025")
  const yearFolderId = await getOrCreateFolder(ROOT_FOLDER_ID, year);

  // 2. 월 폴더 생성/조회 (예: "12")
  const monthFolderId = await getOrCreateFolder(yearFolderId, month);

  // 3. 해당 폴더에 스프레드시트 생성/조회
  let spreadsheetId = await findSpreadsheetByName(monthFolderId, sheetName);

  if (!spreadsheetId) {
    spreadsheetId = await createSpreadsheet(monthFolderId, sheetName);
  }

  return { spreadsheetId, sheetName };
}
