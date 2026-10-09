// Yatırımcı sayfası (/information) içeriği — TEK KAYNAK.
//
// ⚠️ GÜVENLİK SINIRI: sayfa istemci taraflı parolayla korunur, gerçek kilit
// değildir. Buraya ASLA yazılmaz: proje kimliği, host/IP, bağlantı adresleri,
// tablo/RPC/secret adları, açık kusurlar, kapasite zaafları. Yalnız özet + sayı.
// `investor-content-safety.test.ts` bu dosyayı tarar — gevşetme.
//
// Repo rakamları üretilir (`investor-stats.generated.ts`); canlı DB rakamları
// aşağıda ölçüm tarihiyle elle durur. Güncelleme akışı: docs/investor/README.md

import { INVESTOR_REPO_STATS as REPO } from "./investor-stats.generated";

export type ModuleStatus = "canli" | "pilot" | "gelistiriliyor";

export interface InvestorModule {
  readonly key: string;
  readonly title: string;
  readonly summary: string;
  readonly highlights: readonly string[];
  readonly status: ModuleStatus;
}

export interface InvestorMetric {
  readonly value: string;
  readonly label: string;
  readonly hint?: string;
}

export interface StackLayer {
  readonly title: string;
  readonly items: readonly { readonly name: string; readonly version?: string; readonly role: string }[];
}

export interface DetailBlock {
  readonly title: string;
  readonly points: readonly string[];
}

export interface InvestorSection {
  readonly id: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly lead: string;
}

const tr = (n: number): string => n.toLocaleString("tr-TR");
// Yalnız ana sürüm gösterilir: tam sürüm bilinen açıkları eşlemeyi kolaylaştırır.
const v = (name: keyof typeof REPO.versions): string => REPO.versions[name].split(".")[0];

/** Canlı veritabanı katalog ölçümü — elle güncellenir (README'deki SQL ile). */
export const LIVE_DB = {
  measuredAt: "2026-10-09",
  tables: 292,
  tablesWithRls: 291,
  policies: 525,
  securedFunctions: 412,
  indexes: 836,
  triggers: 146,
  scheduledJobs: 14,
  extensions: 11,
  rolesTotal: 82,
  rolesActive: 78,
  profileAttributes: 59,
  features: 64,
} as const;

export const MODULE_STATUS_LABEL: Record<ModuleStatus, string> = {
  canli: "Canlı",
  pilot: "Pilot",
  gelistiriliyor: "Geliştiriliyor",
};

export const INVESTOR_SECTIONS: readonly InvestorSection[] = [
  {
    id: "ozellikler",
    eyebrow: "01 · Featurlar",
    title: "Platformun yaptığı işler",
    lead:
      "Tek bir uygulamada sosyal akış, dizin, yapay zekâ asistanı, taşınma rehberi, kariyer ve yönetim araçları. Her modül canlı veritabanı üzerinde, rol bazlı yetkiyle çalışır.",
  },
  {
    id: "teknolojiler",
    eyebrow: "02 · Teknolojiler",
    title: "Modern, yaygın ve bakımı kolay bir yığın",
    lead:
      "Ekosistemi en geniş araçlar seçildi: işe alım kolay, topluluk desteği güçlü, satıcıya bağımlılık düşük. Yapay zekâ katmanı sağlayıcıdan bağımsız tasarlandı.",
  },
  {
    id: "altyapi",
    eyebrow: "03 · Serverlar",
    title: "Konteyner tabanlı, yönetilen veri katmanlı altyapı",
    lead:
      "Ön yüz Docker konteynerinde nginx ile sunulur; veri, kimlik doğrulama, dosya ve sunucu fonksiyonları yönetilen PostgreSQL platformunda çalışır. Güvenlik başlıkları ve içerik güvenlik politikası her yanıtta zorunludur.",
  },
  {
    id: "veritabani",
    eyebrow: "04 · Database",
    title: "Güvenliği veritabanının içinde olan bir veri modeli",
    lead:
      "Yetki kontrolü uygulama kodunda değil, PostgreSQL satır düzeyi güvenliğinde (RLS) yaşar. Kritik yazma işlemleri yalnız denetlenmiş sunucu fonksiyonlarından geçer.",
  },
  {
    id: "kod",
    eyebrow: "05 · Kodlar",
    title: "Ölçülen, test edilen, kendini denetleyen bir kod tabanı",
    lead:
      "Kalite rakamları elle yazılmaz, araçlarla ölçülür. Her değişiklik otomatik kalite hattından geçer; sessizce bozulabilecek her kritik kural bir sözleşme testiyle kilitlidir.",
  },
  {
    id: "danismanlik",
    eyebrow: "06 · Teknik Danışmanlık",
    title: "Masadaki tablo: güçlü temeller ve olgunlaşacak alanlar",
    lead:
      "Teknoloji danışmanlığı için dürüst bir başlangıç noktası. Temeller sağlam; büyüme evresinde stratejik yön ve deneyimin en çok değer katacağı alanlar da açıkça bellidir.",
  },
  {
    id: "baglantilar",
    eyebrow: "07 · Bağlantılar",
    title: "Ekosistemi canlı inceleyin",
    lead: "Girişim stüdyosundan ürünün canlı yüzeylerine kadar, anlatılanların hepsi şu an yayında.",
  },
];

