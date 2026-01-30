import { FastifyInstance } from 'fastify';
import { HealthResponse } from '../types/index.js';

export async function healthRoute(fastify: FastifyInstance) {
  fastify.get<{ Reply: HealthResponse }>('/health', async (_request, _reply) => {
    return { ok: true };
  });
}
