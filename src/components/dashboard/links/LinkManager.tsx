'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ChevronDown,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import AccordionCard from '@/components/dashboard/AccordionCard'
import { getSupabaseBrowserClient } from '@/lib/dashboard/supabase'
import { safeHref, sanitizeError, sanitizeUrl, validateArgeFile, validateCvFile } from '@/lib/security'
import {
  createEmptyResourceFormState,
  getResourceSectionFromQuery,
  getStorageBucket,
  mapResourceEntryRow,
  requiresStoredFile,
  requiresUrl,
  RESOURCE_ADDED_BY,
  RESOURCE_RECORD_KINDS,
  type ResourceEntry,
  type ResourceEntryRow,
  type ResourceFormState,
  type ResourceSectionFilter,
  type ResourceSubsectionFilter,
} from '@/lib/dashboard/resource-items'

const INPUT_CLS =
  'w-full rounded-xl border border-[rgba(66,133,244,0.15)] bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

const BTN_CLS =
  'inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all disabled:opacity-60'
const ICON_BTN_CLS =
  'inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors disabled:opacity-60'

const FILTER_BTN_CLS =
  'rounded-full border px-3 py-2 text-xs font-semibold tracking-wide transition-all'

const SELECT_FIELDS =
  'id, order_no, slug, section, subsection, department, record_kind, added_by, title, description, url, file_id, file_type, mime_type, privacy_level, is_public_import, import_suggestion, tags, source_path, status, is_hidden, storage_bucket, storage_path, file_name, person_first_name, person_last_name, person_role, linkedin_url, instagram_url, website_url, source_folder, source_subfolder, source_snapshot_date, import_batch, created_at'

