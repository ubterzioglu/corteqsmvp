import type { SeoOptions } from "@/lib/seo";

export const PAGE_SEO = {
  home: {
    title: "CorteQS | Dünyadaki Türkleri Bir Araya Getiren Platform",
    description:
      "CorteQS, dünyadaki Türkleri şehir bazlı bağlantılar, topluluklar ve fırsatlar etrafında buluşturan diaspora platformudur.",
    canonicalPath: "/",
  },
  founders: {
    title: "Kurucular | CorteQS",
    description:
      "CorteQS kurucu ekibini, diaspora vizyonunu ve platformun güven temelli büyüme yaklaşımını keşfedin.",
    canonicalPath: "/founders",
  },
  pricing: {
    title: "Fiyatlandırma | CorteQS",
    description:
      "CorteQS danışman, kuruluş ve işletme paketlerini karşılaştırın; size uygun üyelik planını seçin.",
    canonicalPath: "/pricing",
  },
  founding1000: {
    title: "Founding 1000 | CorteQS",
    description:
      "CorteQS Founding 1000 programına katılın; erken dönem topluluk ve görünürlük avantajlarını keşfedin.",
    canonicalPath: "/founding-1000",
  },
  campaign: {
    title: "Kampanyalar | CorteQS",
    description:
      "CorteQS kampanyalarını keşfedin: Founding 1000 erken üyelik programı, Vlogger ve Blogger içerik yarışmaları.",
    canonicalPath: "/campaign",
  },
  contact: {
    title: "İletişim | CorteQS",
    description:
      "CorteQS ile iletişime geçin. Destek, iş birliği ve topluluk soruları için resmi kanallarımızı kullanın.",
    canonicalPath: "/iletisim",
  },
  career: {
    title: "Kariyer | CorteQS",
    description:
      "CorteQS kariyer sayfasında açık rollerimizi ve global diaspora ekosistemini birlikte büyütme fırsatlarını inceleyin.",
    canonicalPath: "/kariyer",
  },
  radarNews: {
    title: "CorteQS Radar | Haberler ve Duyurular",
    description:
      "CorteQS Radar haberlerini, diaspora duyurularını ve platform güncellemelerini tek sayfada takip edin.",
    canonicalPath: "/radar",
  },
  radarGuides: {
    title: "CorteQS Radar | Ülke Rehberleri",
    description:
      "CorteQS Radar rehberlerinde ülkeler, şehirler ve diaspora yaşamına dair başlangıç bilgilerini tek sayfada bulun.",
    canonicalPath: "/radar/rehberler",
  },
  privacy: {
    title: "Gizlilik Politikası | CorteQS",
    description:
      "CorteQS Gizlilik Politikası; kişisel verilerin nasıl toplandığını, işlendiğini, korunduğunu ve hangi haklara sahip olduğunuzu açıklar.",
    canonicalPath: "/legal/privacy",
  },
  kvkk: {
    title: "KVKK ve Aydınlatma Metni | CorteQS",
    description:
      "CorteQS KVKK, GDPR ve ilgili veri koruma çerçevelerine ilişkin aydınlatma metnini inceleyin.",
    canonicalPath: "/legal/kvkk",
  },
  terms: {
    title: "Kullanım Şartları | CorteQS",
    description:
      "CorteQS kullanım şartlarını, platform sorumluluklarını ve üyelik kurallarını Türkçe olarak inceleyin.",
    canonicalPath: "/legal/terms",
  },
  cookies: {
    title: "Çerez Politikası | CorteQS",
    description:
      "CorteQS çerez politikası; zorunlu, işlevsel ve analitik çerezlerin kullanımını ve tercih yönetimini açıklar.",
    canonicalPath: "/legal/cookies",
  },
  businessInfo: {
    title: "Şirket Bilgileri | CorteQS",
    description:
      "CorteQS şirket ve iletişim bilgileri; hizmet açıklaması, ödeme sonrası destek kanalları ve işletme detayları. Business information for CorteQS Global L.L.C.",
    canonicalPath: "/legal/business-information",
  },
  refundCancellation: {
    title: "İade ve İptal Politikası | CorteQS",
    description:
      "CorteQS iade ve iptal politikası; abonelik iptali, dijital hizmet iadeleri ve Stripe ödemeleri için koşullar. Refund & cancellation policy for digital subscriptions.",
    canonicalPath: "/legal/refund-cancellation",
  },
  serviceDelivery: {
    title: "Hizmet Teslim Politikası | CorteQS",
    description:
      "CorteQS hizmet teslim politikası; dijital teslimat, abonelik erişimi ve ödeme onayı süreçleri. Digital service delivery policy for CorteQS.",
    canonicalPath: "/legal/service-delivery",
  },
  directory: {
    title: "Dizin | CorteQS",
    description:
      "CorteQS dizininde danışmanları, işletmeleri, dernekleri ve şehir elçilerini keşfedin; şehir ve role göre filtreleyin.",
    canonicalPath: "/directory",
  },
  associations: {
    title: "Dernekler ve Kuruluşlar | CorteQS",
    description:
      "Dünya genelindeki Türk dernekleri, vakıfları, odaları, büyükelçilikleri ve konsoloslukları CorteQS'te keşfedin.",
    canonicalPath: "/associations",
  },
  relocationToolsHub: {
    title: "Taşınma Araçları | CorteQS",
    description:
      "Yurt dışına taşınma sürecinizi kolaylaştıran ücretsiz araçlar: ülke seçimi, maaş karşılaştırma, şehir eşleştirme ve daha fazlası.",
    canonicalPath: "/tools",
  },
  cadde: {
    title: "Cadde | CorteQS",
    description:
      "Cadde, Türk diasporasının paylaşım, cafe ve çarşı alanı — güncel gönderileri keşfedin, topluluklara katılın.",
    canonicalPath: "/cadde",
  },
} satisfies Record<string, SeoOptions>;

export type PageSeoKey = keyof typeof PAGE_SEO;
