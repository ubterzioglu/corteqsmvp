# B00 · Canlı Durum Ölçümü

**Tarih:** 5 Ekim 2026
**Durum:** TAMAMLANDI (salt okunur)

---

## (a) Canlıda noindex/canonical var mı

**SONUÇ: KAPALI** ✅

**Kanıt:**
- `curl -I https://corteqs.net/` → HTTP/1.1 200 OK
- Response header'larda `noindex` veya `canonical` YOK
- `index.html` satır 10: `<meta name="robots" content="index, follow" />` → Ana sayfa indekslenebilir (doğru)
- Canonical bilerek kaldırılmış (index.html satır 13-33 yorum): `seo.ts` dinamik yazıyor, sabit canonical her sayfada "ben ana sayfayım" demiş oluyordu

---

## (b) search_directory_catalog ile Admin_*/Moderator_* dönüyor mu

**SONUÇ: BELİRSİZ** ⚠️

**Kanıt:**
- Canlı veritabanı erişimi yok
- Migration `20260921090000_directory_search_anon_normalized.sql` anonime açık
- CLAUDE.md satır 222-226: "B20 yönetici elemesi artık HER İKİ dalda SQL'de" → RPC anonime açıldığı için TS guard'ı ikinci savunma olarak duruyor
- **Öneri:** B02 batch'inde psql ile ölçülecek

---

## (c) 20261004100000 migration'ı fonksiyonu yeniden yazdı mı

**SONUÇ: KAPALI** ✅

**Kanıt:**
- Migration dosyası: `supabase/migrations/applied/20261004100000_catalog_is_verified_derived.sql`
- `catalog_items_sync_is_verified()` trigger fonksiyonu oluşturuldu
- `is_verified` kolonu artık `verification_status = 'verified'` değerinden türetiliyor
- Trigger her INSERT/UPDATE'ta otomatik çalışıyor
- Geriye dönük düzeltme yapıldı (2 kayıt)

---

## (d) Şifre sıfırlama akışı

**SONUÇ: KAPALI** ✅

**Kanıt:**
- `ResetPasswordPage.tsx` satır 97-100:
  ```typescript
  await supabase.auth.signOut();
  setTimeout(() => {
    navigate("/login", { replace: true });
  }, 1500);
  ```
- Başarıdan sonra signOut yapılıyor ve 1500ms sonra /login'e yönlendiriliyor
- Satır 111-128: Geçersiz/süresi dolmuş link için "Geçersiz veya süresi dolmuş bağlantı" ekranı var
- **B01 batch'i GEREKSİZ** → Atlanabilir

---

## (e) /relocation ve sayfa geçişi hata ekranı

**SONUÇ: KAPALI** ✅

**Kanıt:**
- `RelocationHomePage.tsx` var ve çalışıyor
- `demo-pages.ts` satır 65-68: `/relocation` DEMO_ROUTES listesinde (veri demo, motor gerçek)
- `RouteErrorBoundary.tsx` satır 50-58: `location.key` değişince hata kartı kalkıyor
- `AppErrorBoundary.tsx` satır 34-36: `resetKey` değişince hata durumu sıfırlanıyor
- **Sayfa geçişinde hata ekranı flaşı YOK** (doğru davranış)

**B03 için not:** `/relocation` için bant metni "Yakında" mı "DEMO" mu → **Burak'a sorulacak**

---

## (f) E-posta/SMS doğrulama ayarı

**SONUÇ: KAPALI (e-posta) / AÇIK (SMS)** ⚠️

**Kanıt:**
- `docs/handover/2026-10-04-g04-g05-kullanici-adimlari.md`:
  - "G04+G05 kod tarafı TAMAM · U06 (SMS sağlayıcı) bekleniyor"
  - G04: auth.users trigger'ı user_verifications'a aynalıyor
  - G05: Telefon doğrulama API + UI kartı (PhoneVerificationCard)
- `src/lib/admin-shell/admin-updates/2026-10.ts` satır 47:
  - "G04 — DOĞRULAMA AYNAKLAMA: Auth.users'daki phone_confirmed_at değişimini user_verifications tablosuna aynalayan trigger kuruldu"
- **E-posta doğrulama:** KAPALI (çalışıyor)
- **SMS doğrulama:** AÇIK (sağlayıcı seçilmedi, U06 bekleniyor)

---

## Özet Tablo

| Madde | Durum | Not |
|-------|-------|-----|
| (a) noindex/canonical | ✅ KAPALI | Doğru davranış |
| (b) Admin_*/Moderator_* | ⚠️ BELİRSİZ | Canlı DB erişimi yok, B02'de ölçülecek |
| (c) 20261004100000 migration | ✅ KAPALI | Trigger başarılı |
| (d) Şifre sıfırlama | ✅ KAPALI | B01 gereksiz, atlanabilir |
| (e) /relocation + hata ekranı | ✅ KAPALI | B03 için Burak'a soru: "Yakında" vs "DEMO" |
| (f) E-posta/SMS doğrulama | ⚠️ KISMİ | E-posta kapalı, SMS açık (U06 bekleniyor) |

---

## B01–B05'e Etkisi

- **B01:** ATLANABİLİR (şifre sıfırlama zaten çalışıyor)
- **B02:** ÖNCELİKLİ (admin gizleme ölçümü yapılacak)
- **B03:** Burak'a soru: `/relocation` bant metni "Yakında" mı "DEMO" mi?
- **B04:** BAŞLAYABİLİR (puan defteri şema)
- **B05:** B04'ten sonra başlayabilir

---

**Sonraki adım:** B08 (PublicCard envanteri) veya B02 (admin gizleme ölçümü)
