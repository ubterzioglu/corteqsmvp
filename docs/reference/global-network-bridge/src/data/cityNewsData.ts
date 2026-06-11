import { Cloud, TrendingUp, Briefcase, Newspaper } from "lucide-react";

export type NewsCategory = "all" | "weather" | "economy" | "jobs";
export type NewsSourceType = "local" | "international";

export interface CityNewsItem {
  id: string;
  city: string;
  country: string;
  title: string;
  summary: string;
  category: NewsCategory;
  source: string;
  sourceType: NewsSourceType;
  date: string;
  image?: string;
  keywords?: string[];
}

export interface CitySource {
  name: string;
  type: NewsSourceType;
  logo?: string;
}

export interface CityMeta {
  city: string;
  country: string;
  popular: boolean;
  localSources: CitySource[];
  weather: { temp: string; condition: string; humidity: string; wind: string };
}

export const categoryConfig: Record<NewsCategory, { label: string; icon: typeof Newspaper; color: string }> = {
  all: { label: "Tümü", icon: Newspaper, color: "text-foreground" },
  weather: { label: "Hava Durumu", icon: Cloud, color: "text-blue-400" },
  economy: { label: "Ekonomi", icon: TrendingUp, color: "text-emerald-400" },
  jobs: { label: "İş & Kariyer", icon: Briefcase, color: "text-amber-400" },
};

