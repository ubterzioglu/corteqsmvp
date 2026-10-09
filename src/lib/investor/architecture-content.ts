// Teknik mimari / CTO özeti (/information/mimari) içeriği — TEK KAYNAK.
//
// ⚠️ investor-content.ts ile AYNI GÜVENLİK SINIRI: sayfa istemci taraflı parolayla
// korunur. Proje kimliği, host/IP, tablo/RPC/secret adı, açık kusur, kapasite
// rakamı YAZILMAZ. `investor-content-safety.test.ts` bu dosyayı da tarar.
// Rakamlar elle yazılmaz: repo rakamları üretilir, canlı DB rakamları LIVE_DB'den gelir.

import { INVESTOR_REPO_STATS as REPO } from "./investor-stats.generated";
import { LIVE_DB, type InvestorMetric, type InvestorSection } from "./investor-content";

const tr = (n: number): string => n.toLocaleString("tr-TR");
const major = (name: keyof typeof REPO.versions): string => REPO.versions[name].split(".")[0];

export interface ArchTile {
  readonly title: string;
  readonly text: string;
}

export interface ArchRow {
  readonly label: string;
  readonly value: string;
  readonly note?: string;
}

export const ARCH_HERO = {
  kicker: "Teknik Mimari · CTO Özeti",
  title: "CorteQS platformu uçtan uca nasıl çalışır",
  lead:
    "Uygulama mimarisi, çalışma düzeni, kimlik ve entegrasyonlar, kalite kapıları ve ölçülebilir teknik hacim — beş sayfada, ölçülmüş rakamlarla.",
} as const;

export const ARCH_SECTIONS: readonly InvestorSection[] = [
  {
    id: "mimari-butun",
    eyebrow: "01 · Sistemin bütünü",
    title: "Uygulama mimarisi",
    lead:
      "Sosyal akış, dizin, yapay zekâ asistanı, taşınma rehberi, kariyer ve yönetim paneli; ortak kimlik ve veri katmanı üzerinde çalışan tek sayfa uygulaması (SPA).",
  },
  {
    id: "mimari-isletim",
    eyebrow: "02 · Çalışma düzeni",
    title: "Konteyner + yönetilen veri platformu",
    lead:
      "Ön yüz Docker konteynerinde nginx ile sunulur; kimlik, veri, dosya ve sunucu fonksiyonları yönetilen PostgreSQL platformunda çalışır. Derleme bir kez yapılır, yapılandırma çalışma anında verilir.",
  },
  {
    id: "mimari-kimlik",
    eyebrow: "03 · Tek üyelik",
    title: "Kimlik ve entegrasyonlar",
    lead:
      "Google ve e-posta/şifre girişi aynı üyelik modelinde birleşir. Rol, profil alanları ve özellik bayrakları oturum açılınca veritabanından yüklenir; istemcinin rol iddiasına güvenilmez.",
  },
  {
    id: "mimari-kalite",
    eyebrow: "04 · Main'den canlıya",
    title: "Kalite kapılarıyla dağıtım",
    lead:
      "Her pull request ve main'e her gönderim aynı kalite hattından geçer. Bir adım düşerse değişiklik birleşmez; sessizce bozulabilecek kurallar sözleşme testleriyle kilitlidir.",
  },
  {
    id: "mimari-olcum",
    eyebrow: "05 · Ölçülebilir durum",
    title: "Veri ve kaynak ölçümleri",
    lead:
      "Veritabanı rakamları canlı katalog sorgusuyla, kaynak rakamları Git'te izlenen dosyalar üzerinden betikle üretilir. Elle yazılmış rakam yoktur.",
  },
];

// ── 01 · Uygulama mimarisi ────────────────────────────────────────────────

export const APP_CLIENT: ArchTile = {
  title: "Web · Üye hesabı · Yönetim paneli",
  text: "Tarayıcı / React + TypeScript tek sayfa uygulaması",
};

export const APP_SECRETS: ArchTile = {
  title: "Gizli anahtarlar",
  text: "Yalnız sunucu fonksiyonlarında; tarayıcıya inmez",
};

