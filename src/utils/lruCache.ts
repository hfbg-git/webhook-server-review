import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, boolean>({
  max: 5000,
  ttl: 1000 * 60 * 10, // 10 minutes
});

export function isReviewIdInCache(reviewId: string): boolean {
  return cache.has(reviewId);
}

export function addReviewIdToCache(reviewId: string): void {
  cache.set(reviewId, true);
}

export function clearCache(): void {
  cache.clear();
}
