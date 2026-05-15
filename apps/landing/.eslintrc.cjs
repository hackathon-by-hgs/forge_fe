module.exports = {
  root: true,
  extends: ['@forge/eslint-config/nextjs'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  rules: {
    '@next/next/no-html-link-for-pages': 'off',
  },
};
