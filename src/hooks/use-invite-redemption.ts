// M13 · Davet kodu tüketimi — oturum açıldığında bir kez.
//
// Akış: ziyaretçi `/?davet=KOD` ile gelir → `captureInviteCarrier` kodu
// localStorage'a alır (OAuth redirect query'yi düşürebilir) → kullanıcı kayıt
// olur / giriş yapar → `user` dolu gelince taşıyıcı OKUNUR+SİLİNİR ve
// `redeemInviteCodeSafely` çağrılır.
//
// 🔴 KAYIT AKIŞI KUTSALDIR (M13 tuzağı): redeem fire-and-forget'tir — hata
// fırlatmaz, bekletmez, UI'ı bloklamaz. Davet bir BONUS; yeni üye girişi
// davet yüzünden ASLA düşemez.
// ⚠️ İdempotans SQL'de (M11: invited_user_id UNIQUE + already:true) — hook
// her oturum açılışında koşabilir, taşıyıcı yoksa no-op'tur.
// ⚠️ "Yeni kullanıcı" ayrımı YAPILMAZ (OAuth'ta güvenilir değil): mevcut üye
// de davet linkiyle gelirse kod bir kez denenir — SQL bir üyeyi ömür boyu
// BİR kez sayar, kötüye kullanım yüzeyi yok (karar M13).
import { useEffect } from "react";

import { useAuth } from "@/components/auth/useAuth";
import { captureInviteCarrier, redeemInviteCodeSafely, takeInviteCarrier } from "@/lib/invites-api";

export function useInviteRedemption(): void {
  const { user } = useAuth();

  // 1) Taşıyıcıyı yakala — her mount'ta (davet linki herhangi bir oturumda
  //    açılabilir; kod yoksa no-op).
  useEffect(() => {
    captureInviteCarrier(window.location.search);
  }, []);

  // 2) Oturum kurulunca tüket — fire-and-forget (await YOK, throw YOK).
  useEffect(() => {
    if (!user) return;
    const code = takeInviteCarrier();
    if (!code) return;
    void redeemInviteCodeSafely(code);
  }, [user]);
}
