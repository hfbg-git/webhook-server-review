import 'dotenv/config';
import Fastify from 'fastify';
import { healthRoute } from './routes/health.js';
import { webhookRoute } from './routes/webhook.js';
import { authRoute } from './routes/auth.js';
import { processNewReviews } from './services/aiProcessor.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';
const AI_BATCH_INTERVAL = parseInt(process.env.AI_BATCH_INTERVAL || '300000', 10);

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
});

fastify.register(healthRoute);
fastify.register(webhookRoute);
fastify.register(authRoute);

const startAIProcessor = () => {
  if (!process.env.OPENAI_API_KEY) {
    fastify.log.warn('OPENAI_API_KEY not set, AI processing disabled');
    return;
  }

  fastify.log.info({ msg: 'AI processor started', interval_ms: AI_BATCH_INTERVAL });

  setInterval(async () => {
    await processNewReviews(fastify.log);
  }, AI_BATCH_INTERVAL);

  processNewReviews(fastify.log);
};

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`Server is running on http://${HOST}:${PORT}`);

    startAIProcessor();
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
