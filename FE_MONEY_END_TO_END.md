# Frontend agent — Money loop end-to-end

This brief is the single source of truth for the **fully real money loop** now live on the backend. Every stub flagged in `FE_PHASE4_CLOSEOUT.md` §6 is closed; every path described below either hits Squad sandbox for real or does an internal book entry that's auditable end-to-end.

Backend: `https://forgebe-production.up.railway.app` (`NEXT_PUBLIC_API_BASE_URL`). Local: `http://localhost:3000`. Every path prefixed `/v1`. If a route 404s, the Railway deploy hasn't picked up master yet — wait 1–2 min and refetch `/v1/openapi.json`.

**Re-read before wiring:**
1. `forge_be/FRONTEND_INTEGRATION.md` — runbook (auth, error envelope, snake_case vs camelCase per audience).
2. `forge_be/FE_PHASE4_CLOSEOUT.md` — SSE event vocabulary, cron behavior.
3. `forge_be/FE_VIRTUAL_ACCOUNTS_PROMPT.md` — virtual NUBAN + wallet escrow detail. (This doc is a superset.)
4. Live OpenAPI at `<API>/v1/openapi.json` — wins any disagreement with this doc.

---

## TL;DR — what's now real

| Flow | Status |
|---|---|
| Employer signup → Squad virtual NUBAN issued | ✅ real |
| Worker signup (profile-setup) → Squad virtual NUBAN issued | ✅ real |
| Employer tops up wallet by sending money to NUBAN | ✅ real (webhook → ledger + SSE) |
| Employer publishes a job → wallet hard-escrowed | ✅ real |
| Employer cancels a job → reserve refunded | ✅ real |
| Job completes → reserve drained into worker's in-app wallet | ✅ real (no Squad call — internal) |
| Worker withdraws → Squad transfer to their own NUBAN | ✅ real |
| Worker adds external bank account → NIBSS name resolved via Squad | ✅ real |
| Bank disburses loan to worker borrower → Squad transfer to their bank | ✅ real |
| Bank disburses loan to business borrower → credits employer's in-app wallet | ✅ real (internal) |
| Webhook signature verification + reconciliation cron + SSE invalidation | ✅ already shipped (Phase 4) |

The four demo accounts (`owner+emp_0001`, `manager+emp_0001`, `credit+bnk_gtbank`, `risk+bnk_gtbank`) all ship with seeded NUBANs after the seed re-runs — no first-request lazy-provisioning hiccup.

---

## 1. New response fields you'll consume

### Employer dashboard

**`GET /v1/employer/overview`** → `cashPosition.virtualAccount`

```ts
type CashPositionDto = {
  walletBalanceNaira: number;
  projectedWeeklySpendNaira: number;
  spendTrend7d: SpendDayDto[];
  // NEW
  virtualAccount: {
    number: string;       // 10-digit NUBAN
    bankCode: string;     // NIBSS bank code (e.g. "058")
    accountName: string;  // What external depositors see at their bank
  } | null;               // null only during provisioning
};
```

**`GET /v1/settings/squad`** → same `virtualAccount` field shape, on the settings page card.

### Worker mobile

**`GET /v1/me`** → `worker.virtual_account` (snake_case to match mobile wire format)

```ts
type WorkerDto = {
  // … existing fields …
  virtual_account: {
    number: string;
    bank_code: string;
    account_name: string;
  } | null;
};
```

---

## 2. Employer flow — fund → publish → cancel/complete

### Funding the wallet

Render the NUBAN copy-card on the overview + settings. Suggested copy:

> Transfer NGN to **{accountName}** at **{bankCode}** account **{number}**. Funds arrive in your wallet in 1–3 minutes.

When the funds arrive, the BE fires SSE `transaction.updated` with `data.source === 'va_funding'`. Your existing `transaction.updated` handler from Phase 4 invalidates `['employer','overview']`, `['employer','transactions']`, and `['employer','payouts','upcoming']` — no new wiring needed.

### Publishing a job

`POST /v1/employer/jobs` (with `postNow=true`) and `POST /v1/employer/jobs/:id/publish` now both run a balance check + atomic debit. If the wallet is short:

