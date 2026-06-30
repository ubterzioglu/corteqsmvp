// Maaş Hesaplama (Almanya) standalone tool sayfası — /relocation/tools/maas-hesaplama-almanya.
// RelocationToolPage bu bileşeni standalone registry üzerinden render eder (session motoru YOK).
import { MaasHesaplamaPanel } from "@/components/relocation/tools/germany/MaasHesaplamaPanel";

export default function MaasHesaplamaToolPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 text-center">
        <span className="mb-1 block text-3xl">💶</span>
        <h1 className="text-2xl font-extrabold text-foreground">Maaş Hesaplama (Almanya)</h1>
        <p className="text-sm text-muted-foreground">
          Brütten nete ve netten brüte — vergi sınıfı, eyalet, kilise vergisi ve sigortaya göre 2026 hesabı.
        </p>
      </div>
      <MaasHesaplamaPanel />
    </div>
  );
}
