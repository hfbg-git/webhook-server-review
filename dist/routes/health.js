"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoute = healthRoute;
async function healthRoute(fastify) {
    fastify.get('/health', async (_request, _reply) => {
        return { ok: true };
    });
}
//# sourceMappingURL=health.js.map