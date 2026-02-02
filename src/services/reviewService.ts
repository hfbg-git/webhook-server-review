import { WebhookPayload, WebhookResponse, ParsedReview } from '../types/index.js';
import { parseWebhookPayload } from '../utils/parser.js';
import { generateReviewId } from '../utils/hash.js';
import { isReviewIdInCache, addReviewIdToCache } from '../utils/lruCache.js';
import { getOrCreateMonthlySpreadsheet } from './driveService.js';
import { ensureReviewsTab, ensureHeaders, checkDuplicateReviewId, appendReview, ensureNotificationConfigTab } from './sheetsService.js';
import { getStandardBrandName } from './brandRegistry.js';

interface Logger {
  info: (obj: object | string) => void;
  warn: (obj: object | string) => void;
  error: (obj: object | string) => void;
}

export async function processReview(
  payload: WebhookPayload,
  logger: Logger
): Promise<WebhookResponse> {
  const parsed = parseWebhookPayload(payload);
  const reviewId = generateReviewId(
    parsed.brandName,
    parsed.storeName,
    parsed.platform,
    parsed.rating,
    parsed.reviewText,
    parsed.reviewCreatedAt
  );

  // Check LRU cache first for quick duplicate detection
  if (isReviewIdInCache(reviewId)) {
    logger.info({ msg: 'Duplicate detected in cache', review_id: reviewId });
    return {
      ok: true,
      review_id: reviewId,
      sheet_id: '',
      sheet_name: '',
      deduped: true,
    };
  }

  // Get or create monthly spreadsheet
  const { spreadsheetId, sheetName } = await getOrCreateMonthlySpreadsheet();

  // Ensure Reviews tab exists
  await ensureReviewsTab(spreadsheetId);

  // Ensure headers exist
  await ensureHeaders(spreadsheetId);

  // Ensure NotificationConfig tab exists (잔디 웹훅 설정용)
  await ensureNotificationConfigTab(spreadsheetId);

  // Check duplicate in Google Sheets
  const isDuplicate = await checkDuplicateReviewId(spreadsheetId, reviewId);
  if (isDuplicate) {
    logger.info({ msg: 'Duplicate detected in sheet', review_id: reviewId, sheet_name: sheetName });
    addReviewIdToCache(reviewId);
    return {
      ok: true,
      review_id: reviewId,
      sheet_id: spreadsheetId,
      sheet_name: sheetName,
      deduped: true,
    };
  }

  // Build review record (한국 시간)
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  // 브랜드명 정규화 (앞 3글자 매칭으로 표준화)
  const standardBrandName = await getStandardBrandName(parsed.brandName);

  const review: ParsedReview = {
    receivedAt: now,
    reviewCreatedAt: parsed.reviewCreatedAt,
    brandName: standardBrandName,
    storeName: parsed.storeName,
    platform: parsed.platform,
    rating: parsed.rating,
    reviewId,
    reviewText: parsed.reviewText,
    status: 'NEW',
    reviewUrl: parsed.reviewUrl,
    imageUrl: parsed.imageUrl,
  };

  // Append to sheet
  await appendReview(spreadsheetId, review);

  // Add to cache
  addReviewIdToCache(reviewId);

  logger.info({ msg: 'Review saved', review_id: reviewId, sheet_name: sheetName });

  return {
    ok: true,
    review_id: reviewId,
    sheet_id: spreadsheetId,
    sheet_name: sheetName,
    deduped: false,
  };
}
