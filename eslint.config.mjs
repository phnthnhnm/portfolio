import js from '@eslint/js';
import tseslint, { parser as tsParser } from 'typescript-eslint';
import astroParser from 'astro-eslint-parser';
import astroPlugin from 'eslint-plugin-astro';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['dist/**', '.astro/**', 'public/mermaid-viewer.js', 'lighthouserc.cjs'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylistic,
  ...astroPlugin.configs.recommended,

  // Global rules (apply to all files)
  {
    rules: {
      'no-var': 'error',
      'prefer-const': 'error',
      'no-console': 'warn',
    },
  },

  // Node.js scripts
  {
    files: ['scripts/**', 'functions/**'],
    languageOptions: {
      globals: globals.node,
    },
  },

  // TypeScript-specific parser and rules
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
    },
  },

  // Astro-specific parser and rules
  {
    files: ['**/*.astro'],
    languageOptions: {
      parser: astroParser,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: ['.astro'],
      },
    },
    rules: {
      'astro/no-conflict-set-directives': 'error',
      'astro/no-unused-define-vars-in-style': 'warn',
    },
  },

  // Prettier compatibility — must be last
  prettier,
);