export interface EcosystemLink {
  readonly title: string;
  readonly text: string;
  readonly url: string;
}

/** 07 · Bağlantılar — hepsi herkese açık adresler. */
export const ECOSYSTEM_LINKS: readonly EcosystemLink[] = [
  // Bize ait olmayan adresler kendi kısa yolumuzdan yönlenir (investor-route.ts → INFORMATION_REDIRECTS).
  { title: "Venture Studio", text: "Qualtron Sinclair — QS Networks", url: "https://corteqs.net/information/venture-studio" },
  { title: "CorteQS Türk", text: "Ana platform", url: "https://corteqs.net" },
  { title: "CorteQS Product", text: "Global ürün prototipi", url: "https://corteqs.net/information/product" },
  { title: "CorteQS Sosyal Medya", text: "Cadde — diaspora sosyal akışı", url: "https://corteqs.net/cadde" },
  { title: "İş İlanları", text: "Diaspora iş ilanları", url: "https://corteqs.net/ilanlar" },
  { title: "Kariyer", text: "CorteQS ekibine katılım", url: "https://corteqs.net/kariyer" },
  { title: "Tavsiye İste", text: "Topluluktan öneri alma", url: "https://corteqs.net/tavsiye" },
  { title: "Liderlik Tablosu", text: "Davet ve katkı sıralaması", url: "https://corteqs.net/liderlik" },
  { title: "Topluluk Ekle", text: "Grup ve topluluk kaydı", url: "https://corteqs.net/addcom" },
  { title: "Dizin", text: "Uzman, işletme ve kurum dizini", url: "https://corteqs.net/directory" },
];

export const HERO = {
  kicker: "Yatırımcı Bilgi Dosyası · Teknik Görünüm",
  title: "Dünyadaki Türk diasporası için kurulmuş dijital altyapı",
  lead:
    "CorteQS, dünyadaki Türkleri şehir bazlı bağlantılar, topluluklar ve fırsatlar etrafında buluşturur. Bu sayfa ürünün arkasındaki teknolojiyi, veriyi ve mühendislik disiplinini özetler.",
} as const;