function normalizeOptionalText(value: string): string | null {
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

function buildTitleFromCv(formState: ResourceFormState): string {
  const fullName = `${formState.personFirstName} ${formState.personLastName}`.trim()
  return fullName || formState.title.trim() || 'CV Kaydı'
}

export default function LinkManager() {
  const [searchParams] = useSearchParams()
  const [entries, setEntries] = useState<ResourceEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formState, setFormState] = useState<ResourceFormState>(createEmptyResourceFormState)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedEntryIds, setExpandedEntryIds] = useState<Set<string>>(new Set())
  const [editingState, setEditingState] = useState<ResourceFormState>(createEmptyResourceFormState)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set())
  const [selectedSubsection, setSelectedSubsection] = useState<ResourceSubsectionFilter>('all')

  const supabase = getSupabaseBrowserClient()
  const isEditing = editingId !== null

  const loadEntries = useCallback(async () => {
    if (!supabase) {
      setError('Supabase bağlantısı yapılandırılmamış.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchErr } = await supabase
        .from('resource_entries')
        .select(SELECT_FIELDS)
        .order('created_at', { ascending: false })

      if (fetchErr) throw fetchErr

      setEntries((data as ResourceEntryRow[]).map(mapResourceEntryRow))
    } catch (loadError) {
      setError(sanitizeError(loadError, 'Kayıtlar yüklenemedi.'))
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    void loadEntries()
  }, [loadEntries])

  useEffect(() => {
    const section = getResourceSectionFromQuery(searchParams.get('section') ?? undefined)
    if (section !== 'all') {
      setSelectedSections(new Set([section]))
    }
  }, [searchParams])

  const sectionFilter: ResourceSectionFilter = useMemo(() => {
    if (selectedSections.size !== 1) return 'all'
    return Array.from(selectedSections)[0] ?? 'all'
  }, [selectedSections])

  function setSectionFilter(nextFilter: ResourceSectionFilter) {
    setSelectedSections(nextFilter === 'all' ? new Set() : new Set([nextFilter]))
    setSelectedSubsection('all')
  }

  const sectionOptions = useMemo(() => {
    const options = new Set<string>(['Genel'])
    for (const entry of entries) {
      if (entry.section) options.add(entry.section)
    }
    if (formState.section) options.add(formState.section)
    if (editingState.section) options.add(editingState.section)
    return Array.from(options).sort((a, b) => a.localeCompare(b, 'tr'))
  }, [editingState.section, entries, formState.section])

  const subsectionOptionsBySection = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const entry of entries) {
      if (!entry.section || !entry.subsection) continue
      if (!map.has(entry.section)) map.set(entry.section, [])
      const current = map.get(entry.section) ?? []
      if (!current.includes(entry.subsection)) current.push(entry.subsection)
      map.set(entry.section, current)
    }

    for (const [key, values] of map.entries()) {
      values.sort((a, b) => a.localeCompare(b, 'tr'))
      map.set(key, values)
    }

    return map
  }, [entries])

  const subsectionFilterOptions = useMemo(() => {
    if (sectionFilter === 'all') {
      const all = new Set<string>()
      for (const list of subsectionOptionsBySection.values()) {
        for (const value of list) all.add(value)
      }
      return Array.from(all).sort((a, b) => a.localeCompare(b, 'tr'))
    }

    return subsectionOptionsBySection.get(sectionFilter) ?? []
  }, [sectionFilter, subsectionOptionsBySection])

  const getSubsectionOptionsForSection = useCallback(
    (section: string) => subsectionOptionsBySection.get(section) ?? [],
    [subsectionOptionsBySection],
  )

  const matchesFilters = useCallback(
    (entry: ResourceEntry) => {
      const matchesSection = selectedSections.size === 0 || selectedSections.has(entry.section)
      const matchesSubsection = selectedSubsection === 'all' || entry.subsection === selectedSubsection

      const term = searchTerm.toLowerCase().trim()
      const matchesSearch =
        term === '' ||
        entry.title.toLowerCase().includes(term) ||
        (entry.description?.toLowerCase().includes(term) ?? false) ||
        entry.section.toLowerCase().includes(term) ||
        entry.subsection.toLowerCase().includes(term) ||
        (entry.fileName?.toLowerCase().includes(term) ?? false) ||
        (entry.personFirstName?.toLowerCase().includes(term) ?? false) ||
        (entry.personLastName?.toLowerCase().includes(term) ?? false) ||
        (entry.personRole?.toLowerCase().includes(term) ?? false)

      return matchesSection && matchesSubsection && matchesSearch
    },
    [searchTerm, selectedSections, selectedSubsection],
  )

  const visibleEntries = useMemo(
    () => entries.filter((entry) => !entry.isHidden).filter(matchesFilters),
    [entries, matchesFilters],
  )

  const hiddenEntries = useMemo(
    () => entries.filter((entry) => entry.isHidden).filter(matchesFilters),
    [entries, matchesFilters],
  )

  const hasActiveFilters = selectedSections.size > 0 || selectedSubsection !== 'all' || searchTerm.trim() !== ''

  function clearAllFilters() {
    setSelectedSections(new Set())
    setSelectedSubsection('all')
    setSearchTerm('')
  }

  useEffect(() => {
    if (selectedSubsection === 'all') return
    if (subsectionFilterOptions.includes(selectedSubsection)) return
    setSelectedSubsection('all')
  }, [selectedSubsection, subsectionFilterOptions])

  function handleFormState<K extends keyof ResourceFormState>(key: K, value: ResourceFormState[K]) {
    setFormState((state) => ({ ...state, [key]: value }))
  }

  function handleEditingState<K extends keyof ResourceFormState>(key: K, value: ResourceFormState[K]) {
    setEditingState((state) => ({ ...state, [key]: value }))
  }

  function validateSelectedFile(nextState: ResourceFormState, file: File | null): string | null {
    if (!file) return 'Lütfen dosya seçin.'
    if (nextState.recordKind === 'CV') return validateCvFile(file)
    return validateArgeFile(file)
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) {
      setError('Supabase bağlantısı yapılandırılmamış.')
      return
    }

    const needsUrl = requiresUrl(formState)
    const needsStoredFile = requiresStoredFile(formState)
    const bucket = getStorageBucket(formState)

    if (!formState.section.trim() || !formState.subsection.trim()) {
      setError('Bölüm ve alt bölüm zorunlu.')
      return
    }

    if (needsUrl && !formState.url.trim()) {
      setError('Bu kayıt için URL zorunlu.')
      return
    }

    if (needsStoredFile) {
      const fileError = validateSelectedFile(formState, selectedFile)
      if (fileError) {
        setError(fileError)
        return
      }
    }

    setIsSubmitting(true)
    setError(null)

    let uploadedStoragePath: string | null = null

    try {
      if (needsStoredFile && selectedFile && bucket) {
        const fileExt = selectedFile.name.split('.').pop()
        const filePath = `${crypto.randomUUID()}.${fileExt}`
        const { error: uploadErr } = await supabase.storage.from(bucket).upload(filePath, selectedFile)
        if (uploadErr) throw uploadErr
        uploadedStoragePath = filePath
      }

      const payload = {
        section: formState.section.trim(),
        subsection: formState.subsection.trim(),
        department: formState.section.trim(),
        record_kind: formState.recordKind,
        added_by: formState.addedBy,
        title: formState.recordKind === 'CV' ? buildTitleFromCv(formState) : formState.title.trim(),
        description: normalizeOptionalText(formState.description),
        url: needsUrl ? sanitizeUrl(formState.url) : null,
        source_subfolder: formState.subsection.trim(),
        source_folder: `${formState.section.trim()} / ${formState.subsection.trim()}`,
        storage_bucket: uploadedStoragePath ? bucket : null,
        storage_path: uploadedStoragePath,
        file_name: uploadedStoragePath ? selectedFile?.name ?? null : null,
        person_first_name: formState.recordKind === 'CV' ? normalizeOptionalText(formState.personFirstName) : null,
        person_last_name: formState.recordKind === 'CV' ? normalizeOptionalText(formState.personLastName) : null,
        person_role: formState.recordKind === 'CV' ? normalizeOptionalText(formState.personRole) : null,
        linkedin_url: formState.recordKind === 'CV' ? normalizeOptionalText(sanitizeUrl(formState.linkedinUrl)) : null,
        instagram_url: formState.recordKind === 'CV' ? normalizeOptionalText(sanitizeUrl(formState.instagramUrl)) : null,
        website_url: formState.recordKind === 'CV' ? normalizeOptionalText(sanitizeUrl(formState.websiteUrl)) : null,
      }

      const { data, error: insertErr } = await supabase
        .from('resource_entries')
        .insert(payload)
        .select(SELECT_FIELDS)
        .single()

      if (insertErr || !data) throw insertErr ?? new Error('Kayıt eklenemedi.')

      setEntries((prev) => [mapResourceEntryRow(data as ResourceEntryRow), ...prev])
      setFormState(createEmptyResourceFormState())
      setSelectedFile(null)
    } catch (createError) {
      if (uploadedStoragePath && bucket) {
        await supabase.storage.from(bucket).remove([uploadedStoragePath])
      }
      setError(sanitizeError(createError, 'Kayıt eklenemedi.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  function startEdit(entry: ResourceEntry) {
    setEditingId(entry.id)
    setEditingState({
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
    })
    setError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingState(createEmptyResourceFormState())
  }

  async function handleUpdate(entry: ResourceEntry) {
    if (!supabase) return

    const needsUrl = requiresUrl(editingState)

    if (!editingState.section.trim() || !editingState.subsection.trim()) {
      setError('Bölüm ve alt bölüm zorunlu.')
      return
    }

    if (needsUrl && !editingState.url.trim()) {
      setError('Bu kayıt için URL zorunlu.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const payload = {
        section: editingState.section.trim(),
        subsection: editingState.subsection.trim(),
        department: editingState.section.trim(),
        record_kind: editingState.recordKind,
        added_by: editingState.addedBy,
        title: editingState.recordKind === 'CV' ? buildTitleFromCv(editingState) : editingState.title.trim(),
        description: normalizeOptionalText(editingState.description),
        url: needsUrl ? sanitizeUrl(editingState.url) : entry.url,
        source_subfolder: editingState.subsection.trim(),
        source_folder: `${editingState.section.trim()} / ${editingState.subsection.trim()}`,
        person_first_name: editingState.recordKind === 'CV' ? normalizeOptionalText(editingState.personFirstName) : null,
        person_last_name: editingState.recordKind === 'CV' ? normalizeOptionalText(editingState.personLastName) : null,
        person_role: editingState.recordKind === 'CV' ? normalizeOptionalText(editingState.personRole) : null,
        linkedin_url: editingState.recordKind === 'CV' ? normalizeOptionalText(sanitizeUrl(editingState.linkedinUrl)) : null,
        instagram_url: editingState.recordKind === 'CV' ? normalizeOptionalText(sanitizeUrl(editingState.instagramUrl)) : null,
        website_url: editingState.recordKind === 'CV' ? normalizeOptionalText(sanitizeUrl(editingState.websiteUrl)) : null,
      }

      const { data, error: updateErr } = await supabase
        .from('resource_entries')
        .update(payload)
        .eq('id', entry.id)
        .select(SELECT_FIELDS)
        .single()

      if (updateErr || !data) throw updateErr ?? new Error('Kayıt güncellenemedi.')

      setEntries((prev) => prev.map((item) => (item.id === entry.id ? mapResourceEntryRow(data as ResourceEntryRow) : item)))
      cancelEdit()
    } catch (updateError) {
      setError(sanitizeError(updateError, 'Kayıt güncellenemedi.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(entry: ResourceEntry) {
    if (!supabase) return
    if (typeof window !== 'undefined' && !window.confirm('Bu kayıt silinsin mi?')) return

    setIsSubmitting(true)
    setError(null)

    try {
      if (entry.storageBucket && entry.storagePath) {
        const { error: storageErr } = await supabase.storage.from(entry.storageBucket).remove([entry.storagePath])
        if (storageErr) throw storageErr
      }

      const { error: deleteErr } = await supabase.from('resource_entries').delete().eq('id', entry.id)
      if (deleteErr) throw deleteErr

      setEntries((prev) => prev.filter((item) => item.id !== entry.id))
      if (editingId === entry.id) cancelEdit()
    } catch (deleteError) {
      setError(sanitizeError(deleteError, 'Kayıt silinemedi.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleToggleHidden(entry: ResourceEntry, nextHidden: boolean) {
    if (!supabase) return

    setIsSubmitting(true)
    setError(null)

    try {
      const { data, error: updateErr } = await supabase
        .from('resource_entries')
        .update({ is_hidden: nextHidden })
        .eq('id', entry.id)
        .select(SELECT_FIELDS)
        .single()

      if (updateErr || !data) throw updateErr ?? new Error('Kayıt güncellenemedi.')
      setEntries((prev) => prev.map((item) => (item.id === entry.id ? mapResourceEntryRow(data as ResourceEntryRow) : item)))
    } catch (toggleError) {
      setError(sanitizeError(toggleError, 'Kayıt güncellenemedi.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  function toggleEntryDetails(entryId: string) {
    setExpandedEntryIds((current) => {
      const next = new Set(current)
      if (next.has(entryId)) next.delete(entryId)
      else next.add(entryId)
      return next
    })
  }

  async function handleOpenStoredFile(entry: ResourceEntry, shouldDownload: boolean) {
    if (!supabase || !entry.storageBucket || !entry.storagePath) return

    try {
      const { data, error: signedErr } = await supabase.storage
        .from(entry.storageBucket)
        .createSignedUrl(entry.storagePath, 300)

      if (signedErr || !data) throw signedErr ?? new Error('Dosya URL üretilemedi.')

      if (shouldDownload) {
        const anchor = document.createElement('a')
        anchor.href = data.signedUrl
        anchor.download = entry.fileName ?? entry.title
        anchor.click()
        return
      }

      window.open(data.signedUrl, '_blank')
    } catch (fileError) {
      setError(sanitizeError(fileError, 'Dosya açılamadı.'))
    }
  }

  function renderFormFields(state: ResourceFormState, mode: 'create' | 'edit') {
    const stateSetter = mode === 'create' ? handleFormState : handleEditingState
    const isCv = state.recordKind === 'CV'
    const isGeneralFile = state.recordKind === 'Dosya' && state.section !== 'ARGE'
    const needsUpload = requiresStoredFile(state)
    const subsectionOptions = getSubsectionOptionsForSection(state.section)

    return (
      <>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Bölüm</span>
          <select
            value={state.section}
            onChange={(event) => {
              stateSetter('section', event.target.value)
              stateSetter('subsection', '')
            }}
            className={INPUT_CLS}
            required
          >
            {sectionOptions.map((section) => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Alt Bölüm</span>
          <select
            value={state.subsection}
            onChange={(event) => stateSetter('subsection', event.target.value)}
            className={INPUT_CLS}
            required
          >
            <option value="" disabled>
              Alt bölüm seçin
            </option>
            {subsectionOptions.map((subsection) => (
              <option key={subsection} value={subsection}>
                {subsection}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Kayıt Türü</span>
          <select
            value={state.recordKind}
            onChange={(event) => stateSetter('recordKind', event.target.value)}
            className={INPUT_CLS}
          >
            {RESOURCE_RECORD_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {kind}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Ekleyen</span>
          <select
            value={state.addedBy}
            onChange={(event) => stateSetter('addedBy', event.target.value)}
            className={INPUT_CLS}
          >
            {RESOURCE_ADDED_BY.map((person) => (
              <option key={person} value={person}>
                {person}
              </option>
            ))}
          </select>
        </label>

        {!isCv && (
          <label className="space-y-2 sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Başlık</span>
            <input
              type="text"
              value={state.title}
              onChange={(event) => stateSetter('title', event.target.value)}
              placeholder="Kayıt başlığı"
              className={INPUT_CLS}
              required
            />
          </label>
        )}

        <label className={`space-y-2 ${isCv ? '' : 'sm:col-span-2'}`}>
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            {isCv ? 'Açıklama / Not' : 'Açıklama'}
          </span>
          <input
            type="text"
            value={state.description}
            onChange={(event) => stateSetter('description', event.target.value)}
            placeholder={isCv ? 'Aday hakkında not' : 'Kısa açıklama'}
            className={INPUT_CLS}
          />
        </label>

        {isCv && (
          <>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">İsim</span>
              <input
                type="text"
                value={state.personFirstName}
                onChange={(event) => stateSetter('personFirstName', event.target.value)}
                placeholder="İsim"
                className={INPUT_CLS}
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Soyisim</span>
              <input
                type="text"
                value={state.personLastName}
                onChange={(event) => stateSetter('personLastName', event.target.value)}
                placeholder="Soyisim"
                className={INPUT_CLS}
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Rol</span>
              <input
                type="text"
                value={state.personRole}
                onChange={(event) => stateSetter('personRole', event.target.value)}
                placeholder="Pozisyon"
                className={INPUT_CLS}
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">LinkedIn</span>
              <input
                type="url"
                value={state.linkedinUrl}
                onChange={(event) => stateSetter('linkedinUrl', event.target.value)}
                placeholder="https://linkedin.com/in/..."
                className={INPUT_CLS}
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Instagram</span>
              <input
                type="url"
                value={state.instagramUrl}
                onChange={(event) => stateSetter('instagramUrl', event.target.value)}
                placeholder="https://instagram.com/..."
                className={INPUT_CLS}
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Website</span>
              <input
                type="url"
                value={state.websiteUrl}
                onChange={(event) => stateSetter('websiteUrl', event.target.value)}
                placeholder="https://ornek.com"
                className={INPUT_CLS}
              />
            </label>
          </>
        )}

        {requiresUrl(state) && (
          <label className={`${isGeneralFile ? 'sm:col-span-2' : 'sm:col-span-2'} space-y-2`}>
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              {isGeneralFile ? 'Dosya Linki' : 'URL'}
            </span>
            <input
              type="url"
              value={state.url}
              onChange={(event) => stateSetter('url', event.target.value)}
              placeholder="https://..."
              className={INPUT_CLS}
              required
            />
          </label>
        )}

        {needsUpload && mode === 'create' && (
          <label className="space-y-2 sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Dosya</span>
            <input
              type="file"
              accept={state.recordKind === 'CV' ? '.pdf,.doc,.docx' : '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.svg,.webp,.zip,.rar,.7z,.txt,.csv,.md,.json'}
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              className={INPUT_CLS}
              required
            />
          </label>
        )}
      </>
    )
  }

  return (
    <section className="space-y-4" aria-labelledby="link-manager-heading">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[rgba(66,133,244,0.1)] bg-white px-3 py-2">
        <h2 id="link-manager-heading" className="text-sm font-semibold text-gray-900">
          Birleşik Kaynak Merkezi
        </h2>
        <a
          href={safeHref('https://drive.google.com/drive/folders/1TYFEdjDPOLOMWAf_MScs6XJXRW9FHh-r?usp=drive_link')}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-lg border border-primary-200 bg-primary-50 px-2.5 py-1 text-[11px] font-semibold text-primary-700 hover:bg-primary-100"
        >
          <ExternalLink size={12} aria-hidden="true" />
          Drive Dosya Klasör Linki
        </a>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium text-gray-600">
        <p>Son Güncelleme Tarihi : 24.05.26</p>
        <p>Dosya Sayısı : {entries.length} (Aktif: {visibleEntries.length} | Gizli: {hiddenEntries.length})</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-4">
        <div className="docs-surface p-3 sm:p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-600">Bölüm Filtresi</p>
          <select
            className={`${INPUT_CLS} mt-2 h-9 py-1.5 text-xs`}
            value={sectionFilter}
            onChange={(event) => setSectionFilter(event.target.value as ResourceSectionFilter)}
          >
            <option value="all">Tümü</option>
            {sectionOptions.map((section) => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
          </select>
        </div>

        <div className="docs-surface p-3 sm:p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-600">Alt Bölüm Filtresi</p>
          <select
            className={`${INPUT_CLS} mt-2 h-9 py-1.5 text-xs`}
            value={selectedSubsection}
            onChange={(event) => setSelectedSubsection(event.target.value as ResourceSubsectionFilter)}
          >
            <option value="all">Tümü</option>
            {subsectionFilterOptions.map((subsection) => (
              <option key={subsection} value={subsection}>
                {subsection}
              </option>
            ))}
          </select>
        </div>

        <div className="docs-surface p-3 sm:p-4 lg:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-600">Arama</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <label className="relative w-full">
              <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className={`${INPUT_CLS} h-9 py-1.5 pl-8 text-xs`}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Başlık, açıklama, bölüm, alt bölüm"
              />
            </label>
            <button
              type="button"
              onClick={clearAllFilters}
              disabled={!hasActiveFilters}
              className={`${FILTER_BTN_CLS} whitespace-nowrap border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 hover:border-primary-200 hover:text-primary-700`}
            >
              Temizle
            </button>
          </div>
        </div>
      </div>

      <AccordionCard
        items={[
          {
            id: 'new-resource',
            title: 'Yeni Kayıt Ekle',
            accentColor: '#1A6DC2',
            children: (
              <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {renderFormFields(formState, 'create')}
                <div className="flex items-end sm:col-span-2 lg:col-span-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
                  >
                    {requiresStoredFile(formState) ? <Upload size={16} className="mr-1 inline" aria-hidden="true" /> : <Plus size={16} className="mr-1 inline" aria-hidden="true" />}
                    {isSubmitting ? 'Kaydediliyor...' : 'Kaydı oluştur'}
                  </button>
                </div>
              </form>
            ),
          },
        ]}
      />

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

      {isLoading ? (
        <div className="rounded-xl border border-[rgba(66,133,244,0.1)] bg-white/80 p-6 text-center text-xs text-gray-400">Yükleniyor…</div>
      ) : (
        <>
          <div className="space-y-1.5">
            {visibleEntries.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-center text-xs text-gray-500">
                Aktif listede kayıt bulunamadı.
              </div>
            ) : (
              visibleEntries.map((entry) => {
                const rowIsEditing = editingId === entry.id
                const state = rowIsEditing ? editingState : null

                if (rowIsEditing && state) {
                  return (
                    <div key={entry.id} className="rounded-xl border border-[rgba(66,133,244,0.1)] bg-white p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-700">Düzenleme: {entry.title}</p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => void handleUpdate(entry)}
                            disabled={isSubmitting}
                            className={`${BTN_CLS} border border-green-200 bg-green-50 px-2.5 py-1.5 text-[11px] text-green-700 hover:bg-green-100`}
                          >
                            <Save size={12} aria-hidden="true" />
                            Kaydet
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={isSubmitting}
                            className={`${BTN_CLS} border border-gray-200 px-2.5 py-1.5 text-[11px] text-gray-600 hover:text-gray-800`}
                          >
                            <X size={12} aria-hidden="true" />
                            İptal
                          </button>
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{renderFormFields(state, 'edit')}</div>
                    </div>
                  )
                }

                const isExpanded = expandedEntryIds.has(entry.id)

                return (
                  <div key={entry.id} className="rounded-xl border border-[rgba(66,133,244,0.1)] bg-white px-3 py-2 shadow-[0_4px_10px_rgba(60,64,67,0.03)]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="rounded-full border border-primary-200 bg-primary-50 px-2 py-0.5 font-semibold text-primary-700">{entry.section}</span>
                          <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700">{entry.subsection || '-'}</span>
                          <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 font-semibold text-gray-600">{entry.recordKind}</span>
                          {entry.url ? (
                            <a
                              href={safeHref(entry.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="URL aç"
                              aria-label="URL aç"
                              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
                            >
                              <ExternalLink size={10} aria-hidden="true" />
                            </a>
                          ) : null}
                        </div>
                        <p className="mt-1 truncate text-xs text-gray-900">
                          <span className="font-medium">{entry.title}</span>
                          {entry.description ? <span className="font-normal text-gray-500"> — {entry.description}</span> : null}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleEntryDetails(entry.id)}
                          disabled={isSubmitting}
                          title={isExpanded ? 'Detayı kapat' : 'Detayı aç'}
                          aria-label={isExpanded ? 'Detayı kapat' : 'Detayı aç'}
                          className={`${ICON_BTN_CLS} border-gray-200 bg-white text-gray-600 hover:bg-gray-50`}
                        >
                          <ChevronDown
                            size={13}
                            aria-hidden="true"
                            className="transition-transform"
                            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(entry)}
                          disabled={isSubmitting || isEditing}
                          title="Düzenle"
                          aria-label="Düzenle"
                          className={`${ICON_BTN_CLS} border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200`}
                        >
                          <Pencil size={13} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleToggleHidden(entry, true)}
                          disabled={isSubmitting}
                          title="Gizle"
                          aria-label="Gizle"
                          className={`${ICON_BTN_CLS} border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100`}
                        >
                          <EyeOff size={13} aria-hidden="true" />
                        </button>
                        {entry.storageBucket && entry.storagePath ? (
                          <>
                            <button
                              type="button"
                              onClick={() => void handleOpenStoredFile(entry, false)}
                              title="Görüntüle"
                              aria-label="Görüntüle"
                              className={`${ICON_BTN_CLS} border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100`}
                            >
                              <Eye size={13} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleOpenStoredFile(entry, true)}
                              title="İndir"
                              aria-label="İndir"
                              className={`${ICON_BTN_CLS} border-green-200 bg-green-50 text-green-700 hover:bg-green-100`}
                            >
                              <Download size={13} aria-hidden="true" />
                            </button>
                          </>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void handleDelete(entry)}
                          disabled={isSubmitting}
                          title="Sil"
                          aria-label="Sil"
                          className={`${ICON_BTN_CLS} border-red-200 bg-red-50 text-red-600 hover:bg-red-100`}
                        >
                          <Trash2 size={13} aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    {isExpanded ? (
                      <div className="mt-2 grid gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2 text-[11px] text-gray-700 md:grid-cols-2">
                        <p><span className="font-semibold text-gray-800">Açıklama:</span> {entry.description ?? '-'}</p>
                        <p><span className="font-semibold text-gray-800">Ekleyen:</span> {entry.addedBy}</p>
                        <p><span className="font-semibold text-gray-800">Dosya Adı:</span> {entry.fileName ?? '-'}</p>
                        <p><span className="font-semibold text-gray-800">Kayıt Türü:</span> {entry.recordKind}</p>
                      </div>
                    ) : null}
                  </div>
                )
              })
            )}
          </div>

          <AccordionCard
            className="mt-3"
            items={[
              {
                id: 'hidden-resources',
                title: 'Gizlenmiş Dosyalar',
                badge: String(hiddenEntries.length),
                accentColor: '#8B5CF6',
                children: hiddenEntries.length === 0 ? (
                  <p className="text-xs text-gray-500">Gizlenmiş kayıt yok.</p>
                ) : (
                  <div className="space-y-1.5">
                    {hiddenEntries.map((entry) => (
                      <div key={`hidden-${entry.id}`} className="rounded-lg border border-violet-100 bg-violet-50/30 px-3 py-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                              <span className="rounded-full border border-violet-200 bg-violet-100 px-2 py-0.5 font-semibold text-violet-700">{entry.section}</span>
                              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700">{entry.subsection || '-'}</span>
                            </div>
                            <p className="mt-1 truncate text-xs text-gray-900">
                              <span className="font-medium">{entry.title}</span>
                              {entry.description ? <span className="font-normal text-gray-500"> — {entry.description}</span> : null}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleToggleHidden(entry, false)}
                            disabled={isSubmitting}
                            title="Göster"
                            aria-label="Göster"
                            className={`${ICON_BTN_CLS} border-violet-200 bg-white text-violet-700 hover:bg-violet-100`}
                          >
                            <Eye size={13} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ),
              },
            ]}
          />
        </>
      )}
    </section>
  )
}
