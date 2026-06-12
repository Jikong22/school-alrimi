# 올인원 학교알리미 (All-in-one School Notification PWA)

## TL;DR

> **Quick Summary**: 고등학생을 위한 학교 정보 통합 PWA — NEIS 공공데이터 API로 급식·시간표·학사일정을 제공하고, 수행평가/숙제 관리와 브라우저 푸시+이메일 알림을 하나의 앱에서 해결합니다.
>
> **Deliverables**:
> - Next.js App Router PWA (설치 가능, 오프라인 지원)
> - Supabase 백엔드 (인증, DB, RLS)
> - NEIS 공공데이터 API 연동 (급식, 시간표, 학사일정)
> - 수행평가/숙제 CRUD + 마감 알림
> - 브라우저 푸시 알림 (스팸방지법 준수) + 이메일 알림
> - 카카오톡/네이버 인앱 브라우저 감지 배너
>
> **Estimated Effort**: Large (1인 개발, 3-wave 점진적)
> **Parallel Execution**: YES - 5-7 tasks per wave
> **Critical Path**: Task 1 → Task 5-6 → Task 8-10 → Task 11-13 → Task 14-16 → F1-F4

---

## Context

### Original Request
PDF 제안서에 명시된 "올인원 학교알리미" 기능을 포함한 웹서비스를 개발. 공모전은 참여하지 않으며, 개인 1인 개발 프로젝트.

### Interview Summary
**Key Discussions**:
- **플랫폼**: Next.js PWA (모바일 브라우저에서도 앱처럼 동작)
- **백엔드**: Supabase (인증, DB, 실시간, 스토리지, Edge Functions)
- **데이터**: NEIS 공공데이터 API 연동
- **UI**: shadcn/ui + Tailwind CSS
- **알림**: 브라우저 푸시 (PWA) + 이메일 (Resend)
- **테스트**: TDD (Vitest + Testing Library)
- **개발 전략**: 점진적 개발 (3 waves)
- **1순위 기능**: 학습 일정 관리 + 학교생활 정보 제공

**Research Findings**:
- NEIS 공공데이터 API: 급식·시간표·학사일정 제공 (성적조회 미지원)
- NEIS API 에러가 HTTP 200으로 옴 → data.RESULT 확인 필수
- `SchoolSchedule` 대소문자 주의 (대문자 S)
- 카카오톡/네이버 인앱 브라우저: Service Worker 미지원
- 스팸방지법 7판(2026-03): 브라우저 권한과 별도 인앱 opt-in 필요
- 14세 미만: 법정대리인 동의 7가지 검증 방법 필요
- `next-pwa` 사용 금지 → `@serwist/next` 사용

### Metis Review
**Identified Gaps** (addressed):
- 성적조회 NEIS 공공 API 미지원 → Wave 1에서 제외, Wave 3+에서 학교 파트너십 필요
- 카카오톡/네이버 인앱 브라우저 → "외부 브라우저에서 열기" 배너 추가
- 스팸방지법 준수 → 인앱 opt-in 설계를 first-class entity로
- 14세 미만 동의 문제 → Wave 1을 고등학교(만14세 이상) 한정
- NEIS API 성향 → 캐싱 전략과 에러 핸들링 구체화
- `@serwist/next` 사용 → `next-pwa` 금지 명시

---

## Work Objectives

### Core Objective
고등학생을 위한 올인원 학교알리미 PWA — NEIS 급식·시간표·학사일정 정보 제공과 수행평가/숙제 관리+푸시 알림을 하나의 웹앱에서.

### Concrete Deliverables
- Next.js App Router PWA (설치 가능, 오프라인 지원)
- Supabase 프로젝트 (Auth, DB, RLS, Edge Functions)
- NEIS API 연동 (급식, 시간표, 학사일정)
- 수행평가/숙제 CRUD + 마감 알림
- 브라우저 푸시 + 이메일 알림 (법적 준수)
- 한국어 최적화 UI (Pretendard Variable, word-break: keep-all)

### Definition of Done
- [ ] `bun run build` 성공
- [ ] `bun test` 모든 테스트 통과
- [ ] Lighthouse PWA 점수 > 90
- [ ] NEIS API 연동 5개 이상 학교에서 데이터 조회 성공
- [ ] 브라우저 푸시 알림 수신 확인 (Samsung Internet + Chrome)
- [ ] 카카오톡 인앱 브라우저 감지 배너 동작
- [ ] 스팸방지법 준수 인앱 opt-in 동작

### Must Have
- NEIS 급식표 조회 (급식 메뉴 + 알레르기 정보 파싱)
- NEIS 시간표 조회 (고등학교 전용, hisTimetable 엔드포인트)
- NEIS 학사일정 조회 (`SchoolSchedule` 대문자 S)
- 수행평가/숙제 CRUD (제목, 과목, 마감일, 설명)
- 마감일 알림 (브라우저 푸시 + 이메일)
- 학교 선택 기능 (NEIS API 검색)
- 오늘 대시보드 (급식 + 시간표 + 다가오는 마감일)
- 인앱 opt-in (스팸방지법 준수) + 브라우저 권한 요청
- 카카오톡/네이버 인앱 브라우저 감지 배너
- PWA 설치 프롬프트

### Must NOT Have (Guardrails)
- 성적조회 기능 (NEIS 공공 API 미지원, Wave 1 제외)
- 네이티브 모바일 앱 (React Native 등)
- 교사/학부모/관리자 역할 (Wave 2+)
- 초등학교/중학교 지원 (Wave 1은 고등학교만)
- 실시간 기능 (Supabase Realtime) (Wave 1 제외)
- 파일 업로드/첨부 (Wave 1 제외)
- SMS/카카오톡 채널 알림 (Wave 1 제외)
- 주민등록번호 수집 (법적 금지)
- 통합 "필수 동의" 체크박스 (개별 동의 필요)
- `next-pwa` 패키지 (유지보수 중단, `@serwist/next` 사용)
- 브라우저 권한 prompt 없이 인앱 opt-in 없이 푸시 요청
- 데이터 날짜 하드코딩 (항상 NEIS API에서 조회)

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.
> Acceptance criteria requiring "user manually tests/confirms" are FORBIDDEN.