export const MODULES: readonly InvestorModule[] = [
  {
    key: "cadde",
    title: "Cadde — Diaspora Sosyal Akışı",
    summary: "Aynı şehir, aynı ülke ve etkileşim bantlarıyla sıralanan topluluk akışı.",
    highlights: ["Cafe sohbet odaları", "Çarşı pazar yeri", "Tanıtım kampanyaları", "Şikâyet ve moderasyon"],
    status: "canli",
  },
  {
    key: "dizin",
    title: "Dizin ve Akıllı Arama",
    summary: "Uzman, işletme ve kurum dizini; ziyaretçiye de açık arama.",
    highlights: ["Aksan duyarsız Türkçe arama", "Vektör tabanlı anlamsal arama", "Profil sahiplenme ve doğrulama"],
    status: "canli",
  },
  {
    key: "asistan",
    title: "Yapay Zekâ Site Asistanı",
    summary: "Platformun kendi içeriğinden beslenen soru-cevap asistanı.",
    highlights: ["Erişime göre süzülen bilgi tabanı", "Alaka eşiğiyle uydurma cevap önleme", "Her sayfada erişilebilir"],
    status: "canli",
  },
  {
    key: "profil",
    title: "Profil ve Rol Sistemi",
    summary: `${LIVE_DB.rolesActive} aktif rol; her rolün göreceği alan ve özellik veritabanından yönetilir.`,
    highlights: ["Kod değişmeden rol/özellik açma", "Alan bazlı gizlilik", "Çoklu profil (bireysel + kurumsal)"],
    status: "canli",
  },
  {
    key: "etkinlik",
    title: "Etkinlik ve Topluluk Araçları",
    summary: "Etkinlik yayınlama, tavsiye isteme, davet ve liderlik tablosu.",
    highlights: ["Onay kuyruğu", "Saat dilimi farkında etkinlikler", "Davetle büyüme mekaniği"],
    status: "canli",
  },
  {
    key: "kariyer",
    title: "Kariyer",
    summary: "İlan yayını ve uçtan uca başvuru yönetimi.",
    highlights: ["Belgeler süreli imzalı bağlantıyla açılır", "Yöneticilere otomatik bildirim", "Tek yazma yolu"],
    status: "canli",
  },
  {
    key: "bildirim",
    title: "Bildirim ve E-posta Hattı",
    summary: "Olay tabanlı e-posta kuyruğu ve günlük yönetici özetleri.",
    highlights: ["Kuyruk + zamanlanmış gönderim", "Abonelik tercihleri", "Hata kayıtlarının merkezi takibi"],
    status: "canli",
  },
  {
    key: "yonetim",
    title: "Yönetim Paneli ve Muhasebe",
    summary: "70'i aşkın yönetici ekranı: komuta merkezi, içerik, üyeler, gelir-gider ve nakit akışı.",
    highlights: ["Rol tabanlı erişim", "Muhasebe modülü", "Toplu içe aktarma ve onay akışı"],
    status: "canli",
  },
  {
    key: "relocation",
    title: "Taşınma (Relocation) Motoru",
    summary: "Ülke bazlı bürokrasi adımları, hizmet rehberi ve değerlendirme araçları.",
    highlights: ["10 değerlendirme aracı", "Yapay zekâ destekli taşınma asistanı", "Motor hazır, içerik genişletiliyor"],
    status: "pilot",
  },
  {
    key: "radar",
    title: "Radar — Haber Tarama",
    summary: "Diasporayı ilgilendiren haberleri otomatik tarayan ve sınıflayan hat.",
    highlights: ["Zamanlanmış tarama", "Dil ve kalite süzgeci", "Yönetici onayı"],
    status: "pilot",
  },
  {
    key: "gruplar",
    title: "Dijital Gruplar",
    summary: "\"Linkini saklama, kapını paylaş\": doğrulamalı topluluk grubu katılımı.",
    highlights: ["Kimlik doğrulamalı katılım", "Yönetici onayı", "Spam'i kapıda durdurma"],
    status: "gelistiriliyor",
  },
];

const liveModuleCount = MODULES.filter((m) => m.status === "canli").length;

