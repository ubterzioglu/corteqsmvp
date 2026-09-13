// Komuta Merkezi — panonun durumu, yüklemeleri ve türetilmiş değerleri.
//
// ⚠️ Hook SIRASI görünümden ayrılırken birebir korunmuştur (useState → useMemo →
// useEffect/useCallback). Sırayı değiştirmek React'in hook eşleşmesini bozar;
// yeni bir hook eklerken mevcut satırların arasına girme, sona ekle.
//
// Yükleme mantığı bilinçlidir: filtre seçenekleri, rozetler ve kaynak dökümü TEK
// facet sorgusundan türer — kategori/tip değişiminde yeni istek atılmaz.
// Yazma eylemleri hook değildir, `command-center-actions.ts` içindedir.

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  buildCommandCenterCategoryOptions,
  buildCommandCenterDateGroupOptions,
  buildCommandCenterItemCounts,
  buildCommandCenterSourceBreakdown,
  createEmptyCommandCenterFormState,
  fetchArchivedCommandCenterItems,
  fetchCommandCenterFacets,
  fetchDeletedCommandCenterItems,
  fetchCommandCenterItems,
  toCommandCenterFormState,
  type CommandCenterFacetRow,
  type CommandCenterFormState,
  type CommandCenterItem,
  type CommandCenterItemType,
} from '@/lib/dashboard/command-center-items'
import { createCommandCenterActions } from './command-center-actions'
import { createDefaultFormState } from './formatters'
import { isSupportedPageSize, readStoredPageSize, storePageSize } from './page-size'