export const APP_CORE = {
  label: "Konteyner / nginx",
  title: "nginx → React SPA",
  text: "Router · React Query · Zod formlar · ayrı yüklenen sayfa paketleri · CSP",
} as const;

export const APP_MODULES: readonly ArchTile[] = [
  { title: "Kimlik ve profil", text: "Google, e-posta, rol ve alanlar" },
  { title: "Cadde ve topluluk", text: "Akış, Cafe, Çarşı, moderasyon" },
  { title: "Dizin ve arama", text: "Anlamsal + aksan duyarsız" },
  { title: "Yapay zekâ", text: "Site ve taşınma asistanı" },
  { title: "Kariyer ve etkinlik", text: "İlan, başvuru, onay kuyruğu" },
  { title: "Yönetim ve muhasebe", text: "Komuta merkezi, gelir-gider" },
];

export const APP_EXTERNAL: readonly ArchTile[] = [
  { title: "Google", text: "OAuth 2.0 / OpenID Connect" },
  { title: "Google Gemini", text: "Sohbet + anlamsal vektör" },
  { title: "Kurumsal e-posta", text: "Doğrulama ve bildirim postaları" },
  { title: "WhatsApp", text: "Telefon doğrulama kodu" },
];

export const APP_PLATFORM = {
  title: "Yönetilen PostgreSQL platformu",
  lines: [
    "Kimlik · REST API (RLS süzgeçli) · Dosya depolama · Sunucu fonksiyonları (Deno)",
    "pgvector · PostGIS · metin arama · zamanlanmış işler · olay tabanlı e-posta kuyruğu",
  ],
} as const;

export const APP_NOTE =
  "Statik dosyalar konteynerden, kullanıcı dosyaları yetki kontrollü depolamadan süreli imzalı bağlantıyla sunulur. Yetki kararı veritabanı politikalarında verilir; kritik yazımlar yalnız denetlenmiş fonksiyonlardan geçer. Sosyal akış uyarlanabilir yoklamayla yenilenir: etkin sekmede sık, boşta seyrek.";

export const APP_METRICS: readonly InvestorMetric[] = [
  { value: tr(LIVE_DB.tables), label: "Veri tablosu" },
  { value: tr(LIVE_DB.policies), label: "Erişim politikası" },
  { value: tr(REPO.testFiles), label: "Test dosyası" },
  { value: `${Math.round(REPO.productionLines / 1000)} bin`, label: "Satır üretim kodu" },
];

// ── 02 · Çalışma düzeni ───────────────────────────────────────────────────

export const RUNTIME_FLOW: readonly (ArchTile & { readonly tone: "light" | "navy" | "plain" })[] = [
  { title: "Docker imajı", text: "Çok aşamalı: Node derleme → nginx sunum", tone: "light" },
  { title: "Uygulama konteyneri", text: "Kendi barındırılan PaaS · kullanıcı isteklerini karşılar", tone: "navy" },
  { title: "Sunucu fonksiyonları", text: `${REPO.edgeFunctions} Deno fonksiyonu · olay ve YZ işleri`, tone: "plain" },
];

export const RUNTIME_DB = {
  title: "Yönetilen PostgreSQL",
  text: `${tr(LIVE_DB.tables)} tablo · ${LIVE_DB.extensions} eklenti · ${LIVE_DB.scheduledJobs} zamanlanmış iş · tam şema anlık görüntüsü repoda`,
} as const;

export const RUNTIME_ROWS: readonly ArchRow[] = [
  { label: "Uygulama sunumu", value: "nginx · statik paket + çalışma anı yapılandırma dosyası" },
  { label: "Yapılandırma", value: "Ortam değerleri konteyner açılışında yazılır · yeniden derleme gerekmez" },
  { label: "Güvenlik başlıkları", value: "8 başlık her yolda · CSP satır içi betiğe kapalı · HSTS" },
  { label: "Yönlendirmeler", value: "Eski adresler kalıcı 301 · tek kaynak tablo + drift testi" },
  { label: "Kod bölme", value: `${REPO.lazyRoutes} sayfa paketi ihtiyaç anında yüklenir · paket boyutu bütçesi CI'da` },
  { label: "Şema değişikliği", value: `${tr(REPO.migrations)} sürümlü migration · repo ↔ canlı sapma denetimi` },
  { label: "Sunucu fonksiyonları", value: "Repo ↔ canlı sürüm karşılaştırması betikle yapılır" },
];

