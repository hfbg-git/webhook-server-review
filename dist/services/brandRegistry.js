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
 * 앞 3글자 키 생성 (공백 제거 후)
 */
function getPrefix3Key(brandName) {
    const noSpace = brandName.replace(/\s+/g, '');
    return noSpace.slice(0, 3);
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
 * 레지스트리에서 브랜드 찾기 (정확한 키 매칭)
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
 * 레지스트리에서 앞 3글자로 브랜드 찾기
 */
async function findInRegistryByPrefix(spreadsheetId, prefix) {
    const sheets = (0, googleAuth_js_1.getSheetsClient)();
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${BRAND_REGISTRY_TAB}!A:B`,
        });
        const rows = response.data.values || [];
        for (let i = 1; i < rows.length; i++) {
            const key = rows[i][0];
            if (key && key.slice(0, 3) === prefix) {
                return { key, standard: rows[i][1] || key };
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
 * @param forceReload true면 캐시 상태와 무관하게 다시 로드
 */
async function loadBrandCache(forceReload = false) {
    // 이미 로드됐고 강제 리로드 아니면 스킵
    if (cacheLoaded && !forceReload) {
        return;
    }
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
        // 시트가 없어서 실패한 경우에도 빈 캐시로 진행
        // 첫 웹훅 수신 시 getStandardBrandName()에서 탭 생성됨
        cacheLoaded = true;
    }
}
/**
 * 표준 브랜드명 조회/등록 (앞 3글자 매칭)
 * @param rawBrandName 원본 브랜드명 (지점명, 플랫폼 제거 후)
 * @returns 표준화된 브랜드명
 */
async function getStandardBrandName(rawBrandName) {
    if (!rawBrandName)
        return '';
    const key = normalizeKey(rawBrandName);
    const prefix = getPrefix3Key(rawBrandName);
    // 캐시에서 앞 3글자가 같은 브랜드 찾기 (공백 제거 후 비교)
    for (const [cachedKey, standard] of brandCache.entries()) {
        const cachedPrefix = getPrefix3Key(cachedKey);
        if (cachedPrefix === prefix) {
            // 새 변형이면 별칭에 추가 (비동기)
            if (cachedKey !== key) {
                try {
                    const spreadsheetId = await getCurrentSheetId();
                    await updateAliases(spreadsheetId, cachedKey, rawBrandName);
                }
                catch {
                    // 별칭 업데이트 실패해도 무시
                }
            }
            return standard;
        }
    }
    try {
        const spreadsheetId = await getCurrentSheetId();
        await ensureRegistryTab(spreadsheetId);
        // 시트에서 앞 3글자 매칭으로 검색
        const existing = await findInRegistryByPrefix(spreadsheetId, prefix);
        if (existing) {
            brandCache.set(existing.key, existing.standard);
            // 새 변형이면 별칭에 추가
            if (existing.key !== key) {
                await updateAliases(spreadsheetId, existing.key, rawBrandName);
            }
            return existing.standard;
        }
        // 새 브랜드 등록 (공백 제거한 형태를 표준으로)
        const normalizedName = normalizeKey(rawBrandName);
        await registerBrand(spreadsheetId, key, normalizedName);
        brandCache.set(key, normalizedName);
        console.log(`New brand registered: ${normalizedName} (key: ${key}, prefix: ${prefix})`);
        return normalizedName;
    }
    catch (error) {
        console.warn('Brand registry error, using normalized name:', error.message);
        return normalizeKey(rawBrandName);
    }
}
/**
 * 캐시에서 동기적으로 조회 (앞 3글자 매칭)
 * 주간 리포트처럼 대량 처리 시 사용
 */
function getStandardBrandNameSync(rawBrandName) {
    if (!rawBrandName)
        return '';
    const normalizedName = normalizeKey(rawBrandName); // 공백 제거
    const prefix = getPrefix3Key(rawBrandName);
    // 캐시에서 앞 3글자가 같은 브랜드 찾기 (공백 제거 후 비교)
    for (const [key, standard] of brandCache.entries()) {
        const keyPrefix = getPrefix3Key(key);
        if (keyPrefix === prefix) {
            return standard;
        }
    }
    // 캐시에 없으면 공백 제거한 정규화된 이름 반환
    return normalizedName;
}
/**
 * 캐시 로드 여부 확인
 */
function isCacheLoaded() {
    return cacheLoaded;
}
/**
 * 초기 브랜드 데이터 시딩 (1회성)
 *
 * 앞 3글자 매칭으로 대부분 자동 처리되므로,
 * 앞 3글자가 다르지만 같은 브랜드인 경우만 수동 등록 필요
 */
async function seedInitialBrands() {
    // 앞 3글자 매칭으로 해결 안 되는 브랜드 수동 매핑
    const INITIAL_BRANDS = [
        // 문화치킨 / 문화통닭 → 앞3글자 '문화치' vs '문화통' 다름
        { key: '문화통닭', standard: '문화치킨' },
        // 화락바베큐치킨 / 화락숯불바베큐치킨 → 앞3글자 '화락바' vs '화락숯' 다름
        { key: '화락숯불바베큐치킨', standard: '화락바베큐치킨' },
        // 치포킹 변형들 → 모두 "치포킹"으로 통일
        { key: '치포킹-치킨과포테이토의킹왕짱콜라보', standard: '치포킹' },
        { key: '치포킹-치킨과포테이토의킹황짱콜라보', standard: '치포킹' },
        { key: '치포킹치킨과포테이토의킹왕짱콜라보', standard: '치포킹' },
        { key: '치포킹치킨과포테이토의킹황짱콜라보', standard: '치포킹' },
        { key: '치포킹-치킨과포테이토의킹왕짱콜라보', standard: '치포킹' },
        // 대박삼겹 오타 (삼겹 vs 삼겹살)
        { key: '대박삼겹살김치찜&초대박등갈비김치찜', standard: '대박삼겹김치찜&초대박등갈비김치찜' },
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