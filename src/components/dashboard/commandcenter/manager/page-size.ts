// Komuta Merkezi — sayfa boyutu tercihi (yalnız o tarayıcıda saklanır).
// Depolama kapalıysa (gizli sekme, engellenmiş site verisi) okuma/yazma sessizce
// varsayılana düşer — pano yine çalışır, tercih sadece o oturumda geçerli olur.

/** Kayıt listesi varsayılan olarak en küçük boyutla açılır; büyük sayfalar isteğe bağlı. */
export const PAGE_SIZE_OPTIONS = [10, 50, 100] as const
export const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0]
const PAGE_SIZE_STORAGE_KEY = 'command-center:page-size'

export function isSupportedPageSize(value: number): boolean {
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(value)
}

export function readStoredPageSize(): number {
  if (typeof window === 'undefined') {
    return DEFAULT_PAGE_SIZE
  }

  try {
    const stored = Number(window.localStorage.getItem(PAGE_SIZE_STORAGE_KEY))
    return isSupportedPageSize(stored) ? stored : DEFAULT_PAGE_SIZE
  } catch {
    return DEFAULT_PAGE_SIZE
  }
}

export function storePageSize(value: number): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(value))
  } catch {
    // Depolama kapalıysa tercih sadece bu oturumda geçerli olur.
  }
}
