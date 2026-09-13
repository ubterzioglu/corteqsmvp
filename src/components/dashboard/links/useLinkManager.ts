'use client'

// Birleşik Kaynak Merkezi ekranının durumu ve yan etkileri. Bileşen ağacı
// (LinkManager.tsx + alt bileşenler) yalnız çizim yapar; veri erişimi
// `@/lib/dashboard/resource-*` modüllerindedir.
//
// Bu hook KAYIT durumunu (liste + form + CRUD) tutar; filtre durumu ayrı bir
// hook'tadır (`useResourceFilters`), çünkü filtreleme hiçbir şey yazmaz.

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { getSupabaseBrowserClient } from '@/lib/dashboard/supabase'
import { sanitizeError } from '@/lib/security'
import {
  createEmptyResourceFormState,
  getStorageBucket,
  requiresStoredFile,
  type ResourceEntry,
  type ResourceFormState,
} from '@/lib/dashboard/resource-items'
import {
  createResourceEntry,
  deleteResourceEntry,
  listResourceEntries,
  updateResourceEntry,
} from '@/lib/dashboard/resource-entries-api'
import {
  buildResourceInsertPayload,
  buildResourceUpdatePayload,
  resourceEntryToFormState,
  validateResourceCreate,
  validateResourceUpdate,
} from '@/lib/dashboard/resource-form-payload'
import {
  createResourceFileSignedUrl,
  removeResourceFile,
  uploadResourceFile,
} from '@/lib/dashboard/resource-storage'
import { useResourceFilters, type ResourceFiltersController } from './useResourceFilters'

export type ResourceFormMode = 'create' | 'edit'

export type ResourceFieldSetter = <K extends keyof ResourceFormState>(
  key: K,
  value: ResourceFormState[K],
) => void

export interface LinkManagerController extends ResourceFiltersController {
  entries: ResourceEntry[]
  isLoading: boolean
  isSubmitting: boolean
  isEditing: boolean
  error: string | null
  formState: ResourceFormState
  editingId: string | null
  editingState: ResourceFormState
  expandedEntryIds: Set<string>
  setSelectedFile: (file: File | null) => void
  handleFormState: ResourceFieldSetter
  handleEditingState: ResourceFieldSetter
  handleCreate: (event: FormEvent<HTMLFormElement>) => Promise<void>
  startEdit: (entry: ResourceEntry) => void
  cancelEdit: () => void
  handleUpdate: (entry: ResourceEntry) => Promise<void>
  handleDelete: (entry: ResourceEntry) => Promise<void>
  handleToggleHidden: (entry: ResourceEntry, nextHidden: boolean) => Promise<void>
  toggleEntryDetails: (entryId: string) => void
  handleOpenStoredFile: (entry: ResourceEntry, shouldDownload: boolean) => Promise<void>
}

