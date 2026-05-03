interface LocalBusinessJsonLdProps {
  locale: string
  siteUrl: string
}

/**
 * Schema.org Restaurant + CafeOrCoffeeShop — Bolena icin local SEO sinyali.
 *
 * Google Maps, Knowledge Panel, "near me" sorgular ve AI search'te dogrudan
 * yanit kaynagi olur. Yapay zeka aramalarinda "Ankara'da glutensiz cafe"
 * sorgusunda Bolena'nin adres / telefon / saat / sertifikasyon bilgisi
 * dogrudan alintilanir.
 */
export function LocalBusinessJsonLd({ locale, siteUrl }: LocalBusinessJsonLdProps) {
  const isEn = locale === 'en'

  // Restaurant + CafeOrCoffeeShop birlestirilmis @type — Google ikisini de tanir,
  // daha zengin Knowledge Panel saglar.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': ['Restaurant', 'CafeOrCoffeeShop'],
    '@id': `${siteUrl}#organization`,
    name: 'Bolena Glutensiz Cafe',
    alternateName: ['Bolena Gluten-Free Cafe', 'Bolena Cafe', 'Bolena Glutensiz'],
    legalName: 'Bolena Glutensiz Cafe',
    description: isEn
      ? 'Certified 100% gluten-free cafe and restaurant in Ankara Yaşamkent. Safe for celiac disease — gluten-free pizza, burger, pasta, breakfast, bowls and desserts. No gluten enters the kitchen — zero cross-contamination risk.'
      : 'Ankara Yaşamkent\'te %100 glutensiz, sertifikalı kafe ve restoran. Çölyak güvenli — glutensiz pizza, hamburger, makarna, kahvaltı, bowl ve tatlılar. Mutfağa gluten girmez, çapraz bulaşma riski sıfırdır.',
    url: `${siteUrl}/${locale}`,
    logo: `${siteUrl}/images/bolena_logo.png`,
    image: [
      `${siteUrl}/images/menu/hero_v2.png`,
      `${siteUrl}/images/menu/hero.png`,
      `${siteUrl}/images/menu/breakfast.png`,
      `${siteUrl}/images/menu/dessert.png`,
      `${siteUrl}/images/menu/healthy.png`,
    ],
    telephone: '+905449730509',
    email: 'bilgi@bolena.com.tr',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Yaşamkent, 3058. Sokak 3/1',
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
        opens: '09:00',
        closes: '22:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday', 'Sunday'],
        opens: '09:00',
        closes: '21:00',
      },
    ],
    servesCuisine: [
      'Gluten-Free',
      'Cafe',
      'Italian',
      'Turkish',
      'Mediterranean',
      'Breakfast',
      'Pizza',
      'Burger',
      'Pasta',
      'Desserts',
    ],
    cuisineType: 'Gluten-Free',
    menu: `${siteUrl}/${locale}/menu`,
    acceptsReservations: 'True',
    priceRange: '$$',
    paymentAccepted: ['Cash', 'Credit Card', 'Debit Card'],
    currenciesAccepted: 'TRY',
    hasMap: 'https://maps.google.com/?q=Ya%C5%9Famkent,+3058.+Sk+3/1,+06810+%C3%87ankaya/Ankara',
    sameAs: [
      'https://www.instagram.com/bolenaglutensizcafe',
    ],
    inLanguage: isEn ? 'en-US' : 'tr-TR',
    areaServed: [
      { '@type': 'City', name: 'Ankara' },
      { '@type': 'AdministrativeArea', name: 'Çankaya' },
      { '@type': 'AdministrativeArea', name: 'Yaşamkent' },
    ],
    knowsAbout: [
      'Gluten-free diet',
      'Celiac disease',
      'Cross-contamination prevention',
      'Gluten-free pizza',
      'Gluten-free burger',
      'Gluten-free pasta',
      'Certified gluten-free kitchen',
    ],
    slogan: isEn
      ? 'Gluten-free, limit-free table.'
      : 'Glutensiz değil, sınırsız bir sofra.',
    // Yapay zeka aramalari ve voice search icin "potential action"
    potentialAction: [
      {
        '@type': 'ReserveAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${siteUrl}/${locale}/contact`,
          inLanguage: isEn ? 'en-US' : 'tr-TR',
          actionPlatform: [
            'http://schema.org/DesktopWebPlatform',
            'http://schema.org/MobileWebPlatform',
          ],
        },
        result: {
          '@type': 'FoodEstablishmentReservation',
          name: isEn ? 'Reservation at Bolena' : 'Bolena Rezervasyon',
        },
      },
      {
        '@type': 'OrderAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${siteUrl}/${locale}/menu`,
          inLanguage: isEn ? 'en-US' : 'tr-TR',
        },
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
