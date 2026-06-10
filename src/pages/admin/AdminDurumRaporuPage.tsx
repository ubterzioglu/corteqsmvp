import { useEffect, useState } from "react";
import { AdminPageShell, AdminStatsGrid } from "@/components/admin/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileText,
  Layers,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

// ── Live status metrics (from get_rebuild_status_report RPC) ──────────────────
interface StatusReport {
  generated_at: string;
  roles_total: number;
  roles_active: number;
  legacy_roles: number;
  afs_attributes: number;
  afs_features: number;
  afs_sections: number;
  role_attributes: number;
  role_features: number;
  role_sections: number;
  catalog_items_total: number;
  placeholders: number;
  item_role_links: number;
  items_without_primary_role: number;
  legacy_tables_remaining: number;
  family_columns_remaining: number;
  old_table_names_remaining: number;
}

// Expected targets for the rebuild (used to color metrics green/red).
const TARGETS = {
  roles_total: 76,
  legacy_roles: 0,
  afs_attributes: 53,
  afs_features: 42,
  afs_sections: 7,
  placeholders: 76,
  legacy_tables_remaining: 0,
  family_columns_remaining: 0,
  old_table_names_remaining: 0,
} as const;

// ── Phase / report summaries (static — mirrors docs/catalog-role-afs-rebuild/00-14) ──
interface ReportSummary {
  id: string;
  title: string;
  summary: string;
}

const REPORTS: ReportSummary[] = [
  { id: "00", title: "Preflight Uzlaştırma", summary: "İki tutarsızlık çözüldü: rol sayısı 82→76 (6 legacy çıkarıldı), attribute '55' başlık hatası → gerçek 53. Push-blocker'lar temizlendi." },
  { id: "01", title: "Mevcut Sistem Denetimi", summary: "~45 tablo, ~100 RPC, 62 trigger, ~80 RLS politikası envanteri. Legacy teardown hedefleri belirlendi." },
  { id: "02", title: "Flat Rol Envanteri", summary: "76 bağımsız flat rol + silinecek 6 legacy rol. Rol ailesi/parent-child YOK." },
  { id: "03", title: "AFS Katalog Envanteri", summary: "53 attribute / 42 feature / 7 section. Normalizasyon-mükerrer çiftleri haritalandı (silinmedi)." },
  { id: "04", title: "Rol↔AFS Matrisi", summary: "Canlı matris %100 uniform: her rol aynı 24 attr / 30 feat / 7 section. Option A ile aynen üretildi." },
  { id: "05", title: "Yeni Veritabanı Tasarımı", summary: "Rename stratejisi: 9 tablo yeni isimlere; family kolonları kaldırıldı; catalog_item_roles eklendi." },
  { id: "06", title: "ER Diyagramı", summary: "CATALOG ITEMS → FLAT ROLES → (Attributes, Features, Sections). Family/parent yok." },
  { id: "07", title: "Backend Entegrasyonu", summary: "44+ DB fonksiyonu rename edilmiş tablolara rewire edildi (010c programatik + 010d/010e elle onarım)." },
  { id: "08", title: "Frontend Entegrasyonu", summary: "Frontend zaten flat çalışıyordu; .from() ve embedded-join referansları yeni isimlere güncellendi; types.ts yenilendi." },
  { id: "09", title: "Admin Menü/Guide/Infogram", summary: "Admin Veritabanı menüsü + new-member guide + infogram family'den arındırıldı, flat'e güncellendi." },
  { id: "10", title: "Legacy Cleanup Manifest", summary: "Drop edilenler: 6 legacy rol, catalog_item_types + item_type_*, role_taxonomy_rules, ilgili FK'lar. Satellite'ler korundu." },
  { id: "11", title: "E2E / Test Raporu", summary: "DB verify PASSED; build PASS; 287/288 unit test geçti (1 alakasız UI-nav fail)." },
  { id: "12", title: "Migration Push", summary: "18 rebuild migration Management API ile prod'a uygulandı. Prod-only FK blocker'ları için 016 iteratif güçlendirildi." },
  { id: "13", title: "Cleanup Grep", summary: "Runtime'da 0 eski tablo ismi + 0 rol-family kavramı. Landing submissions kategorileri bilinçli istisna." },
  { id: "14", title: "Değişen Dosyalar", summary: "19 migration, ~20 src dosyası, infogram, 15 rapor. catalog_items.title & managers.role rename'leri geri alındı." },
];

const MetricCard = ({
  label,
  value,
  target,
  invert = false,
}: {
  label: string;
  value: number | undefined;
  target?: number;
  invert?: boolean;
}) => {
  const ok =
    target === undefined
      ? true
      : invert
        ? value === target
        : value === target;
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-2xl font-bold tabular-nums">
        {value ?? "—"}
        {target !== undefined && (
          <span className="ml-2 text-xs font-normal text-muted-foreground">/ {target}</span>
        )}
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
        {target !== undefined &&
          (ok ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          ))}
        {label}
      </div>
    </div>
  );
};