export function useLinkManager(): LinkManagerController {
  const [entries, setEntries] = useState<ResourceEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formState, setFormState] = useState<ResourceFormState>(createEmptyResourceFormState)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedEntryIds, setExpandedEntryIds] = useState<Set<string>>(new Set())
  const [editingState, setEditingState] = useState<ResourceFormState>(createEmptyResourceFormState)

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
      setEntries(await listResourceEntries())
    } catch (loadError) {
      setError(sanitizeError(loadError, 'Kayıtlar yüklenemedi.'))
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    void loadEntries()
  }, [loadEntries])

  const filters = useResourceFilters(entries, formState.section, editingState.section)

  const handleFormState = useCallback<ResourceFieldSetter>((key, value) => {
    setFormState((state) => ({ ...state, [key]: value }))
  }, [])

  const handleEditingState = useCallback<ResourceFieldSetter>((key, value) => {
    setEditingState((state) => ({ ...state, [key]: value }))
  }, [])

  const cancelEdit = useCallback(() => {
    setEditingId(null)
    setEditingState(createEmptyResourceFormState())
  }, [])

  const startEdit = useCallback((entry: ResourceEntry) => {
    setEditingId(entry.id)
    setEditingState(resourceEntryToFormState(entry))
    setError(null)
  }, [])

  const handleCreate = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!supabase) {
        setError('Supabase bağlantısı yapılandırılmamış.')
        return
      }

      const validationError = validateResourceCreate(formState, selectedFile)
      if (validationError) {
        setError(validationError)
        return
      }

      const bucket = getStorageBucket(formState)
      const needsStoredFile = requiresStoredFile(formState)

      setIsSubmitting(true)
      setError(null)

      let uploadedStoragePath: string | null = null

      try {
        if (needsStoredFile && selectedFile && bucket) {
          uploadedStoragePath = await uploadResourceFile(bucket, selectedFile)
        }

        const created = await createResourceEntry(
          buildResourceInsertPayload(formState, {
            bucket,
            storagePath: uploadedStoragePath,
            fileName: selectedFile?.name ?? null,
          }),
        )
        if (!created) throw new Error('Kayıt eklenemedi.')

        setEntries((prev) => [created, ...prev])
        setFormState(createEmptyResourceFormState())
        setSelectedFile(null)
      } catch (createError) {
        // Kayıt yazılamadıysa yüklenmiş dosya öksüz kalmasın.
        if (uploadedStoragePath && bucket) {
          await removeResourceFile(bucket, uploadedStoragePath)
        }
        setError(sanitizeError(createError, 'Kayıt eklenemedi.'))
      } finally {
        setIsSubmitting(false)
      }
    },
    [formState, selectedFile, supabase],
  )

  const handleUpdate = useCallback(
    async (entry: ResourceEntry) => {
      if (!supabase) return

      const validationError = validateResourceUpdate(editingState)
      if (validationError) {
        setError(validationError)
        return
      }

      setIsSubmitting(true)
      setError(null)

      try {
        const updated = await updateResourceEntry(
          entry.id,
          buildResourceUpdatePayload(editingState, entry.url),
        )
        if (!updated) throw new Error('Kayıt güncellenemedi.')

        setEntries((prev) => prev.map((item) => (item.id === entry.id ? updated : item)))
        cancelEdit()
      } catch (updateError) {
        setError(sanitizeError(updateError, 'Kayıt güncellenemedi.'))
      } finally {
        setIsSubmitting(false)
      }
    },
    [cancelEdit, editingState, supabase],
  )

  const handleDelete = useCallback(
    async (entry: ResourceEntry) => {
      if (!supabase) return
      if (typeof window !== 'undefined' && !window.confirm('Bu kayıt silinsin mi?')) return

      setIsSubmitting(true)
      setError(null)

      try {
        await deleteResourceEntry(entry)

        setEntries((prev) => prev.filter((item) => item.id !== entry.id))
        if (editingId === entry.id) cancelEdit()
      } catch (deleteError) {
        setError(sanitizeError(deleteError, 'Kayıt silinemedi.'))
      } finally {
        setIsSubmitting(false)
      }
    },
    [cancelEdit, editingId, supabase],
  )

  const handleToggleHidden = useCallback(
    async (entry: ResourceEntry, nextHidden: boolean) => {
      if (!supabase) return

      setIsSubmitting(true)
      setError(null)

      try {
        const updated = await updateResourceEntry(entry.id, { is_hidden: nextHidden })
        if (!updated) throw new Error('Kayıt güncellenemedi.')
        setEntries((prev) => prev.map((item) => (item.id === entry.id ? updated : item)))
      } catch (toggleError) {
        setError(sanitizeError(toggleError, 'Kayıt güncellenemedi.'))
      } finally {
        setIsSubmitting(false)
      }
    },
    [supabase],
  )

  const toggleEntryDetails = useCallback((entryId: string) => {
    setExpandedEntryIds((current) => {
      const next = new Set(current)
      if (next.has(entryId)) next.delete(entryId)
      else next.add(entryId)
      return next
    })
  }, [])

  const handleOpenStoredFile = useCallback(
    async (entry: ResourceEntry, shouldDownload: boolean) => {
      if (!supabase || !entry.storageBucket || !entry.storagePath) return

      try {
        const signedUrl = await createResourceFileSignedUrl(entry.storageBucket, entry.storagePath)

        if (shouldDownload) {
          const anchor = document.createElement('a')
          anchor.href = signedUrl
          anchor.download = entry.fileName ?? entry.title
          anchor.click()
          return
        }

        window.open(signedUrl, '_blank')
      } catch (fileError) {
        setError(sanitizeError(fileError, 'Dosya açılamadı.'))
      }
    },
    [supabase],
  )

  return {
    ...filters,
    entries,
    isLoading,
    isSubmitting,
    isEditing,
    error,
    formState,
    editingId,
    editingState,
    expandedEntryIds,
    setSelectedFile,
    handleFormState,
    handleEditingState,
    handleCreate,
    startEdit,
    cancelEdit,
    handleUpdate,
    handleDelete,
    handleToggleHidden,
    toggleEntryDetails,
    handleOpenStoredFile,
  }
}
