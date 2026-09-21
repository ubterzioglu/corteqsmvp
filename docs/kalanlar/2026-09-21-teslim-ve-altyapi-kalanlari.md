# Teslim ve Altyapı Kalanları

**Tarih:** 21 Eylül 2026
**Kaynak:** Belirli bir plana değil, **repo ile canlının karşılaştırılmasına** dayanır.
**Durum:** PLANLANDI — başlanmadı.

> Bu klasördeki öbür dosyalar bir planın artakalanıdır. Bu dosya farklıdır: burada
> yazan maddeler **hiçbir planın içinde değildi** ve tam da bu yüzden kimsenin işi
> olmadan aylarca açık kaldılar. Ortak özellikleri şudur: **kod doğru, test yeşil,
> build başarılı — ama canlı ile repo aynı şeyi söylemiyor.**
>
> Bütün rakamlar 21 Eylül 2026 akşamı ölçüldü (Supabase Management API + `psql` +
> `git`). Ezberleme, komutu tekrar çalıştır.

---

## T1 — Edge function'larda repo ile canlı İKİ YÖNLÜ ayrışmış

**Sınıf:** teslim + kayıp kaynak. **Bu dosyanın en ciddi maddesi budur.**

### Ölçüm

```bash
# canlı liste
curl -s -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  "https://api.supabase.com/v1/projects/injprdrsklkxgnaiixzh/functions" \
  | grep -o '"slug":"[^"]*"'

# repo listesi
ls -1 supabase/functions/
```

**Canlıda 12 fonksiyon ACTIVE · repoda 11 dizin (+ `_shared`) · kesişim 8.**

| Durum | Fonksiyon | Ayrıntı |
|---|---|---|
| ⚠️ Repoda var, **canlıda YOK** | `whatsapp-reply` · `whatsapp-webhook` | `52433c2` ile **30 Ağustos**'ta commit'lendi — **22 gündür** deploy edilmemiş |
| ⏳ Repoda var, canlıda yok (beklenen) | `site-assistant` | Henüz commit bile yok; aktif oturum yazıyor |
| ⚠️ **Canlıda var, repoda YOK** | `diaspora-search` · `relocation-chat` · `whatsapp-bot-lookup` | `git log --all` ile arandı: bu repoda **hiç bulunmadılar** |
| ⚠️ Canlıda var, repodan **silinmiş** | `chat-register` | Geçmişte vardı (`17ad6c2`), silinmiş; canlıda hâlâ `ACTIVE`, sürüm 10 |
| ✅ İkisinde de var | `find-matches` · `lansman-admin` · `radar-news-scan` · `relocation-assistant` · `relocation-notifications` · `send-notification-emails` · `send-submission-email` · `submit-survey-response` | — |

### Neden sessizce büyüdü

`Dockerfile` yalnız frontend'i kurar; içinde `supabase/functions` geçmez. **Coolify
deploy'u edge function'lara hiç dokunmaz.** Yani bir fonksiyonu commit'lemek onu
canlıya çıkarmaz ve bunu haber veren hiçbir şey yoktur — ne CI, ne test, ne lint.

`relocation-assistant` (20 Eylül commit'i) canlıda **var**: demek ki elle deploy
yapılabiliyor ve yapıldı. Sorun yeteneğin yokluğu değil, **adımın unutulması**.

### ⚠️ CLAUDE.md bu konuda yanlış

Şu an şöyle diyor: *"Edge Functions (9, ölçüldü 2026-09-18) … (There is no
`chat-register` function — that name was stale.)"*

Ölçüm bunun tersini söylüyor: `chat-register` canlıda **ACTIVE**, ve toplam sayı
9 değil — repoda 11, canlıda 12. Bir sonraki oturum bu satıra güvenip yanlış
karar verebilir.

### Yapılacaklar

1. **Kaynağı olmayan 4 fonksiyonu indir ve repoya al** — kaybolmaları geri
   alınamaz bir kayıptır:
   ```bash
   supabase functions download diaspora-search --project-ref injprdrsklkxgnaiixzh
   # relocation-chat · whatsapp-bot-lookup · chat-register için tekrarla
   ```
   Sonra her biri için karar: **tut** (repoya ekle) ya da **sil** (canlıdan kaldır).
   `chat-register` ve `relocation-chat` muhtemelen `site-assistant` /
   `relocation-assistant` tarafından çoktan ikame edildi — silinecekse önce
   çağıran var mı diye bakılmalı.
2. **`whatsapp-reply` + `whatsapp-webhook` deploy et.** Gerekli sırlar
   (`WHATSAPP_*`) fonksiyon ortamında tanımlı olmalı — bu depoda mail sırlarının
   eksik olduğu ve fonksiyonun **sessizce hiçbir şey yapmadığı** bir olay yaşandı
   (29 Temmuz). Deploy'dan sonra bir uçtan uca çağrı ile doğrula.
3. **CLAUDE.md'nin Edge Function listesini gerçek ölçümle değiştir** ve listeye
   "canlıda var / repoda var" ayrımını ekle.
