export interface WebhookPayload {
  brand_name: string;
  store_name: string;
  platform: string;
  rating: number;
  review_text: string;
  created_at: string;
  // 신규 필드 (optional)
  review_url?: string;      // 리뷰 원본 URL
  image_url?: string;       // 리뷰 이미지 URL
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
  // 신규 필드 (optional)
  reviewUrl?: string;
  imageUrl?: string;
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
  'review_url',         // P - 리뷰 원본 URL
  'image_url',          // Q - 이미지 URL
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
  // 신규 필드 (optional)
  reviewUrl?: string;
  imageUrl?: string;
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
  // 신규 필드 (optional)
  reviewUrl?: string;
  imageUrl?: string;
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
  // 신규 필드 (optional)
  reviewUrl?: string;
  imageUrl?: string;
}

// 부정리뷰 매장 분석 타입
export interface NegativeStoreAnalysis {
  storeName: string;
  totalNegativeReviews: number;
  ratingBreakdown: {
    rating1: number;
    rating2: number;
    rating3: number;
    rating4: number;
  };
  topNegativeKeywords: string[];
  sampleReviews: Array<{
    reviewText: string;
    rating: number;
    keywords: string[];
    reviewUrl?: string;
    imageUrl?: string;
  }>;
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
  // 지난주 대비 비교 데이터
  lastWeekComparison: {
    totalReviewsChange: string;
    avgRatingChange: string;
    positiveRateChange: string;
    negativeRateChange: string;
  } | null;
  // AI 인사이트
  aiInsights?: AIInsights;
  // 부정리뷰 매장 분석 (TOP 10)
  negativeStoreAnalysis: NegativeStoreAnalysis[];
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

// 알림 설정 타입
export interface NotificationConfig {
  brandName: string;
  jandiWebhookUrl: string;
  enabled: boolean;
  notificationLevel: 'all' | 'summary' | 'url_only';
}

// 잔디 웹훅 메시지 타입
export interface JandiWebhookMessage {
  body: string;
  connectColor: string;
  connectInfo: Array<{
    title: string;
    description: string;
    imageUrl?: string;
  }>;
}
