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
export interface WeeklyReviewRow {
    receivedAt: string;
    reviewCreatedAt: string;
    brandName: string;
    storeName: string;
    platform: string;
    rating: number;
    reviewId: string;
    reviewText: string;
    status: string;
    sentiment: '긍정' | '부정' | '중립';
    summary: string;
    keywords: string[];
    weeklyData: WeeklyData | null;
    processedAt: string;
    aiStatus: string;
    rowIndex: number;
}
export interface SentimentDistribution {
    positive: number;
    negative: number;
    neutral: number;
    positiveRate: string;
    negativeRate: string;
    neutralRate: string;
}
export interface KeywordStat {
    keyword: string;
    totalCount: number;
    positiveCount: number;
    negativeCount: number;
    neutralCount: number;
    mainSentiment: '긍정' | '부정' | '중립';
    sentimentRatio: string;
    trendVsLastWeek: string;
}
export interface StoreStat {
    storeName: string;
    totalReviews: number;
    positive: number;
    negative: number;
    neutral: number;
    positiveRate: string;
    negativeRate: string;
    avgRating: number;
    topKeywords: string[];
    actionNeeded: string;
}
export interface PlatformStat {
    platform: string;
    totalReviews: number;
    positive: number;
    negative: number;
    neutral: number;
    positiveRate: string;
    avgRating: number;
    topKeywords: string[];
}
export interface NegativeReview {
    receivedAt: string;
    storeName: string;
    platform: string;
    rating: number;
    summary: string;
    keywords: string[];
    originalText: string;
    priority: '🔴 높음' | '🟡 중간' | '🟢 낮음';
}
export interface AIInsights {
    summary: string;
    storeActionItems: Array<{
        storeName: string;
        actionItem: string;
    }>;
    alerts: Array<{
        level: '🔴 긴급' | '🟡 주의' | '🟢 좋은소식';
        message: string;
    }>;
}
export interface BrandWeeklyAggregation {
    brandName: string;
    weekLabel: string;
    totalReviews: number;
    avgRating: number;
    sentimentDistribution: SentimentDistribution;
    topKeywords: KeywordStat[];
    issueKeywords: KeywordStat[];
    storeStats: StoreStat[];
    keywordStats: KeywordStat[];
    negativeReviews: NegativeReview[];
    platformStats: PlatformStat[];
    rawData: WeeklyReviewRow[];
    lastWeekComparison: {
        totalReviewsChange: string;
        avgRatingChange: string;
        positiveRateChange: string;
        negativeRateChange: string;
    } | null;
    aiInsights?: AIInsights;
}
export interface WeeklyReportResult {
    success: boolean;
    brandName: string;
    spreadsheetId?: string;
    spreadsheetUrl?: string;
    weekLabel: string;
    totalReviews: number;
    error?: string;
}
export interface WeekRange {
    startDate: Date;
    endDate: Date;
    weekLabel: string;
}
//# sourceMappingURL=index.d.ts.map