// TOP 10 HOT FIX maddelerinin altındaki soru/cevap yorumları.
//
// NEDEN VAR: Acil listesindeki maddeler tek cümleyle yazılıyor ve netleştirme
// yazışması bugüne kadar listenin DIŞINDA yürüyordu (sohbet, mail) — madde ile
// cevabı arasındaki bağ kayboluyordu. Artık soru ve cevap maddenin altında durur.
//
// Tablo: public.command_center_hot_fix_comments (mig 20260909210000).
// RLS admin-only; acil listesi zaten yalnız yöneticiye görünüyor.

import { getSupabaseBrowserClient } from './supabase'
import { validateContent } from '@/lib/security'

/**
 * Supabase hata mesajını okunur hale getirir.
 *
 * ⚠️ `sanitizeError` BİLEREK kullanılmadı: o yalnız `error instanceof Error` durumunu
 * ele alıyor, oysa supabase-js hataları DÜZ NESNEDİR (CLAUDE.md'de kayıtlı tuzak —
 * aynı yanılgı Cadde hata sözlüğünü bir süre tamamen ölü bırakmıştı). Kardeş modül
 * command-center-hot-fixes.ts de bu yüzden kendi eşleyicisini kullanıyor.
 */
function toCommentErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error && typeof error === 'object') {
    const candidate = error as { message?: unknown; details?: unknown; hint?: unknown }
    for (const value of [candidate.message, candidate.details, candidate.hint]) {
      if (typeof value === 'string' && value.trim()) {
        if (value.includes('row-level security')) return 'Bu işlem için yetkiniz yok.'
        if (value.includes('violates check constraint')) return 'Girilen değerler geçersiz.'
        return value
      }
    }
  }
  return fallbackMessage
}

/** DB satırı. */
export interface HotFixCommentRow {
  id: string
  hot_fix_id: string
  author_name: string
  body: string
  created_at: string
  created_by: string | null
}

/** Arayüzün kullandığı biçim. */
export interface HotFixComment {
  id: string
  hotFixId: string
  authorName: string
  body: string
  createdAt: string
}

/** Yazar adı için DB CHECK ile aynı sınır (1-80). */
export const HOT_FIX_COMMENT_AUTHOR_MAX = 80
/** Gövde için DB CHECK ile aynı sınır (1-8000). */
export const HOT_FIX_COMMENT_BODY_MAX = 8000

const SELECT = 'id, hot_fix_id, author_name, body, created_at, created_by'

export function mapHotFixCommentRow(row: HotFixCommentRow): HotFixComment {
  return {
    id: row.id,
    hotFixId: row.hot_fix_id,
    authorName: row.author_name,
    body: row.body,
    createdAt: row.created_at,
  }
}

/**
 * Bir maddenin yorumlarını eskiden yeniye döndürür.
 *
 * Sıra bilinçli olarak ARTAN: bu bir sohbet değil, soru-cevap dizisi — soru önce,
 * cevap sonra okunmalı.
 */
export async function listHotFixComments(hotFixId: string): Promise<HotFixComment[]> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('command_center_hot_fix_comments')
    .select(SELECT)
    .eq('hot_fix_id', hotFixId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (error || !data) return []
  return (data as HotFixCommentRow[]).map(mapHotFixCommentRow)
}

export interface CreateHotFixCommentResult {
  ok: boolean
  comment: HotFixComment | null
  message: string | null
}

/**
 * Yorum ekler.
 *
 * ⚠️ Gövde uzun olabilir (8000): burada tipik kullanım "10 soruyu tek seferde
 * yapıştırmak". Kısa bir sınır bu işi baştan bozardı.
 */
export async function createHotFixComment(
  hotFixId: string,
  authorName: string,
  body: string,
): Promise<CreateHotFixCommentResult> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    return { ok: false, comment: null, message: 'Bağlantı kurulamadı.' }
  }

  const trimmedBody = body.trim()
  if (!trimmedBody) {
    return { ok: false, comment: null, message: 'Yorum boş olamaz.' }
  }
  if (trimmedBody.length > HOT_FIX_COMMENT_BODY_MAX) {
    return {
      ok: false,
      comment: null,
      message: `Yorum en fazla ${HOT_FIX_COMMENT_BODY_MAX} karakter olabilir.`,
    }
  }

  // validateContent hata mesajı ya da null döner (boolean değil).
  const contentError = validateContent(trimmedBody)
  if (contentError) {
    return { ok: false, comment: null, message: contentError }
  }

  const trimmedAuthor = authorName.trim().slice(0, HOT_FIX_COMMENT_AUTHOR_MAX)

  const { data, error } = await supabase
    .from('command_center_hot_fix_comments')
    .insert({
      hot_fix_id: hotFixId,
      author_name: trimmedAuthor || 'Anonim',
      body: trimmedBody,
    })
    .select(SELECT)
    .single()

  if (error || !data) {
    return {
      ok: false,
      comment: null,
      message: toCommentErrorMessage(error, 'Yorum eklenemedi.'),
    }
  }

  return { ok: true, comment: mapHotFixCommentRow(data as HotFixCommentRow), message: null }
}

/** Yumuşak silme — kayıt durur, listede görünmez. */
export async function deleteHotFixComment(id: string): Promise<boolean> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return false

  const { error } = await supabase
    .from('command_center_hot_fix_comments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)

  return !error
}
