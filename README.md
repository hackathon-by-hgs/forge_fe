# Forge — Informal Economy Platform

Monorepo for the Forge frontend stack: a public marketing site and two role-specific dashboards that share a UI library, a types package, and a mock-data harness. All three apps are independently deployable Next.js services backed by the same Forge backend.

| App                    | Audience                              | Local port | Production URL                       |
| ---------------------- | ------------------------------------- | ---------- | ------------------------------------ |
| `apps/landing`         | Public — marketing + portal entry     | 3002       | (your landing Railway service)       |
| `apps/employer-web`    | Wholesalers, factories, retailers     | 3070       | https://forgefe.up.railway.app       |
| `apps/bank-web`        | Credit officers, risk analysts        | 3001       | https://forgeem.up.railway.app       |

The landing page links to the two dashboards via env-driven URLs (`NEXT_PUBLIC_EMPLOYER_URL`, `NEXT_PUBLIC_BANK_URL`) — see [`apps/landing/.env.example`](apps/landing/.env.example).

---

## Prerequisites

- **Node ≥ 20.0.0** — every app targets Node 20 in CI and Railway runs Nixpacks' `nodejs_20`.
- **pnpm ≥ 9.0.0** — workspace + lockfile manager. The repo pins `packageManager: pnpm@9.0.0` in `package.json`.
- **Git** — to clone.
- **(Optional) Google Maps JS API key** — needed only if you want the employer dashboard's map widgets (`/jobs/new`, `/jobs/[id]`) to render real maps instead of the SVG placeholder.

Install pnpm if you don't have it:

```bash
npm install -g pnpm@9
# or, with corepack on Node 20+
corepack enable && corepack prepare pnpm@9 --activate
```

---

## From-scratch setup

```bash
# 1. Clone
git clone <repo-url> forge_fe
cd forge_fe

# 2. Install all workspace dependencies in one pass.
#    pnpm reads pnpm-workspace.yaml and hydrates every app + package.
pnpm install --frozen-lockfile

# 3. Per-app env files. Copy each .env.example to .env (or .env.local) and edit if needed.
cp apps/landing/.env.example       apps/landing/.env
cp apps/employer-web/.env.example  apps/employer-web/.env
cp apps/bank-web/.env.example      apps/bank-web/.env

# 4. Run everything in parallel via Turborepo.
pnpm dev
```

`pnpm dev` at the root runs `turbo run dev`, which spawns all three apps in parallel with prefixed log output:

- Landing → http://localhost:3002
- Employer dashboard → http://localhost:3070
- Bank dashboard → http://localhost:3001

Run just one when iterating on a specific surface:

```bash
pnpm --filter landing dev
pnpm --filter employer-web dev
pnpm --filter bank-web dev
```

---

## Environment variables

Each app loads its own `.env` (and `.env.local`) at dev/build time. Live env vars on Railway are set per-service in the Railway dashboard.

### `apps/landing` ([`.env.example`](apps/landing/.env.example))

| Variable                     | Purpose                                              |
| ---------------------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_EMPLOYER_URL`   | Origin for the employer dashboard portal CTA. Falls back to `https://forgefe.up.railway.app` if unset. |
| `NEXT_PUBLIC_BANK_URL`       | Origin for the bank dashboard portal CTA. Falls back to `https://forgeem.up.railway.app` if unset. |

### `apps/employer-web` ([`.env.example`](apps/employer-web/.env.example))

| Variable                            | Purpose                                              |
| ----------------------------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`          | Backend origin (`https://forgebe-production.up.railway.app` for live, `http://localhost:3000` if you're running the BE locally). |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`   | Optional. Restrict by HTTP referrer in Google Cloud. Without it, map widgets fall back to a static SVG. |
| `PORT`                              | Local dev port. Railway injects `$PORT` per service in production. |

### `apps/bank-web` ([`.env.example`](apps/bank-web/.env.example))

| Variable                     | Purpose                                              |
| ---------------------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`   | Same as the employer dashboard.                      |

---

## Workspace layout

```
apps/
  landing/         Next.js 14 — marketing site with employer + bank CTAs
  employer-web/    Next.js 14 App Router — wholesalers, factories, retailers
  bank-web/        Next.js 14 App Router — credit officers, risk analysts
packages/
  ui/              Shared component library + Tailwind preset (@mui/icons-material)
  types/           Shared domain types, Zod schemas, and BE-generated OpenAPI types
  mock-data/       Mock generators with loading / empty / error toggles
  tsconfig/        Shared TypeScript base configs
  eslint-config/   Shared ESLint configs
  prettier-config/ Shared Prettier config
