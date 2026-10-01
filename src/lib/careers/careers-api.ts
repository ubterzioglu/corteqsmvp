/**
 * Kariyer başvurusu veri katmanı (KR03) — tek yazma yolu.
 *
 * Akış: istemci başvuru kimliğini ÜRETİR → dosyalar `career-applications`
 * kovasına `<id>/…` altına yüklenir → `submit_career_application` RPC'si çağrılır.
 * Sıra bu olmak zorunda: `cv_path` tabloda `not null` ve anon satırı sonradan
 * güncelleyemez. RPC, verilen yolların bu başvurunun klasöründe olduğunu da
 * doğrular (`career_invalid_cv_path`).
 */
import { supabase } from "@/integrations/supabase/client";
import { extractRpcErrorText } from "@/lib/rpc-error-text";
import { safeStorageFileName, validateFile } from "@/lib/security";

import type { CareerApplicationInput } from "./careers-schemas";

export const CAREER_BUCKET = "career-applications";

/**
 * ⚠️ Sınırlar kovanın SQL sınırıyla hizalı olmak zorundadır (25 MB).
 * Mevcut `validatePresentationFile` 50 MB'a izin verir — kullanılsaydı 40 MB'lık
 * bir sunum istemciden GEÇER, kovadan DÖNERDİ: kullanıcı sebebi anlaşılmayan bir
 * hata görür. Bu yüzden kariyer kendi sınırlarını tanımlar; sözleşme testi bu iki
 * sayıyı migration metnindeki kova sınırına karşı denetler.
 */
export const CAREER_CV_MAX_SIZE = 10 * 1024 * 1024;
export const CAREER_PRESENTATION_MAX_SIZE = 25 * 1024 * 1024;

const CAREER_CV_EXTENSIONS = new Set(["pdf", "doc", "docx"]);
const CAREER_PRESENTATION_EXTENSIONS = new Set(["pdf", "ppt", "pptx", "key"]);

/**
 * ⚠️ `accept` niteliği YALNIZCA dosya seçiciye verilen bir tavsiyedir — kullanıcı
 * "Tüm dosyalar"ı seçerek atlar. Gerçek denetim `validateCareer*File`'dadır;
 * ikisi aynı kümeden türetilir ki ayrışamasınlar
 * (`service-attachment-security.test.ts` ile aynı sözleşme).
 */
const acceptFrom = (extensions: Set<string>) => [...extensions].map((ext) => `.${ext}`).join(",");
export const CAREER_CV_ACCEPT = acceptFrom(CAREER_CV_EXTENSIONS);
export const CAREER_PRESENTATION_ACCEPT = acceptFrom(CAREER_PRESENTATION_EXTENSIONS);

export const validateCareerCvFile = (file: File): string | null =>
  validateFile(file, { allowedExtensions: CAREER_CV_EXTENSIONS, maxSize: CAREER_CV_MAX_SIZE });

export const validateCareerPresentationFile = (file: File): string | null =>
  validateFile(file, {
    allowedExtensions: CAREER_PRESENTATION_EXTENSIONS,
    maxSize: CAREER_PRESENTATION_MAX_SIZE,
  });

/**
 * Uzantıdan MIME türü. ⚠️ `file.type`'a GÜVENİLMEZ: `.key` dosyaları (macOS'ta
 * paket/zip) tarayıcıya göre boş ya da `application/zip` olarak gelir ve kovanın
 * tür listesinden DÖNER. Kova listesi bilerek dar tutulduğu için
 * (`application/octet-stream` çıkarıldı) türü burada biz belirliyoruz.
 */
const CAREER_CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  key: "application/vnd.apple.keynote",
};

export function careerContentType(fileName: string): string | undefined {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  return CAREER_CONTENT_TYPES[extension];
}

