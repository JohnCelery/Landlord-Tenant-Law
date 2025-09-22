import { mergeConfig } from 'vite'
import { defineConfig } from 'vitest/config'
import baseConfig from './vite.config'

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './vitest.setup.ts',
      coverage: {
        provider: 'v8',
      },
    },
  }),
)
