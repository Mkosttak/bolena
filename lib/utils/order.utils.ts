import type { Product, OrderItem, Payment, DiscountType, MenuCampaign } from '@/types'

/**
 * Ürünün geçerli satış fiyatını döner.
 * Kampanya bitiş tarihi bugün veya sonrası ise campaign_price, aksi takdirde price.
 */
export function calculateEffectivePrice(
  product: Pick<Product, 'price' | 'campaign_price' | 'campaign_end_date'>
): number {
  if (product.campaign_price == null || product.campaign_end_date == null) {
    return product.price
  }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const endDate = new Date(product.campaign_end_date)
  endDate.setHours(0, 0, 0, 0)
  return endDate >= today ? product.campaign_price : product.price
}

/**
 * Sipariş kalemlerinin ara toplamını hesaplar.
 * İkram (is_complimentary) kalemleri toplama dahil edilmez.
 */
export function calculateSubtotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => {
    if (item.is_complimentary) return sum
    return sum + item.total_price
  }, 0)
}

/**
 * İndirimi uygular ve net tutarı döner.
 * type='amount' → sabit tutar indirimi
 * type='percent' → yüzde indirimi (0-100)
 */
export function applyDiscount(
  subtotal: number,
  discountAmount: number,
  discountType: DiscountType | null
): number {
  if (!discountType || discountAmount <= 0) return subtotal
  if (discountType === 'amount') {
    return Math.max(0, subtotal - discountAmount)
  }
  // percent
  const pct = Math.min(100, discountAmount)
  return subtotal * (1 - pct / 100)
}

/**
 * Siparişin ödenmemiş kalan tutarını hesaplar.
 */
export function calculateRemaining(totalAmount: number, payments: Payment[]): number {
  const paid = payments.reduce((sum, p) => sum + p.amount, 0)
  return Math.max(0, totalAmount - paid)
}

/**
 * Toplam ödenen tutarı döner.
 */
export function calculatePaid(payments: Payment[]): number {
  return payments.reduce((sum, p) => sum + p.amount, 0)
}

/**
 * Zorunlu ekstra gruplarda radio-button semantiği uygular.
 * Gruptaki tüm seçenekler sıfırlanır, yalnızca `selectedOptionId` 1 olarak işaretlenir.
 * Seçenek zaten seçiliyse değişiklik yapılmaz (zorunlu grup boş bırakılamaz).
 *
 * @param optionIds   Gruba ait tüm seçenek id'leri
 * @param selectedOptionId  Kullanıcının tıkladığı seçenek id'si
 * @param prev        Mevcut optionQty haritası
 */
/**
 * Şu anki gün ve saate göre kampanya listesinden en yüksek öncelikli aktif kampanyayı döner.
 * Liste zaten priority DESC sıralı geldiğinden ilk eşleşen kazanır.
 * Kampanya yoksa null döner.
 *
 * @param campaigns fetchActiveCampaigns() sonucu (tarih filtresi DB'de yapılmış)
 */
export function resolveActiveCampaign(campaigns: MenuCampaign[]): MenuCampaign | null {
  const now = new Date()
  const dayOfWeek = now.getDay()  // 0=Paz … 6=Cmt
  const currentTime = now.toTimeString().slice(0, 5)  // 'HH:MM'

  for (const campaign of campaigns) {
    if (campaign.is_active === false) continue
    if (!campaign.active_days.includes(dayOfWeek)) continue

    // Saat penceresi kontrolü
    if (campaign.start_time && campaign.end_time) {
      if (currentTime < campaign.start_time || currentTime > campaign.end_time) continue
    } else if (campaign.start_time) {
      if (currentTime < campaign.start_time) continue
    } else if (campaign.end_time) {
      if (currentTime > campaign.end_time) continue
    }

    return campaign
  }

  return null
}

/**
 * Global menü kampanya indirimini bir ürüne uygular.
 * price_basis='effective' → calculateEffectivePrice() üzerinden (ürün kampanyasını da dikkate alır)
 * price_basis='base'      → product.price üzerinden (orijinal fiyat)
 * max_discount_amount varsa indirim bu değerle sınırlandırılır.
 *
 * Kampanyanın applies_to_category_ids veya applies_to_product_ids alanları doluysa
 * hedefleme kontrolü ÇAĞIRAN tarafında yapılmalıdır (calculateFinalPrice içinde).
 */
