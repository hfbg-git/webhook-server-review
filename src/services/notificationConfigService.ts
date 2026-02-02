import { getSheetsClient } from './googleAuth.js';
import { NotificationConfig } from '../types/index.js';
import { getOrCreateMonthlySpreadsheet } from './driveService.js';
import { ensureNotificationConfigTab } from './sheetsService.js';

const NOTIFICATION_CONFIG_TAB = 'NotificationConfig';

// 메모리 캐시
let configCache: Map<string, NotificationConfig> = new Map();
let cacheLoaded = false;

/**
 * 알림 설정 캐시 로드
 */
export async function loadNotificationConfigCache(forceReload = false): Promise<void> {
  if (cacheLoaded && !forceReload) {
    return;
  }

  try {
    // driveService의 검증된 함수 재사용
    const { spreadsheetId } = await getOrCreateMonthlySpreadsheet();

    // sheetsService의 함수 사용하여 탭 생성
    await ensureNotificationConfigTab(spreadsheetId);

    const sheets = getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${NOTIFICATION_CONFIG_TAB}!A:D`,
    });

    const rows = response.data.values || [];
    configCache.clear();

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row[0] && row[1]) {
        const config: NotificationConfig = {
          brandName: row[0],
          jandiWebhookUrl: row[1],
          enabled: row[2]?.toUpperCase() === 'TRUE',
          notificationLevel: (row[3] as 'all' | 'summary' | 'url_only') || 'all',
        };
        configCache.set(config.brandName, config);
      }
    }

    cacheLoaded = true;
    console.log(`Notification config loaded: ${configCache.size} brands`);
  } catch (error) {
    console.warn('Failed to load notification config:', (error as Error).message);
    cacheLoaded = true;
  }
}

/**
 * 브랜드별 알림 설정 조회
 */
export async function getNotificationConfig(brandName: string): Promise<NotificationConfig | null> {
  if (!cacheLoaded) {
    await loadNotificationConfigCache();
  }

  // 정확한 매칭 먼저 시도
  if (configCache.has(brandName)) {
    const config = configCache.get(brandName)!;
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
export async function getAllNotificationConfigs(): Promise<NotificationConfig[]> {
  if (!cacheLoaded) {
    await loadNotificationConfigCache();
  }

  return Array.from(configCache.values()).filter(c => c.enabled);
}

/**
 * 캐시 로드 여부 확인
 */
export function isConfigCacheLoaded(): boolean {
  return cacheLoaded;
}
