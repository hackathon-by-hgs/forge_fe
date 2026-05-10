# Forge frontend — integration handoff

You are the frontend agent. Your job is to replace the `@forge/mock-data` layer in `forge_fe/apps/employer-web` and `forge_fe/apps/bank-web` with real HTTP calls against the Forge backend, page by page, until every screen renders against live data.

This file is the end-to-end runbook. Companion docs you should read once before starting:

1. [HANDOFF.md](HANDOFF.md) — backend handoff (phases, conventions, gotchas).
2. [BACKEND_BRIEF.md](BACKEND_BRIEF.md) — canonical product + API spec (treat §10 as authoritative for endpoint shapes).
3. **OpenAPI spec at `/v1/openapi.json`** and **Swagger UI at `/docs`** — the live, generated source of truth for what the backend currently serves. If a shape disagrees with the brief, the spec wins (and the BE agent will update the brief).

Source-of-truth Zod schemas: `forge_fe/packages/types/src/*`. Sample data: `forge_fe/packages/mock-data/src/*`. The DB seed in [app/prisma/seed.ts](app/prisma/seed.ts) mirrors those byte-for-byte, so any ID you find in mock-data exists in the dev DB.

---

## 0. Environment & demo logins

| | |
|---|---|
| **API base (prod)** | `https://forgebe-production.up.railway.app` |
| **API base (local)** | `http://localhost:3000` |
| **All paths prefixed** | `/v1` (Swagger UI itself lives at `/docs`, raw spec at `/v1/openapi.json`) |
| **Employer FE dev port** | `7070` (`pnpm dev` in [forge_fe/apps/employer-web]) |
| **Bank FE dev port** | check that app's package.json |

Set `NEXT_PUBLIC_API_BASE_URL` per app. Cookies: in dev leave `COOKIE_DOMAIN` unset on the BE so the refresh cookie attaches to localhost; in prod the BE sets `Domain=.forge.app` so `employer.forge.app` and `bank.forge.app` share one session.

**Demo dashboard logins** (password `forge-demo-pass`):

```
owner+emp_0001@example.ng       business_owner          → employer-web full access
manager+emp_0001@example.ng     business_hiring_manager → employer-web, no settings/billing
credit+bnk_gtbank@example.ng    bank_credit_officer     → bank-web full lending
risk+bnk_gtbank@example.ng      bank_risk_analyst       → bank-web read-only
admin@forge.app                 platform_admin          → not surfaced to either dashboard
```

---

## 1. Integration order (do not skip ahead)

The backend ships in five phases (see [HANDOFF.md](HANDOFF.md) §"What's NOT done"). Your integration mirrors them — each phase ends with a fully working dashboard area you can demo against the seeded DB.

| FE phase | What you wire | BE prerequisite |
|---|---|---|
| **F0 — Plumbing** | OpenAPI codegen, API client, auth provider, refresh strategy, error envelope handling, React Query setup, SSE hook scaffold (no consumers yet). | BE Phase 0 (done). |
| **F1 — Overview + nav shell** | Login → Overview page renders against `GET /v1/employer/overview`. Notifications popover + bell-count. ⌘K search. Settings → Business + Team. | BE Phase 1. |
| **F2 — Hire-to-clock-out** | `/jobs/active`, `/jobs/[id]`, post-job flow, applications accept/reject, `/workers/active`, `/workers/team`, `/workers/browse`, worker profile. Photo presign upload. | BE Phase 2. |
| **F3 — Money** | `/payments/transactions`, `/payments/invoices`, `/payments/payouts`. Squad top-up checkout redirect. CSV export downloads. | BE Phase 3. |
| **F4 — Analytics + Credit + Bank** | `/analytics/*` charts, `/credit` page with loan applications, **bank-web Risk Radar + Loans**. SSE consumers go live (overview map, activity feed, notifications, bank radar). | BE Phase 4. |
| **F5 — Polish** | NDPR data export UI, role gating polish, empty states, error toasts, accessibility pass, Lighthouse. | BE Phase 5. |

