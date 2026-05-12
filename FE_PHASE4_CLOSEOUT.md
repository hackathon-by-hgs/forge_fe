# Frontend agent — Phase 4 closeout (SSE + crons)

The four items the punch-list reply listed as **deferred** are now shipped. This brief tells you what changed on the BE and what (minimal) wiring you should do on the FE to take advantage of it.

Backend: `https://forgebe-production.up.railway.app` (`NEXT_PUBLIC_API_BASE_URL`). Local: `http://localhost:3000`. Every path prefixed `/v1`. If a route 404s on production, the Railway deploy hasn't picked up the latest master SHA yet — wait 1–2 minutes and refetch `/v1/openapi.json`.

**Re-read before wiring:**
1. `forge_be/FE_PHASE4_PROMPT.md` — original Phase 4 brief.
2. `forge_be/FE_PUNCH_LIST_REPLY.md` — what shipped before this pass.
3. Live OpenAPI at `<API>/v1/openapi.json`.

---

## TL;DR — what shipped this pass

Four additions, all officially "Phase 4 — deferred" in the previous reply:

| # | Surface | Status |
|---|---|---|
| 1 | **Risk-flagging cron** | Bank-side loans now auto-transition `active → at_risk → defaulted` based on overdue repayments. No FE action required for the data — but the Risk Radar critical / watchlist groupings finally reflect real state instead of seed data. |
| 2 | **Score-recalc cron** | Nightly `02:15 Africa/Lagos`. `EmployerCreditHistory` table now backs `trend12Week` + `scoreDeltaPoints`. Existing FE wiring keeps working — the values stop being synthetic once the cron runs once. |
| 3 | **Squad reconciliation cron** | Every 5 min. Backstop for the Squad webhook — pending/processing transactions older than 5 min are polled and resolved. No FE action; the existing transactions polling sees the corrected state. |
| 4 | **SSE `/v1/stream`** | New real-time endpoint. **This is the one that needs FE work** — replaces tab-focus polling on Risk Radar + employer active-map + credit/payments surfaces. |

If you don't touch anything, nothing breaks — every existing endpoint still returns the same shape and your tab-focus polling keeps working. SSE is purely additive.

---

## 1. Risk-flagging cron — no FE work, just heads-up

Schedule: `EVERY_HOUR`. For every `active` / `at_risk` loan bound to a bank:

1. Finds the earliest unpaid `LoanRepayment` (`status in ['scheduled','missed']`).
2. Computes `daysOverdue` from `scheduledFor`.
3. Re-derives `status` + `riskLevel` from the thresholds:

   | daysOverdue | status | riskLevel |
   |---|---|---|
   | ≤ 0 | `active` | `green` |
   | 1–7 | `at_risk` | `yellow` (watchlist) |
   | 8–29 | `at_risk` | `red` (critical) |
   | ≥ 30 | `defaulted` | `red` |

