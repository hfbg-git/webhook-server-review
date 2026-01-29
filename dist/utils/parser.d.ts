import { WebhookPayload } from '../types/index.js';
export interface ParsedData {
    brandName: string;
    storeName: string;
    platform: string;
    rating: string;
    reviewText: string;
    reviewCreatedAt: string;
    reviewUrl: string;
    imageUrl: string;
}
export declare function parseWebhookPayload(payload: WebhookPayload): ParsedData;
//# sourceMappingURL=parser.d.ts.map