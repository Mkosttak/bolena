import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { TemporaryClosureDialog } from '@/components/modules/home/TemporaryClosureDialog'
import { CLOSURE_POPUP_STORAGE_KEY } from '@/lib/site-closure'
import { INSTAGRAM_URL } from '@/lib/constants/social'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}))

describe('TemporaryClosureDialog', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.sessionStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('sayfa yüklenince gecikmeyle açılır', () => {
    render(<TemporaryClosureDialog />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(700)
    })

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('popupTitle')).toBeInTheDocument()
    expect(screen.getByText('popupBody')).toBeInTheDocument()
  })

  it('Instagram bağlantısı doğru adrese gider ve güvenli açılır', () => {
    render(<TemporaryClosureDialog />)
    act(() => {
      vi.advanceTimersByTime(700)
    })

    const link = screen.getByRole('link', { name: 'instagramCta' })
    expect(link).toHaveAttribute('href', INSTAGRAM_URL)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('"Anladım" ile kapanır ve oturum için hatırlanır', () => {
    render(<TemporaryClosureDialog />)
    act(() => {
      vi.advanceTimersByTime(700)
    })

    fireEvent.click(screen.getByRole('button', { name: 'dismiss' }))

    expect(window.sessionStorage.getItem(CLOSURE_POPUP_STORAGE_KEY)).toBe('1')
  })

  it('aynı oturumda daha önce kapatıldıysa tekrar açılmaz', () => {
    window.sessionStorage.setItem(CLOSURE_POPUP_STORAGE_KEY, '1')

    render(<TemporaryClosureDialog />)
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
