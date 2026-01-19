"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadBrandCache = loadBrandCache;
exports.getStandardBrandName = getStandardBrandName;
exports.getStandardBrandNameSync = getStandardBrandNameSync;
exports.isCacheLoaded = isCacheLoaded;
exports.seedInitialBrands = seedInitialBrands;
const googleAuth_js_1 = require("./googleAuth.js");
const BRAND_REGISTRY_TAB = 'BrandRegistry';
const RAW_SHEET_NAME_PREFIX = process.env.RAW_SHEET_NAME_PREFIX || 'ReviewDoctor_Raw_';
// 메모리 캐시 (서버 시작 시 로드)
let brandCache = new Map();
let cacheLoaded = false;
// 현재 월 스프레드시트 ID 캐시
let currentSheetId = null;
/**
 * 공백 제거하여 정규화 키 생성
 */
function normalizeKey(brandName) {
    return brandName.replace(/\s+/g, '');
}
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
    // 폴더에서 시트 찾기
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
 * BrandRegistry 탭이 있는지 확인하고 없으면 생성
 */
async function ensureRegistryTab(spreadsheetId) {
    const sheets = (0, googleAuth_js_1.getSheetsClient)();
    // 기존 탭 확인
    const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'sheets.properties.title',
    });
    const existingTabs = spreadsheet.data.sheets?.map((s) => s.properties?.title) || [];
    if (existingTabs.includes(BRAND_REGISTRY_TAB)) {
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
                            title: BRAND_REGISTRY_TAB,
                        },
                    },
                },
            ],
        },
    });
    // 헤더 추가
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${BRAND_REGISTRY_TAB}!A1:D1`,
        valueInputOption: 'RAW',
        requestBody: {
            values: [['normalized_key', 'standard_name', 'first_seen', 'aliases']],
        },
    });
}
/**
 * 레지스트리에서 브랜드 찾기
 */
async function findInRegistry(spreadsheetId, normalizedKey) {
    const sheets = (0, googleAuth_js_1.getSheetsClient)();
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${BRAND_REGISTRY_TAB}!A:B`,
        });
        const rows = response.data.values || [];
        for (let i = 1; i < rows.length; i++) {
            if (rows[i][0] === normalizedKey) {
                return rows[i][1] || null;
            }
        }
    }
    catch {
        // 탭이 없을 수 있음
    }
    return null;
}
/**
 * 새 브랜드 등록
 */
async function registerBrand(spreadsheetId, normalizedKey, standardName) {
    const sheets = (0, googleAuth_js_1.getSheetsClient)();
    const now = new Date().toISOString().split('T')[0];
    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${BRAND_REGISTRY_TAB}!A:D`,
        valueInputOption: 'RAW',
        requestBody: {
            values: [[normalizedKey, standardName, now, standardName]],
        },
    });
}
/**
 * 별칭 업데이트 (기존 브랜드에 새 변형 추가)
 */
async function updateAliases(spreadsheetId, normalizedKey, newAlias) {
    const sheets = (0, googleAuth_js_1.getSheetsClient)();
    // 기존 데이터 찾기
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${BRAND_REGISTRY_TAB}!A:D`,
    });
    const rows = response.data.values || [];
    for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === normalizedKey) {
            const existingAliases = rows[i][3] || '';
            if (!existingAliases.includes(newAlias)) {
                const newAliases = existingAliases ? `${existingAliases}, ${newAlias}` : newAlias;
                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: `${BRAND_REGISTRY_TAB}!D${i + 1}`,
                    valueInputOption: 'RAW',
                    requestBody: {
                        values: [[newAliases]],
                    },
                });
            }
            break;
        }
    }
}
/**
 * 브랜드 레지스트리 캐시 로드
 */
async function loadBrandCache() {
    try {
        const spreadsheetId = await getCurrentSheetId();
        await ensureRegistryTab(spreadsheetId);
        const sheets = (0, googleAuth_js_1.getSheetsClient)();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${BRAND_REGISTRY_TAB}!A:B`,
        });
        const rows = response.data.values || [];
        brandCache.clear();
        for (let i = 1; i < rows.length; i++) {
            const key = rows[i][0];
            const standardName = rows[i][1];
            if (key && standardName) {
                brandCache.set(key, standardName);
            }
        }
        cacheLoaded = true;
        console.log(`Brand registry loaded: ${brandCache.size} brands`);
    }
    catch (error) {
        console.warn('Failed to load brand registry, will use fallback:', error.message);
        cacheLoaded = true; // 실패해도 진행
    }
}
/**
 * 표준 브랜드명 조회/등록
 * @param rawBrandName 원본 브랜드명 (지점명, 플랫폼 제거 후)
 * @returns 표준화된 브랜드명
 */
async function getStandardBrandName(rawBrandName) {
    if (!rawBrandName)
        return '';
    const key = normalizeKey(rawBrandName);
    // 캐시에서 먼저 검색
    if (brandCache.has(key)) {
        return brandCache.get(key);
    }
    try {
        const spreadsheetId = await getCurrentSheetId();
        await ensureRegistryTab(spreadsheetId);
        // 시트에서 검색
        const existing = await findInRegistry(spreadsheetId, key);
        if (existing) {
            brandCache.set(key, existing);
            // 새 변형이면 별칭에 추가
            await updateAliases(spreadsheetId, key, rawBrandName);
            return existing;
        }
        // 새 브랜드 등록 (첫 입력 형태를 표준으로)
        await registerBrand(spreadsheetId, key, rawBrandName);
        brandCache.set(key, rawBrandName);
        console.log(`New brand registered: ${rawBrandName} (key: ${key})`);
        return rawBrandName;
    }
    catch (error) {
        console.warn('Brand registry error, using raw name:', error.message);
        return rawBrandName;
    }
}
/**
 * 캐시에서 동기적으로 조회 (캐시 미스 시 원본 반환)
 * 주간 리포트처럼 대량 처리 시 사용
 */
function getStandardBrandNameSync(rawBrandName) {
    if (!rawBrandName)
        return '';
    const key = normalizeKey(rawBrandName);
    return brandCache.get(key) || rawBrandName;
}
/**
 * 캐시 로드 여부 확인
 */
function isCacheLoaded() {
    return cacheLoaded;
}
/**
 * 초기 브랜드 데이터 시딩 (1회성)
 */
async function seedInitialBrands() {
    const INITIAL_BRANDS = [
        { key: '튀긴치킨싫어서구운치킨만파는집', standard: '튀긴치킨 싫어서 구운치킨만 파는 집' },
        { key: '행복한찜닭', standard: '행복한 찜닭' },
        { key: '화락바베큐치킨', standard: '화락바베큐치킨' },
        { key: '화락숯불바베큐치킨', standard: '화락바베큐치킨' },
    ];
    try {
        const spreadsheetId = await getCurrentSheetId();
        await ensureRegistryTab(spreadsheetId);
        for (const brand of INITIAL_BRANDS) {
            const existing = await findInRegistry(spreadsheetId, brand.key);
            if (!existing) {
                await registerBrand(spreadsheetId, brand.key, brand.standard);
                brandCache.set(brand.key, brand.standard);
                console.log(`Seeded brand: ${brand.standard}`);
            }
        }
    }
    catch (error) {
        console.error('Failed to seed initial brands:', error.message);
    }
}
//# sourceMappingURL=brandRegistry.js.map