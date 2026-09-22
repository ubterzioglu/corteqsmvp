// Relocation içerik + ilerleme — Supabase okuma/yazma katmanı.
// Desen: src/lib/relocation-api.ts (aynı modülün mevcut API'si).
//
// NOT: supabase/types.ts bu dört tablo için henüz regenerate edilmedi; mevcut
// relocation-api.ts ile aynı sebeple `supabase as any` kullanılır. Kaldırmak tsc
// hatalarını geri getirir (CLAUDE.md "TypeScript loose" maddesi).

import { supabase } from "@/integrations/supabase/client";
import type {
  RelocationFxRateRow,
  RelocationLivingCostRow,
  RelocationMoveDocumentRow,
  RelocationMoveDocumentType,
  RelocationMoveProgressRow,
  RelocationProgressItemType,
  RelocationRequiredDocumentRow,
} from "@/lib/relocation-content-types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/**
 * PostgREST tek sorguda 1000 satırda SESSİZCE keser (CLAUDE.md "Değişmez sözleşmeler" md.5).
 * Bu tablolar bugün küçük, ama ülke sayısı arttıkça belge listeleri büyür — tavanı
 * baştan aşmayalım diye açık limit veriyoruz. Limite dayanırsak sayfalama eklenmeli.
 */
const MAX_ROWS = 1000;

// ---------------------------------------------------------------------------
// Referans içerik (public read — RLS: is_active)
// ---------------------------------------------------------------------------

/** Ülke(ler) için yaşam masrafı kalemleri. Boş dizi = içerik henüz girilmemiş. */
export async function getLivingCosts(
  countryCodes: string[],
): Promise<RelocationLivingCostRow[]> {
  const codes = countryCodes.map((c) => c.trim().toUpperCase()).filter(Boolean);
  if (codes.length === 0) return [];

  const { data, error } = await db
    .from("relocation_living_costs")
    .select("*")
    .in("country_code", codes)
    .eq("is_active", true)
    .limit(MAX_ROWS);
  if (error) throw error;
  return (data ?? []) as RelocationLivingCostRow[];
}

/** Ülke(ler) için gerekli belge listesi, sort_order'a göre. */
export async function getRequiredDocuments(
  countryCodes: string[],
): Promise<RelocationRequiredDocumentRow[]> {
  const codes = countryCodes.map((c) => c.trim().toUpperCase()).filter(Boolean);
  if (codes.length === 0) return [];

  const { data, error } = await db
    .from("relocation_required_documents")
    .select("*")
    .in("country_code", codes)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(MAX_ROWS);
  if (error) throw error;
  return (data ?? []) as RelocationRequiredDocumentRow[];
}

// ---------------------------------------------------------------------------
// Kullanıcı ilerlemesi (sahip-bazlı RLS — move üzerinden doğrulanır)
// ---------------------------------------------------------------------------

export async function getMoveProgress(moveId: string): Promise<RelocationMoveProgressRow[]> {
  const { data, error } = await db
    .from("relocation_move_progress")
    .select("*")
    .eq("move_id", moveId)
    .limit(MAX_ROWS);
  if (error) throw error;
  return (data ?? []) as RelocationMoveProgressRow[];
}

/**
 * Kutucuk durumunu yazar. Aynı (move, tip, anahtar) için tek satır tutulur —
 * migration'daki unique index bunu garanti eder, burada upsert ile hizalanıyoruz.
 */
export async function setMoveProgress(input: {
  moveId: string;
  itemType: RelocationProgressItemType;
  itemKey: string;
  isDone: boolean;
}): Promise<void> {
  const payload = {
    move_id: input.moveId,
    item_type: input.itemType,
    item_key: input.itemKey,
    is_done: input.isDone,
    done_at: input.isDone ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await db
    .from("relocation_move_progress")
    .upsert(payload, { onConflict: "move_id,item_type,item_key" });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Kayıtlı dokümanlar (referansın savedDocs'unun DB karşılığı)
// ---------------------------------------------------------------------------

export async function getMoveDocuments(moveId: string): Promise<RelocationMoveDocumentRow[]> {
  const { data, error } = await db
    .from("relocation_move_documents")
    .select("*")
    .eq("move_id", moveId)
    .order("created_at", { ascending: false })
    .limit(MAX_ROWS);
  if (error) throw error;
  return (data ?? []) as RelocationMoveDocumentRow[];
}

export async function saveMoveDocument(input: {
  moveId: string;
  title: string;
  content: string;
  docType: RelocationMoveDocumentType;
}): Promise<void> {
  const payload = {
    move_id: input.moveId,
    title: input.title,
    content: input.content,
    doc_type: input.docType,
  };

  const { error } = await db.from("relocation_move_documents").insert(payload);
  if (error) throw error;
}

export async function deleteMoveDocument(documentId: string): Promise<void> {
  const { error } = await db.from("relocation_move_documents").delete().eq("id", documentId);
  if (error) throw error;
}

/**
 * Saklanan döviz kurları (B30). Anlık çekim YOK — sayfa dış servise gitmez.
 * Kur yoksa boş dizi döner ve panel karşılık göstermez; uydurma çevrim yapılmaz.
 */
export async function getFxRates(): Promise<RelocationFxRateRow[]> {
  const { data, error } = await db
    .from("relocation_fx_rates")
    .select("base_currency, quote_currency, rate, rate_at")
    .limit(MAX_ROWS);
  if (error) throw error;
  return (data ?? []) as RelocationFxRateRow[];
}