Within each phase ship one screen end-to-end (mock removed, types from spec, loading + error + empty states, role-gated, SSE invalidation if applicable) before starting the next. Don't half-wire five pages.

---

## 2. F0 plumbing — do this once, in order

### 2.1 Generate types from the OpenAPI spec

Run the BE locally (`pnpm --filter app start:dev` in `forge_be`), hit `http://localhost:3000/v1/openapi.json`, and feed it into a generator. **Recommended: `openapi-typescript`** (lightweight, no runtime, produces `paths` + `components` types):

```bash
pnpm add -D openapi-typescript
pnpm openapi-typescript http://localhost:3000/v1/openapi.json -o packages/types/src/api.gen.ts
```

Add a `types:gen` script to the `packages/types` package and run it whenever the BE adds endpoints. **Do not hand-write types for endpoint payloads** — let the spec drive them. Only `packages/types/src/*.ts` Zod schemas (already shared with the BE seed) stay hand-written; the generated `api.gen.ts` sits next to them.

If you prefer a runtime client, `openapi-fetch` pairs natively with the generated types — pick that if you don't want a separate fetch wrapper.

### 2.2 Build the API client

One file, one export, used by every hook. Put it at `apps/employer-web/lib/api.ts` (and copy to `apps/bank-web/lib/api.ts`).

Required behavior:

1. **Base URL** from `NEXT_PUBLIC_API_BASE_URL`.
2. **Credentials: `include`** on every request (the refresh cookie is `HttpOnly` and scoped to `/v1/dashboard/auth`).
3. **Authorization header** with the in-memory access token. The access token is **never** in `localStorage` or cookie — keep it in a module-level variable (or a Zustand store) so XSS can't lift it.
4. **Auto-refresh on 401**: catch 401, call `POST /v1/dashboard/auth/refresh`, store the new access token, retry once. If refresh itself 401s → redirect to `/login`. Coalesce concurrent refreshes (a single in-flight refresh promise).
5. **Idempotency-Key**: when the caller passes one, forward as a header. Mutations on the brief's idempotent list (see §6) require a UUID — generate it in the mutation hook, not in the client.
6. **Error parsing**: every non-2xx parses the `{ error: { code, message, details? } }` envelope and throws an `ApiError` carrying `status`, `code`, `message`, `details`. UI shows `message`; logic branches on `code`.

Error codes you'll route on (full list in [app/src/common/filters/http-exception.filter.ts](app/src/common/filters/http-exception.filter.ts)):

```
VALIDATION_FAILED  AUTH_REQUIRED  FORBIDDEN  NOT_FOUND  CONFLICT
GONE  FILE_TOO_LARGE  UNSUPPORTED_TYPE  BUSINESS_RULE_VIOLATION
RATE_LIMITED  PROVIDER_UNAVAILABLE  MAINTENANCE  INTERNAL
```

Plus domain-specific codes returned by individual endpoints (e.g. `EMAIL_ALREADY_REGISTERED`, `INVALID_CREDENTIALS`, `TOKEN_INVALID`, `TOKEN_EXPIRED`). Treat unknown codes as `INTERNAL`.

### 2.3 Auth provider + boot sequence

Page load → call `GET /v1/dashboard/auth/refresh` (browser auto-sends the cookie). Three outcomes:

| Outcome | Action |
|---|---|
| 200 with `{ accessToken, accessExpiresAt, user }` | Store token in memory, hydrate user, render app. |
| 401 | Redirect to `/login`. |
| Network error | Show retry toast, do not redirect. |

Login flow: `POST /v1/dashboard/auth/email/login` returns the same `LoginResponseDto`. Refresh cookie is set automatically by the response. **Do not** read or write the refresh cookie from JS — it's `HttpOnly`.

Logout: `POST /v1/dashboard/auth/logout` clears the cookie server-side. Also wipe in-memory access token.

