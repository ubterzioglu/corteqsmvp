// Radar Kural Kitabı (/admin/radar/rehber) — Radar Haber Pipeline'ın admin
// tarafında günlük dille, adım adım nasıl yönetildiğini anlatan rehber sayfası.
// AdminCaddeGuidePage ile aynı sınıftadır: statik içerik, veri çekmez. Radar'da
// davranış değişen bir güncelleme yapıldığında buradaki ilgili maddeyi de güncelle.
// Derin operasyon/teknik referans (deploy, cron, sorun giderme):
// docs/modules/radar/radar-news-operations.md.

import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type GuideSection = {
  id: string;
  title: string;
  items: string[];
};

const conceptSections: GuideSection[] = [
  {
    id: "radar-nedir",
    title: "1. Radar nedir? Kısa tanıtım",
    items: [
      "Radar, haber bandına aday haberleri otomatik bulup getiren bir keşif katmanıdır. Dış kaynakları (RSS/Atom haber akışları ve GDELT küresel haber veritabanı) günde bir kez tarar, diasporayı ilgilendiren haberleri seçer ve onayını bekleyen bir kuyruğa koyar.",
      "EN ÖNEMLİ kural: hiçbir haber kendiliğinden yayınlanmaz. Radar sadece aday toplar; her aday senin onayından sonra haber bandına düşer. Yani Radar bir 'öneri kutusu'dur, otomatik yayıncı değildir.",
      "Radar'ın getirdiği haberler, ana sayfadaki dönen Haber Bandı'nı (/admin/marquee) besler. Onayladığın haber önce haber havuzuna, oradan da banda aktarılır.",
    ],
  },
  {
    id: "nasil-buluyor",
    title: "2. Haberleri nasıl buluyor ve sıralıyor?",
    items: [
      "Her tarama şu adımlardan geçer: kaynakları tara → haberleri normalize et (başlık, özet, link, tarih) → güvenlik kontrolü (zararlı/aşırı büyük içerik elenir) → aynı haberi tekrar getirmeyi önle (link bazlı duplicate eleme) → ilgi (relevance) skoru hesapla.",
      "İlgi skoru anahtar kelime setine göre hesaplanır. Skoru yeterince yüksek olan haber 'bekleyen aday' olur; çok düşük skorlu haberler kendiliğinden arşive düşer, kuyruğunu kalabalıklaştırmaz.",
      "Hangi kelimelerin haberi öne çıkaracağı bir ayar listesinde tutulur (deploy gerektirmez). 'Şu konuyu da yakalasın' demek istersen, bu kelime setini güncellemek yeterlidir — geliştiriciye söylemen kafi.",
    ],
  },
];

