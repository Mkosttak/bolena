import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bolena.com.tr'

/**
 * Robots policy:
 * - Public sayfalar tüm crawler'lara açık (Google, Bing, AI bot'lar dahil)
 * - Admin / login / qr / api yolları gizli
 * - AI bot'ları (GPTBot, ClaudeBot, PerplexityBot, GoogleOther, Google-Extended,
 *   Applebot-Extended, OAI-SearchBot, etc.) admin bölgesinden uzak tut ama
 *   public içeriği indekslemelerine izin ver — ChatGPT/Perplexity/Gemini/Claude
 *   sonuçlarında görünmek için kritik.
 */
// Bu path'ler ARAMADA HIC GORUNMEMELI. Disallow patternleri hem ust seviye
// hem locale-prefixed varyantlari kapsar; sondaki '/' kasitli yok cunku
// '/admin' ve '/admin/dashboard' her ikisi de yakalansin.
const PRIVATE_PATHS = [
  '/admin',
  '/tr/admin',
  '/en/admin',
  '/login',
  '/tr/login',
  '/en/login',
  '/qr',
  '/api',
  // Olasi alt path'ler (3. parti scraper'lara karsi savunma)
  '/dashboard',
  '/tr/dashboard',
  '/en/dashboard',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: PRIVATE_PATHS,
      },
      // AI / LLM crawler'lari — explicit allow + private exclusions
      {
        userAgent: [
          'GPTBot',           // OpenAI / ChatGPT search index
          'OAI-SearchBot',    // OpenAI SearchGPT
          'ChatGPT-User',     // ChatGPT browse mode
          'ClaudeBot',        // Anthropic Claude
          'Claude-Web',       // legacy Claude crawler
          'anthropic-ai',     // Anthropic generic
          'PerplexityBot',    // Perplexity AI
          'Perplexity-User',  // Perplexity browse
          'Google-Extended',  // Bard / Gemini training opt-in signal
          'GoogleOther',      // Google various AI experiences
          'Applebot-Extended',// Apple Intelligence
          'CCBot',            // Common Crawl (LLM training data)
          'Bytespider',       // ByteDance / Doubao
          'Amazonbot',        // Amazon AI
          'YouBot',           // You.com
          'cohere-ai',        // Cohere
          'DuckAssistBot',    // DuckDuckGo
          'Diffbot',          // structured data extraction
        ],
        allow: ['/'],
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
