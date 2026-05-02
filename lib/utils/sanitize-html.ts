import DOMPurify from 'isomorphic-dompurify'

const ALLOWED_TAGS = [
  'p', 'br', 'hr',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'em', 'u', 'b', 'i', 's', 'mark',
  'ul', 'ol', 'li',
  'blockquote', 'code', 'pre',
  'a', 'img',
  'span', 'div',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
]

const ALLOWED_ATTR = [
  'href', 'src', 'alt', 'title', 'target', 'rel',
  'class', 'style',
  'colspan', 'rowspan',
  'data-align',
]

export function sanitizeHtml(html: string): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ADD_ATTR: ['target', 'rel'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange'],
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: true,
    RETURN_TRUSTED_TYPE: false,
  }) as unknown as string
}

/**
 * Blog post içeriği için: dış link'lere noopener+noreferrer zorunlu.
 */
export function sanitizeBlogContent(html: string): string {
  const cleaned = sanitizeHtml(html)
  // Tüm <a target="_blank"> için rel="noopener noreferrer" enforce et.
  return cleaned.replace(
    /<a\b([^>]*?)target=["']_blank["']([^>]*)>/gi,
    (_match, before: string, after: string) => {
      const attrs = `${before}${after}`
      if (/rel=/i.test(attrs)) {
        return `<a${before}target="_blank"${after.replace(/rel=["'][^"']*["']/i, 'rel="noopener noreferrer"')}>`
      }
      return `<a${before}target="_blank" rel="noopener noreferrer"${after}>`
    },
  )
}
