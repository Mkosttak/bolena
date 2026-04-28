'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster } from '@/components/ui/sonner'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Global default: 60sn stale — sık değişmeyen veriler için yeterli.
            // Gerçek zamanlı veriler (sipariş, ödeme) kendi staleTime=0 ile override eder.
            staleTime: 60_000,
            // Cache 5 dk tutulsun — sayfa geçişlerinde veriler hazır gelir
            gcTime: 5 * 60_000,
            retry: 1,
            // Sekme odağa gelince otomatik refetch — pek çok admin ekranı için gereksiz
            refetchOnWindowFocus: false,
            // Network geri gelince refetch — bağlantı kesilme senaryosu için kalsın
            refetchOnReconnect: true,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  )

  return (
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster richColors position="bottom-center" closeButton />
      </QueryClientProvider>
  )
}

