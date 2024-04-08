import js from '@eslint/js'

export default [
  {
    languageOptions: {
      ecmaVersion: 2015,
      sourceType: 'module',
      globals: {
        process: 'readonly',
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
