import type { CSSProperties } from 'react'

/**
 * Grafik renkleri — `globals.css` içindeki `--chart-1` … `--chart-5` ile uyumlu.
 * Açık / koyu mod `html.dark` ile otomatik güncellenir (SVG fill/stroke `var(...)` çözülür).
 * `.reports-page` içinde dark’ta daha parlak `--chart-*` override edilir.
 */

export const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
] as const

export function chartFillAt(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length] ?? CHART_COLORS[0]
}

/**
 * Recharts Tooltip — kart ve border tema ile uyumlu.
 */
export function chartTooltipStyle(isDark: boolean) {
  return {
    contentStyle: {
      backgroundColor: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      fontSize: '12px',
      color: 'var(--card-foreground)',
      boxShadow: isDark
        ? '0 4px 24px rgba(0, 0, 0, 0.45)'
        : '0 4px 16px rgba(0, 0, 0, 0.07)',
    },
    itemStyle: {
      color: 'var(--muted-foreground)',
    },
  }
}

/** Eksen tick rengi */
export function chartTickFill(_isDark?: boolean): string {
  return 'var(--muted-foreground)'
}

/** Izgara çizgisi */
export function chartGridStroke(_isDark?: boolean): string {
  return 'color-mix(in oklch, var(--border) 75%, transparent)'
}

/** Recharts Legend — koyu zeminde okunaklı etiket */
export function chartLegendStyle(extra?: CSSProperties): CSSProperties {
  return {
    fontSize: 12,
    color: 'var(--muted-foreground)',
    ...extra,
  }
}
