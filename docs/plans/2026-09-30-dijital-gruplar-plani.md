# Dijital Gruplar Motoru — Uygulama Planı (G01–G25)

> Tarih: 2026-09-30 · Durum: onaya sunuldu
> Kaynak paket: `docs/dijital-gruplar/` — politika v1.1 + motor tasarımı (G01'de taşınır)
> Tanıtım ve prompt dosyaları pakette kalır (`03`–`07`). İlgili: **#REV-056** · **K08** · **T22**

## Bağlam — bu iş neden yapılıyor

Toplantı talebi: *"WhatsApp grubu ekleme özelliği için platform politikası yaz. Grup admini
olmayanların gönderisinin moderasyona düşeceğini netleştir. Yayına alınacak gruplarda kalite ve
güvenlik kriterlerini belirle."* Politika (v1.1) ve motor tasarımı yazıldı; bu plan onların
**kod karşılığının** sıralı, küçük batch'lere bölünmüş hâlidir.

Ana fikir (politika): **"Linkini saklama, kapını paylaş."** Admin ham davet linki yerine CorteQS
grup sayfasını paylaşır; katılmak isteyen kimliğini doğrular, admin onaylar, spam kapıda kalır.

Bugün canlıda **10 grup** var, hepsi `approved`, hepsi sahipsiz, hiçbirinin sağlık skoru yok.
Mevcut hâl bir *dizin*; hedef bir *motor*.

**KALANLAR bağlantıları:** bu plan **K08**'i ("5 grup karar mesajı: grup ekleme politikası ·
onay akışı · form alanları · şehir grupları · ekleme çağrısı") cevaplıyor, **X** bölümündeki
*"WhatsApp grupları sayfası (T22)"* maddesini devralıyor ve **K02**'nin (SMS sağlayıcısı)
uygulama tarafını G04–G05'e bağlıyor.

---

## M0 Keşif — 2026-09-30'da canlı ölçüldü

Paketin çalışma sırasındaki **M0 adımı fiilen tamamlandı.** Tasarımın §14'teki 5 sorusundan 4'ü
kapandı ve **tasarımın beş varsayımı çürüdü.** G01'e başlamadan önce bu tablo okunmalı.

| Tasarımın varsaydığı | Canlı gerçek |
| --- | --- |
| `whatsapp_link_requests` tablosu var (Soru 5) | ❌ **YOK.** Soru yanlış öncül üzerine kurulu. |
| `whatsapp_landing_comments` / `_likes` / `_follows` var | ❌ **ÜÇÜ DE YOK.** Politika §3 (grup sayfası gönderileri) **sıfırdan** yazılacak. |
| `site_settings` içine bayrak/kara liste konur | ❌ **Uygun değil.** Anahtar-değer tablosu DEĞİL: `id · brand_name · logo_url · favicon_url · email_header_html`, tek satır. Doğru desen **`cadde_settings`** → yeni `group_settings`. |
| "Seviye 2 doğrulanmış kuruluş" kavramı var | ❌ **YOK.** `trust_level` yalnız `radar_news_sources`'ta (haber kaynağı güveni). → **Karar 2: kurulacak.** |
| `send-phone-otp` / `verify-phone-otp` kullanılır | ❌ **Edge function YOK**, `user_verifications` **0 satır**, `auth.users`'da **0 telefon / 0 onaylı** → `is_phone_verified()` herkes için `false`. → **Karar 1: kurulacak.** |
| Şehir referans tablosu var mı? (Soru 3) | ✅ Var, ama **İKİ AYRIK katalog**: `geo_countries` 251 / `geo_cities` **76.992** (form besleyici) ve `cadde_countries` 23 / `cadde_cities` 59. CLAUDE.md bu ayrışmanın Cadde'de aylarca sessiz kusur ürettiğini belgeliyor. **`geo_*` kullanılacak.** |
| Zamanlanmış görevler nereden? (Soru 4) | ✅ **`pg_cron` + `pg_net` kurulu**, 6 aktif iş var. Yeni 6 görev buraya eklenir. |
| Davet sayfasından ad okunabilir mi? (Soru 1, 2) | ⏳ **Ölçülemez, denenmeli** → G08 spike. |
| 5 yeni `group_*` tablosu | ❌ Hiçbiri yok — beşi de yeni (tasarım da böyle diyor). |
| Roller kurulacak | ✅ **ZATEN VAR ve AKTİF (6 rol):** `Community_WhatsAppAdmin` · `Community_TelegramAdmin` · `Community_DiscordAdmin` · `Community_GroupAdmin` · `Community_SocialMediaAdmin` · `Organization_DigitalCommunity`. ⚠️ Rol varlığı yetmez — kuralı olmayan rol sessizce boş görür. |

### Canlıda ölçülen beş somut kusur

**K1 — Davet linki anonime TAMAMEN AÇIK.** `Anyone can view approved landings` politikası
`status='approved'` satırının **tüm kolonlarını** döner; `whatsapp_link` o satırda ve `NOT NULL`.
Tasarımın **kabul testi #5 bugün BAŞARISIZ.**

**K2 — Anonim herkes sınırsız grup ekleyebiliyor.** `Anyone can insert whatsapp landings`
politikası `{anon, authenticated}` için açık, `WITH CHECK` **yok**. "Günde 5 gönderim" sınırı yok.

**K3 — Mükerrer RLS politikaları.** `Anyone can view approved landings` ↔ `Public approved
whatsapp landings select` **birebir aynı**; `Users can view own landings` ↔ `Owners can select own
whatsapp landings` de aynı. 11 politikanın 2'si gereksiz.

**K4 — Veri politikaya uymuyor.**

| Sorun | Ölçüm |
| --- | --- |
| `platform` kolonu yok | 10 grubun hepsi `chat.whatsapp.com`. UI'da Telegram seçeneği var ([whatsapp-landing-options.ts](../../src/lib/whatsapp-landing-options.ts)) ama DB'de kaydedilecek kolon yok. |
| **2 grubun linki BOŞ** | `hcd-bilinc-...` ve `shaman-kocluk-...` → link kontrolü bunları hemen `link_dead` yapar. |
| Kategoriler uyuşmuyor | Canlı: `is` · `dayanisma` · `yatirim` · `akademik` · `alumni` · **`diger` (3 grup)**. Politika §5: *"'Diğer' kategorisi yoktur."* |
| Konum serbest metin | `country='Global'`, `city='Genel'` (6 grup). `is_global` kolonu yok. |
| Skor hiç yok | `group_score` kolonu VAR, 10 grubun tamamında `null`. |
| Kaldırılacak etiketler | `member_approved` + `admin_approved` kolonları duruyor. |

**K5 — Şema değişikliği bir trigger'ı etkiler.** `catalog_sync_whatsapp_landing_trigger`
landing'leri katalog item'a senkronluyor → G10'da birlikte güncellenir.

### Yeniden kullanılacak hazır temel (sıfırdan yazma)

| Mevcut | Ne için |
| --- | --- |
| `whatsapp_landing_editors` + **5 RPC** (`current_user_can_edit_whatsapp_landing`, `get_current_user_editable_whatsapp_landing`, `update_current_user_editable_whatsapp_landing`, admin grant/revoke) | **Sahip paneli** (tasarım §11) bunun üzerine kurulur |
| `whatsapp_join_requests` (`landing_id · user_id · full_name · email · phone · note`) | Faz 2 katılım isteği |
| **`user_verifications`** (`user_id · phone_e164 · phone_verified_at · phone_country_code`) | **OTP aynası — şema zaten doğru, sadece boş** |
| **`catalog_item_claims`** (`item_id · requested_by_user_id · claim_type · **evidence jsonb** · note · status · reviewed_by_user_id · reviewed_at`) | **Kurumsal doğrulama akışının birebir karşılığı** — yeni tablo gerekmez |
| `submission-documents` bucket (private, 50 MB) · toplam 23 bucket | Belge yükleme |
| `is_phone_verified(uid)` RPC | Hazır; **hiçbir RLS politikasında kullanılmıyor** (0 satır) → güvenle devreye alınır |

---

## Verilen kararlar

**Karar 1 — Telefon doğrulama (OTP) bu planın içinde kurulacak.**
Politika §8 aynen uygulanır: şikayet eşiği "7 günlük + telefonu doğrulanmış + farklı 3 hesap".
→ **G04–G05.**

> ⚠️ **Sende kalan iş (KALANLAR K02):** Bütçe **zaten kesinleşmiş** (20–25 €, T21) ve K02
> `sms_provider=twilio` "tanımlı ama kapalı" diyor. **Ama bu iddia yalnız KALANLAR.md'de geçiyor**
> — `supabase/config.toml` dosyasında **hiç `[auth]` bölümü yok**, yani Auth tümüyle Supabase
> panelinden yapılandırılıyor. G04'e başlamadan önce **panelden teyit et**: telefon sağlayıcısı
> gerçekten tanımlı mı, hangi sağlayıcı, kapalı mı. G04 kodu sağlayıcıdan bağımsız yazılır ama
> sağlayıcı açılmadan **uçtan uca doğrulanamaz.**

**Karar 2 — Gerçek kurumsal doğrulama seviyesi kurulacak.**
Kuruluşlar belge yükler, admin inceler, hesap "doğrulanmış kuruluş" olur. → **G06–G07.**

> ⚠️ **Kapsam uyarısı (kaydedildi, iş yapılacak):** Bu, dijital grupların ötesine geçer —
> ölçüldü: **267 kurumsal katalog kaydı** (`Organization_*` / `Community_*` rolleri) etkilenir.
> Doğrulama rozeti dizinde görünecekse dizin RPC'si ve arama belgesi de etkilenir. Plan bunu
> dijital gruplara **yetecek en küçük** hâliyle kurar (Seviye 0/1/2 + belge + admin incelemesi);
> tüm kurum profillerine yayılan rozet/filtre işi **ayrı plan** olarak X listesine yazıldı.

---

## Batch'ler

Her batch **ayrı oturumda**; kabul kriterleri yeşil olmadan sonrakine geçilmez (paketin kuralı).
[KALANLAR.md](../kalanlar/KALANLAR.md)'deki "Her batch'te zorunlu doğrulama" bloğu aynen geçerli.

**Tüm G batch'lerinde geçerli (tekrar yazılmayacak):**

- Migration akışı: yaz → dry-run → uygula → **`applied/` altına TAŞI**; zaman damgası tekrar
  kullanılmaz. Her batch **ayrı** migration dosyası.
- Şehir/ülke **`geo_*`** tablolarından gelir, `cadde_*`'tan DEĞİL. Serbest metin yok.
- Ayarlar `group_settings`'te; **kodda sabit yazılmaz** (`cadde_settings` deseni).
- `as TablesInsert<...>` CAST YASAK → `satisfies`. RPC hataları **düz nesne** —
  `instanceof Error` ile daraltma; `code`/`details`/`hint` oku.
- Yeni `src/lib/**` dosyası → `npm run ingest:tools`, üretilen dosyalar commit'e dahil.
- ⚠️ **1 GB RAM:** `geo_cities` 76.992 satır. Satır başına fonksiyon uygulayan sorgu YASAK —
  önce `select distinct`, sonra join.

### Faz A — Zemin ve canlı güvenlik açıkları (K1/K2 şu an canlıda açık)

**G01 · Paket dosyalarını repoya al + CLAUDE.md eki** · kod yok, migration yok

- `01_politika_v1.1.md` + `02_motor-tasarimi.md` → `docs/dijital-gruplar/`.
- `03`'teki **Ortak bağlam** bölümü → `CLAUDE.md`'ye "Dijital Gruplar" bölümü, **yukarıdaki M0
  bulgularıyla düzeltilmiş hâlde** (çürüyen 5 varsayım açıkça not edilir).
- `07`'deki maddeler inşa notlarına eklenir.
- ⚠️ Paket dizini şu an **repo kökünde ve untracked**; CLAUDE.md "köke yeni dosya eklenmez"
  diyor → `docs/` altına taşınır, kök temizlenir.
- **Kabul:** `docs/dijital-gruplar/` iki dosya; CLAUDE.md bölümü M0 tablosunu içeriyor; kök temiz.

**G02 · RLS temizliği: anonim INSERT kapatma + mükerrer politika silme** · migration

- `Anyone can insert whatsapp landings` **kaldırılır** → `authenticated` + `WITH CHECK
  (auth.uid() = submitted_by)`. K3'teki 2 mükerrer SELECT politikası silinir.
- Günlük gönderim sınırı (5) `group_settings`'ten okunan trigger/RPC kontrolüne bağlanır.
- **Kabul:** anonim INSERT `42501` alır; aynı kullanıcı 6. gönderimde reddedilir.

**G03 · Davet linki anonime kapanır + tek kapı RPC** · migration + kod

- `whatsapp_link` anonim SELECT'ten çıkar: `published` grupların **PII'siz** kolonlarını dönen
  view/RPC; ham link yalnız `get_group_invite_url(p_id)` ile **giriş yapmış** kullanıcıya verilir
  ve **her çağrı loglanır** (günlük 20 sınırı `group_settings`).
- İstemci: "Katıl" girişsiz kullanıcıda kısa kayıt penceresi açar.
- ⚠️ **Kırıcı** davranış değişikliği (politika §8 bilinçli istiyor). Paketin notu: *lansmandan
  2 hafta sonra dönüşüm oranı gözden geçirilecek.*
- **Kabul:** **kabul testi #5** geçer — anonim istemci ham tablo, view, RPC **ve katalog
  senkronu** yollarının hiçbirinden `whatsapp_link` okuyamıyor. (Bugün okuyor; testin başlangıç
  durumu **kırmızıdır**.)

### Faz B — Ön koşul altyapıları (Karar 1 ve 2 bunları gerektiriyor)

**G04 · Telefon OTP: Supabase Auth native + `user_verifications` aynası** · migration + kod

- **Yol: Supabase Auth native**, özel edge function **DEĞİL.** `updateUser({ phone })` → SMS OTP
  → `verifyOtp({ phone, token, type: 'phone_change' })` → `auth.users.phone_confirmed_at` dolar.
  Bir trigger bunu `user_verifications`'a aynalar (`phone_e164`, `phone_verified_at`,
  `phone_country_code`) — **şema bu iş için zaten doğru.**
  ⚠️ Tasarımın adını verdiği `send-phone-otp` / `verify-phone-otp` edge function'larını **yazma**;
  native yol bu tabloyu dolduruyor. Native yol G04'te başarısız olursa özel fonksiyona düşülür.
