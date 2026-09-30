import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, YT: 'readonly' },
    },
  },
  reactHooks.configs.flat.recommended,
  {
    files: ['src/**/*.jsx'],
    plugins: { 'react-refresh': reactRefresh },
    rules: { 'react-refresh/only-export-components': ['warn', { allowConstantExport: true }] },
  },
  { files: ['public/sw.js'], languageOptions: { sourceType: 'script', globals: globals.serviceworker } },
  { files: ['*.config.{js,cjs}'], languageOptions: { globals: globals.node } },
  { files: ['**/*.test.{js,jsx}', 'src/test/**'], languageOptions: { globals: globals.node } },
];
