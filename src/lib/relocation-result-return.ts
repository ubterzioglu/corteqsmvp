// Araç sonucuna geri dönüş izi (revizyon 0838da0b).
//
// Sorun: sonuç sayfasındaki CTA kullanıcıyı /cadde, /directory, /profile gibi bir
// hedefe götürüyor ve orada test sonucuna dönmenin HİÇBİR yolu kalmıyordu. Sonuç
// adresi zaten kalıcı (`/tools/:slug/result/:resultId`, RelocationToolPage
// replaceState ile yazıyor) — eksik olan yalnız hedef sayfadaki dönüş bağlantısıydı.
//
// NEDEN SORGU PARAMETRESİ DEĞİL: `?donus=/tools/...` ilk hedefte çalışırdı ama
// kullanıcı orada bir adım daha derine gidince (ör. /cadde → /cadde/carsi/:id)
// parametre düşer ve dönüş kaybolur — asıl şikâyet tam olarak budur. Ayrıca her
// CTA adresini kirletirdi. İz, gezinmeden bağımsız olarak sekme boyunca yaşar.
//
// NEDEN sessionStorage (localStorage değil): iz sekmeye ait geçici bir kolaylıktır.
// localStorage'da kalsaydı kullanıcı yarın siteyi açtığında dünkü testin şeridiyle
// karşılaşırdı. Sekme kapanınca kendiliğinden ölmesi doğru davranıştır.

const STORAGE_KEY = "corteqs.toolResultReturn";

/** İzin ömrü. Sekme açık kalsa da bir saat sonra şerit gürültüye dönüşür. */
export const RESULT_RETURN_TTL_MS = 60 * 60 * 1000;

export interface ToolResultReturn {
  /** Uygulama içi sonuç yolu, ör. `/tools/city_match/result/abc-123`. */
  href: string;
  /**
   * Şeritte gösterilecek araç adı, ör. "Şehir Eşleştirme". İSTEĞE BAĞLI ve bugün
   * çağıranlar vermiyor: araç adı DB'de (`relocation_tools`) yaşıyor, ne
   * `ToolResultView` ne de sonuç sayfası onu elinde tutuyor. Adları koda kopyalamak
   * bu deponun tekrar tekrar yandığı drift sınıfını açardı; üç dosya boyunca prop
   * taşımak da kazandırdığından fazlasına mal olurdu. Verilmezse şerit "Test sonucuna
   * dön" der — doğru ve yeterli.
   */
  toolLabel?: string;
}

/**
 * Yalnız uygulama içi yol kabul edilir. `ResultCtaPanel.toInternalHref` ile aynı
 * kural: "https://…" ve protokolsüz "//host" bir `<Link to>` içinde sessizce bozuk
 * bir GÖRECELİ yola dönüşür; şerit kullanıcıyı asla site dışına atmamalı.
 */
function isInternalPath(href: unknown): href is string {
  return typeof href === "string" && href.startsWith("/") && !href.startsWith("//");
}

/** Depolama erişimi gizli sekmede/çerezler kapalıyken ATAR — hiçbir çağrı fırlatmaz. */
function safeRead(): string | null {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** CTA'ya tıklanınca çağrılır: kullanıcı ayrılmadan önce sonucun yerini bırak. */
export function rememberToolResult(entry: ToolResultReturn): void {
  if (!isInternalPath(entry.href)) {
    // Geçersiz adresi yazmak yerine ESKİ izi de temizle: yarım/yanlış bir şerit,
    // hiç şerit olmamasından kötüdür.
    forgetToolResult();
    return;
  }
  try {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ href: entry.href, toolLabel: entry.toolLabel, at: Date.now() }),
    );
  } catch {
    /* iz bir kolaylıktır; yazılamaması akışı bozmamalı */
  }
}

/** Kullanıcı şeridi kapatınca ya da sonuca döndüğünde çağrılır. */
export function forgetToolResult(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* yoksay */
  }
}

/**
 * Geçerli bir iz varsa döner; yoksa `null`.
 *
 * `currentPathname` sonucun kendisiyse `null` döner — kullanıcı zaten oradayken
 * "sonuca dön" demek anlamsızdır.
 */
export function readToolResultReturn(currentPathname: string): ToolResultReturn | null {
  const raw = safeRead();
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") return null;
  const { href, toolLabel, at } = parsed as Record<string, unknown>;

  if (!isInternalPath(href)) return null;
  if (typeof at !== "number" || Date.now() - at > RESULT_RETURN_TTL_MS) return null;
  if (href === currentPathname) return null;

  return { href, toolLabel: typeof toolLabel === "string" ? toolLabel : "" };
}
