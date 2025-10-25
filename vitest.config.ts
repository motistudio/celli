/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['library/test/**/*.spec.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'website/**',
      '**/*.t.ts'
    ]
  }
})
