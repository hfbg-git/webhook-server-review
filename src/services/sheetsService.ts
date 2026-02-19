import { getSheetsClient } from './googleAuth.js';
import { REVIEWS_HEADERS, ParsedReview, AIProcessingResult } from '../types/index.js';

const REVIEWS_TAB = 'Reviews';
const NOTIFICATION_CONFIG_TAB = 'NotificationConfig';
const DUP_CHECK_ROWS = parseInt(process.env.DUP_CHECK_LOOKBACK_ROWS || '2000', 10);

export interface ReviewRow {
  rowIndex: number;
  reviewText: string;
  brandName: string;
  storeName: string;
  platform: string;
  rating: string;
  status: string;
  retryCount?: number;
}

export async function ensureReviewsTab(spreadsheetId: string): Promise<void> {
  const sheets = getSheetsClient();

  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties.title',
  });

  const existingSheets = spreadsheet.data.sheets || [];
  const hasReviewsTab = existingSheets.some((sheet) => sheet.properties?.title === REVIEWS_TAB);

  if (!hasReviewsTab) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: REVIEWS_TAB,
              },
            },
          },
        ],
      },
    });
  }
}

export async function ensureHeaders(spreadsheetId: string): Promise<void> {
  const sheets = getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${REVIEWS_TAB}!A1:Q1`,
  });

  const firstRow = response.data.values?.[0];

  if (!firstRow || firstRow.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${REVIEWS_TAB}!A1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [REVIEWS_HEADERS as unknown as string[]],
      },
    });
  }
}

export async function checkDuplicateReviewId(
  spreadsheetId: string,
  reviewId: string
): Promise<boolean> {
  const sheets = getSheetsClient();

  // review_id is now in column G (7th column)
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${REVIEWS_TAB}!G2:G${DUP_CHECK_ROWS + 1}`,
  });

  const values = response.data.values || [];
  const existingIds = values.flat();

  return existingIds.includes(reviewId);
}

export async function appendReview(spreadsheetId: string, review: ParsedReview): Promise<void> {
  const sheets = getSheetsClient();

  const row = [
    review.receivedAt,      // A: received_at
    review.reviewCreatedAt, // B: review_created_at
    review.brandName,       // C: brand_name
    review.storeName,       // D: store_name
    review.platform,        // E: platform
    review.rating,          // F: rating
    review.reviewId,        // G: review_id
    review.reviewText,      // H: review_text
    review.status,          // I: status
    '',                     // J: p1_sentiment (AI 처리)
    '',                     // K: p2_summary (AI 처리)
    '',                     // L: p3_keywords (AI 처리)
    '',                     // M: p4_weekly_data (AI 처리)
    '',                     // N: processed_at (AI 처리)
    '',                     // O: ai_status (AI 처리)
    review.reviewUrl || '', // P: review_url
    review.imageUrl || '',  // Q: image_url
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${REVIEWS_TAB}!A:Q`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [row],
    },
  });
}

export async function getNewReviews(spreadsheetId: string, limit: number): Promise<ReviewRow[]> {
  const sheets = getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${REVIEWS_TAB}!A2:Q`,
  });

  const rows = response.data.values || [];
  const newReviews: ReviewRow[] = [];

  for (let i = 0; i < rows.length && newReviews.length < limit; i++) {
    const row = rows[i];
    const status = row[8] || '';

    if (status === 'NEW' || status === 'ERROR') {
      newReviews.push({
        rowIndex: i + 2,
        reviewText: row[7] || '',
        brandName: row[2] || '',
        storeName: row[3] || '',
        platform: row[4] || '',
        rating: row[5] || '',
        status,
        retryCount: status === 'ERROR' ? 1 : 0,
      });
    }
  }

  return newReviews;
}

export async function updateReviewWithAIResults(
  spreadsheetId: string,
  rowIndex: number,
  result: AIProcessingResult
): Promise<void> {
  const sheets = getSheetsClient();

  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${REVIEWS_TAB}!I${rowIndex}:O${rowIndex}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        'DONE',
        result.p1Sentiment,
        result.p2Summary,
        result.p3Keywords,
        result.p4WeeklyData,
        now,
        'DONE',
      ]],
    },
  });
}

export async function markReviewAsFailed(spreadsheetId: string, rowIndex: number): Promise<void> {
  const sheets = getSheetsClient();

  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${REVIEWS_TAB}!I${rowIndex}:O${rowIndex}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [['FAILED', '', '', '', '', now, 'FAILED']],
    },
  });
}

export async function ensureNotificationConfigTab(spreadsheetId: string): Promise<void> {
  const sheets = getSheetsClient();

  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties.title',
  });

  const existingSheets = spreadsheet.data.sheets || [];
  const hasConfigTab = existingSheets.some(
    (sheet) => sheet.properties?.title === NOTIFICATION_CONFIG_TAB
  );

  if (!hasConfigTab) {
    // 탭 생성
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: NOTIFICATION_CONFIG_TAB,
              },
            },
          },
        ],
      },
    });

    // 헤더 추가
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${NOTIFICATION_CONFIG_TAB}!A1:D1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [['brand_name', 'jandi_webhook_url', 'enabled', 'notification_level']],
      },
    });
  }
}