4. **Kalıcı çözüm:** deploy'u unutulmaz kıl. En ucuzu bir sözleşme scripti —
   `npm run check:functions`, Management API listesi ile `supabase/functions/`
   dizinini karşılaştırır, ayrışma varsa exit 1. `check:migrations` deseni birebir
   uygulanabilir.

**Doğrulama:** `check:functions` yeşil; canlı liste ile repo dizini birebir eşleşiyor.

---

## T2 — Kadro migration'ı canlıda ama `schema_migrations` kaydı yok

**Sınıf:** DB kayıt tutarlılığı.

### Ölçüm

```bash
npm run check:migrations:warn
```

```
402 dosya · 401 canlı kayıt
CANLIDA KAYDI YOK (1): 20260920100000
```

`20260920100000` kadro konsolu migration'ıdır. Tablolar canlıda **var** (kadro
konsolu çalışıyor), eksik olan yalnız `supabase_migrations.schema_migrations`
satırı.

⚠️ **Bu, bu depoda üçüncü kez oluyor** (18 Temmuz, 20 Temmuz, şimdi). Zararı
şudur: sıfırdan kurulum `baseline + applied/` sırasıyla yapıldığında bu migration
**tekrar çalışır**; idempotent değilse kurulum patlar. Ayrıca `check:migrations`
her oturumda kırmızı yanıp gerçek sapmaları gürültüye boğar.

⚠️ Bellekte "sınıf engelledi, ledger satırı yazılamadı" diye bir not vardı; o iddia
21 Eylül'de **çürüdü** — `psql -f` ile canlıya yazma geçiyor. Yani engel teknik
değil, iş yarım kalmış.

### Yapılacaklar

1. Migration'ın gerçekten uygulandığını şemadan doğrula (tablo/kolon var mı).
2. Ledger satırını yaz:
   ```sql
   insert into supabase_migrations.schema_migrations (version)
   values ('20260920100000')
   on conflict do nothing;
   ```
   Türkçe içerik yok, ama yine de `psql -f` ile dosyadan gönder (PowerShell komut
   satırı tuzağı — CLAUDE.md Türkçe kuralları md.4).
3. `npm run check:migrations` → temiz olmalı.

---

## T3 — Parent dizinde bekleyen migration

> ⛔ **KAPANDI (21.09 akşamı) — bkz. [master](2026-09-21-KALANLAR.md).** Sahibi dosyayı
> `applied/` altına taşıdı: parent dizinde 0 `.sql`, `applied/` 151 dosya. Aşağıdaki
> anlatım tarihsel kayıt olarak duruyor; buradan yeni iş açma.

**Sınıf:** süreç. **Sahibi bu oturum değil.**

```
supabase/migrations/20260921100000_ai_knowledge_base.sql   ← parent'ta
supabase/migrations/applied/                                ← 150 dosya
```

CLAUDE.md'nin belgelediği kör nokta: **parent dizin sürüm karşılaştırmasına girmez.**
`check:migrations` bunu artık ayrı sinyal olarak yakalıyor (`findStrayParentMigrations`)
ve yakaladı da — yukarıdaki çıktının ilk satırı bu.

Bu dosya, AI bilgi tabanı üzerinde **şu an çalışan** oturumun aktif işidir
(`scripts/ai-knowledge/`, `supabase/functions/site-assistant/` ile birlikte henüz
commit'lenmemiş). **Buraya yalnız görünür kalsın diye yazıldı — başka bir oturum
bunu taşımasın.** Akış sahibinindir: yaz → uygula → `applied/` altına taşı.

---

## T4 — İki commit push edilmemiş

> ⛔ **KAPANDI (21.09 akşamı) — bkz. [master](2026-09-21-KALANLAR.md).**
> `git log origin/main..HEAD` boş. Aşağıdaki commit disiplini uyarısı **geçerliliğini
> koruyor** ve master'ın "Kalıcı kısıtlar" bölümüne taşındı.

```bash
git log --oneline origin/main..HEAD    # 2
```

```
6a81755 docs(kalanlar): public rotalar planına yer ve istisna notu ekle
21a67de docs(kalanlar): public rotalar kalan işler planını docs/kalanlar/ altına taşı
```

İkisi de doküman. `main`'e push onay gerektirir (yerleşik kural), o yüzden burada
duruyorlar — **kusur değil, hatırlatma**.

⚠️ Push alırken çalışma dizininde **paralel oturumların yarım işi** var
(`src/components/chat/`, `supabase/functions/site-assistant/`, `scripts/ai-knowledge/`).
`git commit -a` veya dizin pathspec'i kullanma; `git commit -- <dosya>` ile tek tek al.

---

## Çıkış kriterleri

| # | Kriter | Sınıf |
|---|---|---|
| T1 | Canlı fonksiyon listesi ile repo birebir eşleşiyor; kaynağı olmayan 4 fonksiyon ya repoda ya silinmiş; `check:functions` bekçilik ediyor; CLAUDE.md düzeltilmiş | Teslim |
| T2 | `check:migrations` temiz; `20260920100000` ledger'da | DB |
| T3 | Parent dizin boş (sahibi taşıdı) | Süreç |
| T4 | Doküman commit'leri push'lanmış | Teslim |

İş bitince bu dosya **silinir** — README'nin kuralı.
