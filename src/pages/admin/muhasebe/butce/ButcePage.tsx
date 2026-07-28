// src/pages/admin/muhasebe/butce/ButcePage.tsx
// Bütçe sekmesi — container: yıl seçici, CSV indirme, iç-sekme yönetimi, autosave.

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useButceYear, useDebouncedButceSave } from '@/hooks/useMuhasebeButce';
import { downloadButceCsv } from '@/lib/muhasebe-butce-csv';
import { BUTCE_YEARS, DEPTS, type ButceYearState } from '@/lib/muhasebe-butce-schemas';
import { DepartmentBudgetPanel } from '@/pages/admin/muhasebe/butce/DepartmentBudgetPanel';
import { RevenuePanel } from '@/pages/admin/muhasebe/butce/RevenuePanel';
import { ConsolidatedCashflowPanel } from '@/pages/admin/muhasebe/butce/ConsolidatedCashflowPanel';

export default function ButcePage(): JSX.Element {
  const [year, setYear] = useState<string>(BUTCE_YEARS[0]);
  const [activeTab, setActiveTab] = useState<string>(DEPTS[0].id);
  const [localState, setLocalState] = useState<ButceYearState | null>(null);

  const yearNum = Number(year);
  const { data: fetchedState, isLoading } = useButceYear(yearNum);
  const { save, status } = useDebouncedButceSave(yearNum);

  // Yıl değişince yerel taslağı temizle ki aşağıdaki senkronizasyon yeni yılın
  // verisiyle yeniden doldursun.
  useEffect(() => {
    setLocalState(null);
  }, [yearNum]);

  // localState boşken (ilk yükleme veya yıl değişimi sonrası) sunucudan gelen
  // veriyle senkronize et. Guard `localState === null`e dayanır, `fetchedState`
  // referans kimliğine değil — bazı hook implementasyonları (ör. test mock'ları)
  // her render'da yeni bir obje döndürebilir; bu, `[fetchedState]` bağımlılığıyla
  // sonsuz render döngüsüne yol açardı.
  useEffect(() => {
    if (fetchedState && localState === null) setLocalState(fetchedState);
  }, [fetchedState, localState]);

  function handleChange(next: ButceYearState) {
    setLocalState(next);
    save(next);
  }

  if (isLoading || !localState) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Yükleniyor...</div>;
  }

  const saveLabel = status === 'saving' ? 'kaydediliyor…' : status === 'saved' ? 'kaydedildi' : status === 'error' ? 'kayıt hatası' : '·';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bütçe Konsolu</h1>
          <p className="text-sm text-muted-foreground">Departman bazlı yıllık bütçe, alokasyon ve nakit akışı planlaması</p>
        </div>
        <div className="flex-1" />
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-28" aria-label="Yıl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BUTCE_YEARS.map((y) => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => downloadButceCsv(year, localState)}>
          <Download className="h-4 w-4 mr-2" aria-hidden="true" />
          CSV indir
        </Button>
        <span className="text-xs font-mono text-muted-foreground">{saveLabel}</span>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto">
          {DEPTS.map((d) => (
            <TabsTrigger key={d.id} value={d.id}>{d.name}</TabsTrigger>
          ))}
          <TabsTrigger value="rev">Gelirler</TabsTrigger>
          <TabsTrigger value="cons">Konsolide</TabsTrigger>
        </TabsList>

        {DEPTS.map((d) => (
          <TabsContent key={d.id} value={d.id}>
            <DepartmentBudgetPanel deptId={d.id} state={localState} onChange={handleChange} />
          </TabsContent>
        ))}
        <TabsContent value="rev">
          <RevenuePanel state={localState} onChange={handleChange} />
        </TabsContent>
        <TabsContent value="cons">
          <ConsolidatedCashflowPanel state={localState} onChange={handleChange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
