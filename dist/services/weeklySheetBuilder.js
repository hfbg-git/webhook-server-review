"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBrandWeeklyReportSheet = createBrandWeeklyReportSheet;
const googleAuth_js_1 = require("./googleAuth.js");
const WEEKLY_REPORT_FOLDER_ID = process.env.WEEKLY_REPORT_FOLDER_ID || process.env.RAW_SHEETS_FOLDER_ID || '';
/**
 * 폴더 찾기 또는 생성
 */
async function getOrCreateFolder(parentId, folderName) {
    const drive = (0, googleAuth_js_1.getDriveClient)();
    // 기존 폴더 찾기
    const response = await drive.files.list({
        q: `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive',
    });
    const files = response.data.files || [];
    if (files.length > 0 && files[0].id) {
        return files[0].id;
    }
    // 폴더 생성
    const createResponse = await drive.files.create({
        requestBody: {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentId],
        },
        fields: 'id',
    });
    const folderId = createResponse.data.id;
    if (!folderId) {
        throw new Error(`Failed to create folder '${folderName}'`);
    }
    return folderId;
}
/**
 * 브랜드별 리포트 폴더 경로 생성
 * WeeklyReports/{브랜드명}/{연도}/{월}
 */
async function getOrCreateBrandReportFolder(brandName, weekLabel) {
    // weekLabel 형식: "2025-01-06_2025-01-12"
    const [startDate] = weekLabel.split('_');
    const [year, month] = startDate.split('-');
    // 1. WeeklyReports 폴더
    const weeklyReportsFolderId = await getOrCreateFolder(WEEKLY_REPORT_FOLDER_ID, 'WeeklyReports');
    // 2. 브랜드 폴더
    const brandFolderId = await getOrCreateFolder(weeklyReportsFolderId, brandName);
    // 3. 연도 폴더
    const yearFolderId = await getOrCreateFolder(brandFolderId, year);
    // 4. 월 폴더
    const monthFolderId = await getOrCreateFolder(yearFolderId, `${month}월`);
    return monthFolderId;
}
/**
 * 스프레드시트 생성
 */
async function createSpreadsheet(parentId, sheetName) {
    const drive = (0, googleAuth_js_1.getDriveClient)();
    const response = await drive.files.create({
        requestBody: {
            name: sheetName,
            mimeType: 'application/vnd.google-apps.spreadsheet',
            parents: [parentId],
        },
        fields: 'id',
    });
    const fileId = response.data.id;
    if (!fileId) {
        throw new Error('Failed to create spreadsheet');
    }
    return fileId;
}
/**
 * 시트 추가
 */
async function addSheet(spreadsheetId, title, index) {
    const sheets = (0, googleAuth_js_1.getSheetsClient)();
    const response = await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests: [
                {
                    addSheet: {
                        properties: {
                            title,
                            index,
                        },
                    },
                },
            ],
        },
    });
    const sheetId = response.data.replies?.[0]?.addSheet?.properties?.sheetId;
    return sheetId || 0;
}
/**
 * 기본 Sheet1 삭제
 */
async function deleteDefaultSheet(spreadsheetId) {
    const sheets = (0, googleAuth_js_1.getSheetsClient)();
    try {
        // 먼저 Sheet1의 ID 찾기
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId,
            fields: 'sheets.properties',
        });
        const sheet1 = spreadsheet.data.sheets?.find((s) => s.properties?.title === 'Sheet1' || s.properties?.title === '시트1');
        if (sheet1?.properties?.sheetId !== undefined) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [
                        {
                            deleteSheet: {
                                sheetId: sheet1.properties.sheetId,
                            },
                        },
                    ],
                },
            });
        }
    }
    catch {
        // 삭제 실패해도 무시
    }
}
/**
 * 셀 범위에 데이터 작성
 */
async function writeToSheet(spreadsheetId, range, values) {
    const sheets = (0, googleAuth_js_1.getSheetsClient)();
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'RAW',
        requestBody: { values },
    });
}
/**
 * 대시보드 탭 생성
 */
async function createDashboardTab(spreadsheetId, aggregation) {
    await addSheet(spreadsheetId, '대시보드', 0);
    const [startDate, endDate] = aggregation.weekLabel.split('_');
    const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    const lastWeek = aggregation.lastWeekComparison;
    const values = [
        [`${aggregation.brandName} 주간 리포트`],
        ['기간', `${startDate} (월) ~ ${endDate} (일)`],
        ['생성일시', now],
        [],
        ['📊 핵심 지표', '', '', '', ''],
        ['총 리뷰 수', `${aggregation.totalReviews}건`, '', '지난주 대비', lastWeek?.totalReviewsChange || '-'],
        ['평균 별점', `${aggregation.avgRating}점`, '', '지난주 대비', lastWeek?.avgRatingChange || '-'],
        [],
        ['😊 감정 분포', '건수', '비율', '지난주', '변화'],
        ['긍정', aggregation.sentimentDistribution.positive, aggregation.sentimentDistribution.positiveRate, '', lastWeek?.positiveRateChange || '-'],
        ['부정', aggregation.sentimentDistribution.negative, aggregation.sentimentDistribution.negativeRate, '', lastWeek?.negativeRateChange || '-'],
        ['중립', aggregation.sentimentDistribution.neutral, aggregation.sentimentDistribution.neutralRate, '', '-'],
        [],
        ['🏆 이번주 TOP 키워드'],
    ];
    // TOP 키워드 추가
    aggregation.topKeywords.slice(0, 5).forEach((kw, i) => {
        values.push([`${i + 1}위`, `${kw.keyword} (${kw.totalCount}건)`]);
    });
    values.push([]);
    values.push(['⚠️ 주의 키워드 (부정 연관)']);
    // 이슈 키워드 추가
    aggregation.issueKeywords.slice(0, 3).forEach((kw, i) => {
        values.push([`${i + 1}위`, `${kw.keyword} (${kw.totalCount}건)`]);
    });
    // AI 인사이트 추가
    if (aggregation.aiInsights) {
        values.push([]);
        values.push(['🤖 AI 주간 요약']);
        values.push([aggregation.aiInsights.summary]);
        values.push([]);
        values.push(['🚨 알림']);
        if (aggregation.aiInsights.alerts && aggregation.aiInsights.alerts.length > 0) {
            aggregation.aiInsights.alerts.forEach((alert) => {
                values.push([alert.level, alert.message]);
            });
        }
        else {
            values.push(['이번 주 특별한 알림 없음']);
        }
        values.push([]);
        values.push(['📋 매장별 액션 아이템']);
        if (aggregation.aiInsights.storeActionItems && aggregation.aiInsights.storeActionItems.length > 0) {
            aggregation.aiInsights.storeActionItems.forEach((item) => {
                values.push([item.storeName, item.actionItem]);
            });
        }
        else {
            values.push(['모든 매장 양호']);
        }
    }
    await writeToSheet(spreadsheetId, '대시보드!A1', values);
}
/**
 * 매장별 분석 탭 생성
 */
async function createStoreAnalysisTab(spreadsheetId, aggregation) {
    await addSheet(spreadsheetId, '매장별 분석', 1);
    const headers = [
        'store_name',
        'total_reviews',
        'positive',
        'negative',
        'neutral',
        'positive_rate',
        'negative_rate',
        'avg_rating',
        'top_keywords',
        'action_needed',
    ];
    const values = [headers];
    for (const store of aggregation.storeStats) {
        values.push([
            store.storeName,
            store.totalReviews,
            store.positive,
            store.negative,
            store.neutral,
            store.positiveRate,
            store.negativeRate,
            store.avgRating,
            store.topKeywords.join(', '),
            store.actionNeeded,
        ]);
    }
    await writeToSheet(spreadsheetId, '매장별 분석!A1', values);
}
/**
 * 키워드 분석 탭 생성
 */
async function createKeywordAnalysisTab(spreadsheetId, aggregation) {
    await addSheet(spreadsheetId, '키워드 분석', 2);
    const headers = [
        'rank',
        'keyword',
        'total_count',
        'positive_count',
        'negative_count',
        'neutral_count',
        'main_sentiment',
        'sentiment_ratio',
        'trend_vs_last_week',
    ];
    const values = [headers];
    aggregation.keywordStats.forEach((kw, index) => {
        values.push([
            index + 1,
            kw.keyword,
            kw.totalCount,
            kw.positiveCount,
            kw.negativeCount,
            kw.neutralCount,
            kw.mainSentiment,
            kw.sentimentRatio,
            kw.trendVsLastWeek,
        ]);
    });
    await writeToSheet(spreadsheetId, '키워드 분석!A1', values);
}
/**
 * 부정 리뷰 상세 탭 생성
 */
async function createNegativeReviewsTab(spreadsheetId, aggregation) {
    await addSheet(spreadsheetId, '부정 리뷰 상세', 3);
    const headers = [
        'received_at',
        'store_name',
        'platform',
        'rating',
        'summary',
        'keywords',
        'original_text',
        'priority',
    ];
    const values = [headers];
    for (const review of aggregation.negativeReviews) {
        values.push([
            review.receivedAt,
            review.storeName,
            review.platform,
            review.rating,
            review.summary,
            review.keywords.join(', '),
            review.originalText,
            review.priority,
        ]);
    }
    await writeToSheet(spreadsheetId, '부정 리뷰 상세!A1', values);
}
/**
 * 플랫폼별 분석 탭 생성
 */
async function createPlatformAnalysisTab(spreadsheetId, aggregation) {
    await addSheet(spreadsheetId, '플랫폼별 분석', 4);
    const headers = [
        'platform',
        'total_reviews',
        'positive',
        'negative',
        'neutral',
        'positive_rate',
        'avg_rating',
        'top_keywords',
    ];
    const values = [headers];
    for (const platform of aggregation.platformStats) {
        values.push([
            platform.platform,
            platform.totalReviews,
            platform.positive,
            platform.negative,
            platform.neutral,
            platform.positiveRate,
            platform.avgRating,
            platform.topKeywords.join(', '),
        ]);
    }
    await writeToSheet(spreadsheetId, '플랫폼별 분석!A1', values);
}
/**
 * 원본 데이터 탭 생성
 */
async function createRawDataTab(spreadsheetId, aggregation) {
    await addSheet(spreadsheetId, '원본 데이터', 5);
    const headers = [
        'received_at',
        'store_name',
        'platform',
        'rating',
        'review_text',
        'sentiment',
        'summary',
        'keywords',
    ];
    const values = [headers];
    for (const review of aggregation.rawData) {
        values.push([
            review.receivedAt,
            review.storeName,
            review.platform,
            review.rating,
            review.reviewText,
            review.sentiment,
            review.summary,
            review.keywords.join(', '),
        ]);
    }
    await writeToSheet(spreadsheetId, '원본 데이터!A1', values);
}
/**
 * 브랜드별 주간 리포트 시트 생성
 */
async function createBrandWeeklyReportSheet(aggregation, logger) {
    // 1. 폴더 생성/조회
    const folderId = await getOrCreateBrandReportFolder(aggregation.brandName, aggregation.weekLabel);
    // 2. 스프레드시트 생성
    const sheetName = `${aggregation.brandName}_Weekly_${aggregation.weekLabel}`;
    const spreadsheetId = await createSpreadsheet(folderId, sheetName);
    logger.info({ msg: 'Created weekly report spreadsheet', spreadsheetId, sheetName });
    // 3. 각 탭 생성
    await createDashboardTab(spreadsheetId, aggregation);
    await createStoreAnalysisTab(spreadsheetId, aggregation);
    await createKeywordAnalysisTab(spreadsheetId, aggregation);
    await createNegativeReviewsTab(spreadsheetId, aggregation);
    await createPlatformAnalysisTab(spreadsheetId, aggregation);
    await createRawDataTab(spreadsheetId, aggregation);
    // 4. 기본 Sheet1 삭제
    await deleteDefaultSheet(spreadsheetId);
    logger.info({ msg: 'Weekly report tabs created', spreadsheetId, brandName: aggregation.brandName });
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
    return { spreadsheetId, spreadsheetUrl };
}
//# sourceMappingURL=weeklySheetBuilder.js.map