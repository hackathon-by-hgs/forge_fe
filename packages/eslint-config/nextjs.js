/**
 * ESLint config for Next.js apps (employer-web, bank-web).
 */
module.exports = {
  extends: ['./index.js', 'next/core-web-vitals'],
  settings: {
    next: {
      rootDir: ['apps/*/'],
    },
  },
};
