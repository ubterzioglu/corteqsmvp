'use client'

// Komuta Merkezi — ekran kabuğu.
// Tüm durum ve eylemler `useCommandCenterManager` içindedir; bu dosya yalnız
// kartların SIRASINI ve yerleşimini tutar. Sıra kullanıcıya doğrudan yansır:
// rehber → kaynaklar → rozetler → hot fix → yeni kayıt → filtreler → liste →
// tamamlananlar → arşiv → silinmişler.

import { AlertTriangle } from 'lucide-react'
import AccordionCard from '@/components/dashboard/AccordionCard'
import type { CommandCenterItemType } from '@/lib/dashboard/command-center-items'
import HotFixPanel from '../HotFixPanel'
import ArchivedItemsList from './ArchivedItemsList'
import CommandCenterCountsBar from './CommandCenterCountsBar'
import CommandCenterCreateForm from './CommandCenterCreateForm'
import CommandCenterFilterBar from './CommandCenterFilterBar'
import CommandCenterItemsTable from './CommandCenterItemsTable'
import CommandCenterPagination from './CommandCenterPagination'
import DeletedItemsList from './DeletedItemsList'
import SourceBreakdownList from './SourceBreakdownList'
import { COMMAND_CENTER_GUIDE_ITEMS } from './guide-items'
import { useCommandCenterManager } from './useCommandCenterManager'

interface CommandCenterManagerProps {
  title?: string
  description?: string
  compatibilityMessage?: string
  lockedItemType?: CommandCenterItemType
}

