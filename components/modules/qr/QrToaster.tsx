'use client'

import { Toaster } from 'sonner'
import { CircleCheck, OctagonX, Info, TriangleAlert, Loader2 } from 'lucide-react'

/**
 * QR menü için özel Toaster.
 *
 * Neden ayrı?
 * - Public/admin Toaster, `app/[locale]/layout.tsx` içinde mount.
 * - QR rotaları (`app/qr/[token]/...`) [locale] segmentinin DIŞINDA.
 *   Bu yüzden QR'da sonner toast'ları gösterilemiyordu (Toaster yok).
 *
 * Renkler — krem (#efe4cf) zemin üzerinde okunaklı, marka palette'i:
 * - success: koyu yeşil zemin + krem yazı
 * - error:   koyu kırmızı zemin + krem yazı
 * - info:    altın zemin + koyu yeşil yazı
 * - warning: altın-amber zemin + koyu kahve yazı
 *
 * Pozisyon: `top-center` — QR'da alt kısım her zaman bottom-nav ile dolu;
 * önemli mesajlar üstten gelmeli ki kullanıcı kaçırmasın.
 */
export function QrToaster() {
  return (
    <Toaster
      position="top-center"
      closeButton
      duration={4000}
      offset={16}
      visibleToasts={3}
      icons={{
        success: <CircleCheck className="size-4" />,
        error: <OctagonX className="size-4" />,
        info: <Info className="size-4" />,
        warning: <TriangleAlert className="size-4" />,
        loading: <Loader2 className="size-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          // Ortak — krem üzerinde belirgin gölge + büyük tap target
          toast:
            'flex items-start gap-3 rounded-2xl px-4 py-3.5 text-[14px] font-semibold shadow-[0_18px_50px_-20px_rgba(15,34,24,0.45)] backdrop-blur-md ring-1',
          title: 'text-[14px] font-bold leading-snug',
          description: 'text-[12.5px] font-medium opacity-90 leading-snug mt-0.5',
          actionButton: 'rounded-lg px-3 py-1.5 text-[12px] font-bold',
          cancelButton: 'rounded-lg px-3 py-1.5 text-[12px] font-bold',
          closeButton:
            '!bg-transparent !border-0 !text-current/60 hover:!text-current',
          // Variant renkleri — marka paleti
          success:
            '!bg-[#1B3C2A] !text-[#FAF8F2] !ring-[#0F2218]/30',
          error:
            '!bg-[#7A1F1F] !text-[#FFF5F0] !ring-[#5C1414]/40',
          info:
            '!bg-[#E8C684] !text-[#1B3C2A] !ring-[#C4841A]/40',
          warning:
            '!bg-[#F5D38A] !text-[#5A3A0F] !ring-[#C4841A]/40',
        },
      }}
    />
  )
}
