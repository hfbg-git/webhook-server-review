import { NotificationConfig } from '../types/index.js';
/**
 * 알림 설정 캐시 로드
 */
export declare function loadNotificationConfigCache(forceReload?: boolean): Promise<void>;
/**
 * 브랜드별 알림 설정 조회
 */
export declare function getNotificationConfig(brandName: string): Promise<NotificationConfig | null>;
/**
 * 전체 알림 설정 목록 조회
 */
export declare function getAllNotificationConfigs(): Promise<NotificationConfig[]>;
/**
 * 캐시 로드 여부 확인
 */
export declare function isConfigCacheLoaded(): boolean;
//# sourceMappingURL=notificationConfigService.d.ts.map