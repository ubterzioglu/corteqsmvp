// Admin Brainstorming — /admin/brainstorming sayfasının veri katmanı.
// Eski public /statusreport3006 sayfasının admin sürümü: bölüm (brainstorming_sections)
// + satır (brainstorming_rows) CRUD'u + statusreport_comments üzerinden yorum thread'i
// (section_key ile bağlı, FK yok — mig 20260718120000 / 20260718130000).
//
// types.ts bu tabloları/RPC'yi tanımıyor → revision-requests.ts / statusreport-comments.ts
// deseniyle aynı: dar `as any` cast + gevşek istemci arayüzü.

import { supabase } from "@/integrations/supabase/client";
import { sanitizeError } from "@/lib/security";
import {
  brainstormingRowFormSchema,
  brainstormingSectionFormSchema,
  type BrainstormingRowForm,
  type BrainstormingSectionForm,
  type BrainstormingStatus,
} from "@/lib/brainstorming-schemas";

// Form tipleri şemalarda tanımlıdır ama bu modülün açık API'sinin parçası:
// createSection/updateRow gibi fonksiyonların imzaları bunları kullanıyor ve
// çağıranlar (testler dahil) buradan import ediyordu. Re-export edilmemişti.
export type { BrainstormingRowForm, BrainstormingSectionForm };

export type BrainstormingRow = {
  id: string;
  sectionId: string;
  label: string;
  technical: string;
  plain: string;
  status: BrainstormingStatus | null;
  orderIndex: number;
};

export type BrainstormingSection = {
  id: string;
  sectionKey: string;
  groupLabel: string | null;
  title: string;
  intro: string | null;
  orderIndex: number;
  rows: BrainstormingRow[];
};

export type BrainstormingComment = {
  id: string;
  sectionKey: string;
  authorName: string;
  createdBy: string | null;
  body: string;
  createdAt: string;
};

type SectionRow = {
  id: string;
  section_key: string;
  group_label: string | null;
  title: string;
  intro: string | null;
  order_index: number;
};

type RowRow = {
  id: string;
  section_id: string;
  label: string;
  technical: string;
  plain: string;
  status: BrainstormingStatus | null;
  order_index: number;
};

type CommentRow = {
  id: string;
  section_key: string;
  author_name: string;
  created_by: string | null;
  body: string;
  created_at: string;
};

const SECTION_SELECT = "id,section_key,group_label,title,intro,order_index";
const ROW_SELECT = "id,section_id,label,technical,plain,status,order_index";
const COMMENT_SELECT = "id,section_key,author_name,created_by,body,created_at";

// types.ts bu tabloları tanımadığı için tüm sorgular tek bir gevşek istemci
// arayüzünden geçer (revision-requests.ts deseni).
type LooseQuery = {
  select: (cols: string) => LooseQuery;
  insert: (values: Record<string, unknown>) => LooseQuery;
  update: (values: Record<string, unknown>) => LooseQuery;
  eq: (column: string, value: unknown) => LooseQuery;
  order: (column: string, options: { ascending: boolean }) => LooseQuery;
  single: () => Promise<{ data: unknown; error: unknown }>;
  then: Promise<{ data: unknown; error: unknown }>["then"];
};

const table = (name: string): LooseQuery =>
  (supabase as unknown as { from: (t: string) => LooseQuery }).from(name);

function mapRow(row: RowRow): BrainstormingRow {
  return {
    id: row.id,
    sectionId: row.section_id,
    label: row.label,
    technical: row.technical,
    plain: row.plain,
    status: row.status,
    orderIndex: row.order_index,
  };
}

function mapSection(row: SectionRow, rows: BrainstormingRow[]): BrainstormingSection {
  return {
    id: row.id,
    sectionKey: row.section_key,
    groupLabel: row.group_label,
    title: row.title,
    intro: row.intro,
    orderIndex: row.order_index,
    rows,
  };
}

