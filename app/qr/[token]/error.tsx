'use client'

import { useEffect } from 'react'

export default function QrError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Production'da console.log yasak; error boundary hatayı zaten yakalar
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF8F2] px-6 text-center">
      <div className="text-6xl mb-6">⚠️</div>
      <h1 className="text-2xl font-bold text-[#1B3C2A] mb-3">
        Bir Hata Oluştu
      </h1>
      <p className="text-gray-600 mb-8">
        Sayfayı yüklerken bir sorun oluştu. Lütfen tekrar deneyin.
      </p>
      <button
        onClick={reset}
        className="bg-[#1B3C2A] text-white px-6 py-3 rounded-xl font-medium"
      >
        Tekrar Dene
      </button>
    </div>
  )
}
