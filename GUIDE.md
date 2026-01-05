# ReviewDoctor 운영 가이드

## 목차
1. [환경변수 설정](#환경변수-설정)
2. [AI 프롬프트 수정](#ai-프롬프트-수정)
3. [배치 스케줄링 설정](#배치-스케줄링-설정)
4. [스프레드시트 컬럼 구조](#스프레드시트-컬럼-구조)
5. [에러 처리](#에러-처리)
6. [배포](#배포)

---

## 환경변수 설정

`.env` 파일에서 설정합니다.

### 필수 설정

| 변수 | 설명 | 예시 |
|------|------|------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `446215...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | `GOCSPX-...` |
| `GOOGLE_REFRESH_TOKEN` | Google OAuth Refresh Token | `1//0e708...` |
| `RAW_SHEETS_FOLDER_ID` | 리뷰 저장할 Google Drive 폴더 ID | `1B0ryKIHK1AhD...` |
| `OPENAI_API_KEY` | OpenAI API Key | `sk-proj-...` |

### 선택 설정

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `PORT` | `3000` | 서버 포트 |
| `NODE_ENV` | `development` | 환경 (`production` / `development`) |
| `RAW_SHEET_NAME_PREFIX` | `ReviewDoctor_Raw_` | 스프레드시트 이름 접두사 |
| `DUP_CHECK_LOOKBACK_ROWS` | `2000` | 중복 검사할 최근 행 수 |
| `AI_BATCH_INTERVAL` | `300000` | AI 처리 주기 (밀리초) |
| `AI_BATCH_SIZE` | `50` | 한 번에 처리할 최대 리뷰 수 |

---

## AI 프롬프트 수정

### 파일 위치
```
src/prompts/reviewAnalysis.ts
```

### 수정 방법

`REVIEW_ANALYSIS_PROMPT` 변수를 수정하면 됩니다:

```typescript
export const REVIEW_ANALYSIS_PROMPT = `당신은 리뷰 분석 전문가입니다...`;
```

### 사용 가능한 변수

프롬프트에서 아래 변수들이 실제 값으로 치환됩니다:

| 변수 | 설명 |
|------|------|
| `{brand_name}` | 브랜드명 |
| `{store_name}` | 매장명 |
| `{platform}` | 플랫폼 (네이버, 카카오 등) |
| `{rating}` | 별점 |
| `{review_text}` | 리뷰 원문 |

### 출력 형식

AI가 반환하는 JSON 형식을 변경하려면 프롬프트의 출력 형식 부분을 수정하세요.

**현재 형식:**
```json
{
  "sentiment": "긍정|부정|중립",
  "summary": "한줄 요약",
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"]
}
```

> **주의**: JSON 구조를 변경하면 `src/services/openaiService.ts`의 `parseAIResponse` 함수도 함께 수정해야 합니다.

---

## 배치 스케줄링 설정

### AI 처리 주기 변경

`.env` 파일에서 `AI_BATCH_INTERVAL` 값을 변경합니다.

| 값 (밀리초) | 시간 |
|-------------|------|
| `60000` | 1분 |
| `300000` | 5분 (기본값) |
| `600000` | 10분 |
| `1800000` | 30분 |
| `3600000` | 1시간 |

### 한 번에 처리할 리뷰 수

`.env` 파일에서 `AI_BATCH_SIZE` 값을 변경합니다.

```
AI_BATCH_SIZE=100  # 한 번에 100개 처리
```

### 스케줄러 로직

`src/index.ts`에서 스케줄러가 실행됩니다:

```typescript
const startAIProcessor = () => {
  // OPENAI_API_KEY가 없으면 AI 처리 비활성화
  if (!process.env.OPENAI_API_KEY) {
    fastify.log.warn('OPENAI_API_KEY not set, AI processing disabled');
    return;
  }

  // 주기적 실행
  setInterval(async () => {
    await processNewReviews(fastify.log);
  }, AI_BATCH_INTERVAL);

  // 서버 시작 시 즉시 1회 실행
  processNewReviews(fastify.log);
};
```

---

## 스프레드시트 컬럼 구조

### 컬럼 목록 (A-O)

| 컬럼 | 이름 | 설명 | 작성자 |
|------|------|------|--------|
| A | `received_at` | 웹훅 수신 시간 (한국시간) | 웹훅 |
| B | `review_created_at` | 리뷰 작성 시간 | 웹훅 |
| C | `brand_name` | 브랜드명 | 웹훅 |
| D | `store_name` | 지점명 | 웹훅 |
| E | `platform` | 플랫폼 | 웹훅 |
| F | `rating` | 별점 | 웹훅 |
| G | `review_id` | 리뷰 고유 ID | 웹훅 |
| H | `review_text` | 리뷰 원문 | 웹훅 |
| I | `status` | 처리 상태 | AI |
| J | `p1_sentiment` | 감정 분류 (긍정/부정/중립) | AI |
| K | `p2_summary` | 한줄 요약 | AI |
| L | `p3_keywords` | 키워드 5개 | AI |
| M | `p4_weekly_data` | 위클리 리포트용 JSON | AI |
| N | `processed_at` | AI 처리 완료 시간 | AI |
| O | `ai_status` | AI 처리 상태 | AI |

### P4 Weekly Data JSON 구조

```json
{
  "sentiment": "긍정|부정|중립",
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"],
  "brand": "브랜드명",
  "store": "지점명",
  "summary": "한줄 요약",
  "rating": 5,
  "original_text": "원문 리뷰 (부정일 때만 포함)"
}
```

### 컬럼 정의 변경

`src/types/index.ts`에서 `REVIEWS_HEADERS`를 수정합니다:

```typescript
export const REVIEWS_HEADERS = [
  'received_at',        // A
  'review_created_at',  // B
  // ...
] as const;
```

---

## 에러 처리

### Status 흐름

```
NEW → (AI 처리 성공) → DONE
 │
 └→ (AI 처리 실패) → ERROR → (재시도 성공) → DONE
                       │
                       └→ (3회 실패) → FAILED
```

### 상태 값

| 상태 | 설명 |
|------|------|
| `NEW` | 웹훅으로 새로 들어온 리뷰, AI 처리 대기 |
| `DONE` | AI 처리 완료 |
| `ERROR` | AI 처리 실패 (다음 배치에서 재시도) |
| `FAILED` | 3회 이상 실패, 수동 확인 필요 |

### 재시도 횟수 변경

`src/services/aiProcessor.ts`에서 `MAX_RETRIES` 값을 변경합니다:

```typescript
const MAX_RETRIES = 3;  // 기본값: 3회
```

---

## 배포

### Render 배포

1. GitHub에 코드 푸시
2. Render에서 Web Service 생성
3. 환경변수 설정
4. 자동 배포

### 환경변수 설정 (Render)

Render Dashboard > Environment에서 아래 값들을 설정:

```
NODE_ENV=production
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
RAW_SHEETS_FOLDER_ID=...
OPENAI_API_KEY=...
AI_BATCH_INTERVAL=300000
AI_BATCH_SIZE=50
```

### Build & Start 명령어

- **Build Command**: `npm run build`
- **Start Command**: `npm start`

---

## 파일 구조

```
src/
├── index.ts                    # 서버 진입점, 스케줄러
├── prompts/
│   └── reviewAnalysis.ts       # ⭐ AI 프롬프트 (여기서 수정!)
├── routes/
│   ├── health.ts               # 헬스체크 엔드포인트
│   └── webhook.ts              # 웹훅 수신 엔드포인트
├── services/
│   ├── aiProcessor.ts          # AI 배치 처리 로직
│   ├── driveService.ts         # Google Drive 폴더/파일 관리
│   ├── googleAuth.ts           # Google OAuth 인증
│   ├── openaiService.ts        # OpenAI API 호출
│   ├── reviewService.ts        # 리뷰 처리 로직
│   └── sheetsService.ts        # Google Sheets 읽기/쓰기
├── types/
│   └── index.ts                # 타입 정의, 컬럼 헤더
└── utils/
    ├── hash.ts                 # 리뷰 ID 생성
    ├── lruCache.ts             # 중복 검사 캐시
    └── parser.ts               # 웹훅 데이터 파싱
```

---

## 자주 묻는 질문

### Q: AI 분석 결과가 이상해요
**A**: `src/prompts/reviewAnalysis.ts`에서 프롬프트를 수정하세요. 분류 기준이나 요약 지침을 더 명확하게 작성하면 개선됩니다.

### Q: AI 처리가 너무 느려요
**A**: `AI_BATCH_INTERVAL`을 줄이거나 `AI_BATCH_SIZE`를 늘리세요. 단, API 비용이 증가할 수 있습니다.

### Q: 특정 리뷰가 계속 FAILED 상태예요
**A**: 해당 리뷰의 `review_text`를 확인하세요. 빈 값이거나 특수문자가 많으면 AI가 처리하지 못할 수 있습니다. 수동으로 `status`를 `NEW`로 변경하면 재처리됩니다.

### Q: Google API 에러가 발생해요
**A**: `GOOGLE_REFRESH_TOKEN`이 만료되었을 수 있습니다. `npm run get-token` 스크립트로 새 토큰을 발급받으세요.