```json
{
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "Your wallet balance is ₦12,500 — top up at least ₦7,500 more before publishing this job.",
    "details": {
      "walletBalanceNaira": 12500,
      "requiredNaira": 20000,
      "shortfallNaira": 7500
    }
  }
}
```

**FE action:** branch on `error.code === 'INSUFFICIENT_FUNDS'` → render the BE message + a primary "Top up wallet" CTA that deep-links to the overview NUBAN. Use `details.shortfallNaira` to pre-suggest a top-up amount.

### Editing a job after publish

`PATCH /v1/employer/jobs/:id` now returns `409 JOB_LOCKED` if you try to change `payNaira` on a job that already has a reservation. The shortcut is "cancel + recreate".

### Cancelling

`POST /v1/employer/jobs/:id/cancel` — refunds the reserve automatically. Your existing toast + refetch logic is unchanged.

### Completing

No FE work. The clock-out flow drains `Job.reservedAmountNaira` into `Worker.walletBalance` atomically. The `Transaction(kind='job_payment')` row writes a synthetic `squadReference` prefixed `internal_…` — this is a flag, not a real Squad ref. Don't render it as a Squad confirmation; treat it like an internal book entry.

---

## 3. Worker mobile flow — earn → see balance → withdraw

### Wallet screen

`GET /v1/me` returns `worker.wallet_balance` (existing) and `worker.virtual_account` (new). Render the NUBAN beneath the balance card. Suggested copy:

> Tell employers to send to **{account_name}** at account **{number}**.

### Adding an external bank

`POST /v1/wallet/banks/resolve` now hits Squad for real (or stub mode in dev). The flow is:

1. Worker enters bank + 10-digit account number.
2. FE calls `POST /v1/wallet/banks/resolve { bank_code, account_number }`.
3. BE returns `{ account_name: "TUNDE ADEYEMI" }` from Squad's NIBSS lookup. **Or a new error:**

   | Code | Status | When | UI |
   |---|---|---|---|
   | `ACCOUNT_RESOLVE_FAILED` | 422 | Squad's lookup didn't find an account at that NUBAN | "We couldn't find that account. Check the number and try again." Re-prompt for entry. |
   | `VALIDATION_FAILED` | 400 | Unknown bank code | Standard validation toast. |

4. FE shows the resolved name + a confirm checkbox.
5. FE calls `POST /v1/wallet/banks` with the same payload; BE re-resolves + name-matches the worker's profile, persists.

### Withdrawing

`POST /v1/wallet/withdrawals { amount }` — `bank_account_id` is now **optional**. When omitted, the withdrawal targets the worker's own Squad virtual NUBAN. The worker doesn't need to link any external bank account before pulling money out.

```ts
// Default UX — no destination picker needed
POST /v1/wallet/withdrawals { amount: 3000 }
// → transfer to worker.virtual_account.number via Squad

// Existing UX — pick a linked external bank
POST /v1/wallet/withdrawals { amount: 3000, bank_account_id: 'bnk_xxx' }
```

Response shape unchanged. `Transaction.status` is `processing` until the Squad webhook flips it to `completed` (usually within 5 s; reconciliation cron is a 5-min backstop).

New errors:

| Code | Status | Meaning | UI |
|---|---|---|---|
| `PROVISIONING_VIRTUAL_ACCOUNT` | 503 | Worker's Squad NUBAN is still being set up | Retry after 5 s; the lazy provisioner runs on `/me` reads. |
| `PROVIDER_UNAVAILABLE` | 502 | Squad rejected the transfer synchronously | Wallet has already been refunded by the BE — show "Withdrawal couldn't go through, please try again" toast. |
| `INSUFFICIENT_BALANCE` | 422 | Wallet balance changed between sheet-open and submit | Refetch wallet + re-prompt. |

---

## 4. Bank dashboard — disbursement to either borrower type

`POST /v1/bank/loans/:id/disburse` now does the right thing for either borrower:

- **Worker borrower** — Fires `squad.transfer` to the worker's default linked external bank account. Webhook handles `processing → completed`. (Unchanged from Phase 4.)
- **Business borrower** — Credits the employer's in-app wallet (`Employer.walletBalanceNaira += principal`) + writes `Transaction(kind='loan_disbursement', employerId, status='completed')` synchronously. The bank dashboard sees the loan flip to `active` instantly; the employer dashboard sees the credit via SSE.