export function useCommandCenterManager(lockedItemType?: CommandCenterItemType) {
  const [items, setItems] = useState<CommandCenterItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedAssignee, setSelectedAssignee] = useState<string>('Tümü')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedDateGroup, setSelectedDateGroup] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('Tümü')
  const [selectedPriority, setSelectedPriority] = useState<string>('Tümü')
  const [searchTerm, setSearchTerm] = useState('')
  const [urgentOnly, setUrgentOnly] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(readStoredPageSize)
  const [totalCount, setTotalCount] = useState(0)
  const [archivedItems, setArchivedItems] = useState<CommandCenterItem[]>([])
  const [deletedItems, setDeletedItems] = useState<CommandCenterItem[]>([])
  const [facets, setFacets] = useState<CommandCenterFacetRow[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formState, setFormState] = useState<CommandCenterFormState>(() =>
    createDefaultFormState(lockedItemType)
  )
  const [editingState, setEditingState] = useState<CommandCenterFormState>(() =>
    createEmptyCommandCenterFormState()
  )
  const activeItemType = lockedItemType

  // Filtre seçenekleri, kaynak dökümü ve rozet sayıları tek facet sorgusundan türetilir —
  // kategori değişiminde yeni istek atılmaz.
  const categoryOptions = useMemo(
    () => buildCommandCenterCategoryOptions(facets, { itemType: activeItemType }),
    [facets, activeItemType]
  )
  const dateGroupOptions = useMemo(
    () =>
      buildCommandCenterDateGroupOptions(facets, {
        itemType: activeItemType,
        topCategory: selectedCategory,
      }),
    [facets, activeItemType, selectedCategory]
  )
  const itemCounts = useMemo(() => buildCommandCenterItemCounts(facets), [facets])
  const sourceBreakdown = useMemo(() => buildCommandCenterSourceBreakdown(facets), [facets])

  useEffect(() => {
    if (lockedItemType) {
      setFormState(createDefaultFormState(lockedItemType, lockedItemType))
    }
  }, [lockedItemType])

  const loadItems = useCallback(async function loadItems() {
    setIsLoading((current) => current && items.length === 0)
    setIsPageLoading(items.length > 0)
    setError(null)

    try {
      const result = await fetchCommandCenterItems({
        page: currentPage,
        pageSize,
        itemType: activeItemType,
        assignee: selectedAssignee,
        topCategory: selectedCategory,
        status: selectedStatus,
        priority: selectedPriority === 'Tümü' ? undefined : Number(selectedPriority),
        urgentOnly,
        dateGroup: selectedDateGroup,
        searchTerm,
      })
      setItems(result.items)
      setTotalCount(result.totalCount)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Command center kayıtları yüklenemedi.'
      )
    } finally {
      setIsLoading(false)
      setIsPageLoading(false)
    }
  }, [
    activeItemType,
    currentPage,
    items.length,
    pageSize,
    searchTerm,
    selectedAssignee,
    selectedCategory,
    selectedDateGroup,
    selectedPriority,
    selectedStatus,
    urgentOnly,
  ])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  const loadDeletedItems = useCallback(async function loadDeletedItems() {
    try {
      const deleted = await fetchDeletedCommandCenterItems({
        itemType: activeItemType,
      })
      setDeletedItems(deleted)
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Silinmiş kayıtlar yüklenemedi.'
      )
    }
  }, [activeItemType])

  useEffect(() => {
    void loadDeletedItems()
  }, [loadDeletedItems])

  const refreshFacets = useCallback(async function refreshFacets() {
    const nextFacets = await fetchCommandCenterFacets()
    setFacets(nextFacets)
  }, [])

  const loadArchivedItems = useCallback(async function loadArchivedItems() {
    try {
      const archived = await fetchArchivedCommandCenterItems({
        itemType: activeItemType,
      })
      setArchivedItems(archived)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Arşiv kayıtları yüklenemedi.')
    }
  }, [activeItemType])

  useEffect(() => {
    void loadArchivedItems()
  }, [loadArchivedItems])

  useEffect(() => {
    void refreshFacets()
  }, [refreshFacets])

  function resetCreateForm(itemType?: CommandCenterItemType) {
    setFormState(createDefaultFormState(lockedItemType, itemType))
  }

  function startEdit(item: CommandCenterItem) {
    setEditingId(item.id)
    setEditingState(toCommandCenterFormState(item))
    setError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingState(createEmptyCommandCenterFormState())
  }

  const { handleCreate, handleUpdate, handleDelete, handleArchive } =
    createCommandCenterActions({
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
    })

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const rangeEnd = Math.min(currentPage * pageSize, totalCount)

  function handlePageSizeChange(nextPageSize: number) {
    if (!isSupportedPageSize(nextPageSize) || nextPageSize === pageSize) {
      return
    }

    setPageSize(nextPageSize)
    storePageSize(nextPageSize)
    setCurrentPage(1)
  }

  function goToPreviousPage() {
    setCurrentPage((page) => Math.max(1, page - 1))
  }

  function goToNextPage() {
    setCurrentPage((page) => Math.min(totalPages, page + 1))
  }

  // Her filtre değişimi ilk sayfaya döner — aksi halde 7. sayfadayken daraltılan
  // bir filtre boş sayfa gösterirdi.
  function changeAssignee(value: string) {
    setSelectedAssignee(value)
    setCurrentPage(1)
  }

  function changeCategory(value: string) {
    setSelectedCategory(value)
    setCurrentPage(1)
  }

  function changeDateGroup(value: string) {
    setSelectedDateGroup(value)
    setCurrentPage(1)
  }

  function changeStatus(value: string) {
    setSelectedStatus(value)
    setCurrentPage(1)
  }

  function changePriority(value: string) {
    setSelectedPriority(value)
    setCurrentPage(1)
  }

  function changeUrgentOnly(value: boolean) {
    setUrgentOnly(value)
    setCurrentPage(1)
  }

  function changeSearchTerm(value: string) {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const activeItems = items.filter((item) => item.status !== 'Tamamlandi')
  const completedItems = items.filter((item) => item.status === 'Tamamlandi')
  const hasActiveFilter =
    Boolean(searchTerm) ||
    Boolean(selectedCategory) ||
    Boolean(selectedDateGroup) ||
    selectedAssignee !== 'Tümü' ||
    selectedStatus !== 'Tümü' ||
    selectedPriority !== 'Tümü' ||
    urgentOnly

  return {
    isLoading,
    isPageLoading,
    isSubmitting,
    error,
    formState,
    setFormState,
    editingId,
    editingState,
    setEditingState,
    activeItems,
    completedItems,
    archivedItems,
    deletedItems,
    categoryOptions,
    dateGroupOptions,
    itemCounts,
    sourceBreakdown,
    selectedAssignee,
    selectedCategory,
    selectedDateGroup,
    selectedStatus,
    selectedPriority,
    searchTerm,
    urgentOnly,
    hasActiveFilter,
    totalCount,
    currentPage,
    totalPages,
    pageSize,
    rangeStart,
    rangeEnd,
    startEdit,
    cancelEdit,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleArchive,
    handlePageSizeChange,
    goToPreviousPage,
    goToNextPage,
    changeAssignee,
    changeCategory,
    changeDateGroup,
    changeStatus,
    changePriority,
    changeUrgentOnly,
    changeSearchTerm,
  }
}
