// Taşınma Planlayıcı — DEMO sekmelerinin içeriği (İş & İşletmeler · Okullar ·
// Hoşgeldin Paketi).
//
// NEDEN BURADA, NEDEN VERİ TABANINDA DEĞİL
// Referans Lovable uygulamasında bu üç sekme dosyaya gömülü dizilerdi ve
// kullanıcıya GERÇEK veriymiş gibi gösteriliyordu — asıl kusur buydu, gömülü
// olması değil. Bizde sayfa `DEMO_ROUTES` üzerinden açıkça "demo" işaretlidir
// (`src/lib/demo-pages.ts`), panel de kendi uyarısını taşır. Besleyecek veri
// kaynağı kararı verilene kadar (yeni tablo mu, `catalog_items` mi) bu üç sekme
// yalnız İSKELETİ gösterir.
//
// ⚠️ UYDURMA İŞLETME/OKUL ADI YAZMA. Aşağıdaki kayıtlar bilerek KATEGORİ
// kartlarıdır ("Türk Marketi", "Uluslararası Okul"), isim taşımaz. Gerçek
// görünen bir ad ("Berlin Anadolu Market") ziyaretçi tarafından var sanılır ve
// aranır; kategori kartı aranmaz. Bu ayrım bu modülün tek gerçek kuralıdır.
//
// GERÇEK VERİYE GEÇİŞ: `/relocation` satırı `DEMO_ROUTES`'tan silindiğinde bu
// üç sekme kendiliğinden ÇİZİLMEZ (`RelocationHomePage` `isDemoRoute` ile
// gateler). Yani burada unutulmuş bir mock canlıda kalamaz.

/** Demo listelerinin ortak kayıt şekli — üç sekme de aynı kartı çizer. */
export interface RelocationDemoItem {
  /** Kart başlığı. Kategori adıdır, kurum adı DEĞİLDİR. */
  title: string;
  /** Bir cümlelik açıklama — kullanıcı bunun ne olduğunu anlamalı. */
  description: string;
  /** Sağ üstte duran kısa etiket (ör. "İlk hafta", "Zorunlu"). */
  tag?: string;
}

/**
 * İş & İşletmeler — diasporanın yeni ülkede ilk aradığı hizmet türleri.
 * Ülkeye göre değişmez: kategoriler her ülkede aynıdır, değişen tek şey o
 * kategorideki gerçek kayıtlardır (henüz yok).
 */
export const DEMO_BUSINESSES: RelocationDemoItem[] = [
  {
    title: "Türk Marketi & Gıda",
    description:
      "Anadil konuşulan market, kasap ve fırınlar. Yeni gelenlerin en sık aradığı ilk kategoridir.",
    tag: "Günlük",
  },
  {
    title: "Mali Müşavir & Muhasebeci",
    description:
      "Vergi kaydı, serbest çalışma bildirimi ve yıllık beyan için Türkçe hizmet veren muhasebeciler.",
    tag: "Resmî",
  },
  {
    title: "Göçmenlik Avukatı",
    description:
      "Oturum, çalışma izni ve aile birleşimi dosyalarında hukuki danışmanlık.",
    tag: "Resmî",
  },
  {
    title: "Nakliyat & Taşımacılık",
    description:
      "Uluslararası ev eşyası taşıma, gümrükleme ve depolama hizmetleri.",
    tag: "Taşınma",
  },
  {
    title: "Restoran & Kafe",
    description:
      "Türk mutfağı sunan işletmeler ve topluluğun buluşma noktaları.",
    tag: "Sosyal",
  },
  {
    title: "Berber & Kuaför",
    description: "Anadil konuşulan kişisel bakım hizmetleri.",
    tag: "Günlük",
  },
];

/**
 * Okullar — eğitim kademelerinin ve denklik süreçlerinin iskeleti.
 * Kayıt kuralları ülkeden ülkeye ciddi biçimde değişir; bu yüzden kartlar
 * "ne yapılması gerektiğini" anlatır, kurum adı vermez.
 */
export const DEMO_SCHOOLS: RelocationDemoItem[] = [
  {
    title: "Kreş & Anaokulu",
    description:
      "Okul öncesi kayıt genelde belediye üzerinden yapılır ve bekleme listesi uzundur; taşınmadan önce başvurun.",
    tag: "0-6 yaş",
  },
  {
    title: "Devlet Okulu Kaydı",
    description:
      "Zorunlu eğitim çağındaki çocuk adres kaydı yapıldıktan sonra bölge okuluna yazılır. Aşı karnesi ve doğum belgesi istenir.",
    tag: "Zorunlu",
  },
  {
    title: "Uluslararası Okul",
    description:
      "İngilizce veya IB müfredatı sunan ücretli okullar. Ücretler yaşam masrafı bütçesinin dışında tutulmalıdır.",
    tag: "Ücretli",
  },
  {
    title: "Türkçe Anadil Dersi",
    description:
      "Hafta sonu ya da okul sonrası verilen anadil ve kültür dersleri; bazı ülkelerde konsolosluk destekler.",
    tag: "Anadil",
  },
  {
    title: "Yetişkin Dil Kursu",
    description:
      "Oturum ve iş başvurularında istenen dil seviyesi için entegrasyon/dil kursları.",
    tag: "Yetişkin",
  },
  {
    title: "Diploma Denkliği",
    description:
      "Yükseköğrenim diplomasının tanınması ayrı bir başvurudur ve haftalar sürer; iş başvurusundan önce başlatın.",
    tag: "Denklik",
  },
];

/**
 * Hoşgeldin Paketi — varıştan sonraki ilk haftaların sırası.
 * Sıra ÖNEMLİDİR: adres kaydı olmadan banka hesabı, banka hesabı olmadan
 * kira sözleşmesi çoğu ülkede açılmaz. Kartlar bu bağımlılığı anlatır.
 */
export const DEMO_WELCOME_PACK: RelocationDemoItem[] = [
  {
    title: "Adres Kaydı",
    description:
      "Çoğu ülkede ilk ve kilit adımdır; vergi numarası, banka hesabı ve sağlık kaydı buna bağlıdır. Çoğu yerde varıştan sonra belirli bir süre içinde zorunludur.",
    tag: "1. adım",
  },
  {
    title: "Vergi / Kimlik Numarası",
    description:
      "Maaş ödemesi ve sözleşmeler için gerekir. Genelde adres kaydından sonra otomatik gelir ya da ayrıca başvurulur.",
    tag: "2. adım",
  },
  {
    title: "Banka Hesabı",
    description:
      "Kira ve maaş için şarttır. Açılışta adres belgesi, kimlik ve çoğu zaman vergi numarası istenir.",
    tag: "3. adım",
  },
  {
    title: "Sağlık Sigortası Kaydı",
    description:
      "Birçok ülkede zorunludur ve oturum başvurusunda belge olarak istenir. İşveren üzerinden ya da bireysel yapılır.",
    tag: "Zorunlu",
  },
  {
    title: "SIM Kart & İnternet",
    description:
      "Numara doğrulaması olmadan resmî başvurular ilerlemez. Ön ödemeli hat ilk gün alınabilir.",
    tag: "İlk hafta",
  },
  {
    title: "Toplu Taşıma Kartı",
    description:
      "Aylık/yıllık abonman tek biletten belirgin biçimde ucuzdur; öğrenci ve aile indirimlerini sorun.",
    tag: "İlk hafta",
  },
  {
    title: "Aile Hekimi Kaydı",
    description:
      "Uzman doktora çoğu ülkede ancak aile hekimi yönlendirmesiyle gidilir; hasta olmadan kaydolun.",
    tag: "İlk ay",
  },
];
