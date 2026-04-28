import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Download, FileDown } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { buildPrevDateRange, type DateRange } from '@/lib/utils/reports.utils'
import {
  fetchDailyRevenue,
  fetchTopProducts,
  fetchOrderTypeBreakdown,
  fetchPaymentMethodBreakdown,
  fetchCategoryRevenue,
  fetchCampaignStats,
  fetchKpiSummary,
  fetchComplimentarySummary,
  fetchOrderOutcomeStats,
  fetchHourlyHeatmap,
  fetchPlatformStats,
  fetchReservationStats,
} from '@/app/[locale]/admin/reports/actions'

interface ExportButtonProps {
  dateRange: DateRange
  activeReport?: 'sales' | 'products' | 'channels' | 'operations' | 'end-of-day' | null
}

export function ExportButton({ dateRange, activeReport }: ExportButtonProps) {
  const t = useTranslations('reports')
  const tEx = useTranslations('reports.export')
  const [loading, setLoading] = useState(false)

  const handleExportExcel = async () => {
    setLoading(true)
    try {
      const prevRange = buildPrevDateRange(dateRange)
      const workbook = new ExcelJS.Workbook()
      workbook.creator = 'Bolena Cafe'
      workbook.created = new Date()
      const isAll = !activeReport || activeReport === 'end-of-day'      // Yardımcı Fonksiyon: Sütun genişlikleri ayarı, Başlık stili, Toplam formülleri
      const formatSheet = (sheet: ExcelJS.Worksheet, sumColIndexes: number[] = []) => {
        // Sütun genişliklerini otomatik ayarla
        sheet.columns.forEach((column) => {
          let maxLength = 0
          column.eachCell!({ includeEmpty: true }, (cell) => {
            const length = cell.value ? cell.value.toString().length : 10
            if (length > maxLength) maxLength = length
          })
          column.width = Math.min(maxLength + 2, 40)
        })

        // Başlık (Header) stili: Yeşil arka plan, Beyaz kalın yazı
        const headerRow = sheet.getRow(1)
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF166534' }, // Tailwind green-800
        }
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

        // Toplam Satırı Ekle
        if (sumColIndexes.length > 0) {
          const rowCount = sheet.rowCount
          if (rowCount > 1) { // Sadece veri varsa
            const totalRow = sheet.addRow([])
            totalRow.getCell(1).value = 'TOPLAM / TOTAL'
            totalRow.font = { bold: true, color: { argb: 'FF166534' } }
            totalRow.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF0FDF4' }, // Tailwind green-50
            }

            sumColIndexes.forEach((colIndex) => {
              const letter = sheet.getColumn(colIndex).letter
              totalRow.getCell(colIndex).value = {
                formula: `SUM(${letter}2:${letter}${rowCount})`,
                date1904: false,
              }
              totalRow.getCell(colIndex).numFmt = '#,##0.00₺' // Para birimi formatı 
            })
          }
        }
      }

      // -- 1. OVERVIEW --
      if (isAll) {
        const [kpiRes, complimentaryRes, outcomesRes] = await Promise.all([
          fetchKpiSummary(dateRange.start, dateRange.end, prevRange.start, prevRange.end),
          fetchComplimentarySummary(dateRange.start, dateRange.end),
          fetchOrderOutcomeStats(dateRange.start, dateRange.end),
        ])

        if ('data' in kpiRes) {
          const k = kpiRes.data.current
          const sheet = workbook.addWorksheet(tEx('sheetSummary') || 'Summary')
          sheet.addRow(['Metric', 'Value'])
          sheet.addRow([tEx('rowTotalRevenue'), k.revenue])
          sheet.addRow([tEx('rowOrderCount'), k.orderCount])
          sheet.addRow([tEx('rowAvgBasket'), k.avgBasket])
          sheet.addRow([tEx('rowTotalDiscount'), k.totalDiscount])
          sheet.addRow([tEx('rowReservationCount'), k.reservationCount])
          sheet.addRow([tEx('rowAvgPrepMinutes'), Math.round(k.avgPrepTime)])
          
          sheet.getColumn(2).numFmt = '#,##0.00'
          formatSheet(sheet, [])
        }

        if ('data' in complimentaryRes && complimentaryRes.data.lineCount > 0) {
          const c = complimentaryRes.data
          const sheet = workbook.addWorksheet(tEx('sheetComplimentary') || 'Complimentary')
          sheet.addRow(['Comp Lines', 'Qty', 'Value'])
          sheet.addRow([c.lineCount, c.totalQuantity, c.listValueTry])
          formatSheet(sheet, [2, 3])
        }

        if ('data' in outcomesRes) {
          const o = outcomesRes.data
          const sheet = workbook.addWorksheet(tEx('sheetOrderOutcomes') || 'Outcomes')
          sheet.addRow(['Active', 'Completed', 'Cancelled', 'No Show', 'Completed Revenue'])
          sheet.addRow([o.active, o.completed, o.cancelled, o.noShow, o.completedRevenue])
          formatSheet(sheet, [5])
        }
      }

      // -- 2. SALES --
      if (isAll || activeReport === 'sales') {
        const [revenueRes, categoriesRes, orderTypesRes, paymentsRes] = await Promise.all([
          fetchDailyRevenue(dateRange.start, dateRange.end),
          fetchCategoryRevenue(dateRange.start, dateRange.end),
          fetchOrderTypeBreakdown(dateRange.start, dateRange.end),
          fetchPaymentMethodBreakdown(dateRange.start, dateRange.end),
        ])

        if ('data' in revenueRes) {
          const sheet = workbook.addWorksheet(tEx('sheetDaily') || 'Daily Sales')
          sheet.addRow(['Date', 'Revenue', 'Orders'])
          revenueRes.data.forEach((r) => sheet.addRow([r.date, r.revenue, r.orderCount]))
          formatSheet(sheet, [2, 3])
        }

        if ('data' in categoriesRes) {
          const sheet = workbook.addWorksheet(tEx('sheetCategories') || 'Categories')
          sheet.addRow(['Category', 'Revenue', 'Share %'])
          categoriesRes.data.forEach((c) => sheet.addRow([c.categoryName, c.revenue, Number(c.percentage.toFixed(1))]))
          formatSheet(sheet, [2, 3])
        }

        if ('data' in orderTypesRes) {
          const sheet = workbook.addWorksheet(tEx('sheetOrderTypes') || 'Order Types')
          sheet.addRow(['Type', 'Count', 'Revenue'])
          orderTypesRes.data.forEach((o) => sheet.addRow([o.type, o.count, o.revenue]))
          formatSheet(sheet, [2, 3])
        }

        if ('data' in paymentsRes) {
          const sheet = workbook.addWorksheet(tEx('sheetPayments') || 'Payments')
          sheet.addRow(['Method', 'Total'])
          paymentsRes.data.forEach((p) => sheet.addRow([p.method, p.total]))
          formatSheet(sheet, [2])
        }
      }

      // -- 3. PRODUCTS --
      if (isAll || activeReport === 'products') {
        const [productsRes, campaignsRes] = await Promise.all([
          fetchTopProducts(dateRange.start, dateRange.end, 0),
          fetchCampaignStats(dateRange.start, dateRange.end),
        ])

        if ('data' in productsRes) {
          const sheet = workbook.addWorksheet(tEx('sheetProducts') || 'Products')
          sheet.addRow(['Product', 'Qty Sold', 'Revenue'])
          productsRes.data.forEach((p) => sheet.addRow([p.productName, p.quantity, p.revenue]))
          formatSheet(sheet, [2, 3])
        }

        if ('data' in campaignsRes && campaignsRes.data.length > 0) {
          const sheet = workbook.addWorksheet(tEx('sheetCampaigns') || 'Campaigns')
          sheet.addRow(['Product', 'Campaign Qty', 'Discount'])
          campaignsRes.data.forEach((c) => sheet.addRow([c.productName, c.quantity, c.discountAmount]))
          formatSheet(sheet, [2, 3])
        }
      }

      // -- 4. CHANNELS --
      if (isAll || activeReport === 'channels') {
        const [platformsRes, reservationsRes] = await Promise.all([
          fetchPlatformStats(dateRange.start, dateRange.end),
          fetchReservationStats(dateRange.start, dateRange.end),
        ])

        if ('data' in platformsRes) {
          const sheet = workbook.addWorksheet('Platforms')
          sheet.addRow(['Platform', 'Orders', 'Revenue', 'Cancels'])
          platformsRes.data.forEach((p) => sheet.addRow([p.platform, p.orderCount, p.revenue, p.cancelCount]))
          formatSheet(sheet, [2, 3, 4])
        }

        if ('data' in reservationsRes) {
          const r = reservationsRes.data
          const sheet = workbook.addWorksheet('Reservations')
          sheet.addRow(['Total', 'Completed', 'NoShow', 'Cancelled', 'Pending', 'Seated', 'AvgPartySize'])
          sheet.addRow([r.total, r.completed, r.noShow, r.cancelled, r.pending, r.seated, r.avgPartySize])
          formatSheet(sheet, [1, 2, 3, 4, 5, 6])
        }
      }

      // -- 5. OPERATIONS --
      if (isAll || activeReport === 'operations') {
        const heatmapRes = await fetchHourlyHeatmap(dateRange.start, dateRange.end)
        if ('data' in heatmapRes) {
          const sheet = workbook.addWorksheet('Heatmap')
          sheet.addRow(['DayOfWeek', 'Hour', 'OrderCount'])
          heatmapRes.data.forEach((h) => sheet.addRow([h.dayOfWeek, h.hour, h.count]))
          formatSheet(sheet, [3])
        }
      }

      // İndirme işlemi
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const reportPrefix = activeReport ? `${activeReport}-` : 'overview-'
      const filename = `${reportPrefix}${tEx('filename', { start: dateRange.start, end: dateRange.end })}.xlsx`
      
      saveAs(blob, filename)
    } catch (e) {
      console.error(e)
      toast.error(tEx('failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="default"
      className="gap-2 shadow-sm"
      onClick={handleExportExcel}
      disabled={loading}
    >
      {loading ? (
        <Download className="h-4 w-4 animate-bounce" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      {loading ? t('exporting') : tEx('excel')}
    </Button>
  )
}
