# Devir Notu — Admin Panel Günlüğü, Mail, Workshop Panosu, OAuth Planı (2026-08-03)

> Bu oturumda yapılanların dökümü. Yeni bir oturum bu notu okuyup nerede kaldığını
> anlayabilir. Kronolojik sıradadır.

## 1. Son 2 günün işleri kontrol edildi

Git geçmişi (31 Temmuz–2 Ağustos) ve `docs/cadde-300/frontend-devir-notu-2026-08-02.md`
karşılaştırıldı. 3 tamamlanmış iş admin panelindeki güncelleme listesinde (`admin-updates.ts`)
hiç yoktu:
- Taşınma araçlarındaki 1-5 slider → radyo buton (`95bcd6c`)
- Meslek/Maaş aracı UX iyileştirmesi (`7d8aa32`)
- Komuta Merkezi tamamlanan-görevler akordiyonu (`4a6d112`)

## 2. Admin paneli güncellendi

- `src/lib/admin-shell/admin-updates.ts`: yukarıdaki 3 iş için günlük dilde, mevcut anlatı
  tonuna uygun 3 yeni kayıt eklendi.
- `src/lib/admin-shell/admin-todos.ts` (Yapılacaklar kartı):
  - Çözülmüş "kafe ikonu seç" maddesi kaldırıldı (karar verilip F11'de uygulanmıştı).
  - "Login'li QA turu" ve "pano yapıldı çevirisi" maddeleri F1-F23 sonrası büyüyen kapsama
    göre güncellendi (44 madde, yeni özellik listesi).
  - Yeni bulgular eklendi: Coolify deploy birikti (kritik), meslek/maaş migration'ının
    canlıya uygulanıp uygulanmadığı belirsiz, taşınma araçları sonuç butonlarının
    "Yakında" kilidine sessizce geri alınması (karar gerektiriyor).
- Testler (`admin-todos.test.ts`) ve `npm run verify:text` her adımda çalıştırıldı, temiz.

## 3. Mail gönderildi

- `npm run sync:admin-updates` ile 3 yeni kayıt `notification_email_outbox` kuyruğuna yazıldı.
- Saat 18:00 Europe/Berlin'i geçtiği için otomatik günlük özeti beklemek yerine
  `send-notification-emails` Edge Function'ı `x-dispatch-secret` header'ıyla elle
  tetiklendi (`{"force":true}`). Sonuç: `processed:3, sent:3, failed:0`.

## 4. Commit + push

- `2da5024` — `docs(admin): log Aug 2 relocation/command-center work, refresh Yapilacaklar`
  dalına (`is-bulma-olasiligi`) push'landı.
- **Önemli:** bu branch sonradan `main`'e merge edildi (`8b186b1`) ve main üzerinde başka
  bir oturum/ajan tarafından ek işler yapıldı: `ee30411` (meslek havuzu 5→68), `384248e`,
  `5e5710d`, `f3710be`, `a1c62a4`, `60b4b11` (/tools sayfası görsel cila + kök temizliği).
  Bu iş bu oturumun ürünü DEĞİL — sadece güncel duruma dikkat çekmek için not edildi.
  Şu an aktif branch `main`.

## 5. Cadde Workshop Panosu (`/admin/workshop/cadde`) UBT tarafı işaretlendi

- Sorgu: pano tamamen boştu (48/48 madde işaretsiz, hem UBT hem Burak).
- `docs/cadde-300/frontend-devir-notu-2026-08-02.md`'deki "44 madde bitti" listesiyle
  eşleştirilip canlı DB'de `UPDATE ... set ubt_done = true, ubt_done_at = now()` çalıştırıldı
  (item_no 1-27, 29-32, 35-47 — 44 madde).
- Bilinçli dışarıda bırakılanlar: m28 (footer, kullanıcının alanı), m33/m34 (telefon-bazlı
  erişim, park), m48 (sıradaki Profil Workshop notu).
- Burak tarafına dokunulmadı. Doğrulama: `ubt_done_count=44, still_open=28,33,34,48`.

## 6. Google OAuth ekranı — Custom Domain planı

Kullanıcı bir ekran görüntüsü paylaştı: Google ile giriş yapan üyeler onay ekranında
`injprdrsklkxgnaiixzh.supabase.co uygulamasında oturum açın` görüyor.

- Supabase resmi dokümanı (`supabase.com/docs/guides/platform/custom-domains`) çekilip
  doğrulandı: Custom Domain Pro plana dahil değil, ayrı ücretli add-on (Settings → Add-ons).
- Tam 12 adımlık plan yazıldı: `docs/operations/2026-08-02-supabase-custom-domain-google-oauth.md`
  (DNS CNAME+TXT → `supabase domains create/reverify/activate` → Google Cloud Console'a yeni
  callback → Coolify'daki `VITE_SUPABASE_URL`'i değiştirip deploy). Kod değişikliği gerekmiyor.
- Subdomain adı henüz KARARLAŞTIRILMADI (öneri `auth.corteqs.net`).
- Hatırlatma olarak üç yere not düşüldü: dosya (yukarıdaki), `admin-todos.ts`
  (`20260802-supabase-custom-domain-google-ekrani` — **henüz commit'lenmedi**), ve Claude'un
  kendi memory sistemi (`project_supabase_custom_domain_google_oauth_2026_08_02.md`).
- Bu iş için hiçbir adım fiilen başlamadı (add-on bile açılmadı).

## 7. Şu anki durum (bu notun yazıldığı an)

- Branch: `main`, en son commit `60b4b11`.
- Uncommitted: `src/lib/admin-shell/admin-todos.ts` (Custom Domain hatırlatma maddesi) —
  push'lanmadı, onay bekliyor.
- `/tools` sayfasının "beautify" (görsel cila) çalışması git'te var ama **Coolify'a henüz
  deploy edilmedi** — kullanıcının paylaştığı ekran görüntüsü bu yüzden eski/sade görünüyor,
  bu bir hata değil, deploy'un henüz yapılmamış olmasının doğal sonucu.

## 8. Kalan işler

**Kullanıcıda (login / dış sistem / karar):**
- Coolify deploy — bugüne kadarki hiçbir iş (Cadde F1-F23, relocation/komuta merkezi
  düzeltmeleri, /tools görsel cila, meslek havuzu genişletmesi) canlıda görünmüyor.
- Login'li QA turu (Cadde yeni özellikler + Komuta Merkezi akordiyonu).
- Hoş geldin maili anahtarı (örnek gönder + göz kontrolü + aç).
- Taşınma araçları sonuç butonları kararı (linkli mi, "Yakında" mı kalsın).
- Google OAuth Custom Domain planının uygulanması (bkz. §6) — DNS, add-on, Google Console,
  Coolify env değişikliği.
- Footer m28 sadeleştirmesi (kullanıcının alanı).

**Claude yapabilir (onayla):**
- Bu oturumdaki `admin-todos.ts` değişikliğini commit + push.
- Meslek/Maaş migration'ının (`20260802143000_profession_salary_question_ux.sql`) canlıda
  olup olmadığını kontrol et — NOT: `ee30411` commit'i meslek havuzunu 68'e çıkardığı için bu
  bulgu artık BAYAT olabilir, tekrar kontrol gerekir.
- QA turu bitince revizyon panosunu ve workshop panosunun Burak/UBT ortak "bitti" durumunu
  güncelle.
