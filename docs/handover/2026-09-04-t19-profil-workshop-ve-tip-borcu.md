# T19 + Profil Workshop + tip borcu temizliği — devir notu

**Devir tarihi:** 4 Eylül 2026
**Son commit:** `6647ad2 fix(types): profil sorgularinin satir tipini geri kazan, tsc 27 -> 22`
**Dal:** `main`, `origin/main` ile senkron — bekleyen commit yok.
**Plan dosyası:** `~/.claude/plans/twinkling-leaping-popcorn.md` (batch planı; öncülü Batch 0'da çürüdü, güncellendi)

## Kısa sonuç

Üç iş yapıldı: (1) 3 Eylül toplantısı panele işlendi ve Profil Workshop panosu açıldı,
(2) TypeScript borcu **109 → 22** hataya indirildi ve yolda **altı gerçek canlı kusur**
bulundu, (3) admin panelindeki tüm açık işler envanterlenip batch planına bağlandı.

Her adımda 1.721 test, ESLint 0 ve build yeşil tutuldu. Hiçbir hata cast veya
suppression ile susturulmadı.

⚠️ **Coolify deploy YAPILMADI.** Şema ve veri canlıda, uygulama kodu değil. Deploy
edilene kadar `/admin/workshop/profil` panelde görünmez ve düzeltilen ekranlar eski
hâlinde kalır.

---

## 1) T19 toplantısı ve Profil Workshop (commit `3ad99cd`, duyuru `88410a3`)

- **Komuta Merkezi → T19**: `command_center_items`, `legacy_source_code='T19'`,
  `legacy_source_date_label='3 Eylül 2026'`. 24 satır: UBT 14, Burak 3, **7 karar
  satırı `B+B` ile** (ortak kararlar için ilk kez bu assignee kullanıldı).
- **Yeni pano**: `/admin/workshop/profil`, `workshop_key='profil'`, WS1, 26 madde,
  6 bölüm. `item_no` 1'den başlar (unique kısıt `(workshop_key, item_no)`).
- Pano gövdesi `components/admin/workshop/WorkshopBoard.tsx`'e çıkarıldı; Cadde ve
  Profil sayfaları artık yalnızca sarmalayıcı.
- Migration'lar canlıda: `20260904120000`, `20260904121000`. `check:migrations` →
  379 dosya / 379 kayıt, sapma yok.
- Admin panel "Güncellemeler" listesine 3 ve 4 Eylül kayıtları eklendi; post-commit
  hook 2 kaydı kuyruğa aldı → 18:00 Berlin günlük özet maili.

## 2) Tip borcu: 109 → 22 (commit'ler `a4001a3` … `6647ad2`)

**En değerli bulgu tsc sayısı değil: `/admin/whatsapp-landings/editors` canlıda hiç
açılmıyordu.** Sorgu `user_profiles!inner(...)` ile join yapıyordu; o tablo AFS yeniden
yapılandırmasında düşürülmüş. `to_regclass('public.user_profiles')` = NULL, tabloda
1 gerçek editör kaydı var. tsc bunu iki satır hata olarak aylardır bildiriyormuş.

Bulunan diğer canlı kusurlar:

| Kusur | Etki |
|---|---|
| `variant="hero"` hiç tanımlı değildi | 9 buton arka plansız render oluyordu |
| `AdminNavItem.activePaths` diye alan yok (doğrusu `match`) | 2 menü öğesi alt rotalarında vurgulanmıyordu |
| `AdminAccent`'ta `violet` yok | 5 Radar menü öğesi `undefined` className alıyordu |
| `AdminFavorites` hook'a kimlik geçmiyordu | Panodaki Favoriler widget'ı kalıcı boştu |
| `getStepMessage` `isSummary`'yi düşürüyordu | Sohbet özeti monospace stilini kaybediyordu |
| `social-diaspora-posts` post-67 teması union'da yok | Gönderi temasız görünüyordu |

Ayrıca **3.546 satır ölü kod** silindi: `src/components/profiles/` dizininin tamamı +
`WelcomePackCTA` + `booking/BloggerAnalytics` (11 dosya, hiçbiri erişilebilir değildi).

### Tekrar eden kök nedenler — yeni koda başlamadan önce bunları ara

1. **Bayat "types.ts bunu tanımıyor" köprüsü.** `from: (table: string) => …` imzası
   tablo adını kaybeder ve tip çözümlemesini TÜM tabloların birleşimine düşürür —
   hatalarda alakasız `geography_columns` görünmesinin sebebi budur. types.ts'e tablo
   eklenince **ilgili köprüyü de sil**. (32 hata tek bu nedendendi.)
2. **`unknown` / `Record<string, unknown>` jsonb RPC parametresi.** Bunlar `Json`'a
   atanamaz; tip baştan yanlıştır, cast gerekmez — parametreyi `Json` yaz.
3. **Select metnini `[...].join(", ")` ile üretmek.** Sonuç `string`, literal değil;
   supabase-js satır tipini `GenericStringError`'a düşürür. Düz literal yaz.
4. **Dar union anahtarlı Map/Set ama serbest metinle sorgulama.** Harita zaten
   `?? value` ile bilinmeyene düşüyorsa anahtar `string` olmalı.
5. **Ayrık birleşim daraltması bu depoda çalışmaz** (`strictNullChecks` kapalı).
   `{ok:true}|{ok:false;message}` yerine `{ok:boolean; message?}` yaz. Emsal:
   `HotFixMutationResult`, `ValidationResult`, `CafeNameModerationResult`.

### Kalan 22 hata — hepsi karar bekliyor, hiçbiri çalışma zamanını etkilemiyor

- **5**: `role_taxonomy_rules` — canlıda tablo YOK. Sayfaların rotaları **redirect**,
  dosyalar erişilemez; yani canlıda kırık sayfa değil, ölü kod.
- **3**: `command-center-items.ts` TS2589. ⚠️ `COMMAND_CENTER_SELECT`'e `: string`
  anotasyonu DENENDİ ve GERİ ALINDI — 3 hatayı kaldırdı ama 5 yeni hata üretti
  (45 → 50). Neden çalışmadığı dosyaya yazıldı, tekrar deneme.
- **~8**: jsonb sınırı (`Partial<Row>` → `Json`). Aynı desen `turkish-missions-admin`,
  `muhasebe-butce-api`, `service-finder-api`, `resource-links`, `MvpManager`,
  `LinkManager`'da. "jsonb kolonlarını nasıl tipliyoruz" kararı verilmeden tek dosyada
  çözmek tutarsız üçüncü bir stil üretir.
- **2**: test fixture'ları · **1**: ölü `ProfileCompletePopup.tsx` (auth context'te hiç
  var olmayan `profileComplete` alanını okuyor).

