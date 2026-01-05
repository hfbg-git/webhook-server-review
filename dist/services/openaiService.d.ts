import { AIProcessingResult } from '../types/index.js';
export interface ReviewData {
    reviewText: string;
    brandName: string;
    storeName: string;
    platform: string;
    rating: string;
}
export declare function analyzeReview(review: ReviewData): Promise<AIProcessingResult>;
//# sourceMappingURL=openaiService.d.ts.map