import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KADRO_DEPTS, KADRO_AXES, KADRO_WAVES, KADRO_WORK_TYPES, KADRO_STATUSES, KADRO_PRIORITIES } from "@/lib/kadro/kadro-taxonomy";
import type { KadroResolvedRole } from "@/lib/kadro/kadro-types";
import { useKadroRoleDetail } from "@/hooks/kadro/useKadroRoleDetail";
import { KadroStateForm } from "./KadroStateForm";
import { KadroEventLog } from "./KadroEventLog";
import { KadroCandidateList } from "./KadroCandidateList";
import { X } from "lucide-react";

interface KadroRoleDrawerProps {
  role: KadroResolvedRole | null;
  onClose: () => void;
}

export function KadroRoleDrawer({ role, onClose }: KadroRoleDrawerProps) {
  const {
    events,
    candidates,
    isLoadingEvents,
    isLoadingCandidates,
    isSaving,
    saveState,
    createCandidate,
    updateCandidate,
    deleteCandidate,
  } = useKadroRoleDetail(role?.id ?? null);

  if (!role) return null;

  const dept = KADRO_DEPTS.find((d) => d.id === role.dept);
  const axis = KADRO_AXES.find((a) => a.id === role.axis);
  const wave = KADRO_WAVES.find((w) => w.id === role.wave);
  const workType = KADRO_WORK_TYPES[role.type];
  const status = KADRO_STATUSES[role.currentStatus];
  const priority = KADRO_PRIORITIES[role.currentPriority];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-end">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl h-full overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{role.title}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{role.id}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="px-6 py-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Rol Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Departman</div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {dept?.name ?? role.dept}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Eksen</div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {axis?.name ?? role.axis}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Dalga</div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {wave?.name ?? `Dalga ${role.wave}`}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Çalışma Tipi</div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {workType}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Durum</div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {status.label}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Öncelik</div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {priority.label}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Görev Tanımı</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {role.jd}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">KPI'lar</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1">
                {role.kpi.map((kpi, index) => (
                  <li key={index} className="text-sm text-slate-700 dark:text-slate-300">
                    {kpi}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Detaylar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Rapor Yöneticisi</div>
                <div className="text-sm text-slate-700 dark:text-slate-300">{role.reports}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Çalışma Saati</div>
                <div className="text-sm text-slate-700 dark:text-slate-300">{role.hours}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Ücret</div>
                <div className="text-sm text-slate-700 dark:text-slate-300">{role.pay}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">ESOP</div>
                <div className="text-sm text-slate-700 dark:text-slate-300">{role.esop}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Çalışma Düzeni</div>
                <div className="text-sm text-slate-700 dark:text-slate-300">{role.cadence}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Araçlar</div>
                <div className="text-sm text-slate-700 dark:text-slate-300">{role.tools}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Tetikleyici</div>
                <div className="text-sm text-slate-700 dark:text-slate-300">{role.trigger}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Çıkış Planı</div>
                <div className="text-sm text-slate-700 dark:text-slate-300">{role.exit}</div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="state" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="state">Durum Düzenle</TabsTrigger>
              <TabsTrigger value="candidates">Adaylar</TabsTrigger>
              <TabsTrigger value="history">Geçmiş</TabsTrigger>
            </TabsList>
            <TabsContent value="state" className="mt-4">
              <KadroStateForm role={role} onSave={saveState} isSaving={isSaving} />
            </TabsContent>
            <TabsContent value="candidates" className="mt-4">
              <KadroCandidateList
                candidates={candidates}
                isLoading={isLoadingCandidates}
                onCreate={createCandidate}
                onUpdate={updateCandidate}
                onDelete={deleteCandidate}
              />
            </TabsContent>
            <TabsContent value="history" className="mt-4">
              <KadroEventLog events={events} isLoading={isLoadingEvents} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