- ⚠️ **GÜVENLİK:** Telefon sağlayıcısını açmak **telefonla giriş/kayıt** yolunu da açabilir.
  Amaç yalnız *mevcut hesaba telefon eklemek* → phone **sign-in ve sign-up KAPALI** kalmalı,
  yoksa e-posta doğrulama akışını atlayan yeni bir kayıt yolu doğar.
- ⚠️ **CLAUDE.md kuralı:** ülke telefon alan kodundan **TÜRETİLMEZ.**
  `user_verifications.phone_country_code` dolsa bile profil ülkesi olarak kullanılmaz.
  [phone-country-derivation.test.ts](../../src/lib/phone-country-derivation.test.ts) `src/`
  ağacını tarar — `countryFromPhone`, `dialCode`, `callingCode`, `libphonenumber` girerse
  **test DÜŞER.** E.164 biçim doğrulaması zaten
  [profile-phone.ts](../../src/lib/profile-phone.ts)'de var, yeniden yazma.
- ⚠️ `phone` attribute canlıda `storage_strategy='private_storage'` ve aktif — bu sözleşme bozulmaz.
- **Kabul:** `user_verifications` ≥ 1 gerçek satır; `is_phone_verified()` o kullanıcı için `true`;
  telefonla giriş denemesi **reddediliyor**.

