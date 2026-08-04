// Workshop madde panosu — API katmanı.
// /admin/workshop/<workshopKey> sayfalarının veri katmanı: workshop bazlı maddeler
// (workshop_items) + madde başına iki bağımsız onay kutusu (UBT, Burak).
// RLS: yalnız admin okur/yazar; tüm adminler ortak durumu görür (mig 20260730190000).
//
// Format kararı (30.07.2026 Cadde workshop'u): madde listesi + iki checkbox, yorum yok.
// İkisi de onaylıysa madde "bitti" sayılır.
//
// types.ts henüz bu tabloyu içermiyor → supabase çağrılarında dar `as any` cast
// kullanılır (CLAUDE.md B1; revision-requests.ts ile aynı yaklaşım).

import { supabase } from "@/integrations/supabase/client";
import { sanitizeError, validateContent } from "@/lib/security";
import { trCompare, trIncludes } from "@/lib/text-normalization";

/** Tanımlı workshop'lar — yeni workshop eklenince buraya ve nav registry'ye eklenir. */
export const WORKSHOP_KEYS = ["cadde"] as const;
export type WorkshopKey = (typeof WORKSHOP_KEYS)[number];

/** Onay kutusu sahipleri — DB'deki iki bool kolonuna karşılık gelir. */
export const WORKSHOP_OWNERS = ["ubt", "burak"] as const;
export type WorkshopOwner = (typeof WORKSHOP_OWNERS)[number];

export const WORKSHOP_OWNER_LABELS: Record<WorkshopOwner, string> = {
  ubt: "UBT",
  burak: "Burak",
};

