/**
 * 브랜드 레지스트리 캐시 로드
 */
export declare function loadBrandCache(): Promise<void>;
/**
 * 표준 브랜드명 조회/등록
 * @param rawBrandName 원본 브랜드명 (지점명, 플랫폼 제거 후)
 * @returns 표준화된 브랜드명
 */
export declare function getStandardBrandName(rawBrandName: string): Promise<string>;
/**
 * 캐시에서 동기적으로 조회 (캐시 미스 시 원본 반환)
 * 주간 리포트처럼 대량 처리 시 사용
 */
export declare function getStandardBrandNameSync(rawBrandName: string): string;
/**
 * 캐시 로드 여부 확인
 */
export declare function isCacheLoaded(): boolean;
/**
 * 초기 브랜드 데이터 시딩 (1회성)
 */
export declare function seedInitialBrands(): Promise<void>;
//# sourceMappingURL=brandRegistry.d.ts.map