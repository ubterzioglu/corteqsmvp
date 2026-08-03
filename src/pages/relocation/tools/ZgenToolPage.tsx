// ZGEN – Nesil Bulucu standalone tool sayfası — /tools/zgen-nesil-bulucu.
// RelocationToolPage bu bileşeni standalone-tools registry üzerinden render eder (session motoru YOK).
import { ZgenPanel } from "@/components/relocation/tools/zgen/ZgenPanel";

export default function ZgenToolPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 text-center">
        <span className="mb-1 block text-3xl">🧬</span>
        <h1 className="text-2xl font-extrabold text-foreground">ZGEN – Nesil Bulucu</h1>
        <p className="text-sm text-muted-foreground">
          Doğum yılını gir; hangi kuşaktan olduğunu, tipik özelliklerini ve diğer kuşaklarla nasıl
          geçineceğini öğren.
        </p>
      </div>
      <ZgenPanel />
    </div>
  );
}
