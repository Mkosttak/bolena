# Bolena Cafe — Proje Durumu

**Son güncelleme:** 2026-04-12 (Ana Sayfa Komple Yeniden Tasarım v2)

## Güncel özet (2026-04-12) — Ana Sayfa v3: Online Sipariş + Google Yorumlar + Gelişmiş İçerik

- **Açık/kapalı durumu kaldırıldı:** Hero bölümündeki status pill tamamen kaldırıldı.
- **Online sipariş bölümü eklendi:** Yemeksepeti, Getir, Trendyol Yemek ve Telefonla Sipariş kartları `#F5EFE0` zemin üzerinde platform renklerine uygun kartlarla tasarlandı; `orderEyebrow/Title/Subtitle/CallLabel/CallCta/CallNumber/platform*` i18n anahtarları eklendi.
- **Google Yorumlar bölümü eklendi:** Koyu yeşil (`#1A3524`) zemin üzerinde Google G logo, 4.8★ genel puan göstergesi, 3 yorum kartı (yıldız, italik metin, avatar, Google G) ve "Tüm Yorumları Gör" CTA'sı; `reviewsCta/reviewsRating/reviewsCount/reviewsSource` anahtarları eklendi.
- **Tüm metinler yeniden yazıldı:** Hero başlığı ve alt metni, özellik kartları, menü bölümü ve kapanış CTA'sı daha güçlü ve açık kopya ile yenilendi; TR + EN mesaj dosyaları güncellendi.
- **Hero görsel düzeni:** Status pill kaldırıldı; gradient katmanı iyileştirildi.
- **Menü kartları:** `placeholder-2.png` + `placeholder-1.png` kullanıldı (hero.png'dan farklı görsel çeşitliliği için).
- **Testler:** `npm run lint -- "components/modules/home/HomeLanding.tsx"` ✅

## Güncel özet (2026-04-12) — Ana Sayfa Komple Yeniden Tasarım v2

- **Tamamen farklı estetik:** `components/modules/home/HomeLanding.tsx` sıfırdan yeniden yazıldı; önceki iki sütunlu koyu hero + kart grubu yapısından tam ekran parallax hero + akıp giden ticker şeridine geçildi.
- **Full-viewport hero:** 100svh yüksekliğinde, parallax scroll efektli arka plan görseli; büyük bold serif başlık ekranın alt-sol alanında konumlandırıldı; açık/kapalı durum pill'i ve iki CTA aynı bölgede.
- **Scrolling ticker:** Marka değerlerini kaydıran yatay şerit (`hl-ticker-track` animasyonu) eklendi; `home.tickerItem1–5` i18n anahtarları tr.json ve en.json'a eklendi.
- **Yatay özellik şeridi:** Önceki üç kart kutusunun yerine yatay çizgilerle bölünmüş, ikonlu minimal özellik listesi oluşturuldu.
- **Tam boyutlu menü kartları:** Menü bölümünde overlay metin içeren tam-kaplama görsel kartlar kullanıldı; metin artık kartın altında değil üstünde yer alıyor.
- **Arkaplan:** `#FDFCF8` (sıcak beyaz) ana arka plan; warm stone `#EDE5D0` menü bölümü arka planı; koyu hero `#1A3524`.
- **Testler:** `npm run lint -- "components/modules/home/HomeLanding.tsx" "app/[locale]/(public)/page.tsx"` ✅

## Güncel özet (2026-04-12) — Ana Sayfa Sadeleştirme Turu

- **Yoğunluk azaltma:** `components/modules/home/HomeLanding.tsx` içindeki kalabalık hissi veren ara bloklar kaldırıldı; homepage akışı hero, tek güven bölümü, daha sade menü vitrini ve kompakt kapanış CTA'sına indirildi.
- **Section temizliği:** Yorumlar bölümü, ek story/signature panelleri, fazla status yüzeyleri ve üçüncü menü kartı kaldırılarak daha nefes alan bir düzen kuruldu.
- **Hero sadeleşmesi:** Hero içindeki bilgi kartları kompakt bir inline meta satırına dönüştürüldü; görsel alt panel de tek cümlelik daha sakin bir katmana çekildi.
- **Testler:** `npm run lint -- "app/[locale]/(public)/page.tsx" "components/modules/home/HomeLanding.tsx"` ✅

## Güncel özet (2026-04-12) — Ana Sayfa Modern Redesign

- **Tam yeniden kurgu:** `app/[locale]/(public)/page.tsx` artık eski çok parçalı home section zinciri yerine yeni `components/modules/home/HomeLanding.tsx` bileşenini kullanıyor; ana sayfa akışı modern cafe estetiğiyle baştan tasarlandı.
- **Yeni bilgi mimarisi:** Hero, güven kartları, signature standard bloğu, öne çıkan lezzetler, atmosfer + yorumlar ve kapanış CTA'sı olacak şekilde daha net ve daha az tekrarlı bir akış kuruldu.
- **Animasyon dili:** Framer Motion ile giriş geçişleri, scroll bağlı hero görsel hareketi, hover scale ve `Reveal` tabanlı section ritmi tek bir dilde toplandı.
- **i18n güncellemesi:** `i18n/messages/tr.json` ve `i18n/messages/en.json` altındaki `home` namespace'i yeni section içeriklerine göre yeniden yazıldı; görsel alt metinleri ve değerlendirme etiketleri de taşındı.
- **Navbar düzeltmesi:** Ana sayfada `PublicNavbar` artık `blogLabel` prop'unu da çeviriden alıyor.
- **Testler:** `npm run lint -- "app/[locale]/(public)/page.tsx" "components/modules/home/HomeLanding.tsx"` ✅

## Güncel özet (2026-04-12) — WhatsApp Widget Açılış Akışı

- **İlk açılış:** Public sayfa ilk yüklendiğinde balon doğrudan ürün mesajıyla başlamıyor; önce kısa bir `Hoş geldiniz.` mesajı gösteriliyor.
- **Geçiş ritmi:** Karşılama balonu kapandıktan sonra kısa bir bekleme eklenip ardından sayfaya özel ürün mesajları başlıyor; böylece yazılar peş peşe akmıyor.
- **Animasyon yavaşlatma:** Balon içi metin animasyonu ve bubble giriş/çıkış süreleri yavaşlatıldı; kelimeler daha sakin bir ritimle beliriyor.
- **Zamanlama:** Sayfa mesajlarının görünür kalma süresi uzun tutuldu ve mesajlar arasında daha geniş boşluk bırakıldı.
- **Testler:** `npm run lint -- "components/shared/WhatsAppFloatingButton.tsx"` ✅

## Güncel özet (2026-04-12) — Public 404 Sayfası

- **Yeni 404 deneyimi:** `components/shared/NotFoundPage.tsx` eklendi; Bolena renk paletine uyan, komik "glutene bulaşmış sayfa" temalı özel bir 404 ekranı tasarlandı.
- **Route entegrasyonu:** `app/[locale]/not-found.tsx` ve `app/not-found.tsx` eklendi; locale içi kayıp rotalarda özel sayfa gösteriliyor, kök fallback de Türkçe güvenli yönlendirme sunuyor.
- **Sadeleştirme / referans uyarlaması:** İlk tasarım geri çekildi; son turda yapı kullanıcı referansına yaklaştırıldı. Geometrik mint arka plan, merkezde rozet içi logo + yasak işareti, büyük yeşil başlık, kısa açıklama, vurgu satırı ve iki CTA ile daha afiş hissi veren bir 404 elde edildi.
- **i18n:** `i18n/messages/tr.json` ve `i18n/messages/en.json` içine `notFound` namespace'i eklendi; tüm yeni metinler mesaj dosyalarına taşındı.
- **Testler:** `npm run lint -- "app/not-found.tsx" "app/[locale]/not-found.tsx" "components/shared/NotFoundPage.tsx"` ✅

## Güncel özet (2026-04-12) — WhatsApp Widget İnce Ayar

- **Blog muafiyeti:** `components/shared/WhatsAppFloatingButton.tsx` içinde blog rotaları tamamen hariç tutuldu; blog liste ve yazı detay sayfalarında artık widget görünmüyor.
- **Yeni mikro metinler:** Ana sayfa, menü ve iletişim rotalarındaki balon içerikleri daha rafine ve yönlendirici cümlelerle yeniden yazıldı.
- **Zamanlama:** Balonun ekranda kalma süresi artık mesaj uzunluğuna göre dinamik hesaplanıyor; daha uzun cümleler daha uzun süre görünür kalıyor.
- **Animasyon:** Balon açıldığında metin kelime kelime, hafif blur/y ekseni geçişiyle görünür hale geliyor.
- **Testler:** `npm run lint -- "components/shared/WhatsAppFloatingButton.tsx"` ✅

## Güncel özet (2026-04-12) — Contact Sayfası Tekrar Temizliği

- **Tekrar temizliği:** `app/[locale]/(public)/contact/page.tsx` içindeki yinelenen hızlı iletişim paneli ve ikinci CTA kartı kaldırıldı; telefon, Instagram, adres, durum ve saat bilgileri tekil akışta bırakıldı.
- **Daha sade hiyerarşi:** Hero tek kolon akışa indirildi; durum ve bugünkü saat özeti hero içinde kompakt bilgi kartlarına dönüştürüldü.
- **Ek sadeleştirme:** Hero içindeki durum ve bugünkü saat özet kartları da kaldırılarak üst bölüm yalnız başlık, metin ve ana CTA'lara indirildi.
- **Hero temizlik:** Hero içindeki çağrı butonları ve öznitelik pill'leri de kaldırılarak üst alan yalnız başlık, kısa açıklama ve konum etiketiyle bırakıldı.
- **İçerik sadeleşmesi:** Sayfada aynı bilgiyi birden fazla kez gösteren bloklar kaldırılarak iletişim kartları + harita + çalışma saatleri yapısı korundu.
- **Testler:** `npm run lint -- "app/[locale]/(public)/contact/page.tsx"` ✅

## Güncel özet (2026-04-12) — Public WhatsApp CTA

- **Global public CTA:** `app/[locale]/(public)/layout.tsx` eklendi; public sayfaların sağ altına ortak WhatsApp kısayolu yerleştirildi. Admin ve QR alanları etkilenmedi.
- **Yeni bileşen:** `components/shared/WhatsAppFloatingButton.tsx` ile Bolena konseptine uygun yüzen WhatsApp butonu, per-route konuşma balonları ve sayfaya göre değişen hazır WhatsApp mesajları eklendi.
- **Sabitler / i18n:** `lib/constants/social.ts` içine WhatsApp sabitleri eklendi; `i18n/messages/tr.json` ve `i18n/messages/en.json` altında `whatsappWidget` namespace'i oluşturuldu.
- **UX:** Ana sayfa, menü, iletişim ve blog rotalarında farklı bağlamsal balon metinleri gösteriliyor; balonlar aralıklı şekilde belirip kayboluyor.
- **Testler:** `npm run lint -- "components/shared/WhatsAppFloatingButton.tsx" "app/[locale]/(public)/layout.tsx" "lib/constants/social.ts"` ✅ | `npm run typecheck` mevcut ilgisiz admin action tip hatalarına takıldı (`app/[locale]/admin/orders/actions.ts`, `app/[locale]/admin/reservations/actions.ts`)

## Güncel özet (2026-04-12) — Contact Sayfası Modern Redesign

- **Tam yeniden tasarım:** `app/[locale]/(public)/contact/page.tsx` editorial/luxury yönde yeniden kurgulandı; mobil öncelikli hero, yüzen iletişim kartları, premium hızlı erişim paneli ve daha güçlü CTA hiyerarşisi eklendi.
- **Bilgi mimarisi:** Harita, çalışma saatleri ve hızlı iletişim alanları daha net ayrıştırıldı; mobilde tek kolon akış korunurken geniş ekranlarda iki seviyeli asimetrik layout'a geçildi.
- **UX detayları:** Açık/kapalı durumu ve bugünkü servis saati hero içinde daha görünür hale getirildi; telefon, Instagram ve konum aksiyonları hem üst panelde hem kart şeridinde erişilebilir hale getirildi.
- **Testler:** `npm run lint -- "app/[locale]/(public)/contact/page.tsx"` ✅

## Güncel özet (2026-04-12) — Public Menü Hero / Nav Yenileme

- **Hero tasarımı:** `components/modules/menu/MenuHero.tsx` üst alanı editorial/luxury bir dil ile yenilendi; katmanlı gradient, grid texture, glow orb, yeni tipografi ritmi ve badge paneli eklendi.
- **Kategori navigasyonu:** `components/modules/menu/MenuDisplay.tsx` içindeki kategori şeridi yüzen pill-container tasarımına çevrildi; hero ile görsel olarak birleşen, ortalanmış ve sticky çalışan daha güçlü bir üst navigasyon elde edildi.
- **Görsel hiyerarşi:** Menü içerik kökü hero alt geçişine hafif overlap ile bağlandı; ardından ikinci turda category başlık numaraları kaldırıldı ve hero → kategori barı geçişi daha yumuşak gradient/blur köprüsüyle rafine edildi.
- **Testler:** `npx tsc --noEmit` ✅ | dosya lint kontrolleri ✅

## Güncel özet (2026-04-11) — Contact Sayfası UI Yenileme

- **UI yenileme:** `app/[locale]/(public)/contact/page.tsx` baştan tasarlandı; mobil öncelikli hero, hızlı iletişim kartları, iyileştirilmiş harita bloğu ve daha okunaklı çalışma saatleri bölümü eklendi.
- **Temizlik:** Sayfadaki locale'e bağlı hardcoded CTA metinleri kaldırıldı; tüm yeni etiketler `contact` i18n namespace'ine taşındı.
- **i18n:** `i18n/messages/tr.json` ve `i18n/messages/en.json` altında `locationTag`, `statusLabel`, `quickContactTitle`, `hoursHint`, `mapHeading`, `venueName`, `today` anahtarları eklendi.
- **Erişilebilirlik/UX:** Mobilde tek kolon, tablette/kapsamlı ekranlarda kademeli grid; harita başlığı + aksiyon butonu üst barla netleştirildi.
- **Testler:** `npm run lint -- "app/[locale]/(public)/contact/page.tsx"` ✅

## Güncel özet (2026-04-11) — Blog Modülü

- **Veritabanı:** `supabase/migrations/015_blog.sql` — `blog_posts` tablosu + RLS (anon: yayınlanmış okuma, authenticated: tam erişim).
- **Tipler:** `types/database.types.ts` blog_posts eklendi; `types/index.ts` — `BlogPost` interface + MODULES'a `'blog'`.
- **Lib:** `lib/validations/blog.schema.ts`, `lib/queries/blog.queries.ts`.
- **Admin:** `app/[locale]/admin/blog/` (page, loading, new, [id]/edit, actions.ts).
- **Admin bileşenler:** `components/modules/blog/` — `TiptapEditor` (WYSIWYG + Supabase inline image upload), `BlogForm` (TR/EN tab + kapak resmi + SEO), `BlogClient` (TanStack Query tablo).
- **Public:** `app/[locale]/(public)/blog/page.tsx` + `[slug]/page.tsx` — SSR + `generateMetadata` + OG + Twitter Card + JSON-LD Article.
- **Public bileşenler:** `BlogListSection`, `BlogCard`, `BlogDetailContent`, `BlogJsonLd`.
- **Navigasyon:** `PublicNavbar` Blog linki; `SidebarContent` admin Blog linki (BookOpen ikonu).
- **i18n:** `blog.*` + `nav.blog` namespace'leri tr.json + en.json'a eklendi.
- **Testler:** `__tests__/unit/validations/blog.schema.test.ts` 15/15 ✅ | `__tests__/components/blog/BlogCard.test.tsx` 14/14 ✅ — toplam 29 test.
- **Paketler:** `@tiptap/react` + 8 extension (`starter-kit`, `extension-image`, `extension-link`, `extension-placeholder`, `extension-text-align`, `extension-underline`, `extension-color`, `extension-text-style`) kuruldu.

## Önceki özet

- **KDS detay sheet iyileştirmesi (2026-04-11):** `components/modules/kds/KdsDetailSheet.tsx` içinde ürün tıklayınca açılan panel genişletildi; varsayılan üst köşe kapatma butonu kaldırılıp ayrı üst bara taşınarak header aksiyonlarıyla çakışma giderildi. Gömülü sipariş ekranlarında aksiyon yerleşimi sheet genişliğine uyarlandı; `KdsItemRow` ve `OrderItemList` not alanları etiketli ve daha okunur kartlara dönüştürüldü.
- **QR Menu UI yenileme (2026-04-11):** `components/modules/qr/` altında `QrOrderScreen`, `QrMenuTab`, `QrProductCard`, `QrCategoryPills`, `QrBottomNav`, `QrCartTab`, `QrLocaleToggle` yeniden tasarlandı.
- **Kullanisabilirlik:** Arama, daha belirgin sticky hero, ozet kartlari, liste tabanli daha okunakli urun kartlari ve yenilenmis cart ozeti eklendi.
- **i18n:** `i18n/messages/tr.json`, `i18n/messages/en.json` QR arama ve yeni UI etiketleriyle guncellendi.
- **QR ince ayar (2026-04-11):** Sticky banner arka plan davranisi sadeletildi; kategori pill'lerine yatay kaydirma oklari eklendi; `Tumu` gorunumunde urunler kategori bloklariyla siralandi.
- **Sheet + cart iyilestirmeleri:** Urun sheet'inde ana fiyat/kampanyali fiyat ayrimi, `Alerjenler:` etiketi, `Sepete ekle` ve `Hizli al (Mutfaga ilet)` CTA'lari; direct order cift toast sorunu giderildi. Cart tarafinda loading gostergesi, sadece iletilmeyen sepet odagi ve toplam sepet tutari ozetine gecildi.
- **QR ikinci ince ayar (2026-04-11):** Kategori ok ikonalari kaldirildi; `Tumu` secenegi yerine kategori pill'leri scroll-sync anchor yapisina cevrildi. Product sheet fiyat alani sadeletildi, `Hizli al` kisa CTA'ya indirildi ve close animasyonu korundu. Cart loading durumu skeleton kartlarla iyilestirildi.
- **Testler:** `npm run lint -- components/modules/qr/...` ✅ | `npm run typecheck` repo icindeki mevcut ilgisiz action type hatalarina takildi (`app/[locale]/admin/orders/actions.ts`, `app/[locale]/admin/reservations/actions.ts`).

- **QR masa siparişi:** `app/qr/[token]/`, `components/modules/qr/`, anon RLS + SECURITY DEFINER RPC'ler (`013`, `014` migration).
- **Site ayarları / QR yönetimi:** `app/[locale]/admin/site-settings/`, `components/modules/site-settings/`.
- **Lib:** `lib/stores/qr-session.store.ts`, `lib/queries/qr.queries.ts`, `lib/queries/site-settings.queries.ts`, `lib/validations/qr.schema.ts`.
- **Diğer:** `proxy.ts` — `/qr/` bypass; `types/index.ts` — `TableWithQr`, `SiteSetting`, `QrCartItem`, `module_permissions` içinde `site-settings`.
- **Testler:** `qr-session.store.test.ts`; E2E `e2e/qr-ordering.spec.ts`.

> Eski oturum günlükleri bilerek burada tutulmuyor; ayrıntı için `git log` / PR geçmişi.

## Açık sorunlar

- **Atomik olmayan işlemler (bilinen risk):** Bazı action'larda `addOrderItem` + `decrement_stock` sırası tam atomik değil. Kalıcı çözüm: migration `010` RPC'lerinin DB'de aktif olması ve action katmanının bu RPC'lere geçmesi.

## Modül durumu (özet)

| Modül | Durum | Not |
|------|--------|-----|
| Auth, kullanıcılar, menü, ekstralar | Tamam | Unit testler mevcut |
| Masalar, sipariş, rezervasyon, platform | Tamam | Ortak `orders` + order UI |
| Çalışma saatleri, public site | Tamam | |
| Dashboard, raporlar, KDS | Tamam | |
| QR + site ayarları | Tamam | Anon akış + admin yönetimi |
| Blog | Tamam | Tiptap WYSIWYG, SEO, çift dilli |

**Komutlar:** `npm run test`, `npm run typecheck`, `npm run ci:verify`

## Güncelleme şablonu

```markdown
## YYYY-MM-DD — Kısa başlık
- Ne değişti (dosya / migration)
**Testler:** …
**Not:** …
```

Modülü tamamlanmış saymak için test ve (gerekiyorsa) ilgili E2E şart.
