import { BrandWeeklyAggregation, JandiWebhookMessage } from '../types/index.js';

/**
 * 주간 리포트 알림 메시지 생성
 */
function buildWeeklyReportMessage(
  aggregation: BrandWeeklyAggregation,
  spreadsheetUrl: string
): JandiWebhookMessage {
  const {
    brandName,
    weekLabel,
    totalReviews,
    avgRating,
    sentimentDistribution,
    topKeywords,
    issueKeywords,
    negativeReviews,
    aiInsights,
  } = aggregation;

  const [startDate, endDate] = weekLabel.split('_');

  // TOP 키워드 포맷
  const topKeywordsText = topKeywords.length > 0
    ? topKeywords.map((k, i) => `${i + 1}. ${k.keyword}(${k.totalCount}건)`).join(' | ')
    : '데이터 없음';

  // 부정 키워드 TOP 5 포맷
  const issueKeywordsText = issueKeywords.length > 0
    ? issueKeywords.slice(0, 5).map((k, i) => `${i + 1}. ${k.keyword}(${k.totalCount}건)`).join(' | ')
    : '이번 주 부정 키워드 없음';

  // 부정 리뷰 세부 정보 (우선순위 높은 순 최대 3개)
  const topNegativeReviews = negativeReviews.length > 0
    ? negativeReviews
        .slice(0, 3)
        .map((r, i) => `${i + 1}. [${r.storeName}] ${r.summary} (${r.priority})`)
        .join('\n')
    : '이번 주 부정 리뷰 없음';

  // AI 인사이트 요약
  const aiSummary = aiInsights?.summary || '인사이트 생성 중...';

  return {
    body: `📊 ${brandName} 주간 리포트 (${startDate} ~ ${endDate})`,
    connectColor: '#FAC11B',
    connectInfo: [
      {
        title: '📈 핵심 지표',
        description: `리뷰 ${totalReviews}건 | 평점 ${avgRating}점 | 긍정 ${sentimentDistribution.positiveRate} | 부정 ${sentimentDistribution.negativeRate}`,
      },
      {
        title: '🏆 TOP 키워드',
        description: topKeywordsText,
      },
      {
        title: '⚠️ 부정 키워드 TOP 5',
        description: issueKeywordsText,
      },
      {
        title: '🚨 주요 부정 리뷰',
        description: topNegativeReviews,
      },
      {
        title: '🤖 AI 인사이트',
        description: aiSummary,
      },
      {
        title: '📎 리포트 링크',
        description: spreadsheetUrl,
      },
    ],
  };
}

/**
 * 잔디 웹훅 전송
 */
export async function sendJandiNotification(
  webhookUrl: string,
  aggregation: BrandWeeklyAggregation,
  spreadsheetUrl: string
): Promise<boolean> {
  try {
    const message = buildWeeklyReportMessage(aggregation, spreadsheetUrl);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.tosslab.jandi-v2+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error('Jandi webhook failed:', response.status, await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Jandi webhook error:', (error as Error).message);
    return false;
  }
}

/**
 * 간단한 알림 메시지 전송 (테스트용)
 */
export async function sendSimpleJandiMessage(
  webhookUrl: string,
  title: string,
  message: string
): Promise<boolean> {
  try {
    const payload: JandiWebhookMessage = {
      body: title,
      connectColor: '#FAC11B',
      connectInfo: [
        {
          title: '메시지',
          description: message,
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.tosslab.jandi-v2+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error('Jandi simple message error:', (error as Error).message);
    return false;
  }
}
