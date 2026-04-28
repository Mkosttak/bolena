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
      reporter: ['text', 'html'],
      exclude: [
        'node_modules',
        '.next',
        'e2e',
        'components/ui',       // shadcn oluşturdu, bizim testlerimiz değil
        '**/*.config.*',
        '**/types/**',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
      },
    },
  },
})
