// Oturum kurulumunda okunan profil verisi — AuthProvider'ın veri katmanı (A04b).
//
// Bu sorgular 13.09.2026'ya kadar AuthProvider bileşeninin İÇİNDE duruyordu ve
// B6 ("karışık veri çekme") borcunun son iki kalemiydi. Bileşen artık ince bir
// sarmalayıcı; tablo bilgisi burada.
//
// ⚠️ Davranış `src/components/auth/AuthProvider.test.tsx` tarafından kilitlenmiştir
// (mock Supabase istemcisine kuruludur). Buradaki tablo adlarını, select
// dizelerini veya nitelik anahtarlarını değiştirmek o testleri düşürür — testi
// gevşetme, değişikliğin bilinçli olduğunu doğrula.
import type { Profile } from "@/components/auth/auth-context";
import { supabase } from "@/integrations/supabase/client";

/**
 * Oturum açılışında okunan profil nitelikleri.
 *
 * Liste doğrudan sorgunun `.in()` filtresine gider. Buraya anahtar eklemek
 * YETMEZ: alanın ilgili rollerde `role_attributes` kuralı da olmalıdır, yoksa
 * `get_current_user_profile` onu hiç döndürmez ve alan canlıda sessizce boş kalır
 * (telefon alanı tam olarak bu yüzden aylarca çizilmedi).
 */
export const AUTH_PROFILE_ATTRIBUTE_KEYS = ["full_name", "avatar_url", "phone"] as const;

/**
 * Bir kullanıcının profil niteliklerini ve rolünü okur.
 *
 * İki sorgu paralel koşar. Rol sorgusu `maybeSingle` kullanır çünkü
 * `user_role_assignments` birincil anahtarı `user_id`'dir — kullanıcı başına
 * EN FAZLA BİR rol satırı vardır (ölçüm 27.09.2026: 171 satır / 171 kullanıcı).
 * Çoklu rol geldiğinde burası da, çağıran da değişmelidir.
 */
export async function fetchAuthProfile(userId: string): Promise<Profile> {
  const [attrsResult, roleResult] = await Promise.all([
    supabase
      .from("user_profile_attributes")
      .select("value_text, afs_attributes!inner(key)")
      .eq("user_id", userId)
      .in("afs_attributes.key", [...AUTH_PROFILE_ATTRIBUTE_KEYS]),
    supabase
      .from("user_role_assignments")
      .select("roles!inner(key)")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const attrs = attrsResult.data ?? [];
  const getValue = (key: string) =>
    attrs.find((attribute) => attribute.afs_attributes?.key === key)?.value_text ?? null;

  return {
    full_name: getValue("full_name"),
    avatar_url: getValue("avatar_url"),
    phone: getValue("phone"),
    account_type: roleResult.data?.roles?.key ?? null,
    // Onboarding'in tek ölçütü ad alanının dolu olmasıdır — başka bir sinyal yok.
    onboarding_completed: Boolean(getValue("full_name")),
  };
}
