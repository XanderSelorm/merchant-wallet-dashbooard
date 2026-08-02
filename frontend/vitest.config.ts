import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vitest/config'

/**
 * Kept separate from vite.config.ts so the test run does not pull in the Vue
 * SFC and Tailwind plugins — this suite covers services, stores and
 * composables, none of which render a component.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    // Date formatting resolves against the machine's zone, so pin it or the
    // suite passes in Accra and fails in New York.
    env: { TZ: 'UTC' },
    // jsdom rather than node: the CSV export composable drives anchor clicks
    // and object URLs, and the toast host relies on timers in a DOM context.
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    restoreMocks: true,
  },
})
