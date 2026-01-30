import cron from 'node-cron';
import { generateWeeklyReports } from './weeklyReportService.js';

interface Logger {
  info: (obj: object | string) => void;
  warn: (obj: object | string) => void;
  error: (obj: object | string) => void;
}

const WEEKLY_REPORT_ENABLED = process.env.WEEKLY_REPORT_ENABLED === 'true';
const WEEKLY_REPORT_CRON = process.env.WEEKLY_REPORT_CRON || '0 9 * * 1'; // 매주 월요일 오전 9시

/**
 * 주간 리포트 스케줄러 시작
 */
export function startWeeklyReportScheduler(logger: Logger): void {
  if (!WEEKLY_REPORT_ENABLED) {
    logger.info({ msg: 'Weekly report scheduler disabled (WEEKLY_REPORT_ENABLED !== true)' });
    return;
  }

  // cron 표현식 유효성 검사
  if (!cron.validate(WEEKLY_REPORT_CRON)) {
    logger.error({
      msg: 'Invalid cron expression for weekly report',
      cron: WEEKLY_REPORT_CRON,
    });
    return;
  }

  cron.schedule(
    WEEKLY_REPORT_CRON,
    async () => {
      logger.info({ msg: 'Weekly report scheduler triggered' });

      try {
        const results = await generateWeeklyReports(logger);

        const successCount = results.filter((r) => r.success).length;
        const failedCount = results.length - successCount;

        logger.info({
          msg: 'Weekly report scheduler completed',
          totalBrands: results.length,
          successCount,
          failedCount,
          results: results.map((r) => ({
            brand: r.brandName,
            success: r.success,
            url: r.spreadsheetUrl,
            error: r.error,
          })),
        });
      } catch (error) {
        logger.error({
          msg: 'Weekly report scheduler failed',
          error: (error as Error).message,
          stack: (error as Error).stack,
        });
      }
    },
    {
      timezone: 'Asia/Seoul',
    }
  );

  logger.info({
    msg: 'Weekly report scheduler started',
    cron: WEEKLY_REPORT_CRON,
    timezone: 'Asia/Seoul',
  });
}
