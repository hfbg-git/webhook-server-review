"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReviewId = generateReviewId;
const crypto_1 = require("crypto");
function generateReviewId(brandName, storeName, platform, rating, reviewText, reviewCreatedAt) {
    const input = `${brandName}|${storeName}|${platform}|${rating}|${reviewText}|${reviewCreatedAt || ''}`;
    const hash = (0, crypto_1.createHash)('sha256').update(input, 'utf8').digest('hex');
    return hash.slice(0, 20);
}
//# sourceMappingURL=hash.js.map