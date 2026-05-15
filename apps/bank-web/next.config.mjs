import path from 'node:path';
import { fileURLToPath } from 'node:url';


/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@forge/ui', '@forge/types', '@forge/mock-data'],
  experimental: {
    optimizePackageImports: ['@mui/icons-material', '@mui/material'],
  },

};

export default nextConfig;
