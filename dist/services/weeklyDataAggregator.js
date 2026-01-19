"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLastWeekRange = getLastWeekRange;
exports.getWeekRangeForDate = getWeekRangeForDate;
exports.getWeeklyReviewData = getWeeklyReviewData;
exports.groupByBrand = groupByBrand;
exports.aggregateBrandWeeklyData = aggregateBrandWeeklyData;
const googleAuth_js_1 = require("./googleAuth.js");
const googleAuth_js_2 = require("./googleAuth.js");
const ROOT_FOLDER_ID = process.env.RAW_SHEETS_FOLDER_ID || '';
const SHEET_PREFIX = process.env.RAW_SHEET_NAME_PREFIX || 'ReviewDoctor_Raw_';
const REVIEWS_TAB = 'Reviews';
/**
 * 지난 주 월요일 00:00:00 ~ 일요일 23:59:59 (KST) 기간 계산
 */
function getLastWeekRange() {
    const now = new Date();
    const koreaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    // 현재 요일 (0=일, 1=월, ..., 6=토)
    const dayOfWeek = koreaTime.getDay();
    // 지난 주 월요일 계산
    // 월요일 = 1, 현재가 월요일이면 7일 전
    const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1 + 7;
    const lastMonday = new Date(koreaTime);
    lastMonday.setDate(koreaTime.getDate() - daysToLastMonday);
    lastMonday.setHours(0, 0, 0, 0);
    // 지난 주 일요일 (월요일 + 6일)
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    lastSunday.setHours(23, 59, 59, 999);
    const formatDate = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const weekLabel = `${formatDate(lastMonday)}_${formatDate(lastSunday)}`;
    return { startDate: lastMonday, endDate: lastSunday, weekLabel };
}
/**
 * 특정 기간의 주간 범위 계산 (테스트용)
 */
