# Frontend agent — Phase 0 + Phase 1 integration brief

You are the frontend agent for **Forge**, working in the `forge_fe` monorepo. Your job is to wire the dashboard FE apps (`apps/employer-web` and `apps/bank-web`) to the live Forge backend, replacing `@forge/mock-data` with real HTTP calls page by page.

The backend is deployed at `https://forgebe-production.up.railway.app` (set `NEXT_PUBLIC_API_BASE_URL` accordingly). Local: `http://localhost:3000`. Every path is prefixed `/v1`.

**Read these before touching anything:**
1. `forge_be/FRONTEND_INTEGRATION.md` — your full runbook (auth, conventions, feature → endpoint map, anti-patterns).
2. `forge_be/BACKEND_BRIEF.md` §3, §5, §6, §10 — wire conventions, roles, pagination/error envelope, endpoint shapes.
3. The live OpenAPI spec at `<API>/v1/openapi.json` (Swagger UI at `<API>/docs`) — every endpoint carries an **Audience** + **Powers** description naming the screen it serves.

If a shape disagrees between the brief and the spec, the spec wins.

---

## Scope of this task

Wire the **already-implemented** backend surface — Phase 0 (dashboard auth) plus Phase 1 (overview, notifications, search, settings, business signup, team invite/accept). Everything else (Jobs, Workers, Payments, Analytics, Credit, Bank Risk Radar) is **not yet built on the backend** — keep existing mocks and copy on those pages, or replace them with empty states that say "coming soon."

### In scope — endpoint inventory

