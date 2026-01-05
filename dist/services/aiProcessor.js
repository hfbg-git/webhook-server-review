"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processNewReviews = processNewReviews;
const driveService_js_1 = require("./driveService.js");
const sheetsService_js_1 = require("./sheetsService.js");
const openaiService_js_1 = require("./openaiService.js");
const BATCH_SIZE = parseInt(process.env.AI_BATCH_SIZE || '50', 10);
const MAX_RETRIES = 3;
async function processNewReviews(logger) {
    try {
        const { spreadsheetId, sheetName } = await (0, driveService_js_1.getOrCreateMonthlySpreadsheet)();
        const newReviews = await (0, sheetsService_js_1.getNewReviews)(spreadsheetId, BATCH_SIZE);
        if (newReviews.length === 0) {
            logger.info({ msg: 'No new reviews to process' });
            return;
        }
        logger.info({ msg: 'Processing new reviews', count: newReviews.length, sheet_name: sheetName });
        for (const review of newReviews) {
            try {
                const result = await (0, openaiService_js_1.analyzeReview)({
                    reviewText: review.reviewText,
                    brandName: review.brandName,
                    storeName: review.storeName,
                    platform: review.platform,
                    rating: review.rating,
                });
                await (0, sheetsService_js_1.updateReviewWithAIResults)(spreadsheetId, review.rowIndex, result);
                logger.info({
                    msg: 'Review processed',
                    row: review.rowIndex,
                    sentiment: result.p1Sentiment,
                });
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                logger.error({
                    msg: 'Failed to process review',
                    row: review.rowIndex,
                    error: errorMessage,
                });
                const retryCount = review.retryCount || 0;
                if (retryCount >= MAX_RETRIES - 1) {
                    await (0, sheetsService_js_1.markReviewAsFailed)(spreadsheetId, review.rowIndex);
                    logger.warn({
                        msg: 'Review marked as FAILED after max retries',
                        row: review.rowIndex,
                    });
                }
                else {
                    await markReviewAsError(spreadsheetId, review.rowIndex);
                }
            }
        }
        logger.info({ msg: 'Batch processing completed', processed: newReviews.length });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error({ msg: 'Batch processing failed', error: errorMessage });
    }
}
async function markReviewAsError(spreadsheetId, rowIndex) {
    const { getSheetsClient } = await import('./googleAuth.js');
    const sheets = getSheetsClient();
    const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Reviews!I${rowIndex}:O${rowIndex}`,
        valueInputOption: 'RAW',
        requestBody: {
            values: [['ERROR', '', '', '', '', now, 'ERROR']],
        },
    });
}
//# sourceMappingURL=aiProcessor.js.map