export const HERO_METRICS: readonly InvestorMetric[] = [
  { value: String(MODULES.length), label: "ürün modülü", hint: `${liveModuleCount}'i canlıda` },
  { value: tr(LIVE_DB.tables), label: "veritabanı tablosu", hint: `${tr(LIVE_DB.policies)} güvenlik politikası` },
  { value: tr(REPO.testFiles), label: "otomatik test dosyası", hint: `${REPO.e2eSpecs} uçtan uca senaryo` },
  { value: tr(REPO.edgeFunctions), label: "sunucu fonksiyonu", hint: "kaynak kodda · olay ve YZ işleri" },
];

export const STACK: readonly StackLayer[] = [
  {
    title: "Ön yüz",
    items: [
      { name: "React", version: v("react"), role: "Arayüz kütüphanesi" },
      { name: "TypeScript", version: v("typescript"), role: "Tip güvenli dil" },
      { name: "Vite", version: v("vite"), role: "Derleme ve geliştirme sunucusu" },
      { name: "Tailwind CSS + shadcn/ui", version: v("tailwindcss"), role: "Tasarım sistemi" },
      { name: "React Router", version: v("react-router-dom"), role: "Sayfa yönlendirme" },
      { name: "TanStack Query", version: v("@tanstack/react-query"), role: "Sunucu verisi önbelleği" },
      { name: "React Hook Form + Zod", version: v("zod"), role: "Form ve şema doğrulama" },
    ],
  },
  {
    title: "Arka uç ve veri",
    items: [
      { name: "PostgreSQL", role: "Ana veritabanı (yönetilen)" },
      { name: "Supabase", version: v("@supabase/supabase-js"), role: "Kimlik, API, dosya, gerçek zamanlı" },
      { name: "Deno Edge Functions", role: "Sunucu tarafı iş mantığı" },
      { name: "pg_cron + pg_net", role: "Zamanlanmış işler" },
      { name: "PostGIS · pg_trgm · unaccent", role: "Konum ve metin arama" },
    ],
  },
  {
    title: "Yapay zekâ",
    items: [
      { name: "Google Gemini", role: "Sohbet ve eşleştirme modelleri" },
      { name: "Gemini Embedding (1536 boyut)", role: "Anlamsal arama vektörleri" },
      { name: "pgvector (HNSW)", role: "Veritabanı içi vektör arama" },
      { name: "Sağlayıcı soyutlaması", role: "Model değişimi = ayar değişikliği" },
    ],
  },
  {
    title: "Kalite ve test",
    items: [
      { name: "Vitest + Testing Library", version: v("vitest"), role: "Birim ve bileşen testleri" },
      { name: "Playwright", version: v("@playwright/test"), role: "Uçtan uca tarayıcı testleri" },
      { name: "ESLint + tsc", role: "Statik analiz ve tip denetimi" },
    ],
  },
  {
    title: "Dağıtım",
    items: [
      { name: "Docker", role: "Çok aşamalı imaj" },
      { name: "nginx", role: "Statik sunum, yönlendirme, güvenlik başlıkları" },
      { name: "Kendi barındırılan PaaS", role: "Sürekli dağıtım ve ortam yönetimi" },
      { name: "Node.js", version: REPO.node.replace(">=", ""), role: "Derleme ortamı" },
    ],
  },
];

export const INFRA_POINTS: readonly InvestorMetric[] = [
  { value: "8", label: "güvenlik başlığı", hint: "her yanıtta, her yolda" },
  { value: "0", label: "satır içi betik izni", hint: "katı içerik güvenlik politikası" },
  { value: tr(LIVE_DB.scheduledJobs), label: "zamanlanmış iş", hint: "veritabanı içinde" },
  { value: tr(REPO.edgeFunctions), label: "sunucu fonksiyonu", hint: "kaynak kodda · Deno" },
];

