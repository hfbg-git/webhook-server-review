import { BrandWeeklyAggregation } from '../types/index.js';
interface Logger {
    info: (obj: object | string) => void;
    warn: (obj: object | string) => void;
    error: (obj: object | string) => void;
}
/**
 * 브랜드별 주간 리포트 시트 생성
 */
export declare function createBrandWeeklyReportSheet(aggregation: BrandWeeklyAggregation, logger: Logger): Promise<{
    spreadsheetId: string;
    spreadsheetUrl: string;
}>;
export {};
//# sourceMappingURL=weeklySheetBuilder.d.ts.map