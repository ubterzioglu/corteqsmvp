// Birleşik Kaynak Merkezi (LinkManager) — Supabase Storage erişimi.
// `resource-entries-api.ts` tablo satırlarını yönetir; dosyanın kendisi (yükleme,
// imzalı URL, temizlik) burada durur. Bileşende doğrudan storage çağrısı bırakma.

import { getSupabaseBrowserClient } from './supabase'

/** İmzalı URL ömrü (saniye) — davranış eskisiyle birebir aynı olsun diye 300. */
export const RESOURCE_SIGNED_URL_TTL_SECONDS = 300

/**
 * Dosyayı bucket'a yükler ve üretilen storage yolunu döner.
 * Dosya adı çakışmasın diye yol `crypto.randomUUID()` + orijinal uzantıdır.
 */
export async function uploadResourceFile(bucket: string, file: File): Promise<string | null> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return null

  const fileExt = file.name.split('.').pop()
  const filePath = `${crypto.randomUUID()}.${fileExt}`

  const { error } = await supabase.storage.from(bucket).upload(filePath, file)
  if (error) throw error

  return filePath
}

/**
 * Yüklenmiş dosyayı siler. Hata bilinçli olarak YUTULUR: tek çağıran, kayıt
 * eklenemediğinde yarım kalan yüklemeyi temizleyen catch bloğudur — oradaki
 * asıl hatanın üstüne yazmamalı.
 */
export async function removeResourceFile(bucket: string, path: string): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return

  await supabase.storage.from(bucket).remove([path])
}

/** Görüntüleme/indirme için kısa ömürlü imzalı URL üretir. */
export async function createResourceFileSignedUrl(
  bucket: string,
  path: string,
  expiresInSeconds: number = RESOURCE_SIGNED_URL_TTL_SECONDS,
): Promise<string> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) throw new Error('Dosya URL üretilemedi.')

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds)
  if (error || !data) throw error ?? new Error('Dosya URL üretilemedi.')

  return data.signedUrl
}
