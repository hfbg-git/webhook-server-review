"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoute = authRoute;
const googleapis_1 = require("googleapis");
const SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/spreadsheets',
];
async function authRoute(fastify) {
    // OAuth 시작 - 이 URL로 접속하면 Google 로그인 페이지로 이동
    fastify.get('/auth', async (request, reply) => {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
            return reply.status(500).send({ error: 'GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set' });
        }
        // Render URL 또는 localhost
        const host = request.headers.host || 'localhost:3000';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const redirectUri = `${protocol}://${host}/auth/callback`;
        const oauth2Client = new googleapis_1.google.auth.OAuth2(clientId, clientSecret, redirectUri);
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            prompt: 'consent',
        });
        return reply.redirect(authUrl);
    });
    // OAuth 콜백 - Google에서 인증 후 여기로 리디렉션
    fastify.get('/auth/callback', async (request, reply) => {
        const { code } = request.query;
        if (!code) {
            return reply.status(400).send({ error: 'No authorization code provided' });
        }
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
            return reply.status(500).send({ error: 'GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set' });
        }
        const host = request.headers.host || 'localhost:3000';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const redirectUri = `${protocol}://${host}/auth/callback`;
        const oauth2Client = new googleapis_1.google.auth.OAuth2(clientId, clientSecret, redirectUri);
        try {
            const { tokens } = await oauth2Client.getToken(code);
            // Refresh Token을 화면에 표시
            return reply.type('text/html').send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Refresh Token 발급 완료</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #333; }
            .token-box { background: #e8f5e9; padding: 20px; border-radius: 5px; word-break: break-all; margin: 20px 0; }
            .label { font-weight: bold; color: #666; margin-bottom: 10px; }
            .warning { background: #fff3e0; padding: 15px; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Refresh Token 발급 완료!</h1>

            <div class="label">GOOGLE_REFRESH_TOKEN:</div>
            <div class="token-box">${tokens.refresh_token || '(이미 발급된 토큰이 있어 새 토큰이 생성되지 않았습니다)'}</div>

            <div class="warning">
              <strong>⚠️ 중요:</strong> 이 토큰을 복사해서 Render 환경변수에 GOOGLE_REFRESH_TOKEN으로 저장하세요.
              <br><br>
              이 페이지를 닫으면 토큰을 다시 볼 수 없습니다!
            </div>
          </div>
        </body>
        </html>
      `);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            fastify.log.error({ msg: 'Failed to get tokens', error: errorMessage });
            return reply.status(500).send({ error: 'Failed to get tokens', details: errorMessage });
        }
    });
}
//# sourceMappingURL=auth.js.map