### Test Decision
- **Infrastructure exists**: NO (greenfield)
- **Automated tests**: YES (TDD)
- **Framework**: Vitest + Testing Library
- **If TDD**: Each task follows RED (failing test) → GREEN (minimal impl) → REFACTOR

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.omo/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright (playwright skill) - Navigate, interact, assert DOM, screenshot
- **TUI/CLI**: Use interactive_bash (tmux) - Run command, send keystrokes, validate output
- **API/Backend**: Use Bash (curl) - Send requests, assert status + response fields
- **Library/Module**: Use Bash (bun test) - Import, call functions, compare output

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 0 (Validation Spikes — MUST PASS BEFORE PROCEEDING):
├── Task 1: NEIS API validation spike [quick]
├── Task 2: PWA + Push notification spike [deep]
└── Task 3: Supabase Auth + RLS spike [quick]

Wave 1 (Foundation — after Wave 0 passes):
├── Task 4: Project scaffolding (Next.js + Supabase + shadcn/ui + TDD setup) [quick]
├── Task 5: NEIS API client with caching + error handling [unspecified-high]
├── Task 6: School selection UI (search → select → persist) [unspecified-high]
└── Task 7: Korean typography + Pretendard setup [quick]

Wave 2 (Core Features — after Wave 1):
├── Task 8: 급식 (Meal Info) page [visual-engineering]
├── Task 9: 시간표 (Timetable) page — 고등학교 only [visual-engineering]
├── Task 10: 학사일정 (Academic Schedule) page [visual-engineering]
└── Task 11: 수행평가/숙제 CRUD [unspecified-high]

Wave 3 (Notifications + Dashboard — after Wave 2):
├── Task 12: 브라우저 푸시 알림 (스팸방지법 준수 인앱 opt-in) [deep]
├── Task 13: 이메일 알림 (Resend + Supabase Edge Functions) [unspecified-high]
├── Task 14: 오늘 대시보드 (급식 + 시간표 + 마감일) [visual-engineering]
└── Task 15: 카카오톡/네이버 인앱 브라우저 감지 배너 [quick]

Wave 4 (Polish + Compliance — after Wave 3):
├── Task 16: PWA manifest + install prompt + offline mode [unspecified-high]
├── Task 17: Error states + empty states + loading skeletons [visual-engineering]
└── Task 18: 개인정보처리방침 + 동의 로깅 시스템 [writing]

Wave FINAL (After ALL tasks — 4 parallel reviews):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay

Critical Path: Task 1 → Task 5 → Task 8-10 → Task 12 → Task 14 → Task 16 → F1-F4
Parallel Speedup: ~60% faster than sequential
Max Concurrent: 7 (Wave 2)
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1 | - | 5 |
| 2 | - | 12, 16 |
| 3 | - | 4 |
| 4 | 3 | 5, 6, 7 |
| 5 | 1, 4 | 8, 9, 10 |
| 6 | 4 | 8, 9, 10, 11 |
| 7 | 4 | 8, 9, 10 |
| 8 | 5, 6, 7 | 14 |
| 9 | 5, 6, 7 | 14 |
| 10 | 5, 6, 7 | 14 |
| 11 | 4, 6 | 12, 13 |
| 12 | 2, 4, 11 | 14 |
| 13 | 4, 11 | 14 |
| 14 | 8, 9, 10, 12 | 16 |
| 15 | 4 | - |
| 16 | 2, 14 | F1-F4 |
| 17 | 14 | F1-F4 |
| 18 | 4 | F1-F4 |
| F1-F4 | 16, 17, 18 | - |

### Agent Dispatch Summary