const adminSections: GuideSection[] = [
  {
    id: "ekranlar",
    title: "3. Admin tarafı: üç ekran, üç görev",
    items: [
      "Moderasyon Kuyruğu (/admin/radar/queue): Radar'ın bulduğu aday haberleri incelediğin ana ekran. Sekmeler durumlara göre ayrılır: Bekleyenler, Onaylananlar, Reddedilenler, Duplicate, Arşiv, Tümü. Günlük işin neredeyse tamamı 'Bekleyenler' sekmesindedir.",
      "Haber Kaynakları (/admin/radar/sources): hangi RSS/Atom/GDELT kaynaklarının taranacağını eklediğin/düzenlediğin ekran.",
      "Tarama Geçmişi (/admin/radar/runs): hangi taramanın ne zaman koştuğunu, kaç aday bulduğunu ve bir kaynağın hata verip vermediğini gördüğün kayıt ekranı (hem günlük otomatik tarama hem elle başlattığın taramalar burada listelenir).",
    ],
  },
  {
    id: "kuyruk",
    title: "4. Moderasyon Kuyruğu — bir adayı nasıl değerlendirirsin?",
    items: [
      "Bekleyenler sekmesinde her aday bir kart olarak görünür; kartta başlık, özet, kaynak ve haberin neden seçildiğini açıklayan ilgi sebepleri yer alır. Adaylar skoruna göre sıralıdır — en üsttekiler en alakalı bulunanlardır.",
      "Her kartta dört aksiyon vardır: 'Onayla ve Radar'a Yayınla' (haberi hem havuza alır hem doğrudan haber bandına aktarır), 'Sadece Haber Havuzuna Onayla' (havuza alır ama banda hemen koymaz — bandı sonra /admin/marquee'den kendin seçersin), 'Duplicate' (bunun zaten benzeri var işaretler) ve 'Reddet'.",
      "İkisinin farkı şudur: 'Radar'a Yayınla' acele/önemli haberler için tek tıkla yayınlamadır; 'Sadece Havuza Onayla' ise iyi haberi saklayıp banttaki sırayı sonra kendin düzenlemek istediğinde işine yarar.",
      "Karar verdiğin haber ilgili sekmeye taşınır (onaylanan → Onaylananlar, reddedilen → Reddedilenler). Yanlış bir karar verirsen ilgili sekmeden durumu görür, doğrularsın.",
    ],
  },
  {
    id: "kaynak-ekleme",
    title: "5. Yeni haber kaynağı ekleme — kullanım şartları kuralı",
    items: [
      "Yeni bir RSS/Atom kaynağı eklerken sıra önemlidir: önce kaynağı PASİF ekle (tarama aktif değil), kullanım şartlarını kontrol et, sonra aktif et. Amaç, izinsiz/yasaklı bir kaynağı yanlışlıkla taramaya başlamamaktır.",
      "Kontrol edilecekler: kaynağın resmi bir RSS/syndication akışı olup olmadığı, yeniden kullanım/ticari kullanım izni, kaynak gösterme (attribution) şartı ve istek hız sınırı.",
      "Kaynak ekranında 'Şart Notları' alanına bulgularını yazarsın, ardından 'Kullanım Şartları Kontrol Edildi' anahtarını açarsın. Sistem yalnızca hem aktif (is_enabled) HEM şartları kontrol edilmiş (terms_checked) kaynakları tarar — bu ikili kilit bilinçlidir.",
      "GDELT küresel haber veritabanı varsayılan kaynaktır. NewsAPI/GNews gibi ücretli/şartlı API'ler yazılı kullanım teyidi olmadan açılmamalıdır.",
    ],
  },
  {
    id: "tarama-zamanlama",
    title: "6. Tarama ne zaman çalışır? (Otomatik + elle)",
    items: [
      "Otomatik tarama günde bir kez, sabah erken saatte (05:00 UTC — Almanya saatiyle yazın 07:00, kışın 06:00) zamanlanmış olarak çalışır. Bu, arka planda Radar'ın yeni adayları getirmesini sağlar; sabah kuyruğa baktığında gece taranmış adaylar seni bekliyor olur.",
      "Tarama Geçmişi ekranından her taramanın ne zaman koştuğunu, kaç aday geldiğini ve hata olup olmadığını doğrularsın. Beklediğin gün hiç tarama görünmüyorsa veya sürekli hata varsa geliştiriciye bildir.",
      "İlk kez bir ayar değiştirdikten sonra (yeni kaynak, kelime seti) sonucu görmek için günlük taramayı beklemek yerine elle/deneme taraması istenebilir — bu teknik bir adımdır, geliştiriciden 'deneme taraması çalıştır' diye isteyebilirsin.",
    ],
  },
  {
    id: "rutin",
    title: "7. Önerilen günlük rutin",
    items: [
      "1. Günde bir kez (tercihen sabah) Moderasyon Kuyruğu → Bekleyenler sekmesine bak. Adaylar zaten skor sırasında; üstten başla.",
      "2. Banda koymak istediğin önemli/güncel haberi 'Onayla ve Radar'a Yayınla' ile yayınla. İyi ama acele olmayan haberi 'Sadece Haber Havuzuna Onayla' ile sakla.",
      "3. Aynı olayın ikinci bir haberini görürsen 'Duplicate', alakasız/uygunsuz haberi 'Reddet' ile ele. Kuyruğu temiz tut — bekleyen yığını büyürse alaka skoru düşük olanları hızlıca eler, kalanları değerlendirirsin.",
      "4. Haftada bir Tarama Geçmişi'ne göz at: bir kaynak sürekli hata veriyorsa Haber Kaynakları'ndan o kaynağı kontrol et veya geçici kapat.",
      "5. Bandın az haberle dolduğunu fark edersen kuyruktaki bekleyenlerden birkaçını yayınla; kuyruk uzun süre boşsa kaynakları veya kelime setini gözden geçir.",
    ],
  },
];

const SectionCard = ({ section }: { section: GuideSection }) => (
  <Card id={section.id}>
    <CardHeader className="pb-3">
      <CardTitle className="text-base">{section.title}</CardTitle>
    </CardHeader>
    <CardContent>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {section.items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

const AdminRadarGuidePage = () => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Radar Kural Kitabı</CardTitle>
          <CardDescription>
            Radar Haber Pipeline'ın ne işe yaradığını ve admin tarafında nasıl yönetildiğini günlük dille, adım adım anlatır.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Bu rehber iki bölümdür: önce Radar'ın ne yaptığı ve haberleri nasıl bulduğu (1-2), sonra senin gözünden yönetim
            (3-7). Teknik bilgi gerektirmez; amaç, bir aday haberi değerlendirirken veya yeni bir kaynak eklerken tek sayfada
            doğru kararı verebilmendir. Unutma: Radar yalnızca aday toplar — banda ne çıkacağına her zaman sen karar verirsin.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild variant="outline">
              <Link to="/admin/radar/queue">Moderasyon Kuyruğu</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/radar/sources">Haber Kaynakları</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/radar/runs">Tarama Geçmişi</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/marquee">Haber Bandı</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-1">
        <h2 className="px-1 text-sm font-semibold text-foreground">Radar nedir, nasıl çalışır?</h2>
      </div>
      {conceptSections.map((section) => (
        <SectionCard key={section.id} section={section} />
      ))}

      <div className="space-y-1 pt-2">
        <h2 className="px-1 text-sm font-semibold text-foreground">Admin tarafı — Radar nasıl yönetilir?</h2>
      </div>
      {adminSections.map((section) => (
        <SectionCard key={section.id} section={section} />
      ))}
    </div>
  );
};

export default AdminRadarGuidePage;
