// ============================================================
// Bolena Cafe — App-Level Type Tanımları
// Değiştirme — CLAUDE.md'deki K-xx kararlarına bak
// ============================================================

// --- Kullanıcı & Yetki ---
export type UserRole = 'admin' | 'employee'

export const MODULES = [
  'users',
  'menu',
  'tables',
  'reservations',
  'platform-orders',
  'working-hours',
  'reports',
  'dashboard',
  'kds',
  'site-settings',
  'blog',
] as const

export type ModuleName = (typeof MODULES)[number]

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
  last_sign_in_at?: string | null
}

export interface ModulePermission {
  id: string
  user_id: string
  module_name: ModuleName
  can_access: boolean
}

// --- Sipariş ---
export type OrderType = 'table' | 'reservation' | 'takeaway' | 'platform'
export type PlatformType = 'yemeksepeti' | 'getir' | 'trendyol' | 'courier'
export type OrderStatus = 'active' | 'completed' | 'cancelled' | 'no_show'
export type PaymentMethod = 'cash' | 'card' | 'platform'
export type PaymentStatus = 'pending' | 'partial' | 'paid'
export type DiscountType = 'amount' | 'percent'

export interface Order {
  id: string
  type: OrderType
  status: OrderStatus
  table_id: string | null
  customer_name: string | null
  customer_phone: string | null
  customer_address: string | null
  platform: PlatformType | null
  notes: string | null
  subtotal: number
  discount_amount: number
  discount_type: DiscountType | null
  total_amount: number
  payment_status: PaymentStatus
  created_at: string
  updated_at: string
  completed_at: string | null
}

export interface RemovedIngredient {
  id: string
  name_tr: string
  name_en: string
}

export interface SelectedExtra {
  group_id: string
  group_name_tr: string
  option_id: string
  option_name_tr: string
  option_name_en: string
  price: number
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name_tr: string
  product_name_en: string
  unit_price: number
  quantity: number
  notes: string | null
  removed_ingredients: RemovedIngredient[]
  selected_extras: SelectedExtra[]
  total_price: number
  is_complimentary: boolean
  kds_status: 'pending' | 'ready'
  created_at: string
}

export interface Payment {
  id: string
  order_id: string
  amount: number
  method: PaymentMethod
  note: string | null
  created_at: string
}

// --- Rezervasyon ---
export type ReservationType = 'reservation' | 'takeaway'
export type ReservationStatus =
  | 'pending'
  | 'seated'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export interface Reservation {
  id: string
  type: ReservationType
  customer_name: string
  customer_phone: string
  reservation_date: string | null
  reservation_time: string | null
  party_size: number | null
  notes: string | null
  status: ReservationStatus
  order_id: string | null
  table_id: string | null
  created_at: string
  updated_at: string
}

// --- Menü ---
export interface Category {
  id: string
  name_tr: string
  name_en: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductIngredient {
  id: string
  product_id: string
  name_tr: string
  name_en: string
  is_removable: boolean
  sort_order: number
}

export interface Product {
  id: string
  category_id: string
  name_tr: string
  name_en: string
  description_tr: string | null
  description_en: string | null
  image_url: string | null
  price: number
  campaign_price: number | null
  campaign_end_date: string | null
  allergens_tr: string | null
  allergens_en: string | null
  is_available: boolean
  is_featured: boolean
  is_visible: boolean
  track_stock: boolean
  stock_count: number | null
  sort_order: number
  created_at: string
  updated_at: string
  // Relations
  categories?: Category
  product_ingredients?: ProductIngredient[]
  extra_groups?: (ExtraGroup & { extra_options?: ExtraOption[] })[]
}

// --- Ekstralar ---
export interface ExtraGroup {
  id: string
  product_id: string
  name_tr: string
  name_en: string
  is_required: boolean
  max_bir_secim: boolean
  created_at: string
  updated_at: string
  extra_options?: ExtraOption[]
}

export interface ExtraOption {
  id: string
  group_id: string
  name_tr: string
  name_en: string
  price: number
  max_selections: number
  is_active: boolean
  sort_order: number
}

// --- Masa ---
export interface TableCategory {
  id: string
  name: string
  sort_order: number
}

export interface TableActiveOrder {
  id: string
  table_id: string
  status: OrderStatus
  subtotal: number
  total_amount: number
  payment_status: PaymentStatus
  items_count: number
  paid_amount: number
  is_qr_order: boolean
  created_at: string
}

export interface Table {
  id: string
  name: string
  category_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Relations
  table_categories?: TableCategory
  // Computed (fetchTablesWithOrder tarafından doldurulur)
  activeOrder?: TableActiveOrder | null
}

// --- Çalışma Saatleri ---
export interface WorkingHours {
  id: string
  day_of_week: number // 0=Pazar, 6=Cumartesi
  is_open: boolean
  open_time: string | null
  close_time: string | null
  note_tr: string | null
  note_en: string | null
  updated_at: string
}

export interface WorkingHoursException {
  id: string
  date: string
  is_open: boolean
  open_time: string | null
  close_time: string | null
  description_tr: string | null
  description_en: string | null
  created_at: string
}

// --- Menü Kampanya Takvimi ---
export type PriceBasis = 'base' | 'effective'

export interface MenuCampaign {
  id: string
  name_tr: string
  name_en: string
  description_tr: string | null
  description_en: string | null
  /** 'base': orijinal fiyat üzerinden | 'effective': mevcut kampanya fiyatı üzerinden */
  price_basis: PriceBasis
  discount_percent: number
  max_discount_amount: number | null  // ₺ tavan, null = tavan yok
  start_date: string                  // 'YYYY-MM-DD'
  end_date: string
  active_days: number[]               // 0=Paz … 6=Cmt
  start_time: string | null           // 'HH:MM' | null = günün başı
  end_time: string | null             // 'HH:MM' | null = günün sonu
  is_active: boolean
  priority: number                    // yüksek = önce uygulanır
  notes: string | null
  /** null = tüm menü | dolu = yalnızca bu kategoriler */
  applies_to_category_ids: string[] | null
  /** null = tüm ürünler | dolu = yalnızca bu ürünler (kategori filtresi yoksa) */
  applies_to_product_ids: string[] | null
  created_at: string
  updated_at: string
}

// --- Sipariş Sepeti (UI State) ---
export interface CartItem {
  product: Product
  quantity: number
  notes: string
  removed_ingredients: RemovedIngredient[]
  selected_extras: SelectedExtra[]
}

// --- QR Masa Siparişi ---
export interface TableWithQr extends Table {
  qr_token: string
  qr_enabled: boolean
}

export interface SiteSetting {
  id: string
  key: string
  value: Record<string, unknown>
  updated_at: string
}

export interface QrCartItem {
  localId: string
  product: Product
  quantity: number
  notes: string
  removed_ingredients: RemovedIngredient[]
  selected_extras: SelectedExtra[]
}

// --- Blog ---
export interface BlogPost {
  id: string
  slug: string
  title_tr: string
  title_en: string | null
  content_tr: string
  content_en: string | null
  excerpt_tr: string | null
  excerpt_en: string | null
  cover_image_url: string | null
  author_name: string
  published_at: string | null
  is_published: boolean
  reading_time_minutes: number | null
  tags: string[]
  meta_title: string | null
  meta_description: string | null
  focus_keywords: string[]
  created_at: string
  updated_at: string
}