**G05 · Telefon doğrulama arayüzü + hız sınırı** · kod + migration

- Profil/ayarlar içinde doğrulama kartı: numara gir → kod gir → doğrulandı. Yeniden gönderme
  bekleme süresi, kod deneme sınırı.
- ⚠️ **SMS ÜCRETLİ (bütçe 20–25 €) → hız sınırı zorunlu**, yoksa fatura riski. Sınırlar
  `group_settings`'te (kullanıcı başına saatte/günde kod isteme, IP başına tavan).
- **Kabul:** sınır aşımında kullanıcıya Türkçe mesaj; sınır **DB'de** sayılıyor (istemcide değil).

**G06 · Kurumsal doğrulama seviyesi: şema + belge yükleme** · migration + kod

- `catalog_items.verification_level` (0 · 1 · 2) + `verified_at` + `verified_by`.
- Talep akışı **mevcut `catalog_item_claims`** üzerinden: yeni `claim_type='verification_level_2'`,
  belge yolları `evidence jsonb` içinde.
  ⚠️ `claim_type` ve `status` üzerinde CHECK olup olmadığı migration'da **önce ölçülür**;
  varsa yeni değer CHECK'e eklenir (yoksa satır sessizce reddedilir).
- Belge için ayrı **private** bucket (`org-verification-docs`) — RLS'i `submission-documents`'tan
  ayrı olsun.
  ⚠️ [service-attachment-security.test.ts](../../src/lib/service-attachment-security.test.ts)
  sözleşmesi geçerli: dosya denetimi `accept=` ile hizalı olmalı ve **ham `file.name` depolama
  anahtarına GİRMEZ** → `safeStorageFileName`.
