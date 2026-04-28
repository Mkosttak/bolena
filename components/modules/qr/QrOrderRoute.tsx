'use client'

import { Providers } from '@/components/shared/Providers'
import { QrIntlProvider } from '@/components/modules/qr/QrIntlProvider'
import { QrOrderScreen } from '@/components/modules/qr/QrOrderScreen'
import type { FullOrder } from '@/lib/queries/orders.queries'
import type { Category, MenuCampaign, Product } from '@/types'

interface QrOrderRouteProps {
  token: string
  sessionToken: string
  tableId: string
  tableName: string
  initialOrderId: string
  qrEnabled: boolean
  initialCategories: Category[]
  initialProducts: Product[]
  initialCampaigns: MenuCampaign[]
  initialFullOrder: FullOrder | null
}

/**
 * Tek istemci sınırı: NextIntl + TanStack + ekran — useTranslations bağlamı
 * sunucu/istemci geçişinde kaybolmasın diye layout yerine burada sarılır.
 */
export function QrOrderRoute(props: QrOrderRouteProps) {
  return (
    <QrIntlProvider>
      <Providers>
        <QrOrderScreen {...props} />
      </Providers>
    </QrIntlProvider>
  )
}
