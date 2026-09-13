'use client'

// Birleşik Kaynak Merkezi (/admin/resources) — ekranın kabuğu.
//
// Bu dosya bilinçli olarak İNCEDİR: durum ve yan etkiler `useLinkManager`
// hook'unda, çizim alt bileşenlerde, saf mantık `@/lib/dashboard/resource-*`
// modüllerinde durur. Yeni bir bölüm eklerken buraya JSX yığmak yerine yeni bir
// alt bileşen aç.

import LinkManagerHeader from './LinkManagerHeader'
import ResourceFilterBar from './ResourceFilterBar'
import ResourceCreateForm from './ResourceCreateForm'
import ResourceEntryList from './ResourceEntryList'
import HiddenResourcesPanel from './HiddenResourcesPanel'
import { useLinkManager } from './useLinkManager'

const HEADING_ID = 'link-manager-heading'

export default function LinkManager() {
  const {
    entries,
    visibleEntries,
    hiddenEntries,
    isLoading,
    isSubmitting,
    isEditing,
    error,
    formState,
    editingId,
    editingState,
    expandedEntryIds,
    searchTerm,
    sectionFilter,
    selectedSubsection,
    sectionOptions,
    subsectionFilterOptions,
    hasActiveFilters,
    getSubsectionOptionsForSection,
    setSearchTerm,
    setSectionFilter,
    setSelectedSubsection,
    clearAllFilters,
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
  } = useLinkManager()

  return (
    <section className="space-y-4" aria-labelledby={HEADING_ID}>
      <LinkManagerHeader
        headingId={HEADING_ID}
        totalCount={entries.length}
        visibleCount={visibleEntries.length}
        hiddenCount={hiddenEntries.length}
      />

      <ResourceFilterBar
        sectionFilter={sectionFilter}
        sectionOptions={sectionOptions}
        selectedSubsection={selectedSubsection}
        subsectionFilterOptions={subsectionFilterOptions}
        searchTerm={searchTerm}
        hasActiveFilters={hasActiveFilters}
        onSectionFilterChange={setSectionFilter}
        onSubsectionFilterChange={setSelectedSubsection}
        onSearchTermChange={setSearchTerm}
        onClearFilters={clearAllFilters}
      />

      <ResourceCreateForm
        formState={formState}
        sectionOptions={sectionOptions}
        subsectionOptions={getSubsectionOptionsForSection(formState.section)}
        isSubmitting={isSubmitting}
        onChange={handleFormState}
        onFileChange={setSelectedFile}
        onSubmit={handleCreate}
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-xl border border-[rgba(66,133,244,0.1)] bg-white/80 p-6 text-center text-xs text-gray-400">
          Yükleniyor…
        </div>
      ) : (
        <>
          <ResourceEntryList
            entries={visibleEntries}
            editingId={editingId}
            editingState={editingState}
            expandedEntryIds={expandedEntryIds}
            isSubmitting={isSubmitting}
            isEditing={isEditing}
            sectionOptions={sectionOptions}
            getSubsectionOptionsForSection={getSubsectionOptionsForSection}
            onEditingChange={handleEditingState}
            onFileChange={setSelectedFile}
            onSaveEdit={(entry) => void handleUpdate(entry)}
            onCancelEdit={cancelEdit}
            onToggleDetails={toggleEntryDetails}
            onStartEdit={startEdit}
            onToggleHidden={(entry, nextHidden) => void handleToggleHidden(entry, nextHidden)}
            onOpenStoredFile={(entry, shouldDownload) =>
              void handleOpenStoredFile(entry, shouldDownload)
            }
            onDelete={(entry) => void handleDelete(entry)}
          />

          <HiddenResourcesPanel
            entries={hiddenEntries}
            isSubmitting={isSubmitting}
            onToggleHidden={(entry, nextHidden) => void handleToggleHidden(entry, nextHidden)}
          />
        </>
      )}
    </section>
  )
}