| Wave | Count | Profiles |
|------|-------|----------|
| 0 | 3 | T1 → `quick`, T2 → `deep`, T3 → `quick` |
| 1 | 4 | T4 → `quick`, T5 → `unspecified-high`, T6 → `unspecified-high`, T7 → `quick` |
| 2 | 4 | T8 → `visual-engineering`, T9 → `visual-engineering`, T10 → `visual-engineering`, T11 → `unspecified-high` |
| 3 | 4 | T12 → `deep`, T13 → `unspecified-high`, T14 → `visual-engineering`, T15 → `quick` |
| 4 | 3 | T16 → `unspecified-high`, T17 → `visual-engineering`, T18 → `writing` |
| FINAL | 4 | F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep` |

---

## TODOs

- [x] 1. NEIS API Validation Spike

  **What to do**:
  - 공공데이터포털(https://www.data.go.kr)에서 NEIS API 키 발급
  - mealServiceDietInfo 엔드포인트 테스트 (5개 이상 학교)
  - hisTimetable 엔드포인트 테스트 (고등학교)
  - `SchoolSchedule` 엔드포인트 테스트 (대문자 S 주의)
  - 에러 응답 검증: INFO-200, ERROR-337, ERROR-290이 HTTP 200으로 오는지 확인
  - 데이터 품질 검증: 빈 데이터, 누락 필드, 이상값 확인
  - 캐싱 전략 수립: 급식 1-6h, 시간표 24h, 학사일정 24h

  **Must NOT do**:
  - 성적조회 API 호출 금지 (공공 API에 없음)
  - next-pwa 사용 금지
  - 실제 서비스 코드 작성 금지 (spike 전용)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Validation spike, limited scope, fast turnaround
  - **Skills**: []
    - 기술 검증이므로 특별한 스킬 불필요
  - **Skills Evaluated but Omitted**:
    - `playwright`: UI 테스트 없음

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 0 (with Tasks 2, 3)
  - **Blocks**: Task 5
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL):
  - **API Docs**: `https://open.neis.go.kr/` — NEIS 공공데이터 API 엔드포인트 명세
  - **Pattern Reference**: NEIS 에러는 HTTP 200으로 옴 → `data.RESULT.CODE` 확인 필수
  - **Key Gotcha**: `SchoolSchedule` (대문자 S), 다른 엔드포인트는 소문자 시작
  - **Data Quality**: 많은 학교가 데이터를 공개하지 않음 → `INFO-200` = "데이터 없음" (에러 아님)
  - **Rate Limit**: `ERROR-337` = 일일 조회 한도 초과 → 캐싱 필수

  **Acceptance Criteria**:
  - [ ] NEIS API 키 발급 완료
  - [ ] `mealServiceDietInfo` 3/5 테스트 학교에서 데이터 수신 성공
  - [ ] `hisTimetable` 응답 구조 파싱 성공
  - [ ] `SchoolSchedule` (대문자 S) 응답 파싱 성공
  - [ ] INFO-200, ERROR-337, ERROR-290 시 HTTP 200 확인 + data.RESULT 파싱 성공
  - [ ] 스파이크 결과를 `spike-neis-api.md`에 문서화

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: NEIS 급식 API 정상 응답
    Tool: Bash (curl)
    Preconditions: NEIS API 키 발급 완료
    Steps:
      1. curl "https://open.neis.go.kr/hub/mealServiceDietInfo?KEY={API_KEY}&Type=json&SD_SCHUL_CODE=7010118&MLSV_YMD=20260612"
      2. 응답 status가 200인지 확인
      3. data RESULT 내에 CODE가 "INFO-000"인지 확인 (정상)
      4. mealServiceDietInfo 배열에 row가 존재하는지 확인
    Expected Result: 급식 데이터가 JSON 형식으로 정상 수신
    Failure Indicators: RESULT CODE가 ERROR-290 (인증 오류), ERROR-337 (한도초과)
    Evidence: .omo/evidence/task-1-neis-meal-success.json

  Scenario: NEIS API 에러 응답 (데이터 없음)
    Tool: Bash (curl)
    Preconditions: NEIS API 키 발급 완료
    Steps:
      1. 존재하지 않는 학교 코드로 API 호출
      2. HTTP status가 200인지 확인
      3. data.RESULT.CODE가 "INFO-200"인지 확인
    Expected Result: HTTP 200이지만 데이터 없음 (INFO-200)
    Failure Indicators: 404/500 HTTP 에러 (NEIS는 에러도 200으로 옴)
    Evidence: .omo/evidence/task-1-neis-info-200.json
  ```

  **Commit**: YES (groups with 2, 3)
  - Message: `feat(spike): validate NEIS API, PWA push, and Supabase auth`
  - Files: `spike-neis-api.md`, spike test files
  - Pre-commit: `bun test`

- [x] 2. PWA + Push Notification Spike

  **What to do**:
  - `@serwist/next` v9.5.6+ configurator mode 설정
  - VAPID 키 생성 (web-push 라이브러리)
  - Chrome + Samsung Internet에서 푸시 알림 수신 테스트
  - 카카오톡/네이버 인앱 브라우저 UA 문자열 감지 로직 테스트
  - Service Worker 라이프사이클 검증 (install, activate, push, notificationclick)
  - `pushsubscriptionchange` 이벤트 핸들링 테스트
  - 404/410 응답 시 구독 비활성화 로직 검증

  **Must NOT do**:
  - `next-pwa` 사용 금지 (유지보수 중단)
  - iOS Safari에 푸시 알림 기대 금지 (Add to Home Screen 후에만 작동)
  - 브라우저 권한 없이 푸시 요청 금지

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: PWA + push는 복잡한 설정이 필요하며, 한국 모바일 브라우저 특수성 고려 필요
  - **Skills**: []
    - 기술 스파이크이므로 특별한 스킬 불필요
  - **Skills Evaluated but Omitted**:
    - `playwright`: 스파이크 단계에서 UI 테스트 불필요

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 0 (with Tasks 1, 3)
  - **Blocks**: Tasks 12, 16
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL):
  - **Package**: `@serwist/next` (NOT `next-pwa`) — https://serwist.pages.dev/
  - **Pattern Reference**: Samsung Internet은 background SW를 ~2분 후 killing함 → 문서화 필요
  - **Gotcha**: KakaoTalk/Naver in-app browsers are WKWebView → Service Worker 완전 미지원
  - **Push Package**: `web-push` npm for VAPID key generation + server-side push
  - **Legal**: 스팸방지법 7판(2026-03) — 브라우저 Notification.requestPermission()만으로는 법적 준수 불가, 별도 인앱 opt-in 필요

  **Acceptance Criteria**:
  - [ ] `@serwist/next` configurator mode로 Next.js 프로젝트 세팅 성공
  - [ ] VAPID 키 생성 완료
  - [ ] Chrome Android에서 푸시 알림 수신 성공 (< 30초)
  - [ ] Samsung Internet에서 푸시 알림 수신 성공
  - [ ] KakaoTalk UA 감지 정상 동작 확인
  - [ ] Naver UA 감지 정상 동작 확인
  - [ ] `pushsubscriptionchange` 이벤트 핸들링 성공
  - [ ] 스파이크 결과를 `spike-pwa-push.md`에 문서화

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: 브라우저 푸시 알림 수신 (Chrome)
    Tool: Bash (curl + manual browser verification)
    Preconditions: VAPID 키 생성, Service Worker 등록 완료
    Steps:
      1. 브라우저에서 앱 열기
      2. 인앱 opt-in 동의 후 Notification.requestPermission() 호출
      3. 서버에서 테스트 푸시 발송: `curl -X POST {supabase_url}/functions/v1/send-push ...`
      4. 30초 이내 알림 수신 확인
    Expected Result: 푸시 알림이 30초 이내 수신되고, 클릭 시 앱 열림
    Failure Indicators: 알림 미수신, 服务_worker 등록 실패
    Evidence: .omo/evidence/task-2-push-chrome.png

  Scenario: 카카오톡 인앱 브라우저 감지
    Tool: Bash (node)
    Preconditions: 감지 로직 구현 완료
    Steps:
      1. KakaoTalk UA 문자열로 감지 함수 실행
      2. 결과가 true인지 확인
      3. Chrome UA 문자열로 감지 함수 실행
      4. 결과가 false인지 확인
    Expected Result: KakaoTalk UA = true, Chrome UA = false
    Failure Indicators: KakaoTalk 미감지 또는 Chrome 오감지
    Evidence: .omo/evidence/task-2-kakao-detection.txt
  ```

  **Commit**: YES (groups with 1, 3)
  - Message: `feat(spike): validate NEIS API, PWA push, and Supabase auth`
  - Files: `spike-pwa-push.md`, spike test files
  - Pre-commit: `bun test`

