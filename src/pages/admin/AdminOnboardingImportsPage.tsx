import { useEffect, useMemo, useState } from "react";

import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listProfileOnboardingImportsForAdmin } from "@/lib/profile-onboarding-api";

type OnboardingImportRow = Awaited<ReturnType<typeof listProfileOnboardingImportsForAdmin>>[number];

const formatSnapshotText = (row: OnboardingImportRow, key: string) => {
  if (!row.snapshot || typeof row.snapshot !== "object") return "-";
  const value = (row.snapshot as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value : "-";
};

const AdminOnboardingImportsPage = () => {
  const [rows, setRows] = useState<OnboardingImportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const nextRows = await listProfileOnboardingImportsForAdmin();
        if (!isMounted) return;
        setRows(nextRows);
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(error instanceof Error ? error.message : "Onboarding kayıtları alınamadı.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    return rows.reduce<Record<string, number>>((accumulator, row) => {
      accumulator[row.status] = (accumulator[row.status] ?? 0) + 1;
      return accumulator;
    }, {});
  }, [rows]);

  return (
    <AdminPageLayout
      title="Onboarding Importları"
      description="Geçmiş submission kullanıcıları için oluşturulan onboarding batch kayıtlarını ve aktivasyon durumlarını izleyin."
    >
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Toplam Kayıt</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{rows.length}</p>
            </CardContent>
          </Card>
          {["queued", "invited", "pending_user_review", "active"].map((statusKey) => (
            <Card key={statusKey}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{statusKey}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{summary[statusKey] ?? 0}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Batch Sonuçları</CardTitle>
            <CardDescription>
              Dry-run ve gerçek davet batch sonuçları aynı tracking tablosunda görünür.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Onboarding kayıtları yükleniyor...</p>
            ) : null}

            {errorMessage ? (
              <p className="text-sm text-destructive">{errorMessage}</p>
            ) : null}

            {!isLoading && !errorMessage && rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz import kaydı bulunmuyor.</p>
            ) : null}

            {!isLoading && !errorMessage && rows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      <th className="px-2 py-2">Batch</th>
                      <th className="px-2 py-2">Kişi</th>
                      <th className="px-2 py-2">E-posta</th>
                      <th className="px-2 py-2">Durum</th>
                      <th className="px-2 py-2">Davet</th>
                      <th className="px-2 py-2">Aktivasyon</th>
                      <th className="px-2 py-2">Hata</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-b align-top">
                        <td className="px-2 py-3 font-mono text-xs">{row.batch_id}</td>
                        <td className="px-2 py-3">
                          <div className="font-medium">{formatSnapshotText(row, "fullname")}</div>
                          <div className="text-xs text-muted-foreground">submission: {row.source_submission_id}</div>
                        </td>
                        <td className="px-2 py-3">{row.email_normalized}</td>
                        <td className="px-2 py-3">
                          <Badge variant="outline">{row.status}</Badge>
                        </td>
                        <td className="px-2 py-3 text-xs text-muted-foreground">
                          {row.invite_sent_at ? new Date(row.invite_sent_at).toLocaleString("tr-TR") : "-"}
                        </td>
                        <td className="px-2 py-3 text-xs text-muted-foreground">
                          {row.activated_at ? new Date(row.activated_at).toLocaleString("tr-TR") : "-"}
                        </td>
                        <td className="px-2 py-3 text-xs text-destructive">{row.last_error || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
};

export default AdminOnboardingImportsPage;
