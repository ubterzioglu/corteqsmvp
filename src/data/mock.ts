import fourVisionPhoto from "@/assets/4vision-youtube.png";

export interface Consultant {
  id: string;
  name: string;
  role: string;
  category: string;
  country: string;
  city: string;
  rating: number;
  reviews: number;
  avatar: string;
  photo: string;
  bio: string;
  website: string;
  whatsapp: string;
  languages: string[];
  specialties: string[];
}

export interface Association {
  id: string;
  name: string;
  type: "Dernek" | "Vakıf" | "İş Örgütü" | "Sosyal Örgüt" | "Okul" | "Radyo" | "TV Kanalı" | "Büyükelçilik" | "Konsolosluk" | "Hastane";
  country: string;
  city: string;
  members: number;
  events: number;
  description: string;
  website: string;
  founded: number;
  logo: string;
}

export interface WhatsAppGroup {
  id: string;
  name: string;
  category: "alumni" | "hobi" | "is" | "doktor";
  country: string;
  city: string;
  members: number;
  description: string;
  link: string;
  university?: string;
  /** Optional landing page id (for groups that prefer a landing page over direct link) */
  landingId?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  endTime: string;
  country: string;
  city: string;
  location: string;
  type: "online" | "yüz yüze" | "hybrid";
  category: "networking" | "eğitim" | "kültür" | "iş" | "sosyal" | "spor";
  organizer: string;
  organizerType: "consultant" | "association" | "member";
  organizerAvatar: string;
  attendees: number;
  maxAttendees: number;
  price: number;
  featured: boolean;
  image: string;
  tags: string[];
  boosted?: boolean;
  boostExpiry?: string;
}

export interface BoostPackage {
  id: string;
  name: string;
  price: number;
  features: string[];
  estimatedReach: number;
  duration: string;
}

export interface AudienceSegment {
  id: string;
  label: string;
  type: "users" | "whatsapp" | "email";
  matchScore: number;
  size: number;
  category: string;
  description: string;
}

export const boostPackage: BoostPackage = {
  id: "boost-all-in-one",
  name: "Etkinlik Boost Paketi",
  price: 49,
  features: [
    "⭐ Featured etkinliklerde 7 gün yer alma",
    "👥 AI eşleşmeli platform kullanıcılarına tanıtım",
    "💬 İlgili WhatsApp gruplarına duyuru",
    "📧 Kendi mail listenize kampanya gönderimi",
    "📊 Detaylı erişim & tıklama raporu",
  ],
  estimatedReach: 2500,
  duration: "7 gün",
};

export const getAudienceSegments = (eventCategory: string, eventCountry: string): AudienceSegment[] => {
  const segments: AudienceSegment[] = [];

  // AI-matched platform users
  const categoryUserMap: Record<string, { label: string; size: number }> = {
    networking: { label: "Networking & İş ilişkileri ilgili kullanıcılar", size: 1200 },
    eğitim: { label: "Eğitim & kişisel gelişim ilgili kullanıcılar", size: 850 },
    kültür: { label: "Kültür & sanat etkinlikleri takipçileri", size: 640 },
    iş: { label: "İş & kariyer odaklı profesyoneller", size: 1450 },
    sosyal: { label: "Sosyal etkinlik katılımcıları", size: 920 },
    spor: { label: "Spor & outdoor aktivite meraklıları", size: 580 },
  };
  const userMatch = categoryUserMap[eventCategory] || { label: "Genel platform kullanıcıları", size: 500 };
  segments.push({
    id: "users-category",
    label: userMatch.label,
    type: "users",
    matchScore: 92,
    size: userMatch.size,
    category: eventCategory,
    description: `${eventCountry} ve çevresindeki ${userMatch.label.toLowerCase()}`,
  });

  // AI-matched WhatsApp groups
  const categoryGroupMap: Record<string, string[]> = {
    networking: ["Berlin Türk Tech Network", "Londra Türk Girişimciler", "Dubai Türk Finans Grubu"],
    iş: ["Berlin Türk Tech Network", "Londra Türk Girişimciler", "Almanya Türk Sağlık Profesyonelleri"],
    eğitim: ["ODTÜ Mezunları Almanya", "Boğaziçi Mezunları Almanya", "İTÜ Mezunları Almanya"],
    kültür: ["Londra Türk Yemek Kulübü", "Dubai Türk Kitap Kulübü", "Amsterdam Fotoğrafçılık Grubu"],
    sosyal: ["Londra Türk Yemek Kulübü", "Berlin Türk Futbol Grubu", "Münih Doğa & Hiking"],
    spor: ["Berlin Türk Futbol Grubu", "Münih Doğa & Hiking"],
  };
  const matchedGroups = categoryGroupMap[eventCategory] || ["Genel Türk Topluluk Grubu"];
  segments.push({
    id: "whatsapp-groups",
    label: `${matchedGroups.length} WhatsApp grubuna duyuru`,
    type: "whatsapp",
    matchScore: 87,
    size: matchedGroups.length * 280,
    category: eventCategory,
    description: matchedGroups.join(", "),
  });

  // Email list
  segments.push({
    id: "email-list",
    label: "Kendi mail listenize kampanya",
    type: "email",
    matchScore: 95,
    size: 0,
    category: eventCategory,
    description: "Mail listenizi yükleyin veya mevcut abone listenizi kullanın",
  });

  return segments;
};

export const countries = [
  "Almanya", "İngiltere", "Hollanda", "BAE", "ABD", "Fransa", "Avusturya", "İsviçre", "Kanada", "Avustralya", "Katar",
  "İspanya", "Yunanistan", "İtalya", "İsveç", "Belçika", "Danimarka", "Portekiz",
];