## 3) Admin panel açık iş envanteri ve Batch 0 sonucu

Açık iş **beş ayrı yerde** duruyor: `workshop_items`, `revision_requests`,
`command_center_items` (todo + meeting_note), `command_center_hot_fixes`,
`admin-todos.ts`. Hiçbiri diğerini bilmiyor.

### ⚠️ Batch 0 planın öncülünü çürüttü

"126 açık madde var, bir kısmı yapılmış ama işaretlenmemiş" diye başladım. **Yanlıştı.**
34 maddeyi işaretlemeye çalıştım, **yalnız 1'i** değişti — 33'ü zaten `ubt_done=true` idi.

| | cadde | profil |
|---|---|---|
| İki onay da var (bitti) | 36 | 0 |
| **Yalnız UBT ✓ — Burak'ın onayı bekliyor** | **65** | 0 |
| Hiç onay yok | 24 | 26 |
| Bayat, bu turda kapatıldı | 11 | — |

**Darboğaz kod değil, Burak'ın 65 maddelik onay kuyruğu.** Cadde'yi "bitti" ilan
etmenin önündeki tek engel bu.

Hiç dokunulmamış 24 cadde maddesinin 14'ü kod bile değil (pazarlama brief'i, WordPress
taşıma — 14 Eylül'e dondurulmuş, NDA yapısı), 4'ü bilinçli park. Kalan 6'nın beşi bloke.
**Cadde'de şu an yapılabilir tek kod işi m134.**

### Revize batch sırası

