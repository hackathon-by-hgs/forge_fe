# Informal Economy Platform

Monorepo for the Employer Dashboard (`apps/employer-web`), Bank Dashboard (`apps/bank-web`), and the shared packages they depend on.

## Quick start

```bash
pnpm install
pnpm dev
```

`pnpm dev` at the root runs `turbo run dev`, which spawns both apps in parallel with prefixed log output:

- Employer dashboard → http://localhost:7070
- Bank dashboard → http://localhost:3001

To run just one:

```bash
pnpm --filter employer-web dev
pnpm --filter bank-web dev
```

## Workspace layout

```
apps/
  employer-web/   Next.js 14 App Router — wholesalers, factories, retailers
  bank-web/       Next.js 14 App Router — credit officers, risk analysts
packages/
  ui/             Shared component library + Tailwind preset (@mui/icons-material)
  types/          Shared domain types and Zod schemas
  mock-data/      Mock generators with loading/empty/error toggles
  tsconfig/       Shared TypeScript base configs
  eslint-config/  Shared ESLint configs
  prettier-config/ Shared Prettier config
```

## Deployment (Railway)

The two dashboards ship as **two independent Railway services** in a single Railway project, each pointed at its own subdomain:

| App           | Railway service  | Production domain    |
| ------------- | ---------------- | -------------------- |
| `employer-web` | `forge-employer` | `employer.forge.app` |
| `bank-web`    | `forge-bank`     | `bank.forge.app`     |

This keeps bundles isolated, deploys independent, and lets a `Domain=.forge.app` session cookie work across both subdomains when auth lands.

### Per-service Railway setup

In Railway, create one service per app, **both services pointing at the monorepo root** (not at the app subdirectory). The per-app `railway.json` files do the scoping.

For each service, in **Settings → Source**:

- **Repository**: this monorepo
- **Root Directory**: `/` (the repo root) — leave blank or set explicitly to `/`. **Do not** set this to `apps/<app>`; if you do, Railway only copies that subdirectory into the build context, the workspace files are missing, and Nixpacks falls back to `npm i` on the lone `package.json` (this is the failure mode).
- **Watch Paths**: per app — `apps/employer-web/**` for the employer service, `apps/bank-web/**` for the bank service. Add `packages/**` and `pnpm-lock.yaml` too so shared-package edits redeploy both.
- **Config-as-Code Path** (Settings → Build): per service —
  - `forge-employer` → `apps/employer-web/railway.json`
  - `forge-bank` → `apps/bank-web/railway.json`

A workspace-root `nixpacks.toml` forces Node 20 into Nixpacks' setup phase. Without it, when `railway.json` overrides the build phase, Nixpacks skips its provider auto-detection and Node never gets installed, leading to `npm: command not found`.

```toml
# nixpacks.toml (workspace root)
[phases.setup]
nixPkgs = ["nodejs_20"]
```

Each `railway.json` runs from the repo root, so commands stay simple:

```jsonc
// apps/employer-web/railway.json
{
  "build": {
    "buildCommand": "npm install -g pnpm@9 && pnpm install --frozen-lockfile && pnpm --filter employer-web... build"
  },
  "deploy": {
    "startCommand": "npx -y pnpm@9 --filter employer-web start"
  }
}
```

`npm install -g pnpm@9` installs pnpm via `npm` (always present in Nixpacks' Node image). We do not use `corepack enable` here because Railway's Nixpacks Node images don't expose `corepack` on `PATH`. `--filter employer-web...` (three dots) builds the app and only its workspace dependencies. `npx -y pnpm@9` at start time is a belt-and-braces fallback in case the runtime user's `PATH` doesn't include the build-time global pnpm.

The `start` script in each app's `package.json` does NOT pin a port — it's just `next start`, which reads `$PORT` from the environment. Railway injects `$PORT` per service.

### Custom domains

In each service's **Settings → Networking → Custom Domains**, add:

- `forge-employer` → `employer.forge.app`
- `forge-bank` → `bank.forge.app`

DNS: add `CNAME` records for `employer` and `bank` pointing to whatever Railway shows in the "Add Domain" panel (usually a `<service>.up.railway.app` target).

### Testing subdomains locally

Modern browsers route `*.localhost` to `127.0.0.1` automatically — no `/etc/hosts` edits needed. So once `pnpm dev` is running, you can test the production-shaped URLs:

- http://employer.localhost:7070
- http://bank.localhost:3001

Both work because Next.js's dev server binds to all loopback names on the configured port.

## Quality gates

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

All four must be green before merging. `turbo` caches results so re-runs are fast.
