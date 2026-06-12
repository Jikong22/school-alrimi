
# Learnings - school-alrimi

## Conventions
- Use `@serwist/next` (NOT `next-pwa`)
- Pretendard Variable with `weight: "45 920"`
- `word-break: keep-all` for Korean text
- NEIS errors come as HTTP 200 with `data.RESULT.CODE`
- `SchoolSchedule` has uppercase S
- Wave 1: high school only (만14세 이상)
- 스팸방지법 7판: separate in-app opt-in required before browser permission

## Decisions
- [2026-06-12] Auth path = Supabase Auth + Postgres RLS (no custom auth server). Free tier is enough for MVP (500 MB DB / 50 K MAU / 1 GB storage).
- [2026-06-12] Age gate is enforced by a `BEFORE INSERT` trigger on `auth.users` reading `raw_user_meta_data->>'birthdate'`. The Supabase "Before User Created Hook" is a paid Advanced add-on — trigger is the free-tier path.
- [2026-06-12] Roles live in a separate `public.user_roles` table (not on `auth.users` app_metadata) so we can add columns (e.g., `school_id`, `linked_student_id`) without touching the auth schema. Wave 1 default is `'student'`.
- [2026-06-12] RLS performance pattern: wrap `auth.uid()` as `(select auth.uid())` so the planner caches the result per query. Combine with a `SECURITY DEFINER` + `STABLE` `get_my_role()` for the role lookup.
- [2026-06-12] All RLS-enabled tables use `FORCE ROW LEVEL SECURITY` so even the table owner is subject to policies. Service-role writes only happen via explicit admin scripts.
- [2026-06-12] All trigger functions are `SECURITY DEFINER` with `set search_path = ''` (Supabase official guidance) to prevent search-path injection.

## Findings (2026-06-12 — NEIS API spike)
- **Sample key works** for spike validation: omit `KEY` param entirely → 5-row cap, sufficient for probes
- **NEIS returns HTTP 200 for errors** — always check top-level `RESULT.CODE` first; rows live under endpoint key
- **Error codes (all HTTP 200)**: `INFO-000`=ok, `INFO-200`=empty(not error), `ERROR-290`=auth, `ERROR-300`=missing param, `ERROR-337`=rate limit, `ERROR-500/600`=server
- **Response shape**: success = `{<endpoint>: [{head:[...RESULT], row:[...]}]}`. Error = `{RESULT: {CODE, MESSAGE}}` (no endpoint key)
- **`SchoolSchedule` UPPERCASE S** — `schoolSchedule`/`school_schedule` silently fail. Same trap-prone camelCase for `hisTimetable` (lowercase h, lowercase t)
- **Empty periods in timetable**: 강서고 6/11 returned 6 periods (no PERIO=5). Don't assume 1..7 contiguous — render grid with gaps
- **Meal allergen codes** in parens at end of each DDISH_NM item: 1=난류 2=우유 3=메밀 4=땅콩 5=대두 6=밀 7=잣 8=호두 9=게 10=새우 11=오징어 12=고등어 13=토마토 14=산사유 15=닭 16=쇠고기 17=돼지 18=복숭아
- **DDISH_NM separator**: `<br/>` (with optional whitespace) — split with `/<br\s*\/?>/i`
- **`ORPLC_INFO`/`NTR_INFO`/`CAL_INFO`**: also `<br/>`-separated HTML
- **No timezone in dates** — KST assumed; store as KST date strings, display in KST
- **Caching TTLs**: meals 1-6h (1h during school day, 6h off-hours), timetable 24h, schedule 24h. Prewarm cron at 6AM KST for popular schools
- **Sample key issue**: 5-row hard cap, ~10K calls/day limit. Production key from data.go.kr (`dataset 15139198`) needed before launch
- **Server-side only**: never call NEIS from browser (CORS + key exposure). Use Next.js Route Handlers/Server Components

