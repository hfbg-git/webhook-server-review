"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseWebhookPayload = parseWebhookPayload;
function parseWebhookPayload(payload) {
    return {
        brandName: payload.brand_name || '',
        storeName: payload.store_name || '',
        platform: payload.platform || '',
        rating: String(payload.rating ?? ''),
        reviewText: payload.review_text || '',
        reviewCreatedAt: payload.created_at || '',
        reviewUrl: payload.review_url || '',
        imageUrl: payload.image_url || '',
    };
}
//# sourceMappingURL=parser.js.map