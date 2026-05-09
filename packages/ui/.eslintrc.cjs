module.exports = {
  root: true,
  extends: ['@forge/eslint-config/library'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