- [x] 3. Supabase Auth + RLS Spike

  **What to do**:
  - Supabase 프로젝트 생성
  - 이메일 인증 (magic link 또는 password) 설정
  - 만14세 이상 가입 확인 로직 (생년월일 입력 → 검증)
  - `user_roles` 테이블 생성 (role: 'student' | 'teacher' | 'parent')
  - SECURITY DEFINER 함수로 역할 조회 패턴 구현
  - RLS 정책 설정: 학생은 자신의 데이터만 조회 가능
  - 개발 환경 .env 세팅

  **Must NOT do**:
  - 주민등록번호 수집 금지
  - 14세 미만 가입 허용 금지 (Wave 1)
  - 통합 "필수 동의" 체크박스 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Supabase 설정은 문서화된 패턴을 따르므로 빠른 구현 가능
  - **Skills**: []
  - 기술 스파이크이므로 특별한 스킬 불필요
  - **Skills Evaluated but Omitted**:
    - `playwright`: 백엔드 스파이크이므로 UI 테스트 불필요

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 0 (with Tasks 1, 2)
  - **Blocks**: Task 4
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL):
  - **Supabase Docs**: https://supabase.com/docs/guides/auth — Auth 설정 가이드
  - **RLS Pattern**: `(select auth.uid())` + SECURITY DEFINER 함수 for 성능 최적화
  - **Free Tier Limits**: 500MB DB, 1GB storage, 50K MAU — MVP에 충분
  - **Age Gate**: 만14세 이상만 가입 허용 → 생년월일 + 현재날짜 계산

  **Acceptance Criteria**:
  - [ ] Supabase 프로젝트 생성 완료
  - [ ] 이메일 인증 로그인/가입 동작 확인
  - [ ] 만14세 미만 가입 시 차단 로직 동작
  - [ ] RLS 정책: 학생은 자신의 수행평가/숙제만 조회/수정 가능
  - [ ] SECURITY DEFINER 함수로 역할 조회 성공
  - [ ] `.env.local`에 Supabase URL + anon key 설정
  - [ ] 스파이크 결과를 `spike-supabase-auth.md`에 문서화

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: 이메일 인증 회원가입
    Tool: Bash (curl)
    Preconditions: Supabase 프로젝트 생성 완료
    Steps:
      1. curl POST /auth/v1/signup with { email: "test@example.com", password: "test1234!" }
      2. 응답에 access_token 포함 확인
      3. curl GET /auth/v1/user with Bearer token → 사용자 정보 반환 확인
    Expected Result: 회원가입 성공, access_token 반환, 이메일 확인 메일 발송
    Failure Indicators: 400/500 에러, access_token 미포함
    Evidence: .omo/evidence/task-3-signup.json

  Scenario: 만14세 미만 가입 차단
    Tool: Bash (curl)
    Preconditions: 회원가입 엔드포인트 활성
    Steps:
      1. 생년월일이 오늘 기준 만14세 미만인 날짜로 가입 시도
      2. 응답이 차단 메시지인지 확인
    Expected Result: "만 14세 이상만 가입할 수 있습니다" 에러 메시지
    Failure Indicators: 미성년자 가입 허용
    Evidence: .omo/evidence/task-3-age-gate.json
  ```

  **Commit**: YES (groups with 1, 2)
  - Message: `feat(spike): validate NEIS API, PWA push, and Supabase auth`
  - Files: `spike-supabase-auth.md`, `.env.local`, Supabase migration files
  - Pre-commit: `bun test`

- [x] 4. Project Scaffolding (Next.js + Supabase + shadcn/ui + TDD setup)

  **What to do**:
  - `npx create-next-app@latest` 실행 (App Router, TypeScript, Tailwind CSS, src/ directory)
  - Supabase 클라이언트 설정 (`@supabase/ssr` + `@supabase/supabase-js`)
  - shadcn/ui 초기화 (`npx shadcn@latest init`)
  - Vitest + Testing Library 설정 (`vitest`, `@testing-library/react`, `@testing-library/jest-dom`)
  - Pretendard Variable 글꼴 설정 (`next/font/local` with `weight: "45 920"`)
  - 한국어 타이포그래피 기본 설정 (`word-break: keep-all`, `line-height: 1.7`)
  - ESLint + Prettier 설정
  - `.env.local` template 생성 (NEIS_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
  - 디렉토리 구조 생성:
    ```
    src/
    ├── app/          # Next.js App Router pages
    ├── components/   # 공유 컴포넌트
    │   └── ui/       # shadcn/ui 컴포넌트
    ├── lib/          # 유틸리티, API 클라이언트
    │   ├── neis/     # NEIS API 클라이언트
    │   ├── supabase/ # Supabase 클라이언트
    │   ├── push/     # 푸시 알림
    │   └── consent/  # 동의 로깅
    ├── types/        # TypeScript 타입 정의
    └── __tests__/    # 테스트 파일
    ```

  **Must NOT do**:
  - `next-pwa` 설치 금지 (`@serwist/next` 사용 예정, Wave 4)
  - 주민등록번호 관련 필드 추가 금지
  - 통합 "필수 동의" UI 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 프로젝트 스캐폴딩은 정해진 패턴을 따르는 설정 작업
  - **Skills**: [`customize-opencode`]
    - `customize-opencode`: Next.js + Supabase 설정 패턴 참조

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (sequential first)
  - **Blocks**: Tasks 5, 6, 7
  - **Blocked By**: Task 3 (Supabase spike must pass)

  **References** (CRITICAL):
  - **Next.js App Router**: https://nextjs.org/docs/app — App Router 공식 문서
  - **Supabase SSR**: https://supabase.com/docs/guides/auth/server-side — SSR 인증 가이드
  - **shadcn/ui**: https://ui.shadcn.com/ — 컴포넌트 라이브러리
  - **Pretendard**: https://github.com/orioncactus/pretendard — 한국어 최적화 폰트
  - **Key Gotcha**: Pretendard Variable은 `weight: "45 920"` 설정 필수 (WebKit에서 fake bold 방지)

  **Acceptance Criteria**:
  - [ ] `bun run build` 성공
  - [ ] `bun test` Vitest 기본 테스트 통과
  - [ ] shadcn/ui Button 컴포넌트 렌더링 성공
  - [ ] Pretendard Variable이 `weight: "45 920"`으로 로드됨
  - [ ] 한국어 타이포그래피: `word-break: keep-all`, `line-height: 1.7` 적용
  - [ ] `.env.local.example`에 모든 환경변수 template 포함

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: 프로젝트 빌드 성공
    Tool: Bash
    Preconditions: Next.js + Supabase + shadcn/ui 설치 완료
    Steps:
      1. `bun run build` 실행
      2. 빌드 성공 확인 (exit code 0)
      3. `bun test` 실행
      4. 테스트 통과 확인
    Expected Result: 빌드 성공, 모든 테스트 통과
    Failure Indicators: 빌드 에러, 타입 에러, 테스트 실패
    Evidence: .omo/evidence/task-4-build-success.txt

  Scenario: 한국어 폰트 렌더링
    Tool: Playwright
    Preconditions: `bun run dev` 실행 중
    Steps:
      1. 브라우저에서 localhost:3000 열기
      2. 한글 텍스트가 Pretendard Variable로 렌더링되는지 확인
      3. `word-break: keep-all` 적용 확인
    Expected Result: 한국어 텍스트가 Pretendard Variable로 자연스럽게 렌더링
    Failure Indicators: 기본 폰트로 렌더링, 단어 중간 줄바꿈
    Evidence: .omo/evidence/task-4-korean-font.png
  ```

  **Commit**: YES
  - Message: `chore: scaffold Next.js + Supabase + shadcn/ui + TDD`
  - Files: project root, `src/app/`, `src/lib/`, `src/types/`
  - Pre-commit: `bun run build && bun test`

