// Kayıt Veritabanı (/admin/catalog) ekranının salt gösterim katmanı: kısaltma
// sözlükleri, varsayılan filtreler ve etiket/tarih biçimlendiricileri.
// Veri erişimi `@/lib/admin-catalog` içinde kalır; burada Supabase çağrısı yoktur.

import type { AdminCatalogFilters } from "@/lib/admin-catalog";
import type { UnifiedRecord } from "@/lib/catalog-types";

export const PAGE_SIZE = 50;

export type LegendItem = {
  code: string;
  label: string;
  description: string;
  group: string;
};

export const KIND_ABBREVIATIONS: Record<UnifiedRecord["kind"], LegendItem> = {
  catalog_item: {
    code: "KTG",
    label: "Katalog",
    description: "CSV, import, manuel giriş veya başka kaynaklardan gelen katalog kayıtlarını temsil eder.",
    group: "Tür",
  },
  member_profile: {
    code: "MEM",
    label: "Üye",
    description: "Bir auth kullanıcısına bağlı üye katalog kaydını (item_type = member) temsil eder.",
    group: "Tür",
  },
  profile: {
    code: "KUL",
    label: "Kullanıcı",
    description: "Doğrudan platform kullanıcısına ait profil kaydını temsil eder.",
    group: "Tür",
  },
};

export const STATUS_ABBREVIATIONS: Record<string, LegendItem> = {
  published: {
    code: "YAY",
    label: "Yayında",
    description: "Kayıt yayına alınmış durumdadır; ilgili akışta görünür veya kullanılabilir kabul edilir.",
    group: "Durum",
  },
  draft: {
    code: "TSL",
    label: "Taslak",
    description: "Kayıt henüz tamamlanmamış ya da yayına hazır olmadığı için taslak olarak tutulur.",
    group: "Durum",
  },
  pending_review: {
    code: "INC",
    label: "İncelemede",
    description: "Kayıt admin ya da moderasyon incelemesi bekliyordur; karar süreci tamamlanmamıştır.",
    group: "Durum",
  },
  archived: {
    code: "ARS",
    label: "Arşiv",
    description: "Kayıt aktif kullanım akışından çıkarılmıştır ama geçmiş referansı için saklanır.",
    group: "Durum",
  },
  rejected: {
    code: "RED",
    label: "Reddedildi",
    description: "Kayıt veya süreç olumsuz kararla sonuçlanmıştır; tekrar değerlendirme gerekebilir.",
    group: "Durum",
  },
  directory_opted_in: {
    code: "DIZ",
    label: "Dizinde",
    description: "Kullanıcı profili dizinde görünmeyi seçmiştir ve listelemeye dahildir.",
    group: "Durum",
  },
  private: {
    code: "GIZ",
    label: "Gizli",
    description: "Kullanıcı profili listeleme veya dizin görünürlüğünü kapatmıştır.",
    group: "Durum",
  },
};

export const VERIFICATION_ABBREVIATIONS: Record<string, LegendItem> = {
  unverified: {
    code: "YOK",
    label: "Doğrulama Yok",
    description: "Kaydın doğruluğu için henüz ek bir teyit veya kaynak onayı bulunmuyor.",
    group: "Doğrulama",
  },
  pending: {
    code: "BEK",
    label: "Beklemede",
    description: "Doğrulama süreci başlamış ama henüz sonuçlandırılmamıştır.",
    group: "Doğrulama",
  },
  verified: {
    code: "DGR",
    label: "Doğrulandı",
    description: "Kayıt platform içinde kontrol edilmiş ve yeterli doğrulama eşiğini geçmiştir.",
    group: "Doğrulama",
  },
  official_source: {
    code: "RES",
    label: "Resmi Kaynak",
    description: "Kayıt resmi veya yüksek güvenilirlikli bir kaynaktan geldiği için güçlü doğrulama sinyali taşır.",
    group: "Doğrulama",
  },
  claimed: {
    code: "SHP",
    label: "Sahiplenildi",
    description: "Kayıt ilgili kişi veya temsilci tarafından sahiplenme akışına girmiş ya da bağlanmıştır.",
    group: "Doğrulama",
  },
};

export const LEGEND_ITEMS = [
  ...Object.values(KIND_ABBREVIATIONS),
  ...Object.values(STATUS_ABBREVIATIONS),
  ...Object.values(VERIFICATION_ABBREVIATIONS),
// `as const` fonksiyon cagrisi sonucuna uygulanamaz (TS1355); sort() zaten yeni
// dizi donduruyor, sabitleme burada bir sey kazandirmiyordu.
].sort((left, right) => left.code.localeCompare(right.code, "tr"));

export const DEFAULT_FILTERS: AdminCatalogFilters = {
  kind: "",
  query: "",
  itemType: "",
  platformRoleKey: "",
  status: "",
  verificationStatus: "",
  city: "",
  countryCode: "",
};

export const formatDateTime = (value: string | null) => {
  if (!value) return "-";

  return new Date(value).toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  });
};

export const formatDateShort = (value: string | null) => {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    timeZone: "Europe/Berlin",
  });
};

export const formatLabel = (value: string) =>
  value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("tr-TR") + part.slice(1))
    .join(" ");

export const compactList = (values: string[], fallback = "-") => {
  if (!values.length) return fallback;
  return values.join(", ");
};

export const kindLabel = (kind: UnifiedRecord["kind"]) => KIND_ABBREVIATIONS[kind]?.label ?? formatLabel(kind);
export const getKindCode = (kind: UnifiedRecord["kind"]) =>
  KIND_ABBREVIATIONS[kind]?.code ?? kind.slice(0, 3).toUpperCase();
export const getStatusCode = (status: string) => STATUS_ABBREVIATIONS[status]?.code ?? formatLabel(status);
export const getStatusLabel = (status: string) => STATUS_ABBREVIATIONS[status]?.label ?? formatLabel(status);
export const getVerificationCode = (status: string | null) => {
  if (!status) return "-";
  return VERIFICATION_ABBREVIATIONS[status]?.code ?? formatLabel(status);
};
export const getVerificationLabel = (status: string | null) => {
  if (!status) return "-";
  return VERIFICATION_ABBREVIATIONS[status]?.label ?? formatLabel(status);
};