export const consultants: Consultant[] = [
  { id: "ayse-kara", name: "Ayşe Kara", role: "Gayrimenkul Danışmanı", category: "Gayrimenkul", country: "İngiltere", city: "Londra", rating: 4.9, reviews: 128, avatar: "AK", photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face", bio: "10 yıllık deneyimle Londra'da Türk yatırımcılara gayrimenkul danışmanlığı sunuyorum.", website: "https://aysekara.co.uk", whatsapp: "+447700000001", languages: ["Türkçe", "İngilizce"], specialties: ["Yatırım gayrimenkul", "Alım-satım süreçleri", "Proje temsilciliği"] },
  { id: "mehmet-yilmaz", name: "Mehmet Yılmaz", role: "Vize & Göçmenlik", category: "Vize & Göçmenlik", country: "Almanya", city: "Berlin", rating: 4.8, reviews: 95, avatar: "MY", photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face", bio: "Almanya'da oturum, çalışma izni ve vatandaşlık süreçlerinde uzman danışman.", website: "https://mehmetyilmaz.de", whatsapp: "+491700000002", languages: ["Türkçe", "Almanca", "İngilizce"], specialties: ["Oturum izni", "Yatırımcı vizesi", "Golden Visa"] },
  { id: "elif-demir", name: "Elif Demir", role: "Hukuk Danışmanı", category: "Hukuk & Vergi", country: "Hollanda", city: "Amsterdam", rating: 4.9, reviews: 156, avatar: "ED", photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face", bio: "Uluslararası hukuk ve vergi danışmanlığı. 12 yıllık deneyim.", website: "https://elifdemir.nl", whatsapp: "+316000000003", languages: ["Türkçe", "Hollandaca", "İngilizce"], specialties: ["Sözleşme hukuku", "Vergi avantajları", "Mortgage çözümleri"] },
  { id: "can-ozdemir", name: "Can Özdemir", role: "Finansal Danışman", category: "Finansal", country: "BAE", city: "Dubai", rating: 4.7, reviews: 87, avatar: "CÖ", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face", bio: "Dubai merkezli finansal danışman. Yatırım ve vergi planlaması.", website: "https://canozdemir.ae", whatsapp: "+971500000004", languages: ["Türkçe", "İngilizce", "Arapça"], specialties: ["Yatırım çeşitlendirme", "Döviz planlama", "Vergi optimizasyonu"] },
  { id: "zeynep-arslan", name: "Zeynep Arslan", role: "Şirket Kuruluşu Danışmanı", category: "Şirket & İş", country: "BAE", city: "Dubai", rating: 4.8, reviews: 112, avatar: "ZA", photo: "https://images.unsplash.com/photo-1598550874175-4d0ef436c909?w=400&h=400&fit=crop&crop=face", bio: "Dubai'de free zone ve mainland şirket kuruluşu.", website: "https://zeyneparslan.ae", whatsapp: "+971500000005", languages: ["Türkçe", "İngilizce"], specialties: ["Free zone şirket", "Lisans & muhasebe", "Banka hesap açılışı"] },
  { id: "ali-celik", name: "Ali Çelik", role: "Yaşam & Relocation", category: "Yaşam & Relocation", country: "Almanya", city: "Münih", rating: 4.6, reviews: 64, avatar: "AÇ", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face", bio: "Almanya'ya taşınan aileler için kapsamlı destek.", website: "https://alicelik.de", whatsapp: "+491700000006", languages: ["Türkçe", "Almanca"], specialties: ["Ev & okul seçimi", "Sağlık sigortası", "Günlük yaşam rehberliği"] },
  { id: "selin-yildiz", name: "Selin Yıldız", role: "Gayrimenkul Danışmanı", category: "Gayrimenkul", country: "ABD", city: "New York", rating: 4.9, reviews: 203, avatar: "SY", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face", bio: "New York bölgesinde Türk yatırımcılara gayrimenkul danışmanlığı.", website: "https://selinyildiz.com", whatsapp: "+12120000007", languages: ["Türkçe", "İngilizce"], specialties: ["Yatırım gayrimenkul", "Konut alım-satım"] },
  { id: "burak-sahin", name: "Burak Şahin", role: "Hukuk Danışmanı", category: "Hukuk & Vergi", country: "Fransa", city: "Paris", rating: 4.7, reviews: 78, avatar: "BŞ", photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face", bio: "Paris'te uluslararası ticaret hukuku ve vergi planlaması.", website: "https://buraksahin.fr", whatsapp: "+33600000008", languages: ["Türkçe", "Fransızca", "İngilizce"], specialties: ["Ticaret hukuku", "Vergi yükümlülükleri", "Sözleşmeler"] },
  { id: "dr-hasan-turk", name: "Dr. Hasan Türk", role: "Doktor - Genel Pratisyen", category: "Yaşam & Relocation", country: "Almanya", city: "Frankfurt", rating: 4.9, reviews: 312, avatar: "HT", photo: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face", bio: "Frankfurt'ta Türk hastalar için genel sağlık danışmanlığı.", website: "https://drhasanturk.de", whatsapp: "+491700000009", languages: ["Türkçe", "Almanca"], specialties: ["Genel sağlık", "Sağlık sistemi rehberliği", "Check-up"] },
  { id: "dr-leyla-aydin", name: "Dr. Leyla Aydın", role: "Diş Hekimi", category: "Yaşam & Relocation", country: "İngiltere", city: "Londra", rating: 4.8, reviews: 189, avatar: "LA", photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face", bio: "Londra'da Türkçe hizmet veren diş hekimi.", website: "https://drleylaaydin.co.uk", whatsapp: "+447700000010", languages: ["Türkçe", "İngilizce"], specialties: ["İmplant", "Estetik diş", "Genel diş sağlığı"] },
  { id: "dr-kemal-oz", name: "Dr. Kemal Öz", role: "Doktor - Dahiliye", category: "Yaşam & Relocation", country: "Hollanda", city: "Rotterdam", rating: 4.7, reviews: 145, avatar: "KÖ", photo: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&h=400&fit=crop&crop=face", bio: "Hollanda'da iç hastalıkları uzmanı.", website: "https://drkemaloz.nl", whatsapp: "+316000000011", languages: ["Türkçe", "Hollandaca", "İngilizce"], specialties: ["Dahiliye", "İkinci görüş", "Kronik hastalık yönetimi"] },
  { id: "fatma-vize", name: "Fatma Güneş", role: "Vize & Göçmenlik Danışmanı", category: "Vize & Göçmenlik", country: "İngiltere", city: "Londra", rating: 4.8, reviews: 176, avatar: "FG", photo: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=400&h=400&fit=crop&crop=face", bio: "İngiltere vize ve oturum izni süreçlerinde 8 yıllık deneyim.", website: "https://fatmagunes.co.uk", whatsapp: "+447700000012", languages: ["Türkçe", "İngilizce"], specialties: ["Çalışma vizesi", "Aile birleşimi", "İltica süreçleri"] },
  { id: "osman-vize", name: "Osman Kılıç", role: "Vize & Göçmenlik Danışmanı", category: "Vize & Göçmenlik", country: "Kanada", city: "Toronto", rating: 4.9, reviews: 203, avatar: "OK", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face", bio: "Kanada göçmenlik ve vatandaşlık süreçlerinde uzman.", website: "https://osmankilic.ca", whatsapp: "+14160000013", languages: ["Türkçe", "İngilizce"], specialties: ["Express Entry", "PNP programları", "Yatırımcı göçmenliği"] },
  { id: "derya-emlak", name: "Derya Aksoy", role: "Gayrimenkul Danışmanı", category: "Gayrimenkul", country: "BAE", city: "Dubai", rating: 4.8, reviews: 167, avatar: "DA", photo: "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&h=400&fit=crop&crop=face", bio: "Dubai'de lüks konut ve ticari gayrimenkul yatırım danışmanlığı.", website: "https://deryaaksoy.ae", whatsapp: "+971500000014", languages: ["Türkçe", "İngilizce", "Arapça"], specialties: ["Lüks konut", "Off-plan projeler", "Kira yönetimi"] },
  { id: "hakan-emlak", name: "Hakan Yıldırım", role: "Gayrimenkul Danışmanı", category: "Gayrimenkul", country: "Almanya", city: "Münih", rating: 4.6, reviews: 98, avatar: "HY", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face", bio: "Münih'te Türk yatırımcılar için gayrimenkul danışmanlığı.", website: "https://hakanyildirim.de", whatsapp: "+491700000015", languages: ["Türkçe", "Almanca"], specialties: ["Konut yatırımı", "Ticari gayrimenkul", "Finansman danışmanlığı"] },
  { id: "nur-sirket", name: "Nur Başaran", role: "Şirket Kuruluşu Danışmanı", category: "Şirket & İş", country: "İngiltere", city: "Londra", rating: 4.7, reviews: 134, avatar: "NB", photo: "https://images.unsplash.com/photo-1588516903720-8ceb67f9ef84?w=400&h=400&fit=crop&crop=face", bio: "İngiltere'de Ltd şirket kuruluşu ve start-up danışmanlığı.", website: "https://nurbasaran.co.uk", whatsapp: "+447700000016", languages: ["Türkçe", "İngilizce"], specialties: ["Ltd şirket kuruluşu", "Muhasebe", "Start-up danışmanlığı"] },
  { id: "murat-sirket", name: "Murat Erdem", role: "Şirket Kuruluşu Danışmanı", category: "Şirket & İş", country: "Hollanda", city: "Amsterdam", rating: 4.8, reviews: 121, avatar: "ME", photo: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop&crop=face", bio: "Hollanda'da BV kuruluşu ve vergi optimizasyonu.", website: "https://muraterdem.nl", whatsapp: "+316000000017", languages: ["Türkçe", "Hollandaca", "İngilizce"], specialties: ["BV kuruluşu", "KVK kaydı", "Vergi optimizasyonu"] },
  { id: "tugce-tasima", name: "Tuğçe Demir", role: "Eşya Taşıma & Lojistik", category: "Yaşam & Relocation", country: "Almanya", city: "Berlin", rating: 4.7, reviews: 89, avatar: "TD", photo: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&h=400&fit=crop&crop=face", bio: "Türkiye-Almanya arası eşya taşıma ve gümrükleme.", website: "https://tugcedemir.de", whatsapp: "+491700000018", languages: ["Türkçe", "Almanca"], specialties: ["Uluslararası nakliyat", "Gümrükleme", "Evden eve taşıma"] },
  { id: "serkan-tasima", name: "Serkan Acar", role: "Eşya Taşıma & Lojistik", category: "Yaşam & Relocation", country: "İngiltere", city: "Londra", rating: 4.6, reviews: 72, avatar: "SA", photo: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400&h=400&fit=crop&crop=face", bio: "Türkiye-İngiltere eşya taşıma ve kargo hizmetleri.", website: "https://serkanacar.co.uk", whatsapp: "+447700000019", languages: ["Türkçe", "İngilizce"], specialties: ["Kargo hizmetleri", "Acil gönderim", "Depolama"] },
  { id: "baris-tasima", name: "Barış Koç", role: "Eşya Taşıma & Lojistik", category: "Yaşam & Relocation", country: "BAE", city: "Dubai", rating: 4.8, reviews: 105, avatar: "BK", photo: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop&crop=face", bio: "Dubai-Türkiye arası taşımacılık ve lojistik.", website: "https://bariskoc.ae", whatsapp: "+971500000020", languages: ["Türkçe", "İngilizce", "Arapça"], specialties: ["Free zone depolama", "Lojistik çözümleri", "Uluslararası taşıma"] },
  { id: "ece-ik", name: "Ece Yalçın", role: "İK Profesyoneli & Kariyer Danışmanı", category: "Şirket & İş", country: "Almanya", city: "Berlin", rating: 4.9, reviews: 156, avatar: "EY", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face", bio: "Berlin'de Türk profesyonellere kariyer ve işe alım danışmanlığı.", website: "https://eceyalcin.de", whatsapp: "+491700000021", languages: ["Türkçe", "Almanca", "İngilizce"], specialties: ["İnsan kaynakları", "İşe alım", "CV & mülakat koçluğu", "Kariyer planlama"] },
  { id: "deniz-ik", name: "Deniz Polat", role: "İK & Headhunter", category: "Şirket & İş", country: "İngiltere", city: "Londra", rating: 4.8, reviews: 132, avatar: "DP", photo: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop&crop=face", bio: "Londra'da tech ve finans sektörü için Türk yeteneklere headhunter hizmeti.", website: "https://denizpolat.co.uk", whatsapp: "+447700000022", languages: ["Türkçe", "İngilizce"], specialties: ["Headhunter", "İnsan kaynakları", "Tech recruitment", "İşe alım"] },
  { id: "sevgi-sigorta", name: "Sevgi Aydın", role: "Sağlık Sigortası Uzmanı", category: "Yaşam & Relocation", country: "Hollanda", city: "Amsterdam", rating: 4.7, reviews: 98, avatar: "SA", photo: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face", bio: "Hollanda'da özel ve devlet sağlık sigortası karşılaştırma ve aracılık.", website: "https://sevgiaydin.nl", whatsapp: "+316000000023", languages: ["Türkçe", "Hollandaca", "İngilizce"], specialties: ["Sağlık sigortası", "Aile sigortası", "Insurance broker"] },
  { id: "okan-egitim", name: "Okan Tezcan", role: "Eğitim & Okul Danışmanı", category: "Yaşam & Relocation", country: "İngiltere", city: "Londra", rating: 4.9, reviews: 144, avatar: "OT", photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face", bio: "Londra'da Türk aileler için okul seçimi ve üniversite başvuru danışmanlığı.", website: "https://okantezcan.co.uk", whatsapp: "+447700000024", languages: ["Türkçe", "İngilizce"], specialties: ["Okul seçimi", "Üniversite başvurusu", "Öğrenci vizesi", "Eğitim planlaması"] },
  { id: "tolga-mortgage", name: "Tolga Şener", role: "Mortgage & Finansman Uzmanı", category: "Finansal", country: "İngiltere", city: "Londra", rating: 4.8, reviews: 117, avatar: "TŞ", photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face", bio: "İngiltere'de Türk yatırımcılara mortgage ve konut kredisi çözümleri.", website: "https://tolgasener.co.uk", whatsapp: "+447700000025", languages: ["Türkçe", "İngilizce"], specialties: ["Mortgage", "Konut kredisi", "Finansman danışmanlığı", "Buy-to-let"] },
];

export const associations: Association[] = [
  // Dernekler & Vakıflar
  { id: "almanya-turk-toplumu", name: "Almanya Türk Toplumu", type: "Dernek", country: "Almanya", city: "Berlin", members: 12500, events: 45, description: "Almanya genelinde Türk toplulukları arasında köprü kurma, kültürel etkinlikler ve sosyal destek programları düzenleyen köklü dernek.", website: "https://att.de", founded: 1995, logo: "ATT" },
  { id: "ingiltere-turk-isadamlari", name: "İngiltere Türk İşadamları Derneği", type: "İş Örgütü", country: "İngiltere", city: "Londra", members: 3200, events: 28, description: "Londra merkezli Türk iş insanlarının networking, iş geliştirme ve yatırım fırsatları platformu.", website: "https://itid.co.uk", founded: 2005, logo: "İTİ" },
  { id: "hollanda-turk-vakfi", name: "Hollanda Türk Vakfı", type: "Vakıf", country: "Hollanda", city: "Amsterdam", members: 8700, events: 32, description: "Hollanda'daki Türk topluluğuna eğitim, kültür ve entegrasyon desteği sağlayan vakıf.", website: "https://htv.nl", founded: 1998, logo: "HTV" },
  { id: "bae-turk-dernegi", name: "Dubai Türk İş İnsanları Konseyi", type: "İş Örgütü", country: "BAE", city: "Dubai", members: 5400, events: 38, description: "Dubai ve Abu Dhabi'de yaşayan Türk iş insanlarını bir araya getiren konsey.", website: "https://baeturkler.ae", founded: 2010, logo: "DTK" },
  { id: "abd-turk-amerikan", name: "Türk Amerikan Dernekleri Federasyonu", type: "Dernek", country: "ABD", city: "Washington", members: 25000, events: 60, description: "ABD genelindeki Türk derneklerini çatı altında toplayan federasyon.", website: "https://tadf.org", founded: 1988, logo: "TAD" },
  { id: "fransa-turk-kulturu", name: "Fransa Türk Kültür Merkezi", type: "Vakıf", country: "Fransa", city: "Paris", members: 6100, events: 25, description: "Paris'te Türk kültürünü tanıtma ve kültürel köprü kurma misyonuyla çalışan merkez.", website: "https://ftkm.fr", founded: 2002, logo: "FTK" },
  // Türk Okulları
  { id: "berlin-turk-okulu", name: "Berlin Türk Okulu", type: "Okul", country: "Almanya", city: "Berlin", members: 850, events: 12, description: "Hafta sonu Türkçe dil ve kültür eğitimi veren okul. Çocuklar ve yetişkinler için kurslar.", website: "https://berlinturkokulu.de", founded: 2001, logo: "BTO" },
  { id: "londra-turk-egitim", name: "Londra Türk Eğitim Merkezi", type: "Okul", country: "İngiltere", city: "Londra", members: 1200, events: 18, description: "Londra'da Türkçe dil eğitimi, GCSE Türkçe hazırlık ve kültürel etkinlikler.", website: "https://lteg.co.uk", founded: 1998, logo: "LTE" },
  { id: "amsterdam-turk-okulu", name: "Amsterdam Türk Kültür Okulu", type: "Okul", country: "Hollanda", city: "Amsterdam", members: 620, events: 10, description: "Hollanda'da yaşayan Türk çocuklara Türkçe ve kültür eğitimi.", website: "https://atkokulu.nl", founded: 2005, logo: "ATK" },
  { id: "paris-turk-okulu", name: "Paris Türk Lisesi", type: "Okul", country: "Fransa", city: "Paris", members: 480, events: 8, description: "Paris'te MEB müfredatına uygun Türkçe eğitim veren lise.", website: "https://paristurklisesi.fr", founded: 2010, logo: "PTL" },
  { id: "dubai-turk-okulu", name: "Dubai Türk Okulu", type: "Okul", country: "BAE", city: "Dubai", members: 950, events: 15, description: "Dubai'de tam gün Türkçe eğitim veren uluslararası okul.", website: "https://dubaiturk.ae", founded: 2012, logo: "DTO" },
  // Türk Radyoları
  { id: "radyo-metropol-berlin", name: "Radyo Metropol FM", type: "Radyo", country: "Almanya", city: "Berlin", members: 45000, events: 6, description: "Almanya'nın en büyük Türkçe radyo istasyonu. Müzik, haberler ve söyleşiler.", website: "https://metropolfm.de", founded: 1999, logo: "MFM" },
  { id: "radyo-bizim-londra", name: "Bizim Radyo", type: "Radyo", country: "İngiltere", city: "Londra", members: 28000, events: 4, description: "Londra merkezli Türkçe radyo. Topluluk haberleri, müzik ve kültürel programlar.", website: "https://bizimradyo.co.uk", founded: 2006, logo: "BRM" },
  { id: "radyo-turku-hollanda", name: "Radyo Türkü", type: "Radyo", country: "Hollanda", city: "Amsterdam", members: 18000, events: 3, description: "Hollanda genelinde yayın yapan Türkçe radyo istasyonu.", website: "https://radyoturku.nl", founded: 2003, logo: "RTK" },
  // Türk TV Kanalları
  { id: "kanal-avrupa", name: "Kanal Avrupa", type: "TV Kanalı", country: "Almanya", city: "Frankfurt", members: 120000, events: 10, description: "Avrupa'daki Türk topluluğuna yönelik haber, kültür ve eğlence kanalı.", website: "https://kanalavrupa.de", founded: 2000, logo: "KAV" },
  { id: "turk-tv-uk", name: "Turkish TV UK", type: "TV Kanalı", country: "İngiltere", city: "Londra", members: 65000, events: 5, description: "İngiltere'deki Türk topluluğu için İngilizce ve Türkçe yayın yapan kanal.", website: "https://turkishtv.co.uk", founded: 2008, logo: "TTV" },
  { id: "eurostar-tv", name: "Euro Star TV", type: "TV Kanalı", country: "Hollanda", city: "Rotterdam", members: 85000, events: 7, description: "Benelüx bölgesindeki Türk topluluğuna yönelik televizyon kanalı.", website: "https://eurostartv.nl", founded: 2004, logo: "EST" },
  // Sağlık Kuruluşları (Hastaneler)
  { id: "turkish-hospital-berlin", name: "Türk-Alman Sağlık Merkezi", type: "Hastane", country: "Almanya", city: "Berlin", members: 0, events: 5, description: "Berlin'de Türk ve Alman doktorların birlikte hizmet verdiği tam donanımlı sağlık merkezi. Türkçe konuşan personel.", website: "https://turkischgesundheit.de", founded: 2015, logo: "TAS" },
  { id: "turkish-clinic-london", name: "Anatolia Health Clinic", type: "Hastane", country: "İngiltere", city: "Londra", members: 0, events: 3, description: "Londra'da Türk doktorlar tarafından kurulan özel klinik. Genel sağlık, diş ve göz hizmetleri.", website: "https://anatoliahealth.co.uk", founded: 2018, logo: "AHC" },
  { id: "turkish-hospital-doha", name: "Turkish Hospital Qatar", type: "Hastane", country: "Katar", city: "Doha", members: 0, events: 8, description: "Doha'da Türk doktorlar ve sağlık profesyonelleri tarafından kurulan tam donanımlı hastane.", website: "https://turkishhospital.qa", founded: 2019, logo: "THQ" },
  { id: "turkish-medical-dubai", name: "Turkish Medical Center Dubai", type: "Hastane", country: "BAE", city: "Dubai", members: 0, events: 4, description: "Dubai'de Türk sağlık profesyonelleri tarafından işletilen tıp merkezi.", website: "https://turkishmedical.ae", founded: 2020, logo: "TMD" },
  // Büyükelçilikler & Konsolosluklar
  { id: "tc-berlin-buyukelcilik", name: "T.C. Berlin Büyükelçiliği", type: "Büyükelçilik", country: "Almanya", city: "Berlin", members: 0, events: 12, description: "Türkiye Cumhuriyeti Berlin Büyükelçiliği. Konsolosluk hizmetleri, vize işlemleri, noter tasdiki ve vatandaşlık işlemleri.", website: "https://berlin.be.mfa.gov.tr", founded: 1952, logo: "🇹🇷" },
  { id: "tc-londra-baskonsolosluk", name: "T.C. Londra Başkonsolosluğu", type: "Konsolosluk", country: "İngiltere", city: "Londra", members: 0, events: 8, description: "Türkiye Cumhuriyeti Londra Başkonsolosluğu. Pasaport, nüfus, askerlik, noter ve vize hizmetleri.", website: "https://londra.bk.mfa.gov.tr", founded: 1949, logo: "🇹🇷" },
  { id: "tc-washington-buyukelcilik", name: "T.C. Washington Büyükelçiliği", type: "Büyükelçilik", country: "ABD", city: "Washington", members: 0, events: 10, description: "Türkiye Cumhuriyeti Washington Büyükelçiliği. Diplomatik ilişkiler ve vatandaş hizmetleri.", website: "https://washington.emb.mfa.gov.tr", founded: 1948, logo: "🇹🇷" },
  { id: "tc-dubai-baskonsolosluk", name: "T.C. Dubai Başkonsolosluğu", type: "Konsolosluk", country: "BAE", city: "Dubai", members: 0, events: 6, description: "Türkiye Cumhuriyeti Dubai Başkonsolosluğu. Konsolosluk hizmetleri ve ticaret ofisi.", website: "https://dubai.bk.mfa.gov.tr", founded: 2006, logo: "🇹🇷" },
];

export const whatsappGroups: WhatsAppGroup[] = [
  // Alumni
  { id: "odtu-almanya", name: "ODTÜ Mezunları Almanya", category: "alumni", country: "Almanya", city: "Berlin", members: 420, description: "ODTÜ mezunlarının Almanya'daki buluşma ve networking grubu", link: "https://chat.whatsapp.com/odtu-almanya", university: "ODTÜ", landingId: "odtu-almanya" },
  { id: "odtu-ingiltere", name: "ODTÜ Mezunları İngiltere", category: "alumni", country: "İngiltere", city: "Londra", members: 310, description: "ODTÜ mezunlarının İngiltere networking grubu", link: "https://chat.whatsapp.com/odtu-uk", university: "ODTÜ" },
  { id: "bogazici-almanya", name: "Boğaziçi Mezunları Almanya", category: "alumni", country: "Almanya", city: "Münih", members: 385, description: "Boğaziçi Üniversitesi mezunlarının Almanya'daki grubu", link: "https://chat.whatsapp.com/bogazici-de", university: "Boğaziçi" },
  { id: "bogazici-bae", name: "Boğaziçi Mezunları Dubai", category: "alumni", country: "BAE", city: "Dubai", members: 275, description: "Boğaziçi mezunlarının Dubai networking grubu", link: "https://chat.whatsapp.com/bogazici-dubai", university: "Boğaziçi" },
  { id: "itu-almanya", name: "İTÜ Mezunları Almanya", category: "alumni", country: "Almanya", city: "Frankfurt", members: 290, description: "İstanbul Teknik Üniversitesi mezunlarının Almanya grubu", link: "https://chat.whatsapp.com/itu-de", university: "İTÜ" },
  { id: "itu-ingiltere", name: "İTÜ Mezunları İngiltere", category: "alumni", country: "İngiltere", city: "Londra", members: 210, description: "İTÜ mezunlarının İngiltere networking grubu", link: "https://chat.whatsapp.com/itu-uk", university: "İTÜ" },
  { id: "yildiz-almanya", name: "Yıldız Teknik Mezunları Almanya", category: "alumni", country: "Almanya", city: "Berlin", members: 180, description: "Yıldız Teknik Üniversitesi mezunları Almanya grubu", link: "https://chat.whatsapp.com/ytu-de", university: "Yıldız Teknik" },
  { id: "hacettepe-hollanda", name: "Hacettepe Mezunları Hollanda", category: "alumni", country: "Hollanda", city: "Amsterdam", members: 155, description: "Hacettepe Üniversitesi mezunları Hollanda grubu", link: "https://chat.whatsapp.com/hacettepe-nl", university: "Hacettepe" },
  { id: "bilkent-bae", name: "Bilkent Mezunları BAE", category: "alumni", country: "BAE", city: "Dubai", members: 195, description: "Bilkent Üniversitesi mezunlarının BAE grubu", link: "https://chat.whatsapp.com/bilkent-uae", university: "Bilkent" },
  { id: "koc-ingiltere", name: "Koç Üniversitesi Mezunları Londra", category: "alumni", country: "İngiltere", city: "Londra", members: 230, description: "Koç Üniversitesi mezunları İngiltere grubu", link: "https://chat.whatsapp.com/koc-uk", university: "Koç Üniversitesi" },
  // Hobi
  { id: "futbol-berlin", name: "Berlin Türk Futbol Grubu", category: "hobi", country: "Almanya", city: "Berlin", members: 340, description: "Berlin'deki Türk futbol severler için haftalık maç organizasyonu", link: "https://chat.whatsapp.com/futbol-berlin" },
  { id: "yemek-londra", name: "Londra Türk Yemek Kulübü", category: "hobi", country: "İngiltere", city: "Londra", members: 520, description: "Londra'da Türk mutfağı severler, yemek tarifleri ve restoran önerileri", link: "https://chat.whatsapp.com/yemek-london" },
  { id: "outdoor-munchen", name: "Münih Doğa & Hiking", category: "hobi", country: "Almanya", city: "Münih", members: 215, description: "Münih çevresinde doğa yürüyüşleri ve outdoor aktiviteler", link: "https://chat.whatsapp.com/hiking-munich" },
  { id: "kitap-dubai", name: "Dubai Türk Kitap Kulübü", category: "hobi", country: "BAE", city: "Dubai", members: 180, description: "Dubai'deki Türk kitapseverler için aylık okuma ve tartışma grubu", link: "https://chat.whatsapp.com/kitap-dubai", landingId: "kitap-dubai" },
  { id: "fotograf-amsterdam", name: "Amsterdam Fotoğrafçılık Grubu", category: "hobi", country: "Hollanda", city: "Amsterdam", members: 145, description: "Amsterdam'da fotoğraf turları ve workshop'lar", link: "https://chat.whatsapp.com/foto-amsterdam" },
  // İş
  { id: "tech-berlin", name: "Berlin Türk Tech Network", category: "is", country: "Almanya", city: "Berlin", members: 680, description: "Berlin'deki Türk yazılımcı ve teknoloji profesyonelleri networking grubu", link: "https://chat.whatsapp.com/tech-berlin" },
  { id: "girisimci-londra", name: "Londra Türk Girişimciler", category: "is", country: "İngiltere", city: "Londra", members: 445, description: "Londra'daki Türk girişimciler için mentor ve yatırım ağı", link: "https://chat.whatsapp.com/girisimci-london" },
  { id: "finans-dubai", name: "Dubai Türk Finans Grubu", category: "is", country: "BAE", city: "Dubai", members: 310, description: "Dubai'deki Türk finans profesyonelleri networking grubu", link: "https://chat.whatsapp.com/finans-dubai" },
  { id: "saglik-almanya", name: "Almanya Türk Sağlık Profesyonelleri", category: "is", country: "Almanya", city: "Frankfurt", members: 290, description: "Almanya'daki Türk doktor, hemşire ve sağlık çalışanları", link: "https://chat.whatsapp.com/saglik-de" },
  { id: "hukuk-hollanda", name: "Hollanda Türk Hukukçular", category: "is", country: "Hollanda", city: "Amsterdam", members: 165, description: "Hollanda'daki Türk avukat ve hukuk profesyonelleri", link: "https://chat.whatsapp.com/hukuk-nl" },
  // Doktorlar
  { id: "doktor-londra", name: "Londra Türk Doktorlar Networking", category: "doktor", country: "İngiltere", city: "Londra", members: 245, description: "Londra'da pratik yapan Türk doktorların vaka tartışması ve referans grubu", link: "https://chat.whatsapp.com/doktor-london", landingId: "doktor-londra" },
  { id: "doktor-berlin", name: "Berlin Türk Doktorlar", category: "doktor", country: "Almanya", city: "Berlin", members: 198, description: "Berlin'deki Türk hekimler için mesleki dayanışma grubu", link: "https://chat.whatsapp.com/doktor-berlin" },
];

export interface Business {
  id: string;
  name: string;
  sector: string;
  country: string;
  city: string;
  description: string;
  website: string;
  logo: string;
  founded: number;
  employees: number;
  offerings: ("iş ilanı" | "franchise" | "iş fırsatı")[];
  openPositions: number;
  contactEmail: string;
}

export const businesses: Business[] = [
  { id: "turkish-hospital-qatar", name: "Turkish Hospital Qatar", sector: "Sağlık", country: "Katar", city: "Doha", description: "Doha'da Türk doktorlar ve sağlık profesyonelleri tarafından kurulan tam donanımlı hastane. Uzman kadrosuyla bölgedeki Türk diasporasına ve yerel halka hizmet veriyor.", website: "https://turkishhospital.qa", logo: "THQ", founded: 2019, employees: 450, offerings: ["iş ilanı", "iş fırsatı"], openPositions: 25, contactEmail: "info@corteqs.net" },
  { id: "turkisch-doner-berlin", name: "Turkish Döner GmbH", sector: "Gastronomi", country: "Almanya", city: "Berlin", description: "Almanya genelinde 25 şubesiyle Türk döner ve fast-food zinciri. Franchise fırsatları sunuyoruz.", website: "https://turkishdoner.de", logo: "TDG", founded: 2008, employees: 320, offerings: ["franchise", "iş ilanı"], openPositions: 8, contactEmail: "info@corteqs.net" },
  { id: "anatolian-tech", name: "Anatolian Tech Solutions", sector: "Teknoloji", country: "İngiltere", city: "Londra", description: "Yazılım geliştirme ve dijital dönüşüm hizmetleri sunan Türk teknoloji firması.", website: "https://anatoliantech.co.uk", logo: "ATS", founded: 2015, employees: 85, offerings: ["iş ilanı", "iş fırsatı"], openPositions: 12, contactEmail: "info@corteqs.net" },
  { id: "istanbul-baklava", name: "İstanbul Baklava House", sector: "Gastronomi", country: "Hollanda", city: "Amsterdam", description: "Geleneksel Türk tatlıları ve baklava üretimi. Avrupa genelinde franchise veriyor.", website: "https://istanbulbaklava.nl", logo: "IBH", founded: 2012, employees: 45, offerings: ["franchise", "iş ilanı"], openPositions: 3, contactEmail: "info@corteqs.net" },
  { id: "bosphorus-logistics", name: "Bosphorus Logistics", sector: "Lojistik", country: "Almanya", city: "Frankfurt", description: "Türkiye-Avrupa arası kargo ve lojistik çözümleri. Depo ve dağıtım ağı.", website: "https://bosphoruslog.de", logo: "BPL", founded: 2010, employees: 150, offerings: ["iş ilanı", "iş fırsatı"], openPositions: 6, contactEmail: "info@corteqs.net" },
  { id: "turkish-market-dubai", name: "Turkish Market UAE", sector: "Perakende", country: "BAE", city: "Dubai", description: "Dubai'de Türk gıda ürünleri ve market zinciri. Yeni şube açılışları için yatırımcı arıyor.", website: "https://turkishmarket.ae", logo: "TMU", founded: 2016, employees: 60, offerings: ["franchise", "iş fırsatı", "iş ilanı"], openPositions: 15, contactEmail: "info@corteqs.net" },
  { id: "ottoman-construction", name: "Ottoman Construction Ltd", sector: "İnşaat", country: "İngiltere", city: "Londra", description: "Konut ve ticari inşaat projeleri. Londra ve çevresinde aktif.", website: "https://ottomanconstruction.co.uk", logo: "OCL", founded: 2006, employees: 200, offerings: ["iş ilanı", "iş fırsatı"], openPositions: 10, contactEmail: "info@corteqs.net" },
  { id: "cappadocia-travel", name: "Cappadocia Travel Group", sector: "Turizm", country: "Almanya", city: "Münih", description: "Türkiye turları ve seyahat organizasyonu. Acentelik fırsatları mevcut.", website: "https://cappadociatravel.de", logo: "CTG", founded: 2011, employees: 35, offerings: ["franchise", "iş ilanı"], openPositions: 4, contactEmail: "info@corteqs.net" },
  { id: "marmara-textil", name: "Marmara Textil AG", sector: "Tekstil", country: "Almanya", city: "Berlin", description: "Türk tekstil ürünlerinin Avrupa distribütörü. Toptan ve perakende.", website: "https://marmaratextil.de", logo: "MTA", founded: 2003, employees: 95, offerings: ["iş ilanı", "iş fırsatı"], openPositions: 5, contactEmail: "info@corteqs.net" },
  { id: "sultans-cafe-paris", name: "Sultan's Café Paris", sector: "Gastronomi", country: "Fransa", city: "Paris", description: "Paris'te Türk kahvesi ve brunch konseptli kafe zinciri.", website: "https://sultanscafe.fr", logo: "SCP", founded: 2018, employees: 28, offerings: ["franchise", "iş ilanı"], openPositions: 6, contactEmail: "info@corteqs.net" },
  // Loyalty partnerleri
  { id: "hsbc-turkey", name: "HSBC Türkiye", sector: "Finans", country: "İngiltere", city: "Londra", description: "HSBC diaspora bankacılık hizmetleri. Türk müşterilere özel döviz ve yatırım çözümleri.", website: "https://hsbc.com.tr", logo: "HSBC", founded: 1990, employees: 5000, offerings: ["iş ilanı", "iş fırsatı"], openPositions: 15, contactEmail: "info@corteqs.net" },
  { id: "thy-global", name: "Türk Hava Yolları", sector: "Havacılık", country: "Almanya", city: "Frankfurt", description: "THY diaspora özel uçuş kampanyaları ve mil kazanma fırsatları.", website: "https://turkishairlines.com", logo: "THY", founded: 1933, employees: 35000, offerings: ["iş ilanı", "iş fırsatı"], openPositions: 50, contactEmail: "info@corteqs.net" },
  { id: "vodafone-de", name: "Vodafone Türk Hattı", sector: "Telekomünikasyon", country: "Almanya", city: "Berlin", description: "Vodafone Almanya diaspora özel hat ve roaming paketleri.", website: "https://vodafone.de", logo: "VDF", founded: 1992, employees: 12000, offerings: ["iş ilanı"], openPositions: 8, contactEmail: "info@corteqs.net" },
  { id: "turkish-market-chain", name: "Turkish Market Europe", sector: "Perakende", country: "Almanya", city: "Berlin", description: "Avrupa genelinde 120+ şube ile Türk gıda ürünleri market zinciri.", website: "https://turkishmarket.eu", logo: "TME", founded: 2005, employees: 2500, offerings: ["franchise", "iş ilanı"], openPositions: 35, contactEmail: "info@corteqs.net" },
];

export const events: Event[] = [
  // Featured
  { id: "yatirim-webinari", title: "Avrupa'da Gayrimenkul Yatırım Fırsatları 2026", description: "Londra, Berlin ve Dubai'deki yatırım fırsatlarını uzman danışmanlarla değerlendirin. Piyasa analizi, vergi avantajları ve finansman seçenekleri detaylı anlatılacak.", date: "15 Mar 2026", time: "20:00", endTime: "22:00", country: "Almanya", city: "Online", location: "Zoom", type: "online", category: "iş", organizer: "Ayşe Kara", organizerType: "consultant", organizerAvatar: "AK", attendees: 245, maxAttendees: 500, price: 0, featured: true, image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=400&fit=crop", tags: ["Gayrimenkul", "Yatırım", "Webinar"] },
  { id: "diaspora-summit", title: "Türk Diaspora Zirvesi 2026", description: "Avrupa, Amerika ve Ortadoğu'dan Türk iş insanları, profesyoneller ve girişimcilerin buluştuğu yılın en büyük networking etkinliği.", date: "22 Nis 2026", time: "09:00", endTime: "18:00", country: "Almanya", city: "Berlin", location: "Berlin Congress Center", type: "yüz yüze", category: "networking", organizer: "Almanya Türk Toplumu", organizerType: "association", organizerAvatar: "ATT", attendees: 820, maxAttendees: 1200, price: 75, featured: true, image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop", tags: ["Zirve", "Networking", "Diaspora"] },
  { id: "tech-meetup-london", title: "London Turkish Tech Meetup", description: "Londra'daki Türk yazılımcı ve teknoloji profesyonellerinin aylık buluşması. Bu ay konumuz: AI ve Startup Ekosistemi.", date: "08 Mar 2026", time: "18:30", endTime: "21:00", country: "İngiltere", city: "Londra", location: "WeWork Moorgate", type: "yüz yüze", category: "iş", organizer: "İngiltere Türk İşadamları Derneği", organizerType: "association", organizerAvatar: "İTİ", attendees: 85, maxAttendees: 120, price: 10, featured: true, image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop", tags: ["Tech", "Meetup", "AI"] },
  // Regular
  { id: "vize-bilgilendirme", title: "Almanya Vize & Oturum İzni Bilgilendirme", description: "Almanya'da oturum izni, çalışma vizesi ve vatandaşlık süreçleri hakkında kapsamlı bilgilendirme.", date: "12 Mar 2026", time: "19:00", endTime: "20:30", country: "Almanya", city: "Online", location: "Google Meet", type: "online", category: "eğitim", organizer: "Mehmet Yılmaz", organizerType: "consultant", organizerAvatar: "MY", attendees: 156, maxAttendees: 300, price: 0, featured: false, image: "https://images.unsplash.com/photo-1569025743873-ea3a9ber4f83?w=800&h=400&fit=crop", tags: ["Vize", "Oturum", "Almanya"] },
  { id: "networking-yemegi", title: "İstanbul Lezzetleri - Networking Akşam Yemeği", description: "Berlin'deki Türk profesyoneller için lezzetli bir akşam yemeği eşliğinde networking fırsatı.", date: "18 Mar 2026", time: "19:30", endTime: "23:00", country: "Almanya", city: "Berlin", location: "Hasir Restaurant, Kreuzberg", type: "yüz yüze", category: "sosyal", organizer: "Almanya Türk Toplumu", organizerType: "association", organizerAvatar: "ATT", attendees: 42, maxAttendees: 60, price: 45, featured: false, image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop", tags: ["Networking", "Yemek", "Sosyal"] },
  { id: "futbol-turnuvasi", title: "Türk Diaspora Futbol Turnuvası", description: "Berlin'deki Türk futbol takımları arasında dostluk turnuvası. Kayıt için takım kaptanları başvurabilir.", date: "05 Nis 2026", time: "10:00", endTime: "17:00", country: "Almanya", city: "Berlin", location: "Sportpark Neukölln", type: "yüz yüze", category: "spor", organizer: "Emre Aydın", organizerType: "member", organizerAvatar: "EA", attendees: 120, maxAttendees: 200, price: 15, featured: false, image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=400&fit=crop", tags: ["Futbol", "Turnuva", "Spor"] },
  { id: "turk-filmleri", title: "Türk Film Gecesi - Kış Uykusu", description: "Aylık Türk film gösterimi. Bu ay Nuri Bilge Ceylan'ın ödüllü filmi Kış Uykusu.", date: "25 Mar 2026", time: "20:00", endTime: "23:00", country: "Hollanda", city: "Amsterdam", location: "Het Ketelhuis Cinema", type: "yüz yüze", category: "kültür", organizer: "Hollanda Türk Vakfı", organizerType: "association", organizerAvatar: "HTV", attendees: 65, maxAttendees: 100, price: 12, featured: false, image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=400&fit=crop", tags: ["Film", "Kültür", "Sinema"] },
  { id: "sirket-kurma-workshop", title: "Dubai'de Şirket Kurma Workshop", description: "Free zone vs mainland, lisans türleri, maliyetler ve banka hesap açma süreçleri hakkında uygulamalı workshop.", date: "02 Nis 2026", time: "14:00", endTime: "17:00", country: "BAE", city: "Dubai", location: "DTSO Merkez, JLT", type: "hybrid", category: "eğitim", organizer: "Zeynep Arslan", organizerType: "consultant", organizerAvatar: "ZA", attendees: 78, maxAttendees: 150, price: 25, featured: false, image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=400&fit=crop", tags: ["Şirket", "Dubai", "Workshop"] },
  { id: "cocuk-bayrami", title: "23 Nisan Çocuk Bayramı Kutlaması", description: "Çocuklar için oyunlar, yarışmalar, kültürel gösteriler ve geleneksel Türk yemekleri ile bayram kutlaması.", date: "23 Nis 2026", time: "11:00", endTime: "16:00", country: "İngiltere", city: "Londra", location: "Finsbury Park", type: "yüz yüze", category: "kültür", organizer: "Londra Türk Eğitim Merkezi", organizerType: "association", organizerAvatar: "LTE", attendees: 350, maxAttendees: 500, price: 0, featured: true, image: "https://images.unsplash.com/photo-1602631985686-1bb0e6a8696e?w=800&h=400&fit=crop", tags: ["23 Nisan", "Çocuk", "Bayram"] },
];

// ============= BLOGGERS & VLOGGERS =============

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  tags: string[];
  country: string;
  city: string;
  likes: number;
  views: number;
  publishedAt: string;
}

export interface Blogger {
  id: string;
  name: string;
  type: "blogger" | "influencer" | "youtuber";
  country: string;
  city: string;
  region: string;
  bio: string;
  avatar: string;
  photo: string;
  website: string;
  instagram: string;
  youtube: string;
  followers: number;
  rating: number;
  reviews: number;
  specialties: string[];
  languages: string[];
  blogPosts: BlogPost[];
  vlogs: { id: string; title: string; thumbnail: string; url: string; views: number }[];
  adCollaboration: boolean;
  collabTypes: string[];
  /** Sadece "Türk Diaspora Medyası" başvurusu ile gelenler için işaretlenir */
  diasporaMedia?: boolean;
}

export const bloggers: Blogger[] = [
  {
    id: "deniz-yazar",
    name: "Deniz Yazar",
    type: "blogger",
    country: "Almanya",
    city: "Berlin",
    region: "Avrupa",
    bio: "Berlin'de yaşayan gezi ve kültür yazarı. Avrupa'daki Türk diaspora yaşamını kendi gözünden anlatıyor.",
    avatar: "DY",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face",
    website: "https://denizyazar.blog",
    instagram: "@denizyazar",
    youtube: "DenizYazarTV",
    followers: 45000,
    rating: 4.9,
    reviews: 87,
    specialties: ["Gezi", "Kültür", "Yaşam Rehberi"],
    languages: ["Türkçe", "Almanca", "İngilizce"],
    blogPosts: [
      { id: "berlin-turk-mahallesi", title: "Berlin'in Türk Mahallesi: Kreuzberg Rehberi", excerpt: "Kreuzberg'de bir Türk olarak yaşamak, en iyi restoranlar, kafeler ve kültürel mekanlar...", content: "Berlin'in kalbi Kreuzberg, onlarca yıldır Türk diasporasının merkezi...", coverImage: "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=600&h=340&fit=crop", tags: ["Berlin", "Kültür", "Gusto", "Yaşam"], country: "Almanya", city: "Berlin", likes: 342, views: 5200, publishedAt: "2026-02-15" },
      { id: "almanya-entegrasyon", title: "Almanya'da Entegrasyon: İlk 100 Gün", excerpt: "Almanya'ya yeni taşınan Türkler için entegrasyon rehberi...", content: "İlk 100 gün kritik önemde. İşte adım adım entegrasyon rehberi...", coverImage: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=600&h=340&fit=crop", tags: ["Almanya", "Entegrasyon", "Yaşam Rehberi"], country: "Almanya", city: "Berlin", likes: 521, views: 8400, publishedAt: "2026-01-20" },
      { id: "turk-mutfagi-berlin", title: "Berlin'de Türk Mutfağının Evrimi", excerpt: "Geleneksel dönerden fine dining'e: Berlin'deki Türk mutfağı devrimi...", content: "Berlin'in gastronomi sahnesinde Türk mutfağı hızla evrim geçiriyor...", coverImage: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=340&fit=crop", tags: ["Gusto", "Berlin", "Gastronomi", "Kültür"], country: "Almanya", city: "Berlin", likes: 289, views: 4100, publishedAt: "2026-03-01" },
    ],
    vlogs: [],
    adCollaboration: false,
    collabTypes: [],
  },
  {
    id: "sema-dunya",
    name: "Sema Dünya",
    type: "blogger",
    country: "İngiltere",
    city: "Londra",
    region: "Avrupa",
    bio: "Londra'dan dünyaya açılan bir Türk blogger. Şehir kültürü, gusto ve diaspora hikayeleri.",
    avatar: "SD",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face",
    website: "https://semadunya.com",
    instagram: "@semadunya",
    youtube: "",
    followers: 32000,
    rating: 4.8,
    reviews: 63,
    specialties: ["Şehir Kültürü", "Gusto", "Diaspora Hikayeleri"],
    languages: ["Türkçe", "İngilizce"],
    blogPosts: [
      { id: "londra-turk-toplulugu", title: "Londra'daki Türk Topluluğunun Gizli Hazineleri", excerpt: "Londra'nın en iyi Türk restoranları, kültürel mekanları ve topluluk etkinlikleri...", content: "Londra, 500.000'den fazla Türk'ün evi...", coverImage: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&h=340&fit=crop", tags: ["Londra", "Kültür", "Topluluk"], country: "İngiltere", city: "Londra", likes: 412, views: 6800, publishedAt: "2026-02-28" },
      { id: "ingiltere-vize-deneyim", title: "İngiltere Vize Sürecim: A'dan Z'ye", excerpt: "Kendi vize deneyimimi paylaşıyorum, ipuçları ve dikkat edilmesi gerekenler...", content: "İngiltere vizesi almak uzun ve stresli bir süreç olabilir...", coverImage: "https://images.unsplash.com/photo-1488747279002-c8523379faaa?w=600&h=340&fit=crop", tags: ["İngiltere", "Vize", "Yaşam Rehberi"], country: "İngiltere", city: "Londra", likes: 678, views: 11200, publishedAt: "2026-01-10" },
    ],
    vlogs: [],
    adCollaboration: false,
    collabTypes: [],
  },
  {
    id: "emre-gezgin",
    name: "Emre Gezgin",
    type: "influencer",
    country: "BAE",
    city: "Dubai",
    region: "Ortadoğu",
    bio: "Dubai merkezli yaşam ve lüks vlogger. Markalarla işbirliği yaparak diaspora'ya özel içerikler üretiyor.",
    avatar: "EG",
    photo: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop&crop=face",
    website: "https://emregezgin.com",
    instagram: "@emregezgin",
    youtube: "EmreGezginTV",
    followers: 180000,
    rating: 4.7,
    reviews: 124,
    specialties: ["Lüks Yaşam", "Seyahat", "Gayrimenkul"],
    languages: ["Türkçe", "İngilizce", "Arapça"],
    blogPosts: [
      { id: "dubai-yatirim-rehberi", title: "Dubai'de Yatırım Yaparken Bilmeniz Gereken 10 Şey", excerpt: "Dubai gayrimenkul ve iş yatırımı rehberi...", content: "Dubai, son yılların en popüler yatırım destinasyonu...", coverImage: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&h=340&fit=crop", tags: ["Dubai", "Yatırım", "Gayrimenkul", "İş"], country: "BAE", city: "Dubai", likes: 890, views: 15600, publishedAt: "2026-03-05" },
    ],
    vlogs: [
      { id: "dubai-vlog-1", title: "Dubai'de Bir Gün: Lüks Yaşam Turu", thumbnail: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=400&h=240&fit=crop", url: "https://youtube.com/watch?v=example1", views: 85000 },
      { id: "dubai-vlog-2", title: "Türk Olarak Dubai'de İş Kurmak", thumbnail: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=240&fit=crop", url: "https://youtube.com/watch?v=example2", views: 62000 },
    ],
    adCollaboration: true,
    collabTypes: ["Sponsorlu İçerik", "Ürün Tanıtımı", "Marka Elçiliği", "Etkinlik Partneri"],
  },
  {
    id: "aylin-global",
    name: "Aylin Global",
    type: "influencer",
    country: "Hollanda",
    city: "Amsterdam",
    region: "Avrupa",
    bio: "Amsterdam'da yaşam, moda ve kültür içerikleri üreten Türk vlogger. Diaspora markaları ile aktif işbirlikleri.",
    avatar: "AG",
    photo: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop&crop=face",
    website: "https://aylinglobal.nl",
    instagram: "@aylinglobal",
    youtube: "AylinGlobalTV",
    followers: 95000,
    rating: 4.8,
    reviews: 98,
    specialties: ["Moda", "Yaşam", "Kültür"],
    languages: ["Türkçe", "Hollandaca", "İngilizce"],
    blogPosts: [
      { id: "amsterdam-turk-moda", title: "Amsterdam'da Türk Moda Girişimcileri", excerpt: "Hollanda'da moda sektöründe başarılı olan Türk girişimciler...", content: "Amsterdam moda sahnesinde Türk isimlerin yükselişi...", coverImage: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=340&fit=crop", tags: ["Moda", "Amsterdam", "Girişimcilik", "Kültür"], country: "Hollanda", city: "Amsterdam", likes: 356, views: 5800, publishedAt: "2026-02-20" },
    ],
    vlogs: [
      { id: "amsterdam-vlog-1", title: "Amsterdam'da Türk Olarak Yaşamak", thumbnail: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400&h=240&fit=crop", url: "https://youtube.com/watch?v=example3", views: 42000 },
      { id: "amsterdam-vlog-2", title: "Hollanda'da Moda Haftası Backstage", thumbnail: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=240&fit=crop", url: "https://youtube.com/watch?v=example4", views: 38000 },
    ],
    adCollaboration: true,
    collabTypes: ["Sponsorlu İçerik", "Instagram Takeover", "Marka İşbirliği"],
  },
  {
    id: "kerem-dijital",
    name: "Kerem Dijital",
    type: "influencer",
    country: "Almanya",
    city: "Frankfurt",
    region: "Avrupa",
    bio: "Tech ve dijital yaşam vlogger'ı. Almanya'daki Türk teknoloji ekosistemini tanıtıyor.",
    avatar: "KD",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    website: "https://keremdijital.de",
    instagram: "@keremdijital",
    youtube: "KeremDijitalTV",
    followers: 67000,
    rating: 4.6,
    reviews: 72,
    specialties: ["Teknoloji", "Dijital Yaşam", "Startup"],
    languages: ["Türkçe", "Almanca", "İngilizce"],
    blogPosts: [],
    vlogs: [
      { id: "tech-vlog-1", title: "Almanya'da Türk Startup Ekosistemi", thumbnail: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=240&fit=crop", url: "https://youtube.com/watch?v=example5", views: 55000 },
      { id: "tech-vlog-2", title: "Frankfurt Fintech Sahnesinde Türkler", thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=240&fit=crop", url: "https://youtube.com/watch?v=example6", views: 31000 },
    ],
    adCollaboration: true,
    collabTypes: ["Ürün İncelemesi", "Sponsorlu Video", "Webinar İşbirliği"],
  },
  {
    id: "nisa-kalem",
    name: "Nisa Kalem",
    type: "blogger",
    country: "ABD",
    city: "New York",
    region: "Amerika",
    bio: "New York'tan yazan kültür ve edebiyat bloggeri. Diaspora kimliği ve çok kültürlü yaşam üzerine yazıyor.",
    avatar: "NK",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
    website: "https://nisakalem.com",
    instagram: "@nisakalem",
    youtube: "",
    followers: 28000,
    rating: 4.9,
    reviews: 55,
    specialties: ["Edebiyat", "Kimlik", "Çok Kültürlülük"],
    languages: ["Türkçe", "İngilizce"],
    blogPosts: [
      { id: "ny-turk-kimlik", title: "New York'ta Türk Olmak: Kimlik ve Aidiyet", excerpt: "Batı ile Doğu arasında, iki kültürün kesişiminde bir kimlik arayışı...", content: "Manhattan'ın kalabalığında kaybolurken kendini bulmak...", coverImage: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&h=340&fit=crop", tags: ["New York", "Kimlik", "Kültür", "Edebiyat"], country: "ABD", city: "New York", likes: 567, views: 9200, publishedAt: "2026-03-10" },
      { id: "abd-turk-edebiyat", title: "ABD'de Türk Edebiyatının İzleri", excerpt: "Amerikan üniversitelerinde okutulan Türk yazarlar ve edebiyatımızın dünya sahnesindeki yeri...", content: "Orhan Pamuk'tan Elif Şafak'a, Türk edebiyatı Amerika'da yükselişte...", coverImage: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=340&fit=crop", tags: ["Edebiyat", "ABD", "Kültür", "Akademi"], country: "ABD", city: "New York", likes: 445, views: 7600, publishedAt: "2026-02-05" },
    ],
    vlogs: [],
    adCollaboration: false,
    collabTypes: [],
  },
  {
    id: "4vision",
    name: "4Vision",
    type: "youtuber",
    country: "Türkiye",
    city: "İstanbul",
    region: "Avrupa",
    bio: "4Vision; teknoloji, finans, girişimcilik ve Web3 dünyasını masaya yatıran yeni nesil sohbet programı. Diaspora ekosistemi ve global girişimcilik üzerine uzun formatlı içerikler üretir.",
    avatar: "4V",
    photo: fourVisionPhoto,
    website: "https://youtube.com/@4VisionTalks",
    instagram: "@4visiontalks",
    youtube: "@4VisionTalks",
    followers: 15600,
    rating: 4.9,
    reviews: 212,
    specialties: ["Teknoloji", "Finans", "Web3", "Girişimcilik"],
    languages: ["Türkçe", "İngilizce"],
    blogPosts: [],
    vlogs: [
      { id: "yt-1", title: "4Vision Talks — Web3 ve Diaspora Girişimciliği", thumbnail: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=240&fit=crop", url: "https://youtube.com/@4VisionTalks", views: 48000 },
      { id: "yt-2", title: "Yeni Nesil Finans: Global Türklerin Rolü", thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=240&fit=crop", url: "https://youtube.com/@4VisionTalks", views: 36000 },
    ],
    adCollaboration: true,
    collabTypes: ["Sponsorlu Bölüm", "Uzun Format İçerik", "Konuk Ağırlama"],
    diasporaMedia: true,
  },
];

export interface CityAmbassador {
  id: string;
  name: string;
  city: string;
  country: string;
  photo: string;
  bio: string;
  usersOnboarded: number;
  eventsOrganized: number;
  activeAdvisors: number;
  rating: number;
  whatsapp: string;
  specialties: string[];
}

export const cityAmbassadors: CityAmbassador[] = [
  {
    id: "amb-1",
    name: "Elif Kaya",
    city: "Berlin",
    country: "Almanya",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    bio: "Berlin'de 8 yıldır yaşıyor. Türk topluluk etkinlikleri ve networking organizatörü.",
    usersOnboarded: 127,
    eventsOrganized: 14,
    activeAdvisors: 8,
    rating: 4.9,
    whatsapp: "+491234567890",
    specialties: ["Networking", "Etkinlik", "Onboarding"],
  },
  {
    id: "amb-2",
    name: "Murat Demir",
    city: "London",
    country: "İngiltere",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    bio: "Londra'da finans sektöründe çalışıyor. İş networkü ve mentor programları kuruyor.",
    usersOnboarded: 95,
    eventsOrganized: 9,
    activeAdvisors: 12,
    rating: 4.8,
    whatsapp: "+447123456789",
    specialties: ["Finans", "Mentörlük", "İş Ağı"],
  },
  {
    id: "amb-3",
    name: "Zeynep Arslan",
    city: "Dubai",
    country: "BAE",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    bio: "Dubai'de girişimcilik ekosisteminde aktif. Türk iş insanlarını bir araya getiriyor.",
    usersOnboarded: 203,
    eventsOrganized: 22,
    activeAdvisors: 15,
    rating: 5.0,
    whatsapp: "+971501234567",
    specialties: ["Girişimcilik", "Free Zone", "Network"],
  },
  {
    id: "amb-4",
    name: "Can Yılmaz",
    city: "New York",
    country: "ABD",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    bio: "NYC'de teknoloji sektöründe 6 yıldır yaşıyor. Türk diasporasını dijitalde birleştiriyor.",
    usersOnboarded: 78,
    eventsOrganized: 6,
    activeAdvisors: 5,
    rating: 4.7,
    whatsapp: "+12125551234",
    specialties: ["Teknoloji", "Startup", "Sosyal Medya"],
  },
  {
    id: "amb-5",
    name: "Ayşe Çelik",
    city: "Paris",
    country: "Fransa",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
    bio: "Paris'te kültür ve sanat alanında aktif. Türk sanatçılar ve profesyoneller arasında köprü kuruyor.",
    usersOnboarded: 64,
    eventsOrganized: 11,
    activeAdvisors: 7,
    rating: 4.9,
    whatsapp: "+33612345678",
    specialties: ["Kültür", "Sanat", "Eğitim"],
  },
  {
    id: "amb-6",
    name: "Burak Özkan",
    city: "Melbourne",
    country: "Avustralya",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
    bio: "Melbourne'da göçmenlik danışmanlığı yapıyor. Avustralya'daki Türk topluluğunun büyümesine liderlik ediyor.",
    usersOnboarded: 52,
    eventsOrganized: 7,
    activeAdvisors: 4,
    rating: 4.8,
    whatsapp: "+61412345678",
    specialties: ["Göçmenlik", "Topluluk", "Etkinlik"],
  },
];
