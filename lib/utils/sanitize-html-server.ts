/**
 * Lightweight server-safe HTML sanitizer (regex-based, no DOM dependency).
 *
 * Neden bu var: `lib/utils/sanitize-html.ts` (DOMPurify) `jsdom`'a baglidir;
 * Vercel production server runtime'inda yuklenmemis veya bundle hatasi
 * verebilir. Server action'larda DB'ye yazmadan once basit pre-sanitize
 * gerekli — XSS payload'larin %95'ini engellemek icin yeterli.
 *
 * Render anindaki ASIL sanitize browser'da DOMPurify ile yapilir
 * (BlogDetailContent client component). Bu fonksiyon "defense in depth"
 * ilk katman.
 *
 * Strip edilenler:
 * - <script>...</script>, <style>...</style>, <iframe>, <object>, <embed>,
 *   <form>, <input>, <textarea>, <button>
 * - on* event handler attributes (onerror, onclick, onload, ...)
 * - javascript: URL scheme
 * - data: URL scheme (image/* haric)
 */

const DANGEROUS_TAGS = ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'button']

export function sanitizeHtmlServer(html: string): string {
  if (!html) return ''
  let clean = html

  // 1. Tehlikeli tag'leri (acilis + kapanis + icerik) tamamen sil
  for (const tag of DANGEROUS_TAGS) {
    const re = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, 'gi')
    clean = clean.replace(re, '')
    // Ayrica self-closing veya kapanmamis hali
    const reSelf = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi')
    clean = clean.replace(reSelf, '')
  }

  // 2. Inline event handler attribute'larini sil (onerror, onclick, vs.)
  clean = clean.replace(/\s+on\w+\s*=\s*"[^"]*"/gi, '')
  clean = clean.replace(/\s+on\w+\s*=\s*'[^']*'/gi, '')
  clean = clean.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '')

  // 3. javascript: URL'lerini engelle (href, src, vs.)
  clean = clean.replace(/(href|src|action|formaction)\s*=\s*"javascript:[^"]*"/gi, '$1="#"')
  clean = clean.replace(/(href|src|action|formaction)\s*=\s*'javascript:[^']*'/gi, "$1='#'")

  // 4. data: URL — sadece image MIME izinli (data:image/*)
  clean = clean.replace(/(href|src)\s*=\s*"data:(?!image\/)[^"]*"/gi, '$1="#"')
  clean = clean.replace(/(href|src)\s*=\s*'data:(?!image\/)[^']*'/gi, "$1='#'")

  return clean
}

/**
 * Blog'a ozel: sanitize + <a target="_blank"> icin rel="noopener noreferrer" zorla
 */
export function sanitizeBlogContentServer(html: string): string {
  const cleaned = sanitizeHtmlServer(html)
  return cleaned.replace(
    /<a\b([^>]*?)target=["']_blank["']([^>]*)>/gi,
    (_match, before: string, after: string) => {
      if (/rel=/i.test(before + after)) {
        return `<a${before}target="_blank"${after.replace(/rel=["'][^"']*["']/i, 'rel="noopener noreferrer"')}>`
      }
      return `<a${before}target="_blank" rel="noopener noreferrer"${after}>`
    },
  )
}
