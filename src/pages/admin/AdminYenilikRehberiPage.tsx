// Yönetici rehberi — 21–23 Eylül yenilikleri ve test adımları.
//
// Rehber tek parça, kendi stilini taşıyan bir HTML dosyasıdır ve `?raw` ile metin
// olarak paketlenir. Neden `public/` altında DEĞİL: orası herkese açık servis edilir
// ve dosya yalnız yöneticiye görünmeli. Bu sayfa `/admin` altında olduğu için
// `RequireAuth` + admin kontrolünün arkasındadır.
//
// ⚠️ İndirme Blob ile yapılır, dış bağlantı yoktur — CSP `default-src 'self'` altında
// güvenle çalışır. Yeni sekmede açma da aynı Blob'u kullanır; tarayıcı engellerse
// indirme yolu her hâlükârda durur.

import { useMemo, useState } from "react";
import { Download, ExternalLink, FileText, ShieldCheck } from "lucide-react";

import rehberHtml from "@/content/admin/2026-09-23-yenilikler-ve-test-rehberi.html?raw";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSeo } from "@/lib/seo";

const DOSYA_ADI = "corteqs-yenilikler-ve-test-rehberi-2026-09-23.html";

const ICERIK = [
  "Açık duran güvenlik işi ve altı adımlık yapılacaklar listesi",
  "Dizin ve arama: 61 uzman kaydı, kaynak künyesi, boş kayıtların elenmesi, sitemap",
  "Taşınma planlayıcı: çalışan demo, kur karşılığı, maliyet rakamlarının niteliği",
  "Altı adımlık tıklanabilir test listesi — her adımda ne görülmesi gerektiğiyle",
  "Veritabanından doğrulama için dört salt-okuma sorgusu",
  "Yapılmayanlar ve bilinen sınırlar tablosu",
];

export default function AdminYenilikRehberiPage() {
  const [hata, setHata] = useState<string | null>(null);

  useSeo({
    title: "Yenilikler ve Test Rehberi | CorteQS Admin",
    description: "21–23 Eylül 2026 yeniliklerinin nasıl çalıştığı ve nasıl test edileceği.",
    robots: "noindex, nofollow",
  });

  const blobUrl = useMemo(() => {
    try {
      return URL.createObjectURL(new Blob([rehberHtml], { type: "text/html;charset=utf-8" }));
    } catch {
      return null;
    }
  }, []);

  const indir = () => {
    try {
      const url = blobUrl ?? URL.createObjectURL(new Blob([rehberHtml], { type: "text/html" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = DOSYA_ADI;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setHata(null);
    } catch {
      setHata("Dosya indirilemedi. Tarayıcı indirmeleri engelliyor olabilir.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <FileText className="h-6 w-6 text-primary" aria-hidden="true" />
          Yenilikler ve Test Rehberi
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          21–23 Eylül 2026 · Yeniliklerin nasıl çalıştığı ve her birinin nasıl test edileceği.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rehberi aç veya indir</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={indir} className="min-h-[44px]">
              <Download className="mr-2 h-4 w-4" aria-hidden="true" />
              HTML olarak indir
            </Button>
            {blobUrl ? (
              <Button asChild variant="outline" className="min-h-[44px]">
                <a href={blobUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
                  Yeni sekmede aç
                </a>
              </Button>
            ) : null}
          </div>

          {hata ? <p className="text-sm text-destructive">{hata}</p> : null}

          <p className="text-sm text-muted-foreground">
            İndirilen dosya tek parçadır: internet bağlantısı olmadan da açılır, telefona veya
            e-postaya taşınabilir.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">İçinde ne var</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {ICERIK.map((satir) => (
              <li key={satir} className="flex gap-2">
                <span aria-hidden="true" className="text-primary">
                  •
                </span>
                <span>{satir}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            Bu sayfa herkese açık değil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Rehber siteye yüklenmez; yalnız bu yönetici sayfasından indirilir. Bağlantıyı
            paylaşmak yetmez — açan kişinin yönetici girişi olması gerekir.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
