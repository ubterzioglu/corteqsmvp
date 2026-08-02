# Cadde Redesign — Frontend Devir Notu (2026-08-02)

> **Bu doküman ne işe yarar:** yeni bir oturum bu notu okuyup hiçbir şey sormadan
> F20'den devam edebilir. Plan dosyası ayrı yaşıyor:
> [codex-plan-f15-f23-2026-08-02.md](./codex-plan-f15-f23-2026-08-02.md) (F15–F23 denetlenmiş sıra).
> Madde hedefleri (dosya:satır): [docs/cadde-300/redesign-calisma-haritasi.md](./redesign-calisma-haritasi.md).
> Pano: https://corteqs.net/admin/workshop/cadde (48 madde).

## 1. Bir bakışta durum

| | |
|---|---|
| **Faz** | Backend KAPANDI (25 batch + mail hattı canlı). Şimdi **frontend/Cadde redesign**. |
| **Batch durumu** | **19 / 23 bitti** (F1–F19). Kalan: **F20–F23**. `F2` (footer) kullanıcının şeridinde. |
| **Dal** | tek dal `main`; F19 uygulama commit'i **`9ba3498`**. |
| **Kapılar** | F19 hedefli Cadde suite **53/53** · `tsc --noEmit -p tsconfig.app.json` proje geneli eski borçla düşüyor (F19 dosyalarında hata yok) · F19 eslint 0 · `verify:text` temiz · canlı migration `20260802150000_cadde_share` applied/history doğrulandı. |
| **Canlıya deploy** | Coolify deploy **kullanıcıda** — kod push'lu, tarayıcıda henüz yok. |