- **Kabul:** bir kurum belge yükleyip `verification_level_2` talebi açabiliyor; belge anonime
  kapalı; **267** mevcut kurumsal kayıt `verification_level=0` ile geriye dönük tutarlı.

**G07 · Kurumsal doğrulama admin inceleme ekranı** · kod

- Admin kuyruğu: bekleyen talepler, belge önizleme, Onayla (→ seviye 2) / Reddet + sebep.
  Karar `catalog_item_claims.status` + `reviewed_by_user_id` + `reviewed_at`'a yazılır.
- Navigasyon satırı `admin-navigation-registry/members.ts` veya `roles-afs.ts`'e eklenir.
- ⚠️ **Rozet/filtre yayılımı bu batch'te YOK** — dizin ve arama belgesine dokunulmaz
  (X listesindeki ayrı plan).
- **Kabul:** onay sonrası `verification_level=2` canlıda ölçülüyor; log izi var.

### Faz C — Spike ve veri modeli

**G08 · M1 Spike: davet sayfasından grup adı okunabiliyor mu?** · çıktı rapor, üretim kodu yok

- WhatsApp (`chat.whatsapp.com`), Telegram (`t.me`), Discord (`discord.gg`) için sunucu tarafında
  ad + görsel okuma denenir; hız sınırı ve `unknown` davranışı ölçülür.
