import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bolena Cafe — Sipariş',
  description: 'Bolena Cafe masa siparişi',
}

export default function QrLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
