// Subcategory taxonomy for each user account type.
// Used in the per-role profile settings to let users tag themselves so
// they appear under the correct sub-filter on listing pages and searches.

export interface SubcategoryGroup {
  key: string;
  label: string;
  options: string[];
}

export const USER_SUBCATEGORIES: Record<string, SubcategoryGroup[]> = {
  consultant: [
    {
      key: "Gayrimenkul",
      label: "Gayrimenkul",
      options: [
        "Ev kiralama", "Ev satın alma", "Ticari gayrimenkul",
        "Yatırım danışmanlığı", "Mortgage / kredi", "Relocation housing",
      ],
    },
    {
      key: "Vize & Göçmenlik",
      label: "Vize & Göçmenlik",
      options: [
        "Öğrenci vizesi", "Çalışma vizesi", "Blue Card",
        "Oturum & PR", "Vatandaşlık", "Aile birleşimi",
        "İltica / asylum", "Golden Visa",
      ],
    },
    {
      key: "Şirket & İş",
      label: "Şirket Kuruluşu & İş",
      options: [
        "Şirket kuruluş", "Freelance / self-employed", "Startup danışmanlığı",
        "İş geliştirme", "Yerel iş bulma", "CV / interview koçluğu",
        "Networking", "Free Zone",
      ],
    },
    {
      key: "Hukuk & Vergi",
      label: "Hukuk & Vergi",
      options: [
        "Bireysel vergi", "Şirket vergisi", "Uluslararası vergi",
        "Göçmen hukuku", "İş hukuku", "Sözleşme hukuku",
      ],
    },
    {
      key: "Finansal",
      label: "Finansal",
      options: [
        "Banka hesabı açma", "Kredi & finansman", "Yatırım danışmanlığı",
        "Sigorta danışmanlığı", "Emeklilik planlama", "Bütçe yönetimi",
      ],
    },
    {
      key: "Yaşam & Relocation",
      label: "Yaşam & Relocation",
      options: [
        "Şehre adaptasyon", "Kültürel entegrasyon", "Dil okulları",
        "Günlük yaşam rehberi", "Bürokratik işlemler", "Taşınma planlama",
        "Doktor & Diş", "Taşımacılık",
      ],
    },
    {
      key: "Aile & Çocuk",
      label: "Aile & Çocuk",
      options: ["Okul seçimi", "Kreş / daycare", "Playdate & sosyal çevre", "Aile taşınma"],
    },
    {
      key: "Wellbeing",
      label: "Psikolog & Koç",
      options: ["Psikolog / terapi", "Koçluk", "Göçmen psikolojisi", "Stres & adaptasyon"],
    },
    {
      key: "Eğitim",
      label: "Eğitim",
      options: ["Üniversite başvuruları", "Denklik işlemleri", "Burs danışmanlığı", "Kariyer yönlendirme", "Staj"],
    },
    {
      key: "Pratik Hayat",
      label: "Pratik Hayat",
      options: ["Araç alım / kiralama", "Ehliyet dönüşümü", "Telefon / internet setup", "Abonelik işlemleri"],
    },
  ],

  business: [
    {
      key: "sektor",
      label: "Sektör / Hizmet",
      options: [
        "Restoran & Cafe", "Market & Bakkal", "Fırın & Pastane",
        "Kuaför & Güzellik", "Berber", "Sağlık & Klinik",
        "Eczane", "Hukuk Bürosu", "Muhasebe & Finans",
        "Gayrimenkul Ofisi", "Seyahat Acentesi", "Otel & Konaklama",
        "Eğitim Kurumu", "Dil Okulu", "IT & Yazılım",
        "Tasarım & Reklam", "İnşaat & Tadilat", "Nakliye & Lojistik",
        "Otomotiv", "Spor Salonu", "Çocuk & Aile",
        "Sigorta", "Perakende & Mağaza", "E-ticaret",
        "Toptan Ticaret", "Diğer",
      ],
    },
  ],

  association: [
    // Association uses ORGANIZATION_CATEGORIES from organizationCategories.ts
    // This block is intentionally empty — its settings UI uses the org taxonomy directly.
  ],

  blogger: [
    {
      key: "format",
      label: "İçerik Formatı",
      options: ["Blogger (yazı)", "Vlogger (Instagram)", "YouTuber", "TikToker", "Podcaster", "Yazar"],
    },
    {
      key: "konu",
      label: "Konu Alanı",
      options: [
        "Yaşam & Diaspora", "Seyahat", "Yemek & Mutfak", "Aile & Çocuk",
        "Kariyer & İş", "Teknoloji", "Finans & Yatırım", "Eğitim",
        "Moda & Güzellik", "Spor & Sağlık", "Sanat & Kültür", "Eğlence",
        "Politika & Gündem", "Otomotiv", "Girişimcilik",
      ],
    },
  ],

  ambassador: [
    {
      key: "fokus",
      label: "Şehirde Odak Alanı",
      options: [
        "Networking & Etkinlik", "Yeni Gelenler & Welcome",
        "İşletme & Ticari Bağlantılar", "Kültür & Sanat",
        "Aile & Çocuk Toplulukları", "Öğrenci & Akademik",
        "Sağlık & Wellbeing", "Spor & Outdoor",
      ],
    },
  ],

  individual: [
    {
      key: "ilgi",
      label: "İlgi Alanları",
      options: [
        "Networking", "Yeni Geldim", "Aile & Çocuk", "Kariyer & İş",
        "Girişimcilik", "Eğitim", "Sanat & Kültür", "Spor",
        "Yemek & Mutfak", "Seyahat", "Gönüllülük", "Mentorluk",
      ],
    },
  ],
};

const STORAGE_PREFIX = "user_subcategories_v1";
const storageKey = (accountType: string, userId?: string | null) =>
  `${STORAGE_PREFIX}::${accountType}::${userId ?? "anon"}`;

export const loadUserSubcategories = (
  accountType: string,
  userId?: string | null,
): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(accountType, userId));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};

export const saveUserSubcategories = (
  accountType: string,
  userId: string | null | undefined,
  values: string[],
) => {
  try {
    localStorage.setItem(storageKey(accountType, userId), JSON.stringify(values));
    window.dispatchEvent(new CustomEvent("user-subcategories-updated", { detail: { accountType } }));
  } catch {
    /* noop */
  }
};
