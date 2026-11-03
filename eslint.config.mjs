import js from '@eslint/js'

export default [
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        process: 'readonly',
        fetch: 'readonly',
        AbortSignal: 'readonly',
      },
    },
  },
  {
    ignores: [
      "dist/**"
    ],
  },
  js.configs.recommended,
]
