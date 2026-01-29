/**
 * 리뷰 분석 통합 프롬프트
 *
 * 이 파일에서 프롬프트를 수정하면 AI 분석 결과가 변경됩니다.
 * 출력 형식(JSON 구조)을 변경할 경우 openaiService.ts도 함께 수정해야 합니다.
 */

export const REVIEW_ANALYSIS_PROMPT = `당신은 리뷰 분석 전문가입니다. 주어진 리뷰를 분석하여 JSON 형식으로 응답하세요.

## 리뷰 정보
- 브랜드: {brand_name}
- 매장: {store_name}
- 플랫폼: {platform}
- 별점: {rating}
- 리뷰: "{review_text}"

## 분석 기준

### 감정 분류 (sentiment)
- 긍정: 제품 효과 있음, 만족 표현, 추천/재구매 의사
- 부정: 제품 효과 없음, 불만/실망, 부작용/환불 언급
- 중립: 효과 판단 보류, 사실만 나열
- **중요**: 배송/포장/가격은 무시하고 제품 자체만 평가. 긍정과 부정이 혼재된 경우 리뷰의 최종 결론(마지막 문장)을 따르세요.

### 요약 (summary)
- 핵심 내용을 한국어 1문장으로 요약
- 30자 이내
- 구체적인 제품/서비스 특징이나 경험을 중심으로

### 키워드 (keywords)
- 리뷰의 핵심 의미를 담은 표현 5개
- 단순 명사보다 **의미있는 동사/형용사 표현** 선호
- 다음 카테고리를 우선 추출:
  - 맛 관련: "맛있다", "맛없다", "짜다", "싱겁다", "눅눅하다", "바삭하다"
  - 배달 관련: "배달지연", "배달빠름", "배달느림", "늦게옴"
  - 주문 관련: "재주문", "재구매의사", "다시안시킴", "단골될듯"
  - 문제 관련: "누락", "오배송", "수량부족", "포장불량", "음식훼손"
  - 품질 관련: "양많다", "양적다", "식어서옴", "신선하다", "불친절"
- 예시: "치킨" → "바삭하다" / "배달" → "배달지연" / "맛" → "맛있다"

## 출력 형식
반드시 아래 JSON 형식만 출력하세요. 다른 설명은 하지 마세요.

{
  "sentiment": "긍정|부정|중립",
  "summary": "한줄 요약",
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"]
}`;

/**
 * 프롬프트에 리뷰 데이터를 삽입합니다.
 */
export function buildPrompt(data: {
  brandName: string;
  storeName: string;
  platform: string;
  rating: string;
  reviewText: string;
}): string {
  return REVIEW_ANALYSIS_PROMPT
    .replace('{brand_name}', data.brandName)
    .replace('{store_name}', data.storeName)
    .replace('{platform}', data.platform)
    .replace('{rating}', data.rating)
    .replace('{review_text}', data.reviewText);
}
