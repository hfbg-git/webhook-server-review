import { WeeklyReportResult } from '../types/index.js';
interface Logger {
    info: (obj: object | string) => void;
    warn: (obj: object | string) => void;
    error: (obj: object | string) => void;
}
/**
 * 전체 주간 리포트 생성 (모든 브랜드)
 */
export declare function generateWeeklyReports(logger: Logger): Promise<WeeklyReportResult[]>;
/**
 * 특정 브랜드 주간 리포트 생성
 */
export declare function generateBrandWeeklyReport(brandName: string, logger: Logger, targetDate?: Date): Promise<WeeklyReportResult>;
/**
 * 특정 주간 리포트 생성 (특정 날짜 기준)
 */
export declare function generateWeeklyReportsForDate(targetDate: Date, logger: Logger): Promise<WeeklyReportResult[]>;
export {};
//# sourceMappingURL=weeklyReportService.d.ts.map