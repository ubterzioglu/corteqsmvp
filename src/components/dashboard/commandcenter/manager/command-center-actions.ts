// Komuta Merkezi — yazma eylemleri (ekle / güncelle / sil / arşivle).
//
// Bunlar HOOK DEĞİLDİR: `useCommandCenterManager` her render'da bu fabrikayı
// çağırır ve kapanışlar o render'ın taze değerleriyle kurulur — eylemler eskiden
// de bileşen gövdesinde her render yeniden tanımlanıyordu, davranış aynıdır.
//
// Yenileme sırası bilinçlidir ve korunmalıdır:
//  - Silme/arşivlemede sayfada tek kayıt kaldıysa bir önceki sayfaya dönülür;
//    sayfa gerçekten değişiyorsa listeyi ELLE yenilemeyiz (sayfa değişimi zaten
//    `loadItems` bağımlılığını tetikler), aksi halde çift istek atılırdı.
//  - `handleDelete` `refreshFacets`i bilinçli olarak iki kez çağırır: rozetler
//    silme onaylanır onaylanmaz düşsün, kalan yenilemeler beklemesin diye.

import { FormEvent } from 'react'
import {
  archiveCommandCenterItem,
  createCommandCenterItem,
  deleteCommandCenterItem,
  updateCommandCenterItem,
  validateCommandCenterFormState,
  type CommandCenterFormState,
  type CommandCenterItem,
  type CommandCenterItemType,
} from '@/lib/dashboard/command-center-items'

export interface CommandCenterActionDeps {
  lockedItemType?: CommandCenterItemType
  formState: CommandCenterFormState
  editingState: CommandCenterFormState
  editingId: string | null
  items: CommandCenterItem[]
  currentPage: number
  setError: (value: string | null) => void
  setIsSubmitting: (value: boolean) => void
  setCurrentPage: (value: number) => void
  resetCreateForm: (itemType?: CommandCenterItemType) => void
  cancelEdit: () => void
  refreshFacets: () => Promise<void>
  loadItems: () => Promise<void>
  loadArchivedItems: () => Promise<void>
  loadDeletedItems: () => Promise<void>
}

export function createCommandCenterActions(deps: CommandCenterActionDeps) {
  const {
    lockedItemType,
    formState,
    editingState,
    editingId,
    items,
    currentPage,
    setError,
    setIsSubmitting,
    setCurrentPage,
    resetCreateForm,
    cancelEdit,
    refreshFacets,
    loadItems,
    loadArchivedItems,
    loadDeletedItems,
  } = deps

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = validateCommandCenterFormState(formState)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const created = await createCommandCenterItem(formState)
      if (!created) {
        throw new Error('Kayıt eklenemedi.')
      }

      resetCreateForm(lockedItemType ?? formState.itemType)
      await refreshFacets()
      await loadArchivedItems()

      if (currentPage !== 1) {
        setCurrentPage(1)
      } else {
        await loadItems()
      }
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Kayıt eklenemedi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUpdate(itemId: string) {
    const validationError = validateCommandCenterFormState(editingState)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const updated = await updateCommandCenterItem(itemId, editingState)
      if (!updated) {
        throw new Error('Kayıt güncellenemedi.')
      }

      cancelEdit()
      await refreshFacets()
      await loadArchivedItems()
      await loadItems()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Kayıt güncellenemedi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(itemId: string) {
    if (typeof window !== 'undefined' && !window.confirm('Bu kayıt silinsin mi?')) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const deleted = await deleteCommandCenterItem(itemId)
      if (!deleted) {
        throw new Error('Kayıt silinemedi.')
      }

      await refreshFacets()

      if (editingId === itemId) {
        cancelEdit()
      }

      const nextPage = items.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage
      await Promise.all([
        refreshFacets(),
        loadDeletedItems(),
        loadArchivedItems(),
      ])

      if (nextPage !== currentPage) {
        setCurrentPage(nextPage)
      } else {
        await loadItems()
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Kayıt silinemedi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleArchive(itemId: string) {
    if (typeof window !== 'undefined' && !window.confirm('Bu kayıt arşive taşınsın mı?')) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const archived = await archiveCommandCenterItem(itemId)
      if (!archived) {
        throw new Error('Kayıt arşivlenemedi.')
      }

      if (editingId === itemId) {
        cancelEdit()
      }

      const nextPage = items.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage
      await Promise.all([refreshFacets(), loadArchivedItems()])

      if (nextPage !== currentPage) {
        setCurrentPage(nextPage)
      } else {
        await loadItems()
      }
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : 'Kayıt arşivlenemedi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return { handleCreate, handleUpdate, handleDelete, handleArchive }
}
