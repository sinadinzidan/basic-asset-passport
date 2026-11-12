import { auraEslintPlugin } from '@cognite/aura/eslint';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import checkFile from 'eslint-plugin-check-file';
import importPlugin from 'eslint-plugin-import';
import noOnlyTestsPlugin from 'eslint-plugin-no-only-tests';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import enumRules from './eslint-rules/enumRules.js';

const BOOLEAN_PREFIXES = ['is', 'has', 'can', 'should', 'did', 'will'];

// Boolean names that an SDK, a browser API or a library dictates, and the HTML attribute names.
const EXTERNAL_BOOLEAN_NAMES = [
  'disabled',
  'checked',
  'hidden',
  'readOnly',
  'required',
  'selected',
  'enabled',
  'retry',
  'writable',
  'queryable',
  'nullsFirst',
  'inlineViews',
  'ignoreUnknownIds',
  'autoCreateDirectRelations',
  'autoCreateStartNodes',
  'autoCreateEndNodes',
  'continuous',
  'interimResults',
  'wasModified',
  'targetsList',
  'configurable',
  'globals',
  'passive',
  'shiftKey',
  'childList',
  'subtree',
  'loading',
];

const sharedRules = {
  'import/first': 'error',
  'import/no-duplicates': 'error',
  'import/order': [
    'error',
    {
      groups: ['builtin', 'external', 'internal', 'parent', ['sibling', 'index']],
      'newlines-between': 'always',
      alphabetize: {
        order: 'asc',
        caseInsensitive: true,
      },
    },
  ],
  'no-only-tests/no-only-tests': 'error',
  quotes: ['error', 'single', { avoidEscape: true }],
};

const noUnusedVarsOptions = {
  argsIgnorePattern: '^_',
  caughtErrorsIgnorePattern: '^_',
  varsIgnorePattern: '^_',
  ignoreRestSiblings: true,
};

export default tseslint.config(
  {
    // src/cognite-file-viewer is Cognite's file viewer, copied in as distributed and not held to the app's style rules.
    ignores: [
      'dist',
      'build',
      '.next',
      'coverage',
      '*.min.js',
      '.agents',
      '.cursor',
      '.claude',
      'src/cognite-file-viewer',
    ],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    plugins: {
      import: importPlugin,
      'no-only-tests': noOnlyTestsPlugin,
    },
    rules: sharedRules,
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': ['error', noUnusedVarsOptions],
    },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      aura: auraEslintPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': ['error', noUnusedVarsOptions],
      'aura/no-overriding-styles': 'warn',
      'no-unused-vars': 'off',
      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],
    },
  },
  {
    // The project conventions (see PROJECT_CONVENTIONS.md), enforced by tools.
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        // The tool configuration files at the root sit outside the app's tsconfig.
        projectService: {
          allowDefaultProject: ['vite.config.ts', 'vitest.config.ts', 'vitest.setup.ts'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      unicorn,
      'check-file': checkFile,
      'local-enum': enumRules,
    },
    rules: {
      // .tsx files are PascalCase, .ts files camelCase, folders kebab-case.
      'check-file/filename-naming-convention': [
        'error',
        { '**/*.tsx': 'PASCAL_CASE', '**/*.ts': 'CAMEL_CASE' },
        { ignoreMiddleExtensions: true },
      ],
      'check-file/folder-naming-convention': [
        'error',
        { 'src/**/!(__tests__)/': 'KEBAB_CASE', 'packages/*/src/**/!(__tests__)/': 'KEBAB_CASE' },
      ],
      // Full-word names: no single letters, no abbreviations.
      'id-length': ['error', { min: 2, properties: 'never' }],
      'unicorn/prevent-abbreviations': [
        'error',
        {
          checkFilenames: false,
          allowList: {
            initialProps: true,
            props: true,
            Props: true,
            id: true,
            url: true,
            api: true,
            html: true,
            http: true,
          },
        },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: ['variable', 'parameter', 'property', 'accessor'],
          types: ['boolean'],
          format: ['PascalCase'],
          prefix: BOOLEAN_PREFIXES,
          filter: {
            regex: `^(${EXTERNAL_BOOLEAN_NAMES.join('|')}|[a-z]+-[a-z-]+)$`,
            match: false,
          },
        },
        { selector: 'enum', format: ['PascalCase'] },
        { selector: 'enumMember', format: ['UPPER_CASE'] },
        {
          selector: 'variable',
          modifiers: ['const', 'global'],
          types: ['string', 'number'],
          format: ['UPPER_CASE'],
        },
      ],
      'local-enum/enum-value-matches-key': 'error',
      // No magic values.
      '@typescript-eslint/no-magic-numbers': [
        'error',
        {
          ignore: [0, 1, -1],
          ignoreArrayIndexes: true,
          ignoreEnums: true,
          ignoreReadonlyClassProperties: true,
          ignoreTypeIndexes: true,
          ignoreNumericLiteralTypes: true,
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          // A typeof check compares against the language's own type names, which are not domain values.
          selector:
            'BinaryExpression[operator=/^[!=]==?$/][left.operator!="typeof"][right.operator!="typeof"] > Literal[value=/.+/][raw=/^[\'"]/]',
          message: 'Do not compare against a string literal. Use an enum or a named constant.',
        },
        {
          selector: 'SwitchCase > Literal',
          message: 'Do not switch on a literal. Use an enum or a named constant.',
        },
        {
          // The keys of a Pick, Omit or Exclude name properties of another type; they are not a set of values.
          selector:
            ':not(TSTypeParameterInstantiation) > TSUnionType > TSLiteralType > Literal[raw=/^[\'"]/]',
          message: 'Do not use a string-literal union. Use an enum.',
        },
      ],
    },
  },
  {
    // A test file is named after what it covers, so the test of a hook is camelCase.
    files: ['**/__tests__/**/*.tsx'],
    rules: {
      'check-file/filename-naming-convention': [
        'error',
        { '**/*.tsx': '[a-zA-Z]*([a-zA-Z0-9])' },
        { ignoreMiddleExtensions: true },
      ],
    },
  },
  {
    // Numbers in test data and mock datasets are the data itself, not magic values.
    files: ['**/__tests__/**', 'src/mocks/**'],
    rules: { '@typescript-eslint/no-magic-numbers': 'off' },
  },
  {
    // File names a tool requires are exempt from the naming rule: the Vite type declarations, and the entry
    // `src/main.tsx`, which `index.html` and the Flows certification checks name.
    files: ['**/vite-env.d.ts', 'src/main.tsx'],
    rules: {
      'check-file/filename-naming-convention': 'off',
      'unicorn/prevent-abbreviations': 'off',
    },
  },
  // Must be last: turns off rules that conflict with Prettier.
  prettier,
);