export const DB_METRICS: readonly InvestorMetric[] = [
  { value: tr(LIVE_DB.tables), label: "tablo", hint: "uygulama tablolarının tamamında RLS" },
  { value: tr(LIVE_DB.policies), label: "erişim politikası", hint: "RLS" },
  { value: `${Math.floor(LIVE_DB.securedFunctions / 100) * 100}+`, label: "denetlenmiş sunucu fonksiyonu", hint: "yetkiyi içeride doğrular" },
  { value: tr(LIVE_DB.indexes), label: "indeks", hint: "sorgu performansı" },
  { value: tr(REPO.migrations), label: "sürümlü şema değişikliği", hint: "migration" },
  { value: tr(LIVE_DB.rolesActive), label: "aktif rol", hint: `${LIVE_DB.profileAttributes} alan · ${LIVE_DB.features} özellik` },
];

export const CODE_METRICS: readonly InvestorMetric[] = [
  { value: tr(REPO.sourceFiles), label: "kaynak dosya", hint: "TypeScript / TSX" },
  { value: `${Math.round(REPO.productionLines / 1000)} bin`, label: "satır üretim kodu", hint: "üretilen dosyalar hariç" },
  { value: tr(REPO.testFiles), label: "test dosyası", hint: `${REPO.e2eSpecs} uçtan uca senaryo` },
  { value: tr(REPO.lazyRoutes), label: "ayrı yüklenen sayfa paketi", hint: "hızlı ilk açılış" },
];

export const QUALITY_GATES: readonly string[] = [
  "Her değişiklikte otomatik kalite hattı (CI)",
  "CI aksiyonları sürüme değil özete sabitli (tedarik zinciri)",
  "Lint ve tip denetimi",
  "Ölü kod taraması",
  "Metin kodlama denetimi (Türkçe karakter bozulması)",
  "Şema ↔ canlı veritabanı sapma kontrolü",
  "Sunucu fonksiyonu repo ↔ canlı sapma kontrolü",
  "Paket boyutu bütçesi",
];