- **Sonuç kararı (paketin ekip notu):** okunamıyorsa sahiplik **ekran görüntüsü + manuel onaya**
  döner, link kontrolü yalnız HTTP durumuna bakar.
- **Kabul:** üç platform için `ok`/`invalid`/`unknown` ölçümü olan kısa rapor; atılan istek sayısı
  ve yanıt kodları yazılı.

**G09 · `group_settings` anahtar-değer ayar tablosu** · migration

- `cadde_settings` deseni. İlk satırlar: `groups.fast_lane_enabled=false` ·
  `groups.daily_submit_limit=5` · `groups.report_threshold=3` ·
  **`groups.report_require_phone=true`** (Karar 1 — OTP kurulduğu için açık) ·
  `groups.report_min_account_age_days=7` · `groups.blocklist_keywords=[…]` ·
  `groups.invite_open_daily_limit=20` · `groups.claim_code_ttl_minutes=10` ·
  `groups.otp_rate_limits={…}`.
- **Kabul:** her ürün sayısı bu tablodan okunuyor; kodda hiçbir eşik sabiti yok (sözleşme testi
  kaynak metni denetler).

**G10 · `whatsapp_landings` şema genişletme** · migration

- Yeni: `platform` · `invite_code` (unique, normalize) · `listing_status` · `hidden_reason` ·
  `ownership` · `owner_user_id` · `submitted_by` · `submitted_as_admin` · `review_flags[]` ·
  `is_global` · `country_code` · `city_id` (→ `geo_cities`) · `short_description(160)` · `rules` ·
  `strike_count` · `published_at` · `suspended_until` · `owner_renewal_due` · `link_fail_count` ·
  `link_checked_at`.
