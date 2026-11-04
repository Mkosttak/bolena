import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ContactClient } from '@/components/modules/contact/ContactClient'
import { INSTAGRAM_URL } from '@/lib/constants/social'

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
  useLocale: () => 'tr',
}))

vi.mock('@/components/shared/PublicNavbar', () => ({
  PublicNavbar: () => null,
}))

const fetchWeeklyHours = vi.fn()
const fetchWorkingHoursExceptions = vi.fn()

vi.mock('@/lib/queries/working-hours.queries', () => ({
  workingHoursKeys: {
    weekly: () => ['working-hours', 'weekly'],
    exceptions: () => ['working-hours', 'exceptions'],
  },
  fetchWeeklyHours: () => fetchWeeklyHours(),
  fetchWorkingHoursExceptions: () => fetchWorkingHoursExceptions(),
}))

function renderContact() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ContactClient locale="tr" />
    </QueryClientProvider>,
  )
}

describe('ContactClient — geçici ara modu', () => {
  it('çalışma saatleri yerine ara açıklamasını gösterir', () => {
    renderContact()

    expect(screen.getByText('closure.hoursNoticeTitle')).toBeInTheDocument()
    expect(screen.getByText('closure.hoursNoticeBody')).toBeInTheDocument()
    // Gün satırları (Pazartesi vb.) listelenmez.
    expect(screen.queryByText('contact.days.1')).not.toBeInTheDocument()
  })

  it('saat sorgularını çalıştırmaz', () => {
    renderContact()

    expect(fetchWeeklyHours).not.toHaveBeenCalled()
    expect(fetchWorkingHoursExceptions).not.toHaveBeenCalled()
  })

  it('"kapımız açık" alt başlığı yerine ara alt başlığını gösterir', () => {
    renderContact()

    expect(screen.getByText('closure.contactHeroSubtitle')).toBeInTheDocument()
    expect(screen.queryByText('contact.heroSubtitle')).not.toBeInTheDocument()
  })

  it('Instagram bağlantısı güvenli açılır', () => {
    renderContact()

    const link = screen.getByRole('link', { name: 'closure.popupFollow' })
    expect(link).toHaveAttribute('href', INSTAGRAM_URL)
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })
})