export default function CommandCenterManager({
  title = 'Command Center',
  description = 'Todo ve toplantı kayıtlarını tek merkezden yönetin.',
  compatibilityMessage,
  lockedItemType,
}: CommandCenterManagerProps) {
  const manager = useCommandCenterManager(lockedItemType)

  return (
    <section className="space-y-6" aria-labelledby="command-center-heading">
      <AccordionCard
        items={[
          {
            id: 'command-center-guide',
            title: title || 'Command Center',
            accentColor: '#1A6DC2',
            children: (
              <div className="space-y-4">
                {description ? <p className="text-sm text-gray-500">{description}</p> : null}
                <div className="rounded-2xl border border-[rgba(66,133,244,0.08)] bg-[rgba(66,133,244,0.03)] p-4">
                  <ol className="grid gap-2 text-sm text-gray-700 md:grid-cols-2">
                    {COMMAND_CENTER_GUIDE_ITEMS.map((item, index) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                          {index + 1}
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ),
          },
        ]}
      />

      <AccordionCard
        items={[
          {
            id: 'command-center-sources',
            title: 'Kayıt Kaynakları',
            badge: String(manager.sourceBreakdown.total),
            accentColor: '#8B5CF6',
            children: <SourceBreakdownList breakdown={manager.sourceBreakdown} />,
          },
        ]}
      />

      <CommandCenterCountsBar counts={manager.itemCounts} />

      {/*
        TOP 10 HOT FIX yalnız tam Komuta Merkezi ekranında görünür. Todo ve Toplantı Notları
        sayfaları da bu bileşeni kullanıyor (lockedItemType ile); aynı 10 maddelik liste üç ekranda
        birden tekrarlanmasın diye orada gizlenir.
      */}
      {!lockedItemType && <HotFixPanel />}

      {compatibilityMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>{compatibilityMessage}</p>
        </div>
      )}

      <AccordionCard
        items={[
          {
            id: 'new-command-center-item',
            title: 'Yeni Kayıt Ekle',
            accentColor: '#1A6DC2',
            children: (
              <CommandCenterCreateForm
                formState={manager.formState}
                setFormState={manager.setFormState}
                isSubmitting={manager.isSubmitting}
                onSubmit={manager.handleCreate}
              />
            ),
          },
        ]}
      />

      {manager.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {manager.error}
        </div>
      )}

      <CommandCenterFilterBar
        selectedAssignee={manager.selectedAssignee}
        onAssigneeChange={manager.changeAssignee}
        selectedCategory={manager.selectedCategory}
        onCategoryChange={manager.changeCategory}
        categoryOptions={manager.categoryOptions}
        selectedDateGroup={manager.selectedDateGroup}
        onDateGroupChange={manager.changeDateGroup}
        dateGroupOptions={manager.dateGroupOptions}
        selectedStatus={manager.selectedStatus}
        onStatusChange={manager.changeStatus}
        selectedPriority={manager.selectedPriority}
        onPriorityChange={manager.changePriority}
        urgentOnly={manager.urgentOnly}
        onUrgentOnlyChange={manager.changeUrgentOnly}
        searchTerm={manager.searchTerm}
        onSearchTermChange={manager.changeSearchTerm}
      />

      <div className="space-y-4">
        {manager.isLoading ? (
          <div className="rounded-2xl border border-[rgba(66,133,244,0.1)] bg-white/80 p-8 text-center text-sm text-gray-400">
            Yükleniyor…
          </div>
        ) : manager.totalCount === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
            {manager.hasActiveFilter
              ? 'Filtreye uygun kayıt bulunamadı.'
              : 'Henüz kayıt yok. Yukarıdaki formu kullanarak ilk kaydı ekleyin.'}
          </div>
        ) : (
          <>
            {manager.isPageLoading && (
              <div className="rounded-2xl border border-[rgba(66,133,244,0.08)] bg-[rgba(66,133,244,0.03)] px-4 py-3 text-sm text-gray-500">
                Sayfa verileri yenileniyor…
              </div>
            )}

            {manager.activeItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
                Bu sayfadaki tüm kayıtlar tamamlandı. Tamamlanan görevleri aşağıdaki bölümden görüntüleyebilirsiniz.
              </div>
            ) : (
              <CommandCenterItemsTable
                items={manager.activeItems}
                editingId={manager.editingId}
                editingState={manager.editingState}
                setEditingState={manager.setEditingState}
                isSubmitting={manager.isSubmitting}
                onStartEdit={manager.startEdit}
                onCancelEdit={manager.cancelEdit}
                onUpdate={manager.handleUpdate}
                onArchive={manager.handleArchive}
                onDelete={manager.handleDelete}
              />
            )}

            <CommandCenterPagination
              rangeStart={manager.rangeStart}
              rangeEnd={manager.rangeEnd}
              totalCount={manager.totalCount}
              pageSize={manager.pageSize}
              onPageSizeChange={manager.handlePageSizeChange}
              currentPage={manager.currentPage}
              totalPages={manager.totalPages}
              isPageLoading={manager.isPageLoading}
              onPreviousPage={manager.goToPreviousPage}
              onNextPage={manager.goToNextPage}
            />
          </>
        )}

        {!manager.isLoading && (
          <div className="space-y-4">
            <AccordionCard
              items={[
                {
                  id: 'completed-command-center-items',
                  title: 'Tamamlanan Görevler',
                  badge: String(manager.completedItems.length),
                  accentColor: '#4CAF50',
                  children:
                    manager.completedItems.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-green-200 bg-white/80 p-6 text-center text-sm text-gray-500">
                        Tamamlanan kayıt yok.
                      </div>
                    ) : (
                      <CommandCenterItemsTable
                        items={manager.completedItems}
                        editingId={manager.editingId}
                        editingState={manager.editingState}
                        setEditingState={manager.setEditingState}
                        isSubmitting={manager.isSubmitting}
                        onStartEdit={manager.startEdit}
                        onCancelEdit={manager.cancelEdit}
                        onUpdate={manager.handleUpdate}
                        onArchive={manager.handleArchive}
                        onDelete={manager.handleDelete}
                      />
                    ),
                },
              ]}
              className="border-green-100 bg-green-50/30"
            />

            <AccordionCard
              items={[
                {
                  id: 'archived-command-center-items',
                  title: 'Arşivlenen Kayıtlar',
                  badge: String(manager.archivedItems.length),
                  accentColor: '#D97706',
                  children: <ArchivedItemsList items={manager.archivedItems} />,
                },
              ]}
              className="border-amber-100 bg-amber-50/30"
            />

            <AccordionCard
              items={[
                {
                  id: 'deleted-command-center-items',
                  title: 'Silinmiş Görevler',
                  badge: String(manager.deletedItems.length),
                  accentColor: '#DC2626',
                  children: <DeletedItemsList items={manager.deletedItems} />,
                },
              ]}
              className="border-red-100 bg-red-50/30"
            />
          </div>
        )}
      </div>
    </section>
  )
}
