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

export const REVIEWS_HEADERS = [
  'received_at',        // A
  'review_created_at',  // B
  'brand_name',         // C
  'store_name',         // D
  'platform',           // E
  'rating',             // F
  'review_id',          // G
  'review_text',        // H
  'status',             // I - NEW / DONE / ERROR / FAILED
  'p1_sentiment',       // J - 긍정/부정/중립
  'p2_summary',         // K - 한줄 요약
  'p3_keywords',        // L - 키워드 5개 (쉼표 구분)
  'p4_weekly_data',     // M - JSON (위클리용 메타데이터)
  'processed_at',       // N - AI 처리 완료 시간
  'ai_status',          // O - DONE / ERROR / FAILED
] as const;

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

// Weekly Report Types
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
  // 지난주 대비 비교 데이터
  lastWeekComparison: {
    totalReviewsChange: string;
    avgRatingChange: string;
    positiveRateChange: string;
    negativeRateChange: string;
  } | null;
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
