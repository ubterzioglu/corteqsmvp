// Birleşik Kaynak Merkezi (LinkManager) — form durumu ↔ `resource_entries`
// satır yükü dönüşümleri ve form doğrulaması. Buradaki her fonksiyon SAFTIR:
// React/DOM/Supabase bağımlılığı yoktur, bu yüzden bileşenden ayrı test edilebilir.
//
// ⚠️ `TablesInsert` / `TablesUpdate` dönüş tipleri BİLİNÇLİDİR. CLAUDE.md'de
// "A sınıfı" diye geçen (Supabase insert/update payload tipleme) tsc borcu
// 2026-09-13'te tam olarak bu açık tiplerle kapandı — gevşetip `any`/çıkarımlı
// nesneye çevirme, hata sınıfı geri gelir.

import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types'
import { sanitizeUrl, validateArgeFile, validateCvFile } from '@/lib/security'
import {
  requiresStoredFile,
  requiresUrl,
  type ResourceEntry,
  type ResourceFormState,
} from './resource-items'

/** Yüklenen dosyanın sonucu — hiç dosya yoksa üç alan da null gelir. */
export interface ResourceUploadOutcome {
  bucket: string | null
  storagePath: string | null
  fileName: string | null
}

export const RESOURCE_IMPORT_BATCH = 'dashboard-manual'

export function normalizeOptionalText(value: string): string | null {
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

export function buildTitleFromCv(formState: ResourceFormState): string {
  const fullName = `${formState.personFirstName} ${formState.personLastName}`.trim()
  return fullName || formState.title.trim() || 'CV Kaydı'
}

/** Var olan kaydı düzenleme formuna yükler (boş alanlar null yerine '' olur). */
export function resourceEntryToFormState(entry: ResourceEntry): ResourceFormState {
  return {
    section: entry.section,
    subsection: entry.subsection,
    recordKind: entry.recordKind,
    addedBy: entry.addedBy,
    title: entry.title,
    description: entry.description ?? '',
    url: entry.url ?? '',
    personFirstName: entry.personFirstName ?? '',
    personLastName: entry.personLastName ?? '',
    personRole: entry.personRole ?? '',
    linkedinUrl: entry.linkedinUrl ?? '',
    instagramUrl: entry.instagramUrl ?? '',
    websiteUrl: entry.websiteUrl ?? '',
  }
}

/** Kayıt türüne göre doğru dosya doğrulayıcısını seçer. */
export function validateResourceFile(state: ResourceFormState, file: File | null): string | null {
  if (!file) return 'Lütfen dosya seçin.'
  if (state.recordKind === 'CV') return validateCvFile(file)
  return validateArgeFile(file)
}

/** Yeni kayıt formu doğrulaması — ilk hatayı döner, sorun yoksa null. */
export function validateResourceCreate(state: ResourceFormState, file: File | null): string | null {
  const shared = validateResourceShared(state)
  if (shared) return shared
  if (requiresStoredFile(state)) return validateResourceFile(state, file)
  return null
}

/** Düzenleme formu doğrulaması — dosya alanı düzenlemede gösterilmez. */
export function validateResourceUpdate(state: ResourceFormState): string | null {
  return validateResourceShared(state)
}

function validateResourceShared(state: ResourceFormState): string | null {
  if (!state.section.trim() || !state.subsection.trim()) return 'Bölüm ve alt bölüm zorunlu.'
  if (requiresUrl(state) && !state.url.trim()) return 'Bu kayıt için URL zorunlu.'
  return null
}

export function buildResourceInsertPayload(
  formState: ResourceFormState,
  upload: ResourceUploadOutcome,
): TablesInsert<'resource_entries'> {
  const isCv = formState.recordKind === 'CV'
  const section = formState.section.trim()
  const subsection = formState.subsection.trim()

  return {
    section,
    subsection,
    department: section,
    record_kind: formState.recordKind,
    added_by: formState.addedBy,
    title: isCv ? buildTitleFromCv(formState) : formState.title.trim(),
    description: normalizeOptionalText(formState.description),
    url: requiresUrl(formState) ? sanitizeUrl(formState.url) : null,
    source_subfolder: subsection,
    source_folder: `${section} / ${subsection}`,
    import_batch: RESOURCE_IMPORT_BATCH,
    storage_bucket: upload.storagePath ? upload.bucket : null,
    storage_path: upload.storagePath,
    file_name: upload.storagePath ? upload.fileName : null,
    person_first_name: isCv ? normalizeOptionalText(formState.personFirstName) : null,
    person_last_name: isCv ? normalizeOptionalText(formState.personLastName) : null,
    person_role: isCv ? normalizeOptionalText(formState.personRole) : null,
    linkedin_url: isCv ? normalizeOptionalText(sanitizeUrl(formState.linkedinUrl)) : null,
    instagram_url: isCv ? normalizeOptionalText(sanitizeUrl(formState.instagramUrl)) : null,
    website_url: isCv ? normalizeOptionalText(sanitizeUrl(formState.websiteUrl)) : null,
  }
}

/**
 * Düzenleme yükü. URL gerektirmeyen kayıt türlerinde mevcut URL korunur
 * (`fallbackUrl` = düzenlenen satırın kayıtlı url'i), sıfırlanmaz.
 */
export function buildResourceUpdatePayload(
  editingState: ResourceFormState,
  fallbackUrl: string | null,
): TablesUpdate<'resource_entries'> {
  const isCv = editingState.recordKind === 'CV'
  const section = editingState.section.trim()
  const subsection = editingState.subsection.trim()

  return {
    section,
    subsection,
    department: section,
    record_kind: editingState.recordKind,
    added_by: editingState.addedBy,
    title: isCv ? buildTitleFromCv(editingState) : editingState.title.trim(),
    description: normalizeOptionalText(editingState.description),
    url: requiresUrl(editingState) ? sanitizeUrl(editingState.url) : fallbackUrl,
    source_subfolder: subsection,
    source_folder: `${section} / ${subsection}`,
    person_first_name: isCv ? normalizeOptionalText(editingState.personFirstName) : null,
    person_last_name: isCv ? normalizeOptionalText(editingState.personLastName) : null,
    person_role: isCv ? normalizeOptionalText(editingState.personRole) : null,
    linkedin_url: isCv ? normalizeOptionalText(sanitizeUrl(editingState.linkedinUrl)) : null,
    instagram_url: isCv ? normalizeOptionalText(sanitizeUrl(editingState.instagramUrl)) : null,
    website_url: isCv ? normalizeOptionalText(sanitizeUrl(editingState.websiteUrl)) : null,
  }
}
