// /statusreport3006 — interaktif durum raporu.
//
// Eski statik HTML yerine: yapılandırılmış veri (status-report-3006-data.ts) →
// her satır SOLDA teknik / SAĞDA sade (Burak için) iki sütun; her bölümün altında
// DB-destekli (anonim, isimli) yorum thread'i (statusreport-comments.ts, mig 20260701100000).
// Sayfa public (giriş yok). Koyu tema yalnız .sr3006 altında izole.
import { useEffect, useMemo, useState } from "react";
import {
  REPORT_META,
  REPORT_SECTIONS,
  STATUS_LABELS,
  type ReportRow,
  type ReportSection,
} from "@/content/status-report-3006-data";
import {
  addComment,
  fetchAllComments,
  MAX_AUTHOR_LENGTH,
  MAX_COMMENT_LENGTH,
  type StatusReportComment,
} from "@/lib/statusreport-comments";
import { applySeo, SEO_SITE_NAME } from "@/lib/seo";

const STATUS_CLASS: Record<NonNullable<ReportRow["status"]>, string> = {
  ok: "sr-badge sr-ok",
  partial: "sr-badge sr-partial",
  open: "sr-badge sr-open",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

type ThreadProps = {
  sectionKey: string;
  comments: StatusReportComment[];
  onAdded: (comment: StatusReportComment) => void;
};

function CommentThread({ sectionKey, comments, onAdded }: ThreadProps) {
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!body.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const created = await addComment(sectionKey, name, body);
      onAdded(created);
      setBody("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Yorum eklenemedi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sr-thread">
      <div className="sr-thread-head">
        💬 Yorumlar {comments.length > 0 && <span className="sr-count">({comments.length})</span>}
      </div>

      {comments.length > 0 && (
        <ul className="sr-comments">
          {comments.map((c) => (
            <li key={c.id} className="sr-comment">
              <div className="sr-comment-meta">
                <strong>{c.authorName}</strong>
                <span className="sr-comment-date">{formatDate(c.createdAt)}</span>
              </div>
              <div className="sr-comment-body">{c.body}</div>
            </li>
          ))}
        </ul>
      )}

      <div className="sr-form">
        <input
          className="sr-input"
          type="text"
          placeholder="Adınız (opsiyonel)"
          maxLength={MAX_AUTHOR_LENGTH}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={busy}
        />
        <textarea
          className="sr-textarea"
          placeholder="Bu maddeyle ilgili yorumunuz…"
          maxLength={MAX_COMMENT_LENGTH}
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={busy}
        />
        <div className="sr-form-foot">
          {error && <span className="sr-error">{error}</span>}
          <button className="sr-btn" onClick={submit} disabled={busy || !body.trim()}>
            {busy ? "Gönderiliyor…" : "Yorum Ekle"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionBlock({
  section,
  comments,
  onAdded,
}: {
  section: ReportSection;
  comments: StatusReportComment[];
  onAdded: (sectionKey: string, comment: StatusReportComment) => void;
}) {
  return (
    <section className="sr-section" id={`sec-${section.key}`}>
      {section.group && <div className="sr-group">{section.group}</div>}
      <h2 className="sr-title">{section.title}</h2>
      {section.intro && <p className="sr-intro">{section.intro}</p>}

      <div className="sr-rows">
        <div className="sr-row sr-row-head">
          <div className="sr-cell-label">Konu</div>
          <div className="sr-cell-tech">Teknik açıklama</div>
          <div className="sr-cell-plain">💡 Sade açıklama (Burak için)</div>
        </div>
        {section.rows.map((row, i) => (
          <div className="sr-row" key={i}>
            <div className="sr-cell-label">
              {row.label}
              {row.status && <div className={STATUS_CLASS[row.status]}>{STATUS_LABELS[row.status]}</div>}
            </div>
            <div className="sr-cell-tech">{row.technical}</div>
            <div className="sr-cell-plain">{row.plain}</div>
          </div>
        ))}
      </div>

      <CommentThread
        sectionKey={section.key}
        comments={comments}
        onAdded={(c) => onAdded(section.key, c)}
      />
    </section>
  );
}

const StatusReport3006Page = () => {
  const [commentsByKey, setCommentsByKey] = useState<Record<string, StatusReportComment[]>>({});
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    return applySeo({
      title: `${SEO_SITE_NAME} | Cadde 3.0 & Premium Panel Durum Raporu (30.06.2026)`,
      description:
        "Cadde 3.0 ve premium panelin eksikleri — teknik + sade açıklamalı, yorumlanabilir iç tartışma dokümanı.",
      canonicalPath: "/statusreport3006",
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchAllComments()
      .then((grouped) => {
        if (!cancelled) setCommentsByKey(grouped);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Yorumlar yüklenemedi.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAdded = (sectionKey: string, comment: StatusReportComment) => {
    setCommentsByKey((prev) => ({
      ...prev,
      [sectionKey]: [...(prev[sectionKey] ?? []), comment],
    }));
  };

  const totalComments = useMemo(
    () => Object.values(commentsByKey).reduce((n, list) => n + list.length, 0),
    [commentsByKey],
  );

  return (
    <div className="sr3006">
      <style>{SR_STYLES}</style>
      <div className="sr-wrap">
        <header className="sr-hero">
          <div className="sr-hero-badges">
            <span className="sr-chip">📅 {REPORT_META.date}</span>
            <span className="sr-chip">Burak &amp; UBT</span>
            <span className="sr-chip">💬 {totalComments} yorum</span>
          </div>
          <h1>{REPORT_META.title}</h1>
          <p className="sr-sub">{REPORT_META.subtitle}</p>
          <div className="sr-legend">
            <span className="sr-badge sr-ok">🟢 Tamam</span>
            <span className="sr-badge sr-partial">🟡 Kısmen</span>
            <span className="sr-badge sr-open">🔴 Açık</span>
          </div>
        </header>

        {loadError && (
          <div className="sr-load-error">
            Yorumlar yüklenemedi: {loadError}. (Rapor içeriği aşağıda görünür; yorum eklemeyi tekrar
            deneyebilirsiniz.)
          </div>
        )}

        {REPORT_SECTIONS.map((section) => (
          <SectionBlock
            key={section.key}
            section={section}
            comments={commentsByKey[section.key] ?? []}
            onAdded={handleAdded}
          />
        ))}

        <footer className="sr-footer">
          statusreport3006 · CorteQS iç durum &amp; karar dokümanı · {REPORT_META.date}
          <br />
          Her satırda solda teknik, sağda sade açıklama. Yorumlar herkese açık ve kalıcıdır.
        </footer>
      </div>
    </div>
  );
};

// Tüm stiller .sr3006 altında scope'lu — site geneline sızmaz. Geniş layout (1320px).
const SR_STYLES = `
.sr3006 { --bg:#0f1117; --surface:#181b24; --surface2:#1f2330; --border:#2c3140; --text:#e6e8ee; --muted:#9aa1b2; --accent:#5eb1ff; --green:#4ade80; --red:#f87171; --amber:#fbbf24; --violet:#c084fc;
  background:var(--bg); color:var(--text); min-height:100vh; padding:0 0 80px;
  font-family:"Segoe UI",system-ui,-apple-system,sans-serif; line-height:1.6; font-size:15px; }
.sr3006 * { box-sizing:border-box; }
.sr3006 .sr-wrap { max-width:1320px; margin:0 auto; padding:0 24px; }
.sr3006 .sr-hero { background:linear-gradient(135deg,#131726 0%,#1a1430 100%); border-bottom:1px solid var(--border);
  margin:0 -24px 32px; padding:40px 24px 28px; }
.sr3006 .sr-hero h1 { margin:8px 0; font-size:26px; }
.sr3006 .sr-sub { color:var(--muted); margin:8px 0 0; max-width:900px; }
.sr3006 .sr-hero-badges { display:flex; gap:10px; flex-wrap:wrap; }
.sr3006 .sr-chip { background:var(--surface2); border:1px solid var(--border); border-radius:999px; padding:3px 14px; font-size:13px; color:var(--muted); }
.sr3006 .sr-legend { display:flex; gap:14px; margin-top:16px; flex-wrap:wrap; }
.sr3006 .sr-group { font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--violet); margin-top:8px; }
.sr3006 .sr-title { font-size:21px; color:var(--accent); border-bottom:2px solid var(--border); padding-bottom:8px; margin:6px 0 12px; }
.sr3006 .sr-intro { color:var(--text); margin:0 0 14px; max-width:980px; }
.sr3006 .sr-section { margin:40px 0; }
.sr3006 .sr-rows { display:flex; flex-direction:column; gap:1px; background:var(--border); border:1px solid var(--border); border-radius:10px; overflow:hidden; }
.sr3006 .sr-row { display:grid; grid-template-columns:200px 1fr 1fr; gap:1px; background:var(--border); }
.sr3006 .sr-row > div { background:var(--surface); padding:12px 14px; }
.sr3006 .sr-row-head > div { background:var(--surface2); font-weight:600; color:var(--accent); font-size:13px; }
.sr3006 .sr-cell-label { font-weight:600; }
.sr3006 .sr-cell-tech { color:var(--muted); font-size:14px; }
.sr3006 .sr-cell-plain { color:var(--text); font-size:14px; border-left:2px solid rgba(192,132,252,.4); }
.sr3006 .sr-badge { display:inline-block; border-radius:5px; padding:1px 8px; font-size:11px; font-weight:600; white-space:nowrap; margin-top:6px; }
.sr3006 .sr-ok { background:rgba(74,222,128,.15); color:var(--green); }
.sr3006 .sr-partial { background:rgba(251,191,36,.15); color:var(--amber); }
.sr3006 .sr-open { background:rgba(248,113,113,.15); color:var(--red); }
.sr3006 .sr-thread { margin-top:14px; background:var(--surface); border:1px solid var(--border); border-left:3px solid var(--violet); border-radius:8px; padding:14px 16px; }
.sr3006 .sr-thread-head { font-weight:600; color:var(--violet); margin-bottom:10px; }
.sr3006 .sr-count { color:var(--muted); font-weight:400; }
.sr3006 .sr-comments { list-style:none; margin:0 0 12px; padding:0; display:flex; flex-direction:column; gap:8px; }
.sr3006 .sr-comment { background:var(--surface2); border:1px solid var(--border); border-radius:6px; padding:8px 12px; }
.sr3006 .sr-comment-meta { display:flex; justify-content:space-between; gap:10px; font-size:12px; color:var(--muted); margin-bottom:3px; }
.sr3006 .sr-comment-meta strong { color:var(--accent); }
.sr3006 .sr-comment-body { white-space:pre-wrap; font-size:14px; }
.sr3006 .sr-form { display:flex; flex-direction:column; gap:8px; }
.sr3006 .sr-input, .sr3006 .sr-textarea { width:100%; background:var(--bg); border:1px solid var(--border); border-radius:6px; padding:8px 10px; color:var(--text); font-family:inherit; font-size:14px; }
.sr3006 .sr-textarea { resize:vertical; min-height:44px; }
.sr3006 .sr-input:focus, .sr3006 .sr-textarea:focus { outline:none; border-color:var(--accent); }
.sr3006 .sr-form-foot { display:flex; justify-content:flex-end; align-items:center; gap:12px; }
.sr3006 .sr-error { color:var(--red); font-size:13px; margin-right:auto; }
.sr3006 .sr-btn { background:var(--accent); color:#06121f; border:none; border-radius:6px; padding:7px 16px; font-weight:600; font-size:14px; cursor:pointer; }
.sr3006 .sr-btn:disabled { opacity:.5; cursor:not-allowed; }
.sr3006 .sr-load-error { background:rgba(248,113,113,.12); border:1px solid var(--red); border-radius:8px; padding:12px 16px; color:var(--red); margin-bottom:20px; font-size:14px; }
.sr3006 .sr-footer { margin-top:48px; padding-top:20px; border-top:1px solid var(--border); color:var(--muted); font-size:13px; text-align:center; }
@media (max-width:820px) {
  .sr3006 .sr-row { grid-template-columns:1fr; }
  .sr3006 .sr-row-head { display:none; }
  .sr3006 .sr-cell-tech::before { content:"Teknik: "; color:var(--accent); font-weight:600; }
  .sr3006 .sr-cell-plain::before { content:"💡 Sade: "; color:var(--violet); font-weight:600; }
  .sr3006 .sr-cell-plain { border-left:none; }
}
`;

export default StatusReport3006Page;