- [ ] 5. NEIS API Client with Caching + Error Handling

  **What to do**:
  - NEIS API 클라이언트 클래스/모듈 구현 (`lib/neis/client.ts`)
  - 환경변수 기반 API 키 관리 (`NEIS_API_KEY`)
  - 3개 엔드포인트 구현:
    - `mealServiceDietInfo` (급식)
    - `hisTimetable` (고등학교 시간표)
    - `SchoolSchedule` (학사일정, 대문자 S 주의)
  - 공통 에러 핸들링:
    - HTTP 200이지만 `RESULT.CODE` 확인 → INFO-200 (데이터 없음), ERROR-337 (일일 한도), ERROR-290 (인증 오류)
  - Supabase 기반 캐싱 레이어:
    - 급식: 1-6시간 캐시
    - 시간표: 24시간 캐시
    - 학사일정: 24시간 캐시
  - 학교 검색 엔드포인트: `schoolInfo`로 학교명/지역 검색
  - TDD: 각 엔드포인트 + 에러 케이스 테스트

  **Must NOT do**:
  - 성적조회 API 구현 금지 (공공 API에 없음)
  - 초등학교(`elsTimetable`)/중학교(`misTimetable`) 엔드포인트 구현 금지 (Wave 1은 고등학교만)
  - NEIS 응답을 HTTP 상태 코드로 판별 금지 (항상 data.RESULT 확인)
  - 날짜/시간 하드코딩 금지
  - `next-pwa` 설치 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: API 클라이언트는 에러 핸들링과 캐싱 로직이 복잡하고 핵심 기능
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Tasks 1, 4)
  - **Parallel Group**: Wave 1 (after T1 validation + T4 scaffolding)
  - **Blocks**: Tasks 8, 9, 10
  - **Blocked By**: Tasks 1, 4

  **References** (CRITICAL):
  - **NEIS API Docs**: `https://open.neis.go.kr/` — 엔드포인트 명세
  - **Spike Result**: `spike-neis-api.md` — 검증 결과 및 데이터 품질 정보
  - **Error Pattern**: `data.RESULT.CODE` 확인 — `INFO-000`(정상), `INFO-200`(데이터없음), `ERROR-290`(인증오류), `ERROR-337`(한도초과)
  - **SchoolSchedule**: 대문자 S (`SchoolSchedule`), 다른 엔드포인트는 소문자 시작
  - **Caching**: Supabase `school_meals`/`school_timetables`/`school_schedules` 테이블 + `LOAD_DTM` (last updated timestamp)

  **Acceptance Criteria**:
  - [ ] `bun test lib/neis/` — 모든 NEIS 클라이언트 테스트 통과
  - [ ] 급식 API: 5개 학교 중 3개 이상에서 데이터 수신 성공
  - [ ] 시간표 API: hisTimetable 응답 파싱 성공
  - [ ] 학사일정 API: SchoolSchedule (대문자 S) 응답 파싱 성공
  - [ ] INFO-200 에러 → 빈 상태 반환 (throw 금지)
  - [ ] ERROR-337 에러 → 캐시된 데이터 반환 + 사용자 메시지
  - [ ] ERROR-290 에러 → 인증 오류 throw
  - [ ] 캐시 만료 시에만 API 호출, 그 외에는 Supabase에서 조회
  - [ ] 모든 NEIS 데이터에 "출처: 교육부 나이스" 표시

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: 급식 API 정상 호출 및 캐싱
    Tool: Bash (bun test)
    Preconditions: NEIS API 키 설정, Supabase 연결
    Steps:
      1. `bun test lib/neis/meal.test.ts` 실행
      2. 첫 호출: API에서 데이터 수신 → Supabase에 캐싱 확인
      3. 두 번째 호출 (캐시 만료 전): API 호출 없이 Supabase에서 조회 확인
      4. 캐시 만료 후 호출: API에서 재조회 확인
    Expected Result: 캐싱 로직 동작, API 호출 최소화
    Failure Indicators: 매번 API 호출, 캐시 미저장
    Evidence: .omo/evidence/task-5-neis-caching.txt

  Scenario: NEIS 에러 처리 (INFO-200, ERROR-337)
    Tool: Bash (bun test)
    Preconditions: NEIS API 클라이언트 구현 완료
    Steps:
      1. 존재하지 않는 학교 코드로 `getMeals()` 호출 → INFO-200 반환
      2. 결과가 빈 배열이고 에러가 아닌지 확인
      3. 일일 한도 초과 시뮬레이션 → ERROR-337 반환
      4. 캐시된 데이터가 있으면 반환, 없으면 사용자 메시지 반환 확인
    Expected Result: INFO-200 = 빈 상태, ERROR-337 = 캐시 데이터 + 메시지
    Failure Indicators: INFO-200을 에러로 throw, ERROR-337 시 크래시
    Evidence: .omo/evidence/task-5-neis-error-handling.txt
  ```

  **Commit**: YES
  - Message: `feat(api): add NEIS API client with caching and error handling`
  - Files: `lib/neis/`, `types/neis.ts`, `__tests__/neis/`
  - Pre-commit: `bun test lib/neis/`

- [ ] 6. School Selection UI (Search → Select → Persist)

  **What to do**:
  - 학교 검색 페이지 (`app/school/page.tsx`)
  - NEIS `schoolInfo` API로 학교명/지역 검색
  - 검색 결과 목록 표시 (학교명, 지역, 학교코드)
  - 학교 선택 → Supabase `user_schools` 테이블에 저장
  - 학교 변경 기능 (설정 페이지)
  - TDD: 검색, 선택, 저장 테스트

  **Must NOT do**:
  - 리로스쿨/컴시간알리미 데이터 사용 금지
  - 학교 목록 하드코딩 금지
  - 초등학교/중학교 필터링 구현 (Wave 1은 고등학교만, 검색은 모두 표시 가능)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 검색 UX + 상태 관리가 핵심 사용자 경험에 영향
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (after Task 4)
  - **Parallel Group**: Wave 1 (with Tasks 5, 7)
  - **Blocks**: Tasks 8, 9, 10, 11
  - **Blocked By**: Task 4

  **References** (CRITICAL):
  - **NEIS schoolInfo API**: `https://open.neis.go.kr/hub/schoolInfo` — 학교 검색 엔드포인트
  - **Supabase Pattern**: `user_schools` 테이블 — `{ user_id, school_code, school_name, region, selected_at }`
  - **UX Pattern**: 검색 입력 → 디바운스(300ms) → 결과 표시 → 선택 → 저장

  **Acceptance Criteria**:
  - [ ] 학교 검색: "서초" 입력 시 서초구 고등학교 목록 표시
  - [ ] 학교 선택: 클릭 시 user_schools에 저장, localStorage에도 저장
  - [ ] 학교 변경: 설정에서 다른 학교 검색 후 변경 가능
  - [ ] TDD: 검색, 선택, 저장 관련 테스트 통과

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: 학교 검색 및 선택
    Tool: Playwright
    Preconditions: 앱 실행 중, 로그인된 상태
    Steps:
      1. 학교 검색 입력 필드에 "서초" 입력
      2. 검색 결과 목록이 2초 이내에 표시되는지 확인
      3. 결과 목록에서 "서초고등학교" 클릭
      4. 선택 완료 메시지 확인
      5. 대시보드에서 선택한 학교의 데이터가 표시되는지 확인
    Expected Result: 학교 검색 → 선택 → 데이터 표시 흐름이 정상 동작
    Failure Indicators: 검색 결과 없음, 선택 후 데이터 미표시
    Evidence: .omo/evidence/task-6-school-select.png

  Scenario: 빈 검색 결과 처리
    Tool: Playwright
    Preconditions: 앱 실행 중
    Steps:
      1. 존재하지 않는 학교명 검색 (예: "존재하지않는학교")
      2. "검색 결과가 없습니다" 메시지 표시 확인
    Expected Result: 빈 상태가 명확하게 표시됨
    Failure Indicators: 에러 페이지, 무한 로딩
    Evidence: .omo/evidence/task-6-school-empty.png
  ```

  **Commit**: YES
  - Message: `feat(ui): school selection search and persistence`
  - Files: `app/school/`, `components/school/`, `lib/neis/school-search.ts`
  - Pre-commit: `bun test`

- [ ] 7. Korean Typography + Pretendard Setup

  **What to do**:
  - Pretendard Variable 글꼴 설정 (`next/font/local` with `weight: "45 920"`)
  - Tailwind CSS 한국어 타이포그래피 설정:
    - `word-break: keep-all`
    - `line-height: 1.7`
    - `letter-spacing: -0.01em`
  - 전역 레이아웃 래퍼 컴포넌트 (한국어 최적화)
  - Toast 알림 위치: 상단 중앙 (`top-center`)
  - shadcn/ui 테마 커스터마이징 (Korean-friendly 컬러)

  **Must NOT do**:
  - Pretendard Variable 없이 `weight: "45 920"` 설정 없이 사용 금지 (WebKit fake bold)
  - `word-break: break-all` 사용 금지 (한국어 단어 분리)
  - `[광고]` 라벨 없이 마케팅 이메일 발송 금지 (스팸방지법)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 글꼴/타이포그래피 설정은 정해진 패턴 적용
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (after Task 4)
  - **Parallel Group**: Wave 1 (with Tasks 5, 6)
  - **Blocks**: Tasks 8, 9, 10
  - **Blocked By**: Task 4

  **References** (CRITICAL):
  - **Pretendard**: https://github.com/orioncactus/pretendard — 다운로드 및 설정 가이드
  - **Key Gotcha**: `weight: "45 920"` 필수 — WebKit에서 weight 범위 지정 없으면 fake bold 렌더링
  - **Korean UX**: Toast는 `top-center` (한국 사용자 관행), `word-break: keep-all` 필수

  **Acceptance Criteria**:
  - [ ] Pretendard Variable이 `weight: "45 920"`으로 로드됨
  - [ ] 모든 한국어 텍스트에 `word-break: keep-all` 적용
  - [ ] 기본 line-height가 1.7
  - [ ] Toast 알림이 상단 중앙에 표시
  - [ ] `bun run build` 성공

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: 한국어 타이포그래피 렌더링
    Tool: Playwright
    Preconditions: 앱 실행 중
    Steps:
      1. 한국어 텍스트가 포함된 페이지 열기
      2. Pretendard Variable이 적용되었는지 확인 (font-family 검사)
      3. 단어 중간 줄바꿈이 발생하지 않는지 확인 (keep-all)
      4. line-height가 1.7인지 확인
    Expected Result: 자연스러운 한국어 타이포그래피
    Failure Indicators: 기본 폰트, 단어 중간 줄바꿈
    Evidence: .omo/evidence/task-7-korean-typography.png
  ```

  **Commit**: YES
  - Message: `chore(ui): add Pretendard font and Korean typography`
  - Files: `app/layout.tsx`, `tailwind.config.ts`, `app/globals.css`
  - Pre-commit: `bun run build`

