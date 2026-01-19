import { AIProcessingResult } from '../types/index.js';
export interface ReviewData {
    reviewText: string;
    brandName: string;
    storeName: string;
    platform: string;
    rating: string;
}
export declare function analyzeReview(review: ReviewData): Promise<AIProcessingResult>;
export interface WeeklyInsightData {
    brandName: string;
    totalReviews: number;
    avgRating: number;
    positiveRate: string;
    negativeRate: string;
    topKeywords: string[];
    issueKeywords: string[];
    storeStats: Array<{
        storeName: string;
        totalReviews: number;
        negativeRate: string;
        avgRating: number;
        topKeywords: string[];
    }>;
    keywordTrends: Array<{
        keyword: string;
        count: number;
        trend: string;
        sentiment: string;
    }>;
}
export interface WeeklyAIInsights {
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
/**
 * 주간 리포트용 AI 인사이트 생성
 */
export declare function generateWeeklyInsights(data: WeeklyInsightData): Promise<WeeklyAIInsights>;
//# sourceMappingURL=openaiService.d.ts.map