function mapComment(row: CommentRow): BrainstormingComment {
  return {
    id: row.id,
    sectionKey: row.section_key,
    authorName: row.author_name,
    createdBy: row.created_by,
    body: row.body,
    createdAt: row.created_at,
  };
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "bolum"
  );
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** Tüm bölümleri, her birinin satırlarıyla birlikte sıralı getirir. */
export async function fetchSections(): Promise<BrainstormingSection[]> {
  const { data: sectionData, error: sectionError } = await table("brainstorming_sections")
    .select(SECTION_SELECT)
    .order("order_index", { ascending: true });

  if (sectionError) {
    throw new Error(sanitizeError(sectionError, "Bölümler yüklenemedi."));
  }

  const { data: rowData, error: rowError } = await table("brainstorming_rows")
    .select(ROW_SELECT)
    .order("order_index", { ascending: true });

  if (rowError) {
    throw new Error(sanitizeError(rowError, "Satırlar yüklenemedi."));
  }

  const rowsBySection = new Map<string, BrainstormingRow[]>();
  for (const row of (rowData as RowRow[]) ?? []) {
    const mapped = mapRow(row);
    const bucket = rowsBySection.get(mapped.sectionId) ?? [];
    bucket.push(mapped);
    rowsBySection.set(mapped.sectionId, bucket);
  }

  return ((sectionData as SectionRow[]) ?? []).map((section) =>
    mapSection(section, rowsBySection.get(section.id) ?? []),
  );
}

/** Yeni bölüm oluşturur; section_key başlıktan türetilir (benzersizlik DB unique kısıtına bırakılır). */
export async function createSection(
  input: BrainstormingSectionForm,
  orderIndex: number,
): Promise<BrainstormingSection> {
  const parsed = brainstormingSectionFormSchema.parse(input);
  const uid = await currentUserId();
  const sectionKey = `${slugify(parsed.title)}-${Date.now().toString(36)}`;

  const { data, error } = await table("brainstorming_sections")
    .insert({
      section_key: sectionKey,
      group_label: parsed.groupLabel || null,
      title: parsed.title,
      intro: parsed.intro || null,
      order_index: orderIndex,
      created_by: uid,
      updated_by: uid,
    })
    .select(SECTION_SELECT)
    .single();

  if (error || !data) {
    throw new Error(sanitizeError(error, "Bölüm oluşturulamadı."));
  }

  return mapSection(data as SectionRow, []);
}

/** Var olan bir bölümü günceller (rows dokunulmaz). */
export async function updateSection(
  id: string,
  input: BrainstormingSectionForm,
): Promise<BrainstormingSection> {
  const parsed = brainstormingSectionFormSchema.parse(input);
  const uid = await currentUserId();

  const { data, error } = await table("brainstorming_sections")
    .update({
      group_label: parsed.groupLabel || null,
      title: parsed.title,
      intro: parsed.intro || null,
      updated_by: uid,
    })
    .eq("id", id)
    .select(SECTION_SELECT)
    .single();

  if (error || !data) {
    throw new Error(sanitizeError(error, "Bölüm güncellenemedi."));
  }

  return mapSection(data as SectionRow, []);
}

/** Bölümü siler (satırları cascade ile birlikte gider). */
export async function deleteSection(id: string): Promise<void> {
  const { error } = await (
    supabase as unknown as { from: (t: string) => { delete: () => LooseQuery } }
  )
    .from("brainstorming_sections")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(sanitizeError(error, "Bölüm silinemedi."));
  }
}

/** Bölümlerin order_index'ini verilen sıraya göre yeniden yazar. */
export async function reorderSections(orderedIds: string[]): Promise<void> {
  await Promise.all(
    orderedIds.map((id, index) =>
      table("brainstorming_sections").update({ order_index: index }).eq("id", id),
    ),
  );
}

