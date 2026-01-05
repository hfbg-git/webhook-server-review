import { describe, it, expect } from 'vitest';
import { generateReviewId } from '../src/utils/hash.js';

describe('generateReviewId', () => {
  it('should generate consistent hash for same input', () => {
    const id1 = generateReviewId(
      '강남점_배달의민족',
      '강남점',
      '배달의민족',
      '5',
      '좋은 서비스였습니다',
      '2025-01-15T10:00:00Z'
    );
    const id2 = generateReviewId(
      '강남점_배달의민족',
      '강남점',
      '배달의민족',
      '5',
      '좋은 서비스였습니다',
      '2025-01-15T10:00:00Z'
    );
    expect(id1).toBe(id2);
  });

  it('should generate different hash for different store', () => {
    const id1 = generateReviewId(
      '강남점_배달의민족',
      '강남점',
      '배달의민족',
      '5',
      '좋은 서비스였습니다',
      '2025-01-15T10:00:00Z'
    );
    const id2 = generateReviewId(
      '서초점_배달의민족',
      '서초점',
      '배달의민족',
      '5',
      '좋은 서비스였습니다',
      '2025-01-15T10:00:00Z'
    );
    expect(id1).not.toBe(id2);
  });

  it('should generate different hash for different platform', () => {
    const id1 = generateReviewId(
      '강남점_배달의민족',
      '강남점',
      '배달의민족',
      '5',
      '좋은 서비스였습니다',
      '2025-01-15T10:00:00Z'
    );
    const id2 = generateReviewId(
      '강남점_쿠팡이츠',
      '강남점',
      '쿠팡이츠',
      '5',
      '좋은 서비스였습니다',
      '2025-01-15T10:00:00Z'
    );
    expect(id1).not.toBe(id2);
  });

  it('should handle empty values', () => {
    const id = generateReviewId('', '', '', '', '', '');
    expect(id).toBeDefined();
    expect(id.length).toBe(20);
  });

  it('should generate 20-character hash', () => {
    const id = generateReviewId(
      '테스트점_요기요',
      '테스트점',
      '요기요',
      '4',
      '리뷰 내용입니다',
      '2025-12-01T12:00:00Z'
    );
    expect(id.length).toBe(20);
  });

  it('should handle missing date', () => {
    const id1 = generateReviewId(
      '강남점_배달의민족',
      '강남점',
      '배달의민족',
      '5',
      '좋은 서비스',
      ''
    );
    const id2 = generateReviewId(
      '강남점_배달의민족',
      '강남점',
      '배달의민족',
      '5',
      '좋은 서비스',
      ''
    );
    expect(id1).toBe(id2);
  });
});
