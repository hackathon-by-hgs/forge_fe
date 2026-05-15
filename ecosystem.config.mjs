// ecosystem.config.js — commit this to your repo root
// PM2 process manager config for Next.js on Hostinger VPS

module.exports = {
  apps: [
    {
      name: 'bank-web',                      // ← change to your app name
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/your-app/current',      // ← change to your app directory

      // ── Clustering ────────────────────────────────────────
      instances: 'max',                       // use all CPU cores
      exec_mode: 'cluster',

      // ── Environment ───────────────────────────────────────
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // ── Reliability ───────────────────────────────────────
      watch: false,                           // never watch in prod
      max_memory_restart: '512M',
      restart_delay: 3000,
      max_restarts: 5,

      // ── Logging ───────────────────────────────────────────
      out_file: '/var/log/your-app/out.log',
      error_file: '/var/log/your-app/error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};