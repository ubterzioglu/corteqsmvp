import type {
  KadroAxisId, KadroCandidateStage, KadroDeptId, KadroPriority,
  KadroStatus, KadroWaveId, KadroWorkType,
} from "./kadro-types";

export type KadroDept = {
  id: KadroDeptId;
  name: string;
  short: string;
  desc: string;
};

export const KADRO_DEPTS: KadroDept[] = [
  {
    id: "kurucu",
    name: "Kuruluş & Liderlik",
    short: "Liderlik",
    desc: "Kurucu ortaklar, bölüm başları ve dışarıdan danışmanlar. Karar yetkisi burada: CEO ticari, CTO teknik, ikisinin yazılı onayı gereken Reserved Matters ayrı.",
  },
  {
    id: "pazarlama",
    name: "Pazarlama & Büyüme",
    short: "Pazarlama",
    desc: "Instagram yayın kanalı, şehir lansmanları, içerik hatları ve performans reklamları. Ürün, işlev ve coğrafya eksenlerinde 27 rolle projenin en büyük bölümü.",
  },
  {
    id: "urun",
    name: "Ürün & Teknoloji",
    short: "Ürün & Tech",
    desc: "Lovable üzerinde fullstack, frontend, backend, mobil, QA, AI, veri ve DevOps. Ürün yönünü CTO ile birlikte taşır, sprint planlamasını kendi yapar.",
  },
  {
    id: "operasyon",
    name: "Operasyon & Güven",
    short: "Operasyon",
    desc: "Platform güvenliği, moderasyon, partner ilişkileri, kullanıcı başarısı ve topluluk sağlığı. Şehir lansmanlarının sahada sorunsuz dönmesinden sorumludur.",
  },
  {
    id: "gelir",
    name: "Gelir & Ortaklıklar",
    short: "Gelir",
    desc: "B2B satış, sponsorluk ve hesap yönetimi. İlk gelir sinyallerini toplar, marka ortaklıklarını yapılandırır ve uzun vadeli hesap ilişkilerini taşır.",
  },
  {
    id: "kurumsal",
    name: "Finans, Hukuk & İdari",
    short: "Kurumsal",
    desc: "Muhasebe, hukuk, İK ve genel idari işler. Early-stage'de lean tutulur; dış danışman ve part-time rollerle desteklenir.",
  },
];

export type KadroAxis = { id: KadroAxisId; name: string; desc: string };
export const KADRO_AXES: KadroAxis[] = [
  { id: "urun", name: "Ürün hattı", desc: "İsmi olan, sahibi olan, takvimi olan yayın ürünleri. Her birinin tek sorumlusu vardır." },
  { id: "islev", name: "İşlev hattı", desc: "Kanal bazlı beceri rolleri: Instagram, LinkedIn, YouTube, SEO, CRM, analitik. Ürünlerden bağımsız çalışır ama onlara hizmet eder." },
  { id: "cografya", name: "Coğrafya hattı", desc: "Şehir, bölge ve ülke bazlı lansman rolleri. Her coğrafyanın kendi küratörü ve kendi takvimi vardır." },
  { id: "merkez", name: "Merkez", desc: "Bölümler arası koordinasyon, strateji ve liderlik rolleri. Doğrudan kurucu ortaklara rapor eder." },
];

export type KadroWave = { id: KadroWaveId; name: string; range: string; desc: string };
export const KADRO_WAVES: KadroWave[] = [
  { id: 1, name: "Dalga 1 — Şimdi", range: "0–3 ay", desc: "MVP yayında, Instagram yayın kanalı düzenli dönüyor, ilk şehirler aktif." },
  { id: 2, name: "Dalga 2 — Yakın", range: "3–6 ay", desc: "İlk gelir sinyali doğrulandı, ikinci şehir açılıyor, performans kanalları devrede." },
  { id: 3, name: "Dalga 3 — Sonra", range: "6–12 ay", desc: "Ölçeklenme dönemi: yeni coğrafyalar, B2B hattı, platform güvenliği ve otomasyon." },
];

export const KADRO_WORK_TYPES: Record<KadroWorkType, string> = {
  core: "Çekirdek",
  part: "Part-time",
  proje: "Proje bazlı",
  topluluk: "Gönüllü / Topluluk",
  danisman: "Danışman",
  dis: "Dış kaynak / Freelance",
};

export type KadroTone = "crit" | "warn" | "info" | "ok" | "mute" | "open";

export const KADRO_STATUSES: Record<KadroStatus, { label: string; tone: KadroTone }> = {
  dolu: { label: "Dolu", tone: "ok" },
  destek: { label: "Destek veriyor", tone: "ok" },
  gorusme: { label: "Görüşmede", tone: "info" },
  aday: { label: "Aday var", tone: "info" },
  teklif: { label: "Teklif aşaması", tone: "warn" },
  acik: { label: "Açık", tone: "open" },
  beklemede: { label: "Beklemede", tone: "mute" },
};

export const KADRO_PRIORITIES: Record<KadroPriority, { label: string; tone: KadroTone }> = {
  kritik: { label: "Kritik", tone: "crit" },
  yuksek: { label: "Yüksek", tone: "warn" },
  orta: { label: "Orta", tone: "info" },
  dusuk: { label: "Düşük", tone: "mute" },
};

export const KADRO_CANDIDATE_STAGES: Record<KadroCandidateStage, string> = {
  aday: "Aday",
  gorusme: "Görüşmede",
  teklif: "Teklif verildi",
  kapandi: "Kapandı",
};

export const KADRO_OPEN_STATUSES: KadroStatus[] = ["acik", "aday", "gorusme", "teklif"];
export const KADRO_FILLED_STATUSES: KadroStatus[] = ["dolu", "destek"];

export const KADRO_AD_BLOCKS = {
  startup: `CorteQS şu anda erken aşama, pre-launch bir start-up. Ekibin çekirdeği iki kurucudan oluşuyor; üzerlerinde doğrulanmış bir ürün-müşteri uyumu var ama ölçeklenmemiş. Şehir bazlı Instagram yayın kanalı canlı, ilk içerik ürünleri yayında ve ilk topluluk sinyalleri alınmış durumda. Bu role gelen kişi, sıfırdan kurulan değil, ilk ivmeyi yakalamış bir projeye omuz verir — belirsizlik yüksektir, ama yön bellidir.`,
  model: `Erken dönemde roller; iş paketi bazlı çalışma, sonuç odaklı değerlendirme ve şeffaf iletişim esas alınır. Maaş yerine iş paketi + erken aşama hissesi (ESOP) kombinasyonu konuşulur; nakit akışı henüz düzenli değildir. Her rolün kendi KPI'ı vardır ve haftalık cadence ile ölçülür. Uzaktan çalışma esastır, gerektiğinde şehir içi yüz yüze görüşmeler beklenir.`,
  apply: `Başvuru için şunları yaz: ad soyad, hangi şehirde yaşadığın, bu role neden uygun olduğunu gösteren iki-üç cümle, ve varsa ilgili bir çalışma örneği (LinkedIn, portfolyo, GitHub, yayın linki). Başvurunu inceledikten sonra uygun bulursak bir görev testi göndeririz — test, rolün gerçek işinden bir kesit içerir ve ortalama 2-4 saat sürer. Testi geçen adayla 30 dakikalık bir görüntülü görüşme yapılır.`,
} as const;
