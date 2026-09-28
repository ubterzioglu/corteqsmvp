// Servis anahtarıyla çalışan (RLS'i atlayan) toplu iş fonksiyonları için çağıran denetimi.
//
// ⚠️ Neden gerekli: `verify_jwt` TEK BAŞINA yetki denetimi DEĞİLDİR. Ağ geçidi yalnız
// imzası geçerli bir JWT arar ve **anon anahtarı da geçerli bir JWT'dir** — o anahtar
// frontend paketinde herkese açıktır. Yani `verify_jwt = true` olan bir fonksiyona
// internetteki herkes ulaşabilir. `service_role` istemcisiyle veri okuyan bir fonksiyon
// bu yüzden kendi içinde ayrıca çağıranı doğrulamak zorundadır.
//
// İki meşru çağıran vardır:
//   1. Makine (pg_net / pg_cron)  → `x-dispatch-secret` başlığı
//   2. Yönetici (panel butonu)    → geçerli admin JWT'si (`getUser` + `is_admin` RPC)
// İkisi de yoksa 401.
//
// ⚠️ `send-notification-emails` bu mantığın KENDİ yerel kopyasını taşır. Oradaki kopya
// bilerek dokunulmadan bırakıldı: çalışan ve canlıya deploy edilmiş bir fonksiyonu
// yalnız birleştirme uğruna yeniden deploy etmek gereksiz risktir. Birleştirme ayrı bir
// batch'in işidir — bu dosyayı değiştirirsen oradaki kopyaya da bak.

/** Uzunluk sızdırmayan sabit zamanlı karşılaştırma. */
export function secretsMatch(provided: string | null, expected: string | undefined): boolean {
  if (!provided || !expected) return false;
  const a = new TextEncoder().encode(provided);
  const b = new TextEncoder().encode(expected);
  if (a.length !== b.length) return false;

  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

/**
 * `resolveAdminOrSecretCaller`'ın ihtiyaç duyduğu en dar istemci yüzeyi.
 * supabase-js'in tamamı yerine bunu istemek testin sahte istemci verebilmesini sağlar.
 */
// ⚠️ Dönüş tipleri bilerek `PromiseLike`: supabase-js'in `rpc()`'si gerçek bir `Promise`
// DEĞİL, thenable bir sorgu kurucusu döndürür. `Promise` yazmak deploy anındaki Deno tip
// denetiminde hata verir — burada patlamaz, CI'da da görünmez, yalnız deploy düşer.
export interface AdminAuthClient {
  auth: {
    getUser(token: string): PromiseLike<{
      data: { user: { id: string; email?: string | null } | null } | null;
      error: unknown;
    }>;
  };
  rpc(name: string, params: Record<string, unknown>): PromiseLike<{ data: unknown; error: unknown }>;
}

export interface EdgeCaller {
  authorized: boolean;
  /** Secret'la gelen makine çağrılarında null — onların "kendi kullanıcısı" yoktur. */
  adminUserId: string | null;
}

const DENIED: EdgeCaller = { authorized: false, adminUserId: null };

/**
 * Header secret'i VEYA admin JWT'si. İkisi de yoksa yetkisiz döner.
 *
 * ⚠️ `is_admin` RPC'si hata döndürürse çağıran REDDEDİLİR. Hatayı "yetkili" saymak
 * RPC'nin düştüğü anda kapıyı ardına kadar açardı.
 */
export async function resolveAdminOrSecretCaller(
  request: Request,
  admin: AdminAuthClient,
  expectedSecret: string | undefined,
): Promise<EdgeCaller> {
  if (secretsMatch(request.headers.get("x-dispatch-secret"), expectedSecret)) {
    return { authorized: true, adminUserId: null };
  }

  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return DENIED;

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData?.user) return DENIED;

  const { data: adminFlag, error: adminError } = await admin.rpc("is_admin", {
    uid: userData.user.id,
  });
  if (adminError || adminFlag !== true) return DENIED;

  return { authorized: true, adminUserId: userData.user.id };
}
