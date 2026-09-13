'use client'

// Komuta Merkezi yöneticisi — ince BARREL.
//
// Gerçek bileşen ve parçaları `manager/` altındadır; bu dosya yalnız varsayılan
// dışa aktarımı korur, böylece hiçbir import yolu değişmez
// (`@/components/dashboard/commandcenter/CommandCenterManager`). Üç ekran bu
// bileşeni kullanır: /admin/command-center (tam), Todo ve Toplantı Notları
// (lockedItemType ile daraltılmış).
//
// Parçalar:
//   manager/CommandCenterManager.tsx   — ekran kabuğu, kart sırası
//   manager/useCommandCenterManager.ts — tüm durum, yükleme ve eylemler
//   manager/CommandCenterCreateForm    — "Yeni Kayıt Ekle" formu
//   manager/CommandCenterFilterBar     — filtre çubuğu
//   manager/CommandCenterCountsBar     — rozet sayıları
//   manager/CommandCenterPagination    — sayfalama
//   manager/CommandCenterItemsTable    — liste kabuğu (+ satır/kart parçaları)
//   manager/ArchivedItemsList          — arşiv listesi
//   manager/DeletedItemsList           — silinmişler listesi
//   manager/SourceBreakdownList        — "Kayıt Kaynakları" kartı
//   manager/cells.tsx                  — ortak rozet/avatar/hücre parçaları
//   manager/styles.ts · formatters.ts · page-size.ts · guide-items.ts

export { default } from './manager/CommandCenterManager'
