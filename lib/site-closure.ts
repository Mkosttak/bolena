/**
 * Geçici ara (kapanış) modu.
 *
 * `true` iken:
 *  - Ana sayfada bilgilendirme pop-up'ı açılır (`TemporaryClosureDialog`)
 *  - Public menü sayfası ürün listesi yerine bilgilendirme gösterir (`MenuClosureNotice`)
 *
 * Yeniden açılışta tek yapılacak: bu değeri `false` yapıp deploy etmek.
 * Metinler: `i18n/messages/{tr,en}.json` → `closure` bölümü.
 */
export const TEMPORARY_CLOSURE_ENABLED = true

/** Pop-up bir oturumda (sekme açık kaldığı sürece) yalnızca bir kez gösterilir. */
export const CLOSURE_POPUP_STORAGE_KEY = 'bolena:closure-popup-dismissed' as const
