// Backward-compat wrapper — Admin Panel V2 (Faz 2).
// Gerçek implementasyon: src/components/admin/shell/AdminShell.tsx
//
// ⚠️ Yeni kodda SOMUT modülü import et (`@/components/admin/shell/AdminShell`,
// `.../admin-accent` gibi), toplu bir barrel'den DEĞİL. Eskiden burada
// "@/components/admin/shell" barrel'ini öneren bir not vardı; o barrel S09'da
// silindi çünkü hiçbir şey onu kullanmıyordu ve en çok kullanılan shell modülünü
// (`admin-accent`) zaten ihraç etmiyordu — yani öneri gerçeği yansıtmıyordu.
// Bu panel ağır biçimde `lazy()` ile bölünüyor; toplu barrel kod bölmeyi de bozar.
export { default } from "@/components/admin/shell/AdminShell";
export { useAdminOutletContext } from "@/components/admin/shell/AdminShell";
export type { AdminOutletContext } from "@/components/admin/shell/AdminShell";
