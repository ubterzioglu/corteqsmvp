// Vize Seçimi (Almanya) — dallanmalı karar ağacı verisi.
// Kaynak: ref101/app/(site)/vize-secim/VizeClient.tsx (QUESTIONS + RESULTS). VERİ BİREBİR.
// 2024/2025 Almanya göçmenlik mevzuatı (AufenthG, Fachkräfteeinwanderungsgesetz).
// Her option 'next' bir soru id'si VEYA 'RESULT:<id>' (sonuç) gösterir.

export type VizeColor = "blue" | "green" | "yellow" | "orange" | "red";

export interface VizeOption {
  key: string;
  label: string;
  next: string;
}

export interface VizeQuestion {
  id: string;
  text: string;
  hint?: string;
  options: VizeOption[];
}

export interface VizeResult {
  id: string;
  title: string;
  subtitle: string;
  color: VizeColor;
  requirements: string[];
  steps: string[];
  note?: string;
}

export const VIZE_START_QUESTION = "Q02";

export const VIZE_QUESTIONS: VizeQuestion[] = [
  {
    id: "Q02",
    text: "Almanya'ya gidişinizin temel amacı nedir?",
    options: [
      { key: "work", label: "💼 Çalışmak / Kariyer yapmak", next: "Q03" },
      { key: "study", label: "🎓 Üniversite / Yüksek lisans okumak", next: "Q_STUDY" },
      { key: "ausbildung", label: "🔧 Meslek eğitimi (Ausbildung)", next: "Q_AUSB" },
      { key: "family", label: "👨‍👩‍👧 Almanya'daki aile bireylerime katılmak", next: "Q_FAM" },
      { key: "research", label: "🔬 Araştırma / Doktora programı", next: "RESULT:RESEARCH" },
      { key: "selfemploy", label: "🚀 Serbest meslek / Girişimcilik", next: "Q_SELF" },
      { key: "language", label: "🌍 Almanca dil kursu almak", next: "RESULT:LANGUAGE_VISA" },
      { key: "shortstay", label: "✈️ Kısa ziyaret / Turizm / İş görüşmesi (≤90 gün)", next: "RESULT:SCHENGEN" },
    ],
  },
  {
    id: "Q03",
    text: "Almanya'dan yazılı iş teklifiniz (sözleşmeniz) var mı?",
    options: [
      { key: "yes", label: "✓ Evet, imzalı iş sözleşmem var", next: "Q04" },
      { key: "no", label: "✗ Hayır, henüz iş arıyorum", next: "Q09" },
    ],
  },
  {
    id: "Q04",
    text: "Üniversite diplomanız var mı ve Almanya tarafından tanınıyor mu?",
    hint: "Lisans veya üzeri. Tanınırlık için anabin.de kontrol edilebilir.",
    options: [
      { key: "yes", label: "✓ Evet, tanınmış / tanınabilir diplomam var", next: "Q05" },
      { key: "process", label: "🔄 Diplomam var ama tanınma süreci devam ediyor", next: "RESULT:RECOGNITION_VISA" },
      { key: "no", label: "✗ Hayır, üniversite diplomam yok", next: "Q07" },
    ],
  },
  {
    id: "Q05",
    text: "İş teklifindeki yıllık brüt maaş ne kadar?",
    hint: "EU Mavi Kart eşiği 2025'te ≥ 45.300 € (STEM/tıp gibi kıtlık mesleklerinde ≥ 41.042 €)",
    options: [
      { key: "high", label: "💰 45.300 € ve üzeri", next: "RESULT:BLUE_CARD" },
      { key: "mid", label: "📊 41.000 – 45.300 € arası", next: "Q06" },
      { key: "low", label: "📉 41.000 € altında", next: "Q05B" },
    ],
  },
  {
    id: "Q05B",
    text: "Diplomanızın resmi Alman tanınma belgesi (KMK / ZAB) var mı?",
    hint: "Fachkräftevisa başvurusunda diplomanın tanınmış olması şarttır.",
    options: [
      { key: "yes", label: "✓ Evet, resmi tanınma belgem var", next: "RESULT:FACHKRAFT_UNI" },
      { key: "process", label: "🔄 Başvurdum, süreç devam ediyor", next: "RESULT:RECOGNITION_VISA" },
      { key: "no", label: "✗ Hayır / Henüz başvurmadım", next: "Q07" },
    ],
  },
  {
    id: "Q06",
    text: "Çalışacağınız alan hangisi? (41.000 – 45.300 € maaş aralığı için)",
    hint: "STEM ve tıp gibi kıtlık mesleklerinde daha düşük eşikle EU Mavi Kart alınabilir.",
    options: [
      { key: "stem", label: "💻 STEM (Mühendislik, BT, Matematik, Doğa Bilimleri)", next: "RESULT:BLUE_CARD" },
      { key: "health", label: "⚕️ Tıp / Sağlık / Eczacılık", next: "RESULT:BLUE_CARD" },
      { key: "other", label: "🗂️ Diğer bir alan", next: "RESULT:FACHKRAFT_UNI" },
    ],
  },
  {
    id: "Q07",
    text: "BT / Yazılım alanında mı çalışacaksınız?",
    hint: "3+ yıl BT deneyimiyle diploma şartı aranmaksızın çalışmak mümkündür (§19c AufenthG).",
    options: [
      { key: "yes", label: "💻 Evet, 3+ yıl aktif BT / yazılım deneyimim var", next: "RESULT:IT_SPECIALIST" },
      { key: "no", label: "✗ Hayır / 3 yıldan az deneyimim var", next: "Q08" },
    ],
  },
  {
    id: "Q08",
    text: "Almanya'da tanınan mesleki eğitim sertifikanız var mı? (IHK, HWK vb.)",
    options: [
      { key: "yes", label: "✓ Evet, tanınmış mesleki sertifikam var", next: "RESULT:FACHKRAFT_VOC" },
      { key: "process", label: "🔄 Tanınma başvurusu yaptım, süreci bekliyorum", next: "RESULT:RECOGNITION_VISA" },
      { key: "no", label: "✗ Hayır", next: "RESULT:LIMITED" },
    ],
  },
  {
    id: "Q09",
    text: "Üniversite diplomanız var mı ve Almanya tarafından tanınıyor mu?",
    hint: "Chancenkarte ve iş arama vizesinde diplomanın tanınırlığı belirleyicidir.",
    options: [
      { key: "yes", label: "✓ Evet, tanınmış / tanınabilir diplomam var", next: "Q10" },
      { key: "process", label: "🔄 Diplomam var ama tanınma süreci devam ediyor", next: "RESULT:RECOGNITION_VISA" },
      { key: "no", label: "✗ Hayır, üniversite diplomam yok", next: "Q12" },
    ],
  },
  {
    id: "Q10",
    text: "Diplomanızla ilgili alanda mesleki çalışma deneyiminiz kaç yıl?",
    hint: "Son 5 yıl içindeki deneyim esas alınır. Chancenkarte için en az 2 yıl gereklidir.",
    options: [
      { key: "twoplus", label: "📅 2 yıl ve üzeri (son 5 yılda)", next: "Q11" },
      { key: "less", label: "📅 2 yıldan az", next: "RESULT:JOB_SEEKER" },
    ],
  },
  {
    id: "Q11",
    text: "Almanca dil seviyeniz nedir?",
    hint: "Chancenkarte puan sisteminde dil seviyesi en kritik kriterdir. A1 bile 1 puan kazandırır.",
    options: [
      { key: "b2plus", label: "🇩🇪 B2 veya üzeri (ileri düzey)", next: "RESULT:CHANCENKARTE" },
      { key: "a1b1", label: "🇩🇪 A1 – B1 arası (temel / orta)", next: "RESULT:CHANCENKARTE" },
      { key: "none", label: "❌ Almancam yok", next: "Q11B" },
    ],
  },
  {
    id: "Q11B",
    text: "Aşağıdakilerden en az biri sizin için geçerli mi?",
    hint: "Chancenkarte minimum 6 puan gerektirir. Almanca dışındaki kriterler de puan kazandırır.",
    options: [
      { key: "english", label: "🇬🇧 İngilizce B2+ seviyesinde biliyorum", next: "RESULT:CHANCENKARTE" },
      { key: "prev", label: "🏛️ Daha önce Almanya'da çalıştım veya okudum", next: "RESULT:CHANCENKARTE" },
      { key: "young", label: "🎂 35 yaşın altındayım", next: "RESULT:CHANCENKARTE" },
      { key: "no", label: "✗ Hiçbiri benim için geçerli değil", next: "RESULT:JOB_SEEKER" },
    ],
  },
  {
    id: "Q12",
    text: "Almanya'da tanınan mesleki eğitim sertifikanız var mı? (IHK, HWK vb.)",
    options: [
      { key: "yes", label: "✓ Evet, tanınmış mesleki sertifikam var", next: "RESULT:JOB_SEEKER_VOC" },
      { key: "process", label: "🔄 Tanınma başvurusu yaptım, bekliyorum", next: "RESULT:RECOGNITION_VISA" },
      { key: "no", label: "✗ Hayır", next: "Q12B" },
    ],
  },
  {
    id: "Q12B",
    text: "BT / Yazılım alanında 3+ yıl deneyiminiz var mı?",
    hint: "BT uzmanı vizesi iş teklifi gerektirse de, kariyer planınız için bilinmesi önemlidir.",
    options: [
      { key: "yes", label: "💻 Evet, 3+ yıl BT / yazılım deneyimim var", next: "RESULT:LIMITED_IT" },
      { key: "no", label: "✗ Hayır", next: "RESULT:LIMITED" },
    ],
  },
  {
    id: "Q_STUDY",
    text: "Ne tür bir eğitim almak istiyorsunuz?",
    options: [
      { key: "bachelor", label: "🎓 Lisans / Yüksek lisans (kabul mektubum var)", next: "RESULT:STUDENT" },
      { key: "bachelor_apply", label: "📋 Lisans / Yüksek lisans (henüz başvurmadım)", next: "RESULT:STUDENT_APPLY" },
      { key: "phd", label: "🔬 Doktora / Araştırma programı", next: "RESULT:RESEARCH" },
      { key: "studienkolleg", label: "📚 Studienkolleg (lise denkliği / hazırlık yılı)", next: "RESULT:STUDIENKOLLEG" },
    ],
  },
  {
    id: "Q_AUSB",
    text: "Almanya'dan imzalı Ausbildung sözleşmeniz (Ausbildungsvertrag) var mı?",
    hint: "Sözleşme, vize başvurusunun temelidir.",
    options: [
      { key: "yes", label: "✓ Evet, imzalı sözleşmem var", next: "Q_AUSB2" },
      { key: "no", label: "✗ Hayır, henüz arıyorum", next: "RESULT:AUSBILDUNG" },
    ],
  },
  {
    id: "Q_AUSB2",
    text: "Almanca dil seviyeniz nedir?",
    hint: "Çoğu Ausbildung programı en az B1 Almanca gerektirmektedir.",
    options: [
      { key: "b1plus", label: "✓ B1 veya üzeri", next: "RESULT:AUSBILDUNG" },
      { key: "a2", label: "⚠️ A1 – A2 arası (temel düzey)", next: "RESULT:AUSBILDUNG_PREP" },
      { key: "none", label: "❌ Almancam yok / sıfır başlangıç", next: "RESULT:AUSBILDUNG_PREP" },
    ],
  },
  {
    id: "Q_FAM",
    text: "Almanya'da sizden önce giden, yanına katılmak istediğiniz kişi kim?",
    options: [
      { key: "spouse", label: "💑 Eş veya kayıtlı partner (Lebenspartner)", next: "Q_FAM2" },
      { key: "parent", label: "👨‍👩‍👦 Anne / babam (onların yanına gidiyorum, 18+ yetişkin)", next: "RESULT:FAMILY_ADULT" },
      { key: "child", label: "👶 Ebeveynimin yanına (reşit değilim, 18 altı)", next: "RESULT:FAMILY" },
    ],
  },
  {
    id: "Q_FAM2",
    text: "Almanya'daki eşinizin oturma izni türü nedir?",
    hint: "İzin türü, aile birleşimi şartlarını ve A1 zorunluluğunu doğrudan etkiler.",
    options: [
      { key: "bluecard", label: "🔵 EU Mavi Kart", next: "RESULT:FAMILY_BLUE" },
      { key: "nied", label: "🏠 Niederlassungserlaubnis (kalıcı oturma izni)", next: "RESULT:FAMILY_BLUE" },
      { key: "work", label: "💼 Çalışma vizesi / geçici oturma izni", next: "Q_FAM3" },
      { key: "refugee", label: "🛡️ Mülteci / İnsani koruma statüsü", next: "RESULT:FAMILY_REFUGEE" },
    ],
  },
  {
    id: "Q_FAM3",
    text: "A1 Almanca sertifikanız var mı?",
    hint: "Çalışma vizesi sahibinin eşi için genellikle A1 dil seviyesi zorunludur.",
    options: [
      { key: "yes", label: "✓ Evet, A1 veya üzeri Almanca sertifikam var", next: "RESULT:FAMILY" },
      { key: "no", label: "✗ Hayır, henüz Almancam yok", next: "RESULT:FAMILY_NO_GERMAN" },
    ],
  },
  {
    id: "Q_SELF",
    text: "Serbest meslek türünüz nedir?",
    hint: '"Freie Berufe" kapsamındaki freelancerlar ile şirket kuranlar için farklı süreçler geçerlidir.',
    options: [
      { key: "freelancer", label: "💻 Freelancer — BT, tasarım, danışmanlık, içerik üretimi", next: "RESULT:FREELANCER" },
      { key: "artist", label: "🎨 Sanat / Kültür / Medya alanında serbest çalışma", next: "RESULT:FREELANCER" },
      { key: "startup", label: "🏢 Şirket kurmak / Girişimcilik / E-ticaret", next: "RESULT:SELF_EMPLOY" },
    ],
  },
];

