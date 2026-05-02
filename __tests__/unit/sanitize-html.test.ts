import { describe, it, expect } from 'vitest'
import { sanitizeHtml, sanitizeBlogContent } from '@/lib/utils/sanitize-html'

describe('sanitizeHtml', () => {
  it('Boş string güvenle döner', () => {
    expect(sanitizeHtml('')).toBe('')
  })

  it('Normal HTML korunur', () => {
    const out = sanitizeHtml('<p>Merhaba <strong>dünya</strong></p>')
    expect(out).toContain('<p>')
    expect(out).toContain('<strong>')
  })

  it('<script> tag\'leri temizlenir', () => {
    const out = sanitizeHtml('<p>OK</p><script>alert(1)</script>')
    expect(out).not.toContain('<script>')
    expect(out).toContain('<p>OK</p>')
  })

  it('inline event handler\'ları temizlenir (onerror, onclick)', () => {
    const out = sanitizeHtml('<img src="x" onerror="alert(1)" />')
    expect(out).not.toMatch(/onerror/i)
  })

  it('<iframe> ve <object> yasaktır', () => {
    const out = sanitizeHtml('<iframe src="evil.com"></iframe><object></object>')
    expect(out).not.toContain('<iframe>')
    expect(out).not.toContain('<object>')
  })

  it('<a> ve href korunur', () => {
    const out = sanitizeHtml('<a href="https://example.com">link</a>')
    expect(out).toContain('href="https://example.com"')
  })
})

describe('sanitizeBlogContent', () => {
  it('target="_blank" linklere rel="noopener noreferrer" ekler', () => {
    const out = sanitizeBlogContent('<a href="https://x.com" target="_blank">x</a>')
    expect(out).toMatch(/rel=["']noopener noreferrer["']/)
  })

  it('Mevcut zararlı rel\'i değiştirir', () => {
    const out = sanitizeBlogContent('<a href="https://x.com" target="_blank" rel="opener">x</a>')
    expect(out).toMatch(/rel=["']noopener noreferrer["']/)
  })

  it('Script enjeksiyonu zincirleme temizlenir', () => {
    const out = sanitizeBlogContent('<p>OK</p><script>alert(1)</script><a href="javascript:alert(1)">x</a>')
    expect(out).not.toContain('<script>')
    expect(out).not.toMatch(/javascript:/i)
  })
})
