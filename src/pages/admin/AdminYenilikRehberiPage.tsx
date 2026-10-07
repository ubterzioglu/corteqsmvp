// Yönetici rehberi — modüler çoklu rehber sayfası.
//
// Her rehber kendi stilini taşıyan bir HTML dosyasıdır ve `?raw` ile metin
// olarak paketlenir. Neden `public/` altında DEĞİL: orası herkese açık servis edilir
// ve dosya yalnız yöneticiye görünmeli. Bu sayfa `/admin` altında olduğu için
// `RequireAuth` + admin kontrolünün arkasındadır.
//
// ⚠️ İndirme Blob ile yapılır, dış bağlantı yoktur — CSP `default-src 'self'` altında
// güvenle çalışır. Yeni sekmede açma da aynı Blob'u kullanır; tarayıcı engellerse
// indirme yolu her hâlükârda durur.

import { useCallback, useMemo, useState } from "react";
import { Download, ExternalLink, FileText, ShieldCheck } from "lucide-react";

import eylul23Html from "@/content/admin/2026-09-23-yenilikler-ve-test-rehberi.html?raw";
import toplulukHtml from "@/content/admin/2026-10-07-topluluk-motoru.html?raw";
import gruplarHtml from "@/content/admin/2026-10-07-dijital-gruplar.html?raw";
import caddeHtml from "@/content/admin/2026-10-07-cadde-guncellemeleri.html?raw";
import kariyerHtml from "@/content/admin/2026-10-07-kariyer-ve-kadro.html?raw";
import profilHtml from "@/content/admin/2026-10-07-profil-ve-hesap.html?raw";
import adminHtml from "@/content/admin/2026-10-07-admin-panel-iyilestirmeleri.html?raw";
import guvenlikHtml from "@/content/admin/2026-10-07-guvenlik-altyapi.html?raw";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSeo } from "@/lib/seo";

type Rehber = {
  id: string;
  baslik: string;
  tarih: string;
  tarihSirala: string;
  ozet: string[];
  dosyaAdi: string;
  html: string;
};

const REHBERLER: Rehber[] = [
  {
    id: "topluluk-motoru",
    baslik: "Topluluk Motoru — Ücretsiz Özellikler",
    tarih: "7 Ekim 2026",
    tarihSirala: "2026-10-07",
    ozet: [
      "Etkinlik sistemi: üye oluşturur, limit 2, ilk onaylı, sonrakiler otomatik yayında",
      "Tavsiye İste: üye tavsiye talep eder, diğer üyeler yanıt verir",
      "Davet ve Liderlik: kişisel davet linki + sıralama tablosu",
      "Haftalık Şehir Özeti: takip edilen şehirlerin e-posta özeti",
      "İş İlanları: kamu iş ilanı panosu, 6 ilan kotası",
    ],
    dosyaAdi: "corteqs-topluluk-motoru-2026-10-07.html",
    html: toplulukHtml,
  },
  {
    id: "dijital-gruplar",
    baslik: "Dijital Gruplar Motoru",
    tarih: "7 Ekim 2026",
    tarihSirala: "2026-10-07",
    ozet: [
      "Grup Moderasyon Paneli: 4 kuyruk tek ekranda (yeni gruplar, sahiplik, şikayet, gönderi)",
      "Grup Şikayet Sistemi: şikayet → ihlal sayacı → askıya alma",
      "Kurumsal Doğrulama: kurum doğrulama başvuru inceleme",
      "Telefon OTP (WhatsApp): SMS yerine WhatsApp ile telefon doğrulama",
      "Grup Sağlık Skoru: 0–100 puan, şikayet geçmişi etkiler",
    ],
    dosyaAdi: "corteqs-dijital-gruplar-2026-10-07.html",
    html: gruplarHtml,
  },
  {
    id: "cadde-guncellemeleri",
    baslik: "Cadde (Sosyal Akış) Geliştirmeleri",
    tarih: "7 Ekim 2026",
    tarihSirala: "2026-10-07",
    ozet: [
      "Gönderi düzenleme: mevcut gönderiyi düzenleme",
      "Tepki verenler listesi: kimler beğendi/dokundu",
      "Cadde araması: Cadde içeriğinde tam metin arama",
    ],
    dosyaAdi: "corteqs-cadde-guncellemeleri-2026-10-07.html",
    html: caddeHtml,
  },
  {
    id: "kariyer-ve-kadro",
    baslik: "Kariyer ve Kadro",
    tarih: "7 Ekim 2026",
    tarihSirala: "2026-10-07",
    ozet: [
      "Kariyer sayfası yenileme: 17 ilan + başvuru formu",
      "Kadro modülü: 52 rol yönetimi, ilan, başvuru, matris",
    ],
    dosyaAdi: "corteqs-kariyer-ve-kadro-2026-10-07.html",
    html: kariyerHtml,
  },
  {
    id: "profil-ve-hesap",
    baslik: "Profil ve Hesap",
    tarih: "7 Ekim 2026",
    tarihSirala: "2026-10-07",
    ozet: [
      "Belge yükleme: CV, sunum, ruhsat (Premium görünürlük kontrolü)",
      "Hesap silme: engelleme kontrolü ile hesap silme",
      "Uzmanlık etiketleri: profil uzmanlık alanları",
      "Profilde sonraki etkinlik: üyenin bir sonraki etkinliği profilinde",
    ],
    dosyaAdi: "corteqs-profil-ve-hesap-2026-10-07.html",
    html: profilHtml,
  },
  {
    id: "admin-panel-iyilestirmeleri",
    baslik: "Admin Panel İyileştirmeleri",
    tarih: "7 Ekim 2026",
    tarihSirala: "2026-10-07",
    ozet: [
      "Traction Dashboard: platform büyüme metrikleri",
      "VIP Davetiyeler: özel davet linki oluşturma/yönetimi",
      "Admin menü numaralandırma: sıralı menü + AI asistan uyumu",
      "Bildirim ayarları: e-posta bildirim toggle + abone sayısı",
      "Rol yönetimi: hiyerarşik rol yapısı, arama, filtre",
    ],
    dosyaAdi: "corteqs-admin-panel-iyilestirmeleri-2026-10-07.html",
    html: adminHtml,
  },
  {
    id: "guvenlik-altyapi",
    baslik: "Güvenlik ve Altyapı",
    tarih: "7 Ekim 2026",
    tarihSirala: "2026-10-07",
    ozet: [
      "Güvenlik kapıları (SG0–SG11): RLS sıkılaştırma, RPC erişim kontrolü",
      "SEO düzeltmeleri: redirect, canonical, sitemap iyileştirmeleri",
      "Konsolosluk kayıtları yayını: 241 kayıt yayınlandı",
    ],
    dosyaAdi: "corteqs-guvenlik-altyapi-2026-10-07.html",
    html: guvenlikHtml,
  },
  {
    id: "eylul-23",
    baslik: "21–23 Eylül Yenilikleri ve Test Rehberi",
    tarih: "23 Eylül 2026",
    tarihSirala: "2026-09-23",
    ozet: [
      "Açık duran güvenlik işi ve altı adımlık yapılacaklar listesi",
      "Dizin ve arama: 61 uzman kaydı, kaynak künyesi, boş kayıtların elenmesi, sitemap",
      "Taşınma planlayıcı: çalışan demo, kur karşılığı, maliyet rakamlarının niteliği",
      "Altı adımlık tıklanabilir test listesi — her adımda ne görülmesi gerektiğiyle",
      "Veritabanından doğrulama için dört salt-okuma sorgusu",
      "Yapılmayanlar ve bilinen sınırlar tablosu",
    ],
    dosyaAdi: "corteqs-yenilikler-ve-test-rehberi-2026-09-23.html",
    html: eylul23Html,
  },
];

