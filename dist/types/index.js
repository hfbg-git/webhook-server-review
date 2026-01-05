"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REVIEWS_HEADERS = void 0;
exports.REVIEWS_HEADERS = [
    'received_at', // A
    'review_created_at', // B
    'brand_name', // C
    'store_name', // D
    'platform', // E
    'rating', // F
    'review_id', // G
    'review_text', // H
    'status', // I - NEW / DONE / ERROR / FAILED
    'p1_sentiment', // J - 긍정/부정/중립
    'p2_summary', // K - 한줄 요약
    'p3_keywords', // L - 키워드 5개 (쉼표 구분)
    'p4_weekly_data', // M - JSON (위클리용 메타데이터)
    'processed_at', // N - AI 처리 완료 시간
    'ai_status', // O - DONE / ERROR / FAILED
];
//# sourceMappingURL=index.js.map