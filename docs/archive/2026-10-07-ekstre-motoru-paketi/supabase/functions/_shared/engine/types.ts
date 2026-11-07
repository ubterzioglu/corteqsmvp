// CorteQS Ekstre Motoru — ortak tipler
// Bu dosya saf TypeScript'tir: hem Deno (edge function) hem Node (test) ile çalışır.

export type Currency = "TRY" | "USD" | "EUR" | "GBP" | "QAR";

/** Admin'deki `expenses` tablosunun enum değerleri (mevcut şema ile birebir). */
export type Person = "burak" | "baris" | "ortak";

export type Category =
  | "yazilim_araclar"
  | "hosting_sunucu"
  | "alan_adi_ssl"
  | "pazarlama_reklam"
  | "hukuki_danismanlik"
  | "muhasebe_finans"
  | "seyahat_ulasim"
  | "ofis_kirtasiye"
  | "maas_ucret"
  | "esop_hisse"
  | "banka_komisyon"
  | "diger";

export type PaymentMethod =
  | "sanal_kart_burak"
  | "sanal_kart_baris"
  | "kisisel_kart_burak"
  | "kisisel_kart_baris"
  | "havale_eft"
  | "nakit"
  | "diger";

export type Source = "pdf_statement" | "sheet_csv" | "mercury" | "manual";

/** Bankadan / Gemini'den / Mercury'den gelen ham satır (henüz yorumlanmamış). */
export interface RawLine {
  date: string;                 // YYYY-MM-DD (işlem tarihi)
  description: string;          // ekstredeki ham açıklama, örn. "ANTHROPIC* CLAUDE SUB  SAN FRANCISCO US"
  amount_original: number;      // orijinal para biriminde tutar (iade/alacak ise negatif)
  currency_original: Currency;  // orijinal para birimi
  amount_try?: number | null;   // ekstrede TL karşılığı yazıyorsa
  card_last4?: string | null;   // kart son 4 hane
  card_label?: string | null;   // "QNB Sanal", "Maximiles USD" vb.
  external_id?: string | null;  // Mercury transaction id vb.
  line_type?: "purchase" | "refund" | "fee" | "payment" | "interest" | "other";
  note?: string | null;
  partner_share_usd?: number | null; // gider ortağının katkısı ($) — CorteQS giderinden düşülür
  partner_name?: string | null;      // gider ortağı (örn. "Baran")
  person_hint?: Person | null;       // kaynakta sahip belirtildiyse
  invoice_url?: string | null;
  is_tech_guess?: boolean | null;    // yapay zekânın "teknoloji gideri mi" tahmini (kural yoksa kullanılır)
}

/** Tüccar/servis kuralı (merchant_rules tablosu). */
export interface MerchantRule {
  id?: string;
  pattern: string;          // case-insensitive regex, normalize edilmiş açıklamaya uygulanır
  merchant: string;         // kanonik ad: "Anthropic Claude"
  category: Category;
  person?: Person | null;   // null => kart sahibinden/varsayılandan gelir
  is_tech: boolean;         // teknoloji gideri mi? (false => varsayılan olarak aktarılmaz)
  share_pct?: number | null;// ortaklık payı (0-100), örn. Claude ortak alımda 50
  priority?: number;        // küçük sayı önce
  auto_commit?: boolean;    // Mercury'de incelemesiz otomatik aktarılabilir mi
}

/** Kart tanımı (payment_cards tablosu). */
export interface PaymentCard {
  last4: string;
  label: string;            // "QNB Sanal (…6108)"
  bank: string;             // "QNB Finansbank" | "İş Bankası" | "Mercury"
  payment_method: PaymentMethod;
  owner: Person;
  is_virtual: boolean;
  default_person?: Person;  // bu karttaki harcamaların varsayılan sahibi
}

export type LineDecision = "import" | "skip" | "review";

/** Motorun ürettiği, incelemeye hazır satır (statement_lines tablosu). */
export interface ProcessedLine extends RawLine {
  merchant: string;
  merchant_normalized: string;
  category: Category;
  person: Person;
  payment_method: PaymentMethod;
  is_virtual_card: boolean;
  is_tech: boolean;
  rule_id?: string | null;
  confidence: number;              // 0..1
  fx_rate_usd?: number | null;     // 1 birim orijinal = ? USD
  amount_usd: number | null;       // brüt $ karşılığı
  amount_usd_net: number | null;   // iştirak düşülmüş $ karşılığı
  amount_try_calc: number | null;  // TL karşılığı (ekstreden ya da kurdan)
  fingerprint: string;             // tekilleştirme anahtarı
  duplicate_of?: string | null;    // eşleşen mevcut expense id
  duplicate_reason?: string | null;
  decision: LineDecision;
  flags: string[];                 // "iade", "kural_yok", "teknoloji_disi", "olasi_mukerrer", ...
}

/** Mevcut expenses kaydı (tekilleştirme karşılaştırması için gereken alanlar). */
export interface ExistingExpense {
  id: string;
  expense_date: string;
  description: string;
  amount: number;
  currency: Currency;
  source_fingerprint?: string | null;
  external_id?: string | null;
  amount_usd?: number | null;
}

/** Kur sağlayıcı: verilen tarih için 1 birim `from` = ? USD */
export type FxLookup = (date: string, from: Currency) => Promise<number | null>;