Role gating: the `user.role` from `/me` drives nav visibility and route access (matrix in [BACKEND_BRIEF.md](BACKEND_BRIEF.md) §5). Don't hide features that the user could access — only hide features the role can't.

### 2.4 React Query conventions

- One `QueryClient` per app, with `staleTime: 30_000` and `refetchOnWindowFocus: true` for dashboard data (it's mostly real-time-ish anyway).
- **Query keys are stable arrays**: `['jobs', 'active', { status, type, page }]`. The first segment is the resource, the second is the view, third is the params.
- Mutations call `queryClient.invalidateQueries({ queryKey: ['jobs'] })` on success; SSE events also drive invalidations once F4 lands.
- `useSuspenseQuery` for above-the-fold data only; use plain `useQuery` for everything else so you can render skeletons.

### 2.5 Error/empty/loading states baseline

Every page needs three branches before you call it done: **loading skeleton**, **empty state with CTA**, **error state with retry**. The `@forge/ui` package likely has primitives — check `forge_fe/packages/ui` before rolling your own.

---

## 3. Conventions you must respect

These mirror [HANDOFF.md](HANDOFF.md) §"Conventions" but framed for the wire boundary you actually consume.

- **Wire format on the dashboard side is `camelCase`.** The worker mobile API uses `snake_case`; ignore those endpoints unless explicitly asked.
- **Money is integer Naira at the boundary.** No kobo, no decimals, no string-with-currency-symbol. Format with `Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })` at render time only.
- **Time is ISO-8601 with offset** (e.g. `2026-05-10T14:30:00+01:00`). Parse with `new Date()` or `date-fns/parseISO`. **Never construct dates client-side and POST them as `toISOString()` without offset** — Lagos is `+01:00`, not Z.
- **Pagination is offset on the dashboard side** (`?page=&pageSize=`, max 100). Worker mobile uses cursor — don't conflate them. Response envelope:
  ```ts
  { data: T[], pagination: { page, pageSize, total, totalPages } }
  ```
- **Filtering, sorting, search**: see [BACKEND_BRIEF.md](BACKEND_BRIEF.md) §6. Always typed params; never blast `?filter={…}` JSON.
- **Don't pass `employerId` or `bankId` in queries.** Tenant scope is derived from the JWT server-side. If a payload field asks for an ID that's "yours", that's a bug — flag it.
- **404 means "not visible to you" *or* "doesn't exist".** Don't differentiate in UI copy. The BE deliberately doesn't leak existence.
- **Idempotency-Key is a UUID v4** (use `crypto.randomUUID()`). Required on the endpoints starred in §6 below. Generate fresh per intent — don't reuse across retries of *different* user actions, and don't generate inside the API client (it would change on retry, defeating the purpose).
- **TypeScript strict, no `any`.** Same rule as the BE.

---

## 4. Authentication wiring — exact

```
1. Browser GET /                                   → app shell, calls /me
2. App boot:    POST /v1/dashboard/auth/refresh   (cookie auto-sent)
                ├─ 200 → store accessToken in memory, render dashboard
                └─ 401 → redirect /login
3. Login form:  POST /v1/dashboard/auth/email/login  body: { email, password }
                ← Set-Cookie: forge_dash_refresh=…; HttpOnly; Path=/v1/dashboard/auth
                ← { accessToken, accessExpiresAt, user }
4. Every API:   Authorization: Bearer <accessToken>   credentials: include
5. On 401:      POST /v1/dashboard/auth/refresh → retry original once
6. Logout:      POST /v1/dashboard/auth/logout
   Logout-all:  POST /v1/dashboard/auth/logout-all   (Bearer required)
7. Profile:     GET  /v1/dashboard/auth/me           (Bearer required)
```

Endpoints documented in [app/src/modules/dashboard-auth/dashboard-auth.controller.ts](app/src/modules/dashboard-auth/dashboard-auth.controller.ts). Swagger tag: **Dashboard Auth**.

**Reuse-detection caveat.** Refresh tokens are single-use and family-revoking. If you call `/refresh` twice with the same token (e.g. a stale tab does it after a fresh tab already refreshed), the entire family is killed and the user is signed out everywhere. Coalesce concurrent refreshes in one in-flight promise; do not call `/refresh` speculatively.

**Bank signup gap.** Self-signup with `role: bank_credit_officer` or `business_owner` via `/dashboard/auth/email/register` currently produces orphan users with no `bankId`/`employerId`. The product flow that fixes this (`/dashboard/auth/business/register`, `/dashboard/team/invite`) is on BE Phase 1. **Don't expose a bank or business-owner self-signup form** until those endpoints exist — surface "request access" copy instead.

---

## 5. Feature → endpoint map (the swagger feature-spec)

This is the canonical "what does each backend endpoint power on the dashboards" map. Cross-reference it against `/docs` — the Swagger UI groups endpoints by tag (`Dashboard Auth`, `Employer`, `Bank`, …); this section adds the **screen-level** feature mapping the FE needs.

Status legend: **🟢 LIVE** (wired in BE), **🟡 PHASE 1+** (planned, see HANDOFF phase column), **⚡** = `Idempotency-Key` required.

### 5.1 Employer dashboard — Overview (`/`)

Anchor screen for BE Phase 1. Single composite endpoint + SSE.

| Screen element | Endpoint | Status | Notes |
|---|---|---|---|
| Metric tiles (active jobs, workers working, today's spend, pending payments) | `GET /v1/employer/overview` → `metrics` | 🟡 P1 | Each tile reads `value`, `deltaPct`, `trend[]`. |
| Live operations map (job pins) | `GET /v1/employer/overview` → `liveJobs[]` + SSE `worker_clocked_in/out`, `job_completed` | 🟡 P1 / 🟡 P4 | Up to 50 pins; pin color = `status`. SSE updates pin without refetch. |
| Attention strip (applications waiting, starting soon, late) | `GET /v1/employer/overview` → `attention[]` | 🟡 P1 | Each item has `kind`, `count`, `href`. |
| Cash position card | `GET /v1/employer/overview` → `cashPosition` | 🟡 P1 | `walletBalanceNaira`, `projectedWeeklySpendNaira`, `spendTrend7d[]`. |
| Credit health card | `GET /v1/employer/overview` → `creditHealth` | 🟡 P1 | `score`, `deltaPoints`, `topFactors[]`, `eligibility`. |
| Starting soon strip | `GET /v1/employer/overview` → `startingSoon[]` | 🟡 P1 | 4 jobs. |
| Recent activity feed | SSE `/v1/stream` filtered by employer | 🟡 P4 | Until SSE lands, fall back to `/v1/jobs/:id/timeline` polled at 30s. |

Exact response shape: [BACKEND_BRIEF.md](BACKEND_BRIEF.md) §10.2.

### 5.2 Employer — Jobs

Routes on FE: `/jobs/active`, `/jobs/[id]`, `/jobs/post`, `/jobs/browse`. BE Phase 2.

| Screen element | Endpoint | Status | Notes |
|---|---|---|---|
| Active jobs Kanban + table | `GET /v1/jobs/active` | 🟢 worker-mobile / 🟡 P2 dashboard view | Kanban groups by `status`; table is paginated. |
| All jobs (with filters/search) | `GET /v1/jobs?status[]=&type=&q=&from=&to=&page=&pageSize=` | 🟡 P2 | Filterable per BACKEND_BRIEF §10.3. |
| "Post like a recent job" cards | `GET /v1/jobs/recent-templates` | 🟡 P2 | Top 3. |
| Post job form | ⚡ `POST /v1/jobs` | 🟡 P2 | Body: `{ title, description, type, payNaira, durationHours, location, audience, scheduledStartAt, postNow }`. |
| Job detail page | `GET /v1/jobs/:id` | 🟡 P2 | |
| Job edit | `PATCH /v1/jobs/:id` | 🟡 P2 | Allowed in `draft` and `open` only. |
| Publish draft | `POST /v1/jobs/:id/publish` | 🟡 P2 | |
| Cancel job | `POST /v1/jobs/:id/cancel` | 🟡 P2 | Triggers worker notification. |
| Status timeline on detail page | `GET /v1/jobs/:id/timeline` | 🟡 P2 | `JobEvent[]` chronological. |
| Applications list (rank-by-score+distance) | `GET /v1/jobs/:id/applications` | 🟡 P2 | |
| Accept application (auto-rejects others) | `POST /v1/jobs/:id/applications/:appId/accept` | 🟡 P2 | Atomic — single transaction on BE. |
| Reject application | `POST /v1/jobs/:id/applications/:appId/reject` | 🟡 P2 | |
| Completion proof card (photos + GPS verify) | `GET /v1/jobs/:id/proof` | 🟡 P2 | |
| Generate single-job invoice | `POST /v1/jobs/:id/invoice` | 🟡 P3 | Returns `Invoice` + signed `pdfUrl`. |
| Export filtered jobs | `GET /v1/jobs/export.csv` | 🟡 P2 | Streamed; trigger via anchor with same filters. |

### 5.3 Employer — Workers

Routes: `/workers/active`, `/workers/team`, `/workers/browse`, `/workers/[id]`. BE Phase 2.

| Screen element | Endpoint | Status | Notes |
|---|---|---|---|
| Active assignments map + table | `GET /v1/workers/active-assignments` | 🟡 P2 | Workers currently in `in_progress` jobs for this employer; includes GPS verify, photo status, elapsed minutes. |
| Saved team list | `GET /v1/workers/team?sortBy=hired\|rating\|recent` | 🟡 P2 | Workers explicitly added OR hired ≥ 2 jobs. |
| Add to team | `POST /v1/workers/team/:workerId` | 🟡 P2 | |
| Remove from team | `DELETE /v1/workers/team/:workerId` | 🟡 P2 | |
| Browse Talent table (10km radius) | `GET /v1/workers?skill=&neighborhood=&scoreMin=&scoreMax=&eligibility=&q=` | 🟡 P2 | Radius computed from `Employer.registeredLocation`. |
| Worker public profile | `GET /v1/workers/:id` | 🟡 P2 | Returns worker + `pastJobsWithEmployerCount`, `recentReviews[]`, `reliabilitySnapshot`. |
| "Jobs with us" list on profile | `GET /v1/workers/:id/jobs` | 🟡 P2 | Past jobs this worker did **for this employer** specifically. |
| Block / unblock from profile | `POST /v1/workers/:id/block` / `DELETE` | 🟡 P2 | |

### 5.4 Employer — Payments

Routes: `/payments/transactions`, `/payments/invoices`, `/payments/payouts`. BE Phase 3.

| Screen element | Endpoint | Status | Notes |
|---|---|---|---|
| Transactions table (filter, search) | `GET /v1/transactions?status=&from=&to=&q=` | 🟡 P3 | `q` matches worker name + Squad ref + job ID. |
| 4 metric tiles (paid this month, pending, avg job cost, largest payment) | `GET /v1/transactions/summary` | 🟡 P3 | |
| Export transactions | `GET /v1/transactions/export.csv` | 🟡 P3 | Streamed CSV. |
| Single transaction drawer | `GET /v1/transactions/:id` | 🟡 P3 | |
| Manual transfer (rare) | ⚡ `POST /v1/transactions` | 🟡 P3 | |
| Invoices list | `GET /v1/invoices?status=&from=&to=` | 🟡 P3 | |
| Generate batch invoice | ⚡ `POST /v1/invoices/generate-batch` | 🟡 P3 | Body: `{ from, to, workerIds?, jobIds? }`. |
| Send invoice email | `POST /v1/invoices/:id/send` | 🟡 P3 | |
| Download invoice PDF | `GET /v1/invoices/:id/pdf` | 🟡 P3 | Signed redirect to S3. |
| Upcoming payouts | `GET /v1/payouts/upcoming` | 🟡 P3 | |
| Payout history | `GET /v1/payouts/history` | 🟡 P3 | |
| Pause / resume auto-debit | `POST /v1/payouts/pause`, `POST /v1/payouts/resume` | 🟡 P3 | |
| Wallet top-up button | `POST /v1/payouts/top-up` | 🟡 P3 | Returns Squad checkout URL — `window.location.assign` it. |

### 5.5 Employer — Analytics

Route: `/analytics`. BE Phase 4. All accept `?from=&to=`.

| Chart | Endpoint | Status |
|---|---|---|
| Labor cost area chart | `GET /v1/analytics/labor-cost-trend?range=7\|30\|90` → `[{ date, costNaira }]` | 🟡 P4 |
| Cost-by-job-type donut | `GET /v1/analytics/cost-by-job-type` → `[{ name, valueNaira }]` | 🟡 P4 |
| Top-8 worker utilization bar | `GET /v1/analytics/worker-utilization` → `[{ workerId, name, jobs }]` | 🟡 P4 |
| Time-to-fill weekly avg | `GET /v1/analytics/time-to-fill` → `[{ week, minutes }]` | 🟡 P4 |
| Demand heatmap (day × hour) | `GET /v1/analytics/demand-heatmap` → `[{ x, y, value }]` | 🟡 P4 |
| ROI-by-type table | `GET /v1/analytics/roi-by-type` | 🟡 P4 |

### 5.6 Employer — Credit & loans

Route: `/credit`. BE Phase 4.

| Screen element | Endpoint | Status | Notes |
|---|---|---|---|
| Credit page (composite) | `GET /v1/credit` | 🟡 P4 | Score, 12-week trend, factor breakdown, eligibility, active loan summary, past loans — all in one. |
| Longer score history (if needed) | `GET /v1/credit/score-history` | 🟡 P4 | 12-month. |
| Apply for loan | `POST /v1/loan-applications` body `{ amountNaira, termMonths }` | 🟡 P4 | Returns indicative decision. |
| Loans list | `GET /v1/loans` | 🟡 P4 | |
| Loan detail | `GET /v1/loans/:id` | 🟡 P4 | |
| Loan repayment schedule | `GET /v1/loans/:id/repayments` | 🟡 P4 | |

### 5.7 Employer — Notifications, Search, Settings

| Screen element | Endpoint | Status | Notes |
|---|---|---|---|
| Notifications popover list | `GET /v1/notifications?page=` | 🟡 P1 | Plus SSE `notification_created` to prepend live. |
| Bell badge count | `GET /v1/notifications/unread-count` | 🟡 P1 | Cheap endpoint — poll on focus or rely on SSE. |
| Mark all read | `POST /v1/notifications/mark-all-read` | 🟡 P1 | |
| Mark one read | `POST /v1/notifications/:id/read` | 🟡 P1 | |
| ⌘K search | `GET /v1/search?q=` | 🟡 P1 | Returns `{ jobs, workers, transactions }` capped at 5 each. |
| Business profile | `GET /v1/settings/business`, `PATCH …` | 🟡 P1 | |
| Team list + invite | `GET /v1/settings/team`, `POST /v1/settings/team/invite`, `PATCH /v1/settings/team/:userId`, `DELETE …` | 🟡 P1 | Invite body: `{ email, role }`. |
| Notification prefs | `GET /v1/settings/notifications`, `PATCH …` | 🟡 P1 | |
| Squad wallet status | `GET /v1/settings/squad`, `POST /v1/settings/squad/disconnect` | 🟡 P3 | |
| Billing | `GET /v1/settings/billing`, `PATCH …` | 🟡 P1 | |

### 5.8 Bank dashboard — Risk Radar

Route: bank-web `/`. BE Phase 4.

| Screen element | Endpoint | Status | Notes |
|---|---|---|---|
| Risk Radar composite (critical, watchlist, portfolio metrics, opportunity) | `GET /v1/bank/risk-radar` | 🟡 P4 | Single payload. |
| Loan portfolio table | `GET /v1/bank/loans?riskLevel=&status=&borrowerType=&q=` | 🟡 P4 | |
| Bank notifications | `GET /v1/bank/notifications` | 🟡 P4 | Same shape as employer notifications. |
| Live alerts strip | SSE `/v1/stream` events `loan_repayment_missed`, `credit_score_updated`, `loan_disbursed` | 🟡 P4 | |

Underwriting Sandbox / Performance Attribution / Borrower Profile screens are out of scope (frontend not built — coordinate with BE before designing endpoints).

### 5.9 Worker mobile (NOT your concern)

The worker mobile app is built by another engineer. Endpoints under `/v1/auth/*` (worker), `/v1/jobs/*` (worker view), `/v1/applications/*`, `/v1/sessions/*`, `/v1/me/*`, `/v1/wallet/*`, `/v1/loans/*` (worker), `/v1/support/*` are theirs. **Don't call them from the dashboards** — they use `snake_case` and a different JWT.

---

## 6. Idempotency-Key — exhaustive list

Generate one UUID v4 per user-intent and pass as `Idempotency-Key` header. Required on:

- ⚡ `POST /v1/jobs`
- ⚡ `POST /v1/transactions`
- ⚡ `POST /v1/invoices/generate-batch`
- ⚡ `POST /v1/loans/:id/disburse` *(bank dashboard, when wired)*
- ⚡ `POST /v1/loan-repayments/:id/pay` *(bank dashboard, when wired)*

Recipe:

```ts
const mutation = useMutation({
  mutationFn: async (input: PostJobInput) => {
    const idempotencyKey = crypto.randomUUID();
    return api.post('/v1/jobs', input, { headers: { 'Idempotency-Key': idempotencyKey } });
  },
});
```

The key is generated **inside the mutation function**, not in the API client wrapper. React Query's automatic retry on the same mutation call replays with the same key, which is the desired behavior — the BE caches and returns the original response.

---

## 7. Real-time stream (SSE)

`GET /v1/stream` (Bearer required, scoped to caller's tenant). Events emitted:

`job_posted | job_published | application_received | application_accepted | application_rejected | worker_clocked_in | worker_late | worker_clocked_out | photo_proof_uploaded | job_completed | job_cancelled | payment_initiated | payment_processed | payment_failed | credit_score_updated | loan_disbursed | loan_repayment_made | loan_repayment_missed | notification_created`

FE consumers:

| UI surface | Events to listen |
|---|---|
| Overview live map | `worker_clocked_in/out`, `job_completed`, `job_cancelled` → patch the matching pin in cache, no refetch. |
| Overview activity feed | All event kinds → prepend to feed. |
| Notifications popover | `notification_created` → prepend + bump unread count. |
| Jobs detail timeline | All events for that `jobId` → append. |
| Bank Risk Radar alerts | `loan_repayment_missed`, `credit_score_updated`, `loan_disbursed` → toast + invalidate `['bank','risk-radar']`. |

Implementation: native `EventSource` doesn't support custom headers, so either (a) use `fetch-event-source` and pass the Bearer header, or (b) accept the access token as a `?token=` query param if the BE exposes that fallback (check Swagger when SSE lands). On disconnect, exponential backoff up to 30s, then resume from `Last-Event-Id`.

SSE is a Phase 4 deliverable. Until then, fall back to React Query's `refetchInterval: 30_000` on the surfaces above.

---

## 8. File uploads (photos, etc.)

Two-step presigned PUT:

1. `POST /v1/uploads/presign` body `{ contentType, filename }` → returns `{ uploadUrl, s3Key, expiresAt }`.
2. `PUT <uploadUrl>` with the file as raw body, `Content-Type` matching what you sent. **Do not** include the `Authorization` header on this PUT — it goes to S3, and the presigned URL already authorizes it.
3. POST the resulting `s3Key` to whichever resource endpoint records it (e.g. job photo proof, employer logo).

Image preflight: cap at 10 MB, content-types `image/jpeg|png|webp`. The BE will 413 on oversize.

---

## 9. CSV exports

Endpoints ending in `.csv` (`/v1/jobs/export.csv`, `/v1/transactions/export.csv`) stream `text/csv; charset=utf-8` with a UTF-8 BOM. Trigger via:

```ts
const url = `${API}/v1/transactions/export.csv?${qs}`;
window.location.assign(url);  // browser handles streaming download via Content-Disposition
```

**Caveat**: that direct-link approach skips the API client's auth header injection. Use either (a) a fetch-then-blob-then-anchor flow that pulls auth from the in-memory token, or (b) a same-origin `/api/proxy/csv` route in Next.js that forwards with the token and streams back. (b) is cleaner for large files.

---

## 10. Codegen + type-sync workflow

When the BE adds endpoints (you'll see new entries in `/docs`):

```bash
# in forge_fe
pnpm --filter @forge/types types:gen
pnpm --filter employer-web typecheck
pnpm --filter bank-web typecheck
```

If the generated types break consumers, that's a contract change — **don't paper over it with `as any`**. Either the brief is stale (flag to the BE agent so they update [BACKEND_BRIEF.md](BACKEND_BRIEF.md)) or the FE is reading the wrong field (fix it).

Add a CI job that diffs the committed `api.gen.ts` against a fresh generation: if they differ, the build fails until someone regenerates and commits.

---

## 11. Definition of done — per page

Don't mark a page integrated until:

- [ ] Mocks deleted; only the real API client is imported.
- [ ] Types come from `api.gen.ts` (or `@forge/types` Zod) — no inline `interface { … }` for endpoint payloads.
- [ ] Loading skeleton, empty state, error state all render and are visually polished.
- [ ] Role gating respects the matrix in [BACKEND_BRIEF.md](BACKEND_BRIEF.md) §5.
- [ ] Mutations show optimistic state when sensible, invalidate cache on success, surface error toasts with `error.message` from the envelope.
- [ ] Keyboard reachable, screen-reader labels on icon-only buttons, focus rings visible.
- [ ] No console errors or unhandled promise rejections.
- [ ] Tested against at least two demo logins (e.g. `business_owner` and `business_hiring_manager`) to confirm role gating.
- [ ] If the page consumes SSE: dropping the connection and reconnecting works without duplicating cache entries.

---

## 12. How to ask questions

When something here is ambiguous:

1. Check `/docs` (Swagger UI) — the live spec is authoritative.
2. Check the corresponding screen in `forge_fe/apps/employer-web/app/...` and the matching `@forge/mock-data` shape; that's what the page already expects.
3. Read the relevant section of [BACKEND_BRIEF.md](BACKEND_BRIEF.md) §10–§11.
4. If still unclear, write the question with proposed answers (A/B/C). Don't ask open-ended questions — propose, then ask which to take.

If a Swagger entry is missing the dashboard-feature mapping (e.g. you can't tell whether `GET /v1/transactions/summary` powers a tile, a chart, or a filter), point the BE agent at this file's §5 — that mapping is the contract, and the BE Swagger description should match.

---

## 13. Anti-patterns — don't do these

- **Don't** persist the access token in `localStorage` or a non-`HttpOnly` cookie.
- **Don't** call `/refresh` on a timer or speculatively. It's reactive (on 401) only.
- **Don't** pass `employerId`/`bankId` from the client. Tenant scope comes from the JWT.
- **Don't** hand-roll endpoint types when the OpenAPI spec covers them.
- **Don't** convert Naira to/from kobo anywhere on the FE. The boundary is integer Naira.
- **Don't** bypass the error envelope by reading `response.statusText` — use the `code` from the JSON body.
- **Don't** mark a page done with mocks still imported "as a fallback". Either the page is on the real API or it isn't.

---

Welcome to Forge frontend integration. The dashboards already render against fixtures — your job is to make them render against truth, page by page, while the BE agent ships phases 1–5 underneath you.