export const RUNTIME_NOTE = {
  title: "Kimlik ayrımı:",
  text: "Tarayıcı yalnız herkese açık istemci anahtarını taşır; her veri isteği kullanıcının kendi oturum jetonuyla ve satır düzeyi güvenlik süzgecinden geçer. Yapay zekâ ve e-posta gibi gizli anahtar isteyen işler yalnız sunucu fonksiyonlarında çalışır.",
} as const;

export const RUNTIME_FOOTNOTE =
  "Ön yüz main'den otomatik yayınlanır; sunucu fonksiyonlarının da aynı CI/CD hattına bağlanması sıradaki adımdır.";

// ── 03 · Kimlik ve entegrasyonlar ─────────────────────────────────────────

export const AUTH_STEPS: readonly ArchTile[] = [
  { title: "01 · Başlat", text: "Sağlayıcı yönlendirmesi veya form" },
  { title: "02 · Doğrula", text: "Sağlayıcı onayı / e-posta kodu" },
  { title: "03 · Oturum aç", text: "Rol + profil + özellik bayrakları" },
];

export const AUTH_ROWS: readonly ArchRow[] = [
  { label: "Google", value: "OAuth 2.0 / OpenID Connect", note: "Ad, e-posta, fotoğraf; tek tıkla üyelik." },
  { label: "E-posta / şifre", value: "Doğrulama postası zorunlu", note: "Kurumsal alan adından SMTP ile gönderim; parola özetlenerek saklanır." },
  {
    label: "Telefon",
    value: "WhatsApp ile doğrulama kodu",
    note: "Yalnız mevcut hesaba numara ekler; numara herkese açık yüzeylerde gösterilmez. Pilot.",
  },
  { label: "Yapay zekâ", value: "Google Gemini", note: "Sohbet ve 1536 boyutlu vektör; sağlayıcı soyutlamasıyla değiştirilebilir." },
  { label: "Bildirimler", value: "Olay tabanlı e-posta kuyruğu", note: "Zamanlanmış gönderim, abonelik tercihleri, günlük yönetici özeti." },
  { label: "Haber taraması", value: "Radar", note: "Zamanlanmış tarama, dil ve kalite süzgeci, yönetici onayı." },
];

export const AUTH_NOTE = {
  title: "Yetki modeli:",
  text: `${LIVE_DB.rolesTotal} rol (${LIVE_DB.rolesActive} aktif), ${LIVE_DB.profileAttributes} profil alanı ve ${LIVE_DB.features} özellik veritabanından yönetilir. Yeni rol veya özellik açmak kod değişikliği değil, veri değişikliğidir.`,
} as const;

export const AUTH_FOOTNOTE =
  "Ödeme, para transferi ve kurumsal entegrasyonlar henüz devrede değil; gelir modelini taşıyacak altyapı kararları yol haritasındadır.";

// ── 04 · Kalite kapıları ──────────────────────────────────────────────────

export const PIPELINE_SOURCE: ArchTile = { title: "GitHub / PR → main", text: "Kilitli bağımlılıklar · özete sabitli CI aksiyonları" };

export const PIPELINE_CHECKS: readonly ArchTile[] = [
  { title: "Kalite ön denetimi", text: "Metin kodlama + Türkçe karakter" },
  { title: "ESLint", text: "Statik analiz" },
  { title: "Vitest", text: `${tr(REPO.testFiles)} test dosyası` },
  { title: "Üretim derlemesi", text: "Vite paketleme" },
  { title: "Paket bütçesi", text: "İlk açılış boyutu sınırı" },
  { title: "Ölü kod taraması", text: "Erişilemeyen kaynak" },
  { title: "Doküman sapması", text: "Mimari notlar ↔ kod" },
  { title: "Araç kataloğu", text: "Üretilen katalog güncel mi" },
];

