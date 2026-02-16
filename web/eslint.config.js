import configs from '@helpwave/eslint-config'

export default [
  ...configs.recommended,
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
]
