"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookRoute = webhookRoute;
const reviewService_js_1 = require("../services/reviewService.js");
async function webhookRoute(fastify) {
    fastify.post('/webhook/reviewdoctor', async (request, reply) => {
        const payload = request.body;
        // Validate required fields
        if (!payload || !payload.brand_name || !payload.store_name || !payload.platform) {
            reply.status(400);
            return {
                ok: false,
                review_id: '',
                sheet_id: '',
                sheet_name: '',
                deduped: false,
                error: 'Missing required fields: brand_name, store_name, platform',
            };
        }
        try {
            const result = await (0, reviewService_js_1.processReview)(payload, fastify.log);
            fastify.log.info({
                review_id: result.review_id,
                deduped: result.deduped,
                sheet_name: result.sheet_name,
            });
            return result;
        }
        catch (error) {
            fastify.log.error({ err: error, stack: error.stack });
            reply.status(500);
            return {
                ok: false,
                review_id: '',
                sheet_id: '',
                sheet_name: '',
                deduped: false,
                error: error.message,
            };
        }
    });
}
//# sourceMappingURL=webhook.js.map