- `status` → `listing_status` **eşlenir** (`approved` → `published`); `group_score` `health_score`
  olarak kullanılmaya devam eder (yeni kolon açma). `member_approved`/`admin_approved` **kaldırılır**.
- ⚠️ **K5:** `catalog_sync_whatsapp_landing` + trigger'ı **aynı migration'da** güncellenir.
- **Kabul:** `tsc` 0 hata (types regen dahil); katalog senkronu 10 grup için hâlâ çalışıyor.

**G11 · Mevcut 10 grubun eşlemesi + veri göçü** · migration + CSV

- Eşleme CSV'si üretilir ve **ekibe gider**. Karar gereken 4 şey: `diger` ×3 grubun yeni
  kategorisi · 6 `Global/Genel` grubun hedef ülkesi (`almanya101 → Almanya`) · **2 boş linkin**
  akıbeti · uzun açıklamaların 160 karaktere indirilmesi.
- Hepsi `listing_status='published'`, `ownership='unclaimed'` başlar.
- **Kabul:** 10 grupta serbest metin konum kalmadı; `invite_code` 10/10 dolu (ya da boş linkli
  2 grup bilinçli `hidden`); CSV ekip onayıyla işlendi.

### Faz D — İş kuralları

**G12 · Durum makinesi: tek geçiş fonksiyonu + moderasyon logu** · migration
`group_moderation_log` + **tek** `set_group_status_v1(...)` security-definer RPC'si (tasarım §2
geçiş tablosu bire bir). Doğrudan `update ... set listing_status` YASAK (trigger engeller).
**Kabul:** **kabul testi #12** — her durum değişikliği logda.

**G13 · Sahiplik doğrulama** · migration + kod
`group_claims` (kod, son geçerlilik, deneme, yöntem `code`/`screenshot`, durum). `CQ`+4 hane,
10 dk, 3 deneme, 10 dakikada 3 deneme sınırı. Yedek yol ekran görüntüsü.
Doğrulanınca platforma göre `Community_WhatsAppAdmin`/`_TelegramAdmin`/`_DiscordAdmin` rolü.
⚠️ `user_role_assignments` PK'si **kullanıcı başına TEK rol** — mevcut rolü ezmemek için akış
netleştirilir. Zaten `verified` gruba yeni talep → **otomatik devir YOK**, moderatöre düşer.
**Kabul:** G08 sonucuna göre kod yolu veya ekran görüntüsü yolu uçtan uca çalışıyor.

**G14 · Şikayet sistemi** · migration + kod
`group_reports`. Eşik politika §8 aynen: giriş yapmış + **telefonu doğrulanmış** (G04) + hesap
≥ 7 gün + farklı 3 hesap; hepsi `group_settings`'ten. Sebepler kırmızı çizgilerle birebir +
"Diğer (açıklama zorunlu)". Aynı kişi aynı gruba 30 günde 1 şikayet.
**Kabul:** **kabul testi #6** — 3 farklı, 7 günlük, **telefonu doğrulanmış** hesap grubu gizler;
6 günlük hesabın ve telefonu doğrulanmamış hesabın şikayeti **sayılmaz**.
⚠️ Testi "0 geçerli şikayet" ile geçmiş sayma — eşiğin **gerçekten tetiklendiği** ölçülür.

**G15 · Uyarı sistemi** · migration
`group_strikes`: 1. uyarı · 2. → 30 gün `suspended` · 3. → `removed` + ekleme yasağı. Kırmızı
çizgi 2/4/6 → doğrudan `removed`.
**Kabul:** üç ihlal senaryosu ayrı ölçüldü; askı süresi `suspended_until`'da.