export const VIZE_RESULTS: VizeResult[] = [
  {
    id: "SCHENGEN",
    title: "Schengen Vizesi",
    subtitle: "Kısa Süreli C Vizesi — Turizm / İş Ziyareti / Aile Ziyareti",
    color: "green",
    requirements: [
      "Geçerli pasaport (en az 6 ay geçerli, 2 boş sayfa)",
      "Geri dönüş uçak bileti",
      "Seyahat sağlık sigortası (minimum 30.000 € teminat)",
      "Konaklama kanıtı (otel rezervasyonu veya davetiye mektubu)",
      "Finansal yeterlilik kanıtı (banka hesap özeti)",
      "Kalış amacına göre ek belgeler (davet mektubu, iş görüşme belgesi vb.)",
    ],
    steps: [
      "Almanya Büyükelçiliği web sitesinden randevu alın",
      "Başvuru formunu doldurup belgelerinizi hazırlayın",
      "Vize ücretini ödeyin (80 €)",
      "Biyometrik fotoğraf ve parmak izi için şahsen başvurun",
      "Ortalama 2–4 hafta içinde sonuç açıklanır",
    ],
    note: "Schengen vizesiyle 180 günlük periyotta en fazla 90 gün kalabilirsiniz. Bu süre uzatılamaz; aşılırsa ciddi yaptırımlar uygulanır.",
  },
  {
    id: "LANGUAGE_VISA",
    title: "Dil Kursu Vizesi",
    subtitle: "Almanca Dil Kursu — Ulusal Vize (D Vizesi, 3 aydan uzun)",
    color: "green",
    requirements: [
      "Almanya'daki dil okulundan kayıt / kabul belgesi",
      "3 aydan uzun kurs için ulusal vize (D vizesi) gerekir",
      "Finansal yeterlilik (aylık 700–1.000 € yaşam gideri)",
      "Sağlık sigortası",
      "Konaklama adresi veya yurt rezervasyonu",
    ],
    steps: [
      "Goethe-Institut, telc veya özel bir dil okulu seçin ve kayıt yaptırın",
      "3 aydan kısa kurslar için Schengen vizesi yeterlidir",
      "3 ayı geçen kurslar için Almanya Büyükelçiliği'nden ulusal vize randevusu alın",
      "Finansal kanıt için banka hesap özeti veya bloke hesap hazırlayın",
      "Kursu bitirince Ausbildung, üniversite veya Fachkräftevisa süreçlerine geçebilirsiniz",
    ],
    note: "Almanca öğrenmek; Ausbildung, Chancenkarte ve aile birleşimi vizelerinde ciddi avantaj sağlar. Erken başlamak her zaman kazandırır.",
  },
  {
    id: "RECOGNITION_VISA",
    title: "Tanınma Hazırlık Vizesi",
    subtitle: "Anerkennungsvisum — Denklik Süreci (§16d AufenthG)",
    color: "yellow",
    requirements: [
      "Almanya'da tanınma süreci başlatılmış diploma veya mesleki sertifika",
      "Tanınma otoritesinden ön inceleme veya süreç belgesi",
      "Mümkünse işverenin bekleme taahhüdü (Beschäftigungszusage)",
      "Finansal yeterlilik (banka hesabı)",
      "Sağlık sigortası",
    ],
    steps: [
      "Diplomanızın durumunu anerkennung-in-deutschland.de üzerinden kontrol edin",
      "İlgili tanınma otoritesine (ZAB, IHK, HWK veya Landesbehörde) başvurun",
      "Süreç belgesini veya ön onayı alın",
      "Almanya Büyükelçiliği'ne §16d AufenthG kapsamında başvurun",
      "Almanya'ya gelerek tanınma sürecini tamamlayın",
      "Tanınma tamamlanınca Fachkräftevisa veya Mavi Kart'a geçiş yapın",
    ],
    note: "Tanınma ortalama 3–6 ay sürebilir. §16d kapsamında bazı sektörlerde tanınma tamamlanmadan pratik eğitimle çalışma imkânı vardır.",
  },
  {
    id: "FREELANCER",
    title: "Serbest Meslek Vizesi (Freiberufler)",
    subtitle: "Freelancer / Bağımsız Uzman — §21 Abs. 5 AufenthG",
    color: "orange",
    requirements: [
      "BT, tasarım, danışmanlık, sanat veya medya alanında faaliyet",
      "Almanya'dan veya uluslararası müşteri sözleşmeleri / iş teklifleri",
      "Mesleki yeterlilik belgesi (diploma veya güçlü portföy)",
      "Yeterli başlangıç sermayesi (en az 6 aylık yaşam gideri)",
      "Sağlık sigortası (özel, zorunlu)",
    ],
    steps: [
      "Müşteri sözleşmelerini veya iş tekliflerini toplayın",
      "Portföy ve mesleki referans mektupları hazırlayın",
      "Kısa bir iş planı oluşturun (Almanca tercih edilir)",
      "Almanya Büyükelçiliği'ne §21 Abs. 5 AufenthG kapsamında başvurun",
      "Almanya'ya gelince Finanzamt'a kayıt olun (Steuernummer alın)",
      'Gerekirse "Freiberufler" statüsünü Finanzamt\'a teyit ettirin',
    ],
    note: 'BT geliştiricileri, tasarımcılar ve danışmanlar genellikle "freie Berufe" (serbest meslek) kapsamına girer ve şirket kurmaksızın bağımsız çalışabilir.',
  },
  {
    id: "STUDENT_APPLY",
    title: "Önce Üniversiteye Başvurun",
    subtitle: "Kabul mektubunuz olmadan öğrenci vizesi başvurusu mümkün değildir",
    color: "yellow",
    requirements: [
      "Üniversiteden kabul mektubu (Zulassungsbescheid / Einschreibebescheinigung)",
      "Almanca veya İngilizce dil yeterliliği (programa göre)",
      "Lise diploması veya Studienkolleg denklik belgesi",
      "Bloke hesap: ~11.904 €/yıl (2025 itibarıyla aylık 992 €)",
      "Sağlık sigortası",
    ],
    steps: [
      "uni-assist.de üzerinden veya üniversite sitesinden başvurun",
      "DAAD burs olanaklarını araştırın (daad.de)",
      "Almanca gerekiyorsa TestDaF veya DSH sınavına hazırlanın",
      "Kabul mektubunu aldıktan sonra vize başvurusu yapın",
      "Deutsche Bank, Fintiba veya Coracle üzerinden bloke hesap açın",
    ],
    note: "Türkiye mezunları için uni-assist.de üzerinden başvuru çoğu üniversitede zorunludur. Başvuru dönemleri: Ocak (yaz yarıyılı) ve Mayıs–Temmuz (kış yarıyılı).",
  },
  {
    id: "STUDIENKOLLEG",
    title: "Studienkolleg Vizesi",
    subtitle: "Yükseköğretime Hazırlık — Feststellungsprüfung Sınavı",
    color: "green",
    requirements: [
      "Studienkolleg'den kabul mektubu",
      "Türk lise diploması (Almanya'da doğrudan kabul görmeyen durumlarda gerekli)",
      "Almanca dil seviyesi B1–B2 (programa göre)",
      "Bloke hesap: ~11.904 €/yıl",
      "Sağlık sigortası",
    ],
    steps: [
      "Studienkolleg'e uni-assist.de veya doğrudan başvurun",
      "Almanca dil sertifikası (B1/B2) alın",
      "Kabul sonrası öğrenci vizesiyle Almanya'ya gelin",
      "1 yıllık hazırlığı tamamlayın",
      "Feststellungsprüfung sınavını geçerek istediğiniz üniversiteye başvurun",
    ],
    note: "Türk lise diplomasının kabul durumu anabin.de üzerinden kontrol edilebilir. Bazı üniversiteler Studienkolleg olmadan da kabul edebilir.",
  },
  {
    id: "AUSBILDUNG_PREP",
    title: "Önce Almanca Öğrenin",
    subtitle: "Ausbildung için dil hazırlığı gerekiyor — B1 hedefleyin",
    color: "yellow",
    requirements: [
      "En az B1 Almanca (çoğu Ausbildung programı için zorunlu)",
      "Bazı programlar A2 ile başlasa da B1 hedeflenmeli",
      "Almanya'daki Ausbildung firmasından imzalı sözleşme",
    ],
    steps: [
      "Goethe-Institut, telc veya çevrimiçi (italki, Duolingo) ile Almanca öğrenmeye başlayın",
      "B1 sertifikası alın (Goethe-Zertifikat B1 veya telc Deutsch B1)",
      "make-it-in-germany.com üzerinden Ausbildung fırsatlarını araştırın",
      "Başvuruları gönderin ve Ausbildungsvertrag imzalayın",
      "Sözleşmeyle birlikte §16a AufenthG kapsamında vize başvurusu yapın",
    ],
    note: "Yoğun Almanca kurslarıyla B1 seviyesine 6–12 ayda ulaşmak mümkündür. Ausbildung süresince aylık 800–1.000 € eğitim maaşı alırsınız.",
  },
  {
    id: "FAMILY_BLUE",
    title: "Mavi Kart / Kalıcı İzin Sahibine Aile Birleşimi",
    subtitle: "Familiennachzug — EU Mavi Kart veya Niederlassungserlaubnis",
    color: "green",
    requirements: [
      "Eşin geçerli EU Mavi Kart veya Niederlassungserlaubnis belgesi",
      "Apostilli ve Almancaya tercüme edilmiş evlilik cüzdanı",
      "Yeterli yaşam alanı ve gelir (sponsor)",
      "Sağlık sigortası",
      "A1 Almanca — Mavi Kart sahipleri için genellikle MUAF tutulur",
    ],
    steps: [
      "Eşin Mavi Kart / NE fotokopisi alın",
      "Evlilik cüzdanını apostille onaylatın",
      "Türkçe belgeleri yeminli tercümana onaylattırın",
      "Almanya Büyükelçiliği'nden randevu alarak aile birleşimi vizesi başvurusu yapın",
    ],
    note: "Mavi Kart sahiplerinin eşleri A1 dil şartından muaf olabilir ve çalışma izni almaksızın Almanya'ya gelebilir.",
  },
  {
    id: "FAMILY_ADULT",
    title: "Yetişkin Çocuk / Ebeveyn Birleşimi",
    subtitle: "Familiennachzug §36 AufenthG — İstisnai Durumlar",
    color: "orange",
    requirements: [
      "Almanya'daki aile üyesinin geçerli oturma izni",
      "Ciddi insani veya sağlık gerekçesi (istisnai hardship)",
      "Aile bağını kanıtlayan belgeler (apostilli)",
      "Yeterli yaşam alanı ve gelir (sponsor)",
    ],
    steps: [
      "Almanya'daki aile üyesinin oturma izni türünü ve süresini teyit edin",
      "İnsani gerekçelerinizi belgeleyin (sağlık raporu, bağımlılık durumu vb.)",
      "Bir göçmenlik avukatıyla çalışmanız şiddetle önerilir",
      "Almanya Büyükelçiliği'ne randevuyla başvurun",
    ],
    note: "18 yaşın üzerindeki çocukların veya ebeveynlerin aile birleşimi §36 AufenthG kapsamında çok kısıtlıdır; genellikle yalnızca ciddi insani durumlarda onaylanır.",
  },
  {
    id: "FAMILY_REFUGEE",
    title: "Mülteci Statüsüne Aile Birleşimi",
    subtitle: "Familiennachzug — Mülteci / Koruma Statüsü Sahibine",
    color: "orange",
    requirements: [
      "Almanya'da tanınan mültecilik (Flüchtlingsstatus) veya sübsidier koruma statüsü",
      "Aile bağını kanıtlayan belgeler (evlilik / doğum — apostilli)",
      "Tanınma kararından itibaren 3 aylık süreyi kaçırmamak (daha kolay süreç için)",
    ],
    steps: [
      "Eş / çocuğun Almanya'daki statüsünü ve tanınma tarihini öğrenin",
      "3 aylık süre geçtiyse daha uzun ve zor bir süreç beklediğinizi bilin",
      "IOM (Uluslararası Göç Örgütü) veya bir göçmenlik avukatına danışın",
      "Almanya Büyükelçiliği'nden randevu alarak başvurun",
    ],
    note: "Sübsidier koruma statüsündeki kişilere aile birleşimi daha kısıtlıdır. Mülteci statüsündekiler için süreç daha erişilebilirdir. Mutlaka uzman desteği alın.",
  },
  {
    id: "FAMILY_NO_GERMAN",
    title: "Önce A1 Almanca Alın",
    subtitle: "Aile Birleşimi Vizesi İçin A1 Dil Şartı Karşılanmalıdır",
    color: "yellow",
    requirements: [
      "A1 Almanca sertifikası (Goethe veya telc)",
      "Çalışma vizesi sahibi eşin davet ve sponsorluk belgesi",
      "Yeterli yaşam alanı ve gelir",
      "Apostilli evlilik cüzdanı",
    ],
    steps: [
      "Türkiye'deki Goethe-Institut veya telc'te A1 kursuna yazılın",
      "A1 sınavını geçerek sertifikayı alın (2–4 ay)",
      "Eşinizden davet mektubu ve sponsorluk belgelerini temin edin",
      "Almanya Büyükelçiliği'ne aile birleşimi vizesi için başvurun",
    ],
    note: "A1 sınavı zor değildir; temel selamlaşma, sayılar ve basit cümle kalıplarını kapsar. İstisna: eş AB vatandaşıysa veya Mavi Kart sahibiyse A1 gerekmeyebilir.",
  },
  {
    id: "LIMITED_IT",
    title: "BT Uzmanı Vizesi Potansiyeli Var — Önce İş Teklifi Alın",
    subtitle: "§19c AufenthG kapsamında iş teklifi zorunludur",
    color: "yellow",
    requirements: [
      "Almanya'dan imzalı iş sözleşmesi (şu an eksik)",
      "En az 3 yıl güncel BT deneyimi (mevcut)",
      "Deneyim belgeleri (referans mektubu, eski sözleşmeler, LinkedIn)",
      "Diploma zorunlu değil — deneyim yeterli",
    ],
    steps: [
      "LinkedIn, XING veya StepStone'da Alman şirketlere aktif başvuru yapın",
      "GitHub, portföy veya açık kaynak projelerinizi öne çıkarın",
      "İngilizce güçlüyse Almanca şartı olmayan pozisyonları hedefleyin",
      "İş teklifi alındığında §19c AufenthG kapsamında vize başvurusu yapın",
    ],
    note: "BT uzmanı vizesinde diploma şartı yoktur; 3+ yıl deneyim yeterlidir. İş teklifi alındığında süreç oldukça hızlıdır.",
  },
  {
    id: "BLUE_CARD",
    title: "EU Mavi Kart",
    subtitle: "EU Blue Card — Yüksek Vasıflı Çalışan",
    color: "blue",
    requirements: [
      "Almanya veya AB tarafından tanınmış üniversite diploması",
      "Yıllık brüt ≥ 45.300 € (kıtlık mesleklerinde ≥ 41.042 €)",
      "Türkiye mezunları için diplomanın anabin.de üzerinden teyidi",
      "Sağlık sigortası kanıtı",
    ],
    steps: [
      "Diplomanızın tanınırlığını anabin.de üzerinden kontrol edin",
      "Gerekiyorsa Statement of Comparability (KMK) belgesi alın",
      "Almanya Büyükelçiliği'ne ulusal vize başvurusu yapın",
      "Almanya'ya geldikten sonra Ausländerbehörde'den Mavi Kart alın",
    ],
    note: "21 ay B1 Almancayla kalıcı oturma izni (Niederlassungserlaubnis) alabilirsiniz. Eşiniz çalışma izni almadan gelebilir ve çalışabilir.",
  },
  {
    id: "FACHKRAFT_UNI",
    title: "Fachkräftevisa",
    subtitle: "Vasıflı Çalışan Vizesi — Üniversite Mezunu (§18b AufenthG)",
    color: "blue",
    requirements: [
      "Tanınmış üniversite diploması (ilgili meslekte)",
      "Almanya'dan iş sözleşmesi (maaş alt sınırı yoktur)",
      "Diplomanın tanınması veya denklik belgesi (KMK / ZAB)",
    ],
    steps: [
      "Diplomanızı anabin.de ve uni-assist.de üzerinden kontrol edin",
      "İşvereninizden imzalı iş sözleşmesini temin edin",
      "Almanya Büyükelçiliği'ne §18b AufenthG kapsamında başvurun",
      "Almanya'ya geldikten sonra Aufenthaltstitel için Ausländerbehörde'ye gidin",
    ],
  },
  {
    id: "FACHKRAFT_VOC",
    title: "Fachkräftevisa",
    subtitle: "Vasıflı Çalışan Vizesi — Mesleki Eğitim (§18a AufenthG)",
    color: "blue",
    requirements: [
      "Almanya'da tanınan mesleki eğitim sertifikası (IHK, HWK vb.)",
      "Almanya'dan iş sözleşmesi",
      "Sertifikanın tanınması için ZAB veya ilgili kurum onayı",
    ],
    steps: [
      "Mesleki sertifikanızın tanınırlığını anerkennung-in-deutschland.de'den kontrol edin",
      "Tanınma başvurusu için belgeleri hazırlayın",
      "İşvereninizden iş sözleşmesini temin edin",
      "Almanya Büyükelçiliği'ne §18a AufenthG kapsamında başvurun",
    ],
  },
  {
    id: "IT_SPECIALIST",
    title: "BT Uzmanı Vizesi",
    subtitle: "IT Specialist Visa — Diploma Şartı Yok (§19c AufenthG)",
    color: "blue",
    requirements: [
      "BT alanında Almanya'dan iş sözleşmesi",
      "En az 3 yıl güncel BT deneyimi (yazılım, siber güvenlik, veri vb.)",
      "Diploma zorunlu değil — deneyim belgesi yeterlidir",
    ],
    steps: [
      "İşvereninizle iş sözleşmesi imzalayın",
      "Deneyim belgelerini hazırlayın (referans mektupları, eski sözleşmeler)",
      "Almanya Büyükelçiliği'ne §19c AufenthG kapsamında başvurun",
    ],
    note: "2023 Fachkräfteeinwanderungsgesetz güncellemesiyle BT uzmanı vizesinin kapsamı genişletilmiştir. Maaş eşiği yoktur.",
  },
  {
    id: "CHANCENKARTE",
    title: "Chancenkarte",
    subtitle: "Fırsat Kartı — Puan Sistemli İş Arama (§20a AufenthG)",
    color: "yellow",
    requirements: [
      "Tanınmış üniversite diploması VEYA mesleki eğitim sertifikası",
      "En az 2 yıl mesleki deneyim (son 5 yıl içinde)",
      "Puan sistemi: Almanca A1=1pt / B2=2pt, İngilizce B2=1pt, Almanya bağlantısı=1pt, <35 yaş=1pt",
      "Minimum 6 puan (veya yalnızca Almanca B2 ile)",
      "Yeterli finansal kaynak (aylık ~1.100 €, toplam ~13.200 €)",
    ],
    steps: [
      "Puan hesaplamasını make-it-in-germany.com üzerinden yapın",
      "Diplomanızın tanınırlığını teyit edin",
      "Finansal kaynak için bloke hesap açın (Fintiba, Deutsche Bank vb.)",
      "Almanya Büyükelçiliği'ne başvurun",
      "Almanya'da 1 yıl içinde iş bularak Fachkräftevisa'ya geçin",
    ],
    note: "Kart süresince haftada 20 saat part-time çalışabilirsiniz. Almanya'ya gelmeden iş teklifi almanıza gerek yoktur.",
  },
  {
    id: "JOB_SEEKER",
    title: "İş Arama Vizesi",
    subtitle: "Job Seeker Visa — 6 Aylık Keşif (§20 AufenthG)",
    color: "yellow",
    requirements: [
      "Tanınmış üniversite diploması",
      "Finansal kaynak kanıtı (yaklaşık 6.600 €, 6 ay için)",
      "Sağlık sigortası",
      "Almanca veya İngilizce dil bilgisi (zorunlu değil, faydalı)",
    ],
    steps: [
      "Diplomanızın tanınırlığını kontrol edin",
      "Finansal kanıt için bloke hesap açın",
      "Almanya Büyükelçiliği'ne §20 AufenthG kapsamında başvurun",
      "6 ay içinde iş bularak Fachkräftevisa veya Mavi Kart'a geçiş yapın",
    ],
    note: "6 aylık süre uzatılamaz. Süre dolmadan iş teklifi alınarak çalışma vizesine geçilmesi zorunludur.",
  },
  {
    id: "JOB_SEEKER_VOC",
    title: "İş Arama Vizesi",
    subtitle: "Job Seeker Visa — Mesleki Eğitim Mezunu (§20 AufenthG)",
    color: "yellow",
    requirements: [
      "Almanya'da tanınan mesleki eğitim sertifikası",
      "Finansal kaynak kanıtı",
      "Sağlık sigortası",
    ],
    steps: [
      "Mesleki sertifikanızın tanınırlığını anerkennung-in-deutschland.de ile teyit edin",
      "Finansal kanıt hazırlayın",
      "Almanya Büyükelçiliği'ne §20 AufenthG kapsamında başvurun",
      "Almanya'da iş bularak Fachkräftevisa'ya (§18a) geçiş yapın",
    ],
  },
  {
    id: "STUDENT",
    title: "Öğrenci Vizesi",
    subtitle: "Studienvisum — Üniversite Öğrencileri (§16b AufenthG)",
    color: "green",
    requirements: [
      "Almanya'daki üniversiteden kabul mektubu",
      "Bloke hesap: ~11.904 €/yıl (aylık 992 €)",
      "Sağlık sigortası",
      "Almanca veya İngilizce dil yeterliliği (programa göre)",
    ],
    steps: [
      "Almanya'da üniversiteye başvurun (uni-assist.de veya doğrudan)",
      "Kabul mektubunu alın",
      "Deutsche Bank, Fintiba veya Coracle'da bloke hesap açın",
      "Almanya Büyükelçiliği'ne başvurun",
    ],
    note: "Mezuniyet sonrası 18 aylık iş arama vizesiyle Almanya'da kalabilir, iş bulursanız doğrudan Fachkräftevisa'ya geçiş yapabilirsiniz.",
  },
  {
    id: "AUSBILDUNG",
    title: "Ausbildung Vizesi",
    subtitle: "Ausbildungsvisum — Mesleki Eğitim (§16a AufenthG)",
    color: "green",
    requirements: [
      "Almanya'dan Ausbildungsvertrag (eğitim sözleşmesi)",
      "En az B1 Almanca dil seviyesi (çoğu program için)",
      "Sağlık sigortası",
    ],
    steps: [
      "make-it-in-germany.com üzerinden Ausbildung fırsatlarını araştırın",
      "Firmalardan eğitim sözleşmesi temin edin",
      "Almanca dil sertifikası alın (Goethe veya telc B1)",
      "Almanya Büyükelçiliği'ne §16a AufenthG kapsamında başvurun",
    ],
    note: "Sözleşmeniz yoksa önce make-it-in-germany.com veya ausbildung.de üzerinden başvurun. Ausbildung süresince aylık 800–1.000 € eğitim maaşı alırsınız. Bitirince doğrudan Fachkräftevisa'ya geçiş yapılabilir.",
  },
  {
    id: "FAMILY",
    title: "Aile Birleşimi Vizesi",
    subtitle: "Familiennachzug — Almanya'daki Aileye Katılım",
    color: "green",
    requirements: [
      "Almanya'da geçerli oturma izni olan eş veya ebeveyn",
      "Yeterli yaşam alanı ve gelir (sponsor)",
      "Temel Almanca (A1) dil bilgisi — eş için (bazı istisnalar geçerlidir)",
      "Apostilli evlilik cüzdanı veya doğum belgesi",
    ],
    steps: [
      "Almanya'daki yakınınızın oturma izni türünü teyit edin",
      "A1 Almanca sertifikası alın (Goethe veya telc)",
      "Apostilli belgeleri hazırlayın ve Almancaya tercüme ettirin",
      "Almanya Büyükelçiliği'ne randevu alarak başvurun",
    ],
  },
  {
    id: "RESEARCH",
    title: "Araştırma Vizesi",
    subtitle: "Forschungsvisum — Araştırmacılar ve Doktora Öğrencileri (§18d AufenthG)",
    color: "green",
    requirements: [
      "Almanya'daki araştırma kurumuyla hosting anlaşması (Aufnahmevereinbarung)",
      "Üniversite veya doktora diploması",
      "Yeterli finansal destek (burs veya maaş)",
    ],
    steps: [
      "Almanya'daki üniversite veya araştırma enstitüsüyle iletişime geçin",
      "Hosting anlaşmasını imzalayın",
      "Almanya Büyükelçiliği'ne §18d AufenthG kapsamında başvurun",
    ],
    note: "DAAD bursu veya Humboldt Vakfı bursları araştırmacılar için güçlü finansman kaynağıdır.",
  },
  {
    id: "SELF_EMPLOY",
    title: "Serbest Meslek Vizesi",
    subtitle: "Selbstständigenvisum — Girişimci / Şirket Kurucusu (§21 AufenthG)",
    color: "orange",
    requirements: [
      "Detaylı iş planı (Businessplan)",
      "Sermaye veya finansal güvence",
      "Almanya ekonomisine katkı ve ekonomik gereklilik kanıtı",
      "Mesleki yeterlilik (ilgili sektöre göre değişir)",
    ],
    steps: [
      "Detaylı iş planı hazırlayın (Almanca tercih edilir)",
      "Finansal kanıt belgelerini toplayın",
      "Gerekiyorsa Almanya'daki ilgili ticaret odasıyla (IHK/HWK) iletişime geçin",
      "Almanya Büyükelçiliği'ne §21 AufenthG kapsamında başvurun",
    ],
    note: "Değerlendirme subjektiftir ve bireyden bireye farklılık gösterir. Profesyonel danışmanlık almanız önerilir.",
  },
  {
    id: "LIMITED",
    title: "Kısıtlı Seçenekler",
    subtitle: "Mevcut profille doğrudan vize almak zordur",
    color: "red",
    requirements: [
      "Tanınmış diploma veya mesleki sertifika zorunludur",
      "İş teklifi olmadan başvuru neredeyse mümkün değildir",
    ],
    steps: [
      "Eğitim durumunuzu güçlendirin: diploma veya mesleki sertifika edinin",
      "Almanca öğrenerek Ausbildung başvurusunu değerlendirin",
      "make-it-in-germany.com adresinden kapsamlı rehber okuyun",
      "Bir göçmenlik danışmanıyla görüşün",
    ],
    note: "Almanca öğrenerek (B1) Ausbildung başvurusu, uzun vadede en erişilebilir seçenek olabilir. BT deneyiminiz varsa iş teklifi alarak §19c kapsamında başvurabilirsiniz.",
  },
];

const QUESTION_BY_ID = new Map(VIZE_QUESTIONS.map((q) => [q.id, q]));
const RESULT_BY_ID = new Map(VIZE_RESULTS.map((r) => [r.id, r]));

export function getVizeQuestion(id: string): VizeQuestion | null {
  return QUESTION_BY_ID.get(id) ?? null;
}

export function getVizeResult(id: string): VizeResult | null {
  return RESULT_BY_ID.get(id) ?? null;
}

/** Bir 'next' değeri sonuç mu (RESULT:<id>)? */
export function isVizeResultRef(next: string): boolean {
  return next.startsWith("RESULT:");
}

export function vizeResultIdFromRef(next: string): string {
  return next.replace("RESULT:", "");
}
