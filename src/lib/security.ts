const ALLOWED_FILE_EXTENSIONS = new Set([
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
  "png", "jpg", "jpeg", "gif", "svg", "webp",
  "zip", "rar", "7z", "txt", "csv", "md", "json",
]);

const CV_ALLOWED_EXTENSIONS = new Set(["pdf", "doc", "docx"]);
const PRESENTATION_ALLOWED_EXTENSIONS = new Set(["pdf", "ppt", "pptx", "key"]);
const LICENSE_ALLOWED_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png"]);
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ARGE_MAX_FILE_SIZE = 50 * 1024 * 1024;
const DANGEROUS_URL_SCHEMES = /^(javascript|data|vbscript|blob):/i;
const MAX_TITLE_LENGTH = 500;
const MAX_CONTENT_LENGTH = 50000;

export function sanitizeHtml(dirty: string): string {
  return dirty
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "");
}

export function sanitizeUrl(url: string): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (DANGEROUS_URL_SCHEMES.test(trimmed)) return "";
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

export function safeHref(url: string | null | undefined): string {
  if (!url) return "#";
  const trimmed = url.trim();
  if (DANGEROUS_URL_SCHEMES.test(trimmed)) return "#";
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

export function validateFile(
  file: File,
  options: { allowedExtensions?: Set<string>; maxSize?: number } = {},
): string | null {
  const allowed = options.allowedExtensions ?? ALLOWED_FILE_EXTENSIONS;
  const maxSize = options.maxSize ?? MAX_FILE_SIZE;
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (!ext || !allowed.has(ext)) {
    return `Geçersiz dosya uzantısı. İzin verilen: ${Array.from(allowed).join(", ")}`;
  }
  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    return `Dosya boyutu ${maxMB}MB sınırını aşıyor.`;
  }
  return null;
}

export function validateCvFile(file: File): string | null {
  return validateFile(file, {
    allowedExtensions: CV_ALLOWED_EXTENSIONS,
    maxSize: MAX_FILE_SIZE,
  });
}

export function validatePresentationFile(file: File): string | null {
  return validateFile(file, {
    allowedExtensions: PRESENTATION_ALLOWED_EXTENSIONS,
    maxSize: ARGE_MAX_FILE_SIZE,
  });
}

/** A12: Ruhsat/lisans dosyası doğrulaması (pdf/jpg/png, 20MB). */
export function validateLicenseFile(file: File): string | null {
  return validateFile(file, {
    allowedExtensions: LICENSE_ALLOWED_EXTENSIONS,
    maxSize: MAX_FILE_SIZE,
  });
}

export function validateArgeFile(file: File): string | null {
  return validateFile(file, { maxSize: ARGE_MAX_FILE_SIZE });
}

/**
 * Hizmet talebi eki (G01).
 *
 * ⚠️ Uzantı seti, formdaki `accept=` niteliğiyle BİREBİR aynı olmalıdır. `accept`
 * yalnız DOSYA SEÇİCİYE VERİLEN BİR TAVSİYEDİR: kullanıcı "Tüm dosyalar"ı seçerek,
 * sürükle-bırakla ya da DOM'u düzenleyerek onu atlar. Gerçek denetim burada yapılır.
 * (Sunucu tarafı bucket kısıtı ayrı bir iştir ve onaya tabidir — G03.)
 */
const SERVICE_ATTACHMENT_EXTENSIONS = new Set(["pdf", "doc", "docx", "jpg", "jpeg", "png", "webp"]);
const SERVICE_ATTACHMENT_MAX_SIZE = 15 * 1024 * 1024;

export function validateServiceAttachment(file: File): string | null {
  return validateFile(file, {
    allowedExtensions: SERVICE_ATTACHMENT_EXTENSIONS,
    maxSize: SERVICE_ATTACHMENT_MAX_SIZE,
  });
}

/**
 * Dosya adını depolama anahtarı için güvenli hâle getirir (G01).
 *
 * ⚠️ Ham `file.name` doğrudan anahtara girerse kullanıcı adı denetler: `../` ile
 * dizin dışına çıkmayı deneyebilir, eğik çizgiyle sahte klasör açabilir, ya da çok
 * uzun/görünmez karakterli bir ad gönderebilir. Anahtar yalnız ASCII harf, rakam,
 * nokta, tire ve alt çizgi taşır.
 *
 * ⚠️ Nokta dizisi sadeleştirmesi AYRI bir korumadır ve mutasyonla doğrulanmıştır:
 * yol ayracı bölmesi `../../x` örneğini zaten çözer, bu satır AYRAÇSIZ adlardaki
 * `..` dizisini kapatır (kimi depolama arkayüzleri anahtarı ayrıca normalleştirir).
 */
export function safeStorageFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "dosya";
  const cleaned = base
    .replace(/\.{2,}/g, ".")
    .replace(/[^A-Za-z0-9._-]/g, "_")
    .replace(/^[._-]+/, "");
  const trimmed = cleaned.slice(0, 120);
  return trimmed === "" ? "dosya" : trimmed;
}

export function validateTitle(value: string): string | null {
  if (value.length > MAX_TITLE_LENGTH) {
    return `Başlık ${MAX_TITLE_LENGTH} karakterden uzun olamaz.`;
  }
  return null;
}

export function validateContent(value: string): string | null {
  if (value.length > MAX_CONTENT_LENGTH) {
    return `İçerik ${MAX_CONTENT_LENGTH} karakterden uzun olamaz.`;
  }
  return null;
}

const SUPABASE_ERROR_MAP: Record<string, string> = {
  "duplicate key value violates unique constraint": "Bu kayıt zaten mevcut.",
  "violates row-level security policy": "Bu işlem için yetkiniz yok.",
  "violates check constraint": "Girilen değerler geçersiz.",
  "value too long": "Girilen metin çok uzun.",
  "new row violates row-level security": "Bu işlem için yetkiniz yok.",
  "could not find": "Kayıt bulunamadı.",
  "jwt expired": "Oturumunuz sona erdi. Lütfen tekrar giriş yapın.",
};

export function sanitizeError(error: unknown, fallbackMessage: string): string {
  if (!(error instanceof Error)) return fallbackMessage;
  const msg = error.message;
  for (const [pattern, userMsg] of Object.entries(SUPABASE_ERROR_MAP)) {
    if (msg.toLowerCase().includes(pattern.toLowerCase())) return userMsg;
  }
  return fallbackMessage;
}
