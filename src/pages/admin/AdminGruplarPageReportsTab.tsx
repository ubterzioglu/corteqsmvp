// G14 · Moderatör paneli "Şikayetler" kuyruğu (tasarım §10) — sunum bileşeni.
//
// Veri/karar AdminGruplarPage'de (load() + runDecision — diğer üç kuyrukla aynı
// desen, kısayollar A/R/J/K aynen çalışır). Kuyruk grup bazlıdır: sebep dağılımı ·
// farklı şikayetçi sayısı · notlar · şikayetçi kimliği (yalnız admin RPC'si döner).
import { Check, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  groupReportReasonLabel,
  type GroupReportQueueItem,
  type GroupReportQueueReport,
} from "@/lib/group-reports-api";

interface AdminGruplarPageReportsTabProps {
  reports: GroupReportQueueItem[];
  selected: number;
  busy: boolean;
  onSelect: (index: number) => void;
  /** Onay: TEK karar = TEK ihlal (grubun tüm açık şikayetleri kapanır). */
  onUphold: (item: GroupReportQueueItem) => void;
  /** Red: grubun tüm açık şikayetleri (son red grubu yayına döndürür). */
  onReject: (item: GroupReportQueueItem) => void;
  /** Tek şikayeti reddet (diğerleri açık kalır). */
  onRejectSingle: (item: GroupReportQueueItem, report: GroupReportQueueReport) => void;
}

export function AdminGruplarPageReportsTab({
  reports,
  selected,
  busy,
  onSelect,
  onUphold,
  onReject,
  onRejectSingle,
}: AdminGruplarPageReportsTabProps) {
  if (reports.length === 0) {
    return <p className="text-sm text-muted-foreground">Açık şikayet yok.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Onay tek bir ihlal kaydeder ve grubun tüm açık şikayetlerini kapatır (uyarı merdiveni işler).
        Asılsız olanları önce tek tek reddet. Son açık şikayet reddedilince şikayet nedeniyle gizlenen
        grup yayına döner.
      </p>
      {reports.map((item, index) => (
        <Card
          key={item.landing_id}
          className={index === selected ? "border-rose-400 ring-2 ring-rose-200" : undefined}
          onClick={() => onSelect(index)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              {item.group_name}
              <Badge variant="outline">{item.open_count} açık şikayet</Badge>
              <Badge variant="outline">{item.distinct_reporters} farklı şikayetçi</Badge>
              {item.listing_status === "hidden" && item.hidden_reason === "reports" ? (
                <Badge variant="destructive">şikayet eşiğiyle gizlendi</Badge>
              ) : (
                <Badge variant="outline">durum: {item.listing_status}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {Object.entries(item.reason_counts ?? {}).map(([reason, count]) => (
                <Badge key={reason} variant="secondary">
                  {groupReportReasonLabel(reason)} · {count}
                </Badge>
              ))}
            </div>
            <ul className="space-y-2">
              {item.reports.map((report) => (
                <li key={report.id} className="rounded-lg border border-border p-2 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">{groupReportReasonLabel(report.reason)}</span>
                    <span className="font-mono text-xs text-muted-foreground">şikayetçi: {report.reporter_id}</span>
                  </div>
                  {report.note ? <p className="mt-1 whitespace-pre-line text-muted-foreground">{report.note}</p> : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-1 h-7 px-2 text-xs text-red-700"
                    disabled={busy}
                    onClick={(event) => {
                      event.stopPropagation();
                      onRejectSingle(item, report);
                    }}
                  >
                    Yalnız bunu reddet
                  </Button>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                className="gap-1 bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={busy}
                onClick={() => onUphold(item)}
              >
                <Check className="h-4 w-4" /> Onayla (A)
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 border-red-300 text-red-700"
                disabled={busy}
                onClick={() => {
                  onSelect(index);
                  onReject(item);
                }}
              >
                <X className="h-4 w-4" /> Reddet (R)
              </Button>
              <a
                className="inline-flex items-center text-sm font-semibold text-rose-700 underline-offset-2 hover:underline"
                href={`/addcom?group=${encodeURIComponent(item.slug)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Sayfayı gör
              </a>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
