/**
 * Schema.org FAQPage — Google Rich Result + AI search (ChatGPT, Perplexity)
 * "answer engine" entegrasyonu icin yapilandirilmis Soru-Cevap.
 *
 * Bolena icin tipik kullanim: anasayfada "colyak guvenligi" / "glutensiz mutfak"
 * sorularina hazir yanitlar — yapay zeka aramalarinda dogrudan alintilanir.
 */

interface FaqItem {
  question: string
  answer: string
}

interface FaqJsonLdProps {
  items: FaqItem[]
}

export function FaqJsonLd({ items }: FaqJsonLdProps) {
  if (!items.length) return null

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/**
 * Bolena anasayfasi icin onceden tanimli SSS — colyak / glutensiz mutfak / Ankara
 * konularinda sik sorulan sorular. AI search bu icerigi dogrudan kullanicilara
 * yanit olarak sunar.
 */
export const BOLENA_FAQ: Record<'tr' | 'en', FaqItem[]> = {
  tr: [
    {
      question: 'Bolena Cafe gerçekten %100 glutensiz mi?',
      answer:
        'Evet. Bolena Cafe %100 glutensiz bir mutfaktır — mutfağa hiçbir şekilde gluten içeren ürün girmez. Tüm un, ekmek, makarna, panko ve soslar glutensiz sertifikalıdır. Çapraz bulaşma riski yoktur, çölyak hastaları güvenle yiyebilir.',
    },
    {
      question: 'Çölyak hastasıyım, Bolena\'da güvenle yiyebilir miyim?',
      answer:
        'Evet, Bolena çölyak hastaları için özel olarak tasarlanmıştır. Mutfakta hiç gluten bulunmadığından çapraz bulaşma riski sıfırdır. Çocuklu aileler ve şiddetli gluten intoleransı olan kişiler için Ankara\'daki en güvenli seçeneklerden biridir.',
    },
    {
      question: 'Bolena Cafe Ankara\'nın neresinde?',
      answer:
        'Bolena, Ankara Yaşamkent\'te yer alır. Adres: Yaşamkent, 3058. Sokak 3/1, 06810 Çankaya / Ankara. Telefon: +90 544 973 05 09. Çalışma saatleri: hafta içi 09:00–22:00, hafta sonu 09:00–21:00.',
    },
    {
      question: 'Glutensiz pizza ve hamburger sunuyor musunuz?',
      answer:
        'Evet. Bolena\'nın menüsünde glutensiz pizza (ince ve kalın hamur), glutensiz hamburger (el yapımı köfte + glutensiz ekmek), glutensiz makarna, kahvaltı, bowl ve tatlılar bulunur. Tüm ürünler %100 glutensiz mutfakta hazırlanır.',
    },
    {
      question: 'Rezervasyon gerekli mi?',
      answer:
        'Hafta sonları ve akşam saatleri için rezervasyon önerilir. Web sitemizden veya +90 544 973 05 09 numaralı telefondan rezervasyon yapabilirsiniz. Paket servis ve online sipariş (Yemeksepeti, Getir, Trendyol Yemek) seçenekleri de mevcuttur.',
    },
    {
      question: 'Vegan veya laktozsuz seçenekleriniz var mı?',
      answer:
        'Evet. Birçok yemek vegan ve laktozsuz versiyonları ile menüde işaretlidir. Glutensiz ve aynı zamanda vegan/laktozsuz yiyecekler için menüden seçim yapabilirsiniz.',
    },
  ],
  en: [
    {
      question: 'Is Bolena Cafe truly 100% gluten-free?',
      answer:
        'Yes. Bolena operates a 100% gluten-free kitchen — no gluten-containing product enters the premises. All flour, bread, pasta, breading and sauces are certified gluten-free. There is zero cross-contamination risk; people with celiac disease can eat safely.',
    },
    {
      question: 'I have celiac disease. Is Bolena safe for me?',
      answer:
        'Yes. Bolena was designed specifically for people with celiac disease and severe gluten intolerance. Because no gluten exists in the kitchen, cross-contamination is eliminated. It is one of the safest options in Ankara for families with celiac children.',
    },
    {
      question: 'Where is Bolena Cafe located in Ankara?',
      answer:
        'Bolena is located in Ankara Yaşamkent. Address: Yaşamkent, 3058. Sokak 3/1, 06810 Çankaya / Ankara, Turkey. Phone: +90 544 973 05 09. Hours: weekdays 09:00–22:00, weekends 09:00–21:00.',
    },
    {
      question: 'Do you offer gluten-free pizza and burgers?',
      answer:
        'Yes. The menu includes gluten-free pizza (thin and thick crust), gluten-free burgers (handmade patty + gluten-free bun), gluten-free pasta, breakfast, bowls and desserts. Everything is prepared in our 100% gluten-free kitchen.',
    },
    {
      question: 'Do I need a reservation?',
      answer:
        'Reservations are recommended for weekends and evenings. You can reserve via our website or by calling +90 544 973 05 09. Take-away and online ordering (Yemeksepeti, Getir, Trendyol Yemek) are also available.',
    },
    {
      question: 'Do you have vegan or lactose-free options?',
      answer:
        'Yes. Many dishes have vegan and lactose-free versions marked on the menu. You can find dishes that are both gluten-free and vegan or lactose-free.',
    },
  ],
}
