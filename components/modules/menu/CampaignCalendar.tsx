import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Route } from 'next'

import { campaignKeys, fetchCampaigns } from '@/lib/queries/menu-campaign.queries'
import { toggleCampaignActive, deleteCampaign } from '@/app/[locale]/admin/menu/campaign-actions'
import type { MenuCampaign } from '@/types'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'

const DAY_LABELS: Record<number, string> = {
  0: 'Paz',
  1: 'Pzt',
  2: 'Sal',
  3: 'Çar',
  4: 'Per',
  5: 'Cum',
  6: 'Cmt',
}

function formatDays(days: number[]): string {
  if (days.length === 7) return 'Her gün'
  if (days.length === 0) return '—'
  return days.map((d) => DAY_LABELS[d]).join(', ')
}

function formatTime(start: string | null, end: string | null): string {
  if (!start && !end) return 'Tüm gün'
  if (start && !end) return `${start}→`
  if (!start && end) return `→${end}`
  return `${start}–${end}`
}

interface CampaignCalendarProps {
  locale: string
}

export function CampaignCalendar({ locale }: CampaignCalendarProps) {
  const t = useTranslations('menu')
  const tCommon = useTranslations('common')
  const queryClient = useQueryClient()
  const router = useRouter()

  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: campaigns, isLoading } = useQuery({
    queryKey: campaignKeys.list(),
    queryFn: fetchCampaigns,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleCampaignActive(id, isActive),
    onSuccess: (result, variables) => {
      if (result.error) { toast.error(result.error); return }
      queryClient.setQueryData<MenuCampaign[]>(campaignKeys.list(), (old) =>
        old?.map((c) => c.id === variables.id ? { ...c, is_active: variables.isActive } : c)
      )
      queryClient.invalidateQueries({ queryKey: campaignKeys.active() })
    },
    onError: () => toast.error(tCommon('error')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      setDeletingId(id)
      return deleteCampaign(id)
    },
    onSuccess: (result, id) => {
      setDeletingId(null)
      if (result.error) { toast.error(result.error); return }
      toast.success(tCommon('success'))
      queryClient.setQueryData<MenuCampaign[]>(campaignKeys.list(), (old) =>
        old?.filter((c) => c.id !== id)
      )
      queryClient.invalidateQueries({ queryKey: campaignKeys.active() })
    },
    onError: () => { setDeletingId(null); toast.error(tCommon('error')) },
  })

  const handleAdd = () => {
    router.push(`/${locale}/admin/menu/campaigns/new` as Route)
  }

  const handleEdit = (campaign: MenuCampaign) => {
    router.push(`/${locale}/admin/menu/campaigns/${campaign.id}/edit` as Route)
  }

  const handleDelete = (id: string) => {
    if (!window.confirm(t('campaign.deleteConfirm'))) return
    deleteMutation.mutate(id)
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {campaigns?.length
            ? `${campaigns.length} kampanya tanımlı`
            : t('campaign.noCampaigns')}
        </p>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-1.5" />
          {t('campaign.addCampaign')}
        </Button>
      </div>

      {!campaigns?.length ? (
        <div className="border rounded-lg py-12 flex flex-col items-center gap-3 text-muted-foreground">
          <p className="text-sm">{t('campaign.noCampaigns')}</p>
          <Button size="sm" variant="outline" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1.5" />
            {t('campaign.addCampaign')}
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Ad</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">{t('campaign.discountLabel')}</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">{t('campaign.dateRange')}</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden lg:table-cell">{t('campaign.activeDays')}</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden lg:table-cell">{t('campaign.timeRange')}</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">{t('campaign.priority')}</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">{t('campaign.isActive')}</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {campaigns.map((campaign) => (
                <tr
                  key={campaign.id}
                  className={`hover:bg-muted/30 transition-colors ${!campaign.is_active ? 'opacity-60' : ''}`}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{campaign.name_tr}</div>
                    <div className="text-xs text-muted-foreground">{campaign.name_en}</div>
                    {/* Kapsam bilgisi */}
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {campaign.applies_to_category_ids?.length
                        ? `${campaign.applies_to_category_ids.length} kategori`
                        : campaign.applies_to_product_ids?.length
                          ? `${campaign.applies_to_product_ids.length} ürün`
                          : 'Tüm menü'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-primary">%{campaign.discount_percent}</span>
                    {campaign.max_discount_amount && (
                      <div className="text-xs text-muted-foreground">maks ₺{campaign.max_discount_amount}</div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {campaign.price_basis === 'base' ? 'Ana fiyat' : 'Mevcut fiyat'}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="text-xs">
                      {campaign.start_date} →<br />{campaign.end_date}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="text-xs">{formatDays(campaign.active_days)}</div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="text-xs">{formatTime(campaign.start_time, campaign.end_time)}</div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge variant="outline" className="text-xs">{campaign.priority}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Switch
                      checked={campaign.is_active}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({ id: campaign.id, isActive: checked })
                      }
                      disabled={toggleMutation.isPending}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleEdit(campaign)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(campaign.id)}
                        disabled={deletingId === campaign.id}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