- [ ] 8. 급식 (Meal Info) Page
  **What**: 급식표 조회 페이지 (`app/meal/page.tsx`). DDISH_NM에서 메뉴와 알레르기 정보 파싱, 빈 상태 처리 (INFO-200).
  **Agent**: `visual-engineering` | **Skill**: [`playwright`]
  **Parallel**: YES (with Tasks 9, 10, 11) after Tasks 5-7 | **Blocks**: Task 14
  **QA**: Playwright - 급식 데이터 표시, 알레르기 번호 아이콘 표시, "출처: 교육부 나이스" 푸터 확인
  **Commit**: `feat(meal): 급식표 page with allergen parsing`

- [ ] 9. 시간표 (Timetable) Page
  **What**: 고등학교 시간표 페이지 (`app/timetable/page.tsx`). `hisTimetable` 엔드포인트, 빈 교시 구분, INFO-200 처리.
  **Agent**: `visual-engineering` | **Skill**: [`playwright`]
  **Parallel**: YES (with Tasks 8, 10, 11) | **Blocks**: Task 14
  **QA**: Playwright - 주간 시간표 그리드, 교시별 과목 표시, 빈 교시 회색 처리
  **Commit**: `feat(timetable): 시간표 page (고등학교)`

- [ ] 10. 학사일정 (Academic Schedule) Page
  **What**: 학사일정 캘린더 (`app/schedule/page.tsx`). `SchoolSchedule` (대문자 S) 파싱, 음력 공휴일 (설날/추석) 지원, 보강일 표시.
  **Agent**: `visual-engineering` | **Skill**: [`playwright`]
  **Parallel**: YES (with Tasks 8, 9, 11) | **Blocks**: Task 14
  **QA**: Playwright - 캘린더 표시, 특일 강조, 보강일 툴팁
  **Commit**: `feat(schedule): 학사일정 page with lunar holidays`

