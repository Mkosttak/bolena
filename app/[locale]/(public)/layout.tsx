import { WhatsAppFloatingButton } from '@/components/shared/WhatsAppFloatingButton'

interface PublicLayoutProps {
  children: React.ReactNode
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <>
      {children}
      <WhatsAppFloatingButton />
    </>
  )
}