- **Batch A** — m134 (aşağıya bak, kanıt bekliyor)
- **Batch B** — profil WS1 1–12: form + doğrulama *(T19 çekirdeği; m33/m34'ün kilidini de açar)*
- **Batch C** — profil WS1 13–16: rol/etiket mimarisi ⚠️ `user_role_assignments` PK'sı
  **kullanıcı başına tek rol**; çoklu etiket şema kararı gerektirir
- **Batch D** — profil WS1 17–23: referans + paketleme *(Burak'ın kural kitapçığına bağlı)*
- **Batch E** — 44 revizyon isteği (`area_label` ile gruplu: CADDE 22, araçlar 9, kalan 13)
- **Batch F** — QA + 65 maddelik onay kuyruğunu Burak'a sunma

## 4) m134 — açık, kanıt bekliyor

"Yorum yazmaya çalışınca sayfa hataya geçiyor, eklenen görsel netlik gidiyor."
**Tekrar üretilemedi, kök neden bulunamadı; tahminle düzeltme yapılmadı.**

Elenenler: yorum yazma `onError` ile toast gösteriyor (çökertmez) · `new QueryClient()`
varsayılan, `throwOnError` kapalı · render'da korumasız alan erişimi yok ·
`getPublicUrl` dönüşümsüz, görsel orijinal çözünürlükte · medya düzeltmesi
(`b736b3a`, 4 Ağustos) bunu çözmez çünkü **m134 13 Ağustos'ta yazılmış**.

Yazma hataları yalnız `console.error` ile konsola gidiyor, kalıcı kayıt yok — geriye
dönük inceleyecek kanıt üretilmemiş.

**Çözmek için gereken:** tarayıcı konsolundaki hata metni · hangi ekran (ana akış mı
kafe mi) · "netlik gidiyor" neye benziyor (bulanık / kırpılmış / küçülmüş).

**Yolda bulunan ayrı kusur (henüz düzeltilmedi):** `CaddePostComments`'te
`commentsQuery.isError` ele alınmıyor — yorum listesi yüklenemezse kullanıcıya
"İlk yorumu sen bırak" yazılıyor, yani **yükleme hatası "hiç yorum yok" gibi
gösteriliyor**. Kullanıcı bu turda "düzelt" dedi, uygulanmadı.

## 5) Klasör düzeni

Kök **zaten temiz** (CLAUDE.md kuralına uygun); tek yabancı `walast.txt`, o da
`.gitignore`'da. `src/lib/` 233 düz dosya ama adlandırma tutarlı (`cadde-*` 53,
`relocation-*` 51) — modüllere bölmek ~384 import satırı değiştirir, işlevsel kazanç
yok, **önerilmedi**. `docs/` altında `10tool` (18+ kod referansı) ve `agent` (12)
koda bağlı, taşınamaz.

Yapılan tek düzeltme (`3ac4172`): `docs/docu` → `docs/partner-materials`; alt klasörler
`.html` uzantılı isim taşıyordu (2026-06-11 kök temizliğinden kalma kaza).

⚠️ **Tuzak:** `scripts/verify-text-encoding.mjs` `skipDirs` klasör adını **sabit yazar**.
Yeniden adlandırma encoding muafiyetini sessizce düşürür — script ve `docs/README.md`
envanteri birlikte güncellenmeli (bu turda yapıldı).

---

## Sıradaki adımlar

1. **Coolify deploy** — tüm bu turun kodu deploy bekliyor
2. Deploy sonrası `/admin/workshop/profil` ve `/admin/whatsapp-landings/editors`
   ekranlarını gözle doğrula (ikincisi bu turda düzeltildi, canlıda 1 kayıt var)
3. `commentsQuery.isError` düzeltmesi + yazma hataları için kalıcı tanılama
4. Batch B (profil WS1 1–12) — asıl iş burada, 26 maddenin hiçbirine başlanmadı
5. Burak'a 65 maddelik onay kuyruğunu sun

## Bilinen tuzaklar

- **Bash aracı bu oturumda her komutta "exit code 1" verdi** — harness'ın cwd artefaktı,
  komutlar başarılı. Gerçek çıkışı komutun kendi çıktısından oku.
- **Türkçe içeren SQL'i daima `psql -f` / dosya üzerinden gönder.** Komut satırından
  geçen `-c "… Eylül …"` canlıda `invalid byte sequence for encoding "UTF8"` verdi.
- **Silme kararında sembol tabanlı `grep` YANILTIR.** `WelcomePack`i önce "ölü" saydım;
  gerçek import'unu kaçırmışım. Daima yol tabanlı: `grep -rn "dizin/DosyaAdi\""`.
- **`git add -- docs/` gibi geniş pathspec** oturum öncesinden duran takipsiz dosyayı
  commit'e soktu (amend ile geri alındı). Her zaman dosya dosya `--` ile ekle.
- **Pano onayı forge edilmez:** `burak_done` asla ajans tarafından atılmaz; yalnız
  `ubt_done` ve yalnız kod kanıtıyla.