export const TECH_DETAILS: Record<string, readonly DetailBlock[]> = {
  ozellikler: [
    {
      title: "Modüler alan tasarımı",
      points: [
        "Her modül kendi veri katmanı, şema doğrulaması ve biçimlendirme dosyalarıyla ayrılır.",
        "Ürün kararları (limitler, eşikler, bayraklar) kodda değil, veritabanındaki ayar tablolarındadır; değiştirmek yeniden yayın gerektirmez.",
        "Özellik bayrakları rol bazında açılıp kapanır.",
      ],
    },
    {
      title: "Türkçe öncelikli",
      points: [
        "Arama, sıralama ve büyük/küçük harf dönüşümleri Türkçe kurallarına göre yapılır (İ/ı sorunu yok).",
        "Aksan duyarsız eşleşme: \"uskudar\" yazan \"Üsküdar\"ı bulur.",
      ],
    },
  ],
  teknolojiler: [
    {
      title: "Yapay zekâ yönetişimi",
      points: [
        "Asistanın göreceği belgeler kullanıcının erişim düzeyine göre veritabanı içinde süzülür; istemcinin rol iddiasına güvenilmez.",
        "Ölçülmüş alaka eşiği: bağlam bulunamazsa model uydurmak yerine bilmediğini söyler.",
        "Vektörler kendi veritabanımızda tutulur; bilgi tabanı dış bir vektör servisine taşınmaz.",
        "Yer tutucu ve yönetici/test kayıtları bilgi tabanından açıkça elenir.",
      ],
    },
    {
      title: "Neden bu seçimler",
      points: [
        "React + TypeScript: en büyük işe alım havuzu, uzun vadeli destek.",
        "Yönetilen PostgreSQL: açık kaynak çekirdek; gerekirse kendi sunucumuza taşınabilir.",
        "Yapay zekâ çağrıları tek bir soyutlamadan geçer; sağlayıcı değişimi kod değil ayar işidir.",
      ],
    },
  ],
  altyapi: [
    {
      title: "İstek akışı",
      points: [
        "Tarayıcı statik uygulamayı CDN arkasındaki nginx konteynerinden alır.",
        "Veri istekleri doğrudan yönetilen API'ye gider; her istek kullanıcının kendi oturum jetonuyla ve RLS süzgecinden geçer.",
        "Yapay zekâ ve e-posta gibi gizli anahtar gerektiren işler yalnız sunucu fonksiyonlarında çalışır; anahtarlar tarayıcıya hiç inmez.",
      ],
    },
    {
      title: "Güvenlik başlıkları",
      points: [
        "İçerik Güvenlik Politikası (CSP) — satır içi betik yasak.",
        "HSTS, çerçeveleme (clickjacking) koruması, MIME koklama koruması.",
        "Referrer, izin ve köken-arası (COOP/CORP) politikaları.",
        "Eski adresler kalıcı (301) yönlendirmelerle korunur; tek kaynak tablodan üretilir ve testle kilitlidir.",
      ],
    },
  ],
  veritabani: [
    {
      title: "Tasarım ilkeleri",
      points: [
        "Satır düzeyi güvenlik (RLS) her uygulama tablosunda açık.",
        "Kritik modüllerde istemciye doğrudan yazma izni yoktur; yazmalar yetkiyi içeride doğrulayan fonksiyonlardan geçer.",
        "Veritabanı ve uygulama kodundaki eş kurallar (ör. sıralama, katılım koşulları) karşılıklı testlerle aynı tutulur.",
        "Büyük sonuç kümeleri sayfalı okunur; sessiz satır kesmesine karşı denetim vardır.",
      ],
    },
    {
      title: "Kişisel veri (KVKK / GDPR)",
      points: [
        "Hesap silme talebi uçtan uca işlenir (silinme hakkı).",
        "Telefon numarası herkese açık profil ve sayfalarda gösterilmez; gizli alanlar herkese açık sorgulara hiç girmez.",
        "Ziyaretçiye açık aramada iletişim bilgileri kullanılmaz.",
        "Hata kayıtlarına kullanıcı içeriği gönderilmez; kayıtlar sınırlı süre saklanır.",
      ],
    },
    {
      title: "Değişiklik disiplini",
      points: [
        "Her şema değişikliği tarihli, geri alınamaz bir migration dosyasıdır; geçmiş silinmez.",
        "Repo ile canlı veritabanı arasındaki sapma otomatik betikle kontrol edilir.",
        "Şemanın tam anlık görüntüsü (baseline) repoda saklanır; sıfırdan kurulum mümkündür.",
      ],
    },
  ],
  kod: [
    {
      title: "Sözleşme testleri",
      points: [
        "Yönlendirme tablosu ↔ sunucu yapılandırması, site haritası ↔ yetkili sayfalar, hata kodu haritaları gibi çift taraflı kurallar testle kilitlidir.",
        "Kaynak kodu tarayan testler yasaklı desenleri (ör. tip zorlaması, Türkçe'de yanlış harf dönüşümü) yakalar.",
      ],
    },
    {
      title: "Mimari düzen",
      points: [
        "Veri erişimi bileşenlerden ayrılmış API katmanında toplanır; bileşenlerde doğrudan tablo sorgusu kalmadı.",
        "Büyük dosyalar odaklı modüllere bölündü; 800 satırı aşan üretim kaynak dosyası yok.",
        "Sayfalar ihtiyaç anında yüklenir; ilk açılış paketi küçük tutulur.",
      ],
    },
  ],
  danismanlik: [
    {
      title: "Mühendislik çalışma modeli",
      points: [
        "Yapay zekâ destekli geliştirme: kodu yazan ve inceleyen ajanlar ayrıdır; inceleme \"onayla\" değil \"çürütmeye çalış\" görevidir.",
        "Önce ölç, sonra yaz: dokümandaki her rakam bir komutla yeniden üretilebilir.",
        "Kurumsal hafıza repoda: mimari kararlar, değişmez kurallar ve olay notları kodun yanında tutulur.",
      ],
    },
    {
      title: "Önerilen danışmanlık gündemi",
      points: [
        "Platform ölçek stratejisi: büyüme senaryolarına göre mimari, kapasite ve maliyet planı.",
        "Yapay zekâ stratejisi ve yönetişimi: kullanım alanlarının önceliklendirilmesi, model ve veri politikası.",
        "Güvenlik ve uyum yol haritası: KVKK/GDPR olgunluğu, denetime hazırlık, hizmet seviyesi hedefleri.",
        "Ödeme ve kurumsal entegrasyonlar: gelir modelini taşıyacak altyapı kararları.",
        "Mühendislik organizasyonu: ekip yapısı, işe alım profili ve teslimat süreçleri.",
      ],
    },
  ],
};

