import { WebhookPayload } from '../types/index.js';

export interface ParsedData {
  brandName: string;
  storeName: string;
  platform: string;
  rating: string;
  reviewText: string;
  reviewCreatedAt: string;
}

export function parseWebhookPayload(payload: WebhookPayload): ParsedData {
  return {
    brandName: payload.brand_name || '',
    storeName: payload.store_name || '',
    platform: payload.platform || '',
    rating: String(payload.rating ?? ''),
    reviewText: payload.review_text || '',
    reviewCreatedAt: payload.created_at || '',
  };
}
