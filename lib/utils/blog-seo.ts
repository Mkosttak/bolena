/**
 * Blog SEO yardımcıları — manuel meta input gerektirmeden Google'da
 * doğru görünmek için profesyonel default'lar üretir.
 *
 * Strateji:
 * - meta_title: 50-60 karakter (Google ekran kırpma limiti). Marka eki sona.
 * - meta_description: 150-160 karakter, cümle bütünlüğünü koruyarak truncate.
 *   Kaynak öncelik: excerpt → content'in ilk paragrafı → title.
 * - keywords: tags + içerikten extract edilen tekrarlanan anlamlı kelimeler.
 *
 * Bu helper'lar HEM `generateMetadata` HEM `BlogJsonLd` tarafından kullanılır,
 * yani admin form bu alanları doldurmasa bile public taraf tutarlı SEO çıktısı
 * verir. Kullanıcı manuel override etmek isterse (`meta_title`/`meta_description`
 * dolu) onlara öncelik verilir.
 */

export const SEO_TITLE_MAX = 60
export const SEO_DESCRIPTION_MAX = 158 // Google ~155-160 karakter görüntüler

const BRAND = 'Bolena Cafe'
const BRAND_SUFFIX_TR = ' | Bolena Glutensiz Cafe'
const BRAND_SUFFIX_EN = ' | Bolena Gluten-Free Cafe'

/** HTML tag'lerini söker, whitespace'i normalize eder. */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/** Verilen metni cümle bütünlüğünü koruyarak `max` karaktere kısar. */
export function smartTruncate(text: string, max: number): string {
  const trimmed = text.trim()
  if (trimmed.length <= max) return trimmed

  const cut = trimmed.slice(0, max)
  // Cümle sonu (. ! ?) varsa orada bitir
  const sentenceEnd = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '))
  if (sentenceEnd > max * 0.6) return cut.slice(0, sentenceEnd + 1).trim()

  // Yoksa son boşluğa kadar al + ellipsis
  const lastSpace = cut.lastIndexOf(' ')
  if (lastSpace > max * 0.5) return cut.slice(0, lastSpace).trim() + '…'

  // Boşluk yoksa karakter limitinden sonra ellipsis
  return cut.trim() + '…'
}

/**
 * SEO başlığı üretir. Manuel override varsa onu (sınırı aşmayacak şekilde) döndürür,
 * yoksa post başlığına marka eki ekler.
 */
export function buildSeoTitle(args: {
  manualMetaTitle?: string | null
  postTitle: string
  locale: string
}): string {
  const { manualMetaTitle, postTitle, locale } = args
  if (manualMetaTitle && manualMetaTitle.trim()) {
    return smartTruncate(manualMetaTitle.trim(), SEO_TITLE_MAX)
  }
  const suffix = locale === 'en' ? BRAND_SUFFIX_EN : BRAND_SUFFIX_TR
  // Başlık + marka eki birlikte 60'ı aşıyorsa, başlığı kısalt
  if (postTitle.length + suffix.length <= SEO_TITLE_MAX) {
    return `${postTitle}${suffix}`
  }
  // Başlık tek başına bile uzunsa, kısalt + minimal marka eki
  const titleBudget = SEO_TITLE_MAX - suffix.length
  if (titleBudget > 20) {
    return `${smartTruncate(postTitle, titleBudget)}${suffix}`
  }
  // Başlık çok uzunsa marka eki yok, sadece başlık
  return smartTruncate(postTitle, SEO_TITLE_MAX)
}

/**
 * SEO açıklaması üretir. Öncelik: manualMetaDescription → excerpt → content (HTML strip).
 * 158 karakterde cümle bütünlüğünü koruyarak truncate.
 */
export function buildSeoDescription(args: {
  manualMetaDescription?: string | null
  excerpt?: string | null
  contentHtml?: string | null
  postTitle: string
}): string {
  const { manualMetaDescription, excerpt, contentHtml, postTitle } = args

  if (manualMetaDescription && manualMetaDescription.trim()) {
    return smartTruncate(manualMetaDescription.trim(), SEO_DESCRIPTION_MAX)
  }

  if (excerpt && excerpt.trim()) {
    return smartTruncate(excerpt.trim(), SEO_DESCRIPTION_MAX)
  }

  if (contentHtml) {
    const plain = stripHtml(contentHtml)
    if (plain.length > 30) {
      return smartTruncate(plain, SEO_DESCRIPTION_MAX)
    }
  }

  // Son çare: başlık
  return smartTruncate(postTitle, SEO_DESCRIPTION_MAX)
}

/**
 * Anahtar kelime listesi üretir. Manuel `focusKeywords` doluysa onu döndürür,
 * yoksa `tags` array'ini kullanır (tags zaten kullanıcı tarafından girilmiş
 * konu etiketleridir — keyword'lerin doğal kaynağı bu).
 *
 * NOT: Google `<meta name="keywords">` etiketini görmezden gelir, ama JSON-LD'deki
 * `keywords` ve OpenGraph konuşmaları için hala anlamlı. Manuel ayrı bir liste
 * yönetmeye gerek yok.
 */
export function buildKeywords(args: {
  manualKeywords?: string[] | null
  tags?: string[] | null
}): string[] {
  const { manualKeywords, tags } = args
  if (manualKeywords && manualKeywords.length > 0) return manualKeywords
  return tags ?? []
}

/**
 * İçerikteki kelime sayısı — JSON-LD `wordCount` için.
 */
export function countWords(html: string | null | undefined): number {
  if (!html) return 0
  const plain = stripHtml(html)
  if (!plain) return 0
  return plain.split(/\s+/).filter(Boolean).length
}
