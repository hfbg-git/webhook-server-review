interface Logger {
    info: (obj: object | string) => void;
    warn: (obj: object | string) => void;
    error: (obj: object | string) => void;
}
/**
 * 주간 리포트 스케줄러 시작
 */
export declare function startWeeklyReportScheduler(logger: Logger): void;
export {};
//# sourceMappingURL=weeklyReportScheduler.d.ts.map