import { google, Auth } from 'googleapis';

let authClient: Auth.OAuth2Client | null = null;

export function getGoogleAuth(): Auth.OAuth2Client {
  if (authClient) {
    return authClient;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required');
  }

  if (!refreshToken) {
    throw new Error(
      'GOOGLE_REFRESH_TOKEN is not set. Run "npm run get-token" to generate one.'
    );
  }

  authClient = new google.auth.OAuth2(clientId, clientSecret);
  authClient.setCredentials({
    refresh_token: refreshToken,
  });

  return authClient;
}

export function getDriveClient() {
  return google.drive({ version: 'v3', auth: getGoogleAuth() });
}

export function getSheetsClient() {
  return google.sheets({ version: 'v4', auth: getGoogleAuth() });
}
