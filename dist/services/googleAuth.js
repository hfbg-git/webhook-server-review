"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGoogleAuth = getGoogleAuth;
exports.getDriveClient = getDriveClient;
exports.getSheetsClient = getSheetsClient;
const googleapis_1 = require("googleapis");
let authClient = null;
function getGoogleAuth() {
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
        throw new Error('GOOGLE_REFRESH_TOKEN is not set. Run "npm run get-token" to generate one.');
    }
    authClient = new googleapis_1.google.auth.OAuth2(clientId, clientSecret);
    authClient.setCredentials({
        refresh_token: refreshToken,
    });
    return authClient;
}
function getDriveClient() {
    return googleapis_1.google.drive({ version: 'v3', auth: getGoogleAuth() });
}
function getSheetsClient() {
    return googleapis_1.google.sheets({ version: 'v4', auth: getGoogleAuth() });
}
//# sourceMappingURL=googleAuth.js.map