- [ ] 11. 수행평가/숙제 CRUD
  **What**: 수행평가/숙제 생성/조회/수정/삭제 (`app/assignments/page.tsx`). 데이터 모델: `{ title, subject, dueDate, description, schoolId, userId }`. 마감일 알림 연동.
  **Agent**: `unspecified-high` | **Skill**: []
  **Parallel**: YES (with Tasks 8, 9, 10) | **Blocks**: Tasks 12, 13
  **QA**: Playwright - CRUD 흐름, dueDate 입력, 마감일 표시, 알림 예약 확인
  **Commit**: `feat(assignment): 수행평가/숙제 CRUD`

- [ ] 12. 브라우저 푸시 알림 (스팸방지법 준수)
  **What**: PWA 푸시 알림. 인앱 opt-in (동의 기록: user_id, method, IP, timestamp, scope) → 브라우저 권한 요청. VAPID 키, Service Worker push 핸들러, 410/404 구독 비활성화.
  **Agent**: `deep` | **Skill**: [`playwright`]
  **Parallel**: YES (with Tasks 13, 14, 15) after Tasks 11, 2 | **Blocks**: Task 14
  **QA**: Playwright - 인앱 opt-in UI, 푸시 수신 (Chrome), 410 응답 시 구독 삭제
  **Commit**: `feat(push): browser push notifications with 스팸방지법 opt-in`

- [ ] 13. 이메일 알림 (Resend + Supabase Edge Functions)
  **What**: Supabase Edge Functions + Resend 이메일 발송. 마감일 알림 이메일 템플릿. 일일 100건 제한 (Resend free tier).
  **Agent**: `unspecified-high` | **Skill**: []
  **Parallel**: YES (with Tasks 12, 14, 15) | **Blocks**: Task 14
  **QA**: Bash - Edge Functions 호출, 이메일 발송, Resend 응답 확인
  **Commit**: `feat(email): email notifications via Resend`