export const cityMeta: CityMeta[] = [
  // Popular
  { city: "Berlin", country: "Almanya", popular: true, localSources: [{ name: "RBB24", type: "local" }, { name: "Tagesspiegel", type: "local" }, { name: "Berliner Morgenpost", type: "local" }], weather: { temp: "18°C", condition: "Parçalı Bulutlu", humidity: "%62", wind: "12 km/s" } },
  { city: "Londra", country: "İngiltere", popular: true, localSources: [{ name: "BBC News", type: "local" }, { name: "Evening Standard", type: "local" }, { name: "City AM", type: "local" }], weather: { temp: "13°C", condition: "Yağmurlu", humidity: "%85", wind: "20 km/s" } },
  { city: "Dubai", country: "BAE", popular: true, localSources: [{ name: "Gulf News", type: "local" }, { name: "Khaleej Times", type: "local" }, { name: "Arabian Business", type: "local" }], weather: { temp: "38°C", condition: "Güneşli", humidity: "%30", wind: "8 km/s" } },
  { city: "New York", country: "ABD", popular: true, localSources: [{ name: "NY Times", type: "local" }, { name: "NY Post", type: "local" }, { name: "Bloomberg", type: "local" }], weather: { temp: "5°C", condition: "Karlı", humidity: "%70", wind: "25 km/s" } },
  { city: "Paris", country: "Fransa", popular: true, localSources: [{ name: "Le Monde", type: "local" }, { name: "Le Figaro", type: "local" }, { name: "Les Echos", type: "local" }], weather: { temp: "22°C", condition: "Güneşli", humidity: "%45", wind: "10 km/s" } },
  // Extended
  { city: "Münih", country: "Almanya", popular: false, localSources: [{ name: "Süddeutsche Zeitung", type: "local" }, { name: "Münchner Merkur", type: "local" }, { name: "BR24", type: "local" }], weather: { temp: "15°C", condition: "Güneşli", humidity: "%55", wind: "8 km/s" } },
  { city: "Amsterdam", country: "Hollanda", popular: false, localSources: [{ name: "De Telegraaf", type: "local" }, { name: "Het Parool", type: "local" }, { name: "NOS", type: "local" }], weather: { temp: "14°C", condition: "Bulutlu", humidity: "%75", wind: "18 km/s" } },
  { city: "Viyana", country: "Avusturya", popular: false, localSources: [{ name: "Der Standard", type: "local" }, { name: "Die Presse", type: "local" }, { name: "Kurier", type: "local" }], weather: { temp: "16°C", condition: "Parçalı Bulutlu", humidity: "%58", wind: "10 km/s" } },
  { city: "Zürih", country: "İsviçre", popular: false, localSources: [{ name: "NZZ", type: "local" }, { name: "Tages-Anzeiger", type: "local" }, { name: "20 Minuten", type: "local" }], weather: { temp: "12°C", condition: "Yağmurlu", humidity: "%80", wind: "14 km/s" } },
  { city: "Toronto", country: "Kanada", popular: false, localSources: [{ name: "Toronto Star", type: "local" }, { name: "Globe and Mail", type: "local" }, { name: "CBC Toronto", type: "local" }], weather: { temp: "8°C", condition: "Bulutlu", humidity: "%65", wind: "16 km/s" } },
  { city: "Stockholm", country: "İsveç", popular: false, localSources: [{ name: "Dagens Nyheter", type: "local" }, { name: "SVT", type: "local" }, { name: "Aftonbladet", type: "local" }], weather: { temp: "6°C", condition: "Karlı", humidity: "%78", wind: "20 km/s" } },
  { city: "Brüksel", country: "Belçika", popular: false, localSources: [{ name: "Le Soir", type: "local" }, { name: "De Standaard", type: "local" }, { name: "RTBF", type: "local" }], weather: { temp: "11°C", condition: "Yağmurlu", humidity: "%82", wind: "15 km/s" } },
  { city: "Frankfurt", country: "Almanya", popular: false, localSources: [{ name: "FAZ", type: "local" }, { name: "Frankfurter Rundschau", type: "local" }, { name: "HR", type: "local" }], weather: { temp: "17°C", condition: "Parçalı Bulutlu", humidity: "%60", wind: "11 km/s" } },
  { city: "Sydney", country: "Avustralya", popular: true, localSources: [{ name: "Sydney Morning Herald", type: "local" }, { name: "ABC News AU", type: "local" }, { name: "Daily Telegraph", type: "local" }], weather: { temp: "24°C", condition: "Güneşli", humidity: "%50", wind: "12 km/s" } },
  { city: "Los Angeles", country: "ABD", popular: false, localSources: [{ name: "LA Times", type: "local" }, { name: "KTLA", type: "local" }, { name: "Daily News", type: "local" }], weather: { temp: "28°C", condition: "Güneşli", humidity: "%35", wind: "6 km/s" } },
  { city: "Doha", country: "Katar", popular: false, localSources: [{ name: "Al Jazeera", type: "local" }, { name: "Qatar Tribune", type: "local" }, { name: "The Peninsula", type: "local" }], weather: { temp: "36°C", condition: "Güneşli", humidity: "%40", wind: "10 km/s" } },
  { city: "Hamburg", country: "Almanya", popular: false, localSources: [{ name: "Hamburger Abendblatt", type: "local" }, { name: "NDR", type: "local" }, { name: "MOPO", type: "local" }], weather: { temp: "13°C", condition: "Bulutlu", humidity: "%72", wind: "22 km/s" } },
  { city: "Manchester", country: "İngiltere", popular: false, localSources: [{ name: "Manchester Evening News", type: "local" }, { name: "BBC Manchester", type: "local" }, { name: "The Mancunion", type: "local" }], weather: { temp: "11°C", condition: "Yağmurlu", humidity: "%88", wind: "24 km/s" } },
  { city: "Milano", country: "İtalya", popular: false, localSources: [{ name: "Corriere della Sera", type: "local" }, { name: "La Repubblica", type: "local" }, { name: "Il Sole 24 Ore", type: "local" }], weather: { temp: "20°C", condition: "Güneşli", humidity: "%48", wind: "9 km/s" } },
  { city: "Kopenhag", country: "Danimarka", popular: false, localSources: [{ name: "Berlingske", type: "local" }, { name: "Politiken", type: "local" }, { name: "DR", type: "local" }], weather: { temp: "9°C", condition: "Bulutlu", humidity: "%76", wind: "19 km/s" } },
  // Kanada
  { city: "Vancouver", country: "Kanada", popular: false, localSources: [{ name: "Vancouver Sun", type: "local" }, { name: "CBC BC", type: "local" }, { name: "The Province", type: "local" }], weather: { temp: "14°C", condition: "Bulutlu", humidity: "%70", wind: "12 km/s" } },
  { city: "Montreal", country: "Kanada", popular: true, localSources: [{ name: "Montreal Gazette", type: "local" }, { name: "La Presse", type: "local" }, { name: "CBC Montreal", type: "local" }], weather: { temp: "10°C", condition: "Parçalı Bulutlu", humidity: "%65", wind: "14 km/s" } },
  // Avustralya
  { city: "Melbourne", country: "Avustralya", popular: false, localSources: [{ name: "The Age", type: "local" }, { name: "Herald Sun", type: "local" }, { name: "ABC Melbourne", type: "local" }], weather: { temp: "18°C", condition: "Parçalı Bulutlu", humidity: "%55", wind: "15 km/s" } },
  { city: "Brisbane", country: "Avustralya", popular: false, localSources: [{ name: "Courier Mail", type: "local" }, { name: "ABC QLD", type: "local" }, { name: "Brisbane Times", type: "local" }], weather: { temp: "26°C", condition: "Güneşli", humidity: "%60", wind: "10 km/s" } },
  // İspanya
  { city: "Madrid", country: "İspanya", popular: true, localSources: [{ name: "El País", type: "local" }, { name: "El Mundo", type: "local" }, { name: "ABC", type: "local" }], weather: { temp: "30°C", condition: "Güneşli", humidity: "%25", wind: "8 km/s" } },
  { city: "Barcelona", country: "İspanya", popular: false, localSources: [{ name: "La Vanguardia", type: "local" }, { name: "El Periódico", type: "local" }, { name: "Ara", type: "local" }], weather: { temp: "25°C", condition: "Güneşli", humidity: "%55", wind: "12 km/s" } },
  { city: "Valencia", country: "İspanya", popular: false, localSources: [{ name: "Las Provincias", type: "local" }, { name: "Levante", type: "local" }, { name: "À Punt", type: "local" }], weather: { temp: "27°C", condition: "Güneşli", humidity: "%50", wind: "10 km/s" } },
  // Yunanistan
  { city: "Atina", country: "Yunanistan", popular: false, localSources: [{ name: "Kathimerini", type: "local" }, { name: "Ta Nea", type: "local" }, { name: "ERT", type: "local" }], weather: { temp: "32°C", condition: "Güneşli", humidity: "%30", wind: "6 km/s" } },
  { city: "Selanik", country: "Yunanistan", popular: false, localSources: [{ name: "Makedonia", type: "local" }, { name: "Thessaloniki News", type: "local" }, { name: "ERT3", type: "local" }], weather: { temp: "28°C", condition: "Parçalı Bulutlu", humidity: "%45", wind: "8 km/s" } },
  // İtalya
  { city: "Roma", country: "İtalya", popular: true, localSources: [{ name: "La Repubblica Roma", type: "local" }, { name: "Il Messaggero", type: "local" }, { name: "ANSA", type: "local" }], weather: { temp: "28°C", condition: "Güneşli", humidity: "%40", wind: "7 km/s" } },
  { city: "Napoli", country: "İtalya", popular: false, localSources: [{ name: "Il Mattino", type: "local" }, { name: "NapoliToday", type: "local" }, { name: "Corriere del Mezzogiorno", type: "local" }], weather: { temp: "26°C", condition: "Güneşli", humidity: "%50", wind: "10 km/s" } },
  { city: "Torino", country: "İtalya", popular: false, localSources: [{ name: "La Stampa", type: "local" }, { name: "Torino Today", type: "local" }, { name: "RAI Piemonte", type: "local" }], weather: { temp: "22°C", condition: "Parçalı Bulutlu", humidity: "%55", wind: "8 km/s" } },
  // Portekiz
  { city: "Lisbon", country: "Portekiz", popular: true, localSources: [{ name: "Público", type: "local" }, { name: "Diário de Notícias", type: "local" }, { name: "RTP", type: "local" }], weather: { temp: "24°C", condition: "Güneşli", humidity: "%45", wind: "14 km/s" } },
];

