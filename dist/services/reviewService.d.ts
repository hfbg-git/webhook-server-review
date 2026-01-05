import { WebhookPayload, WebhookResponse } from '../types/index.js';
interface Logger {
    info: (obj: object | string) => void;
    warn: (obj: object | string) => void;
    error: (obj: object | string) => void;
}
export declare function processReview(payload: WebhookPayload, logger: Logger): Promise<WebhookResponse>;
export {};
//# sourceMappingURL=reviewService.d.ts.map