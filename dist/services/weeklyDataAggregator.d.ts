import { WeeklyReviewRow, BrandWeeklyAggregation, WeekRange } from '../types/index.js';
/**
 * 지난 주 월요일 00:00:00 ~ 일요일 23:59:59 (KST) 기간 계산
 */
export declare function getLastWeekRange(): WeekRange;
/**
 * 특정 기간의 주간 범위 계산 (테스트용)
 */
export declare function getWeekRangeForDate(targetDate: Date): WeekRange;
/**
 * 해당 기간의 리뷰 데이터 조회
 */
export declare function getWeeklyReviewData(startDate: Date, endDate: Date): Promise<WeeklyReviewRow[]>;
/**
 * 브랜드별로 리뷰 그룹화 (앞 3글자 + 유사도 조합)
 * - 앞 3글자가 같으면서 유사도 60% 이상인 경우만 같은 브랜드로 처리
 * - 띄어쓰기/오타 변형은 합쳐지고, 다른 브랜드는 분리됨
 */
export declare function groupByBrand(reviews: WeeklyReviewRow[]): Map<string, WeeklyReviewRow[]>;
/**
 * 브랜드별 주간 데이터 집계
 */
export declare function aggregateBrandWeeklyData(brandName: string, reviews: WeeklyReviewRow[], weekLabel: string, lastWeekReviews?: WeeklyReviewRow[]): Promise<BrandWeeklyAggregation>;
//# sourceMappingURL=weeklyDataAggregator.d.ts.map