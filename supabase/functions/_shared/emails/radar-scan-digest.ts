// Radar tarama özeti mail şablonu.
//
// admin_update ile aynı deseni takip eder: günlük özet (18:00 Europe/Berlin),
// birden fazla tarama sonucu tek mailde birleşir. Alıcı TÜM adminlerdir
// (abone listesine bakılmaz — kullanıcı kararı).

import { escapeHtml } from "./html.ts";

export type RadarScanDigestItem = {
  title: string;
  url: string;
  source_name?: string;
  relevance_score?: number;
};

export type RadarScanDigestPayload = {
  scan_run_id?: string;
  total_fetched: number;
  total_inserted: number;
  total_duplicate: number;
  total_filtered: number;
  top_items?: RadarScanDigestItem[];
  scan_completed_at?: string;
};

function formatDateTime(value: unknown): string {
  const raw = typeof value === "string" ? value : null;
  if (!raw) return "-";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleString("tr-TR", { timeZone: "Europe/Berlin" });
}

export function buildRadarScanDigestEmail(payloads: RadarScanDigestPayload[]): {
  subject: string;
  html: string;
  text?: string;
} {
  const totalFetched = payloads.reduce((sum, p) => sum + (p.total_fetched ?? 0), 0);
  const totalInserted = payloads.reduce((sum, p) => sum + (p.total_inserted ?? 0), 0);
  const totalDuplicate = payloads.reduce((sum, p) => sum + (p.total_duplicate ?? 0), 0);
  const totalFiltered = payloads.reduce((sum, p) => sum + (p.total_filtered ?? 0), 0);

  const allTopItems = payloads
    .flatMap((p) => p.top_items ?? [])
    .slice(0, 10);

  const subject = `CorteQS Radar: ${totalInserted} yeni haber bulundu`;

  const html = `
    <h2>CorteQS Radar — Günlük Tarama Özeti</h2>

    <table cellpadding="8" cellspacing="0" border="1" style="border-collapse: collapse; border-color: #d4d4d8; margin-bottom: 24px;">
      <tr><td><strong>Taranan kaynak sayısı</strong></td><td>${payloads.length}</td></tr>
      <tr><td><strong>Toplam çekilen haber</strong></td><td>${totalFetched}</td></tr>
      <tr><td><strong>Yeni eklenen</strong></td><td>${totalInserted}</td></tr>
      <tr><td><strong>Duplicate (atlanan)</strong></td><td>${totalDuplicate}</td></tr>
      <tr><td><strong>Filtrelenen (düşük skor)</strong></td><td>${totalFiltered}</td></tr>
    </table>

    ${allTopItems.length > 0 ? `
      <h3>Öne Çıkan Haberler</h3>
      <ol style="padding-left: 24px;">
        ${allTopItems.map((item) => `
          <li style="margin-bottom: 12px;">
            <a href="${escapeHtml(item.url)}" style="color: #2563eb; text-decoration: none;">
              ${escapeHtml(item.title)}
            </a>
            ${item.source_name ? `<br/><span style="color: #71717a; font-size: 12px;">${escapeHtml(item.source_name)}</span>` : ""}
            ${item.relevance_score ? `<br/><span style="color: #71717a; font-size: 12px;">Skor: ${item.relevance_score}</span>` : ""}
          </li>
        `).join("")}
      </ol>
    ` : "<p>Bu taramada öne çıkan haber bulunamadı.</p>"}

    <p style="color:#71717a;font-size:12px;margin-top:24px;">
      Bu mail tüm adminlere otomatik olarak gönderilir.
      Radar ayarlarını admin panelinden yönetebilirsin.
    </p>
  `;

  const text = `
CorteQS Radar — Günlük Tarama Özeti

Taranan kaynak sayısı: ${payloads.length}
Toplam çekilen haber: ${totalFetched}
Yeni eklenen: ${totalInserted}
Duplicate (atlanan): ${totalDuplicate}
Filtrelenen (düşük skor): ${totalFiltered}

${allTopItems.length > 0 ? `
Öne Çıkan Haberler:
${allTopItems.map((item, i) => `${i + 1}. ${item.title}\n   ${item.url}${item.source_name ? `\n   Kaynak: ${item.source_name}` : ""}${item.relevance_score ? `\n   Skor: ${item.relevance_score}` : ""}`).join("\n\n")}
` : "Bu taramada öne çıkan haber bulunamadı."}

---
Bu mail tüm adminlere otomatik olarak gönderilir.
Radar ayarlarını admin panelinden yönetebilirsin.
  `.trim();

  return { subject, html, text };
}