> ⚠️ **2026-08-02 kapı düzeltmesi:** Bare `npx tsc --noEmit` bu repoda sessizce **sıfır dosya**
> denetler (kök `tsconfig.json` → `"files": []` + project references; kanıt: kasıtlı
> `undeclaredIdentifierProbe` hatası yakalanmadı). Daha önceki batch raporlarındaki
> "tsc 0 hata" ifadesi bu yüzden geçersizdi — **daima `-p tsconfig.app.json` kullan.**
> Gerçek denetim proje genelinde artık **104 hata satırı** gösteriyor; hepsi önceden var olan borç
> (bayat `supabase/types.ts`, eksik `@/lib/mapEntities` · `html-to-image` ·
> `@/lib/whatsappLandings`, ProfilePage `string | boolean` draft tipi). F-batch'lerinin
> ürettiği tek hata (F11'in `MentionTextarea` TYPE_ICON regresyonu) `c20dcfd` ile kapatıldı.

### Biten batch'ler (madde → commit)

| Batch | Maddeler | Commit | Ne yapıldı (bir satır) |
|---|---|---|---|
| F1 | m16 | `72885fb` | "Yeni paylaşım" çipi baseline'ı gerçek en-yeni `createdAt`'e bağlandı (canlı bug). |
| F3 | m38 | `a9a4bbf` | `search_cadde_people_v1` — ad-onaylı tüm üyeler cadde keşfetinde; yönetici dışlandı. |
| F4 | m1 | `7778c50` + `a184064` | Analog saat kadranları (otel tarzı), dayPart ikonları kalktı. |
| F5 | m7 | `e5a348f` | Medya katmanının eksik testleri (SQL↔TS ayna sözleşmesi dahil). |
| F6 | m5+m6+m13 | `199492a` | Composer WhatsApp sadeliğine indi (Detaylar paneli, Etkinlik çipi, etiket UI kalktı). |
| F7 | m15+m14 | `c7ec7cf` | Scope bar: iptal çipler silindi, kalanlara açıklama satırı. |
| F8 | m17+m18 | `b4a7e91` | Post başlığı forum hiyerarşisi; tip rozeti kalktı. |
| F9 | m29+m30+m31 | `3f2e8b5` | CaddePage iskeleti: ikincil menü silindi, sol kolon 2 karta indi, ticker sağa taşındı. |
| F10 | m39+m40 | `c0e9e49` | Çarşı gizlendi (`cadde.carsi.visible=false` **canlıda**), yerinde teaser. |
| F11 | m2+m3+m4 | `e467fff` + `ca3dd98` | Kafe kartları hizalandı; **Çay Bardağı ikonu** tüm kafe yüzeylerinde. |
| F12 | m37+m35 | `9656fc4` | Konum kartı yerleşimi düzeldi; Köprü'ye 4 hedef kitle balonu. |
| F13 | m41+m42+m44 | `6444e39` | Statik Panosu kartı → panelden Featured seçilen içerik; kart tamamı tıklanabilir. |
| F14 | m43+m45+m46 | `4c3d572` + `c20dcfd` | Reklam CTA akışı: profildeki tanıtım paneline çapa, "talep bırak" kalktı, boş yüzeyde "reklamını buraya verebilirsin". |
| F15 | m19+m20 | `9c576dd` | Tepki seti 5'li negatifsiz yapıldı; popover kalktı; canlıda `idea` → `unsure` 2 satır taşındı. |
| F16 | m21 | `ee2fdff` | Feed yorum gövdelerini eager çekmiyor; sayaç hafif `post_id` sayımıyla kalıyor; panel açılınca ilk 5 + "Devamını yükle". |
| F17 | m22+m24 | `c2fe97a` | Yorum textarea'sında Enter gönderir, Shift+Enter satır atlar; yorum paneli kompakt hale geldi. |
| F18 | m23 | `ad57a96` | Açık yorum paneli adaptif polling ile yeni yorumları sessiz alır; panel kapanınca sorgu durur. |
| F19 | m12 | `9ba3498` | Paylaş butonu Web Share + clipboard fallback ile çalışır; `record_cadde_share_v1` loglar ve `share_count` artırır. |

### Panoda işaretlenebilir maddeler (birikmiş, 38)

`m1 · m2 · m3 · m4 · m5 · m6 · m7 · m12 · m13 · m14 · m15 · m16 · m17 · m18 · m29 · m30 · m31 ·
m19 · m20 · m22 · m23 · m24 · m35 · m37 · m38 · m39 · m40 · m41 · m42 · m43 · m44 · m45 · m46` + önceden bitmiş sayılan
`m10 · m21 · m32 · m36 · m47`. Kullanıcı QA'sından sonra "panoyu çevir" derse bunlar `yapildi`ya geçer.

---

## 2. Kalan batch'ler (uygulama sırası)

### F14 · m43+m45+m46 — reklam CTA akışı [S] — ✅ **BİTTİ** (`4c3d572` + `c20dcfd`)

Dış katkı (`4c3d572`) CTA'ları bağladı; denetimde üç açık bulundu ve `c20dcfd` ile kapatıldı:
ProfilePage redirect'leri `search`+`hash`'i düşürdüğü için çapa çalışmıyordu (+ SPA'da
hash'e otomatik kaydırma yok → rAF'lı scroll efekti), hedef sabit `bireysel` + işlevsiz
`?tab=settings` idi (→ `/profile#cadde-tanitim`), ve m45'in "talep bırak" metni koyu kartta
duruyordu. Ayrıca billboard boş durumundaki üçüncü kalın buton ince bağlantıya indirildi.

<details><summary>Batch açılırken toplanan bulgular (arşiv)</summary>

**Bu batch için taze bulgular (2026-08-02, F14 hazırlığında toplandı):**
- `CaddeTanitimPanel` (tanıtım kampanyası **oluşturma** paneli, `createPromotionCampaign`
  kullanıyor) **zaten profilde mount edilmiş**: `src/pages/ProfilePage.tsx:77` (import) ve
  **`:1683`** (render). Yani m45'in "profilinden ilk tanıtımını yap" hedefi **var** —
  yeni sayfa yazmak gerekmiyor, panele `id` verip derin bağlantı kurmak yeterli.
- m46'nın "profil menüsü" hedefi: `src/components/profile/ProfileSwitcherMenu.tsx`
  (testi de var: `ProfileSwitcherMenu.test.tsx`).
- Ayrı bir `/cadde/tanitim` rotası **yok** (App.tsx'te yalnız `/cadde`, `/cadde/cafe/:cafeId`,
  `/cadde/carsi[, /:itemId]`). Yeni rota açmaya gerek yok; SEO-kilitli rota listesine dokunma.
- Hedefler: m43 → `CaddePage.tsx` billboard boş durumu (`cadde-billboards-empty-state`)
  ve F13'ün featured yuvası boşken bıraktığı alan; m45 → aynı dosyadaki **koyu kart**
  ("Cadde İçinde Görünür Ol" / "talep bırak" / `Başvuru Gönder` → `/login?mode=signup`).
- **Dikkat:** koyu karttaki `/login?mode=signup` hedefi ziyaretçi için doğru; giriş yapmış
  kullanıcı için hedef profildeki tanıtım paneli olmalı (oturum durumuna göre ayır).

</details>

### F15 · m19+m20 — tepki seti BİRLEŞİK [M + **migration**] — ✅ **BİTTİ** (`9c576dd`)
Migration `20260802141000_cadde_reaction_set_v2.sql` canlıya uygulandı ve `applied/` altına
taşındı. CHECK final seti: `like · love · haha · support · unsure`. Eski `idea` verisi
kullanıcı kararına uygun biçimde `unsure` oldu (`UPDATE 2`, canlı doğrulandı; `idea` kalmadı).
`toggle_cadde_reaction_v1` imzası korunarak whitelist ve bildirim metinleri güncellendi.
UI'da popover kalktı; 5 tepki doğrudan aksiyon satırında açık. SQL↔TS ayna testi eklendi.

### F16 · m21 — yorum sayısı + load-more [S/M] — ✅ **BİTTİ** (`ee2fdff`)
Feed RPC'ye `comment_count` eklenmedi (F21 zincirine bırakıldı). `listCaddeFeed` artık yorum
gövdelerini eager çekmiyor; real modda `cadde_post_comments.post_id` üzerinden sayıyor, demo
feed'de yorum gövdeleri sıyrılıyor. Yeni `listCaddePostComments(postId, 5, cursor)` panel
açılınca çalışır; "Devamını yükle" sonraki sayfayı getirir. Cafe-içi feed davranışı korunmuştur.

### F17 · m22+m24 — yorum etkileşimi [S] — ✅ **BİTTİ** (`c2fe97a`)
Yorum `<Textarea>` artık `Enter && !shiftKey` ile boş olmayan metni gönderiyor; whitespace
Enter'ı no-op bırakıyor, `Shift+Enter` satır atlama davranışını koruyor. Panel daha kompakt:
textarea `min-h-[64px]`, yorum kartları `space-y-2`, isim+tarih tek satır, gönder butonu
ikon+metin tek satır.

### F18 · m23 — auto-refresh genişletmesi [M] — ✅ **BİTTİ** (`ad57a96`)
Açık yorum paneli `postComments` infinite query'si üzerinde adaptif interval kullanır:
yorum imzası değişmezse 60 sn → 2 dk → 5 dk kademesine çekilir, yeni yorum gelirse streak
sıfırlanır. Panel kapalıyken query disabled kalır; yeni yorum cache refetch'iyle sessiz görünür,
scroll'a elle müdahale edilmez. Feed'in yeni-post chip deseni korunmuştur.

### F19 · m12 — Paylaş butonu + share_count [M + **migration**] — ✅ **BİTTİ** (`9ba3498`)
Migration `20260802150000_cadde_share.sql` canlıya uygulandı, history'ye yazıldı ve
`applied/` altına taşındı. `cadde_post_shares` yalnız self-read RLS ile gelir; client insert
policy yok. `cadde_posts.share_count` eklendi; `record_cadde_share_v1` auth+ban+rate limit
sonrası paylaşım loglar ve sayacı artırır. UI aksiyon satırında Paylaş butonu Web Share API
ve clipboard fallback ile `/cadde?post=<id>` linkini kullanır. Ranking/global eşik F21'e kaldı.

### F20 · m25 — emoji bankası [M] ← **SIRADAKİ**
Lazy-load **gerçek** picker (kullanıcı kararı), yorum + composer. Ana bundle büyümesi ~0
olmalı (dinamik import kanıtı commit'e yazılır).

### F21 · m8+m11 — konum default'u + global çıkış kuralı [L] ⚠️ zincir başı
"Konum ekle" + default kullanıcının **kayıtlı** konumu (aktif filtre fallback'i silinir);
serbest global kapanır; globale çıkış performans eşiği (`cadde_settings` anahtarları + feed
RPC'de eşik; muhtemelen denormalize sayaç + trigger migration'ı). "Beğeni" tanımı (yalnız
`like` mı tüm pozitif tepkiler mi) batch başında sabitlenir. `cadde-ranking.ts` aynası + testi
birlikte güncellenir.

### F22 · m9+m10 — çoklu hedef (+1 ülke/şehir) [L] ⚠️ zincirin ikinci halkası
`create_cadde_post_v1` **imzası sabit 6 parametre ve grant'ler imzaya bağlı**
(`supabase/migrations/.../20260610183000:12-19,103-104`) → **DROP+CREATE+re-grant** ya da
**`create_cadde_post_v2`**. Tekil model 4 katmanda: composer, RPC, `cadde_posts` kolonları,
feed eşleşmesi + ranking aynası. m10 (premium kilidi) bu batch'in `cadde_settings` anahtarı.

> **Zincir kuralı (denetçi):** F21 → F22 **ardışık ve tek elde**; paralel açılmaz. Her
> migration canlı `pg_get_functiondef` tam gövdesi + grant kopyasıyla yazılır.

### F23 · m26+m27 — palet + inceltme BİRLEŞİK [M/L] — **en son**
Koyu/kontrast palet (4 sayfadaki inline gradyan hex'leri tek kaynağa) + buton/boşluk inceltme.
Yapısal batch'ler bitmeden yapılırsa iş çöpe gider. Kontrast AA, dokunma alanı ≥40px.

### Park / kapsam dışı (bilinçli)
`m33` + `m34` (telefon-bazlı erişim — ayrı kimlik-modeli planı; girerse öncesinde m36
regression testi) · `m48` (Profil Workshop süreci) · `m13` yeniden değerlendirmesi (veto) ·
Çarşı'yı geri açma (tek SQL update).

---

## 3. Kararlar defteri (yeniden sorulmayacak)

| Konu | Karar |
|---|---|
| m20 tepki seti | **Negatifsiz 5'li**: beğendim · kalp · gülme · destek · emin-olamadım |
| m42 featured | **MANUEL** (admin Featured anahtarı; otomatik skor yok) |
| m19 tepkiler | Popover değil, **doğrudan açık** emoji satırı |
| Kafe ikonu | **Varyant 3 · İnce Belli Çay Bardağı** (`CaddeCafeIcon.tsx`) |
| m25 | **Gerçek** emoji picker, **lazy-load** |
| m33/m34 | **Park** |
| F3 gizlilik sınırı | Açık profiller tam satır + ad-onaylı kapalı üyeler yalnız ad + public şehir (tıklanamaz) |
| m44 profil referansı | **Migration yok** — mevcut `cta_url` kullanılır (yeni FK reddedildi) |
| Alan paylaşımı | **Footer/genel layout kullanıcıda, Cadde asistanda** |
| Çarşı | Gizli (`cadde.carsi.visible=false`); geri açmak tek SQL update, deploy istemez |

---

## 4. Çalışma kuralları (her batch)

1. **Batch = 1 commit**, pathspec ile: `git add -- <dosyalar>`. Kapılar: hedefli vitest +
   `npx tsc --noEmit` + `npx eslint <dosyalar>` + `npm run verify:text`.
2. **CLAUDE.md Cadde kuralları:** mutasyon yalnız security-definer RPC · SQL↔TS ayna
   sözleşmesi iki taraf + test birlikte · yeni RPC hata kodu → `cadde-rules.ts` Türkçe
   haritası · limit/flag'ler `cadde_settings`'e (ürün kararı = SQL update).
3. **Migration akışı:** dosyayı `supabase/migrations/`'a yaz → `psql -f` ile uygula →
   `supabase_migrations.schema_migrations`'a `(version, name)` INSERT (name = timestamp'siz
   slug) → dosyayı `applied/`e taşı → commit. **Sürüm seçmeden önce canlıdaki max version'a bak**
   (2026-08-02 itibarıyla canlı history'de F15 sonrası `20260802141000`).
4. **Canlı DB:** `psql "host=aws-1-eu-west-2.pooler.supabase.com port=5432 dbname=postgres
   user=postgres.injprdrsklkxgnaiixzh sslmode=require"`, şifre `.env.local` →
   `SUPABASE_DB_PASSWORD`; Bash aracında **`dangerouslyDisableSandbox: true`** şart
   (Node HTTPS engelli, psql çalışır).
5. Commit mesajı yapısı: konu satırı + gövde + trailer'lar (`Constraint:` `Rejected:`
   `Confidence:` `Scope-risk:` `Directive:` `Not-tested:`).
6. Batch bitince **panoda işaretlenecek madde numaraları** kullanıcıya raporlanır.

---

## 5. Ortam tuzakları (kanıtlı, tekrar yaşanmasın)

- **Pathspec'siz commit süpürür.** Kullanıcının `"."` mesajlı commit'leri (`7778c50`,
  `b17984c`, `e467fff`) asistanın commit-öncesi dosyalarını 3 kez içine aldı. Çözüm:
  kapılar geçince **hemen** commit; karar kaydı gerekiyorsa `--allow-empty` doc-commit.
- **`walast.txt` yasağı.** 25 bin satırlık özel WhatsApp dökümü kazara push'landı,
  `git rm --cached` + `.gitignore` (`walast.txt`, `*.wa-export.txt`) + `--amend` +
  `push --force-with-lease` ile geçmişten silindi (`6b52bb6`→`b17984c`). Dosya diskte kalır,
  **asla commit edilmez**.
- **Test flakiness:** yük altında zaman aşımı → `vitest.config.ts`'te `testTimeout: 15_000`.
  Suite kırmızıysa **önce izole** koş, sonra hüküm ver.
- **Radix Tooltip dokunmatikte açılmaz** → bilgi balonları Popover ile (F12'de
  `CaddeBridgeInfo`; trigger'daki `event.preventDefault()` kasıtlı, kaldırılırsa mobilde
  balon açılıp anında kapanır).
- **Bash aracı gürültüsü:** `PostToolUse` hook'ları ve eksik temp-cwd dosyası yüzünden
  komutlar başarılıyken bile "exit 1 / failed" görünebilir — **çıktının kendisi** hükümdür.
- **psql + PowerShell Türkçe:** komut satırından geçen Türkçe karakter bozulur; Türkçe
  içerikli SQL'i UTF-8 dosya olarak `psql -f` ile gönder ya da `U&'...\0131...'` kullan.
- **Mocklu modüle export eklerken** test mock'unu da güncelle (ProfilePage testleri bir kez
  bu yüzden kırıldı).

---

## 6. Kullanıcıda duran işler

1. **Coolify deploy** — F1–F13'ün tamamı push'lu, canlıda görünmesi deploy'a bağlı.
2. **F2 · m28 footer sadeleştirme** — kullanıcının şeridi (`Footer.tsx`).
3. **Giriş yapmalı QA turu** — tepkiler, yorum, kafe katılımı, composer akışı.
4. **Hoş geldin maili anahtarı** — panelden örnek mail sonrası açılacak.
5. **Pano kutularını işaretleme** — 38 madde hazır; "panoyu çevir" komutuyla asistan
   `inceleniyor` → `yapildi` çevirebilir.

---

## 7. Yeni oturum için ilk üç adım

```bash
git -C c:/temp_private/corteqs/corteqs_fin log --oneline -5      # 9ba3498 görünmeli
npx vitest run src/components/cadde/ src/pages/cadde/ src/lib/cadde-*.test.ts   # 53/53 beklenir
npx tsc --noEmit -p tsconfig.app.json                           # eski repo borcu; F20 dosyalarına süz
# sonra: F20 · m25 — gerçek emoji picker lazy-load
```

**Devam cümlesi:** "F20'den devam et — m25: gerçek emoji picker lazy-load, yorum + composer."
