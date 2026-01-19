"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const fastify_1 = __importDefault(require("fastify"));
const health_js_1 = require("./routes/health.js");
const webhook_js_1 = require("./routes/webhook.js");
const auth_js_1 = require("./routes/auth.js");
const weeklyReport_js_1 = require("./routes/weeklyReport.js");
const aiProcessor_js_1 = require("./services/aiProcessor.js");
const weeklyReportScheduler_js_1 = require("./services/weeklyReportScheduler.js");
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';
const AI_BATCH_INTERVAL = parseInt(process.env.AI_BATCH_INTERVAL || '300000', 10);
const fastify = (0, fastify_1.default)({
    logger: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport: process.env.NODE_ENV !== 'production'
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
fastify.register(health_js_1.healthRoute);
fastify.register(webhook_js_1.webhookRoute);
fastify.register(auth_js_1.authRoute);
fastify.register(weeklyReport_js_1.weeklyReportRoute);
const startAIProcessor = () => {
    if (!process.env.OPENAI_API_KEY) {
        fastify.log.warn('OPENAI_API_KEY not set, AI processing disabled');
        return;
    }
    fastify.log.info({ msg: 'AI processor started', interval_ms: AI_BATCH_INTERVAL });
    setInterval(async () => {
        await (0, aiProcessor_js_1.processNewReviews)(fastify.log);
    }, AI_BATCH_INTERVAL);
    (0, aiProcessor_js_1.processNewReviews)(fastify.log);
};
const start = async () => {
    try {
        await fastify.listen({ port: PORT, host: HOST });
        console.log(`Server is running on http://${HOST}:${PORT}`);
        startAIProcessor();
        (0, weeklyReportScheduler_js_1.startWeeklyReportScheduler)(fastify.log);
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=index.js.map