- [ ] 14. 오늘 대시보드
  **What**: 대시보드 페이지 (`app/dashboard/page.tsx`). 오늘 급식 + 시간표 + 다가오는 마감일 통합. 위젯 기반 레이아웃.
  **Agent**: `visual-engineering` | **Skill**: [`playwright`]
  **Parallel**: YES (with Tasks 12, 13, 15) | **Blocks**: Tasks 16, 17
  **QA**: Playwright - 대시보드 로드, 위젯 데이터 표시, 퀵링크 동작
  **Commit**: `feat(dashboard): 오늘 대시보드`

- [ ] 15. 카카오톡/네이버 인앱 브라우저 감지 배너
  **What**: UA 문자열 감지 (KAKAOTALK, NAVER) → "외부 브라우저에서 열기" 배너. intent URL 처리.
  **Agent**: `quick` | **Skill**: [`playwright`]
  **Parallel**: YES (with Tasks 12, 13, 14) | **Blocks**: None
  **QA**: Playwright - KakaoTalk UA 감지, 배너 표시, 외부 브라우저 링크
  **Commit**: `feat(detect): KakaoTalk/Naver in-app browser banner`

- [ ] 16. PWA Manifest + Install Prompt + Offline Mode
  **What**: `manifest.ts`, Serwist 설정 (Turbopack), 설치 프롬프트 UI, 오프라인 대체 페이지 (`app/~offline/page.tsx`).
  **Agent**: `unspecified-high` | **Skill**: []
  **Parallel**: YES (with Tasks 17, 18) after Tasks 14, 2 | **Blocks**: Final Verification
  **QA**: Lighthouse - PWA 점수 > 90, Serwist 오프라인 모드 테스트
  **Commit**: `feat(pwa): PWA manifest + install prompt + offline mode`

- [ ] 17. Error States + Empty States + Loading Skeletons
  **What**: 모든 페이지의 로딩/에러/빈 상태 컴포넌트. skeleton UI, 에러 바운더리, 재시도 버튼.
  **Agent**: `visual-engineering` | **Skill**: [`playwright`]
  **Parallel**: YES (with Tasks 16, 18) | **Blocks**: Final Verification
  **QA**: Playwright - 로딩 스켈레톤, 에러 상태, 빈 상태 (INFO-200)
  **Commit**: `feat(ui): error, empty, and loading states`

- [ ] 18. 개인정보처리방침 + 동의 로깅 시스템
  **What**: `/privacy` 페이지, 동의 로깅 테이블 (`consent_logs`), {user_id, method, ip_hash, timestamp, scope, text_version}. 14세 미만 가입 차단.
  **Agent**: `writing` | **Skill**: []
  **Parallel**: YES (with Tasks 16, 17) | **Blocks**: Final Verification
  **QA**: Playwright - 개인정보처리방침 페이지, 동의 로깅 확인
  **Commit**: `docs(privacy): 개인정보처리방침 + 동의 로깅 시스템`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .omo/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `bun run build` + `bun test` + lint. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp). Verify `@serwist/next` (NOT `next-pwa`), Pretendard Variable with `weight: "45 920"`, `word-break: keep-all`, Korean-optimized line-height.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration: school selection → timetable → assignment → notification flow. Test edge cases: empty state (INFO-200), rate limit (ERROR-337), offline mode, KakaoTalk UA detection. Save to `.omo/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| Task(s) | Message | Key Files | Pre-commit |
|---------|---------|-----------|------------|
| 1, 2, 3 | `feat(spike): validate NEIS API, PWA push, and Supabase auth` | spike files | `bun test` |
| 4 | `chore: scaffold Next.js + Supabase + shadcn/ui + TDD` | project root | `bun run build` |
| 5 | `feat(api): add NEIS API client with caching and error handling` | `lib/neis/` | `bun test lib/neis` |
| 6 | `feat(ui): school selection search and persistence` | `components/school/`, `app/school/` | `bun test` |
| 7 | `chore(ui): add Pretendard font and Korean typography` | `app/layout.tsx`, `tailwind.config.ts` | `bun run build` |
| 8 | `feat(meal): 급식표 page with allergen parsing` | `app/meal/` | `bun test` |
| 9 | `feat(timetable): 시간표 page (고등학교)` | `app/timetable/` | `bun test` |
| 10 | `feat(schedule): 학사일정 page with lunar holidays` | `app/schedule/` | `bun test` |
| 11 | `feat(assignment): 수행평가/숙제 CRUD` | `app/assignments/` | `bun test` |
| 12 | `feat(push): browser push notifications with 스팸방지법 opt-in` | `lib/push/`, `components/consent/` | `bun test` |
| 13 | `feat(email): email notifications via Resend` | `supabase/functions/` | `bun test` |
| 14 | `feat(dashboard): 오늘 대시보드` | `app/dashboard/` | `bun test` |
| 15 | `feat(detect): KakaoTalk/Naver in-app browser banner` | `lib/detect-browser/`, `components/BrowserBanner/` | `bun test` |
| 16 | `feat(pwa): PWA manifest + install prompt + offline mode` | `public/manifest.json`, `sw.ts` | `bun run build` |
| 17 | `feat(ui): error, empty, and loading states` | `components/ui/` | `bun test` |
| 18 | `docs(privacy): 개인정보처리방침 + 동의 로깅 시스템` | `app/privacy/`, `lib/consent/` | `bun test` |

---

## Success Criteria

### Verification Commands
```bash
bun run build          # Expected: Successful build with no errors
bun test               # Expected: All tests pass
npx lighthouse-ci      # Expected: PWA score > 90
bun test lib/neis/     # Expected: NEIS API client tests pass (4/4)
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass
- [ ] Lighthouse PWA score > 90
- [ ] NEIS API 연동 5개 이상 학교에서 성공
- [ ] 브라우저 푸시 알림 수신 (Samsung Internet + Chrome)
- [ ] 카카오톡 인앱 브라우저 감지 배너 동작
- [ ] 스팸방지법 준수 인앱 opt-in 동작
- [ ] 모든 날짜/시간 UTC 저장, KST 표시
- [ ] "출처: 교육부 나이스" 모든 NEIS 데이터에 표시