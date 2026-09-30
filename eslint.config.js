import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, YT: 'readonly' },
    },
  },
  { files: ['public/sw.js'], languageOptions: { sourceType: 'script', globals: globals.serviceworker } },
  { files: ['*.config.js'], languageOptions: { globals: globals.node } },
];
