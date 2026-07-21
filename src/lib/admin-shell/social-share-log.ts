// Sosyal Medya Paylaşım Takip — API katmanı.
// /admin/social-share-vault sayfasındaki içerik kalemlerinin (araç tanıtımları,
// diaspora postları, test araçları, Burak medya kalemleri) hangi platformlarda
// paylaşıldığını DB'de tutar.
//
// Tablolar (mig 20260627100000, 20260718100000, 20260721140000):
//  • social_share_log        → kalem × platform rozetleri (UNIQUE global_id,platform)
//  • social_share_item_note  → kalem başına tek not (UNIQUE global_id)
// Kimlik: global_id ("item-1".."item-100", social-share-unified.ts) — tab/id
// artık DB'ye girmez, yalnız UI rozeti içindir.
// RLS: yalnız admin okur/yazar; tüm adminler ortak durumu görür.
//
// types.ts henüz bu tabloları içermeyebilir → supabase çağrılarında dar `as any` cast
// kullanılır (B1 types regen sonrası kaldırılabilir).

import {
  Facebook,
  Instagram,
  Linkedin,
  MessageCircle,
  Twitter,
  type LucideIcon,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

/** İçerik bölümleri — DB CHECK ile eşleşir. */
export type ShareTab = "tools" | "diaspora" | "tests" | "burak";

/** Desteklenen paylaşım platformları — DB CHECK ile eşleşir. */
export const SHARE_PLATFORMS = [
  "linkedin",
  "instagram",
  "reddit",
  "x",
  "facebook",
  "threads",
] as const;

export type SharePlatform = (typeof SHARE_PLATFORMS)[number];

/** Platform → görünür etiket (teknik anahtarlar; Türkçe case dönüşümü gerekmez). */
export const SHARE_PLATFORM_LABELS: Record<SharePlatform, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  reddit: "Reddit",
  x: "X",
  facebook: "Facebook",
  threads: "Threads",
};

/** Platform → lucide ikon (Reddit/Threads için yakın eşdeğerler). */
export const SHARE_PLATFORM_ICONS: Record<SharePlatform, LucideIcon> = {
  linkedin: Linkedin,
  instagram: Instagram,
  reddit: MessageCircle,
  x: Twitter,
  facebook: Facebook,
  threads: MessageCircle,
};

export type ShareBadge = {
  shared: boolean;
  markedAt: string;
  markedBy: string | null;
};

export type ShareNote = {
  note: string;
  markedAt: string;
  markedBy: string | null;
};

export type ShareState = {
  /** anahtar: `${tab}:${itemId}` → platform → rozet durumu */
  badges: Record<string, Partial<Record<SharePlatform, ShareBadge>>>;
  /** anahtar: `${tab}:${itemId}` → not */
  notes: Record<string, ShareNote>;
};

/** Harita anahtarı — tek yerde üretilir. globalId zaten benzersiz olduğu için doğrudan kullanılır. */
export const shareKey = (globalId: string): string => globalId;

type LogRow = {
  global_id: string;
  platform: SharePlatform;
  shared: boolean;
  marked_at: string;
  marked_by: string | null;
};

type NoteRow = {
  global_id: string;
  note: string;
  marked_at: string;
  marked_by: string | null;
};

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

/** Her iki tabloyu çekip globalId anahtarlı haritalara dönüştürür. */
export async function fetchShareState(): Promise<ShareState> {
  const client = supabase as unknown as {
    from: (table: string) => {
      select: (cols: string) => Promise<{ data: unknown; error: unknown }>;
    };
  };

  const [logRes, noteRes] = await Promise.all([
    client.from("social_share_log").select("global_id,platform,shared,marked_at,marked_by"),
    client.from("social_share_item_note").select("global_id,note,marked_at,marked_by"),
  ]);

  if (logRes.error) {
    throw new Error(errorMessage(logRes.error, "Paylaşım durumları yüklenemedi"));
  }
  if (noteRes.error) {
    throw new Error(errorMessage(noteRes.error, "Paylaşım notları yüklenemedi"));
  }

  const badges: ShareState["badges"] = {};
  for (const row of (logRes.data as LogRow[]) ?? []) {
    const key = shareKey(row.global_id);
    (badges[key] ??= {})[row.platform] = {
      shared: row.shared,
      markedAt: row.marked_at,
      markedBy: row.marked_by,
    };
  }

  const notes: ShareState["notes"] = {};
  for (const row of (noteRes.data as NoteRow[]) ?? []) {
    notes[shareKey(row.global_id)] = {
      note: row.note,
      markedAt: row.marked_at,
      markedBy: row.marked_by,
    };
  }

  return { badges, notes };
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** Bir kalem × platform rozetini aç/kapatır (upsert). */
export async function toggleShare(args: {
  globalId: string;
  platform: SharePlatform;
  shared: boolean;
}): Promise<void> {
  const markedBy = await currentUserId();
  const client = supabase as unknown as {
    from: (table: string) => {
      upsert: (
        values: Record<string, unknown>,
        options: { onConflict: string },
      ) => Promise<{ error: unknown }>;
    };
  };

  const { error } = await client.from("social_share_log").upsert(
    {
      global_id: args.globalId,
      platform: args.platform,
      shared: args.shared,
      marked_by: markedBy,
      marked_at: new Date().toISOString(),
    },
    { onConflict: "global_id,platform" },
  );

  if (error) {
    throw new Error(errorMessage(error, "Paylaşım durumu kaydedilemedi"));
  }
}

/** Bir kalemin tek notunu kaydeder (upsert). */
export async function saveItemNote(args: {
  globalId: string;
  note: string;
}): Promise<void> {
  const markedBy = await currentUserId();
  const client = supabase as unknown as {
    from: (table: string) => {
      upsert: (
        values: Record<string, unknown>,
        options: { onConflict: string },
      ) => Promise<{ error: unknown }>;
    };
  };

  const { error } = await client.from("social_share_item_note").upsert(
    {
      global_id: args.globalId,
      note: args.note,
      marked_by: markedBy,
      marked_at: new Date().toISOString(),
    },
    { onConflict: "global_id" },
  );

  if (error) {
    throw new Error(errorMessage(error, "Not kaydedilemedi"));
  }
}
