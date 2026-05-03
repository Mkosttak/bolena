import type { Category, Product } from '@/types'

interface MenuJsonLdProps {
  categories: Category[]
  products: Product[]
  locale: string
  siteUrl: string
}

/**
 * Schema.org Menu + MenuItem — AI arama motorları (ChatGPT, Perplexity, Gemini, Claude)
 * bu veriyi doğrudan ürün listesi olarak okur. "Bolena'da glutensiz pizza var mı?"
 * gibi sorularda doğru yanıt kaynağı olur. GlutenFreeDiet suitableForDiet sinyali
 * Google'ın Dietary Restriction filtresini de besler.
 */
export function MenuJsonLd({ categories, products, locale, siteUrl }: MenuJsonLdProps) {
  const isEn = locale === 'en'

  const menuSections = categories
    .filter((cat) => products.some((p) => p.category_id === cat.id && p.is_visible))
    .map((cat) => {
      const items = products.filter((p) => p.category_id === cat.id && p.is_visible)
      return {
        '@type': 'MenuSection',
        name: isEn ? cat.name_en : cat.name_tr,
        hasMenuItem: items.map((p) => {
          const name = isEn && p.name_en ? p.name_en : p.name_tr
          const description = isEn ? (p.description_en ?? p.description_tr) : p.description_tr
          return {
            '@type': 'MenuItem',
            name,
            description: description || undefined,
            image: p.image_url || undefined,
            offers: {
              '@type': 'Offer',
              price: (p.campaign_price ?? p.price).toFixed(2),
              priceCurrency: 'TRY',
              availability: p.is_available
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            },
            suitableForDiet: ['https://schema.org/GlutenFreeDiet'],
          }
        }),
      }
    })

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    '@id': `${siteUrl}/${locale}/menu#menu`,
    name: isEn ? 'Bolena Gluten-Free Cafe Menu' : 'Bolena Glutensiz Cafe Menüsü',
    description: isEn
      ? 'Complete 100% gluten-free menu. All items certified gluten-free and celiac-safe. Zero cross-contamination.'
      : 'Tam %100 glutensiz menü. Tüm ürünler sertifikalı glutensiz ve çölyak güvenlidir. Çapraz bulaşma sıfırdır.',
    inLanguage: isEn ? 'en-US' : 'tr-TR',
    url: `${siteUrl}/${locale}/menu`,
    hasMenuSection: menuSections,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
