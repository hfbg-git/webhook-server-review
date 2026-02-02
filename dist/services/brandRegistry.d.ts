export declare const MAIN_BRAND_PREFIXES: string[];
/**
 * 메인 브랜드 여부 확인
 */
export declare function isMainBrand(brandName: string): boolean;
/**
 * 브랜드 레지스트리 캐시 로드
 * @param forceReload true면 캐시 상태와 무관하게 다시 로드
 */
export declare function loadBrandCache(forceReload?: boolean): Promise<void>;
/**
 * 표준 브랜드명 조회/등록 (앞 3글자 매칭)
 * @param rawBrandName 원본 브랜드명 (지점명, 플랫폼 제거 후)
 * @returns 표준화된 브랜드명
 */
export declare function getStandardBrandName(rawBrandName: string): Promise<string>;
/**
 * 캐시에서 동기적으로 조회 (앞 3글자 매칭)
 * 주간 리포트처럼 대량 처리 시 사용
 */
export declare function getStandardBrandNameSync(rawBrandName: string): string;
/**
 * 캐시 로드 여부 확인
 */
export declare function isCacheLoaded(): boolean;
/**
 * 초기 브랜드 데이터 시딩 (1회성)
 *
 * 앞 3글자 매칭으로 대부분 자동 처리되므로,
 * 앞 3글자가 다르지만 같은 브랜드인 경우만 수동 등록 필요
 */
export declare function seedInitialBrands(): Promise<void>;
//# sourceMappingURL=brandRegistry.d.ts.map