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
      // Threshold'lar mevcut gerçek kapsama göre ayarlandı (~%55 lines, %50 funcs).
      // Hedef: zamanla artırmak. Yeni testler eklendikçe bu seviye yükseltilir.
      // Server action'lar için spesifik threshold şimdilik yok — coverage tam değil.
      thresholds: {
        lines: 50,
        functions: 45,
        branches: 35,
        statements: 50,
      },
    },
  },
})
