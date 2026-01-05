import { createHash } from 'crypto';

export function generateReviewId(
  brandName: string,
  storeName: string,
  platform: string,
  rating: string,
  reviewText: string,
  reviewCreatedAt: string
): string {
  const input = `${brandName}|${storeName}|${platform}|${rating}|${reviewText}|${reviewCreatedAt || ''}`;
  const hash = createHash('sha256').update(input, 'utf8').digest('hex');
  return hash.slice(0, 20);
}
