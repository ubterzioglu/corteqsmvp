import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const isWriteMode = args.includes("--write");
const envArg = args.find((arg) => arg.startsWith("--env-file="));
const envFilePath = path.resolve(projectRoot, envArg ? envArg.slice("--env-file=".length) : ".env.local");

const IMPORT_DATE = "2026-05-13";
const P0_DUE_DATE = "2026-05-19";
const IMPORT_SORT_BASE = 13000;

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`OK: ${message}`);
}

function info(message) {
  console.log(`INFO: ${message}`);
}

function parseEnvFile(content) {
  const result = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

async function loadEnv() {
  try {
    const content = await readFile(envFilePath, "utf8");
    return parseEnvFile(content);
  } catch (error) {
    fail(`Env file okunamadı: ${envFilePath}`);
  }
}

function formatChecklist(items) {
  return items.map((item) => `- [ ] ${item}`).join("\n");
}

function buildTodoDetail(items) {
  return `${formatChecklist(items)}\n\nImport Kaynağı: 13 Mayıs toplantı todo paketi`;
}

function createTodoRecord({
  code,
  ownerLabel,
  phase,
  title,
  detailItems,
  categoryLabel,
  assignee,
  priority,
  urgent,
  dueDate,
  sortOrder,
}) {
  return {
    item_type: "todo",
    title,
    detail: buildTodoDetail(detailItems),
    category_label: categoryLabel,
    assignee,
    status: "Baslanmadi",
    priority,
    due_date: dueDate,
    urgent,
    legacy_source_type: "todo_items",
    legacy_source_code: null,
    legacy_source_date_label: `${IMPORT_DATE} ${phase}`,
    legacy_source_category: ownerLabel,
    legacy_source_title: code,
    sort_order: sortOrder,
  };
}

function createMeetingRecord({ code, title, detailItems, sortOrder }) {
  return {
    item_type: "meeting_note",
    title,
    detail: formatChecklist(detailItems),
    category_label: "13 Mayıs",
    assignee: "UBT",
    status: "Beklemede",
    priority: 6,
    due_date: null,
    urgent: false,
    legacy_source_type: "meeting_notes",
    legacy_source_code: "MAN",
    legacy_source_date_label: "13 Mayıs",
    legacy_source_category: "mvp-hedefleri",
    legacy_source_title: code,
    sort_order: sortOrder,
  };
}

const records = [
  createTodoRecord({
    code: "cc-import-2026-05-13-baris-p0-01",
    ownerLabel: "Barış",
    phase: "P0",
    title: "19 Mayıs akışını yayına hazır hale getir",
    categoryLabel: "Landing Page & Web",
    assignee: "UBT",
    priority: 9,
    urgent: true,
    dueDate: P0_DUE_DATE,
    sortOrder: IMPORT_SORT_BASE + 1,
    detailItems: [
      "19 Mayıs için kullanılacak ana landing / kampanya alanını netleştir.",
      "Kullanıcının 19 Mayıs etkinliği için ne yapacağını tek cümleyle açıklayan CTA ekle.",
      "“Fotoğraf gönder” akışını kontrol et.",
      "“Fikir yaz / fikir gönder” akışını kontrol et.",
      "Gönderilen içeriklerin admin paneline düşüp düşmediğini test et.",
      "Admin panelinden içeriklerin görüntülenmesini test et.",
      "İçeriklerin sosyal medyada paylaşılabilir formatta alınabildiğini kontrol et.",
      "19 Mayıs için kullanıcı tarafında kafa karıştıran butonları temizle.",
      "19 Mayıs sayfasını mobil görünümde test et.",
      "19 Mayıs sayfasını sosyal medya duyurusuna hazır hale getir.",
    ],
  }),
  createTodoRecord({
    code: "cc-import-2026-05-13-baris-p0-02",
    ownerLabel: "Barış",
    phase: "P0",
    title: "WhatsApp grubu ekleme özelliğini aktif et",
    categoryLabel: "Topluluk, Referral & Onboarding",
    assignee: "UBT",
    priority: 9,
    urgent: true,
    dueDate: P0_DUE_DATE,
    sortOrder: IMPORT_SORT_BASE + 2,
    detailItems: [
      "“WhatsApp Grubu Ekle” için basit bir form oluştur.",
      "Form alanlarını sade tut: grup adı, ülke, şehir, kategori, WhatsApp linki, kısa açıklama.",
      "“Ben admin’im” / “Ben üyeyim” seçeneği ekle.",
      "Kullanıcı admin değilse kaydın moderasyona düşmesini sağla.",
      "Kullanıcı admin ise yine moderasyon onayı gerektirecek şekilde kaydı al.",
      "Form gönderimini admin paneline bağla.",
      "Admin panelinde WhatsApp grubu onay / red alanı oluştur.",
      "Onaylanan WhatsApp gruplarının public tarafta görünmesini sağla.",
      "Link formatı kontrolü ekle.",
      "Bozuk / geçersiz linklerde kullanıcıya basit hata mesajı göster.",
      "İlk test için Almanya101 gibi açık grup örnekleriyle deneme yap.",
      "Kapalı grup senaryosunu şimdilik manuel onay sürecine bırak.",
    ],
  }),
  createTodoRecord({
    code: "cc-import-2026-05-13-baris-p0-03",
    ownerLabel: "Barış",
    phase: "P0",
    title: "“Bir şey ekle” genel gönderim özelliğini başlat",
    categoryLabel: "Topluluk, Referral & Onboarding",
    assignee: "UBT",
    priority: 9,
    urgent: true,
    dueDate: P0_DUE_DATE,
    sortOrder: IMPORT_SORT_BASE + 3,
    detailItems: [
      "Landing page veya uygun bir alana “Bir Şey Ekle” butonu koy.",
      "Kullanıcının işletme, danışman, dernek, WhatsApp grubu, etkinlik veya faydalı kaynak ekleyebileceği basit form hazırla.",
      "Formu çok kategoriye bölmeden genel tut.",
      "Minimum alanlar: ad, ülke, şehir, kategori, açıklama, link, iletişim bilgisi.",
      "Gönderilen her şeyi moderasyona düşür.",
      "Admin panelinde “Yeni Öneriler” benzeri bir liste oluştur.",
      "Adminin öneriyi daha sonra doğru kategoriye taşıyabileceği yapı kur.",
      "Kullanıcıya “Gönderiniz incelendikten sonra yayınlanacaktır” mesajı göster.",
      "Bu özelliği 19 Mayıs sonrası büyütülebilecek şekilde basit MVP olarak bırak.",
    ],
  }),
  createTodoRecord({
    code: "cc-import-2026-05-13-baris-p0-04",
    ownerLabel: "Barış",
    phase: "P0",
    title: "Landing page sadeleştirme",
    categoryLabel: "Landing Page & Web",
    assignee: "UBT",
    priority: 9,
    urgent: true,
    dueDate: P0_DUE_DATE,
    sortOrder: IMPORT_SORT_BASE + 4,
    detailItems: [
      "Landing page’de ilk bakışta kafa karıştıran fazla modülleri belirle.",
      "Ana sayfayı “daha sade ve reklam / tanıtım odaklı” hale getir.",
      "Çok fazla özelliği ana landing’de göstermemeye çalış.",
      "Ana mesajı öne çıkar: CorteQS global Türk diasporasını birleştiriyor.",
      "“Kimin için?” bölümünü sadeleştir.",
      "“CorteQS nedir?” bölümünü sadeleştir.",
      "Danışman, işletme, şehir elçisi, gönüllü gibi alanları daha anlaşılır başlıklarla toparla.",
      "Her bölümün altına kısa açıklayıcı tagline ekle.",
      "Ortak ön kayıt formunu ayrı merkezi bir sayfaya taşı.",
      "Tüm CTA butonlarını bu ortak forma yönlendir.",
      "Aynı formun farklı yerlerde kopyalanmasını engelle.",
    ],
  }),
  createTodoRecord({
    code: "cc-import-2026-05-13-baris-p0-05",
    ownerLabel: "Barış",
    phase: "P0",
    title: "Statik / yarı statik sayfaları kontrol et",
    categoryLabel: "Landing Page & Web",
    assignee: "UBT",
    priority: 9,
    urgent: true,
    dueDate: P0_DUE_DATE,
    sortOrder: IMPORT_SORT_BASE + 5,
    detailItems: [
      "Blog yarışması sayfasını kontrol et.",
      "Şehir elçisi sayfasını kontrol et.",
      "Danışman başvuru sayfasını kontrol et.",
      "İşletme başvuru sayfasını kontrol et.",
      "Her sayfadaki CTA’nın doğru yere gidip gitmediğini test et.",
      "Stripe / ödeme gerektiren akışlarda şimdilik rezervasyon / ön başvuru mantığı kullan.",
      "“Yarışmaya başvur” gibi butonların flow’u tamamlayıp tamamlamadığını kontrol et.",
      "Tamamlanamayan flow’larda kullanıcıyı boşta bırakma.",
      "“Başvurunuzu aldık, detayları sizinle paylaşacağız” gibi geçici mesaj ekle.",
      "Mobil görünümü kontrol et.",
    ],
  }),
  createTodoRecord({
    code: "cc-import-2026-05-13-baris-p0-06",
    ownerLabel: "Barış",
    phase: "P0",
    title: "Globe projesini kontrollü ilerlet",
    categoryLabel: "Strateji, Roadmap & PMO",
    assignee: "UBT",
    priority: 9,
    urgent: true,
    dueDate: P0_DUE_DATE,
    sortOrder: IMPORT_SORT_BASE + 6,
    detailItems: [
      "Globe çalışıyorsa 19 Mayıs öncesi minimum çalışan hale getir.",
      "Globe çok zaman alıyorsa park et.",
      "Globe’u ana teslimatların önüne geçirme.",
      "Globe için ayrı küçük todo dokümanı tut.",
      "Google Places / geocoding / pin ekleme tarafındaki sorunları ayrı teknik backlog’a al.",
      "Globe görselini “uzaktan bakılan güzel dünya” estetiğine yaklaştır.",
      "Pinlerin kullanıcıya güzel ve premium görünmesini sağla.",
      "Globe yetişmezse duyuru takvimine dahil etme.",
    ],
  }),
  createTodoRecord({
    code: "cc-import-2026-05-13-baris-p1-01",
    ownerLabel: "Barış",
    phase: "P1",
    title: "Public demo page hazırla",
    categoryLabel: "Landing Page & Web",
    assignee: "UBT",
    priority: 6,
    urgent: false,
    dueDate: null,
    sortOrder: IMPORT_SORT_BASE + 7,
    detailItems: [
      "MVP’yi direkt production özelliği gibi değil, “demo / showroom” gibi sun.",
      "Demo sayfasında kullanıcıların gezebilmesini sağla.",
      "Veri girişi ve backend yazma işlemlerini kapat.",
      "Butonları kilitle veya “yakında” mantığıyla göster.",
      "Demo sayfasına “Yakında gelecek özellikler” havası ver.",
      "Demo page’i landing page’den erişilebilir hale getir.",
      "Landing sade, demo şenlikli olacak şekilde ayrım yap.",
      "Demo içinde dashboard, profil, cadde, danışmanlar, işletmeler gibi alanları gezilebilir yap.",
      "Kullanıcının demo içinde kalma süresini artıracak basit açıklamalar ekle.",
      "Demo sayfasını yatırımcı / kullanıcı / contributor gösterimi için hazırla.",
    ],
  }),
  createTodoRecord({
    code: "cc-import-2026-05-13-baris-p1-02",
    ownerLabel: "Barış",
    phase: "P1",
    title: "Mevcut 120 kayıtlı kişiyi profile dönüştürme planı",
    categoryLabel: "Veri, CRM & Analytics",
    assignee: "UBT",
    priority: 6,
    urgent: false,
    dueDate: null,
    sortOrder: IMPORT_SORT_BASE + 8,
    detailItems: [
      "Mevcut formlardan gelen 120 kaydı incele.",
      "Önce 3-4 örnek kullanıcı profili oluştur.",
      "Bu örnek profillerle profil kartı tasarımını test et.",
      "Mevcut kayıtların hangi kategoriye ait olduğunu ayır: bireysel, danışman, işletme, dernek vb.",
      "Her kayıt için minimum profil alanlarını belirle.",
      "Eksik bilgiler için sonradan tamamlanabilir yapı kur.",
      "Mevcut kullanıcıları dashboard’a taşımak için teknik akış hazırla.",
      "Kullanıcıya “profiliniz beta için hazırlandı” mesajı planla.",
      "Login sonrası profil düzenleme alanını aktif et.",
      "Kullanıcının profil kartını online / offline yapabilmesini planla.",
    ],
  }),
  createTodoRecord({
    code: "cc-import-2026-05-13-baris-p1-03",
    ownerLabel: "Barış",
    phase: "P1",
    title: "Authentication ve Google giriş",
    categoryLabel: "Dashboard, Admin & UX",
    assignee: "UBT",
    priority: 6,
    urgent: false,
    dueDate: null,
    sortOrder: IMPORT_SORT_BASE + 9,
    detailItems: [
      "Google login akışını netleştir.",
      "Yeni kullanıcıların önce login olup sonra form dolduracağı yapıyı tasarla.",
      "Eski form mantığını login sonrası profil formuna dönüştür.",
      "Kullanıcı hesabı ile başvuru verisini aynı profile bağla.",
      "Mevcut kullanıcılar için geçici şifre / Google login senaryosunu değerlendir.",
      "“Google ile giriş yap, profilini tamamla” akışını test et.",
      "Dashboard’a giriş yapan kullanıcının doğru profile bağlandığını kontrol et.",
      "Yetki bazlı görünürlükleri planla: bireysel, danışman, işletme, contributor, admin.",
      "Authentication tamamlanmadan kritik public özellikleri buna bağımlı yapma.",
      "Auth işini 19 Mayıs sonrası P1 olarak ele al.",
    ],
  }),
  createTodoRecord({
    code: "cc-import-2026-05-13-baris-p1-04",
    ownerLabel: "Barış",
    phase: "P1",
    title: "Cadde’yi 19 Mayıs sonrası paralel geliştirmeye al",
    categoryLabel: "Strateji, Roadmap & PMO",
    assignee: "UBT",
    priority: 6,
    urgent: false,
    dueDate: null,
    sortOrder: IMPORT_SORT_BASE + 10,
    detailItems: [
      "Cadde’yi 19 Mayıs öncesi ana iş haline getirme.",
      "İlk iskeleti koru.",
      "Kıta seçimi gerçekten gerekli mi değerlendirme listesine al.",
      "Ülke / şehir / global akış mantığını sadeleştir.",
      "Türkiye kullanıcıları için ayrı “Köprü” mantığını not al.",
      "Global feed’e çıkma kurallarını moderasyon açısından değerlendir.",
      "Türkiye’den gelen içeriklerin globale çıkması için eşik mantığını ayrıca tasarla.",
      "Cadde için ağır moderasyon ihtiyacını backlog’a ekle.",
      "Kafe açma fikrini ilk versiyonda minimumda tut.",
      "Kafe detaylarını P2 stratejik backlog’a taşı.",
      "Buse / maskot toplantısında Cadde’nin ne kadar paylaşılacağını Burak’la netleştir.",
    ],
  }),
  createTodoRecord({
    code: "cc-import-2026-05-13-burak-p0-01",
    ownerLabel: "Burak",
    phase: "P0",
    title: "Contributor toplantı gündemini hazırla ve gruba gönder",
    categoryLabel: "Dokümantasyon, Drive & Operasyon",
    assignee: "Burak",
    priority: 9,
    urgent: true,
    dueDate: P0_DUE_DATE,
    sortOrder: IMPORT_SORT_BASE + 11,
    detailItems: [
      "Toplantı gündemini kısa bullet point olarak hazırla.",
      "Gündemi contributor grubuna toplantıdan önce gönder.",
      "Gündemi görenlerin katılım motivasyonunu artıracak kısa bir giriş yaz.",
      "Gündemde şu başlıklar olsun: tanışma, CorteQS vizyonu, contributor rolü, demo gezisi, çalışma şekli, soru-cevap.",
      "Toplantının tanışma odaklı olduğunu vurgula.",
      "“Bugün her şeyi detaylandırmayacağız, ilk çerçeveyi konuşacağız” mesajını ver.",
      "Katılımcıların soru hazırlayabileceğini belirt.",
    ],
  }),
  createTodoRecord({
    code: "cc-import-2026-05-13-burak-p0-02",
    ownerLabel: "Burak",
    phase: "P0",
    title: "Toplantı moderasyonunu üstlen",
    categoryLabel: "Dokümantasyon, Drive & Operasyon",
    assignee: "Burak",
    priority: 9,
    urgent: true,
    dueDate: P0_DUE_DATE,
    sortOrder: IMPORT_SORT_BASE + 12,
    detailItems: [
      "Toplantının açılışını yap.",
      "Toplantıyı fazla bilgi bombardımanına çevirmeden yönet.",
      "Katılımcıları kısa kısa konuştur.",
      "Herkese 3-4 dakikalık tanışma alanı ver.",
      "Katılımcı sayısı az olursa toplantıyı daha interaktif götür.",
      "Katılımcı sayısı çok olursa süreyi kontrollü kullan.",
      "Barış’a teknik/demo kısımlarda pas ver.",
      "Uzayan stratejik konuları “bunu ayrıca detaylandıracağız” diyerek park et.",
      "Toplantıyı kayıt / eğitim materyali olarak kullanılabilecek şekilde düzenli götür.",
      "Sonunda yazılı soru-cevap toplanacağını söyle.",
    ],
  }),
  createTodoRecord({
    code: "cc-import-2026-05-13-burak-p0-03",
    ownerLabel: "Burak",
    phase: "P0",
    title: "Kısa CorteQS vizyon anlatımı hazırla",
    categoryLabel: "İçerik, SEO & Sosyal Medya",
    assignee: "Burak",
    priority: 9,
    urgent: true,
    dueDate: P0_DUE_DATE,
    sortOrder: IMPORT_SORT_BASE + 13,
    detailItems: [
      "CorteQS’in global Türk diasporasını birleştirme vizyonunu 2-3 dakikalık anlatıma indir.",
      "“Süper platform” fikrini sade dille anlat.",
      "Ekonomi, sosyal çevre, danışmanlık, işletmeler, etkinlikler ve toplulukları tek çatı altında toplama fikrini özetle.",
      "Contributorların bu yapıda neden stratejik olduğunu anlat.",
      "“Lokalde ne kadar güçlüysek merkezde o kadar güçlüyüz” mesajını kullan.",
      "Büyük vizyonu anlat ama detaylı ürün feature listesine boğma.",
      "İlk toplantıda motivasyon ve yön duygusu vermeye odaklan.",
    ],
  }),
  createTodoRecord({
    code: "cc-import-2026-05-13-burak-p0-04",
    ownerLabel: "Burak",
    phase: "P0",
    title: "Burak & Barış kısa tanıtımı hazırla",
    categoryLabel: "Dokümantasyon, Drive & Operasyon",
    assignee: "Burak",
    priority: 9,
    urgent: true,
    dueDate: P0_DUE_DATE,
    sortOrder: IMPORT_SORT_BASE + 14,
    detailItems: [
      "Burak kimdir, CorteQS’teki rolü nedir, kısa anlat.",
      "Barış kimdir, CorteQS’teki rolü nedir, kısa anlat.",
      "Teknik geliştirme / ürün / operasyon tarafında kimin neye baktığını sadece söyle.",
      "“Hep birlikte büyüteceğimiz bir yapı” mesajını ver.",
      "Kurucu / ekip anlatımını fazla uzatma.",
    ],
  }),
  createTodoRecord({
    code: "cc-import-2026-05-13-burak-p0-05",
    ownerLabel: "Burak",
    phase: "P0",
    title: "Contributorları tanımak için mini soru seti hazırla",
    categoryLabel: "Dokümantasyon, Drive & Operasyon",
    assignee: "Burak",
    priority: 9,
    urgent: true,
    dueDate: P0_DUE_DATE,
    sortOrder: IMPORT_SORT_BASE + 15,
    detailItems: [
      "Katılımcılara toplantıda kendilerini tanıtmaları için 4 soru hazırla.",
      "Soru 1: Hangi şehir / ülkedesiniz?",
      "Soru 2: Şu anda çalışıyor musunuz, ne yapıyorsunuz?",
      "Soru 3: CorteQS için ne kadar zaman ayırabilirsiniz?",
      "Soru 4: Hangi alanlarda katkı vermek istersiniz?",
      "Soru 5: Bölgenizde hangi kaynaklara / işletmelere / topluluklara erişiminiz var?",
      "Toplantı sonrası aynı soruları kısa form olarak gönder.",
      "Cevaplara göre contributorları full-time / part-time / ara sıra destek verecek kişiler olarak ayır.",
      "Aynı şehirde birden fazla contributor olursa görev çakışmasını önleyecek plan çıkar.",
    ],
  }),
  createTodoRecord({
    code: "cc-import-2026-05-13-burak-p0-06",
    ownerLabel: "Burak",
    phase: "P0",
    title: "Contributor çalışma modeli mesajını sadeleştir",
    categoryLabel: "Dokümantasyon, Drive & Operasyon",
    assignee: "Burak",
    priority: 9,
    urgent: true,
    dueDate: P0_DUE_DATE,
    sortOrder: IMPORT_SORT_BASE + 16,
    detailItems: [
      "Contributorlardan beklenenleri kısa ve net anlat.",
      "Bölgedeki Türk işletmelerini, danışmanları, dernekleri, influencerları ve WhatsApp gruplarını bulmalarını iste.",
      "Sosyal medya algoritmalarını kendi bölgeleri için kullanmalarını öner.",
      "Instagram, Facebook, LinkedIn, X gibi kanallarda yerel kaynakları takip etmelerini söyle.",
      "Gördükleri faydalı kaynakları kaydetmelerini iste.",
      "Şimdilik Excel, not, favori klasörü veya basit liste tutabileceklerini söyle.",
      "Daha sonra bunları dashboard üzerinden sisteme gireceklerini anlat.",
      "“Bizi beklemeyin, kaynak toplamaya başlayın” mesajını ver.",
      "Revenue share / gelir potansiyeli konusunu çok ağır anlatmadan perspektif olarak ver.",
      "İlk toplantıda sadece potansiyeli göster, detaylı ticari modeli sonraya bırak.",
    ],
  }),
  createTodoRecord({
    code: "cc-import-2026-05-13-burak-p0-07",
    ownerLabel: "Burak",
    phase: "P0",
    title: "19 Mayıs sosyal medya planını hazırla",
    categoryLabel: "İçerik, SEO & Sosyal Medya",
    assignee: "Burak",
    priority: 9,
    urgent: true,
    dueDate: P0_DUE_DATE,
    sortOrder: IMPORT_SORT_BASE + 17,
    detailItems: [
      "Cumartesi / Pazar / Pazartesi için paylaşım planı çıkar.",
      "19 Mayıs’a kadar yoğun paylaşım yapılacak içerik başlıklarını belirle.",
      "Fotoğraf gönderme özelliği için post metinleri hazırla.",
      "Fikir gönderme özelliği için post metinleri hazırla.",
      "WhatsApp grubu ekleme özelliği için post metinleri hazırla.",
      "“CorteQS büyüyor” temalı duyurular hazırla.",
      "“Sen de katkı ver” temalı duyurular hazırla.",
      "“Global Türk Diaspora Ağı” mesajını içeriklerde kullan.",
      "50-60 post hedefi için içerikleri küçük parçalara böl.",
      "Barış teknik olarak yetiştirdiği özelliklere göre içerik sırasını güncelle.",
    ],
  }),
  createTodoRecord({
    code: "cc-import-2026-05-13-burak-p0-08",
    ownerLabel: "Burak",
    phase: "P0",
    title: "WhatsApp grubu ekleme politikasını netleştir",
    categoryLabel: "Topluluk, Referral & Onboarding",
    assignee: "Burak",
    priority: 9,
    urgent: true,
    dueDate: P0_DUE_DATE,
    sortOrder: IMPORT_SORT_BASE + 18,
    detailItems: [
      "WhatsApp grubu ekleme özelliği için platform politikası yaz.",
      "Grup admini olmayanların gönderisinin de moderasyona düşeceğini netleştir.",
      "Grup admini onayı gerekiyorsa bunun nasıl alınacağını tarif et.",
      "Açık davet linkli gruplar için basit onay akışı belirle.",
      "Kapalı gruplar için adminle manuel iletişim akışı belirle.",
      "Contributorların kendi şehirlerindeki WhatsApp gruplarını bulmasını iste.",
      "Grup ekleme formundaki alanları Barış ile netleştir.",
      "Yayına alınacak gruplarda kalite ve güvenlik kriterlerini belirle.",
      "“Bildiğiniz faydalı WhatsApp gruplarını ekleyin” mesajını sosyal medya için hazırla.",
    ],
  }),
  createTodoRecord({
    code: "cc-import-2026-05-13-burak-p1-01",
    ownerLabel: "Burak",
    phase: "P1",
    title: "Demo page / showroom anlatısını hazırla",
    categoryLabel: "İçerik, SEO & Sosyal Medya",
    assignee: "Burak",
    priority: 6,
    urgent: false,
    dueDate: null,
    sortOrder: IMPORT_SORT_BASE + 19,
    detailItems: [
      "Demo sayfasını “yakında gelecek özellikler” showroom’u gibi konumlandır.",
      "Landing page’in sade, demo’nun şenlikli olacağı mesajını netleştir.",
      "Demo içinde hangi modüllerin gösterileceğini belirle.",
      "Dashboard demo anlatımını hazırla.",
      "Cadde demo anlatımını hazırla.",
      "Danışman / işletme / profil demo anlatımını hazırla.",
      "“Bunlar yakında açılacak, şu anda beta/demo aşamasında” dilini kullan.",
      "Demo’yu contributor toplantısında serbest gezilecek bir alan gibi paylaş.",
      "Toplantı başında demo linkini verip “birazdan üstünden geçeceğiz” diyebilirsin.",
      "Kullanıcıların platform okuryazarlığını artıracak kısa açıklamalar yaz.",
    ],
  }),
  createTodoRecord({
    code: "cc-import-2026-05-13-burak-p1-02",
    ownerLabel: "Burak",
    phase: "P1",
    title: "Cadde stratejisini sadeleştir",
    categoryLabel: "Strateji, Roadmap & PMO",
    assignee: "Burak",
    priority: 6,
    urgent: false,
    dueDate: null,
    sortOrder: IMPORT_SORT_BASE + 20,
    detailItems: [
      "Cadde’nin ana fikrini kısa anlat: şehir / ülke / global diaspora sohbet ve etkileşim alanı.",
      "Global feed mantığını sadeleştir.",
      "Ülke ve şehir bazlı akışları sadeleştir.",
      "Türkiye kullanıcıları için “Köprü” alanını netleştir.",
      "Türkiye’den global feed’e çıkış için beğeni / yorum eşiği fikrini yazılı hale getir.",
      "Diaspora-first yaklaşımı netleştir.",
      "Ağır moderasyon ihtiyacını kabul edip sonraki faza bırak.",
      "Kıta seçimi gerekli mi, yeniden değerlendir.",
      "İlk versiyonda fazla ülke takip etme seçeneğini karmaşıklaştırma.",
      "Cadde’yi 19 Mayıs öncesi değil, 19 Mayıs sonrası ana MVP işi olarak konumlandır.",
    ],
  }),
  createTodoRecord({
    code: "cc-import-2026-05-13-burak-p1-03",
    ownerLabel: "Burak",
    phase: "P1",
    title: "Kafe fikrini P2 stratejik backlog’a al",
    categoryLabel: "Strateji, Roadmap & PMO",
    assignee: "Burak",
    priority: 6,
    urgent: false,
    dueDate: null,
    sortOrder: IMPORT_SORT_BASE + 21,
    detailItems: [
      "“Kafe açma” fikrini ilk versiyonda basit tut.",
      "İlk versiyon: kullanıcı belirli konuda geçici sohbet alanı açabilir.",
      "2 saat / 4 saatlik geçici kafe fikrini not al.",
      "Kafe giriş koşulları, soru, referral gibi detayları sonraya bırak.",
      "Sponsorlu / markalı kafe fikrini stratejik backlog’a al.",
      "Reklam alanları ve tema bazlı reklam fikrini yatırımcı anlatısı için sakla.",
      "Starbucks / Nero / Microsoft gibi örnekleri ilk contributor toplantısında fazla detaylandırma.",
      "Buse toplantısında bu stratejik fikrin ne kadar paylaşılacağını Barış ile netleştir.",
    ],
  }),
  createTodoRecord({
    code: "cc-import-2026-05-13-burak-p1-04",
    ownerLabel: "Burak",
    phase: "P1",
    title: "Contributor kaynak toplama sistemi taslağı hazırla",
    categoryLabel: "Topluluk, Referral & Onboarding",
    assignee: "Burak",
    priority: 6,
    urgent: false,
    dueDate: null,
    sortOrder: IMPORT_SORT_BASE + 22,
    detailItems: [
      "Contributorların toplayacağı kaynak tiplerini listele.",
      "İşletmeler.",
      "Danışmanlar.",
      "Dernekler.",
      "WhatsApp grupları.",
      "Influencerlar.",
      "Etkinlikler.",
      "Yerel Facebook grupları.",
      "Yerel Instagram sayfaları.",
      "Yerel profesyonel topluluklar.",
      "Yerel hizmet sağlayıcılar.",
      "Bu kaynakların ileride dashboard’a nasıl girileceğini anlatan kısa süreç yaz.",
      "Şimdilik “kaydet, listele, bize ilet” prensibini kullan.",
    ],
  }),
  createTodoRecord({
    code: "cc-import-2026-05-13-burak-p1-05",
    ownerLabel: "Burak",
    phase: "P1",
    title: "Contributor soru-cevap dokümanı oluştur",
    categoryLabel: "Dokümantasyon, Drive & Operasyon",
    assignee: "Burak",
    priority: 6,
    urgent: false,
    dueDate: null,
    sortOrder: IMPORT_SORT_BASE + 23,
    detailItems: [
      "Toplantıda gelen soruları not al.",
      "WhatsApp grubunda gelen soruları ayrıca topla.",
      "Soruları konu başlıklarına göre ayır.",
      "Tüm contributorlara yazılı cevap olarak paylaş.",
      "Aynı sorular tekrar gelmesin diye FAQ formatına getir.",
      "Çalışma modeli, gelir modeli, görev paylaşımı, şehir sahipliği gibi konuları FAQ’ya ekle.",
      "Cevapları net ama bağlayıcı olmayacak şekilde yaz.",
      "Henüz kesinleşmeyen konular için “bu konu ayrıca netleştirilecek” de.",
    ],
  }),
  createMeetingRecord({
    code: "cc-import-2026-05-13-shared-decisions",
    title: "13 Mayıs Toplantı Kararları",
    sortOrder: IMPORT_SORT_BASE + 24,
    detailItems: [
      "19 Mayıs öncesi ana odak: 19 Mayıs özellikleri + WhatsApp grubu ekleme + genel ekle özelliği + landing sadeleştirme.",
      "Globe çalışırsa devam, çalışmazsa park.",
      "Landing page sade olacak.",
      "Demo / showroom sayfası daha renkli ve zengin olacak.",
      "MVP özellikleri demo olarak gezilebilir olacak ama veri girişi kapalı olacak.",
      "Cadde 19 Mayıs sonrasına bırakılacak.",
      "Contributor toplantısı ilk etapta tanışma ve vizyon toplantısı olacak.",
      "İlk toplantıda detay bombardımanı yapılmayacak.",
      "Contributorlardan yerel kaynak toplamaya başlamaları istenecek.",
      "Mevcut 120 kayıt beta profillerine dönüştürülecek.",
      "Yeni kullanıcı akışı ileride login + profil formu şeklinde birleşecek.",
    ],
  }),
];

function summarizeRecords() {
  const todoCount = records.filter((record) => record.item_type === "todo").length;
  const meetingCount = records.filter((record) => record.item_type === "meeting_note").length;
  return { todoCount, meetingCount };
}

async function fetchExistingMap(supabase) {
  const keys = records.map((record) => record.legacy_source_title);
  const { data, error } = await supabase
    .from("command_center_items")
    .select("id, item_type, title, assignee, priority, due_date, urgent, legacy_source_title, legacy_source_category, legacy_source_date_label")
    .in("legacy_source_title", keys);

  if (error) {
    fail(`Mevcut kayıtlar okunamadı: ${error.message}`);
  }

  return new Map((data ?? []).map((row) => [row.legacy_source_title, row]));
}

function printPreview() {
  info(`Env file: ${path.relative(projectRoot, envFilePath)}`);
  info(`Mod: ${isWriteMode ? "WRITE" : "DRY RUN"}`);

  for (const record of records) {
    console.log(
      [
        `${record.item_type.toUpperCase()}: ${record.title}`,
        `  assignee=${record.assignee}`,
        `  category=${record.category_label}`,
        `  priority=${record.priority}`,
        `  urgent=${record.urgent}`,
        `  due=${record.due_date ?? "-"}`,
        `  key=${record.legacy_source_title}`,
      ].join("\n")
    );
  }
}

function verifyInsertedRows(rows) {
  const barisRows = rows.filter((row) => row.legacy_source_category === "Barış");
  const burakRows = rows.filter((row) => row.legacy_source_category === "Burak");
  const p0Rows = rows.filter(
    (row) => row.item_type === "todo" && row.legacy_source_date_label === `${IMPORT_DATE} P0`
  );
  const meetingRow = rows.find(
    (row) => row.item_type === "meeting_note" && row.legacy_source_title === "cc-import-2026-05-13-shared-decisions"
  );

  if (!p0Rows.every((row) => row.priority === 9 && row.urgent === true && row.due_date === P0_DUE_DATE)) {
    fail("P0 kayıt doğrulaması başarısız.");
  }

  if (!barisRows.every((row) => row.assignee === "UBT")) {
    fail("Barış kayıtlarının assignee doğrulaması başarısız.");
  }

  if (!burakRows.every((row) => row.assignee === "Burak")) {
    fail("Burak kayıtlarının assignee doğrulaması başarısız.");
  }

  if (
    !meetingRow ||
    meetingRow.legacy_source_category !== "mvp-hedefleri" ||
    meetingRow.legacy_source_date_label !== "13 Mayıs"
  ) {
    fail("Meeting note doğrulaması başarısız.");
  }
}

async function main() {
  const env = await loadEnv();
  const supabaseUrl = process.env.SUPABASE_URL || env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    fail("SUPABASE_URL/VITE_SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY eksik.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  printPreview();
  const { todoCount, meetingCount } = summarizeRecords();
  info(`Beklenen kayıt toplamı: ${todoCount} todo, ${meetingCount} meeting note`);

  const existingMap = await fetchExistingMap(supabase);
  const recordsToInsert = records.filter((record) => !existingMap.has(record.legacy_source_title));

  info(`Mevcut duplicate kayıt: ${existingMap.size}`);
  info(`Yazılacak yeni kayıt: ${recordsToInsert.length}`);

  if (!isWriteMode) {
    ok("Dry run tamamlandı. Yazmak için --write kullanın.");
    return;
  }

  if (recordsToInsert.length > 0) {
    const { error } = await supabase.from("command_center_items").upsert(recordsToInsert, {
      onConflict: "legacy_source_title",
      ignoreDuplicates: true,
    });
    if (error) {
      fail(`Insert başarısız: ${error.message}`);
    }
  }

  const afterMap = await fetchExistingMap(supabase);
  const importedRows = Array.from(afterMap.values());
  verifyInsertedRows(importedRows);

  const beforeCount = existingMap.size;
  const afterCount = afterMap.size;
  const actualInsertedCount = Math.max(0, afterCount - beforeCount);
  const insertedTodoCount =
    actualInsertedCount === 0
      ? 0
      : recordsToInsert.filter((record) => record.item_type === "todo").length;
  const insertedMeetingCount =
    actualInsertedCount === 0
      ? 0
      : recordsToInsert.filter((record) => record.item_type === "meeting_note").length;

  ok(`Import tamamlandı. Eklenen todo: ${insertedTodoCount}`);
  ok(`Import tamamlandı. Eklenen meeting note: ${insertedMeetingCount}`);
  ok(`Duplicate nedeniyle atlanan kayıt: ${records.length - actualInsertedCount}`);
}

await main();
