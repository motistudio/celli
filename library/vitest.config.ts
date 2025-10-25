/// <reference types="vitest" />

/** @type {import('vitest').UserConfig} */
export default {
  test: {
    root: '.',
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage'
    },
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: undefined,
        minThreads: undefined,
        useAtomics: true,
        isolate: true
      }
    },
    name: 'Celli',
    testMatch: ['test/**/*.spec.ts'],
    environment: 'node',
    exclude: ['node_modules', 'dist', '**/*.t.ts', '../website', '../node_modules']
  }
}
