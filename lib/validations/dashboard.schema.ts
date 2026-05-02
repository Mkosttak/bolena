import { z } from 'zod'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD formatında olmalı')

export const dashboardDateRangeSchema = z
  .object({
    startDate: isoDate,
    endDate: isoDate,
  })
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: 'Başlangıç tarihi bitiş tarihinden sonra olamaz',
    path: ['endDate'],
  })

export type DashboardDateRange = z.infer<typeof dashboardDateRangeSchema>

export const dashboardPresetSchema = z.enum([
  'today',
  'yesterday',
  'last7days',
  'last30days',
  'thisMonth',
  'lastMonth',
  'thisYear',
])
export type DashboardPreset = z.infer<typeof dashboardPresetSchema>