4. Updates `Loan.status`, `Loan.riskLevel`, `Loan.nextPaymentDueAt` to the earliest unpaid scheduled-for date (the Risk Radar's `ORDER BY` column — so critical alerts now sort by real next-due date).
5. Marks overdue scheduled rows as `status='missed'` so the loan-detail repayment table reflects reality.
6. Audit-logs `loan.risk_flag_changed` and fans out a `UserNotification` (kind: `loan_at_risk` or `loan_defaulted`) to every bank user bound to that bank.
7. Emits an SSE `loan.risk_changed` event (see §4).

**FE implications:**
- The Risk Radar critical / watchlist lists are now driven by real `status` + `riskLevel` columns. Any seeded loan that was hardcoded `at_risk / red` will get re-evaluated and may move back to `active / green` if its repayments are current.
- Bank notifications (`GET /v1/notifications`) will start including `kind: 'loan_at_risk'` and `kind: 'loan_defaulted'`. Same envelope as every other notification — no schema change.
- Loan-detail `repayment.status` of `missed` now appears in the wild (seeded data didn't include it).

---

## 2. Score-recalc cron — fewer caveats on credit page

Schedule: `15 2 * * *` Africa/Lagos (02:15 local).

Writes one `EmployerCreditHistory` row per employer per UTC day. Re-derives `Employer.creditScore` from the same 5 factors the live read uses (BRIEF §11.7 weights — identical math, shared helper).

**What changes in the BE response:**

`GET /v1/employer/credit` previously returned:
- `scoreDeltaPoints: 0` (hardcoded)
- `trend12Week`: synthetic ramp anchored at `score`
- `factors[].trend`: synthetic ramp

After the cron has run at least once for an employer, the same endpoint returns:
- `scoreDeltaPoints`: `currentScore - score7DaysAgo` (real delta, can be negative)
- `trend12Week`: real weekly scores from `EmployerCreditHistory` (latest row per ISO week, falls back to current score for weeks with no row)
- `factors[].trend`: real per-factor weekly values
- `GET /v1/employer/credit/score-history`: real monthly snapshots from history rows (falls back to synthetic if no rows exist yet)

**FE implications:**
- The "up/down arrow" affordance for `scoreDeltaPoints` was previously useless (always 0) — it's safe to render now. Negative deltas should render with a red down-arrow.
- Trends on the credit page are no longer flat — your existing chart code just gets real data.
- For employers seeded today, the first real values appear at 02:16 Africa/Lagos. Until then, synthetic. Both forms have the same shape, so no client-side branching.

**Synthetic fallback removed once history exists.** If you were rendering a "values are illustrative" disclaimer, you can drop it (or gate it on `trend12Week.every(p => p.score === score)` if you want to be precise).

---

## 3. Squad reconciliation cron — no FE work

Schedule: `EVERY_5_MINUTES`. Picks up `Transaction` rows where:
- `status in ('pending', 'processing')`
- `squadReference IS NOT NULL`
- `createdAt < now - 5min`

For each, calls `GET /transaction/verify/{reference}` on Squad and applies the same `classifySquadOutcome` mapping the webhook uses (shared module — they cannot disagree). Updates `Transaction.status` + `settledAt` + `failureReason`, audit-logs `squad.reconciled_*`, and emits an SSE `transaction.updated` event.

In stub mode (no Squad keys), `verifyTransaction` returns a deterministic `success` after 5 minutes — useful for local development. In real mode it hits the sandbox/production Squad API depending on `SQUAD_ENVIRONMENT`.

**FE implications:** None. Your existing transaction list, payouts page, and overview tiles see the corrected state on the next refetch. If the user is staring at a "processing" badge, it'll resolve within 5 min without them refreshing.

---

## 4. SSE `/v1/stream` — **this needs FE wiring**

```
GET /v1/stream                  bearer-user JWT (employer or bank)
```

One persistent EventSource connection per browser tab. Scoping is automatic — the BE derives `{ kind: 'employer'|'bank', id }` from the JWT, and you only receive events tagged with your tenant.

### Wire format

Each event arrives as:

```
event: <name>
id: <iso-timestamp>
data: {"event":"<name>","ts":"<iso>","data":{...}}
```

`event.event` and `event.id` are SSE standard fields. The `data` field is **stringified JSON**; parse it before reading `.event` / `.data`.

### Event catalog

Tenant-scoped — you only see events that match your `employerId` or `bankId`. The exception is `heartbeat` which is broadcast every 25 seconds (its only purpose is to keep idle connections open through proxies).

| Event | Tenant | Payload | FE action |
|---|---|---|---|
| `loan.disbursed` | bank | `{ loanId, principalNaira, borrowerType }` | Invalidate `['bank','risk-radar']`, `['bank','loans']`, `['bank','loans', loanId]` |
| `loan.repayment_paid` | bank | `{ loanId, repaymentId, amountNaira, outstandingNaira, allPaid }` | Invalidate `['bank','risk-radar']`, `['bank','loans', loanId]` |
| `loan.risk_changed` | bank | `{ loanId, status, riskLevel, daysOverdue }` | Invalidate `['bank','risk-radar']`, `['bank','loans']`. Optionally toast the user when it transitions to `defaulted`. |
| `application.decided` | bank | `{ applicationId, decision: 'approved' \| 'rejected', loanId?, principalNaira?, reason? }` | Invalidate `['bank','loan-applications']`, `['bank','loan-applications', applicationId]`, and `['bank','risk-radar']` (approve creates a loan). |
| `transaction.updated` | employer | `{ transactionId, status, amountNaira, source: 'webhook' \| 'cron' }` | Invalidate `['employer','transactions']`, `['employer','payouts','upcoming']`, `['employer','overview']`. |
| `score.recomputed` | employer | `{ score, previousScore, capturedAt }` | Invalidate `['employer','credit']`, `['employer','credit','score-history']`. |
| `job.lifecycle_changed` | employer | — *reserved; not emitted yet, Phase 5* | Future — active-map invalidation. |
| `worker.clock_event` | employer | — *reserved; not emitted yet, Phase 5* | Future — active-map invalidation. |
| `heartbeat` | broadcast | `{}` | Ignore — purely for proxy keepalive. Your `onmessage` handler can switch on `event.event !== 'heartbeat'`. |

`job.lifecycle_changed` and `worker.clock_event` are **reserved names** — the BE knows about them and will start emitting them when the lifecycle code is wired through. Until then, keep polling on focus for the active-map. Wire the SSE handler so adding them is a no-op on your side.

### Reference implementation

```ts
// hooks/useStream.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const ACCESS_TOKEN_HEADER = 'Authorization';

type StreamPayload = {
  event: string;
  ts: string;
  data: Record<string, unknown>;
};

export function useStream(accessToken: string | null) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!accessToken) return;
    // EventSource doesn't support custom headers in browsers. Two options:
    //  (a) put the token in a `?access_token=` query param and accept it BE-side, OR
    //  (b) use `event-source-polyfill` / a fetch-based SSE client that supports headers.
    // We use (b) — Phase 4 BE only honours the Authorization header.
    const es = new EventSourcePolyfill(`${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/stream`, {
      headers: { [ACCESS_TOKEN_HEADER]: `Bearer ${accessToken}` },
      heartbeatTimeout: 60_000, // give us 60s before the polyfill kills an idle conn
    });

    es.onmessage = (msg) => {
      const payload = JSON.parse(msg.data) as StreamPayload;
      if (payload.event === 'heartbeat') return;
      applyInvalidations(qc, payload);
    };

    es.onerror = () => {
      // Polyfill auto-reconnects with exponential backoff. Refetch the
      // page's primary queries on reconnect because we may have missed events.
      qc.invalidateQueries({ queryKey: ['bank'] });
      qc.invalidateQueries({ queryKey: ['employer'] });
    };

    return () => es.close();
  }, [accessToken, qc]);
}

function applyInvalidations(qc: QueryClient, p: StreamPayload) {
  switch (p.event) {
    case 'loan.disbursed':
    case 'loan.repayment_paid':
    case 'loan.risk_changed':
      qc.invalidateQueries({ queryKey: ['bank', 'risk-radar'] });
      qc.invalidateQueries({ queryKey: ['bank', 'loans'] });
      break;
    case 'application.decided':
      qc.invalidateQueries({ queryKey: ['bank', 'loan-applications'] });
      qc.invalidateQueries({ queryKey: ['bank', 'risk-radar'] });
      break;
    case 'transaction.updated':
      qc.invalidateQueries({ queryKey: ['employer', 'transactions'] });
      qc.invalidateQueries({ queryKey: ['employer', 'payouts', 'upcoming'] });
      qc.invalidateQueries({ queryKey: ['employer', 'overview'] });
      break;
    case 'score.recomputed':
      qc.invalidateQueries({ queryKey: ['employer', 'credit'] });
      break;
  }
}
```

Mount the hook once at the top of each dashboard layout (`apps/employer-web` and `apps/bank-web`) — one EventSource per tab, not per page.

### Failure semantics

- **No replay.** Events missed during a disconnect are NOT replayed. Treat SSE as a *hint* stream — on `onerror` / reconnect, refetch the affected queries.
- **Heartbeat every 25 s.** If you go > 60 s without any event (heartbeat or data), assume the connection is dead — the polyfill should auto-reconnect, but log it so we can find broken proxies.
- **No backpressure.** This is fan-out from an in-process Subject. If a subscriber is slow, RxJS will drop newer events for that subscriber. We never queue.
- **Single-instance only.** Railway runs one BE instance today. When we go multi-instance (Phase 5 polish), the publisher swaps to Redis pub/sub but the wire format and tag set don't change.

### What NOT to do

- **Don't render BE state from the SSE payload.** Payloads are *invalidation hints*, not source of truth. The payload tells you "loan X changed, refetch the loans query". Render from the refetched data.
- **Don't open multiple EventSource connections per tab.** One is enough. Mount the hook at the layout level.
- **Don't subscribe before the JWT is loaded.** The endpoint is bearer-guarded; subscribing without a valid token returns 401 and the polyfill will hammer the BE retrying.
- **Don't treat `heartbeat` as a signal.** It's purely transport-level. Filter it out in `onmessage`.

---

## 5. Definition of done

You are done with Phase 4 when:

- [ ] EventSource is mounted on both dashboard apps' layouts.
- [ ] At least one of: Risk Radar, employer overview, credit page, OR transactions table demonstrably refreshes without a tab-focus event after a mutation fires on a second tab.
- [ ] `heartbeat` events are ignored cleanly (no React Query thrash every 25 s).
- [ ] Reconnect on error invalidates the dashboard's primary queries.
- [ ] No console spam from the SSE handler in steady state.

That's it. The three cron-driven changes (risk-flagging, score-recalc, squad-reconciliation) need zero FE work — they just make existing surfaces less wrong.

---

## 6. What's deferred (still)

Phase 5 territory. Not blocking demo paths today:

- `job.lifecycle_changed` + `worker.clock_event` SSE events (active-map real-time). Names reserved in the BE, payloads not yet emitted.
- Multi-instance SSE fan-out (Redis pub/sub). One Railway instance suffices for now.
- Per-factor recommendation breakdown on bank loan applications.
- Bank audit-trail GET endpoint.
- CSV export for loans / applications.
- Real Squad sandbox wiring for disbursement transfers (`SquadClient.transfer` works for real; the disburse flow doesn't call it yet — that's Phase 5).
- NDPR data export.

Ship.
