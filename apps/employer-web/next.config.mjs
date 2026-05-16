import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const apiProxyTarget = process.env.FORGE_API_PROXY_TARGET?.replace(/\/+$/, '') ?? '';

const nextConfig = {

  outputFileTracingRoot: path.join(__dirname, '../../'),
  reactStrictMode: true,
  transpilePackages: ['@forge/ui', '@forge/types', '@forge/mock-data'],
  experimental: {
    optimizePackageImports: ['@mui/icons-material', '@mui/material'],
  },
  /**
   * Same-origin API proxy so HttpOnly refresh cookies work in local dev.
   * Must preserve URL prefix `/v1/...` — the BE refresh cookie uses Path=/v1/dashboard/auth,
   * so a prefix like /api/forge/v1/... would never match and the cookie would not be sent
   * (NO_REFRESH_COOKIE).
   * Set FORGE_API_PROXY_TARGET + NEXT_PUBLIC_API_BASE_URL=/ (see .env.example).
   */
  async rewrites() {
    if (!apiProxyTarget) return [];
    return [
      {
        source: '/v1/:path*',
        destination: `${apiProxyTarget}/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
