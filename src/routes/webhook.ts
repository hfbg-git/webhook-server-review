import { FastifyInstance } from 'fastify';
import { WebhookPayload, WebhookResponse } from '../types/index.js';
import { processReview } from '../services/reviewService.js';

export async function webhookRoute(fastify: FastifyInstance) {
  fastify.post<{ Body: WebhookPayload; Reply: WebhookResponse }>(
    '/webhook/reviewdoctor',
    async (request, reply) => {
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
        const result = await processReview(payload, fastify.log);

        fastify.log.info({
          review_id: result.review_id,
          deduped: result.deduped,
          sheet_name: result.sheet_name,
        });

        return result;
      } catch (error) {
        fastify.log.error({ err: error, stack: (error as Error).stack });
        reply.status(500);
        return {
          ok: false,
          review_id: '',
          sheet_id: '',
          sheet_name: '',
          deduped: false,
          error: (error as Error).message,
        };
      }
    }
  );
}
