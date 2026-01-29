"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureReviewsTab = ensureReviewsTab;
exports.ensureHeaders = ensureHeaders;
exports.checkDuplicateReviewId = checkDuplicateReviewId;
exports.appendReview = appendReview;
exports.getNewReviews = getNewReviews;
exports.updateReviewWithAIResults = updateReviewWithAIResults;
exports.markReviewAsFailed = markReviewAsFailed;
const googleAuth_js_1 = require("./googleAuth.js");
const index_js_1 = require("../types/index.js");
const REVIEWS_TAB = 'Reviews';
const DUP_CHECK_ROWS = parseInt(process.env.DUP_CHECK_LOOKBACK_ROWS || '2000', 10);
async function ensureReviewsTab(spreadsheetId) {
    const sheets = (0, googleAuth_js_1.getSheetsClient)();
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
async function ensureHeaders(spreadsheetId) {
    const sheets = (0, googleAuth_js_1.getSheetsClient)();
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
                values: [index_js_1.REVIEWS_HEADERS],
            },
        });
    }
}
async function checkDuplicateReviewId(spreadsheetId, reviewId) {
    const sheets = (0, googleAuth_js_1.getSheetsClient)();
    // review_id is now in column G (7th column)
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${REVIEWS_TAB}!G2:G${DUP_CHECK_ROWS + 1}`,
    });
    const values = response.data.values || [];
    const existingIds = values.flat();
    return existingIds.includes(reviewId);
}
async function appendReview(spreadsheetId, review) {
    const sheets = (0, googleAuth_js_1.getSheetsClient)();
    const row = [
        review.receivedAt, // A: received_at
        review.reviewCreatedAt, // B: review_created_at
        review.brandName, // C: brand_name
        review.storeName, // D: store_name
        review.platform, // E: platform
        review.rating, // F: rating
        review.reviewId, // G: review_id
        review.reviewText, // H: review_text
        review.status, // I: status
        '', // J: p1_sentiment (AI 처리)
        '', // K: p2_summary (AI 처리)
        '', // L: p3_keywords (AI 처리)
        '', // M: p4_weekly_data (AI 처리)
        '', // N: processed_at (AI 처리)
        '', // O: ai_status (AI 처리)
        review.reviewUrl || '', // P: review_url
        review.imageUrl || '', // Q: image_url
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
async function getNewReviews(spreadsheetId, limit) {
    const sheets = (0, googleAuth_js_1.getSheetsClient)();
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${REVIEWS_TAB}!A2:Q`,
    });
    const rows = response.data.values || [];
    const newReviews = [];
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
async function updateReviewWithAIResults(spreadsheetId, rowIndex, result) {
    const sheets = (0, googleAuth_js_1.getSheetsClient)();
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
async function markReviewAsFailed(spreadsheetId, rowIndex) {
    const sheets = (0, googleAuth_js_1.getSheetsClient)();
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
//# sourceMappingURL=sheetsService.js.map