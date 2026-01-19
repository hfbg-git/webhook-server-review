"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWeeklyReports = generateWeeklyReports;
exports.generateBrandWeeklyReport = generateBrandWeeklyReport;
exports.generateWeeklyReportsForDate = generateWeeklyReportsForDate;
const weeklyDataAggregator_js_1 = require("./weeklyDataAggregator.js");
const weeklySheetBuilder_js_1 = require("./weeklySheetBuilder.js");
const openaiService_js_1 = require("./openaiService.js");
/**
 * 2주 전 기간 계산 (지난주 대비 비교용)
 */
function getTwoWeeksAgoRange(lastWeekRange) {
    const twoWeeksAgo = new Date(lastWeekRange.startDate);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 7);
    return (0, weeklyDataAggregator_js_1.getWeekRangeForDate)(twoWeeksAgo);
}
/**
 * 단일 브랜드 주간 리포트 생성
 */
async function generateSingleBrandReport(brandName, weekLabel, currentWeekRange, lastWeekRange, logger) {
    try {
        logger.info({ msg: 'Generating report for brand', brandName, weekLabel });
        // 이번 주 데이터 조회
        const currentWeekReviews = await (0, weeklyDataAggregator_js_1.getWeeklyReviewData)(currentWeekRange.startDate, currentWeekRange.endDate);
        // 브랜드별 필터링
        const brandReviews = currentWeekReviews.filter((r) => r.brandName === brandName);
        if (brandReviews.length === 0) {
            logger.warn({ msg: 'No reviews found for brand', brandName, weekLabel });
            return {
                success: false,
                brandName,
                weekLabel,
                totalReviews: 0,
                error: 'NO_DATA',
            };
        }
        // 지난 주 데이터 조회 (비교용)
        const lastWeekReviews = await (0, weeklyDataAggregator_js_1.getWeeklyReviewData)(lastWeekRange.startDate, lastWeekRange.endDate);
        const lastWeekBrandReviews = lastWeekReviews.filter((r) => r.brandName === brandName);
        // 데이터 집계
        const aggregation = await (0, weeklyDataAggregator_js_1.aggregateBrandWeeklyData)(brandName, brandReviews, weekLabel, lastWeekBrandReviews.length > 0 ? lastWeekBrandReviews : undefined);
        // AI 인사이트 생성
        try {
            logger.info({ msg: 'Generating AI insights for brand', brandName });
            const insightData = {
                brandName,
                totalReviews: aggregation.totalReviews,
                avgRating: aggregation.avgRating,
                positiveRate: aggregation.sentimentDistribution.positiveRate,
                negativeRate: aggregation.sentimentDistribution.negativeRate,
                topKeywords: aggregation.topKeywords.slice(0, 5).map(k => k.keyword),
                issueKeywords: aggregation.issueKeywords.slice(0, 5).map(k => k.keyword),
                storeStats: aggregation.storeStats.map(s => ({
                    storeName: s.storeName,
                    totalReviews: s.totalReviews,
                    negativeRate: s.negativeRate,
                    avgRating: s.avgRating,
                    topKeywords: s.topKeywords,
                })),
                keywordTrends: aggregation.keywordStats.slice(0, 10).map(k => ({
                    keyword: k.keyword,
                    count: k.totalCount,
                    trend: k.trendVsLastWeek,
                    sentiment: k.mainSentiment,
                })),
            };
            const aiInsights = await (0, openaiService_js_1.generateWeeklyInsights)(insightData);
            aggregation.aiInsights = aiInsights;
            logger.info({ msg: 'AI insights generated successfully', brandName });
        }
        catch (error) {
            logger.warn({
                msg: 'Failed to generate AI insights, proceeding without',
                brandName,
                error: error.message,
            });
        }
        // 시트 생성
        const { spreadsheetId, spreadsheetUrl } = await (0, weeklySheetBuilder_js_1.createBrandWeeklyReportSheet)(aggregation, logger);
        logger.info({
            msg: 'Weekly report generated for brand',
            brandName,
            spreadsheetId,
            totalReviews: brandReviews.length,
        });
        return {
            success: true,
            brandName,
            spreadsheetId,
            spreadsheetUrl,
            weekLabel,
            totalReviews: brandReviews.length,
        };
    }
    catch (error) {
        logger.error({
            msg: 'Failed to generate report for brand',
            brandName,
            error: error.message,
        });
        return {
            success: false,
            brandName,
            weekLabel,
            totalReviews: 0,
            error: error.message,
        };
    }
}
/**
 * 전체 주간 리포트 생성 (모든 브랜드)
 */