// Mock local news per city
export const mockCityNews: CityNewsItem[] = [
  // Berlin
  { id: "b1", city: "Berlin", country: "Almanya", title: "Berlin'de sıcaklık 32°C'ye ulaştı", summary: "Haziran ayında beklenmedik sıcak dalga Berlin'i vurdu.", category: "weather", source: "RBB24", sourceType: "local", date: "2026-03-28", image: "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=400", keywords: ["sıcak", "hava"] },
  { id: "b2", city: "Berlin", country: "Almanya", title: "Startup yatırımları %40 arttı", summary: "2026 ilk çeyreğinde Berlin startup ekosistemi rekor yatırım çekti.", category: "economy", source: "Handelsblatt", sourceType: "local", date: "2026-03-27", keywords: ["startup", "yatırım"] },
  { id: "b3", city: "Berlin", country: "Almanya", title: "IT sektöründe 12.000 açık pozisyon", summary: "Yazılımcılara €65K-€95K arası maaş teklif ediliyor.", category: "jobs", source: "Berliner Morgenpost", sourceType: "local", date: "2026-03-26", keywords: ["IT", "yazılım", "iş"] },
  { id: "b4", city: "Berlin", country: "Almanya", title: "Kira fiyatları %8 daha arttı", summary: "Ortalama kira metrekare başına €16'ya ulaştı.", category: "economy", source: "Tagesspiegel", sourceType: "local", date: "2026-03-25", keywords: ["kira", "gayrimenkul"] },
  { id: "b5", city: "Berlin", country: "Almanya", title: "Gastro sektörü 3.000 garson arıyor", summary: "Part-time fırsatlar öğrencilere açık.", category: "jobs", source: "BZ Berlin", sourceType: "local", date: "2026-03-24", keywords: ["garson", "part-time"] },

  // Londra
  { id: "l1", city: "Londra", country: "İngiltere", title: "Londra'da yağmurlu hafta başlıyor", summary: "Sıcaklıklar 12-15°C arasında seyredecek.", category: "weather", source: "BBC Weather", sourceType: "local", date: "2026-03-28", image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400", keywords: ["yağmur", "hava"] },
  { id: "l2", city: "Londra", country: "İngiltere", title: "Pound 3 yılın zirvesinde", summary: "GBP/EUR paritesi 1.20'yi aştı.", category: "economy", source: "Financial Times", sourceType: "local", date: "2026-03-27", keywords: ["pound", "döviz"] },
  { id: "l3", city: "Londra", country: "İngiltere", title: "NHS 5.000 hemşire alacak", summary: "Uluslararası işe alım kampanyası başlattı.", category: "jobs", source: "The Guardian", sourceType: "local", date: "2026-03-26", keywords: ["hemşire", "sağlık"] },
  { id: "l4", city: "Londra", country: "İngiltere", title: "Fintech boom devam ediyor", summary: "2026'da 200+ yeni fintech şirketi kuruldu.", category: "economy", source: "City AM", sourceType: "local", date: "2026-03-25", keywords: ["fintech", "startup"] },
  { id: "l5", city: "Londra", country: "İngiltere", title: "AI mühendisi maaşları £120K'yı geçti", summary: "Kıdemli pozisyonlar £120-180K arasında.", category: "jobs", source: "TechCrunch UK", sourceType: "local", date: "2026-03-24", keywords: ["yapay zeka", "maaş"] },

  // Dubai
  { id: "d1", city: "Dubai", country: "BAE", title: "Dubai'de sıcaklık 45°C'ye tırmandı", summary: "Dış mekân çalışma yasağı öğle saatlerine genişletildi.", category: "weather", source: "Gulf News", sourceType: "local", date: "2026-03-28", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400", keywords: ["sıcak", "çalışma yasağı"] },
  { id: "d2", city: "Dubai", country: "BAE", title: "Gayrimenkul satışları rekor kırdı", summary: "Palm Jumeirah'da metrekare fiyatı $8.000'ı aştı.", category: "economy", source: "Khaleej Times", sourceType: "local", date: "2026-03-27", keywords: ["gayrimenkul", "lüks"] },
  { id: "d3", city: "Dubai", country: "BAE", title: "DIFC 2.000 finans uzmanı arıyor", summary: "Türkçe bilen adaylara öncelik veriliyor.", category: "jobs", source: "Arabian Business", sourceType: "local", date: "2026-03-26", keywords: ["finans", "DIFC"] },
  { id: "d4", city: "Dubai", country: "BAE", title: "VAT %5'ten %7'ye çıkabilir", summary: "BAE hükümeti KDV oranını artırmayı değerlendiriyor.", category: "economy", source: "The National", sourceType: "local", date: "2026-03-25", keywords: ["vergi", "KDV"] },
  { id: "d5", city: "Dubai", country: "BAE", title: "Turizm 10.000 yeni istihdam yaratacak", summary: "Expo City Dubai genişlemesi büyük istihdam getiriyor.", category: "jobs", source: "Gulf Today", sourceType: "local", date: "2026-03-24", keywords: ["turizm", "otel"] },

  // New York
  { id: "n1", city: "New York", country: "ABD", title: "New York'ta kar fırtınası uyarısı", summary: "15-20 cm kar bekleniyor, okullar tatil edilebilir.", category: "weather", source: "NY Times", sourceType: "local", date: "2026-03-28", image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400", keywords: ["kar", "fırtına"] },
  { id: "n2", city: "New York", country: "ABD", title: "Wall Street'te tech rallisi", summary: "AI hisseleri %15 değerlendi.", category: "economy", source: "Bloomberg", sourceType: "local", date: "2026-03-27", keywords: ["borsa", "AI"] },
  { id: "n3", city: "New York", country: "ABD", title: "Restoran sektörü 8.000 aşçı arıyor", summary: "Türk mutfağı restoranları da personel arıyor.", category: "jobs", source: "NY Post", sourceType: "local", date: "2026-03-26", keywords: ["aşçı", "restoran"] },
  { id: "n4", city: "New York", country: "ABD", title: "Manhattan kiraları $4.000 ortalamasında", summary: "Studio daireler bile $2.800'ın altına düşmüyor.", category: "economy", source: "WSJ", sourceType: "local", date: "2026-03-25", keywords: ["kira", "gayrimenkul"] },
  { id: "n5", city: "New York", country: "ABD", title: "Siber güvenlik pozisyonları patladı", summary: "Giriş seviyesi maaşlar $85K'dan başlıyor.", category: "jobs", source: "TechCrunch", sourceType: "local", date: "2026-03-24", keywords: ["siber güvenlik", "maaş"] },

  // Paris
  { id: "p1", city: "Paris", country: "Fransa", title: "Paris'te bahar havası, 22°C", summary: "Parklarda piknik sezonu açıldı.", category: "weather", source: "Le Monde", sourceType: "local", date: "2026-03-28", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400", keywords: ["bahar", "güneş"] },
  { id: "p2", city: "Paris", country: "Fransa", title: "Enflasyon %2.1'e geriledi", summary: "Tüketici güveni 18 ayın en yüksek seviyesinde.", category: "economy", source: "Les Echos", sourceType: "local", date: "2026-03-27", keywords: ["enflasyon", "faiz"] },
  { id: "p3", city: "Paris", country: "Fransa", title: "Sağlık sektörü 6.000 personel alacak", summary: "Yabancı diplomalı doktorlar için hızlandırılmış denklik.", category: "jobs", source: "Le Figaro", sourceType: "local", date: "2026-03-26", keywords: ["doktor", "sağlık"] },
  { id: "p4", city: "Paris", country: "Fransa", title: "Lüks ihracat €50 milyarı aştı", summary: "LVMH ve Hermès rekor rakamlarına ulaştı.", category: "economy", source: "Reuters FR", sourceType: "local", date: "2026-03-25", keywords: ["lüks", "ihracat"] },
  { id: "p5", city: "Paris", country: "Fransa", title: "La Défense'da 3.500 yeni iş ilanı", summary: "Finans ve danışmanlık ağırlıklı işe alım.", category: "jobs", source: "Cadremploi", sourceType: "local", date: "2026-03-24", keywords: ["finans", "danışmanlık"] },

  // Extended cities - 3 news each
  { id: "mu1", city: "Münih", country: "Almanya", title: "Münih'te Oktoberfest hazırlıkları başladı", summary: "Bu yıl 7 milyon ziyaretçi bekleniyor.", category: "economy", source: "Süddeutsche Zeitung", sourceType: "local", date: "2026-03-28", keywords: ["festival", "turizm"] },
  { id: "mu2", city: "Münih", country: "Almanya", title: "BMW 1.500 mühendis arıyor", summary: "Elektrikli araç bölümünde büyük genişleme.", category: "jobs", source: "Münchner Merkur", sourceType: "local", date: "2026-03-27", keywords: ["mühendis", "otomotiv"] },
  { id: "mu3", city: "Münih", country: "Almanya", title: "Münih'te yağmurlu hafta", summary: "Sıcaklıklar 12-16°C arasında seyredecek.", category: "weather", source: "BR24", sourceType: "local", date: "2026-03-26", keywords: ["yağmur"] },

  { id: "am1", city: "Amsterdam", country: "Hollanda", title: "Amsterdam'da bisiklet altyapısı genişliyor", summary: "€200M yatırımla yeni bisiklet yolları.", category: "economy", source: "Het Parool", sourceType: "local", date: "2026-03-28", keywords: ["bisiklet", "altyapı"] },
  { id: "am2", city: "Amsterdam", country: "Hollanda", title: "Schiphol'da 2.000 güvenlik personeli aranıyor", summary: "Yaz sezonu öncesi acil işe alım.", category: "jobs", source: "NOS", sourceType: "local", date: "2026-03-27", keywords: ["havalimanı", "güvenlik"] },
  { id: "am3", city: "Amsterdam", country: "Hollanda", title: "Amsterdam'da fırtına uyarısı", summary: "Rüzgar hızı 90 km/s'ye ulaşabilir.", category: "weather", source: "De Telegraaf", sourceType: "local", date: "2026-03-26", keywords: ["fırtına", "rüzgar"] },

  { id: "vi1", city: "Viyana", country: "Avusturya", title: "Viyana yaşam kalitesi sıralamasında 1 numara", summary: "Mercer araştırması Viyana'yı yeniden zirveye koydu.", category: "economy", source: "Der Standard", sourceType: "local", date: "2026-03-28", keywords: ["yaşam kalitesi"] },
  { id: "vi2", city: "Viyana", country: "Avusturya", title: "Viyana'da sağlık sektörü personel arıyor", summary: "3 büyük hastanede 800 açık pozisyon.", category: "jobs", source: "Kurier", sourceType: "local", date: "2026-03-27", keywords: ["sağlık", "hastane"] },
  { id: "vi3", city: "Viyana", country: "Avusturya", title: "Viyana'da güneşli hafta", summary: "Sıcaklıklar 20°C'ye çıkacak.", category: "weather", source: "Die Presse", sourceType: "local", date: "2026-03-26", keywords: ["güneş"] },

  { id: "zu1", city: "Zürih", country: "İsviçre", title: "Zürih'te finans sektörü büyüyor", summary: "UBS ve Credit Suisse birleşmesi sonrası yeni fırsatlar.", category: "economy", source: "NZZ", sourceType: "local", date: "2026-03-28", keywords: ["finans", "banka"] },
  { id: "zu2", city: "Zürih", country: "İsviçre", title: "ETH Zürih 500 araştırmacı alacak", summary: "Yapay zeka ve kuantum bilişim alanlarında.", category: "jobs", source: "Tages-Anzeiger", sourceType: "local", date: "2026-03-27", keywords: ["araştırma", "üniversite"] },
  { id: "zu3", city: "Zürih", country: "İsviçre", title: "Zürih'te yağışlı günler başlıyor", summary: "Hafta boyunca yağmur bekleniyor.", category: "weather", source: "20 Minuten", sourceType: "local", date: "2026-03-26", keywords: ["yağmur"] },

  { id: "to1", city: "Toronto", country: "Kanada", title: "Toronto konut fiyatları düşüşte", summary: "Ortalama ev fiyatı %5 geriledi.", category: "economy", source: "Toronto Star", sourceType: "local", date: "2026-03-28", keywords: ["konut", "fiyat"] },
  { id: "to2", city: "Toronto", country: "Kanada", title: "Kanada'da IT işe alımları hızlandı", summary: "Toronto'da 5.000 yeni tech pozisyonu.", category: "jobs", source: "Globe and Mail", sourceType: "local", date: "2026-03-27", keywords: ["IT", "teknoloji"] },
  { id: "to3", city: "Toronto", country: "Kanada", title: "Toronto'da soğuk dalga", summary: "-10°C bekleniyor, don uyarısı verildi.", category: "weather", source: "CBC Toronto", sourceType: "local", date: "2026-03-26", keywords: ["soğuk", "don"] },

  { id: "st1", city: "Stockholm", country: "İsveç", title: "İsveç ekonomisi %2.3 büyüdü", summary: "Beklentilerin üzerinde performans.", category: "economy", source: "Dagens Nyheter", sourceType: "local", date: "2026-03-28", keywords: ["büyüme", "ekonomi"] },
  { id: "st2", city: "Stockholm", country: "İsveç", title: "Spotify 300 kişi alacak", summary: "Stockholm merkez ofisinde genişleme.", category: "jobs", source: "SVT", sourceType: "local", date: "2026-03-27", keywords: ["Spotify", "teknoloji"] },
  { id: "st3", city: "Stockholm", country: "İsveç", title: "Stockholm'de kar sürprizi", summary: "Mart sonunda 10 cm kar yağdı.", category: "weather", source: "Aftonbladet", sourceType: "local", date: "2026-03-26", keywords: ["kar"] },

  { id: "br1", city: "Brüksel", country: "Belçika", title: "AB yeni dijital vergi planladı", summary: "Tech devlerine %3 dijital hizmet vergisi.", category: "economy", source: "Le Soir", sourceType: "local", date: "2026-03-28", keywords: ["AB", "vergi"] },
  { id: "br2", city: "Brüksel", country: "Belçika", title: "AB kurumları 1.200 uzman arıyor", summary: "Hukuk ve politika alanlarında fırsatlar.", category: "jobs", source: "RTBF", sourceType: "local", date: "2026-03-27", keywords: ["AB", "hukuk"] },
  { id: "br3", city: "Brüksel", country: "Belçika", title: "Brüksel'de ılıman hava", summary: "14°C, hafif bulutlu bir hafta.", category: "weather", source: "De Standaard", sourceType: "local", date: "2026-03-26", keywords: ["ılıman"] },

  { id: "fr1", city: "Frankfurt", country: "Almanya", title: "ECB faiz kararı açıklanıyor", summary: "Piyasalar %0.25 indirim bekliyor.", category: "economy", source: "FAZ", sourceType: "local", date: "2026-03-28", keywords: ["faiz", "ECB"] },
  { id: "fr2", city: "Frankfurt", country: "Almanya", title: "Bankacılık sektörü 3.000 kişi arıyor", summary: "Deutsche Bank ve Commerzbank başta.", category: "jobs", source: "Frankfurter Rundschau", sourceType: "local", date: "2026-03-27", keywords: ["banka", "finans"] },
  { id: "fr3", city: "Frankfurt", country: "Almanya", title: "Frankfurt'ta sıcak dalga", summary: "30°C üzeri sıcaklıklar bekleniyor.", category: "weather", source: "HR", sourceType: "local", date: "2026-03-26", keywords: ["sıcak"] },

  { id: "sy1", city: "Sydney", country: "Avustralya", title: "Sydney'de emlak piyasası canlanıyor", summary: "Medyan ev fiyatı $1.2M'a ulaştı.", category: "economy", source: "Sydney Morning Herald", sourceType: "local", date: "2026-03-28", keywords: ["emlak", "fiyat"] },
  { id: "sy2", city: "Sydney", country: "Avustralya", title: "Avustralya madencilik sektörü personel arıyor", summary: "Mühendis ve teknisyen açığı.", category: "jobs", source: "ABC News AU", sourceType: "local", date: "2026-03-27", keywords: ["madencilik", "mühendis"] },
  { id: "sy3", city: "Sydney", country: "Avustralya", title: "Sydney'de güneşli sonbahar", summary: "24°C ile mevsim normallerinin üzerinde.", category: "weather", source: "Daily Telegraph", sourceType: "local", date: "2026-03-26", keywords: ["güneş", "sonbahar"] },

  { id: "la1", city: "Los Angeles", country: "ABD", title: "Hollywood'da yapım bütçeleri arttı", summary: "Streaming savaşları devam ediyor.", category: "economy", source: "LA Times", sourceType: "local", date: "2026-03-28", keywords: ["Hollywood", "film"] },
  { id: "la2", city: "Los Angeles", country: "ABD", title: "LA'de sağlık sektörü 4.000 kişi arıyor", summary: "Hemşire ve teknisyen pozisyonları ağırlıkta.", category: "jobs", source: "KTLA", sourceType: "local", date: "2026-03-27", keywords: ["sağlık", "hemşire"] },
  { id: "la3", city: "Los Angeles", country: "ABD", title: "LA'de güneşli hafta", summary: "28°C ile mükemmel plaj havası.", category: "weather", source: "Daily News", sourceType: "local", date: "2026-03-26", keywords: ["güneş", "plaj"] },

  { id: "do1", city: "Doha", country: "Katar", title: "Katar LNG ihracatını artırıyor", summary: "Yeni anlaşmalarla kapasite %30 büyüyecek.", category: "economy", source: "Al Jazeera", sourceType: "local", date: "2026-03-28", keywords: ["enerji", "LNG"] },
  { id: "do2", city: "Doha", country: "Katar", title: "Doha'da eğitim sektörü büyüyor", summary: "Education City'de 500 akademisyen aranıyor.", category: "jobs", source: "Qatar Tribune", sourceType: "local", date: "2026-03-27", keywords: ["eğitim", "akademi"] },
  { id: "do3", city: "Doha", country: "Katar", title: "Doha'da kavurucu sıcak", summary: "36°C ile yaz erken geldi.", category: "weather", source: "The Peninsula", sourceType: "local", date: "2026-03-26", keywords: ["sıcak"] },

  { id: "hb1", city: "Hamburg", country: "Almanya", title: "Hamburg limanı rekor kırdı", summary: "Konteyner trafiği %12 arttı.", category: "economy", source: "Hamburger Abendblatt", sourceType: "local", date: "2026-03-28", keywords: ["liman", "ticaret"] },
  { id: "hb2", city: "Hamburg", country: "Almanya", title: "Lojistik sektörü 2.000 personel arıyor", summary: "Liman ve depo operasyonları için acil ihtiyaç.", category: "jobs", source: "MOPO", sourceType: "local", date: "2026-03-27", keywords: ["lojistik", "liman"] },
  { id: "hb3", city: "Hamburg", country: "Almanya", title: "Hamburg'da fırtınalı hava", summary: "Kuzeyden soğuk cephe geliyor.", category: "weather", source: "NDR", sourceType: "local", date: "2026-03-26", keywords: ["fırtına"] },

  { id: "mc1", city: "Manchester", country: "İngiltere", title: "Manchester tech hub büyüyor", summary: "MediaCityUK'da 50+ yeni startup.", category: "economy", source: "Manchester Evening News", sourceType: "local", date: "2026-03-28", keywords: ["tech", "startup"] },
  { id: "mc2", city: "Manchester", country: "İngiltere", title: "NHS North West 1.500 personel alacak", summary: "Hemşire ve doktor pozisyonları açık.", category: "jobs", source: "BBC Manchester", sourceType: "local", date: "2026-03-27", keywords: ["sağlık", "NHS"] },
  { id: "mc3", city: "Manchester", country: "İngiltere", title: "Manchester'da tipik yağmurlu hava", summary: "Hafta boyunca yağış devam edecek.", category: "weather", source: "The Mancunion", sourceType: "local", date: "2026-03-26", keywords: ["yağmur"] },

  { id: "mi1", city: "Milano", country: "İtalya", title: "Milano Moda Haftası rekor ilgi gördü", summary: "€2 milyar değerinde iş bağlantısı kuruldu.", category: "economy", source: "Corriere della Sera", sourceType: "local", date: "2026-03-28", keywords: ["moda", "lüks"] },
  { id: "mi2", city: "Milano", country: "İtalya", title: "Milano'da tasarım sektörü personel arıyor", summary: "Grafik ve endüstriyel tasarımcı pozisyonları.", category: "jobs", source: "La Repubblica", sourceType: "local", date: "2026-03-27", keywords: ["tasarım", "kreatif"] },
  { id: "mi3", city: "Milano", country: "İtalya", title: "Milano'da güneşli İtalyan baharı", summary: "20°C ile keyifli günler.", category: "weather", source: "Il Sole 24 Ore", sourceType: "local", date: "2026-03-26", keywords: ["güneş", "bahar"] },

  { id: "kp1", city: "Kopenhag", country: "Danimarka", title: "Danimarka yeşil enerji lideri", summary: "Rüzgar enerjisiyle elektriğin %60'ı karşılandı.", category: "economy", source: "Berlingske", sourceType: "local", date: "2026-03-28", keywords: ["enerji", "rüzgar"] },
  { id: "kp2", city: "Kopenhag", country: "Danimarka", title: "Novo Nordisk 800 araştırmacı arıyor", summary: "İlaç sektöründe dev işe alım.", category: "jobs", source: "Politiken", sourceType: "local", date: "2026-03-27", keywords: ["ilaç", "araştırma"] },
  { id: "kp3", city: "Kopenhag", country: "Danimarka", title: "Kopenhag'da serin hava", summary: "9°C, bulutlu bir hafta bekleniyor.", category: "weather", source: "DR", sourceType: "local", date: "2026-03-26", keywords: ["bulutlu", "serin"] },
];

// International news that mention specific cities (BBC, CNN, Reuters, etc.)
export const mockInternationalNews: CityNewsItem[] = [
  // Dubai
  { id: "int-d1", city: "Dubai", country: "BAE", title: "Dubai becomes world's busiest airport for international passengers", summary: "BBC reports Dubai International surpassed London Heathrow with 92M passengers.", source: "BBC", sourceType: "international", category: "economy", date: "2026-03-28", keywords: ["havalimanı", "turizm"] },
  { id: "int-d2", city: "Dubai", country: "BAE", title: "Dubai's real estate boom draws global investors", summary: "CNN Money covers the unprecedented surge in luxury property sales.", source: "CNN", sourceType: "international", category: "economy", date: "2026-03-27", keywords: ["gayrimenkul", "yatırım"] },

  // Berlin
  { id: "int-b1", city: "Berlin", country: "Almanya", title: "Berlin emerges as Europe's AI capital", summary: "Reuters reports Berlin attracted €3B in AI investments this quarter.", source: "Reuters", sourceType: "international", category: "economy", date: "2026-03-28", keywords: ["AI", "yatırım"] },
  { id: "int-b2", city: "Berlin", country: "Almanya", title: "Germany's housing crisis deepens in Berlin", summary: "BBC World covers rent protests and new regulations.", source: "BBC", sourceType: "international", category: "economy", date: "2026-03-27", keywords: ["kira", "konut"] },

  // Londra
  { id: "int-l1", city: "Londra", country: "İngiltere", title: "London leads global fintech revolution", summary: "CNN Business explores London's dominance in digital banking.", source: "CNN", sourceType: "international", category: "economy", date: "2026-03-28", keywords: ["fintech", "dijital"] },
  { id: "int-l2", city: "Londra", country: "İngiltere", title: "UK faces worst healthcare staffing crisis", summary: "Reuters reports on NHS struggles to recruit overseas workers.", source: "Reuters", sourceType: "international", category: "jobs", date: "2026-03-27", keywords: ["sağlık", "NHS"] },

  // New York
  { id: "int-n1", city: "New York", country: "ABD", title: "Wall Street's AI rally raises bubble fears", summary: "BBC Business warns of overvaluation in tech stocks.", source: "BBC", sourceType: "international", category: "economy", date: "2026-03-28", keywords: ["borsa", "AI"] },
  { id: "int-n2", city: "New York", country: "ABD", title: "NYC rents hit all-time high", summary: "CNN reports Manhattan average rent exceeds $4,000.", source: "CNN", sourceType: "international", category: "economy", date: "2026-03-27", keywords: ["kira", "konut"] },

  // Paris
  { id: "int-p1", city: "Paris", country: "Fransa", title: "Paris luxury brands post record exports", summary: "Reuters covers French luxury sector's €50B export milestone.", source: "Reuters", sourceType: "international", category: "economy", date: "2026-03-28", keywords: ["lüks", "ihracat"] },
  { id: "int-p2", city: "Paris", country: "Fransa", title: "France's inflation drops faster than expected", summary: "BBC Europe reports ECB may cut rates sooner.", source: "BBC", sourceType: "international", category: "economy", date: "2026-03-27", keywords: ["enflasyon", "faiz"] },

  // Some extended cities
  { id: "int-mi1", city: "Milano", country: "İtalya", title: "Milan Fashion Week sets new records", summary: "CNN Style reports record-breaking attendance and deals.", source: "CNN", sourceType: "international", category: "economy", date: "2026-03-28", keywords: ["moda"] },
  { id: "int-to1", city: "Toronto", country: "Kanada", title: "Toronto housing market finally cooling", summary: "BBC reports first significant price drop in 5 years.", source: "BBC", sourceType: "international", category: "economy", date: "2026-03-28", keywords: ["konut", "fiyat"] },
];

// Helper: get all news for a city (local + international), with optional category and keyword filter
export function getFilteredNews(
  city: string,
  category: NewsCategory = "all",
  keyword: string = ""
): { local: CityNewsItem[]; international: CityNewsItem[] } {
  const kw = keyword.toLowerCase().trim();

  const filterFn = (n: CityNewsItem) => {
    const cityMatch = n.city === city;
    const catMatch = category === "all" || n.category === category;
    const kwMatch = !kw || n.title.toLowerCase().includes(kw) || n.summary.toLowerCase().includes(kw) || (n.keywords || []).some(k => k.toLowerCase().includes(kw));
    return cityMatch && catMatch && kwMatch;
  };

  return {
    local: mockCityNews.filter(filterFn),
    international: mockInternationalNews.filter(filterFn),
  };
}

// Get all news across all cities filtered by keyword/category (cross-city search)
export function searchAllNews(
  category: NewsCategory = "all",
  keyword: string = ""
): CityNewsItem[] {
  const kw = keyword.toLowerCase().trim();
  const all = [...mockCityNews, ...mockInternationalNews];

  return all.filter(n => {
    const catMatch = category === "all" || n.category === category;
    const kwMatch = !kw || n.title.toLowerCase().includes(kw) || n.summary.toLowerCase().includes(kw) || (n.keywords || []).some(k => k.toLowerCase().includes(kw));
    return catMatch && kwMatch;
  });
}

// =============== DİASPORA MEDYA (Dergi / Gazete / Kitap) ===============
export type DiasporaMediaType = "magazine" | "newspaper" | "book";

export interface DiasporaMediaItem {
  id: string;
  city: string;
  country: string;
  type: DiasporaMediaType;
  title: string;
  publisher: string;       // yayınevi / yayın grubu / yazar
  description: string;
  cover?: string;          // kapak görseli url
  frequency?: string;      // "Aylık", "Haftalık", "Tek baskı"
  year?: number;
  language?: string;       // "TR", "TR-DE" vb
  link?: string;
}

export const mockDiasporaMedia: DiasporaMediaItem[] = [
  // Berlin
  { id: "med-b1", city: "Berlin", country: "Almanya", type: "magazine", title: "Berlin Türkleri", publisher: "BTM Yayıncılık", description: "Berlin'deki Türk topluluğunun kültür-sanat ve gündem dergisi.", frequency: "Aylık", language: "TR-DE", year: 2024, cover: "https://images.unsplash.com/photo-1532153975070-2e9ab71f1b14?w=400" },
  { id: "med-b2", city: "Berlin", country: "Almanya", type: "newspaper", title: "Avrupa Postası", publisher: "Avrupa Medya Grubu", description: "Almanya genelinde dağıtılan haftalık Türkçe gazete.", frequency: "Haftalık", language: "TR", year: 2023, cover: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400" },
  { id: "med-b3", city: "Berlin", country: "Almanya", type: "book", title: "Kreuzberg'in Çocukları", publisher: "Sema Yıldız", description: "Berlin'de doğan ikinci kuşak Türklerin kimlik öyküleri.", year: 2025, language: "TR", cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400" },

  // Londra
  { id: "med-l1", city: "Londra", country: "İngiltere", type: "newspaper", title: "Londra Gazete", publisher: "LG Media Ltd", description: "Birleşik Krallık'taki Türk toplumunun en köklü haftalık gazetesi.", frequency: "Haftalık", language: "TR", year: 2022, cover: "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400" },
  { id: "med-l2", city: "Londra", country: "İngiltere", type: "magazine", title: "Thames Diaspora", publisher: "TD Publishing", description: "İş, kültür ve göçmen hikayeleri üzerine aylık dergi.", frequency: "Aylık", language: "TR-EN", year: 2024, cover: "https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=400" },
  { id: "med-l3", city: "Londra", country: "İngiltere", type: "book", title: "Londra'da Bir Türk", publisher: "Mehmet Aydın", description: "Londra'da 30 yıl yaşamış bir gazetecinin anıları.", year: 2024, language: "TR", cover: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400" },

  // Dubai
  { id: "med-d1", city: "Dubai", country: "BAE", type: "magazine", title: "Gulf Türk Business", publisher: "GTB Media", description: "Körfez bölgesindeki Türk iş insanlarına yönelik aylık dergi.", frequency: "Aylık", language: "TR-EN", year: 2024, cover: "https://images.unsplash.com/photo-1611605698335-8b1569810432?w=400" },
  { id: "med-d2", city: "Dubai", country: "BAE", type: "newspaper", title: "Körfez Postası", publisher: "Körfez Medya", description: "BAE, Katar ve Suudi Arabistan'daki Türk toplumu için bültem.", frequency: "Haftalık", language: "TR", year: 2025, cover: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400" },
  { id: "med-d3", city: "Dubai", country: "BAE", type: "book", title: "Çöldeki Türkler", publisher: "Ayşe Demir", description: "Körfez'de yaşayan Türklerin başarı hikayeleri.", year: 2025, language: "TR", cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400" },

  // New York
  { id: "med-n1", city: "New York", country: "ABD", type: "newspaper", title: "Türk Amerikan", publisher: "TAA Press", description: "ABD'deki en eski Türkçe haftalık gazete.", frequency: "Haftalık", language: "TR-EN", year: 2021, cover: "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400" },
  { id: "med-n2", city: "New York", country: "ABD", type: "magazine", title: "Hudson Diaspora", publisher: "Hudson Media", description: "New York metropoliten alanındaki Türk toplumunun aylık dergisi.", frequency: "Aylık", language: "TR-EN", year: 2024, cover: "https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=400" },
  { id: "med-n3", city: "New York", country: "ABD", type: "book", title: "Manhattan'dan Anadolu'ya", publisher: "Selim Kaya", description: "NY'da çalışan Türk profesyonellerinin günlüğü.", year: 2025, language: "TR-EN", cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400" },

  // Paris
  { id: "med-p1", city: "Paris", country: "Fransa", type: "magazine", title: "Bonjour Türkiye", publisher: "BT Yayın", description: "Fransa'daki Türk toplumu için kültür ve sanat dergisi.", frequency: "Aylık", language: "TR-FR", year: 2024, cover: "https://images.unsplash.com/photo-1532153975070-2e9ab71f1b14?w=400" },
  { id: "med-p2", city: "Paris", country: "Fransa", type: "newspaper", title: "Paris Post", publisher: "Paris Medya", description: "Fransa Türklerinin haftalık haber gazetesi.", frequency: "Haftalık", language: "TR", year: 2023, cover: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400" },
  { id: "med-p3", city: "Paris", country: "Fransa", type: "book", title: "Seine Kıyısında", publisher: "Leyla Aksoy", description: "Paris'te yaşayan bir Türk kadının hikayesi.", year: 2024, language: "TR-FR", cover: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400" },

  // Münih
  { id: "med-mu1", city: "Münih", country: "Almanya", type: "newspaper", title: "Bavyera Haber", publisher: "BH Medya", description: "Bavyera bölgesi Türk toplumunun gazetesi.", frequency: "Haftalık", language: "TR-DE", year: 2024, cover: "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400" },
  { id: "med-mu2", city: "Münih", country: "Almanya", type: "book", title: "Münih'te Yaşam", publisher: "Hasan Yalçın", description: "Münih'e yerleşen Türk mühendislerin hikayesi.", year: 2025, language: "TR", cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400" },

  // Toronto
  { id: "med-to1", city: "Toronto", country: "Kanada", type: "magazine", title: "Maple Türk", publisher: "Maple Media", description: "Kanada'daki Türk toplumu için aylık dergi.", frequency: "Aylık", language: "TR-EN", year: 2024, cover: "https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=400" },
  { id: "med-to2", city: "Toronto", country: "Kanada", type: "newspaper", title: "Toronto Türk Postası", publisher: "TTP Press", description: "Toronto bölgesindeki Türklerin haftalık gazetesi.", frequency: "Haftalık", language: "TR", year: 2023, cover: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400" },

  // Sydney
  { id: "med-sy1", city: "Sydney", country: "Avustralya", type: "magazine", title: "Sydney Türk", publisher: "ST Yayıncılık", description: "Avustralya'daki Türk toplumunun kültür dergisi.", frequency: "Aylık", language: "TR-EN", year: 2024, cover: "https://images.unsplash.com/photo-1532153975070-2e9ab71f1b14?w=400" },
  { id: "med-sy2", city: "Sydney", country: "Avustralya", type: "book", title: "Avustralya'ya Göç", publisher: "Mehmet Öztürk", description: "Avustralya'ya göç eden Türklerin başarı öyküleri.", year: 2025, language: "TR", cover: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400" },

  // Amsterdam
  { id: "med-am1", city: "Amsterdam", country: "Hollanda", type: "newspaper", title: "Hollanda Postası", publisher: "HP Medya", description: "Hollanda Türk toplumunun haftalık gazetesi.", frequency: "Haftalık", language: "TR-NL", year: 2023, cover: "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400" },
  { id: "med-am2", city: "Amsterdam", country: "Hollanda", type: "magazine", title: "Tulip Diaspora", publisher: "Tulip Media", description: "Hollanda'daki Türk girişimcilere yönelik aylık dergi.", frequency: "Aylık", language: "TR-EN", year: 2024, cover: "https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=400" },

  // Brüksel
  { id: "med-br1", city: "Brüksel", country: "Belçika", type: "magazine", title: "Avrupa Türk", publisher: "AB Medya", description: "AB kurumlarındaki Türk profesyonellere yönelik aylık dergi.", frequency: "Aylık", language: "TR-EN-FR", year: 2024, cover: "https://images.unsplash.com/photo-1532153975070-2e9ab71f1b14?w=400" },

  // Stockholm
  { id: "med-st1", city: "Stockholm", country: "İsveç", type: "newspaper", title: "İskandinav Postası", publisher: "İP Medya", description: "İsveç, Norveç ve Danimarka Türklerine yönelik haftalık gazete.", frequency: "Haftalık", language: "TR", year: 2024, cover: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400" },

  // Milano
  { id: "med-mi1", city: "Milano", country: "İtalya", type: "magazine", title: "Bella Türkiye", publisher: "BT Italia", description: "İtalya'daki Türk toplumu için moda ve kültür dergisi.", frequency: "Aylık", language: "TR-IT", year: 2025, cover: "https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=400" },

  // Madrid
  { id: "med-ma1", city: "Madrid", country: "İspanya", type: "newspaper", title: "Iberia Türk", publisher: "Iberia Medya", description: "İspanya ve Portekiz'deki Türklerin haftalık gazetesi.", frequency: "Haftalık", language: "TR-ES", year: 2024, cover: "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400" },
];

export function getDiasporaMedia(city?: string, country?: string): DiasporaMediaItem[] {
  return mockDiasporaMedia.filter(m => {
    const cityMatch = !city || city === "all" || m.city === city;
    const countryMatch = !country || country === "all" || m.country === country;
    return cityMatch && countryMatch;
  });
}