/** Bir bölüme yeni satır ekler. */
export async function createRow(
  sectionId: string,
  input: BrainstormingRowForm,
  orderIndex: number,
): Promise<BrainstormingRow> {
  const parsed = brainstormingRowFormSchema.parse(input);

  const { data, error } = await table("brainstorming_rows")
    .insert({
      section_id: sectionId,
      label: parsed.label,
      technical: parsed.technical,
      plain: parsed.plain,
      status: parsed.status,
      order_index: orderIndex,
    })
    .select(ROW_SELECT)
    .single();

  if (error || !data) {
    throw new Error(sanitizeError(error, "Satır oluşturulamadı."));
  }

  return mapRow(data as RowRow);
}

/** Var olan bir satırı günceller. */
export async function updateRow(
  id: string,
  input: BrainstormingRowForm,
): Promise<BrainstormingRow> {
  const parsed = brainstormingRowFormSchema.parse(input);

  const { data, error } = await table("brainstorming_rows")
    .update({
      label: parsed.label,
      technical: parsed.technical,
      plain: parsed.plain,
      status: parsed.status,
    })
    .eq("id", id)
    .select(ROW_SELECT)
    .single();

  if (error || !data) {
    throw new Error(sanitizeError(error, "Satır güncellenemedi."));
  }

  return mapRow(data as RowRow);
}

/** Satırı siler. */
export async function deleteRow(id: string): Promise<void> {
  const { error } = await (
    supabase as unknown as { from: (t: string) => { delete: () => LooseQuery } }
  )
    .from("brainstorming_rows")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(sanitizeError(error, "Satır silinemedi."));
  }
}

/** Bir bölümün satırlarının order_index'ini yeniden yazar. */
export async function reorderRows(orderedIds: string[]): Promise<void> {
  await Promise.all(
    orderedIds.map((id, index) =>
      table("brainstorming_rows").update({ order_index: index }).eq("id", id),
    ),
  );
}

/** Bir bölümün yorumlarını eskiden yeniye getirir. */
export async function fetchComments(sectionKey: string): Promise<BrainstormingComment[]> {
  const { data, error } = await table("statusreport_comments")
    .select(COMMENT_SELECT)
    .eq("section_key", sectionKey)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(sanitizeError(error, "Yorumlar yüklenemedi."));
  }

  return ((data as CommentRow[]) ?? []).map(mapComment);
}

/** Bir bölüme yorum ekler (yazan admin auth session'dan). */
export async function addComment(sectionKey: string, body: string): Promise<BrainstormingComment> {
  const trimmed = body.trim();
  if (!trimmed) {
    throw new Error("Yorum boş bırakılamaz.");
  }

  const { data, error } = await supabase.rpc("add_brainstorming_comment_v1" as never, {
    p_section_key: sectionKey,
    p_body: trimmed,
  } as never);

  if (error || !data) {
    throw new Error(sanitizeError(error, "Yorum eklenemedi."));
  }

  return mapComment(data as unknown as CommentRow);
}

/**
 * Tekilleştirilmiş created_by id'lerini e-postaya çözer (UI yazar gösterimi).
 * admin_get_user_email moderator-gate'li SECURITY DEFINER RPC; her id ayrı çağrı.
 */
export async function fetchUserEmails(ids: (string | null)[]): Promise<Record<string, string>> {
  const uniqueIds = Array.from(new Set(ids.filter((id): id is string => Boolean(id))));
  if (uniqueIds.length === 0) {
    return {};
  }

  const entries = await Promise.all(
    uniqueIds.map(async (id) => {
      const { data, error } = await supabase.rpc("admin_get_user_email" as never, {
        p_user_id: id,
      } as never);
      if (error || !data) {
        return [id, ""] as const;
      }
      return [id, data as unknown as string] as const;
    }),
  );

  const result: Record<string, string> = {};
  for (const [id, email] of entries) {
    if (email) {
      result[id] = email;
    }
  }
  return result;
}
