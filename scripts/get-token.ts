import { google } from 'googleapis';
import * as http from 'http';
import * as url from 'url';
import 'dotenv/config';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3001/oauth2callback';

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
];

async function main() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('Error: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env file');
    console.log('\n1. Go to https://console.cloud.google.com/apis/credentials');
    console.log('2. Create OAuth 2.0 Client ID (Desktop app or Web application)');
    console.log('3. Add http://localhost:3001/oauth2callback to Authorized redirect URIs');
    console.log('4. Copy Client ID and Client Secret to .env file');
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  console.log('\n=== Google OAuth Token Generator ===\n');
  console.log('1. Open this URL in your browser:\n');
  console.log(authUrl);
  console.log('\n2. Waiting for authorization...\n');

  const server = http.createServer(async (req, res) => {
    if (req.url?.startsWith('/oauth2callback')) {
      const parsedUrl = url.parse(req.url, true);
      const code = parsedUrl.query.code as string;

      if (code) {
        try {
          const { tokens } = await oauth2Client.getToken(code);

          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`
            <html>
              <body style="font-family: sans-serif; padding: 40px; text-align: center;">
                <h1>✅ 인증 성공!</h1>
                <p>터미널에서 GOOGLE_REFRESH_TOKEN을 확인하세요.</p>
                <p>이 창은 닫아도 됩니다.</p>
              </body>
            </html>
          `);

          console.log('=== Success! ===\n');
          console.log('Add this to your .env file:\n');
          console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);

          server.close();
          process.exit(0);
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Error getting token');
          console.error('Error:', error);
          server.close();
          process.exit(1);
        }
      }
    }
  });

  server.listen(3001, () => {
    console.log('OAuth callback server listening on http://localhost:3001');
  });
}

main();
