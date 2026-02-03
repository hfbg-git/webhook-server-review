"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processReview = processReview;
const parser_js_1 = require("../utils/parser.js");
const hash_js_1 = require("../utils/hash.js");
const lruCache_js_1 = require("../utils/lruCache.js");
const driveService_js_1 = require("./driveService.js");
const sheetsService_js_1 = require("./sheetsService.js");
const brandRegistry_js_1 = require("./brandRegistry.js");
async function processReview(payload, logger) {
    // BrandRegistry 캐시 로드 (탭 자동 생성 포함)
    await (0, brandRegistry_js_1.loadBrandCache)();
    const parsed = (0, parser_js_1.parseWebhookPayload)(payload);
    const reviewId = (0, hash_js_1.generateReviewId)(parsed.brandName, parsed.storeName, parsed.platform, parsed.rating, parsed.reviewText, parsed.reviewCreatedAt);
    // Check LRU cache first for quick duplicate detection
    if ((0, lruCache_js_1.isReviewIdInCache)(reviewId)) {
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
    const { spreadsheetId, sheetName } = await (0, driveService_js_1.getOrCreateMonthlySpreadsheet)();
    // Ensure Reviews tab exists
    await (0, sheetsService_js_1.ensureReviewsTab)(spreadsheetId);
    // Ensure headers exist
    await (0, sheetsService_js_1.ensureHeaders)(spreadsheetId);
    // Ensure NotificationConfig tab exists (잔디 웹훅 설정용)
    await (0, sheetsService_js_1.ensureNotificationConfigTab)(spreadsheetId);
    // Check duplicate in Google Sheets
    const isDuplicate = await (0, sheetsService_js_1.checkDuplicateReviewId)(spreadsheetId, reviewId);
    if (isDuplicate) {
        logger.info({ msg: 'Duplicate detected in sheet', review_id: reviewId, sheet_name: sheetName });
        (0, lruCache_js_1.addReviewIdToCache)(reviewId);
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
    const standardBrandName = await (0, brandRegistry_js_1.getStandardBrandName)(parsed.brandName);
    const review = {
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
    await (0, sheetsService_js_1.appendReview)(spreadsheetId, review);
    // Add to cache
    (0, lruCache_js_1.addReviewIdToCache)(reviewId);
    logger.info({ msg: 'Review saved', review_id: reviewId, sheet_name: sheetName });
    return {
        ok: true,
        review_id: reviewId,
        sheet_id: spreadsheetId,
        sheet_name: sheetName,
        deduped: false,
    };
}
//# sourceMappingURL=reviewService.js.map