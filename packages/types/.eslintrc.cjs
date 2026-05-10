module.exports = {
  root: true,
  extends: ['@forge/eslint-config'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ['src/api.gen.ts'],
};
