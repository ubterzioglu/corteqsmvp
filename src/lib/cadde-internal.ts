// Cadde API katmanının paylaşılan iç yardımcıları.
// Bu modül barrel'dan (cadde.ts) DIŞA AÇILMAZ; yalnız cadde-api / cadde-admin-api kullanır.

import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
// cadde-rules yalnız text-normalization'a bağlı — bu yön tek yönlü, döngü yok.
import { resolveCaddeRpcErrorMessage } from "@/lib/cadde-rules";

// Generated types (B1) güncel olmadığı için cadde_* tabloları typed client ile uyuşmayabilir.
// Tek izole cast burada tutulur; B1 çözülünce kaldırılacak.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = supabase as any;

export const FALLBACK_PROFILE_NAME = "CorteQS Üyesi";
export const CADDE_PAGE_SIZE = 20;

/**
 * Cafe listesi tavanı — CLAUDE.md "Değişmez sözleşmeler" md.5.
 *
 * PostgREST sınırsız sorguyu 1000 satırda SESSİZCE keser: hata dönmez, eksik veri döner.
 * `listCaddeCafes` sınırsızdı; cafe sayısı 1000'i geçtiğinde liste sessizce eksilecekti.
 * Panel zaten ilk 3'ü önizleyip gerisini "tümünü göster" ile açtığı için tüm satırları
 * çekmenin faydası da yoktu. Açık tavan, örtük kesmeden iyidir: sınır burada görünür ve
 * aşıldığında tek yerden büyütülür.
 */
export const CADDE_CAFE_LIST_LIMIT = 200;

const TOAST_THROTTLE_MS = 10_000;
let lastErrorToastAt = 0;

/**
 * cadde_api_error telemetrisi: hata asla sessizce yutulmaz.
 * console.error her zaman; kullanıcıya throttle'lı tek bir Sonner toast'u gösterilir
 * (aynı sayfadaki 6 paralel query'nin toast yağmuru yapmaması için).
 */
export function reportCaddeApiError(context: string, error: unknown): void {
  console.error(`[cadde_api_error] ${context}`, error);
  const now = Date.now();
  if (now - lastErrorToastAt >= TOAST_THROTTLE_MS) {
    lastErrorToastAt = now;
    toast.error("Cadde verileri yüklenirken sorun oluştu", {
      description: "Bazı içerikler geçici olarak görüntülenemiyor. Lütfen sayfayı yenileyin.",
    });
  }
}

/**
 * OKUMA yolu hatası — 04.08.2026 canlı denetiminde açılan boşluk.
 *
 * `reportCaddeApiError` + boş sonuç dönmek, hatayı "içerik yok"tan AYIRT EDİLEMEZ hale
 * getiriyordu: React Query açısından boş dizi dönen bir sorgu BAŞARILIDIR, `isError`
 * asla true olmaz. Sonuç, RLS reddi / RPC parametre hatası / ağ sorunu ekranda
 * "Bu akış henüz sessiz." olarak görünüyordu.
 *
 * Bu yüzden yüzeyin TAMAMINI besleyen okuma yolları (feed gibi) boş sonuç dönmek yerine
 * FIRLATIR; çağıran yüzey kendi satır içi hata kartını + "Tekrar dene" yolunu çizer.
 * Yan panel/rozet gibi İKİNCİL yüzeyler `reportCaddeApiError` + boş sonuç kalıbında
 * kalabilir — orada boş görünmek sayfayı yanıltmaz.
 *
 * Toast ATMAZ: hata kartı zaten görünür durumda, toast çift mesaj olurdu.
 * Error DÖNER (fırlatmaz) ki çağrı yeri tek satır kalsın:
 * `throw caddeReadError("listCaddeFeed", error)`.
 */
export function caddeReadError(context: string, error: unknown): Error {
  console.error(`[cadde_api_error] ${context}`, error);
  return error instanceof Error ? error : new Error(`Cadde okuma hatası: ${context}`);
}

/**
 * YAZMA yolu hatası — WS2 m75 araştırmasında açılan boşluk.
 *
 * Okuma yolları baştan sona `reportCaddeApiError` ile enstrümanteydi, yazma yolları
 * (paylaşım, yorum, tepki, cafe, çarşı, tanıtım — 17 çağrı) TAMAMEN çıplaktı: RPC
 * hatası Türkçe mesaja çevrilip fırlatılıyor, ham Postgres hatası hiçbir yere
 * yazılmadan yok oluyordu. Bilinmeyen bir kod gelirse kullanıcı genel mesajı
 * görüyor, kod ise kayboluyordu — "Paylaşım gönderilemedi" bu yüzden teşhis
 * edilemiyordu.
 *
 * `reportCaddeApiError` BURADA KULLANILAMAZ: o okuma-dilinde bir toast da atıyor
 * ("Cadde verileri yüklenirken sorun oluştu"), yazma yolunda çağıran zaten kendi
 * toast'unu gösterdiği için kullanıcı çift ve yanlış mesaj alırdı.
 *
 * Error DÖNER (fırlatmaz) ki çağrı yeri tek satır kalsın ve logu atlamak mümkün
 * olmasın: `throw caddeWriteError("createCaddePost", error)`.
 */
export function caddeWriteError(context: string, error: unknown, fallback?: string): Error {
  console.error(`[cadde_write_error] ${context}`, error);
  return new Error(resolveCaddeRpcErrorMessage(error, fallback));
}

export async function resolveCountryIdByName(countryName: string | null | undefined): Promise<string | null> {
  const trimmed = countryName?.trim() ?? "";
  if (!trimmed) return null;
  const { data } = await db.from("cadde_countries").select("id").eq("name", trimmed).maybeSingle();
  return data?.id ?? null;
}

export async function resolveCityIdByName(cityName: string | null | undefined, countryId: string | null): Promise<string | null> {
  const trimmed = cityName?.trim() ?? "";
  if (!trimmed) return null;
  let query = db.from("cadde_cities").select("id").eq("name", trimmed);
  if (countryId) query = query.eq("country_id", countryId);
  const { data } = await query.maybeSingle();
  return data?.id ?? null;
}

export async function resolveCountryIdsByNames(countryNames: readonly string[]): Promise<string[]> {
  const names = countryNames.map((name) => name.trim()).filter(Boolean);
  if (names.length === 0) return [];
  const { data } = await db.from("cadde_countries").select("id").in("name", names);
  return ((data ?? []) as Array<{ id: string }>).map((row) => row.id);
}

export async function resolveCityIdsByNames(cityNames: readonly string[], countryIds: readonly string[]): Promise<string[]> {
  const names = cityNames.map((name) => name.trim()).filter(Boolean);
  if (names.length === 0) return [];
  let query = db.from("cadde_cities").select("id").in("name", names);
  if (countryIds.length > 0) query = query.in("country_id", countryIds);
  const { data } = await query;
  return ((data ?? []) as Array<{ id: string }>).map((row) => row.id);
}
