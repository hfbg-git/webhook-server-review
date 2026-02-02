import { describe, it, expect } from 'vitest';
import { parseWebhookPayload } from '../src/utils/parser.js';

describe('parseWebhookPayload', () => {
  it('should parse all fields from webhook payload', () => {
    const result = parseWebhookPayload({
      brand_name: '튀긴치킨 싫어서 구운치킨만 파는 집 세종종촌점_배달의민족',
      store_name: '튀긴치킨 싫어서 구운치킨만 파는 집 세종종촌점',
      platform: '배달의민족',
      rating: 1,
      review_text: '파가 탄 것 같은데 쓴 맛이 강했어요.',
      created_at: '2025-12-22T13:20:00Z',
    });

    expect(result.brandName).toBe('튀긴치킨 싫어서 구운치킨만 파는 집 세종종촌점_배달의민족');
    expect(result.storeName).toBe('튀긴치킨 싫어서 구운치킨만 파는 집 세종종촌점');
    expect(result.platform).toBe('배달의민족');
    expect(result.rating).toBe('1');
    expect(result.reviewText).toBe('파가 탄 것 같은데 쓴 맛이 강했어요.');
    expect(result.reviewCreatedAt).toBe('2025-12-22T13:20:00Z');
  });

  it('should handle high rating', () => {
    const result = parseWebhookPayload({
      brand_name: '맛있는 식당_쿠팡이츠',
      store_name: '맛있는 식당',
      platform: '쿠팡이츠',
      rating: 5,
      review_text: '정말 맛있어요!',
      created_at: '2025-12-20T10:00:00Z',
    });

    expect(result.rating).toBe('5');
  });

  it('should handle decimal rating', () => {
    const result = parseWebhookPayload({
      brand_name: '테스트_요기요',
      store_name: '테스트',
      platform: '요기요',
      rating: 4.5,
      review_text: '괜찮아요',
      created_at: '2025-12-21T15:30:00Z',
    });

    expect(result.rating).toBe('4.5');
  });

  it('should handle missing optional fields with defaults', () => {
    const result = parseWebhookPayload({
      brand_name: '',
      store_name: '',
      platform: '',
      rating: 0,
      review_text: '',
      created_at: '',
    });

    expect(result.brandName).toBe('');
    expect(result.storeName).toBe('');
    expect(result.platform).toBe('');
    expect(result.rating).toBe('0');
    expect(result.reviewText).toBe('');
    expect(result.reviewCreatedAt).toBe('');
  });

  it('should handle Korean review text', () => {
    const result = parseWebhookPayload({
      brand_name: '한식당_배달의민족',
      store_name: '한식당',
      platform: '배달의민족',
      rating: 3,
      review_text: '음식은 괜찮았는데 배달이 늦었어요. 다음에는 더 빠르게 와주세요.',
      created_at: '2025-12-22T18:00:00Z',
    });

    expect(result.reviewText).toBe('음식은 괜찮았는데 배달이 늦었어요. 다음에는 더 빠르게 와주세요.');
  });
});