async function generateWeeklyReports(logger) {
    const startTime = Date.now();
    // 기간 계산
    const currentWeekRange = (0, weeklyDataAggregator_js_1.getLastWeekRange)();
    const lastWeekRange = getTwoWeeksAgoRange(currentWeekRange);
    logger.info({
        msg: 'Starting weekly report generation',
        weekLabel: currentWeekRange.weekLabel,
        startDate: currentWeekRange.startDate.toISOString(),
        endDate: currentWeekRange.endDate.toISOString(),
    });
    // 전체 데이터 조회
    const allReviews = await (0, weeklyDataAggregator_js_1.getWeeklyReviewData)(currentWeekRange.startDate, currentWeekRange.endDate);
    if (allReviews.length === 0) {
        logger.warn({ msg: 'No reviews found for the week', weekLabel: currentWeekRange.weekLabel });
        return [];
    }
    logger.info({ msg: 'Reviews found', totalReviews: allReviews.length });
    // 브랜드별 그룹화
    const reviewsByBrand = (0, weeklyDataAggregator_js_1.groupByBrand)(allReviews);
    const brands = Array.from(reviewsByBrand.keys());
    logger.info({ msg: 'Brands found', count: brands.length, brands });
    // 각 브랜드별 리포트 생성
    const results = [];
    for (const brandName of brands) {
        const result = await generateSingleBrandReport(brandName, currentWeekRange.weekLabel, currentWeekRange, lastWeekRange, logger);
        results.push(result);
    }
    const executionTime = Date.now() - startTime;
    const successCount = results.filter((r) => r.success).length;
    logger.info({
        msg: 'Weekly reports generation completed',
        totalBrands: brands.length,
        successCount,
        failedCount: brands.length - successCount,
        executionTimeMs: executionTime,
    });
    return results;
}
/**
 * 특정 브랜드 주간 리포트 생성
 */
async function generateBrandWeeklyReport(brandName, logger, targetDate) {
    // 기간 계산
    const currentWeekRange = targetDate
        ? (0, weeklyDataAggregator_js_1.getWeekRangeForDate)(targetDate)
        : (0, weeklyDataAggregator_js_1.getLastWeekRange)();
    const lastWeekRange = getTwoWeeksAgoRange(currentWeekRange);
    return generateSingleBrandReport(brandName, currentWeekRange.weekLabel, currentWeekRange, lastWeekRange, logger);
}
/**
 * 특정 주간 리포트 생성 (특정 날짜 기준)
 */
async function generateWeeklyReportsForDate(targetDate, logger) {
    const startTime = Date.now();
    // 기간 계산
    const currentWeekRange = (0, weeklyDataAggregator_js_1.getWeekRangeForDate)(targetDate);
    const lastWeekRange = getTwoWeeksAgoRange(currentWeekRange);
    logger.info({
        msg: 'Starting weekly report generation for specific date',
        weekLabel: currentWeekRange.weekLabel,
        startDate: currentWeekRange.startDate.toISOString(),
        endDate: currentWeekRange.endDate.toISOString(),
    });
    // 전체 데이터 조회
    const allReviews = await (0, weeklyDataAggregator_js_1.getWeeklyReviewData)(currentWeekRange.startDate, currentWeekRange.endDate);
    if (allReviews.length === 0) {
        logger.warn({ msg: 'No reviews found for the week', weekLabel: currentWeekRange.weekLabel });
        return [];
    }
    logger.info({ msg: 'Reviews found', totalReviews: allReviews.length });
    // 브랜드별 그룹화
    const reviewsByBrand = (0, weeklyDataAggregator_js_1.groupByBrand)(allReviews);
    const brands = Array.from(reviewsByBrand.keys());
    logger.info({ msg: 'Brands found', count: brands.length, brands });
    // 각 브랜드별 리포트 생성
    const results = [];
    for (const brandName of brands) {
        const result = await generateSingleBrandReport(brandName, currentWeekRange.weekLabel, currentWeekRange, lastWeekRange, logger);
        results.push(result);
    }
    const executionTime = Date.now() - startTime;
    const successCount = results.filter((r) => r.success).length;
    logger.info({
        msg: 'Weekly reports generation completed',
        totalBrands: brands.length,
        successCount,
        failedCount: brands.length - successCount,
        executionTimeMs: executionTime,
    });
    return results;
}
//# sourceMappingURL=weeklyReportService.js.map