export function applyGlobalCampaignDiscount(
  product: Pick<Product, 'price' | 'campaign_price' | 'campaign_end_date'>,
  campaign: MenuCampaign
): number {
  const basePrice =
    campaign.price_basis === 'base'
      ? product.price
      : calculateEffectivePrice(product)

  const rawDiscount = basePrice * (campaign.discount_percent / 100)
  const actualDiscount =
    campaign.max_discount_amount != null
      ? Math.min(rawDiscount, campaign.max_discount_amount)
      : rawDiscount

  return Math.max(0, basePrice - actualDiscount)
}

/**
 * Zaman/gün filtresini geçen kampanyalar arasından bu ürüne uygulananları döner.
 * Her kampanya kendi kapsamına (ürün/kategori/genel) göre filtrelenir.
 * Liste zaten priority DESC sıralı geldiğinden ilk eleman en yüksek önceliklidir.
 */
function filterCampaignsForProduct(
  product: Pick<Product, 'id' | 'category_id'>,
  timeCampaigns: MenuCampaign[]
): MenuCampaign[] {
  return timeCampaigns.filter((c) => {
    const { applies_to_product_ids: prodIds, applies_to_category_ids: catIds } = c
    if (prodIds && prodIds.length > 0) return prodIds.includes(product.id)
    if (catIds && catIds.length > 0) return catIds.includes(product.category_id)
    return true // genel kampanya — herkese uygulanır
  })
}

/**
 * Ürünün nihai birim fiyatını hesaplar.
 *
 * Mantık:
 * 1. Zaman/gün koşulunu sağlayan kampanyaları bul (resolveActiveCampaign yerine liste)
 * 2. Bu ürüne uygulananları filtrele (ürün > kategori > genel kapsam)
 * 3. En yüksek priority'li kampanyayı uygula
 *
 * Örnek: Pizza kampanyası (priority 5, ürün bazlı) + Çölyak kampanyası (priority 10, genel)
 * → Pizza için: her ikisi de geçerli, priority 10 kazanır → %10 çölyak indirimi
 * → Diğer ürünler: sadece genel kampanya → %10
 *
 * Eğer pizza kampanyasının priority'si daha yüksek olsaydı:
 * → Pizza için: pizza kampanyası kazanır → %15
 * → Diğer ürünler: sadece genel kampanya → %10
 *
 * @param product   Fiyatı hesaplanacak ürün
 * @param campaigns fetchActiveCampaigns() sonucu (priority DESC sıralı)
 */
export function calculateFinalPrice(
  product: Pick<Product, 'id' | 'category_id' | 'price' | 'campaign_price' | 'campaign_end_date'>,
  campaigns: MenuCampaign[]
): number {
  if (campaigns.length === 0) return calculateEffectivePrice(product)

  // 1. Zaman/gün filtresini geç (resolveActiveCampaign'in mantığı, ama tek yerine liste)
  const now = new Date()
  const dayOfWeek = now.getDay()
  const currentTime = now.toTimeString().slice(0, 5)

  const timeCampaigns = campaigns.filter((c) => {
    if (c.is_active === false) return false
    if (!c.active_days.includes(dayOfWeek)) return false
    if (c.start_time && c.end_time) {
      return currentTime >= c.start_time && currentTime <= c.end_time
    }
    if (c.start_time) return currentTime >= c.start_time
    if (c.end_time) return currentTime <= c.end_time
    return true
  })

  if (timeCampaigns.length === 0) return calculateEffectivePrice(product)

  // 2. Bu ürüne uygulananları filtrele
  const applicable = filterCampaignsForProduct(product, timeCampaigns)
  if (applicable.length === 0) return calculateEffectivePrice(product)

  // 3. En yüksek priority'li kampanyayı uygula (liste zaten priority DESC sıralı)
  const top = applicable[0]
  if (!top) return calculateEffectivePrice(product)
  return applyGlobalCampaignDiscount(product, top)
}

export function applyRadioOptionSelection(
  optionIds: string[],
  selectedOptionId: string,
  prev: Record<string, number>
): Record<string, number> {
  if ((prev[selectedOptionId] ?? 0) > 0) return prev
  const next = { ...prev }
  for (const id of optionIds) next[id] = 0
  next[selectedOptionId] = 1
  return next
}