## Findings (2026-06-12 — PWA + Push spike)
- **@serwist/next configurator mode** works: `serwist.config.mjs` + `withSerwistInit` in next.config.ts + `serwist build` CLI
- **VAPID keys** generated via `web-push.generateVAPIDKeys()` — must regenerate for production, store private key in secrets manager
- **KakaoTalk UA detection**: `ua.toUpperCase().includes("KAKAOTALK")` — reliable, both Android/iOS
- **Naver UA detection**: `ua.toUpperCase().includes("NAVER")` — reliable, both Android/iOS
- **KakaoTalk/Naver in-app browsers** are WKWebView → no Service Worker support at all. Must detect and show "open in browser" fallback
- **Samsung Internet** kills background SW after ~2 min — push still arrives (OS-level), but use `event.waitUntil()` for async work
- **iOS Safari** push only works after "Add to Home Screen" — `Notification.requestPermission()` fails in regular Safari
- **pushsubscriptionchange**: Chrome/Firefox fire it on subscription rotation; Safari does NOT. Must check `getSubscription()` on app open as fallback
- **404/410 cleanup**: web-push throws `WebPushError` with statusCode 404/410 → delete subscription from DB immediately. 429 = rate limit, do NOT delete
- **스팸방지법 7판**: `Notification.requestPermission()` alone is NOT legally sufficient — separate in-app opt-in required before browser permission call

## Findings (2026-06-13 — Project Scaffolding / Task 4)
- **`npx shadcn@latest` (v2+) does NOT accept `--style` / `--base-color`** — it asks for a preset interactively. In non-TTY (CI/agent) contexts, pipe the preset number (1 = Nova) to default-select. The "Nova" preset is Tailwind v4 + Radix + lucide compatible
- **New shadcn ships its own unified `radix-ui` package** (not `@radix-ui/react-*` per-component). Imports use `import { Slot } from "radix-ui"` not `import { Slot } from "@radix-ui/react-slot"`. Smaller install footprint
- **`shadcn init` and `shadcn add` skip dep install in non-TTY mode** — they copy files but don't run `npm install`. Manually `bun add` the listed deps
- **`@supabase/ssr` v0.6.1 ships NO TypeScript types** in its published dist (only `.js` in `dist/main/`). Use a `declare module "@supabase/ssr"` ambient declaration in `src/types/modules.d.ts` covering the two factories (`createBrowserClient`, `createServerClient`) and the cookies adapter shape
- **`CookieOptions` is not exported from `@supabase/ssr`** even though it appears in source — pass cookie options as `unknown` and let Next.js's `cookies().set()` validate
- **`dom-accessibility-api@0.6.3` has a broken dist** — `dist/accessible-name-and-description.mjs` imports `./polyfills/SetLike.mjs` which is not published. This breaks Vitest 3 + jsdom 26 + `@testing-library/jest-dom` chain. **Fix: pin `dom-accessibility-api` to `0.5.16`** (last version with complete dist). Add a `// do-not-bump` comment next to the version pin
- **Pretendard Variable woff2 is NOT in the GitHub release zip** — the v1.3.9 release page lists no `PretendardVariable.zip` asset. Get it from jsDelivr: `https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/variable/woff2/PretendardVariable.woff2` (~2 MB)
- **`bun add` (without flags) fails with `EINVAL: Failed to replace old lockfile on disk`** when the project was scaffolded without a `bun.lock`/`bun.lockb`. Workaround: edit `package.json` directly + `bun install --no-save` to install, then commit the JSON change. The lockfile is never created but installs work
- **Bun's native `bun test` runner is separate from vitest** — `bun test` uses bun's built-in test runner with no jsdom, `bun run test` (or `bunx vitest`) uses vitest with the `vitest.config.ts` setup. A React/JSX test that passes in `bun run test` will fail in `bun test` with `ReferenceError: document is not defined`. Strategy: pure-JS smoke tests in `.test.ts` (work in both); component tests in `.test.tsx` (vitest-only)
- **Korean font fallback chain**: `Pretendard → -apple-system → Apple SD Gothic Neo → Noto Sans KR → Malgun Gothic → sans-serif`. Apple platforms fall through to SD Gothic Neo, Windows to Malgun Gothic, Linux to Noto Sans KR
- **Korean typography CSS**: `word-break: keep-all` (don't break Hangul syllables), `line-break: strict` (proper Korean spacing), `line-height: 1.7` (generous for CJK), `letter-spacing: -0.01em` (slight tightening), `text-underline-offset: 3px` (descenders sit lower)
- **Set `<html lang="ko">`** in layout for screen reader Korean pronunciation + `:lang(ko)` CSS selector to work

## Issues
- **[2026-06-13] `dom-accessibility-api` upstream regression**: v0.6.3 ships a broken dist (missing `dist/polyfills/SetLike.mjs`). Pin to `0.5.16` until upstream fixes. Tracked in `package.json` devDependencies
- **[2026-06-13] No `bun.lock`/`bun.lockb`** in the project — `bun add` (default mode) errors with `EINVAL: Failed to replace old lockfile on disk`. Workaround: edit `package.json` directly, then `bun install --no-save`. Not blocking but annoying for collaborators running `bun install`

## Problems

