interface WebSiteJsonLdProps {
  siteUrl: string
}

/**
 * Schema.org WebSite + Organization — her sayfada root layout'tan render edilir.
 * Google Knowledge Panel, AI search entity kartları ve "Bolena ne?" tipi
 * sorguların doğrudan yanıt kaynağı olur.
 */
export function WebSiteJsonLd({ siteUrl }: WebSiteJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}#website`,
        url: siteUrl,
        name: 'Bolena Glutensiz Cafe',
        description:
          "Ankara Yaşamkent'te %100 glutensiz, sertifikalı kafe ve restoran. Çölyak güvenli. Glutensiz pizza, hamburger, makarna, kahvaltı, bowl ve tatlılar.",
        publisher: { '@id': `${siteUrl}#organization` },
        inLanguage: ['tr-TR', 'en-US'],
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${siteUrl}/tr/menu`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': `${siteUrl}#organization`,
        name: 'Bolena Glutensiz Cafe',
        alternateName: ['Bolena Gluten-Free Cafe', 'Bolena Cafe'],
        url: siteUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${siteUrl}/images/bolena_logo.png`,
          width: 512,
          height: 512,
        },
        image: `${siteUrl}/images/menu/hero_v2.png`,
        description:
          "Ankara'nın tek %100 glutensiz mutfağı. Çölyak hastaları ve gluten intoleransı yaşayanlar için Türkiye'nin en güvenli ve en geniş menüye sahip cafesi.",
        sameAs: ['https://www.instagram.com/bolenaglutensizcafe'],
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+905449730509',
          email: 'bilgi@bolena.com.tr',
          contactType: 'customer service',
          areaServed: 'TR',
          availableLanguage: ['Turkish', 'English'],
        },
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Yaşamkent, 3058. Sokak 3/1',
          addressLocality: 'Çankaya',
          addressRegion: 'Ankara',
          postalCode: '06810',
          addressCountry: 'TR',
        },
        knowsAbout: [
          'Gluten-free diet',
          'Celiac disease',
          'Glutensiz beslenme',
          'Çölyak hastalığı',
          'Cross-contamination prevention',
          'Certified gluten-free kitchen',
          'Ankara gluten-free dining',
        ],
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
