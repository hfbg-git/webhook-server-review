import { ParsedReview, AIProcessingResult } from '../types/index.js';
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
export declare function ensureReviewsTab(spreadsheetId: string): Promise<void>;
export declare function ensureHeaders(spreadsheetId: string): Promise<void>;
export declare function checkDuplicateReviewId(spreadsheetId: string, reviewId: string): Promise<boolean>;
export declare function appendReview(spreadsheetId: string, review: ParsedReview): Promise<void>;
export declare function getNewReviews(spreadsheetId: string, limit: number): Promise<ReviewRow[]>;
export declare function updateReviewWithAIResults(spreadsheetId: string, rowIndex: number, result: AIProcessingResult): Promise<void>;
export declare function markReviewAsFailed(spreadsheetId: string, rowIndex: number): Promise<void>;
export declare function ensureNotificationConfigTab(spreadsheetId: string): Promise<void>;
//# sourceMappingURL=sheetsService.d.ts.map