**G16 · Grup sayfası gönderileri + moderasyon** · migration + kod
⚠️ **Yorum tablosu YOK** — `group_posts` sıfırdan. `post_status` + `escalate_at`.
İlk durum tablosu (tasarım §3D): doğrulanmış admin → `published` · güvenilir üye → `published` ·
diğerleri sahipli grupta → `pending_group_admin` · sahipsiz grupta → `pending_platform`.
**Güvenilir üye** grup bazlı: o grupta ≥5 onaylı gönderi ve onaylı şikayet yok.
**Kabul:** **kabul testi #7** — 48 saat bekleyen gönderi platform kuyruğuna geçiyor.

**G17 · Grup Sağlık Skoru** · migration
`group_recommendations` (kullanıcı+grup tekil) + tasarım §5 formülü birebir. İlk 7 gün `null`.
Rozet 70'te kazanılır, **65 altında** kaybedilir (histerezis).
**Kabul:** **kabul testi #11** — skor ilk 7 gün `null` ve kartta görünmüyor.

### Faz E — Sayfalar (paketin S1–S4'ü)

**G18 · S1 Form** — link → otomatik ad/görsel/platform; 7 kategori tek seçim; `geo_*` otomatik
tamamlama + Global; 160 karakter açıklama; "admini misin"; Grup Sözü onayı. **Platform seçimi ve
serbest metin konum KALKAR.** "Aile & Çocuk" kategorisi **yalnız `verification_level=2` hesaplara
açık** (Karar 2, G06). Mevcut: [AddWhatsAppPage.tsx](../../src/pages/AddWhatsAppPage.tsx) +
`src/components/whatsapp/AddCommunityFormSection.tsx`.
**Kabul:** kabul testi **#1** (aynı link → "zaten listede"), **#2** (admin olmayan gönderi hızlı
şerit açıkken bile `pending_review`), **#4** (kara liste kelimesi hızlı şeritten geçmez),
**#10** (Aile & Çocuk, seviye 2 olmayan hesaba kapalı — artık **birebir** uygulanabiliyor).

**G19 · S2 Dizin** — "Admin onaylı!" / "Üye onaylı!" **kalkar** → "Sahibi doğruladı" / "Üye
önerisi"; "Skor bekleniyor" **hiçbir yerde görünmez**; kategori filtreleri kartlarla **aynı
listeyi** kullanır. Türkçe arama `trIncludes`/`trCompare`
([text-normalization.ts](../../src/lib/text-normalization.ts)).
⚠️ **PostgREST 1000 satır tavanı** — liste tam olmalıysa sayfalama.
**Kabul:** kabul testi **#3** ("Yeni" etiketi 72 saat sonra kalkıyor).

**G20 · S3 Detay** — boş "Grup koşulları" bölümü gizlenir; "Bu grup sizin mi?" ve "Şikayet et"
eklenir; "Katıl" G03'teki RPC'den geçer.
**Kabul:** anonim ziyaretçide link hiçbir yerde (sayfa kaynağı dahil) görünmüyor.

