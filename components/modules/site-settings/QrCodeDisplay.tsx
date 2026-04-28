'use client'

import { useRef } from 'react'
import QRCode from 'react-qr-code'
import { Download, Printer } from 'lucide-react'

interface QrCodeDisplayProps {
  url: string
  size?: number
}

export function QrCodeDisplay({ url, size = 160 }: QrCodeDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const handleDownload = () => {
    const svg = containerRef.current?.querySelector('svg')
    if (!svg) return

    const serializer = new XMLSerializer()
    const svgStr = serializer.serializeToString(svg)
    const blob = new Blob([svgStr], { type: 'image/svg+xml' })
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = 'qr-code.svg'
    a.click()
    URL.revokeObjectURL(blobUrl)
  }

  const handlePrint = () => {
    const svg = containerRef.current?.querySelector('svg')
    if (!svg) return

    const serializer = new XMLSerializer()
    const svgStr = serializer.serializeToString(svg)
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head><title>QR Kod</title></head>
        <body style="display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
          ${svgStr}
          <script>window.onload=()=>{window.print();window.close();}<\/script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={containerRef} className="bg-white p-3 rounded-xl border border-gray-200">
        <QRCode value={url} size={size} />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-[#1B3C2A] border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
          title="SVG olarak indir"
        >
          <Download className="w-3.5 h-3.5" />
          İndir
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-[#1B3C2A] border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
          title="Yazdır"
        >
          <Printer className="w-3.5 h-3.5" />
          Yazdır
        </button>
      </div>
    </div>
  )
}
