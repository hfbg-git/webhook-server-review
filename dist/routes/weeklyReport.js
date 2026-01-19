"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.weeklyReportRoute = weeklyReportRoute;
const weeklyReportService_js_1 = require("../services/weeklyReportService.js");
async function weeklyReportRoute(fastify) {
    /**
     * POST /api/weekly-report/generate
     *
     * 주간 리포트 수동 생성
     *
     * Query Parameters:
     * - brand: 특정 브랜드만 생성 (선택)
     * - date: 특정 날짜 기준 주간 리포트 생성 (선택, YYYY-MM-DD 형식)
     *
     * Examples:
     * - POST /api/weekly-report/generate (지난 주 전체 브랜드)
     * - POST /api/weekly-report/generate?brand=브랜드A (지난 주 특정 브랜드)
     * - POST /api/weekly-report/generate?date=2025-01-10 (특정 날짜 기준)
     * - POST /api/weekly-report/generate?brand=브랜드A&date=2025-01-10 (특정 날짜, 특정 브랜드)
     */
    fastify.post('/api/weekly-report/generate', async (request, reply) => {
        const { brand, date } = request.query;
        try {
            let results;
            if (brand && date) {
                // 특정 날짜의 특정 브랜드
                const targetDate = new Date(date);
                if (isNaN(targetDate.getTime())) {
                    reply.status(400);
                    return { ok: false, error: 'Invalid date format. Use YYYY-MM-DD.' };
                }
                const result = await (0, weeklyReportService_js_1.generateBrandWeeklyReport)(brand, fastify.log, targetDate);
                results = [result];
            }
            else if (brand) {
                // 지난 주의 특정 브랜드
                const result = await (0, weeklyReportService_js_1.generateBrandWeeklyReport)(brand, fastify.log);
                results = [result];
            }
            else if (date) {
                // 특정 날짜의 전체 브랜드
                const targetDate = new Date(date);
                if (isNaN(targetDate.getTime())) {
                    reply.status(400);
                    return { ok: false, error: 'Invalid date format. Use YYYY-MM-DD.' };
                }
                results = await (0, weeklyReportService_js_1.generateWeeklyReportsForDate)(targetDate, fastify.log);
            }
            else {
                // 지난 주 전체 브랜드
                results = await (0, weeklyReportService_js_1.generateWeeklyReports)(fastify.log);
            }
            const successCount = results.filter((r) => r.success).length;
            fastify.log.info({
                msg: 'Weekly report generation completed via API',
                totalBrands: results.length,
                successCount,
                failedCount: results.length - successCount,
            });
            return {
                ok: successCount > 0,
                results,
            };
        }
        catch (error) {
            fastify.log.error({
                msg: 'Weekly report generation failed via API',
                error: error.message,
                stack: error.stack,
            });
            reply.status(500);
            return {
                ok: false,
                error: error.message,
            };
        }
    });
    /**
     * GET /api/weekly-report/status
     *
     * 주간 리포트 스케줄러 상태 확인
     */
    fastify.get('/api/weekly-report/status', async () => {
        const enabled = process.env.WEEKLY_REPORT_ENABLED === 'true';
        const cron = process.env.WEEKLY_REPORT_CRON || '0 9 * * 1';
        return {
            ok: true,
            enabled,
            cron,
            timezone: 'Asia/Seoul',
            description: enabled
                ? `주간 리포트가 ${cron} 스케줄로 실행됩니다.`
                : '주간 리포트 스케줄러가 비활성화되어 있습니다.',
        };
    });
}
//# sourceMappingURL=weeklyReport.js.map