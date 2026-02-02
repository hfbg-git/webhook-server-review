"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadNotificationConfigCache = loadNotificationConfigCache;
exports.getNotificationConfig = getNotificationConfig;
exports.getAllNotificationConfigs = getAllNotificationConfigs;
exports.isConfigCacheLoaded = isConfigCacheLoaded;
const googleAuth_js_1 = require("./googleAuth.js");
const NOTIFICATION_CONFIG_TAB = 'NotificationConfig';
const RAW_SHEET_NAME_PREFIX = process.env.RAW_SHEET_NAME_PREFIX || 'ReviewDoctor_Raw_';
// 메모리 캐시
let configCache = new Map();
let cacheLoaded = false;
// 현재 월 스프레드시트 ID 캐시
let currentSheetId = null;
/**
 * 현재 월의 스프레드시트 ID 가져오기
 */
async function getCurrentSheetId() {
    if (currentSheetId)
        return currentSheetId;
    const sheets = (0, googleAuth_js_1.getSheetsClient)();
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const sheetName = `${RAW_SHEET_NAME_PREFIX}${year}_${month}`;
    const { google } = await import('googleapis');
    const drive = google.drive({ version: 'v3', auth: sheets.context._options.auth });
    const folderId = process.env.RAW_SHEETS_FOLDER_ID;
    const response = await drive.files.list({
        q: `name='${sheetName}' and '${folderId}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
        fields: 'files(id)',
        spaces: 'drive',
    });
    const files = response.data.files || [];
    if (files.length > 0 && files[0].id) {
        currentSheetId = files[0].id;
        return currentSheetId;
    }
    throw new Error(`Spreadsheet not found: ${sheetName}`);
}
/**
 * NotificationConfig 탭 확인 및 생성
 */
async function ensureNotificationConfigTab(spreadsheetId) {
    const sheets = (0, googleAuth_js_1.getSheetsClient)();
    const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'sheets.properties.title',
    });
    const existingTabs = spreadsheet.data.sheets?.map((s) => s.properties?.title) || [];
    if (existingTabs.includes(NOTIFICATION_CONFIG_TAB)) {
        return;
    }
    // 탭 생성
    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests: [
                {
                    addSheet: {
                        properties: {
                            title: NOTIFICATION_CONFIG_TAB,
                        },
                    },
                },
            ],
        },
    });
    // 헤더 추가
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${NOTIFICATION_CONFIG_TAB}!A1:D1`,
        valueInputOption: 'RAW',
        requestBody: {
            values: [['brand_name', 'jandi_webhook_url', 'enabled', 'notification_level']],
        },
    });
}
/**
 * 알림 설정 캐시 로드
 */
async function loadNotificationConfigCache(forceReload = false) {
    if (cacheLoaded && !forceReload) {
        return;
    }
    try {
        const spreadsheetId = await getCurrentSheetId();
        await ensureNotificationConfigTab(spreadsheetId);
        const sheets = (0, googleAuth_js_1.getSheetsClient)();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${NOTIFICATION_CONFIG_TAB}!A:D`,
        });
        const rows = response.data.values || [];
        configCache.clear();
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row[0] && row[1]) {
                const config = {
                    brandName: row[0],
                    jandiWebhookUrl: row[1],
                    enabled: row[2]?.toUpperCase() === 'TRUE',
                    notificationLevel: row[3] || 'all',
                };
                configCache.set(config.brandName, config);
            }
        }
        cacheLoaded = true;
        console.log(`Notification config loaded: ${configCache.size} brands`);
    }
    catch (error) {
        console.warn('Failed to load notification config:', error.message);
        cacheLoaded = true;
    }
}
/**
 * 브랜드별 알림 설정 조회
 */
async function getNotificationConfig(brandName) {
    if (!cacheLoaded) {
        await loadNotificationConfigCache();
    }
    // 정확한 매칭 먼저 시도
    if (configCache.has(brandName)) {
        const config = configCache.get(brandName);
        return config.enabled ? config : null;
    }
    // 공백 제거 후 매칭 시도
    const normalizedBrandName = brandName.replace(/\s/g, '');
    for (const [key, config] of configCache.entries()) {
        const normalizedKey = key.replace(/\s/g, '');
        if (normalizedKey === normalizedBrandName ||
            normalizedBrandName.startsWith(normalizedKey.slice(0, 3)) ||
            normalizedKey.startsWith(normalizedBrandName.slice(0, 3))) {
            return config.enabled ? config : null;
        }
    }
    return null;
}
/**
 * 전체 알림 설정 목록 조회
 */
async function getAllNotificationConfigs() {
    if (!cacheLoaded) {
        await loadNotificationConfigCache();
    }
    return Array.from(configCache.values()).filter(c => c.enabled);
}
/**
 * 캐시 로드 여부 확인
 */
function isConfigCacheLoaded() {
    return cacheLoaded;
}
//# sourceMappingURL=notificationConfigService.js.map