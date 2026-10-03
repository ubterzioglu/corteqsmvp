/**
 * G06b · Kurumsal doğrulama (Seviye 2) veri katmanı — tek yazma yolu.
 *
 * `careers-api.ts` deseninin birebir kopyası (KR03/G06 dersi). G06a şeması
 * canlıda: kova `org-verification-docs` (PRIVATE, 15 MB, 4 MIME) + RPC
 * `request_org_verification_v1` + depolama politikaları. Bu dosya onun eksik
 * TS yarısıdır.
 *
 * Akış: kullanıcı belgeleri seçer → her dosya kovaya
 * `<user_id>/<item_id>/<güvenli-ad>` altına yüklenir → RPC çağrılır
 * (`claim_type='verification_level_2'` + `status='pending'` GÖVDEDE zorlanır,
 * istemci parametre olarak GÖNDEREMEZ). Sıra bu olmak zorunda: RPC, verilen
 * yolların ÇAĞIRANIN klasöründe olduğunu doğrular (`org_verification_path_forbidden`).
 *
 * 🔴 İKİ ADIMLI AKIŞ (G06a ölçümü: 262 kurumsal kaydın 249'unda kişi bağı YOK):
 * Bağı olmayan kullanıcı `org_verification_not_linked` alır — önce mevcut
 * sahiplenme akışından (`editor_access`) geçmelidir. UI bu kodda "önce kaydı
 * sahiplen" yolunu gösterir (`isOrgVerificationNotLinkedError`).
 *
 * ⚠️ types.ts regen BORCU (G12): `request_org_verification_v1` üretilmiş
 * tiplerde YOK — `as never` deseni bilinçli (emsal: group-claims.ts, careers).
 * ⚠️ RPC hataları DÜZ NESNE — tip daraltması (instanceof) YASAK (KR03);
 * `extractRpcErrorText` tek kaynak.
 */
import { supabase } from "@/integrations/supabase/client";
import { extractRpcErrorText } from "@/lib/rpc-error-text";
import { safeStorageFileName, validateFile } from "@/lib/security";

export const ORG_VERIFICATION_BUCKET = "org-verification-docs";

/**
 * ⚠️ İstemci sınırı kovanın SQL sınırını AŞAMAZ (kariyer kovası dersi: istemci
 * 50 MB / kova 25 MB → dosya istemciden geçer, kovadan döner, kullanıcı sebebi
 * anlaşılmayan hata görür). Kova `file_size_limit=15728640` (G06a migration);
 * sözleşme testi bu iki sayıyı migration metninden okuyup karşılaştırır.
 */
export const ORG_VERIFICATION_MAX_SIZE = 15 * 1024 * 1024; // 15728640 — kova ile birebir

/** RPC gövdesindeki `c_max_documents` (G06a) ile birebir — istemci ön kontrol. */
export const ORG_VERIFICATION_MAX_DOCUMENTS = 5;

/**
 * Kovanın `allowed_mime_types` listesine (4 tür) karşılık gelen uzantılar.
 * `application/octet-stream` BİLEREK YOK (her şeyi kabul eder). Uzantı seti
 * `accept=` ile aynı kümeden türetilir ki ayrışamasınlar.
 */
export const ORG_VERIFICATION_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png", "webp"]);

const acceptFrom = (extensions: Set<string>) => [...extensions].map((ext) => `.${ext}`).join(",");
export const ORG_VERIFICATION_ACCEPT = acceptFrom(ORG_VERIFICATION_EXTENSIONS);

export const validateOrgVerificationFile = (file: File): string | null =>
  validateFile(file, {
    allowedExtensions: ORG_VERIFICATION_EXTENSIONS,
    maxSize: ORG_VERIFICATION_MAX_SIZE,
  });

/**
 * Uzantıdan MIME. ⚠️ `file.type`'a GÜVENİLMEZ: tarayıcıya göre boş ya da yanlış
 * gelir ve kovanın dar tür listesinden DÖNER. Tür burada uzantıdan belirlenir
 * (careers-api deseni). Yalnız kovanın 4 MIME'ı üretilir.
 */
const ORG_VERIFICATION_CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export function orgVerificationContentType(fileName: string): string | undefined {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  return ORG_VERIFICATION_CONTENT_TYPES[extension];
}

/**
 * RPC hata kodu → Türkçe mesaj (G06a migration'daki 9 `raise exception` kodu).
 * Yeni `org_verification_` kodu SQL'e eklenince buraya da eklenir — sözleşme
 * testi ÇİFT YÖNLÜ kilitler (SQL'de olup burada olmayan + burada olup SQL'de olmayan).
 */
export const ORG_VERIFICATION_ERROR_MESSAGES: Record<string, string> = {
  org_verification_auth_required: "Doğrulama talebi için giriş yapmalısın.",
  org_verification_item_not_found: "Kayıt bulunamadı.",
  org_verification_item_not_organization:
    "Bu kayıt bir kuruluş değil — kurumsal doğrulama yalnız dernek/okul/kuruluş kayıtları içindir.",
  org_verification_already_verified: "Bu kayıt zaten doğrulanmış.",
  org_verification_not_linked:
    "Bu kaydı doğrulamak için önce temsil yetkisi almalısın: kaydı sahiplen (Düzenleme Yetkisi Talep Et), onaydan sonra doğrulama başvurusu açabilirsin.",
  org_verification_document_required: "En az bir belge yüklemelisin.",
  org_verification_too_many_documents: "En fazla 5 belge yükleyebilirsin.",
  org_verification_path_forbidden:
    "Belgeler kendi klasörüne yüklenmeli. Dosyaları yeniden yükleyip tekrar dene.",
  org_verification_pending_exists: "Bu kayıt için bekleyen bir doğrulama talebi zaten var.",
};