type TarihGrubu = {
  tarih: string;
  rehberler: Rehber[];
};

export default function AdminYenilikRehberiPage() {
  const [hata, setHata] = useState<string | null>(null);

  useSeo({
    title: "Yenilikler ve Kullanım Kılavuzları | CorteQS Admin",
    description:
      "Son iki haftada yapılan değişikliklerin adım adım anlatımı. Her rehber bağımsız indirilebilir.",
    robots: "noindex, nofollow",
  });

  const blobUrlMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of REHBERLER) {
      try {
        map.set(r.id, URL.createObjectURL(new Blob([r.html], { type: "text/html;charset=utf-8" })));
      } catch {
        // Blob URL oluşturulamazsa bu rehber için indirme/yeni sekme çalışmaz.
      }
    }
    return map;
  }, []);

  const tarihGruplari = useMemo<TarihGrubu[]>(() => {
    const grup = new Map<string, Rehber[]>();
    for (const r of REHBERLER) {
      const mevcut = grup.get(r.tarihSirala) ?? [];
      mevcut.push(r);
      grup.set(r.tarihSirala, mevcut);
    }
    return Array.from(grup.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([tarihSirala, rehberler]) => {
        rehberler.sort((a, b) => a.baslik.localeCompare(b.baslik, "tr"));
        const tarih = rehberler[0].tarih;
        return { tarih, rehberler };
      });
  }, []);

  const indir = useCallback(
    (rehber: Rehber) => {
      try {
        const url =
          blobUrlMap.get(rehber.id) ??
          URL.createObjectURL(new Blob([rehber.html], { type: "text/html" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = rehber.dosyaAdi;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setHata(null);
      } catch {
        setHata("Dosya indirilemedi. Tarayıcı indirmeleri engelliyor olabilir.");
      }
    },
    [blobUrlMap],
  );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <FileText className="h-6 w-6 text-primary" aria-hidden="true" />
          Yenilikler ve Kullanım Kılavuzları
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Son iki haftada yapılan değişikliklerin adım adım anlatımı. Her rehber bağımsız
          indirilebilir ve yeni sekmede açılabilir.
        </p>
      </div>

      {tarihGruplari.map((grup) => (
        <Card key={grup.tarih}>
          <CardHeader>
            <CardTitle className="text-lg">{grup.tarih}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {grup.rehberler.map((rehber) => {
              const blobUrl = blobUrlMap.get(rehber.id) ?? null;
              return (
                <div key={rehber.id} className="rounded-lg border p-4">
                  <h3 className="font-semibold">{rehber.baslik}</h3>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {rehber.ozet.map((satir) => (
                      <li key={satir} className="flex gap-2">
                        <span aria-hidden="true" className="text-primary">
                          •
                        </span>
                        <span>{satir}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Button
                      onClick={() => indir(rehber)}
                      size="sm"
                      className="min-h-[36px]"
                    >
                      <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                      HTML olarak indir
                    </Button>
                    {blobUrl ? (
                      <Button asChild variant="outline" size="sm" className="min-h-[36px]">
                        <a href={blobUrl} target="_blank" rel="noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
                          Yeni sekmede aç
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {hata ? <p className="text-sm text-destructive">{hata}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            Bu sayfa herkese açık değil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Rehberler siteye yüklenmez; yalnız bu yönetici sayfasından indirilir. Bağlantıyı
            paylaşmak yetmez — açan kişinin yönetici girişi olması gerekir.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
