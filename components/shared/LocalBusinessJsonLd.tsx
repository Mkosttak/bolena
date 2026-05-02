interface LocalBusinessJsonLdProps {
  locale: string
  siteUrl: string
}

export function LocalBusinessJsonLd({ locale, siteUrl }: LocalBusinessJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CafeOrCoffeeShop',
    name: 'Bolena Glutensiz Cafe',
    alternateName: 'Bolena Gluten-Free Cafe',
    description:
      locale === 'en'
        ? 'Certified gluten-free cafe and kitchen in Ankara Yaşamkent. Safe, delicious meals from breakfast to dinner.'
        : 'Ankara Yaşamkent\'te sertifikalı glutensiz kafe ve mutfak. Kahvaltıdan akşam yemeğine güvenli ve lezzetli öğünler.',
    url: `${siteUrl}/${locale}`,
    logo: `${siteUrl}/images/bolena_logo.png`,
    image: `${siteUrl}/images/menu/hero_v2.png`,
    telephone: '+905449730509',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Yaşamkent, 3058. Sk 3/1',
      addressLocality: 'Çankaya',
      addressRegion: 'Ankara',
      postalCode: '06810',
      addressCountry: 'TR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 39.9423,
      longitude: 32.6827,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '21:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday', 'Sunday'],
        opens: '09:00',
        closes: '21:00',
      },
    ],
    servesCuisine: ['Gluten-Free', 'Cafe'],
    priceRange: '$$',
    hasMap: 'https://maps.google.com/?q=Yaşamkent,+3058.+Sk+3/1,+06810+Çankaya/Ankara',
    sameAs: ['https://www.instagram.com/bolenaglutensizcafe'],
    inLanguage: locale === 'en' ? 'en-US' : 'tr-TR',
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