**G21 · S4 Sahip paneli** — düzenleme, onay bekleyen gönderiler, skor kalemleri ("Kurallarını
ekle, +15"), rozet görseli, "Sayfayı paylaş", "Grubu listeden kaldır". Mevcut
`whatsapp_landing_editors` + 5 RPC üzerine kurulur.
**Kabul:** kabul testi **#9** — sahip kaldırma isteği grubu **anında** gizliyor.

### Faz F — Otomasyon, bildirim, moderatör paneli, QA

**G22 · 6 zamanlanmış görev** · migration
`link-health` (haftalık, yayılmış) · `queue-escalation` (saatlik) · `health-score` (günlük) ·
`suspension-release` (günlük) · `owner-renewal` (günlük) · `claim-expiry` (10 dk).
⚠️ Link kontrolü **üç değerli**: `ok`/`invalid`/`unknown` — **`unknown` sayacı ARTIRMAZ.**
⚠️ **"cron yeşil" kanıt değildir** (Radar dersi, 28.09): doğrulama görevin **etkisiyle** yapılır.
**Kabul:** **kabul testi #8** — 2 başarısız kontrol gizler, 1 başarılı geri açar, `unknown` etkisiz.

**G23 · 8 bildirim metni** · migration + kod
Tasarım §9'daki 8 metin. ⚠️ **`notification_email_outbox.event_type` CHECK'i canlıda 7 değere
kilitli** — yeni tip **migration ister**; TS birliğini tek başına genişletirsen RPC reddeder ve
kayıt **sessizce kaybolur**.
**Kabul:** her bildirim için outbox satırı oluşuyor, drenaj sonrası `sent_at` doluyor.

**G24 · M5 Moderatör paneli** · kod
Tek ekran, 4 kuyruk (Yeni gruplar · Sahiplik talepleri · Şikayetler · `pending_platform`
gönderiler). Kısayollar `A`/`R`/`J`/`K`. Üst şerit: kuyruk sayıları, **moderasyondan geçen grup
sayacı (x/100)**, hızlı şerit anahtarı, görevlerin son çalışma zamanı. Navigasyon satırı
[admin-navigation-registry/communities.ts](../../src/lib/admin-shell/admin-navigation-registry/communities.ts)'e.
**Kabul:** 4 kuyruk canlı veriyle doluyor; hızlı şerit anahtarı `group_settings`'i yazıyor.

**G25 · QA — 13 kabul testi** · test
Tasarım §13'teki 13 testin tamamı otomatik (mümkün olmayan için yazılı canlı ölçüm).
⚠️ Test **#5** (RLS) ve **#6** (şikayet eşiği) **mutasyonla** sınanır: kuralı bozunca test
kırmızıya dönmüyorsa **test yanlıştır.**
**Kabul:** 13/13 + `npm run test` · `tsc` 0 · `lint` 0 · `verify:text` temiz.

---

## Sıra ve bağımlılıklar

```text
G01 → G02 → G03            (zemin + canlı açıklar — bağımsız, hemen)
G04 → G05                  (OTP; G14'ün ön koşulu · sağlayıcı teyidi sende)
G06 → G07                  (kurumsal doğrulama; G18'in ön koşulu)
G08                        (spike; G13'ü belirler, paralel gidebilir)
G09 → G10 → G11            (ayar → şema → veri; sıkı sıralı)
G12 → G13 · G14 · G15 · G16 · G17     (G12 sonrası beşi paralel)
G18 → G19 → G20 → G21      (sayfalar; G10/G11 bitmiş olmalı)
G22 · G23 → G24 → G25
```

**Paketin çalışma sırasıyla eşleşme:** M0 ✅ (30.09) · M1 = G08 · M2 = G09–G11 · M3 = G12–G17 ·
S1–S4 = G18–G21 · M4 = G22–G23 · M5 = G24 · QA = G25.
**G04–G07 paketin dışıdır** — iki kararın gerektirdiği yeni ön koşul altyapıları.

⚠️ **Tanıtım (`05`/`06`) G19 canlıya çıktıktan sonra başlar** — eski sayfaya trafik gönderilmez.

---

## Doğrulama

**Her batch (yerel)**

1. `npm run test`
2. `npx tsc -p tsconfig.app.json --noEmit` → 0
3. `npm run lint` → 0
4. `npm run verify:text` (⚠️ eksik Türkçe harfi yakalamaz — gözle de bak)
5. `npm run check:migrations` → sapma yok (parent dizin taraması dahil)
6. `npm run ingest:tools:check` (yeni `src/lib` dosyası varsa)

**Canlı — ölç, varsayma**

- **G03:** anonim `curl` ile ham tablo, view, RPC **ve katalog senkronu** ayrı ayrı denenir;
  hiçbiri `whatsapp_link` dönmüyor. (Bugün dönüyor.)
- **G02:** anonim INSERT `42501`; 6. gönderim reddedilir.
- **G04:** `user_verifications` ≥ 1 gerçek satır + `is_phone_verified()` `true`; telefonla giriş
  denemesi **reddediliyor**.
- **G06/G07:** onay sonrası `verification_level=2` canlıda; belge anonime kapalı.
- **G11:** 10 grubun eşlemesi ekip onaylı CSV'ye birebir uyuyor.
- **G14:** eşik **gerçekten tetiklendi mi** — "0 geçerli şikayet" ile geçmiş sayılmaz.
- **G22:** görevin **etkisi** ölçülür; cron'un "aktif" olması kanıt değil.
- **G23:** outbox satırı + dolu `sent_at`.
