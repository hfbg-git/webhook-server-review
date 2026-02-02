import { BrandWeeklyAggregation } from '../types/index.js';
/**
 * 잔디 웹훅 전송
 */
export declare function sendJandiNotification(webhookUrl: string, aggregation: BrandWeeklyAggregation, spreadsheetUrl: string): Promise<boolean>;
/**
 * 간단한 알림 메시지 전송 (테스트용)
 */
export declare function sendSimpleJandiMessage(webhookUrl: string, title: string, message: string): Promise<boolean>;
//# sourceMappingURL=jandiWebhookService.d.ts.map