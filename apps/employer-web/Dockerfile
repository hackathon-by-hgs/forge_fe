# syntax=docker/dockerfile:1.7
# Build context: monorepo root (so workspace packages resolve)

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# ── deps: install full workspace deps using only manifests for cacheability ──
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json .npmrc ./
COPY apps/employer-web/package.json ./apps/employer-web/
COPY packages ./packages
RUN pnpm install --frozen-lockfile

# ── builder: copy source and build with turbo filter ──
FROM base AS builder
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json .npmrc ./
COPY apps/employer-web ./apps/employer-web
# Re-link workspace symlinks inside apps/employer-web/node_modules
RUN pnpm install --frozen-lockfile --offline
RUN pnpm --filter employer-web... build

# ── runner: minimal standalone runtime ──
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Next.js standalone output bundles only what the app needs
COPY --from=builder --chown=nextjs:nodejs /app/apps/employer-web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/employer-web/.next/static ./apps/employer-web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/employer-web/public ./apps/employer-web/public

USER nextjs
EXPOSE 3000

CMD ["node", "apps/employer-web/server.js"]