**Auth (`Dashboard Auth` Swagger tag)**
- `POST /v1/dashboard/auth/email/login` — email + password login
- `POST /v1/dashboard/auth/email/register` — narrow generic signup (rejects `business_owner` and `bank_*` roles; route owners through business signup, bank users through invitations)
- `POST /v1/dashboard/auth/business/register` — **NEW** — atomic Employer + owner User signup (employer-web only)
- `POST /v1/dashboard/auth/email/verify` — confirm email via token from the verification email
- `POST /v1/dashboard/auth/email/forgot` — request password reset link (always 204; doesn't leak existence)
- `POST /v1/dashboard/auth/email/reset` — reset password via token
- `POST /v1/dashboard/auth/refresh` — rotate refresh cookie + new access token. **Returns 401 `NO_REFRESH_COOKIE` if no cookie** (use this to drive the "not logged in" branch on app boot)
- `POST /v1/dashboard/auth/logout`, `POST /v1/dashboard/auth/logout-all`
- `POST /v1/dashboard/auth/team/accept` — **NEW** — public; claim a team-invite token, create User, start session
- `GET /v1/dashboard/auth/me` — hydrate session

**Employer (`Employer` Swagger tag)**
- `GET /v1/employer/overview` — **NEW** — composite home-page payload (BRIEF §10.2 — exact shape) — `metrics`, `liveJobs[]`, `attention[]`, `cashPosition`, `creditHealth`, `startingSoon[]`. Tenant-scoped via JWT.
- `GET /v1/search?q=` — **NEW** — cross-entity ⌘K palette. Returns `{ jobs[], workers[], transactions[] }` capped at 5 each. Bank users get empty arrays.
- `GET /v1/settings/business`, `PATCH /v1/settings/business` — **NEW**
- `GET /v1/settings/team`, `POST /v1/settings/team/invite`, `PATCH /v1/settings/team/:userId`, `DELETE /v1/settings/team/:userId`, `DELETE /v1/settings/team/invitations/:invitationId` — **NEW**
- `GET /v1/settings/notifications`, `PATCH /v1/settings/notifications` — **NEW**
- `GET /v1/settings/squad`, `POST /v1/settings/squad/disconnect` — **NEW**
- `GET /v1/settings/billing`, `PATCH /v1/settings/billing` — **NEW**

**Notifications (`Notifications` Swagger tag — works for both employer + bank)**
- `GET /v1/notifications` — **NEW** — offset-paginated `?page=&pageSize=`
- `GET /v1/notifications/unread-count` — **NEW** — cheap badge endpoint
- `POST /v1/notifications/mark-all-read` — **NEW**
- `POST /v1/notifications/:id/read` — **NEW**

### Out of scope (do not call; do not fish in Swagger for these)

Jobs, Workers, Active assignments, Browse Talent, Worker profile, Active jobs Kanban, Post Job, Job detail, Applications, Photo proof, Transactions, Invoices, Payouts, Analytics, Credit, Loans, Bank Risk Radar, Bank Loans, Bank notifications, SSE stream. The endpoints don't exist on the backend yet (Phases 2–4). Keep `@forge/mock-data` on those pages, OR show a polished empty state that doesn't promise data.

---

## Pre-flight (do this once)

Follow `FRONTEND_INTEGRATION.md` §2 verbatim. Specifically:

1. **Generate types from the live OpenAPI spec.**
   ```
   pnpm add -D openapi-typescript
   pnpm openapi-typescript http://localhost:3000/v1/openapi.json -o packages/types/src/api.gen.ts
   ```
   Add a `types:gen` script. Re-run any time the BE adds endpoints.

2. **API client** at `apps/employer-web/lib/api.ts` (and copy to `apps/bank-web/lib/api.ts`). Required behavior — non-negotiable:
   - `credentials: 'include'` on every request.
   - Access token kept in **memory only** (Zustand or a module-level variable), never `localStorage` or non-`HttpOnly` cookies.
   - On 401: call `POST /v1/dashboard/auth/refresh` once, retry the original request once, then redirect to `/login` if refresh also 401s. **Coalesce concurrent refreshes into one in-flight promise** — do not call refresh twice. Refresh tokens are single-use family-revoking; double-call signs the user out everywhere.
   - Parse the error envelope `{ error: { code, message, details? } }` into an `ApiError` carrying `status`, `code`, `message`, `details`. UI shows `message`; logic branches on `code`.

3. **Auth provider boot.** On app load, call `POST /v1/dashboard/auth/refresh` (cookie auto-sent). 200 → store token + render. 401 with `code === 'NO_REFRESH_COOKIE'` or any 401 → redirect `/login`. Network error → retry toast, do not redirect.

4. **React Query** with `staleTime: 30_000`, `refetchOnWindowFocus: true`. Query keys: `['<resource>', '<view>', params]`. Invalidate on mutation success.

---

## Employer-web — task list (in order)

Demo logins (password `forge-demo-pass`):
- `owner+emp_0001@example.ng` — `business_owner` (full access)
- `manager+emp_0001@example.ng` — `business_hiring_manager` (no settings/billing PATCH)

### E1. Auth pages (foundation)

Build/wire these routes — every other page depends on `/me` working:

| Route | Endpoint | Notes |
|---|---|---|
| `/login` | `POST /v1/dashboard/auth/email/login` | Body: `{ email, password }`. On 401 `INVALID_CREDENTIALS`, show inline error. On success, refresh cookie is set automatically; store access token in memory. |
| `/signup/business` | `POST /v1/dashboard/auth/business/register` | Multi-step or single-form. Body shape: `{ email, password, fullName, phone?, businessName, businessType, businessPhone?, registeredLocation: { lat, lng, neighborhood, address } }`. `businessType` enum: `wholesaler \| factory \| retailer \| logistics`. On 409 `EMAIL_ALREADY_REGISTERED`, point user to `/login`. Verification email sends async; render "check your inbox" success page. |
| `/auth/verify?token=…` | `POST /v1/dashboard/auth/email/verify` | Reads `token` query param, POSTs it. On 204, redirect `/login` with success toast. On 400 `TOKEN_INVALID`, show "this link is invalid or expired" with a "request a new one" CTA. |
| `/auth/forgot-password` | `POST /v1/dashboard/auth/email/forgot` | Always shows "if that email exists, we sent a link" — never branch on response (always 204 by design). |
| `/auth/reset?token=…` | `POST /v1/dashboard/auth/email/reset` | Form: new password + confirm. POST `{ token, newPassword }`. On success, redirect `/login`. |
| `/auth/team/accept?token=…` | `POST /v1/dashboard/auth/team/accept` | Form: fullName + password. POST `{ token, fullName, password }`. On success, refresh cookie set + access token returned — drop straight into the dashboard at `/`. On 400 `INVITATION_INVALID`, show "this invitation has expired or already been used." |
| `/logout` action | `POST /v1/dashboard/auth/logout` | Wipe in-memory token, redirect `/login`. |

**DO NOT build a `/signup` page that lets a user pick a `bank_*` or `business_owner` role**. The only paths to a dashboard user are: business signup (employer owner), team invitation (everyone else), or platform-admin-created bank users (no FE flow at all).

### E2. App shell + nav

- Top bar: business name, ⌘K search trigger, bell badge, user menu, logout.
- Side nav: Overview, Jobs, Workers, Payments, Analytics, Credit, Settings.
- Role gating per the matrix in `BACKEND_BRIEF.md` §5. `business_hiring_manager` does not see Settings → Billing/Squad/Business; show but disable PATCH actions in Settings → Team.
- Shell hydrates from `GET /v1/dashboard/auth/me`.

### E3. Overview home (`/`) — Phase 1 anchor

Anchor screen — the entire home page renders from one round-trip.

```
GET /v1/employer/overview
```

Response (use the generated types as the source of truth):

```ts
{
  metrics: {
    activeJobs: { value, deltaPct, trend[] },        // 9-bucket sparkline, oldest first
    workersWorking: { value, deltaPct, trend[] },
    todaySpendNaira: { value, deltaPct, trend[] },
    pendingPayments: { value, deltaPct, trend[] },
  },
  liveJobs: [{ id, lat, lng, status }],              // up to 50 — pin colour per status
  attention: [{ kind, count, href }],                // applications_waiting | starting_soon | worker_late
  cashPosition: {
    walletBalanceNaira,
    projectedWeeklySpendNaira,
    spendTrend7d: [{ day, amountNaira }],            // 7 days, oldest first
  },
  creditHealth: {
    score, deltaPoints,
    topFactors: [{ label, deltaPoints }],
    eligibility: { maxAmountNaira, aprPct },
  },
  startingSoon: [{ id, title, neighborhood, scheduledStartAt, payNaira }],
}
```

UI requirements:
- 4 metric tiles render `value` (formatted as money for `todaySpendNaira`), `deltaPct` with up/down chevron, sparkline from `trend[]`.
- Live operations map: render up to 50 pins from `liveJobs[]`, colour by `status`. If you don't have a real Mapbox/Maps integration yet, the existing `MapPlaceholder` SVG is fine.
- Attention strip: only render items present in the array (the BE only emits items with `count > 0`).
- Cash-position card: balance, weekly projection, 7-bar spend chart.
- Credit-health card: score, delta, three factor rows, eligibility line.
- Starting-soon strip: 4 cards, link to `/jobs/[id]` (which still uses mocks — that's fine).

Edge cases: 403 `NO_EMPLOYER_SCOPE` → user has no employer (orphan from old `/email/register`); send to `/onboarding/business` (or `/signup/business`). 404 → render "we couldn't find your business" with a support CTA.

### E4. Notifications popover + page

Both employer-web and bank-web use the same endpoints — build it once and copy.

| Surface | Endpoint | Notes |
|---|---|---|
| Bell badge | `GET /v1/notifications/unread-count` | Poll on focus; refetch every 60s while tab is visible. |
| Bell popover (last 10) | `GET /v1/notifications?page=1&pageSize=10` | Sorted newest first. Each row: `kind`, `title`, `detail`, optional `href`, `occurredAt`, `readAt`. |
| `/notifications` page | `GET /v1/notifications?page=…&pageSize=25` | Offset pagination — read `pagination: { page, pageSize, total, totalPages }` from response envelope. |
| Tap a row | `POST /v1/notifications/:id/read` | Optimistically mark `readAt`; on 404, ignore. |
| "Mark all read" | `POST /v1/notifications/mark-all-read` | Optimistic; invalidate queries on success. |

Don't wire SSE yet — Phase 4. Until then, refetch on focus is enough.

### E5. ⌘K search

```
GET /v1/search?q=<term>
```

Returns `{ jobs[], workers[], transactions[] }`, max 5 per category. Hits include `id`, a label, and an `href`. UI pattern:

- ⌘K (Cmd+K / Ctrl+K) opens the palette.
- Debounced query (250 ms) calls the endpoint.
- Group results by category with section headers; click → push `href`.
- Empty `q` → show empty state ("Start typing…").
- Empty results → "No matches for '<q>'."

Workers hits href to `/workers/[id]` (mock page); jobs to `/jobs/[id]` (mock page); transactions to `/payments/transactions/[id]` (mock page). The deep links are aspirational — that's fine, it just means the user lands on a still-mocked page.

### E6. Settings — Business profile

| Section | Route | Endpoint |
|---|---|---|
| `/settings/business` (read) | | `GET /v1/settings/business` |
| Save | | `PATCH /v1/settings/business` (owner + admin only — server-enforced) |

`PATCH` body is partial — only send changed fields. `registeredLocation` updates all four lat/lng/neighborhood/address atomically; pin-on-map UI should produce the full object.

### E7. Settings — Team

| Surface | Endpoint |
|---|---|
| Members + pending invites table | `GET /v1/settings/team` (owner/admin/manager all see) |
| "Invite teammate" form | `POST /v1/settings/team/invite` (owner + admin only). Body: `{ email, role }` where `role ∈ { business_admin, business_hiring_manager }`. On 409 `ALREADY_TEAM_MEMBER`, surface inline. |
| Change role | `PATCH /v1/settings/team/:userId` (owner + admin only) |
| Remove teammate | `DELETE /v1/settings/team/:userId` (owner + admin only) |
| Revoke pending invite | `DELETE /v1/settings/team/invitations/:invitationId` |

Disable owner-row actions client-side (BE returns 409 `CANNOT_CHANGE_OWNER_ROLE` / `CANNOT_REMOVE_OWNER` regardless). Hide delete-self in the UI (BE returns 409 `CANNOT_REMOVE_SELF`).

The invitation email sent by `/invite` lands in the recipient's inbox with a link to `/auth/team/accept?token=…` — that page is in **E1**.

### E8. Settings — Notifications, Squad, Billing

| Section | Endpoints |
|---|---|
| Notifications | `GET /v1/settings/notifications`, `PATCH /v1/settings/notifications` — three booleans: `newApplication`, `clockEvents`, `paymentEvents`. |
| Squad wallet | `GET /v1/settings/squad` (`{ connected, walletId, walletBalanceNaira, payoutsPaused }`), `POST /v1/settings/squad/disconnect` (idempotent; no body). |
| Billing | `GET /v1/settings/billing`, `PATCH /v1/settings/billing` — `{ plan, invoicingEmail }`. |

`PATCH` and `POST disconnect` are owner + admin only.

### E9. Pages still on mocks

For `/jobs/*`, `/workers/*`, `/payments/*`, `/analytics/*`, `/credit/*`: keep existing mock-data wiring untouched. Do NOT call any endpoints under `/v1/jobs`, `/v1/workers`, `/v1/transactions`, `/v1/invoices`, `/v1/payouts`, `/v1/analytics`, `/v1/credit`, `/v1/loans`, `/v1/loan-applications`, `/v1/bank/*`, `/v1/stream`. Those will land in Phases 2–4 and you'll integrate them then.

---

## Bank-web — task list

The bank backend (Risk Radar, Loans portfolio) is Phase 4. Today only auth + notifications work. Demo logins:
- `credit+bnk_gtbank@example.ng` — `bank_credit_officer`
- `risk+bnk_gtbank@example.ng` — `bank_risk_analyst`

### B1. Auth pages

Mirror **E1** but:
- **No `/signup/business` page.** Banks are `platform_admin`-created out-of-band; bank users join via team invitation only.
- **No bank self-signup.** If you have a generic `/signup` form, hide it on the bank subdomain or show "Bank access is invitation-only — contact your administrator."
- `/auth/verify`, `/auth/reset`, `/auth/forgot-password`, `/auth/team/accept` work identically — they detect role server-side and the BE picks the right base URL for outbound mail.
- `/login` works against the seeded bank users.

### B2. App shell + nav

- Hydrate from `GET /v1/dashboard/auth/me`. Role-gate the nav to bank routes only.
- `bank_risk_analyst` is read-only — disable any write actions in the UI for that role.

### B3. Notifications popover + page

Same wiring as **E4**. The Notifications endpoints are user-scoped (`recipientUserId === me.userId`), so they Just Work for bank users — no special handling.

### B4. ⌘K search

Currently `GET /v1/search?q=` returns empty arrays for bank users (no employer scope). Hide the ⌘K trigger on bank-web for now, OR keep it and let it always show "no results." Either is fine.

### B5. Risk Radar, Loans, Borrowers, Sandbox

Out of scope. Keep mocks. If you want, add a small banner on bank-web home pages saying "Live data lands in v0.4."

---

## Conventions you must respect (don't re-explain in code review)

1. **Wire format is `camelCase`, integer Naira at the boundary** (not kobo). Format with `Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })` at render time only.
2. **Time is ISO 8601 with `+01:00` offset.** Parse with `date-fns/parseISO`. Don't `new Date().toISOString()` — that's UTC.
3. **Pagination is offset** — `?page=&pageSize=`, response envelope `{ data, pagination: { page, pageSize, total, totalPages } }`.
4. **Don't pass `employerId` or `bankId` from the client.** Tenant scope is derived from JWT.
5. **404 means "not visible to you" or "doesn't exist"** — same UI copy.
6. **TypeScript strict, no `any`.** Endpoint payload types come from `api.gen.ts`. Hand-rolled `interface { … }` for endpoint shapes is a code-review reject.
7. **Refresh discipline** — single in-flight promise, never speculative, only on 401. The BE will sign the user out on reuse.
8. **Loading / empty / error** — every page-level data fetch needs all three states polished before it ships.

---

## Definition of done — per page

A page is integrated when:

- [ ] Mocks deleted; only the real API client is imported.
- [ ] Types come from `api.gen.ts` (or `@forge/types` Zod) — no inline endpoint types.
- [ ] Loading skeleton, empty state, error state all render and are visually polished.
- [ ] Role gating respects the matrix (`business_owner` / `business_admin` / `business_hiring_manager`).
- [ ] Mutations show optimistic state when sensible, invalidate cache on success, surface error toasts using `error.message` from the envelope.
- [ ] Tested against at least two demo logins to confirm role gating.
- [ ] No console errors or unhandled promise rejections in the browser.

---

## How to verify

1. Run `pnpm dev` in `forge_fe`. Run the BE locally (`cd forge_be/app && pnpm start:dev`) so you can hit `http://localhost:3000/docs` to confirm endpoint shapes.
2. Log in as `owner+emp_0001@example.ng` / `forge-demo-pass` on employer-web — the home page should render real metrics from the seeded DB (50 workers, 220 jobs, 30 loan applications, etc.).
3. Hit the bell — it should fetch real notifications scoped to that user.
4. ⌘K and search "apapa" — should return real jobs/workers/transactions.
5. Settings → Team → invite a fake address — check the BE log shows `[email-stub]` (or actual Resend send if `EMAIL_API_KEY` is set).
6. Sign out, hit `/auth/team/accept?token=<the-token>` — should land you in the dashboard as the new user.
7. Repeat for `manager+emp_0001@example.ng` to confirm role gating (no Settings → Business/Squad/Billing PATCH).
8. Repeat the auth + notifications flows for `credit+bnk_gtbank@example.ng` on bank-web.

---

## Anti-patterns — don't

- Don't persist the access token in `localStorage` or a non-`HttpOnly` cookie.
- Don't call `/refresh` on a timer or speculatively.
- Don't pass `employerId`/`bankId` from the client.
- Don't hand-roll endpoint types when the OpenAPI spec covers them.
- Don't convert Naira ↔ kobo anywhere; the boundary is integer Naira.
- Don't bypass the error envelope by reading `response.statusText`; use `error.code`.
- Don't wire any endpoint not listed in **Scope** — those backends don't exist yet, you'll get 404s.
- Don't expose a `bank_*` or `business_owner` role picker in any signup form.

---

## When you're stuck

1. Check `<API>/docs` (Swagger UI) — every endpoint has Audience + Powers + Notes describing the screen it serves.
2. Check `forge_be/FRONTEND_INTEGRATION.md` §5 — feature → endpoint map with status (LIVE / planned).
3. Check the corresponding screen + `@forge/mock-data` shape — match byte-for-byte.
4. If still unclear, write a question with proposed answers (A/B/C). Don't ask open-ended.

Welcome to Forge frontend integration. Ship one page end-to-end before starting the next.