const AdminDurumRaporuPage = () => {
  const { toast } = useToast();
  const [report, setReport] = useState<StatusReport | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_rebuild_status_report");
      if (error) throw error;
      setReport(data as unknown as StatusReport);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Durum raporu alınamadı";
      toast({ title: "Hata", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allGreen =
    report &&
    report.roles_total === TARGETS.roles_total &&
    report.legacy_roles === 0 &&
    report.afs_attributes === TARGETS.afs_attributes &&
    report.afs_features === TARGETS.afs_features &&
    report.afs_sections === TARGETS.afs_sections &&
    report.placeholders === TARGETS.placeholders &&
    report.legacy_tables_remaining === 0 &&
    report.family_columns_remaining === 0 &&
    report.old_table_names_remaining === 0;

  return (
    <AdminPageShell
      title="Catalog / Flat-Role / AFS Rebuild — Durum Raporu"
      description="Rol ailesi sistemi kaldırıldı; tekil flat roller + AFS (Attributes / Features / Sections) mimarisi canlıda. Aşağıdaki metrikler veritabanından gerçek zamanlı çekilir."
      icon={ShieldCheck}
      accent="emerald"
      actions={
        <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Yenile
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Overall status banner */}
        {report && (
          <Card className={allGreen ? "border-emerald-500/40 bg-emerald-500/5" : "border-amber-500/40 bg-amber-500/5"}>
            <CardContent className="flex items-center gap-3 py-4">
              {allGreen ? (
                <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-8 w-8 shrink-0 text-amber-500" />
              )}
              <div>
                <div className="font-semibold">
                  {allGreen ? "Rebuild doğrulandı — tüm hedefler tutuyor." : "Rebuild uygulandı — bazı hedefler dikkat istiyor."}
                </div>
                <div className="text-sm text-muted-foreground">
                  Son güncelleme:{" "}
                  {report.generated_at ? new Date(report.generated_at).toLocaleString("tr-TR") : "—"}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Live metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5" /> Canlı Metrikler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AdminStatsGrid columns={4}>
              <MetricCard label="Flat Rol" value={report?.roles_total} target={TARGETS.roles_total} />
              <MetricCard label="Legacy Rol (0 olmalı)" value={report?.legacy_roles} target={0} />
              <MetricCard label="AFS Attribute" value={report?.afs_attributes} target={TARGETS.afs_attributes} />
              <MetricCard label="AFS Feature" value={report?.afs_features} target={TARGETS.afs_features} />
              <MetricCard label="AFS Section" value={report?.afs_sections} target={TARGETS.afs_sections} />
              <MetricCard label="Placeholder Item" value={report?.placeholders} target={TARGETS.placeholders} />
              <MetricCard label="Legacy Tablo (0)" value={report?.legacy_tables_remaining} target={0} />
              <MetricCard label="Family Kolon (0)" value={report?.family_columns_remaining} target={0} />
              <MetricCard label="Eski Tablo İsmi (0)" value={report?.old_table_names_remaining} target={0} />
              <MetricCard label="Rol-Attr Bağlantısı" value={report?.role_attributes} />
              <MetricCard label="Rol-Feature Bağlantısı" value={report?.role_features} />
              <MetricCard label="Rol-Section Bağlantısı" value={report?.role_sections} />
              <MetricCard label="Toplam Item" value={report?.catalog_items_total} />
              <MetricCard label="Item-Rol Bağlantısı" value={report?.item_role_links} />
            </AdminStatsGrid>
          </CardContent>
        </Card>

        {/* Follow-up: items without primary role */}
        {report && report.items_without_primary_role > 0 && (
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5" /> Açık Takip İşi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="font-semibold tabular-nums">{report.items_without_primary_role}</span> gerçek
                katalog kaydının (placeholder olmayan) atanmış bir <strong>primary flat rolü yok</strong>.
              </p>
              <p className="text-muted-foreground">
                Legacy roller silinirken (016), onlara bağlı 127 üye kaydının rol linki koparıldı
                (<code>platform_role_key</code> null'landı, <code>catalog_item_roles</code> legacy bağlantıları temizlendi).
                Bu kayıtlar korundu ancak uygun bir flat role (örn. <code>User_Standard</code>) yeniden bağlanmalı.
                Detay: <code>docs/catalog-role-afs-rebuild/12-migration-push-report.md §5</code>.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Report summaries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" /> Rapor Özetleri (00–14)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {REPORTS.map((r) => (
                <div key={r.id} className="rounded-lg border p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {r.id}
                    </Badge>
                    <span className="font-medium">{r.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{r.summary}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Layers className="h-3.5 w-3.5" />
              Tam raporlar: <code>docs/catalog-role-afs-rebuild/00-14</code> · İnfografik:{" "}
              <code>docs/roles-infogram.html</code>
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminPageShell>
  );
};

export default AdminDurumRaporuPage;