### SSE on business disbursement

- Bank scope: `loan.disbursed` (existing).
- Employer scope: `transaction.updated` with `data.source === 'loan_disbursement'`. Your existing handler will invalidate overview + transactions + payouts.

No FE changes required for either side — the existing CTAs and tables just stop being "promised, not delivered" for business borrowers.

---

## 5. SSE event vocabulary (unchanged — Phase 4 set)

The new flows fire events you already handle:

| Trigger | SSE event | `data.source` (when applicable) |
|---|---|---|
| External bank transfer lands in employer NUBAN | `transaction.updated` | `va_funding` |
| Worker withdrawal completes via Squad webhook | `transaction.updated` | `webhook` |
| Reconciliation cron resolves a stuck withdrawal | `transaction.updated` | `cron` |
| Bank disburses loan to business borrower | `transaction.updated` | `loan_disbursement` |
| Bank disburses any loan | `loan.disbursed` | — |

If you want a small toast for incoming funds, branch on `data.source === 'va_funding'` and show *"₦{amount} received in your wallet"*. Optional.

---

## 6. Transaction shape changes

`Transaction.workerId` is now **nullable** in the DTO. Top-up rows from the virtual-account funding webhook have `workerId: null` (the credit has no worker counterparty). Same for business-loan disbursement rows.

```ts
type TransactionDto = {
  id: string;
  squadReference: string | null;
  employerId: string;
  workerId: string | null;        // NULLABLE — was string
  workerName: string | null;
  jobId: string | null;
  jobTitle: string | null;
  amountNaira: number;
  status: TransactionStatus;
  timestamp: string;
  settledAt: string | null;
  failureReason: string | null;
};
```

**FE action:** if your transactions table renders a worker avatar/name column, handle `workerId === null` gracefully:

| `workerId` | `kind` | Render |
|---|---|---|
| string | `job_payment` | Worker name + avatar (existing) |
| null | `top_up` | "External top-up" + bank icon |
| null | `loan_disbursement` | "Loan disbursement" + bank logo (the bank's `Bank.name` if you can resolve it) |
| null | `wallet_credit` | "Wallet credit" + generic icon |

### Internal vs Squad transactions

The `squadReference` column has two kinds of values now:
- `txn_…` / `disb_…` / `top_…` / `wdr_…` / `va_…` → **real** Squad references. Lookable up in Squad's dashboard.
- `internal_…` → **synthetic** flag for entries that didn't hit Squad (job completion, business loan disbursement, loan auto-repayment). Don't expose this to the user as a "Squad reference".

A simple gate on the FE:

```ts
function isRealSquadReference(ref: string | null): boolean {
  return !!ref && !ref.startsWith('internal_');
}
```

---

## 7. Demo accounts — seed re-run required

The four demo logins from `FRONTEND_INTEGRATION.md:27-33` (`owner+emp_0001`, `manager+emp_0001`, `credit+bnk_gtbank`, `risk+bnk_gtbank`) now get NUBANs from the seed itself — no first-request hiccup. The 50 seeded workers + 20 seeded employers all carry virtual accounts after `pnpm exec prisma db seed`.

Stub-mode NUBANs are deterministic (SHA-1 of the employer/worker id), so testing across reseeds is stable.

---

## 8. Definition of done — per surface

### Employer dashboard
- [ ] Overview shows NUBAN copy-card from `cashPosition.virtualAccount`.
- [ ] Settings → Squad mirrors the NUBAN.
- [ ] Job create + publish branch on `INSUFFICIENT_FUNDS` with contextual CTA.
- [ ] Job cancel/complete render correctly (no FE change needed).
- [ ] Transactions table handles `workerId: null` rows for top-ups + loan disbursements.
- [ ] SSE `transaction.updated` invalidates overview + transactions + payouts.

### Worker mobile
- [ ] `/me` screen renders the worker's NUBAN beside their wallet balance.
- [ ] Withdrawal sheet defaults to the worker's NUBAN — no destination picker needed.
- [ ] Bank-add flow consumes `account_name` from `/wallet/banks/resolve` (real Squad response).
- [ ] `PROVISIONING_VIRTUAL_ACCOUNT` + `PROVIDER_UNAVAILABLE` errors handled with the right copy.

### Bank dashboard
- [ ] Loan disburse CTA works for both worker and business borrowers without UX changes.
- [ ] SSE `loan.disbursed` invalidates risk-radar + loans (already wired).

---

## 9. Sandbox smoke test (10 minutes end-to-end)

Run against `SQUAD_ENVIRONMENT=sandbox`:

1. **Register a fresh employer.** Overview's `cashPosition.virtualAccount` populates within 1–2 refetches.
2. **Simulate external top-up.** From the Squad sandbox dashboard, transfer ₦10,000 to that NUBAN. Within seconds: walletBalanceNaira increments, a `top_up` Transaction lands with `workerId: null`, SSE `transaction.updated` fires.
3. **Insufficient funds rejection.** Try to publish a job worth ₦15,000. Expect `409 INSUFFICIENT_FUNDS`.
4. **Top up + publish.** Top up another ₦10,000 → wallet = 20,000. Publish a ₦15,000 job → wallet = 5,000, job `reservedAmountNaira = 15,000`.
5. **Cancel refund.** Cancel the job → wallet = 20,000, reservedAmountNaira = 0.
6. **Completion path.** Publish a ₦5,000 job, accept a worker application, worker clocks in/out with photo proof. Worker's wallet_balance increments, employer's wallet stays decremented (already debited at publish).
7. **Worker withdrawal — virtual NUBAN default.** Worker hits `POST /v1/wallet/withdrawals { amount: 3000 }` (no bank_account_id). Response: `processing` status. Within 5s, SSE `transaction.updated` arrives → status `completed`.
8. **Worker bank-add.** Worker enters bank + 10-digit account, calls `/wallet/banks/resolve` — sees real Squad-resolved name. Confirms and links.
9. **Worker withdrawal — external bank.** Worker withdraws to the newly linked account. Same `processing → completed` arc as #7.
10. **Bank loan disbursement.** As `credit+bnk_gtbank`, approve a pending application against a business borrower, then disburse. Employer's overview shows the credit instantly via SSE.

---

## 10. Two BE-side unknowns still flagged

Squad's public docs were gated during this work, so two helpers use best-effort field name mappings. These need a one-line verification against the live sandbox once you have it open:

1. **`SquadClient.createVirtualAccount` response fields** — accepts `virtual_account_number` / `account_number`, `bank_code`, `account_name` synonyms in [squad.client.ts](app/src/modules/squad/squad.client.ts). Adjust the `pickString(data, [...])` lists if Squad uses different keys.
2. **`SquadClient.resolveAccount` response field** — accepts `account_name` / `customer_name` / `name`. Single-line change in the same file.
3. **Funding-webhook event name** — `classifySquadOutcome` in [squad-status.ts](app/src/modules/squad/squad-status.ts) matches 4 variants. Only one will fire in production; the others can be dropped after confirmation.

These are isolated to the helpers above — drop me a note with the actual field names once you've seen Squad's first real sandbox response and I'll tighten them.

---

## 11. Anti-patterns — don't

- **Don't expose `squadReference` starting with `internal_` as a "Squad reference"** to the user — those are internal book-entry flags, not lookable in Squad's dashboard.
- **Don't recompute wallet balance on the FE** from transaction history. The BE-served `walletBalanceNaira` is the source of truth; transactions are descriptive ledger entries.
- **Don't block job publish on FE-side balance checks.** Let the BE return `INSUFFICIENT_FUNDS` — it's the only thing that knows the wallet under concurrent operations.
- **Don't require `bank_account_id` on the withdrawal form** — when omitted the BE routes to the worker's own NUBAN. Removing it from the required path is the simpler UX.
- **Don't worry about the `cron`-source `transaction.updated` SSE event being a duplicate** — the webhook handler returns 200 on already-final states, and the cron only fires for transactions still `processing` after 5 min. Idempotent on the BE; idempotent React Query invalidation on the FE.

Ship.
