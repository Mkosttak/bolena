import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    include: ['__tests__/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['__tests__/setup.ts'],
    globals: true,
    exclude: ['node_modules/**', 'e2e/**'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary', 'lcov'],
      exclude: [
        'node_modules',
        '.next',
        'e2e',
        'components/ui',       // shadcn oluşturdu
        '**/*.config.*',
        '**/types/**',
        'scripts/**',
        'supabase/repair/**',
        '__tests__/helpers/**',
      ],
      thresholds: {
        lines: 75,
        functions: 75,
        branches: 70,
        // Server actions için daha sıkı (kritik para/sipariş akışları)
        'app/[locale]/admin/orders/actions.ts': {
          lines: 85,
          functions: 90,
          branches: 75,
        },
        'app/qr/[token]/[session]/actions.ts': {
          lines: 85,
          functions: 90,
          branches: 75,
        },
      },
    },
  },
})
