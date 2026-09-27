# A03a — Profil Workshop panosu ölçümü (27 Eylül 2026)

Pano: `/admin/workshop/profil` · Tablo: `workshop_items` (`workshop_key='profil'`, WS1).
Kaynak toplantı: 03.09.2026 "Profiller" (T19).

**Bu belge yalnız ÖLÇÜMDÜR — hiçbir şey değiştirilmedi.** Düzeltme migration'ı A03b'dir.

## Özet

| | |
|---|---|
| Toplam madde | **26** |
| İki onaylı ("bitti" sayılan) | **24** (m8 hiç onaysız, m25 yalnız UBT) |
| Ölçümle **çürüyen** onay | **6** → m11 · m12 · m14 · m15 · m22 · m23 |
| Ölçümle doğrulanan | 15 |
| Kod/DB'den ölçülemez (dış teslimat) | 3 → m19 · m24 · m25 |

⚠️ Plandaki "26 maddenin 25'i done" rakamı da bayattı: gerçek sayı **24**.

## Çürüyen onaylar (A03b'de geri alınacak)

### m11 · "E-posta **ve telefon** doğrulaması zorunlu olarak alınacak" — YANLIŞ

Canlı auth yapılandırması (Management API `/config/auth`):

- `mailer_autoconfirm = false` → e-posta doğrulaması **AÇIK** ✅
- `external_phone_enabled = false` → **telefon sağlayıcısı kapalı, telefon doğrulaması YOK** ❌

Madde iki koşulu birden istiyor; yalnız biri sağlanıyor. Ayrıca pano **kendi içinde
çelişiyor**: m8 ("Telefon doğrulaması profil akışına entegre edilecek") hiç onaylanmamış
durumda. Aynı işi m11 bitmiş, m8 bitmemiş gösteriyor.

### m12 · "Eski üyeleri yeni Gmail girişine yönlendiren e-posta akışı kurulacak" — YANLIŞ

`src`, `supabase/functions` ve `scripts` altında Gmail geçiş akışı aranınca **2 eşleşme**
çıktı, ikisi de alakasız yorum satırı (`send-notification-emails/index.ts:27` ve
`scripts/preview-emails.mjs:9` — Gmail'in HTML'i nasıl işlediğine dair uyarılar).
**Böyle bir e-posta akışı yok.**

### m14 · "Rol bazlı etiketleme: tek profil, aynı anda birden fazla unvan" — YANLIŞ
### m15 · "Rol başvurusu onaylananlara ek etiket eklenecek" — YANLIŞ

Canlı ölçüm (`user_role_assignments`): **171 satır, 171 benzersiz kullanıcı** →
birden fazla rolü olan kullanıcı sayısı **0**. Şema kullanıcı başına **tek rol**
tutuyor (PK `user_id`). Çoklu rol yol haritasında 1–2 ay ertelenmiş durumda (X bölümü).

Rol başvurusu akışı (`src/lib/profile-requestable-features.ts`) kullanıcıya **ek unvan
değil, ÖZELLİK (feature)** veriyor — Rehber Görünürlüğü, WhatsApp Yayınlama, Etkinlik
Oluşturma gibi. Bu m15'in istediği şey değil.

### m22 · "Paketler ödeme (checkout) adımına bağlanacak" — YANLIŞ
### m23 · "…yetkiler tekil fiyat yerine abonelik paketiyle sunulacak" — YANLIŞ

Kodda gerçek ödeme yok. `checkout` araması **2 eşleşme** veriyor, ikisi de aynı
göstermelik bileşene ait: `src/components/ServiceRequestForm.tsx:20,438` →
`MockStripeCheckout`. Kaynak dosyanın kendi yorumu: *"Göstermelik hizmet talebi başvuru
ücreti (demo Stripe ödemesi)"*.

m23'teki üç yetki (etkinlik oluşturma · WhatsApp gösterme · teklif verme) bugün
**ücretsiz talep akışıyla** veriliyor ("talep bırak"), abonelikle değil.

Karar bağlamı: K05'te abonelik 01.01.2027, Kurucu 1000 99 EUR — yani bu maddeler
**henüz yapılmamış olması BEKLENEN** işler; hata panodaki onayda.

## Ölçümle doğrulananlar (dokunma)

| # | Madde | Kanıt |
|---|---|---|
| m1 | Telefon formda en üste | `role_attributes.sort_order`: `phone`=**5**, `full_name`=10 → ilk kutu ✅ |
| m3 | Rozet yanında bilgi ikonu | `ProfilePhoneField` · `ProfileLegacyHeroCard` · `PremiumProfileHero` içinde Badge+Tooltip |
| m4 | "Bizi nereden buldunuz?" kaldırıldı | `afs_attributes` `referral_source.is_active=**false**`; veri silinmemiş (CLAUDE.md ile uyumlu) |
| m5 | İlgi alanları public, gizlenemez | `interests`: **82/82** kuralda `user_can_hide=false` **ve** `is_public=true` |
| m7 | E-posta doğrulaması aktif | `mailer_autoconfirm=false` · SMTP `smtp.zoho.eu` · gönderen `info@corteqs.net` — **27.09'da açıldı, onay artık DOĞRU** |
| m10 | Ülke telefon kodundan türetilmeyecek | `src/lib/phone-country-derivation.test.ts` kaynak ağacını tarayıp kilitliyor |
| m17 | Referans kodu ilk giriş ekranından kaldırıldı | `src/components/auth/**` içinde referans alanı yok |
| m18 | Referans eşleştirmesi giriş sonrası | `ProfilePage.tsx` · `WelcomeActivatePage.tsx` içinde |
| m21 | Özellikler iki pakete ayrıldı | `REQUESTABLE_FEATURES` ("Başvurular & Erişimler" kartı) varsayılan özelliklerden ayrı |

Ayrıca ölçülen bağlam rakamları: **roller 82 toplam / 78 aktif** · `phone` kuralı
**78 aktif rolün 78'inde** enabled (CLAUDE.md'nin "alan hiç çizilmiyordu" kusuru kapalı).

## Kod/DB'den ölçülemeyenler

m19 (referans kural kitapçığı yazılacak) · m24 (Google Auth rehberi Burak'a iletilecek) ·
m25 (toplantı notları Burak'a gönderilecek) — bunlar **dış teslimat**; repoda kanıtı
olmayabilir. m25 zaten yalnız UBT onaylı. **A03b'de bunlara dokunma**, sahibi doğrulasın.

## ⚠️ Yöntem notu

`afs_attributes` ve `role_attributes` sütun adları tahmin edilerek sorgulanırsa
PostgREST `42703` ile düşer. Gerçek adlar: `afs_attributes.key` (`attribute_key` DEĞİL),
`role_attributes.role_id` + `attribute_id` (`role_key` DEĞİL).

Ayrıca PowerShell'den REST'e giderken `-UserAgent` vermezsen Supabase isteği
*"Forbidden use of secret API key in browser"* ile reddeder — varsayılan ajan kimliği
tarayıcı gibi görünüyor.
