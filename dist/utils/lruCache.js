"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isReviewIdInCache = isReviewIdInCache;
exports.addReviewIdToCache = addReviewIdToCache;
exports.clearCache = clearCache;
const lru_cache_1 = require("lru-cache");
const cache = new lru_cache_1.LRUCache({
    max: 5000,
    ttl: 1000 * 60 * 10, // 10 minutes
});
function isReviewIdInCache(reviewId) {
    return cache.has(reviewId);
}
function addReviewIdToCache(reviewId) {
    cache.set(reviewId, true);
}
function clearCache() {
    cache.clear();
}
//# sourceMappingURL=lruCache.js.map