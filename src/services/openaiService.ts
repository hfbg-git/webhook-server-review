import OpenAI from 'openai';
import { AIProcessingResult, WeeklyData } from '../types/index.js';
import { buildPrompt } from '../prompts/reviewAnalysis.js';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (openaiClient) {
    return openaiClient;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

interface AnalysisResponse {
  sentiment: '긍정' | '부정' | '중립';
  summary: string;
  keywords: string[];
}

function validateSentiment(sentiment: string): '긍정' | '부정' | '중립' {
  const normalized = sentiment.trim();
  if (normalized === '긍정' || normalized === '부정' || normalized === '중립') {
    return normalized;
  }
  return '중립';
}

function parseAIResponse(content: string): AnalysisResponse {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      sentiment: validateSentiment(parsed.sentiment || '중립'),
      summary: parsed.summary || '',
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
    };
  } catch {
    return {
      sentiment: '중립',
      summary: '',
      keywords: [],
    };
  }
}

export interface ReviewData {
  reviewText: string;
  brandName: string;
  storeName: string;
  platform: string;
  rating: string;
}

export async function analyzeReview(review: ReviewData): Promise<AIProcessingResult> {
  const client = getOpenAIClient();

  const prompt = buildPrompt({
    brandName: review.brandName,
    storeName: review.storeName,
    platform: review.platform,
    rating: review.rating,
    reviewText: review.reviewText,
  });

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 500,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content || '';
  const analysis = parseAIResponse(content);

  const weeklyData: WeeklyData = {
    sentiment: analysis.sentiment,
    keywords: analysis.keywords,
    brand: review.brandName,
    store: review.storeName,
    summary: analysis.summary,
    rating: parseInt(review.rating, 10) || 0,
  };

  if (analysis.sentiment === '부정') {
    weeklyData.original_text = review.reviewText;
  }

  return {
    p1Sentiment: analysis.sentiment,
    p2Summary: analysis.summary,
    p3Keywords: analysis.keywords.join(', '),
    p4WeeklyData: JSON.stringify(weeklyData),
  };
}

// ============ Weekly Report AI Insights ============

export interface WeeklyInsightData {
  brandName: string;
  totalReviews: number;
  avgRating: number;
  positiveRate: string;
  negativeRate: string;
  topKeywords: string[];
  issueKeywords: string[];
  storeStats: Array<{
    storeName: string;
    totalReviews: number;
    negativeRate: string;
    avgRating: number;
    topKeywords: string[];
  }>;
  keywordTrends: Array<{
    keyword: string;
    count: number;
    trend: string; // "▲ +5" or "▼ -3"
    sentiment: string;
  }>;
}

export interface WeeklyAIInsights {
  summary: string;
  storeActionItems: Array<{
    storeName: string;
    actionItem: string;
  }>;
  alerts: Array<{
    level: '🔴 긴급' | '🟡 주의' | '🟢 좋은소식';
    message: string;
  }>;
}

/**
 * 주간 리포트용 AI 인사이트 생성
 */
export async function generateWeeklyInsights(data: WeeklyInsightData): Promise<WeeklyAIInsights> {
  const client = getOpenAIClient();

  const prompt = `당신은 프랜차이즈 리뷰 분석 전문가입니다. 아래 주간 데이터를 분석하여 운영에 도움이 되는 인사이트를 제공해주세요.

## 브랜드: ${data.brandName}

### 주간 현황
- 총 리뷰: ${data.totalReviews}건
- 평균 별점: ${data.avgRating}점
- 긍정 비율: ${data.positiveRate}
- 부정 비율: ${data.negativeRate}

### 강점 키워드
${data.topKeywords.join(', ')}

### 이슈 키워드 (부정 연관)
${data.issueKeywords.join(', ')}

### 매장별 현황
${data.storeStats.map(s => `- ${s.storeName}: 리뷰 ${s.totalReviews}건, 부정 ${s.negativeRate}, 별점 ${s.avgRating}, 키워드: ${s.topKeywords.join(', ')}`).join('\n')}

### 키워드 트렌드 (전주 대비)
${data.keywordTrends.map(k => `- ${k.keyword}: ${k.count}건 (${k.trend}), ${k.sentiment}`).join('\n')}

## 요청사항
다음 JSON 형식으로 응답해주세요:

{
  "summary": "이번 주 브랜드 전체 상황을 2-3문장으로 요약. 핵심 강점과 개선점을 포함.",
  "storeActionItems": [
    {"storeName": "매장명", "actionItem": "구체적인 액션 아이템 (이모지 포함)"}
  ],
  "alerts": [
    {"level": "🔴 긴급 또는 🟡 주의 또는 🟢 좋은소식", "message": "알림 내용"}
  ]
}

### 작성 지침
1. summary: 운영자가 빠르게 파악할 수 있도록 핵심만 간결하게
2. storeActionItems: 부정 비율이 높거나 특정 이슈가 있는 매장에만 작성. 양호한 매장은 "✅ 양호"로 표시
3. alerts:
   - 🔴 긴급: 부정 비율 40% 이상, 안전 관련 키워드(트러블, 알러지) 급증
   - 🟡 주의: 부정 비율 30% 이상, 특정 이슈 키워드 증가 추세
   - 🟢 좋은소식: 긍정 키워드 급증, 새로운 강점 발견`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '';
    const parsed = JSON.parse(content);

    return {
      summary: parsed.summary || '',
      storeActionItems: parsed.storeActionItems || [],
      alerts: parsed.alerts || [],
    };
  } catch (error) {
    console.error('Failed to generate weekly insights:', error);
    return {
      summary: '인사이트 생성 실패',
      storeActionItems: [],
      alerts: [],
    };
  }
}