/** RPC hata kodu → Türkçe mesaj. Yeni `career_` kodu SQL'e eklenince buraya da eklenir. */
export const CAREER_ERROR_MESSAGES: Record<string, string> = {
  career_application_id_required: "Başvuru kimliği üretilemedi. Sayfayı yenileyip tekrar deneyin.",
  career_consent_required: "Devam etmek için onay vermelisiniz.",
  career_invalid_name: "Ad soyad 2–200 karakter olmalı.",
  career_invalid_email: "Geçerli bir e-posta adresi girin.",
  career_country_required: "Ülke zorunludur.",
  career_invalid_position: "Pozisyon seçimi geçersiz.",
  career_invalid_model: "Katılım modeli seçin.",
  career_invalid_cv_path: "CV dosyası bu başvuruya bağlanamadı. Dosyayı yeniden yükleyin.",
  career_invalid_cover_letter_path: "Ön yazı dosyası bu başvuruya bağlanamadı. Dosyayı yeniden yükleyin.",
  career_invalid_presentation_path: "Sunum dosyası bu başvuruya bağlanamadı. Dosyayı yeniden yükleyin.",
  career_email_daily_limit: "Bu e-posta ile bugün çok fazla başvuru yapıldı. Yarın tekrar deneyin.",
  career_intake_rate_limited: "Şu anda çok yoğun başvuru alıyoruz. Birazdan tekrar deneyin.",
};

const CAREER_GENERIC_ERROR = "Başvuru gönderilemedi. Lütfen tekrar deneyin.";

/**
 * ⚠️ Supabase RPC hataları **düz nesnedir, `Error` örneği DEĞİLDİR** —
 * `instanceof Error` ile daraltmak bu haritayı tamamen ölü bırakır ve kullanıcıya
 * `[object Object]` gösterir (canlıda iki kez yaşandı, `rpc-error-text.ts`).
 */
export function careerErrorMessage(error: unknown): string {
  const raw = extractRpcErrorText(error);
  const match = raw.match(/career_[a-z0-9_]+/);
  if (match && CAREER_ERROR_MESSAGES[match[0]]) return CAREER_ERROR_MESSAGES[match[0]];
  return CAREER_GENERIC_ERROR;
}

export type CareerApplicationFiles = {
  cv: File;
  coverLetter?: File | null;
  presentation?: File | null;
};

export type CareerApplicationPaths = {
  cvPath: string;
  coverLetterPath: string | null;
  presentationPath: string | null;
};

/**
 * Depolama anahtarı üretir. ⚠️ Ham `file.name` anahtara GİRMEZ — `safeStorageFileName`
 * yol ayracı, `..` dizisi ve görünmez karakterleri temizler. Kovanın INSERT
 * politikası da aynı deseni ayrıca denetler (ikinci savunma).
 */
export const careerStorageKey = (applicationId: string, kind: "cv" | "cover-letter" | "presentation", fileName: string) =>
  `${applicationId}/${kind}-${safeStorageFileName(fileName)}`;

export async function uploadCareerFiles(
  applicationId: string,
  files: CareerApplicationFiles,
): Promise<CareerApplicationPaths> {
  const upload = async (kind: "cv" | "cover-letter" | "presentation", file: File) => {
    const key = careerStorageKey(applicationId, kind, file.name);
    const { error } = await supabase.storage.from(CAREER_BUCKET).upload(key, file, {
      contentType: careerContentType(file.name),
      upsert: false,
    });
    if (error) throw error;
    return key;
  };

  const cvError = validateCareerCvFile(files.cv);
  if (cvError) throw new Error(cvError);
  const cvPath = await upload("cv", files.cv);

  let coverLetterPath: string | null = null;
  if (files.coverLetter) {
    const error = validateCareerCvFile(files.coverLetter);
    if (error) throw new Error(error);
    coverLetterPath = await upload("cover-letter", files.coverLetter);
  }

  let presentationPath: string | null = null;
  if (files.presentation) {
    const error = validateCareerPresentationFile(files.presentation);
    if (error) throw new Error(error);
    presentationPath = await upload("presentation", files.presentation);
  }

  return { cvPath, coverLetterPath, presentationPath };
}

export function newCareerApplicationId(): string {
  return crypto.randomUUID();
}

export async function submitCareerApplication(
  applicationId: string,
  input: CareerApplicationInput,
  paths: CareerApplicationPaths,
): Promise<string> {
  const { data, error } = await supabase.rpc("submit_career_application", {
    p_application_id: applicationId,
    p_full_name: input.fullName,
    p_email: input.email,
    p_country: input.country,
    p_position: input.position,
    p_model: input.model,
    p_cv_path: paths.cvPath,
    p_consent: input.consent,
    p_phone: input.phone || null,
    p_linkedin: input.linkedin || null,
    p_city: input.city || null,
    p_cover_letter_text: input.coverLetterText || null,
    p_cover_letter_path: paths.coverLetterPath,
    p_presentation_path: paths.presentationPath,
    p_source: input.source || null,
  });

  if (error) throw error;
  return String(data ?? applicationId);
}


