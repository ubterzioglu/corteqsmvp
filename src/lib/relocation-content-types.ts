// Relocation içerik + ilerleme — Row tipleri.
// DB satır şekilleri: supabase/migrations/applied/20260920120000_relocation_content_and_progress.sql
//
// Bu dosyadaki dört tablo, referans Lovable uygulamasındaki "Yaşam Masrafları" ve
// "Gerekli Belgeler" sekmelerinin bizdeki KARŞILIĞIDIR. Referans bu verileri
// bileşenin içine gömüyordu (2 ülke maliyet, 5 ülke belge) ve kutucuk durumunu
// localStorage'da tutuyordu; burada hepsi veri tabanından gelir.

/** Yaşam masrafı kalemi. DB'de CHECK kısıtı ile kilitli — yeni kalem eklemek migration ister. */
export type RelocationCostItemKey =
  | "rent"
  | "groceries"
  | "transport"
  | "insurance"
  | "utilities"
  | "childcare";

export type RelocationCostPeriod = "monthly" | "one_off";

export interface RelocationLivingCostRow {
  id: string;
  country_code: string;
  /** null = ülke geneli (şehir kırılımı yok). */
  city_code: string | null;
  item_key: RelocationCostItemKey;
  /** Tutarlar SAYISAL. "€800 - €1.500/ay" gibi metin aralığı DB'de tutulmaz. */
  amount_min: number | null;
  amount_max: number | null;
  currency: string;
  /** 1 = yalnız, 2 = çift, 3+ = aile. Referans aileyi 1.6 katsayısıyla ÇARPIYORDU; burada gerçek satır. */
  household_size: number;
  period: RelocationCostPeriod;
  note: string | null;
  is_active: boolean;
}

export interface RelocationRequiredDocumentRow {
  id: string;
  country_code: string;
  doc_name: string;
  /** Serbest metin kategori — ör. "Kimlik", "Eğitim", "Finans". */
  category: string;
  /** Ör. "Apostil tasdikli, yeminli tercüme". */
  note: string | null;
  sort_order: number;
  is_active: boolean;
}

export type RelocationProgressItemType = "checklist_step" | "required_document";

export interface RelocationMoveProgressRow {
  id: string;
  move_id: string;
  item_type: RelocationProgressItemType;
  item_key: string;
  is_done: boolean;
  done_at: string | null;
}

export type RelocationMoveDocumentType = "checklist" | "chat" | "report" | "costs";

export interface RelocationMoveDocumentRow {
  id: string;
  move_id: string;
  title: string;
  content: string;
  doc_type: RelocationMoveDocumentType;
  created_at: string;
}

/** Bir kalemin tüm hane büyüklüklerindeki satırları — sunum katmanı için gruplanmış hali. */
export interface RelocationCostGroup {
  item_key: RelocationCostItemKey;
  rows: RelocationLivingCostRow[];
}

/** Kategoriye göre gruplanmış belge listesi. */
export interface RelocationDocumentGroup {
  category: string;
  documents: RelocationRequiredDocumentRow[];
}