export type WorkshopItem = {
  id: string;
  workshopKey: string;
  section: string;
  itemNo: number;
  title: string;
  ubtDone: boolean;
  burakDone: boolean;
  ubtDoneAt: string | null;
  burakDoneAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkshopItemDraft = {
  section: string;
  title: string;
};

/** Bir bölümdeki maddeler — UI gruplaması için. */
export type WorkshopSection = {
  section: string;
  items: WorkshopItem[];
};

export type WorkshopProgress = {
  total: number;
  ubtDone: number;
  burakDone: number;
  /** İki onayı da almış maddeler — "bitmiş" tanımı. */
  completed: number;
  /** Tamamlanma yüzdesi (0-100, tam sayı). */
  percent: number;
};

type ItemRow = {
  id: string;
  workshop_key: string;
  section: string;
  item_no: number;
  title: string;
  ubt_done: boolean;
  burak_done: boolean;
  ubt_done_at: string | null;
  burak_done_at: string | null;
  created_at: string;
  updated_at: string;
};

const ITEM_SELECT =
  "id,workshop_key,section,item_no,title,ubt_done,burak_done,ubt_done_at,burak_done_at,created_at,updated_at";

const TABLE = "workshop_items";

// types.ts bu tabloyu tanımadığı için tüm sorgular tek bir gevşek istemci
// arayüzünden geçer (revision-requests.ts deseni).
type LooseQuery = {
  select: (cols: string) => LooseQuery;
  insert: (values: Record<string, unknown>) => LooseQuery;
  update: (values: Record<string, unknown>) => LooseQuery;
  eq: (column: string, value: unknown) => LooseQuery;
  is: (column: string, value: unknown) => LooseQuery;
  order: (column: string, options: { ascending: boolean }) => LooseQuery;
  limit: (count: number) => LooseQuery;
  maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
  single: () => Promise<{ data: unknown; error: unknown }>;
  then: Promise<{ data: unknown; error: unknown }>["then"];
};

const table = (): LooseQuery =>
  (supabase as unknown as { from: (t: string) => LooseQuery }).from(TABLE);

function mapItem(row: ItemRow): WorkshopItem {
  return {
    id: row.id,
    workshopKey: row.workshop_key,
    section: row.section,
    itemNo: row.item_no,
    title: row.title,
    ubtDone: row.ubt_done,
    burakDone: row.burak_done,
    ubtDoneAt: row.ubt_done_at,
    burakDoneAt: row.burak_done_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Madde iki onayı da almış mı — "bitti" tanımı (workshop kararı). */
export function isWorkshopItemComplete(item: WorkshopItem): boolean {
  return item.ubtDone && item.burakDone;
}

/** Pano üst şeridindeki sayaçları hesaplar. */
export function calculateWorkshopProgress(items: WorkshopItem[]): WorkshopProgress {
  const total = items.length;
  const completed = items.filter(isWorkshopItemComplete).length;
  return {
    total,
    ubtDone: items.filter((item) => item.ubtDone).length,
    burakDone: items.filter((item) => item.burakDone).length,
    completed,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

/**
 * Maddeleri bölümlere ayırır; bölüm sırası ilk maddenin item_no'suna göredir
 * (transkript sırası korunur), bölüm içi sıra item_no artan.
 */
export function groupWorkshopItems(items: WorkshopItem[]): WorkshopSection[] {
  const buckets = new Map<string, WorkshopItem[]>();
  for (const item of items) {
    const key = item.section.trim();
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(item);
    } else {
      buckets.set(key, [item]);
    }
  }

  return Array.from(buckets.entries())
    .map(([section, sectionItems]) => ({
      section,
      items: [...sectionItems].sort((a, b) => a.itemNo - b.itemNo),
    }))
    .sort((a, b) => a.items[0].itemNo - b.items[0].itemNo);
}

/** Bekleyen / tamamlanan ayrımı — pano alt akordeonu bu ayrımı kullanır. */
export type WorkshopPartition = {
  open: WorkshopItem[];
  completed: WorkshopItem[];
};

/**
 * Maddeleri bekleyen ve tamamlanan olarak ikiye böler. Sıralama korunur, böylece
 * her iki liste de groupWorkshopItems ile aynı bölüm sırasını üretir.
 */
export function partitionWorkshopItems(items: WorkshopItem[]): WorkshopPartition {
  const open: WorkshopItem[] = [];
  const completed: WorkshopItem[] = [];

  for (const item of items) {
    if (isWorkshopItemComplete(item)) {
      completed.push(item);
    } else {
      open.push(item);
    }
  }

  return { open, completed };
}

export type WorkshopStatusFilter = "all" | "open" | "completed";

/** Arama (Türkçe aksan-toleranslı) + durum filtresini uygular. */
export function filterWorkshopItems(
  items: WorkshopItem[],
  options: { search?: string; status?: WorkshopStatusFilter } = {},
): WorkshopItem[] {
  const search = options.search?.trim() ?? "";
  const status = options.status ?? "all";

  return items.filter((item) => {
    if (status === "completed" && !isWorkshopItemComplete(item)) return false;
    if (status === "open" && isWorkshopItemComplete(item)) return false;
    if (search && !trIncludes(`${item.title} ${item.section}`, search)) return false;
    return true;
  });
}

/** Mevcut bölüm adlarını Türkçe sıralı, tekilleştirilmiş döner (form önerisi). */
export function collectWorkshopSections(items: WorkshopItem[]): string[] {
  const labels = new Set(
    items.map((item) => item.section.trim()).filter((section) => section.length > 0),
  );
  return Array.from(labels).sort(trCompare);
}

/** Madde formunu doğrular; geçerliyse null, değilse Türkçe hata mesajı döner. */
export function validateWorkshopItemDraft(draft: WorkshopItemDraft): string | null {
  const title = draft.title.trim();
  if (!title) {
    return "Madde metni boş bırakılamaz.";
  }

  const contentError = validateContent(title);
  if (contentError) return contentError;

  if (draft.section.trim().length > 120) {
    return "Bölüm adı en fazla 120 karakter olabilir.";
  }

  return null;
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** Bir workshop'un aktif maddelerini madde sırasıyla getirir. */
export async function fetchWorkshopItems(workshopKey: string): Promise<WorkshopItem[]> {
  const { data, error } = await table()
    .select(ITEM_SELECT)
    .eq("workshop_key", workshopKey)
    .is("deleted_at", null)
    .order("item_no", { ascending: true });

  if (error) {
    throw new Error(sanitizeError(error, "Workshop maddeleri yüklenemedi."));
  }

  return ((data as ItemRow[]) ?? []).map(mapItem);
}

/**
 * Sonraki madde numarasını bulur. Soft-delete edilmiş satırlar da unique
 * kısıtına dahil olduğu için filtresiz en büyük item_no baz alınır.
 */
async function nextItemNo(workshopKey: string): Promise<number> {
  const { data, error } = await table()
    .select("item_no")
    .eq("workshop_key", workshopKey)
    .order("item_no", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(sanitizeError(error, "Madde numarası hesaplanamadı."));
  }

  const row = data as { item_no: number } | null;
  return (row?.item_no ?? 0) + 1;
}

/** Workshop'a yeni madde ekler (listenin sonuna). */
export async function createWorkshopItem(
  workshopKey: string,
  draft: WorkshopItemDraft,
): Promise<WorkshopItem> {
  const validationError = validateWorkshopItemDraft(draft);
  if (validationError) {
    throw new Error(validationError);
  }

  const [itemNo, createdBy] = await Promise.all([nextItemNo(workshopKey), currentUserId()]);
  const { data, error } = await table()
    .insert({
      workshop_key: workshopKey,
      section: draft.section.trim(),
      item_no: itemNo,
      title: draft.title.trim(),
      created_by: createdBy,
    })
    .select(ITEM_SELECT)
    .single();

  if (error || !data) {
    throw new Error(sanitizeError(error, "Madde eklenemedi."));
  }

  return mapItem(data as ItemRow);
}

/** Madde metnini / bölümünü güncelle. */
export async function updateWorkshopItem(
  id: string,
  draft: WorkshopItemDraft,
): Promise<WorkshopItem> {
  const validationError = validateWorkshopItemDraft(draft);
  if (validationError) {
    throw new Error(validationError);
  }

  const { data, error } = await table()
    .update({ title: draft.title.trim(), section: draft.section.trim() })
    .eq("id", id)
    .select(ITEM_SELECT)
    .single();

  if (error || !data) {
    throw new Error(sanitizeError(error, "Madde güncellenemedi."));
  }

  return mapItem(data as ItemRow);
}

/** Bir sahibin onay kutusunu set eder; zaman damgası da birlikte yazılır. */
export async function setWorkshopItemApproval(
  id: string,
  owner: WorkshopOwner,
  done: boolean,
): Promise<WorkshopItem> {
  const payload =
    owner === "ubt"
      ? { ubt_done: done, ubt_done_at: done ? new Date().toISOString() : null }
      : { burak_done: done, burak_done_at: done ? new Date().toISOString() : null };

  const { data, error } = await table()
    .update(payload)
    .eq("id", id)
    .select(ITEM_SELECT)
    .single();

  if (error || !data) {
    throw new Error(sanitizeError(error, "Onay güncellenemedi."));
  }

  return mapItem(data as ItemRow);
}

/** Maddeyi soft-delete eder (item_no serbest bırakılmaz, numaralar sabit kalır). */
export async function deleteWorkshopItem(id: string): Promise<void> {
  const { error } = await table()
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(sanitizeError(error, "Madde silinemedi."));
  }
}
