export interface WebhookPayload {
    brand_name: string;
    store_name: string;
    platform: string;
    rating: number;
    review_text: string;
    created_at: string;
}
export interface ParsedReview {
    receivedAt: string;
    reviewCreatedAt: string;
    brandName: string;
    storeName: string;
    platform: string;
    rating: string;
    reviewId: string;
    reviewText: string;
    status: 'NEW';
}
export interface WebhookResponse {
    ok: boolean;
    review_id: string;
    sheet_id: string;
    sheet_name: string;
    deduped: boolean;
}
export interface HealthResponse {
    ok: boolean;
}
export interface SheetInfo {
    spreadsheetId: string;
    sheetName: string;
}
export declare const REVIEWS_HEADERS: readonly ["received_at", "review_created_at", "brand_name", "store_name", "platform", "rating", "review_id", "review_text", "status", "p1_sentiment", "p2_summary", "p3_keywords", "p4_weekly_data", "processed_at", "ai_status"];
export interface AIProcessingResult {
    p1Sentiment: '긍정' | '부정' | '중립';
    p2Summary: string;
    p3Keywords: string;
    p4WeeklyData: string;
}
export interface WeeklyData {
    sentiment: '긍정' | '부정' | '중립';
    keywords: string[];
    brand: string;
    store: string;
    summary: string;
    rating: number;
    original_text?: string;
}
export type ReviewHeader = (typeof REVIEWS_HEADERS)[number];
//# sourceMappingURL=index.d.ts.map