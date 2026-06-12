# school-alrimi Learnings

## 2026-06-13 — Task 6: School Selection UI

### NEIS schoolInfo API

- Endpoint: https://open.neis.go.kr/hub/schoolInfo?Type=json&SCHUL_NM={keyword}&pIndex=1&pSize=20
- Errors come as HTTP 200 with RESULT.CODE — must parse INFO-200 (empty) vs INFO-000 (success)
- Success shape: { schoolInfo: [{ head: [...], row: [...] }] }
- Empty/error shape: { RESULT: { CODE, MESSAGE } }

### Server Actions in Next.js App Router

- A function marked "use server" can be imported directly into a client component
- Next.js automatically creates the RPC boundary — no separate API route needed
- This is the cleanest way to call external APIs from interactive UI without exposing keys

### localStorage in jsdom + vitest

- jsdom does not provide localStorage by default in this environment
- Must mock it in setup.ts

### Debounce with useTransition

- useTransition gives a pending state for server actions
- Combine with setTimeout in useEffect for debounce
- Wrap vi.advanceTimersByTime() in act() when testing to avoid React warnings

### shadcn/ui Component Patterns

- Card: Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- Input: single styled input with focus rings and aria-invalid support
- Badge: cva-based variants (default, secondary, destructive, outline)

### Korean Text Layout

- word-break: keep-all prevents awkward mid-word breaks in Korean school names
- Applied inline on school name headings

---

## 2026-06-13 — Task 7: Korean Typography + Pretendard (Toast + Theme polish)

### Sonner for toasts (chose over react-hot-toast)

- shadcn/ui ships a sonner integration out of the box and `toast.promise` is built-in — no need for a separate loading-state component.
- `richColors` plus per-type data attributes gives full control: `[data-sonner-toast][data-type="success"|"error"|"info"|"warning"]`.
- Mounted in `RootLayout` **after** `{children}` so it always paints on top, regardless of route-level z-index regressions.

### Korean UX rules locked in

- **Toast position = top-center.** Matches 네이버, 카카오톡, 토스, 배민 conventions. Bottom-right is associated with OS push notifications and is easy to miss on small phone screens.
- **Duration = 3000ms.** 2s feels rushed for a 5-어절 sentence; 4s+ feels broken. 3s is the sweet spot.
- **`word-break: keep-all`** (inherited) — never use `break-all` for Korean.
- **`line-height: 1.7`** for Korean body text. Latin default 1.5 feels cramped with Hangul.
- **`letter-spacing: -0.01em`** — subtle tightening improves Pretendard's optical spacing on small screens.

### shadcn theme token gap found

- The shadcn `button.tsx` references `bg-primary`, `text-primary-foreground`, `border-border`, `ring-ring/50`, `bg-destructive/10`, etc., but `globals.css` only defined `--background` and `--foreground`. Those utilities were silently no-ops.
- Added the full shadcn-compatible token set under `@theme inline` (light + `prefers-color-scheme: dark` variants): `--card`, `--popover`, `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--destructive-foreground`, `--border`, `--input`, `--ring`, `--radius`.
- Added Korean-conventional extras: `--success` (green), `--info` (blue), `--warning` (amber) for toast variants. Mapped to `--color-success` etc. so `bg-success/10`, `text-info` etc. work as Tailwind utilities.

### Per-type toast coloring strategy

- Use `color-mix(in oklch, var(--success) 12%, var(--popover))` to tint the toast background — gives a 12% saturation wash that reads as "success" without crushing body text legibility.
- Border uses `color-mix(in oklch, var(--success) 40%, var(--border))` so the chrome matches the wash.

### Gotchas hit

- `bun add sonner` failed with `EINVAL: Failed to replace old lockfile on disk` on Windows (likely an antivirus / file-handle race). Bun had already written `node_modules/sonner/` before the lockfile step. Manually added `"sonner": "^2.0.7"` to `package.json`. No `bun.lock` exists in the repo, so the install state is consistent (manifest + node_modules only).
- Tee'ing `bun run build` output into `.next/build.log` blew up with `EBUSY: unlink` because Next wipes `.next/` during build. Use `%TEMP%` for build logs.
- `sonner` is imported in two files (`toaster.tsx` for the component, `toast.ts` for the helpers). To keep call sites consistent, the rest of the app should `import { toast } from "@/lib/toast"` — never `from "sonner"`. Future: a one-line eslint rule (`no-restricted-imports`) could enforce this.

### Verification

- `bun run build` → exit 0, TypeScript clean, 3 routes prerendered (`/`, `/_not-found`, `/school`).
- `bun run test` → 9/9 tests pass (dummy + school/search).
- Toast renders via `<Toaster />` portal; Korean strings in `toast.success("저장되었습니다")` render in Pretendard because `[data-sonner-toast]` has `font-family: var(--font-sans)`.
- Evidence: `.omo/evidence/task-7-korean-typography.txt`.

### Next-task inputs

- Use `import { toast } from "@/lib/toast"` everywhere.
- If a manual theme switch is needed later, move the `:root` blocks under a `.dark` class and add a `next-themes` provider (current setup is `prefers-color-scheme: dark` only).
- The token system is now ready for any new shadcn component (`npx shadcn@latest add <x>`) — utilities like `bg-primary`, `text-muted-foreground`, `border-input` will style correctly out of the box.
