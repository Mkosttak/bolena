interface QrInvalidTokenProps {
  reason: 'global_disabled' | 'table_disabled' | 'not_found'
  tableName?: string
}

export function QrInvalidToken({ reason, tableName }: QrInvalidTokenProps) {
  const content = {
    global_disabled: {
      emoji: '🕐',
      title: 'QR Sipariş Geçici Olarak Kapalı',
      desc: 'Şu an QR ile sipariş alınmıyor. Lütfen garsonunuzu çağırın.',
    },
    table_disabled: {
      emoji: '🚫',
      title: 'QR Sipariş Devre Dışı',
      desc: `${tableName ? `"${tableName}" için` : 'Bu masa için'} QR ile sipariş şu an devre dışı. Lütfen garsonunuzu çağırın.`,
    },
    not_found: {
      emoji: '❓',
      title: 'Geçersiz QR Kodu',
      desc: 'Bu QR kodu artık geçerli değil veya devre dışı bırakılmış. Lütfen masa üzerindeki güncel QR kodu kullanın.',
    },
  }[reason]

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF8F2] px-6 text-center">
      <div className="text-6xl mb-6">{content.emoji}</div>
      <h1 className="text-2xl font-bold text-[#1B3C2A] mb-3">{content.title}</h1>
      <p className="text-gray-600 max-w-xs">{content.desc}</p>
    </div>
  )
}