export const PIPELINE_STEPS: readonly (ArchTile & { readonly tone: "light" | "plain" | "navy" })[] = [
  { title: "Sözleşme testleri", text: "Yönlendirme ↔ nginx, site haritası ↔ yetki, SQL ↔ TS kuralları çift yönlü kilitli.", tone: "light" },
  { title: "Docker imajı → PaaS", text: "main'e birleşen sürüm konteynere derlenir ve otomatik yayınlanır.", tone: "plain" },
  { title: "Yayın sonrası doğrulama", text: "Canlı paketler, güvenlik başlıkları ve yönlendirmeler betikle denetlenir.", tone: "navy" },
];

export const PIPELINE_NOTE =
  "Düşen, iptal edilen veya atlanan zorunlu adım birleştirmeyi kapatır. Tip denetimi sıfır hatada tutulur ve yeni kod katı tiple yazılır.";

export const PIPELINE_METRICS: readonly InvestorMetric[] = [
  { value: String(PIPELINE_CHECKS.length), label: "Zorunlu CI adımı" },
  { value: tr(REPO.testFiles), label: "Otomatik test dosyası" },
  { value: String(REPO.e2eSpecs), label: "Uçtan uca senaryo" },
];

// ── 05 · Ölçümler ─────────────────────────────────────────────────────────

export const DB_ROWS: readonly ArchRow[] = [
  { label: "Tablo / RLS açık", value: `${tr(LIVE_DB.tables)} / ${tr(LIVE_DB.tablesWithRls)}` },
  { label: "Erişim politikası", value: tr(LIVE_DB.policies) },
  { label: "Denetlenmiş sunucu fonksiyonu", value: tr(LIVE_DB.securedFunctions) },
  { label: "İndeks / tetikleyici", value: `${tr(LIVE_DB.indexes)} / ${tr(LIVE_DB.triggers)}` },
  { label: "Zamanlanmış iş / eklenti", value: `${LIVE_DB.scheduledJobs} / ${LIVE_DB.extensions}` },
  { label: "Rol (aktif) · alan · özellik", value: `${LIVE_DB.rolesTotal} (${LIVE_DB.rolesActive}) · ${LIVE_DB.profileAttributes} · ${LIVE_DB.features}` },
];

export const CODE_ROWS: readonly ArchRow[] = [
  { label: "Kaynak dosya (TypeScript / TSX)", value: `${tr(REPO.sourceFiles)} dosya`, note: `${tr(REPO.productionLines)} satır` },
  { label: "Sayfa / bileşen", value: `${REPO.pages} sayfa`, note: `${REPO.components} bileşen` },
  { label: "Test", value: `${tr(REPO.testFiles)} dosya`, note: `${REPO.e2eSpecs} uçtan uca senaryo` },
  { label: "Şema ve sunucu", value: `${tr(REPO.migrations)} migration`, note: `${REPO.edgeFunctions} sunucu fonksiyonu` },
];

export const CODE_FOOTNOTE =
  "Satır sayısı üretilen dosyalar (tip tanımları, katalog çıktıları) hariç üretim kodudur. Sayım yalnız Git'te izlenen dosyalar üzerinden yapılır.";

/** Yalnız ana sürüm: tam sürüm bilinen açıkları eşlemeyi kolaylaştırır. */
export const VERSION_LINE = [
  `React ${major("react")}`,
  `TypeScript ${major("typescript")}`,
  `Vite ${major("vite")}`,
  `React Router ${major("react-router-dom")}`,
  `TanStack Query ${major("@tanstack/react-query")}`,
  `Supabase JS ${major("@supabase/supabase-js")}`,
  `Vitest ${major("vitest")}`,
  `Node.js ${REPO.node.replace(">=", "")}+`,
].join(" · ");

export const MEASURED_LINE = `Kod tabanı ${REPO.measuredAt} · canlı veritabanı ${LIVE_DB.measuredAt}`;
