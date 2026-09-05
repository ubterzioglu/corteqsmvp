# Profil Workshop WS1 (Batch B) + istemci hata kayıtları — devir notu

**Devir tarihi:** 5 Eylül 2026
**Öncül:** `docs/handover/2026-09-04-t19-profil-workshop-ve-tip-borcu.md`
**Dal:** `main` · **Plan:** `~/.claude/plans/twinkling-leaping-popcorn.md` (Batch B)

## Kısa sonuç

Profil Workshop WS1'in **26 maddesinden 8'i** kapatıldı ve panoda UBT kutusundan
işaretlendi. İki migration canlıda; `check:migrations` → **381 dosya / 381 kayıt, sapma yok**.
Testler **1.768 geçti** (öncesi 1.721 — 47 yeni test), ESLint 0 problem, `tsc` 22 (taban
çizgisi korundu, artmadı).

✅ **Deploy CANLIDA ve doğrulandı** (5 Eylül 18:22 GMT, commit `c5d2dee` push'undan sonra
Coolify webhook'u kendiliğinden çalıştı). Kanıt — canlı paketten string araması:
`ProfilePage-C84MS-eA.js` içinde "Telefonu Kaydet" / "Tavsiye edilir" / "Profil tipi" **var**;
`AdminClientErrorsPage-BedLEkLI.js` chunk'ı ve `client-errors` rotası **var**;
`WelcomeActivatePage` içinde "nereden buldunuz" **yok**; `/` adresinde 6 güvenlik başlığı
(CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS, Permissions-Policy) **var**.

⚠️ Doğrulama **paket metnine** dayanır, gerçek kullanıcı akışına değil. Gözle kontrol
kalan: `/profile` telefon satırı, `/admin/client-errors` ekranı, `/admin/workshop/cadde`
onay kuyruğu filtresi.

---

## 1) Kapatılan maddeler (panoda UBT ✓, `burak_done` dokunulmadı)

| # | Madde | Kanıt |
|---|---|---|
| 1 | Telefon en üste, ilk kutuya | `ProfilePhoneField.tsx` + `profile-phone.ts`; mig `20260904200000` → 78 role kural |
| 2 | Profil tipi net görünsün | Premium hero + legacy hero "Profil tipi:" çipi + (i); Profil Durumu kartına satır |
| 3 | Rozetlerin yanına bilgi (i) ikonu | `ProfileInfoTip.tsx`, 3 rozete `info` metni |
| 4 | "Bizi nereden buldunuz?" kaldır | 10 dosyadan çıkarıldı; attribute `is_active=false` |
| 5 | İlgi alanları public | mig: 82 rolde `user_can_hide=false`; kart anahtar yerine rozet |
| 6 | LinkedIn opsiyonel ama tavsiye | Kartta "Tavsiye edilir" rozeti + gerekçe |
| 10 | Ülkeyi telefon kodundan türetme | `phone-country-derivation.test.ts` sözleşme testi |
| 26 | Burak'ın admin yetkisi | mig `20260903130000`, commit `91d6247` (3 Eylül) |

**Madde 9 bilinçli olarak işaretlenmedi.** Ülke/şehir gerçekten seçimle alınıyor, ama
maddenin ikinci yarısı ("hangi diasporadan geldiği") karşılanmıyor: `diaspora_key`
istemcide `?? "tr"` ile sabitleniyor (`cadde-api.ts:710`, `:944`; `cadde-carsi-api.ts:230`)
ve ülkeden türetilmiyor. Yarısı duran maddeyi tam saymak panoyu yanıltır.

## 2) En değerli bulgu: telefon alanı canlıda HİÇ ÇİZİLMİYORDU

`phone` attribute'u `afs_attributes`'ta tanımlıydı, **116 üyenin kayıtlı numarası vardı**,
ama hiçbir rolde `role_attributes` kuralı yoktu (ölçüm: 0 satır). `get_current_user_profile`
yalnız kuralı olan alanları döndüğü için form bu alanı hiç göstermiyordu — yani "telefonu
en üste al" bir yer değiştirme işi değil, **yok olan bir alanı var etme** işiydi.

**Kural (CLAUDE.md'ye yazıldı):** yeni profil alanı = migration'da TÜM aktif rollere kural.
Kural yoksa kod canlıda sessizce görünmez, test de bunu yakalamaz.

### İkinci tuzak: `user_can_hide=false` beklenenin tersini yapar

`update_profile_attribute`, `user_can_hide=false` iken `'public'` DIŞI görünürlüğü `42501`
ile reddediyor. Yani bayrak "gizlenemez" değil **"her zaman public"** demek. Telefonu
`user_can_hide=false` ile kilitlemek RPC'nin private yazmayı reddetmesine yol açardı.
Çözüm: `user_can_hide=true` + her yazımda açık `'private'`; gerçek gizlilik garantisi
`afs_attributes.storage_strategy='private_storage'`tan geliyor (public sayfa RPC'si bu
stratejiyi zaten eliyor).

## 3) m134 için kalıcı kanıt altyapısı (yeni)

Öncül notta m134 ("yorum yazınca sayfa hataya geçiyor") *tekrar üretilemedi, kök neden
bulunamadı* diye kapanmıştı; sebebi **yazma hatalarının hiçbir yere yazılmaması**ydı.

- Yeni tablo `public.client_error_reports` + `report_client_error` RPC (mig `20260904210000`).
  RLS: yalnız admin SELECT; yazma yalnız RPC (authenticated, saatte 30/kullanıcı).
- Tek istemci girişi `src/lib/client-error-reports.ts` — `caddeWriteError`, `caddeReadError`,
  `AppErrorBoundary`, `SectionErrorBoundary` buraya bağlandı.
- **Payload gönderilmiyor:** yalnız `message/code/details/hint`, rota (`pathname`), user-agent.
- Fren: 60 sn dedupe + sayfa başına 20 + RPC'de saatlik 30; 90 gün saklama (pg_cron).
- Okuma ekranı: `/admin/client-errors` (Roller ve Yetkiler menüsü), kaynak + metin filtresi.

**Sonraki adım:** deploy sonrası m134'ü bildiren kullanıcıdan tekrar denemesini iste;
hata artık `/admin/client-errors` ekranında ham Postgres kodu ve bileşen yığınıyla görünür.

## 4) Workshop panosuna onay kuyruğu filtresi

Cadde panosunda **65 madde** "UBT ✓, Burak bekliyor" durumundaydı ve bunu süzmenin yolu
yoktu (durum filtresi yalnız açık/tamam ayırıyordu). Eklenenler:

- `filterWorkshopItems` → `burak_pending` / `ubt_pending` durumları
- Pano filtresine "Burak onayı bekleyenler" / "UBT onayı bekleyenler"
- "Burak onayı" kartının ipucu satırı: kaç madde onu bekliyor (`progress.awaitingBurak`)

Canlı ölçüm (5 Eylül): cadde 36 tam · **65 Burak'ı bekliyor** · 24 hiç onay yok;
profil 8 UBT ✓ · 0 Burak · 18 hiç onay yok.

## 5) Giriş ekranı doğrulamaya hazırlandı (madde 7'nin kod yarısı)

`src/lib/auth-messages.ts`: `describeSignInError` (`email_not_confirmed` → Türkçe yönlendirme
+ "yeniden gönder", `invalid_credentials` → "E-posta veya şifre hatalı"), `describeSignUpResult`
(session geldiyse "giriş yapıldı"; boş `identities` → "zaten kayıtlı"; aksi hâlde "e-posta yolda").

**Neden anahtar çevrilmedi:** canlıda `mailer_autoconfirm=true` ve **özel SMTP yok**
(`smtp_host=null`, yerleşik gönderici saatte 2 e-posta). Doğrulama şimdi açılırsa kayıt olan
kullanıcı e-postayı alamaz ve giremez. Adım adım sıra ve geri alma yolu:
`docs/operations/2026-09-04-auth-dogrulama-yol-haritasi.md`.

## Açık kalanlar

1. **Coolify deploy** — bu turun kodu deploy bekliyor
2. **WS1-7** — Zoho SMTP + Türkçe şablon, sonra `mailer_autoconfirm=false` (runbook hazır)
3. **WS1-8/11** — SMS/WhatsApp OTP sağlayıcı kararı (altyapı hazır, `user_verifications` boş)
4. **WS1-9** — `diaspora_key` ülkeden türetilmiyor, `"tr"` sabit
5. **WS1-12** — eski üye kampanyası: `member_reactivation` event tipi + segment + içerik onayı
6. **Batch C/D** — WS1 13–25 (rol/etiket mimarisi, referans, paketleme); 13–16 şema kararı ister
7. **Burak'ın 65 maddelik onay kuyruğu** — artık panodan filtrelenebiliyor

## Bilinen tuzaklar (bu turda yaşananlar)

- **Migration parent dizinde bırakılırsa `check:migrations` sapma göstermez.** Bu turda iki
  migration bir süre parent'ta kaldı; `npm run migrate:apply` uygulayıp `applied/`'a taşıdı.
- **`.tsx` dosyasından bileşen dışı sembol export etmek lint uyarısı üretir**
  (`react-refresh/only-export-components`). `filterClientErrorReports` bu yüzden sayfadan
  `admin-client-errors-api.ts`'e taşındı; testi de yanına gitti.
- **State eklemeden handler yazmak testte "beklenen çağrı olmadı" gibi görünür.**
  `setUnconfirmedEmail` tanımsızken LoginPage render sırasında çöküyordu; hata mesajı
  `ReferenceError` değil "expected vi.fn() to be called 1 times, but got 0" idi.
- **Pano onayı forge edilmez:** `burak_done` asla ajans tarafından atılmaz; yalnız `ubt_done`
  ve yalnız kod kanıtıyla. Madde 9 örneğinde olduğu gibi, yarısı duran madde işaretlenmez.