export interface HandoverColumn {
  readonly title: string;
  readonly tone: "strong" | "grow";
  readonly items: readonly { readonly title: string; readonly text: string }[];
}

/** 06 · Teknik Danışmanlık — dürüst durum tablosu. Hassas ayrıntı (kusur, kapasite) YAZILMAZ. */
export const HANDOVER: readonly HandoverColumn[] = [
  {
    title: "Güçlü temeller",
    tone: "strong",
    items: [
      { title: "Veritabanında güvenlik", text: "Yetki kararı istemcide değil; veritabanı politikalarında ve denetlenmiş fonksiyonlarda verilir." },
      { title: "Satıcıdan bağımsızlık", text: "Çekirdek açık kaynak PostgreSQL; kendi sunucumuza taşınma yolu değerlendirildi." },
      { title: "Ölçüm kültürü", text: "Rakamlar betiklerle üretilir; repo ↔ canlı sapmaları otomatik yakalanır." },
      { title: "Kurallar testte yaşar", text: "Sessiz hata sınıfları sözleşme testleriyle kilitli; bilgi kişide değil kodda." },
      { title: "Yapay zekâ hazır veri katmanı", text: "Vektör arama veritabanının içinde; model sağlayıcısı ayarla değişir." },
    ],
  },
  {
    title: "Olgunlaşacak alanlar",
    tone: "grow",
    items: [
      { title: "Uçtan uca test kapsamı", text: "Güvence bugün birim ve sözleşme testlerinde; tarayıcı senaryoları büyütülmeli." },
      { title: "Sunucu fonksiyonu dağıtımı", text: "Ön yüz otomatik yayınlanır; sunucu fonksiyonlarının da aynı CI/CD hattına bağlanması sıradaki adımdır." },
      { title: "Tip katılığı", text: "Derleyici katı modu bilinçli kapalı (tip hatası 0); yeni kod katı yazılıyor, kademeli açılış planlanmalı." },
      { title: "Gözlemlenebilirlik", text: "İstemci hataları merkezi kayıtta; uygulama performansı izleme (APM) ve uyarı katmanı eklenmeli." },
      { title: "Ölçek ve maliyet planı", text: "Büyüme senaryolarına göre kapasite, önbellek ve maliyet planı çıkarılmalı." },
    ],
  },
];

export const ROADMAP: readonly string[] = [
  "Dijital Gruplar modülünün tamamlanması (telefon doğrulama + kurumsal doğrulama)",
  "Topluluk motorunun ücretsiz katmanının genişletilmesi",
  "Taşınma rehberinde gerçek içerik kapsamının ülke ülke büyütülmesi",
  "Uçtan uca test kapsamının kritik akışlarda artırılması",
];

export const CONTACT = {
  label: "İletişim",
  email: "info@corteqs.net",
  ctaTitle: "Teknik danışmanlık görüşmesi",
  ctaText: "Mimariyi, kod tabanını ve büyüme yol haritasını canlı bir oturumda birlikte değerlendirelim.",
  ctaButton: "Görüşme planlayalım",
  ctaSubject: "CorteQS teknik danışmanlık görüşmesi",
} as const;

export const REPO_MEASURED_AT = REPO.measuredAt;