function getWeekRangeForDate(targetDate) {
    const koreaTime = new Date(targetDate.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const dayOfWeek = koreaTime.getDay();
    // 해당 주의 월요일 계산
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(koreaTime);
    monday.setDate(koreaTime.getDate() - daysToMonday);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    const formatDate = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const weekLabel = `${formatDate(monday)}_${formatDate(sunday)}`;
    return { startDate: monday, endDate: sunday, weekLabel };
}
/**
 * 해당 기간에 관련된 월별 스프레드시트 ID 목록 조회
 */
async function getSpreadsheetIdsForDateRange(startDate, endDate) {
    const drive = (0, googleAuth_js_2.getDriveClient)();
    const spreadsheetIds = [];
    // 시작 월과 종료 월 계산
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth() + 1;
    const endYear = endDate.getFullYear();
    const endMonth = endDate.getMonth() + 1;
    // 관련된 모든 월 순회
    let year = startYear;
    let month = startMonth;
    while (year < endYear || (year === endYear && month <= endMonth)) {
        const yearStr = String(year);
        const monthStr = String(month).padStart(2, '0');
        const sheetName = `${SHEET_PREFIX}${year}_${monthStr}`;
        // 연도 폴더 찾기
        const yearFolderResponse = await drive.files.list({
            q: `name='${yearStr}' and '${ROOT_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id)',
            spaces: 'drive',
        });
        const yearFolder = yearFolderResponse.data.files?.[0];
        if (yearFolder?.id) {
            // 월 폴더 찾기
            const monthFolderResponse = await drive.files.list({
                q: `name='${monthStr}' and '${yearFolder.id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                fields: 'files(id)',
                spaces: 'drive',
            });
            const monthFolder = monthFolderResponse.data.files?.[0];
            if (monthFolder?.id) {
                // 스프레드시트 찾기
                const sheetResponse = await drive.files.list({
                    q: `name='${sheetName}' and '${monthFolder.id}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
                    fields: 'files(id)',
                    spaces: 'drive',
                });
                const sheet = sheetResponse.data.files?.[0];
                if (sheet?.id) {
                    spreadsheetIds.push(sheet.id);
                }
            }
        }
        // 다음 월로 이동
        month++;
        if (month > 12) {
            month = 1;
            year++;
        }
    }
    return spreadsheetIds;
}
/**
 * 한국 시간 문자열을 Date 객체로 변환
 */
function parseKoreanDate(dateStr) {
    if (!dateStr)
        return null;
    // 형식: "2025. 1. 7. 오후 2:23:45" 또는 "2025-01-07T14:23:45"
    try {
        // ISO 형식 시도
        if (dateStr.includes('T') || dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
            return new Date(dateStr);
        }
        // 한국어 형식 파싱
        const match = dateStr.match(/(\d+)\.\s*(\d+)\.\s*(\d+)\.\s*(오전|오후)\s*(\d+):(\d+):?(\d+)?/);
        if (match) {
            const [, year, month, day, ampm, hour, minute, second = '0'] = match;
            let h = parseInt(hour, 10);
            if (ampm === '오후' && h !== 12)
                h += 12;
            if (ampm === '오전' && h === 12)
                h = 0;
            return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), h, parseInt(minute, 10), parseInt(second, 10));
        }
        return new Date(dateStr);
    }
    catch {
        return null;
    }
}
/**
 * brand_name에서 순수 브랜드명 추출
 * 예: "화락바베큐치킨 원주단구점_배달의민족" → "화락바베큐치킨"
 * 예: "튀긴치킨 싫어서 구운치킨만 파는 집 세종종촌점_쿠팡" → "튀긴치킨 싫어서 구운치킨만 파는 집"
 * 예: "튀긴치킨싫어서구운치킨만파는집-세종종촌점" → "튀긴치킨싫어서구운치킨만파는집"
 */
function extractPureBrandName(rawBrandName) {
    if (!rawBrandName)
        return '';
    // 1. 먼저 _플랫폼 제거 (예: _배달의민족, _쿠팡)
    let brandName = rawBrandName.split('_')[0].trim();
    // 2. 지점명 패턴 제거
    // 패턴 A: "공백 + 지점명 + 점/지점" (예: " 원주단구점", " 세종종촌지점")
    // 패턴 B: "-지점명 + 점/지점" (예: "-세종종촌점", "-강남점")
    const patterns = [
        /\s+[\w가-힣]+점$/, // 공백 + OO점
        /\s+[\w가-힣]+지점$/, // 공백 + OO지점
        /-[\w가-힣]+점$/, // -OO점
        /-[\w가-힣]+지점$/, // -OO지점
    ];
    for (const pattern of patterns) {
        if (pattern.test(brandName)) {
            brandName = brandName.replace(pattern, '').trim();
            break;
        }
    }
    return brandName;
}
/**
 * 스프레드시트에서 리뷰 데이터 조회
 */
async function getReviewsFromSheet(spreadsheetId) {
    const sheets = (0, googleAuth_js_1.getSheetsClient)();
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${REVIEWS_TAB}!A2:O`,
    });
    const rows = response.data.values || [];
    const reviews = [];
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0)
            continue;
        // AI 처리가 완료된 리뷰만 (status가 DONE인 것)
        const status = row[8] || '';
        if (status !== 'DONE')
            continue;
        // WeeklyData JSON 파싱
        let weeklyData = null;
        try {
            if (row[12]) {
                weeklyData = JSON.parse(row[12]);
            }
        }
        catch {
            // JSON 파싱 실패 시 null 유지
        }
        // 키워드 파싱
        let keywords = [];
        if (row[11]) {
            keywords = row[11].split(',').map((k) => k.trim()).filter(Boolean);
        }
        // 순수 브랜드명 추출 (지점명, 플랫폼 제거)
        const pureBrandName = extractPureBrandName(row[2] || '');
        reviews.push({
            receivedAt: row[0] || '',
            reviewCreatedAt: row[1] || '',
            brandName: pureBrandName,
            storeName: row[3] || '',
            platform: row[4] || '',
            rating: parseFloat(row[5]) || 0,
            reviewId: row[6] || '',
            reviewText: row[7] || '',
            status,
            sentiment: row[9] || '중립',
            summary: row[10] || '',
            keywords,
            weeklyData,
            processedAt: row[13] || '',
            aiStatus: row[14] || '',
            rowIndex: i + 2,
        });
    }
    return reviews;
}
/**
 * 해당 기간의 리뷰 데이터 조회
 */
async function getWeeklyReviewData(startDate, endDate) {
    const spreadsheetIds = await getSpreadsheetIdsForDateRange(startDate, endDate);
    const allReviews = [];
    for (const spreadsheetId of spreadsheetIds) {
        const reviews = await getReviewsFromSheet(spreadsheetId);
        // 기간 필터링
        const filteredReviews = reviews.filter((review) => {
            const reviewDate = parseKoreanDate(review.receivedAt);
            if (!reviewDate)
                return false;
            return reviewDate >= startDate && reviewDate <= endDate;
        });
        allReviews.push(...filteredReviews);
    }
    return allReviews;
}
/**
 * 브랜드별로 리뷰 그룹화
 */
function groupByBrand(reviews) {
    const brandMap = new Map();
    for (const review of reviews) {
        const brand = review.brandName;
        if (!brandMap.has(brand)) {
            brandMap.set(brand, []);
        }
        brandMap.get(brand).push(review);
    }
    return brandMap;
}
/**
 * 감정 분포 계산
 */
function calculateSentimentDistribution(reviews) {
    const counts = { positive: 0, negative: 0, neutral: 0 };
    for (const review of reviews) {
        switch (review.sentiment) {
            case '긍정':
                counts.positive++;
                break;
            case '부정':
                counts.negative++;
                break;
            case '중립':
                counts.neutral++;
                break;
        }
    }
    const total = reviews.length || 1;
    const formatPercent = (n) => `${((n / total) * 100).toFixed(1)}%`;
    return {
        positive: counts.positive,
        negative: counts.negative,
        neutral: counts.neutral,
        positiveRate: formatPercent(counts.positive),
        negativeRate: formatPercent(counts.negative),
        neutralRate: formatPercent(counts.neutral),
    };
}
/**
 * 키워드 통계 계산
 */
function calculateKeywordStats(reviews, lastWeekKeywords) {
    const keywordMap = new Map();
    for (const review of reviews) {
        for (const keyword of review.keywords) {
            const normalized = keyword.trim();
            if (!normalized)
                continue;
            if (!keywordMap.has(normalized)) {
                keywordMap.set(normalized, { count: 0, positive: 0, negative: 0, neutral: 0 });
            }
            const stat = keywordMap.get(normalized);
            stat.count++;
            switch (review.sentiment) {
                case '긍정':
                    stat.positive++;
                    break;
                case '부정':
                    stat.negative++;
                    break;
                case '중립':
                    stat.neutral++;
                    break;
            }
        }
    }
    // 키워드 정렬 (빈도순)
    const sortedKeywords = Array.from(keywordMap.entries()).sort((a, b) => b[1].count - a[1].count);
    return sortedKeywords.map(([keyword, stat]) => {
        const mainSentiment = stat.positive >= stat.negative && stat.positive >= stat.neutral
            ? '긍정'
            : stat.negative >= stat.neutral
                ? '부정'
                : '중립';
        const mainCount = mainSentiment === '긍정'
            ? stat.positive
            : mainSentiment === '부정'
                ? stat.negative
                : stat.neutral;
        const sentimentRatio = `${Math.round((mainCount / stat.count) * 100)}% ${mainSentiment}`;
        // 지난주 대비 트렌드
        let trendVsLastWeek = '- 0';
        if (lastWeekKeywords) {
            const lastWeekCount = lastWeekKeywords.get(keyword) || 0;
            const diff = stat.count - lastWeekCount;
            if (diff > 0) {
                trendVsLastWeek = `▲ +${diff}`;
            }
            else if (diff < 0) {
                trendVsLastWeek = `▼ ${diff}`;
            }
        }
        return {
            keyword,
            totalCount: stat.count,
            positiveCount: stat.positive,
            negativeCount: stat.negative,
            neutralCount: stat.neutral,
            mainSentiment,
            sentimentRatio,
            trendVsLastWeek,
        };
    });
}
/**
 * 매장별 통계 계산
 */
function calculateStoreStats(reviews) {
    const storeMap = new Map();
    for (const review of reviews) {
        const store = review.storeName;
        if (!storeMap.has(store)) {
            storeMap.set(store, {
                reviews: [],
                positive: 0,
                negative: 0,
                neutral: 0,
                totalRating: 0,
            });
        }
        const stat = storeMap.get(store);
        stat.reviews.push(review);
        stat.totalRating += review.rating;
        switch (review.sentiment) {
            case '긍정':
                stat.positive++;
                break;
            case '부정':
                stat.negative++;
                break;
            case '중립':
                stat.neutral++;
                break;
        }
    }
    return Array.from(storeMap.entries())
        .map(([storeName, stat]) => {
        const total = stat.reviews.length;
        const positiveRate = `${((stat.positive / total) * 100).toFixed(1)}%`;
        const negativeRate = `${((stat.negative / total) * 100).toFixed(1)}%`;
        const avgRating = Math.round((stat.totalRating / total) * 10) / 10;
        // 상위 키워드 추출
        const keywordCount = new Map();
        for (const review of stat.reviews) {
            for (const keyword of review.keywords) {
                keywordCount.set(keyword, (keywordCount.get(keyword) || 0) + 1);
            }
        }
        const topKeywords = Array.from(keywordCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([k]) => k);
        // 조치 필요 여부 판단 (부정 비율 40% 이상)
        const negativeRatio = stat.negative / total;
        const actionNeeded = negativeRatio >= 0.4 ? '⚠️ 부정비율 높음' : '';
        return {
            storeName,
            totalReviews: total,
            positive: stat.positive,
            negative: stat.negative,
            neutral: stat.neutral,
            positiveRate,
            negativeRate,
            avgRating,
            topKeywords,
            actionNeeded,
        };
    })
        .sort((a, b) => b.totalReviews - a.totalReviews);
}
/**
 * 플랫폼별 통계 계산
 */
function calculatePlatformStats(reviews) {
    const platformMap = new Map();
    for (const review of reviews) {
        const platform = review.platform;
        if (!platformMap.has(platform)) {
            platformMap.set(platform, {
                reviews: [],
                positive: 0,
                negative: 0,
                neutral: 0,
                totalRating: 0,
            });
        }
        const stat = platformMap.get(platform);
        stat.reviews.push(review);
        stat.totalRating += review.rating;
        switch (review.sentiment) {
            case '긍정':
                stat.positive++;
                break;
            case '부정':
                stat.negative++;
                break;
            case '중립':
                stat.neutral++;
                break;
        }
    }
    return Array.from(platformMap.entries())
        .map(([platform, stat]) => {
        const total = stat.reviews.length;
        const positiveRate = `${((stat.positive / total) * 100).toFixed(1)}%`;
        const avgRating = Math.round((stat.totalRating / total) * 10) / 10;
        // 상위 키워드 추출
        const keywordCount = new Map();
        for (const review of stat.reviews) {
            for (const keyword of review.keywords) {
                keywordCount.set(keyword, (keywordCount.get(keyword) || 0) + 1);
            }
        }
        const topKeywords = Array.from(keywordCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([k]) => k);
        return {
            platform,
            totalReviews: total,
            positive: stat.positive,
            negative: stat.negative,
            neutral: stat.neutral,
            positiveRate,
            avgRating,
            topKeywords,
        };
    })
        .sort((a, b) => b.totalReviews - a.totalReviews);
}
/**
 * 부정 리뷰 추출
 */
function extractNegativeReviews(reviews) {
    const SAFETY_KEYWORDS = ['트러블', '알러지', '알레르기', '자극', '피부', '따가움', '부작용'];
    return reviews
        .filter((r) => r.sentiment === '부정')
        .map((review) => {
        // 우선순위 결정
        let priority = '🟢 낮음';
        if (review.rating === 1) {
            priority = '🔴 높음';
        }
        else if (review.rating === 2) {
            priority = '🟡 중간';
        }
        // 안전 관련 키워드가 있으면 우선순위 상향
        const hasSafetyKeyword = review.keywords.some((k) => SAFETY_KEYWORDS.some((sk) => k.includes(sk)));
        if (hasSafetyKeyword && priority !== '🔴 높음') {
            priority = '🔴 높음';
        }
        return {
            receivedAt: review.receivedAt,
            storeName: review.storeName,
            platform: review.platform,
            rating: review.rating,
            summary: review.summary,
            keywords: review.keywords,
            originalText: review.weeklyData?.original_text || review.reviewText,
            priority,
        };
    })
        .sort((a, b) => {
        // 우선순위 순 정렬
        const priorityOrder = { '🔴 높음': 0, '🟡 중간': 1, '🟢 낮음': 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
}
/**
 * 브랜드별 주간 데이터 집계
 */
async function aggregateBrandWeeklyData(brandName, reviews, weekLabel, lastWeekReviews) {
    const sentimentDistribution = calculateSentimentDistribution(reviews);
    // 지난주 키워드 맵 생성
    let lastWeekKeywordMap;
    if (lastWeekReviews) {
        lastWeekKeywordMap = new Map();
        for (const review of lastWeekReviews) {
            for (const keyword of review.keywords) {
                lastWeekKeywordMap.set(keyword, (lastWeekKeywordMap.get(keyword) || 0) + 1);
            }
        }
    }
    const keywordStats = calculateKeywordStats(reviews, lastWeekKeywordMap);
    const storeStats = calculateStoreStats(reviews);
    const platformStats = calculatePlatformStats(reviews);
    const negativeReviews = extractNegativeReviews(reviews);
    // 평균 별점 계산
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = Math.round((totalRating / (reviews.length || 1)) * 10) / 10;
    // TOP 키워드 (긍정 중심)
    const topKeywords = keywordStats
        .filter((k) => k.mainSentiment === '긍정')
        .slice(0, 5);
    // 이슈 키워드 (부정 중심)
    const issueKeywords = keywordStats
        .filter((k) => k.mainSentiment === '부정')
        .slice(0, 5);
    // 지난주 대비 비교
    let lastWeekComparison = null;
    if (lastWeekReviews && lastWeekReviews.length > 0) {
        const lastWeekSentiment = calculateSentimentDistribution(lastWeekReviews);
        const lastWeekTotalRating = lastWeekReviews.reduce((sum, r) => sum + r.rating, 0);
        const lastWeekAvgRating = Math.round((lastWeekTotalRating / lastWeekReviews.length) * 10) / 10;
        const reviewDiff = reviews.length - lastWeekReviews.length;
        const ratingDiff = avgRating - lastWeekAvgRating;
        const positiveDiff = parseFloat(sentimentDistribution.positiveRate) -
            parseFloat(lastWeekSentiment.positiveRate);
        const negativeDiff = parseFloat(sentimentDistribution.negativeRate) -
            parseFloat(lastWeekSentiment.negativeRate);
        lastWeekComparison = {
            totalReviewsChange: reviewDiff >= 0 ? `+${reviewDiff}건 (${Math.round((reviewDiff / (lastWeekReviews.length || 1)) * 100)}%)` : `${reviewDiff}건`,
            avgRatingChange: ratingDiff >= 0 ? `+${ratingDiff.toFixed(1)}` : `${ratingDiff.toFixed(1)}`,
            positiveRateChange: positiveDiff >= 0 ? `▲` : `▼`,
            negativeRateChange: negativeDiff >= 0 ? `▲` : `▼`,
        };
    }
    return {
        brandName,
        weekLabel,
        totalReviews: reviews.length,
        avgRating,
        sentimentDistribution,
        topKeywords,
        issueKeywords,
        storeStats,
        keywordStats: keywordStats.slice(0, 20), // 상위 20개
        negativeReviews,
        platformStats,
        rawData: reviews,
        lastWeekComparison,
    };
}
//# sourceMappingURL=weeklyDataAggregator.js.map