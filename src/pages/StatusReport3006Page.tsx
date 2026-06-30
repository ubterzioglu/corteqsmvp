// Cadde 3.0 + Premium Panel durum/eksik/karar dokümanı — route'lu sürüm.
// İçerik src/content/status-report-3006.html'te CSS-scoped fragment olarak tutulur
// (.sr3006-root altında izole; site geneline sızmaz). CommercialDocumentPage ile
// aynı desen: Vite ?raw import + dangerouslySetInnerHTML + applySeo.
import { useEffect } from "react";
import statusReportHtml from "@/content/status-report-3006.html?raw";
import { applySeo, SEO_SITE_NAME } from "@/lib/seo";

const StatusReport3006Page = () => {
  useEffect(() => {
    return applySeo({
      title: `${SEO_SITE_NAME} | Cadde 3.0 & Premium Panel Durum Raporu (30.06.2026)`,
      description:
        "Cadde 3.0 modülü ve premium profil panelinin frontend/backend eksikleri, ref karşılaştırması ve karar bekleyen noktalar — iç tartışma dokümanı.",
      canonicalPath: "/statusreport3006",
    });
  }, []);

  return (
    <article
      aria-label="Cadde 3.0 ve Premium Panel Durum Raporu"
      dangerouslySetInnerHTML={{ __html: statusReportHtml }}
    />
  );
};

export default StatusReport3006Page;