const ORG_VERIFICATION_GENERIC_ERROR = "Doğrulama talebi gönderilemedi. Lütfen tekrar deneyin.";

/**
 * ⚠️ Supabase RPC hataları **düz nesnedir, `Error` örneği DEĞİLDİR** — tip
 * daraltması (instanceof) bu haritayı tamamen ölü bırakır ve kullanıcıya
 * `[object Object]` gösterir (canlıda iki kez yaşandı, `rpc-error-text.ts`).
 */
export function orgVerificationErrorMessage(error: unknown): string {
  const raw = extractRpcErrorText(error);
  const match = raw.match(/org_verification_[a-z0-9_]+/);
  if (match && ORG_VERIFICATION_ERROR_MESSAGES[match[0]]) return ORG_VERIFICATION_ERROR_MESSAGES[match[0]];
  return ORG_VERIFICATION_GENERIC_ERROR;
}

/**
 * `org_verification_not_linked` mi? UI bu durumda "önce kaydı sahiplen" yolunu
 * gösterir (iki adımlı akış — G06a ölçümü: kayıtların %95'i sahipsiz).
 */
export function isOrgVerificationNotLinkedError(error: unknown): boolean {
  return extractRpcErrorText(error).includes("org_verification_not_linked");
}

/**
 * Depolama anahtarı: `<user_id>/<item_id>/<güvenli-ad>`.
 * 🔴 İlk klasör KULLANICI kimliği olmak ZORUNDA — kovanın INSERT politikası
 * `(storage.foldername(name))[1] = auth.uid()::text` ve RPC
 * `v_path ~ '^' || v_user || '/'` aynı deseni denetler (ikinci savunma).
 * ⚠️ Ham `file.name` anahtara GİRMEZ — `safeStorageFileName` yol ayracı, `..`
 * ve görünmez karakterleri temizler.
 */
export const orgVerificationStorageKey = (userId: string, itemId: string, fileName: string) =>
  `${userId}/${itemId}/${safeStorageFileName(fileName)}`;

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (error || !uid) throw new Error(ORG_VERIFICATION_ERROR_MESSAGES.org_verification_auth_required);
  return uid;
}

/**
 * Belgeleri kovaya yükler (henüz RPC çağırmaz). Her dosya önce doğrulanır
 * (uzantı + 15 MB), sonra `<uid>/<itemId>/<güvenli-ad>` anahtarıyla yüklenir.
 * MIME uzantıdan verilir (file.type DEĞİL). `upsert:false` — başkasının
 * belgesinin üzerine yazılamaz.
 */
export async function uploadOrgVerificationDocuments(
  itemId: string,
  files: File[],
): Promise<{ userId: string; paths: string[] }> {
  if (!files || files.length === 0) {
    throw new Error(ORG_VERIFICATION_ERROR_MESSAGES.org_verification_document_required);
  }
  if (files.length > ORG_VERIFICATION_MAX_DOCUMENTS) {
    throw new Error(ORG_VERIFICATION_ERROR_MESSAGES.org_verification_too_many_documents);
  }

  const userId = await currentUserId();
  const paths: string[] = [];

  for (const file of files) {
    const validationError = validateOrgVerificationFile(file);
    if (validationError) throw new Error(validationError);

    const key = orgVerificationStorageKey(userId, itemId, file.name);
    const { error } = await supabase.storage
      .from(ORG_VERIFICATION_BUCKET)
      .upload(key, file, {
        contentType: orgVerificationContentType(file.name),
        upsert: false,
      });
    if (error) throw error;
    paths.push(key);
  }

  return { userId, paths };
}

/**
 * Tam akış: belgeleri yükle → `request_org_verification_v1` çağır → claim id.
 * 🔴 RPC hatası düz nesne; tip daraltması (instanceof) YASAK — `orgVerificationErrorMessage`
 * haritayı `extractRpcErrorText` üzerinden okur.
 */
export async function requestOrgVerification(
  itemId: string,
  files: File[],
  note?: string | null,
): Promise<string> {
  const { paths } = await uploadOrgVerificationDocuments(itemId, files);

  const { data, error } = await supabase.rpc("request_org_verification_v1" as never, {
    p_item_id: itemId,
    p_doc_paths: paths,
    p_note: note?.trim() ? note.trim().slice(0, 500) : null,
  } as never);

  if (error) throw new Error(orgVerificationErrorMessage(error));
  return String(data);
}

/**
 * Belgeyi açmak için İMZALI bağlantı (G07 admin önizleme + sahip kendi belgesi).
 * 🔴 Kova PRIVATE — herkese açık URL üreten yardımcı YASAK (belge sızar). Yalnız
 * `createSignedUrl`, kısa TTL (varsayılan 5 dk, group-moderation deseni).
 */
export async function openOrgVerificationDocument(
  path: string,
  expiresInSeconds = 300,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(ORG_VERIFICATION_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw error ?? new Error("Belge için imzalı bağlantı üretilemedi.");
  }
  return data.signedUrl;
}