nixpacks.toml      Forces Node 20 into Nixpacks' setup phase (Railway)
turbo.json         Turborepo task graph (build, dev, lint, typecheck, test)
pnpm-workspace.yaml
```

---

## Quality gates

```bash
pnpm lint        # next lint --max-warnings 0 in every app
pnpm typecheck   # tsc --noEmit
pnpm test        # vitest run --passWithNoTests
pnpm build       # next build in every app
```

All four must be green before merging. Turborepo caches results so re-runs are fast — only changed packages and their dependents rebuild.

---

## Deployment (Railway)

The three apps ship as **three independent Railway services** in a single Railway project, each pointed at its own subdomain or `*.up.railway.app` URL. Bundles stay isolated, deploys are independent, and a `Domain=.forge.app` session cookie can work across both dashboard subdomains.

| App            | Railway service  | Current URL                          |
| -------------- | ---------------- | ------------------------------------ |
| `landing`      | `forge-landing`  | (set after first deploy)             |
| `employer-web` | `forge-employer` | https://forgefe.up.railway.app       |
| `bank-web`     | `forge-bank`     | https://forgeem.up.railway.app       |

### Per-service Railway setup

In Railway, create one service per app, **all services pointing at the monorepo root** (not at the app subdirectory). The per-app `railway.json` files do the scoping.

For each service, in **Settings → Source**:

- **Repository**: this monorepo.
- **Root Directory**: `/` (the repo root). Leave blank or set explicitly to `/`. **Do not** set this to `apps/<app>` — if you do, Railway only copies that subdirectory into the build context, the workspace files are missing, and Nixpacks falls back to `npm i` on the lone `package.json` (this is the classic failure mode).
- **Watch Paths**: per app, so unrelated edits don't trigger redeploys —
  - `forge-landing` → `apps/landing/**`
  - `forge-employer` → `apps/employer-web/**`
  - `forge-bank` → `apps/bank-web/**`
  - Add `packages/**` and `pnpm-lock.yaml` to **all three** so shared-package edits redeploy every consumer.
- **Config-as-Code Path** (Settings → Build): per service —
  - `forge-landing` → `apps/landing/railway.json`
  - `forge-employer` → `apps/employer-web/railway.json`
  - `forge-bank` → `apps/bank-web/railway.json`

### Nixpacks setup

A workspace-root `nixpacks.toml` forces Node 20 into Nixpacks' setup phase. Without it, when `railway.json` overrides the build phase, Nixpacks skips its provider auto-detection and Node never gets installed, leading to `npm: command not found`.

```toml
# nixpacks.toml (workspace root)
[phases.setup]
nixPkgs = ["nodejs_20"]
```

Each `railway.json` runs from the repo root, so commands stay simple:

```jsonc
// apps/landing/railway.json
{
  "build": {
    "buildCommand": "pnpm install --frozen-lockfile && pnpm --filter landing... build"
  },
  "deploy": {
    "startCommand": "pnpm --filter landing start"
  }
}
```

A few things we deliberately don't do:

- **We do not install pnpm explicitly.** Nixpacks' `nodejs_20` Nix package ships with pnpm pre-installed on `PATH`. Trying to `npm install -g pnpm@9` fails with `EEXIST` because the Nix store is immutable.
- **We do not use `corepack enable`.** Railway's Nixpacks Node images don't expose `corepack` on `PATH`.
- **`--filter <app>...`** (with three trailing dots) builds the app and only its workspace dependencies. The leading `apps/landing/...` does not work — `...` must trail.
- **The `start` script in each app's `package.json` does NOT pin a port** — it's just `next start`, which reads `$PORT` from the environment. Railway injects `$PORT` per service.

### Environment variables on Railway

Set per-service in **Settings → Variables**:

- `forge-landing`:
  - `NEXT_PUBLIC_EMPLOYER_URL=https://forgefe.up.railway.app`
  - `NEXT_PUBLIC_BANK_URL=https://forgeem.up.railway.app`
- `forge-employer`:
  - `NEXT_PUBLIC_API_BASE_URL=https://forgebe-production.up.railway.app`
  - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<your key>` (optional)
- `forge-bank`:
  - `NEXT_PUBLIC_API_BASE_URL=https://forgebe-production.up.railway.app`

### Custom domains

In each service's **Settings → Networking → Custom Domains**, add the production hostnames (when you have them) and add `CNAME` records pointing to whatever Railway shows in the "Add Domain" panel (usually a `<service>.up.railway.app` target). The current Railway-managed `*.up.railway.app` URLs in the table above work out of the box without custom domains.

### Testing subdomains locally

Modern browsers route `*.localhost` to `127.0.0.1` automatically — no `/etc/hosts` edits needed. Once `pnpm dev` is running you can hit:

- http://landing.localhost:3002
- http://employer.localhost:3070
- http://bank.localhost:3001

All three work because Next.js's dev server binds to all loopback names on the configured port.

---

## Adding a new app to the monorepo

1. Create `apps/<name>/` with its own `package.json` (name it `"<name>"` so `--filter <name>` resolves).
2. Use one of the existing apps as a template — copy `next.config.mjs`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, and adjust the dev port in `package.json`.
3. Add a `railway.json` mirroring the pattern above. Swap `<name>` in the filter and adjust `healthcheckPath` to a route that always renders.
4. `pnpm install` once at the root — `pnpm-workspace.yaml` picks up `apps/*` automatically.
5. Add a Railway service pointing at the new `railway.json` and at the monorepo root.

---

## Troubleshooting

**`npm: command not found` during Railway build**
The workspace-root `nixpacks.toml` is missing or wasn't picked up. Re-add it with `nixPkgs = ["nodejs_20"]` under `[phases.setup]`.

**Railway only builds one app's files**
You set the service's Root Directory to `apps/<name>` instead of `/`. Change it back to `/` and let `railway.json` do the scoping.

**`EEXIST` errors when installing pnpm**
Don't `npm install -g pnpm` in your build command — pnpm is already on `PATH` in the Nixpacks Node 20 image.

**Map widgets show an SVG placeholder**
You haven't set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` for the employer-web service, or the key is restricted to a different referrer than the deployed URL.

**Header CTA buttons go nowhere on the landing page**
`NEXT_PUBLIC_EMPLOYER_URL` / `NEXT_PUBLIC_BANK_URL` are unset on the landing service. The fallbacks in the code resolve to the live Railway URLs — if the buttons are broken in dev, copy [`apps/landing/.env.example`](apps/landing/.env.example) to `apps/landing/.env`.

**The dashboard hits the wrong backend**
`NEXT_PUBLIC_API_BASE_URL` is set per service — change it in Railway and redeploy. `NEXT_PUBLIC_*` values are baked into the JS bundle at build time, so changing the env without redeploying is a no-op.
