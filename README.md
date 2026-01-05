# ReviewDoctor Webhook Server

ReviewDoctor 웹훅을 수신하여 Google Drive의 월별 Google Spreadsheet에 리뷰를 자동 저장하는 API 서버입니다.

## 기능

- ReviewDoctor 웹훅 수신 (`POST /webhook/reviewdoctor`)
- 월별 스프레드시트 자동 생성/선택 (예: `ReviewDoctor_Raw_2025_12`)
- Reviews 탭에 리뷰 데이터 append
- 중복 저장 방지 (review_id 기반)
- Best-effort 파싱 (지점명, 별점, 리뷰내용)

## 기술 스택

- Node.js 20+
- Fastify
- TypeScript
- Google Sheets API + Google Drive API
- 서비스 계정 인증

## 프로젝트 구조

```
src/
├── index.ts              # 서버 진입점
├── routes/
│   ├── webhook.ts        # 웹훅 라우트
│   └── health.ts         # 헬스체크 라우트
├── services/
│   ├── googleAuth.ts     # Google 서비스 계정 인증
│   ├── driveService.ts   # Google Drive API 래퍼
│   ├── sheetsService.ts  # Google Sheets API 래퍼
│   └── reviewService.ts  # 리뷰 저장 로직
├── utils/
│   ├── parser.ts         # 리뷰 파싱 유틸
│   ├── hash.ts           # review_id 해시 생성
│   └── lruCache.ts       # 중복 체크용 LRU 캐시
└── types/
    └── index.ts          # 타입 정의
tests/
├── hash.test.ts          # review_id 생성 테스트
└── parser.test.ts        # 파싱 테스트
```

## 환경변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `PORT` | 서버 포트 | 3000 |
| `NODE_ENV` | 실행 환경 | development |
| `TIMEZONE` | 시간대 | Asia/Seoul |
| `RAW_SHEETS_FOLDER_ID` | Google Drive 폴더 ID | (필수) |
| `RAW_SHEET_NAME_PREFIX` | 스프레드시트 이름 접두사 | ReviewDoctor_Raw_ |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | 서비스 계정 JSON 문자열 | (필수) |
| `GOOGLE_PROJECT_SCOPES` | API 스코프 | drive.file,spreadsheets |
| `DUP_CHECK_LOOKBACK_ROWS` | 중복 체크할 최근 행 수 | 2000 |

## 로컬 실행

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일에 실제 값 입력

# 개발 모드 실행
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm start
```

## Render 배포

1. Render에서 새 Web Service 생성
2. GitHub 레포지토리 연결
3. 빌드 커맨드: `npm install && npm run build`
4. 시작 커맨드: `npm start`
5. 환경변수 설정 (위 표 참고)

## API 엔드포인트

### POST /webhook/reviewdoctor

리뷰 데이터를 수신하여 Google Sheets에 저장합니다.

**요청 바디:**
```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "body": "string (optional)"
}
```

**응답:**
```json
{
  "ok": true,
  "review_id": "abc123...",
  "sheet_id": "spreadsheet_id",
  "sheet_name": "ReviewDoctor_Raw_2025_12",
  "deduped": false
}
```

### GET /health

헬스체크 엔드포인트입니다.

**응답:**
```json
{
  "ok": true
}
```

## Reviews 탭 컬럼

| 컬럼 | 설명 |
|------|------|
| received_at | 서버 수신 시각 (ISO) |
| review_created_at | 리뷰 작성일 (ISO or blank) |
| store_name | 지점명 |
| rating | 별점 (number or blank) |
| review_id | 고유 ID (SHA256 해시) |
| title | 원본 title |
| description | 원본 description |
| body | 원본 body |
| review_text | 파싱된 리뷰 텍스트 |
| status | 처리 상태 (초기값: NEW) |
| processed_at | 처리 시각 (blank) |
| error_message | 에러 메시지 (blank) |

## 테스트

```bash
npm test
```

## 라이선스

MIT
