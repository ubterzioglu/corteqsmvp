/**
 * Profil öğrenim alanları için TEK kaynak (mig 20260925100000_profil_ogrenim_alanlari.sql).
 *
 * - Seçenek DEĞERLERİ DB'ye yazılan anahtardır (ASCII slug) ve elle yazılmaz;
 *   migration'daki `validation_schema.enum` bu listeyle BİREBİR aynı olmalıdır
 *   (`profile-education.test.ts` kilitler).
 * - Etiketler kullanıcıya görünen Türkçe metindir — Türkçe karakterler eksiksiz.
 * - İki alan da isteğe bağlıdır ve varsayılan olarak gizlidir (private).
 */

export const EDUCATION_LEVEL_ATTRIBUTE_KEY = "education_level";
export const EDUCATION_LAST_SCHOOL_ATTRIBUTE_KEY = "education_last_school";

export const EDUCATION_LEVEL_LABEL = "Öğrenim durumu";
export const EDUCATION_LAST_SCHOOL_LABEL = "Son bitirdiği üniversite/okul";
export const EDUCATION_LAST_SCHOOL_MAX_LENGTH = 200;

export type EducationLevelOption = {
  readonly value: string;
  readonly label: string;
};

export const EDUCATION_LEVEL_OPTIONS: readonly EducationLevelOption[] = [
  { value: "ilkogretim", label: "İlköğretim" },
  { value: "ortaogretim", label: "Ortaöğretim" },
  { value: "lise", label: "Lise" },
  { value: "on_lisans", label: "Ön lisans" },
  { value: "lisans", label: "Lisans" },
  { value: "yuksek_lisans", label: "Yüksek lisans" },
  { value: "doktora", label: "Doktora" },
] as const;

/** Form sırası: önce öğrenim durumu, sonra okul. */
export const EDUCATION_ATTRIBUTE_KEYS: readonly string[] = [
  EDUCATION_LEVEL_ATTRIBUTE_KEY,
  EDUCATION_LAST_SCHOOL_ATTRIBUTE_KEY,
];

export const EDUCATION_ATTRIBUTE_KEY_SET: ReadonlySet<string> = new Set(EDUCATION_ATTRIBUTE_KEYS);

export const isEducationAttributeKey = (attributeKey: string): boolean =>
  EDUCATION_ATTRIBUTE_KEY_SET.has(attributeKey);

export const isEducationLevelValue = (value: unknown): value is string =>
  typeof value === "string" && EDUCATION_LEVEL_OPTIONS.some((option) => option.value === value);

/** Kayıtlı değerin Türkçe etiketi; bilinmeyen değer olduğu gibi döner (veri kaybolmaz). */
export const getEducationLevelLabel = (value: string | null | undefined): string => {
  if (!value) return "";
  return EDUCATION_LEVEL_OPTIONS.find((option) => option.value === value)?.label ?? value;
};

/**
 * `select` tipli bir attribute için seçenek listesi. Bugün yalnız öğrenim durumu
 * tanımlıdır; seçeneği bilinmeyen select alanlar serbest metin olarak çizilmeye devam eder.
 */
export const getAttributeSelectOptions = (attributeKey: string): readonly EducationLevelOption[] | null =>
  attributeKey === EDUCATION_LEVEL_ATTRIBUTE_KEY ? EDUCATION_LEVEL_OPTIONS : null;
