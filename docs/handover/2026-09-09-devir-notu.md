# Devir notu — 9 Eylül 2026 (gün sonu)

> **Bu belge sıfırdan gelen biri için yazıldı.** Başka bir şey okumana gerek yok.
> Batch numarasını al, o batch'i yap, kapanış turunu koş, commit'le. Batch'ler
> arasında bilgi taşınmaz.

---

## 0. Otuz saniyede durum

| | |
|---|---|
| Depo | `C:\temp_private\corteqs\corteqs_fin` · branch `main` |
| Son commit | `468e766` (13 Eylül) · `origin/main` ile senkron · çalışma ağacı **temiz** |
| Test tabanı | **267 dosya / 1.877 test** yeşil |
| `tsc` | **0 hata** ✅ (109'dan başlamıştı: 22→16→12→9→6→**0**, 13 Eylül'de kapandı) |
| ESLint | **0** |
| Migration | **393/393** sapmasız |
| Pano | `/admin/workshop/cadde` → WS3 sekmesi · **27/31** (yalnız İ2-İ5 açık, içerik/insan işi) |
| Acil liste | Komuta Merkezi → 9 madde, hepsinde 6'şar soru (54 toplam) — 3 gündür cevap yok |

## 0.6 — 13 Eylül ikinci eklenti: "kolay işler" cherry-picking (Q1-Q10)

Kullanıcı "kalan kolay işler için cherry-picking yap" dedi — ürün kararı
gerektirmeyen, tek başına yapılabilecek 10 küçük iş tarandı ve yapıldı:

| Batch | İş | Sonuç | Commit |
|---|---|---|---|
| **Q1** | Kullanılmayan `public/sweet.png` (600KB) | Silindi | `e40c02b` |
| **Q2** | Mobilde (390px) üst nav "Geri Bildirim" kelime ortasından bölünüyordu | `whitespace-nowrap`+`flex-wrap` ile düzeltildi, screenshot'la doğrulandı | `cc6f104` |
| **Q3** | tsc TS2345 — `MvpManager.tsx` hesaplanan-anahtarlı update payload'ı | Tipli dallanmaya çevrildi | `b212f4c` |
| **Q4** | tsc TS2322 — `marquee.test.ts` fixture spread genişlemesi | Sabit `base` nesnesi + sınır cast | `c874d8a` |
| **Q5** | tsc TS2345 — `submissions.test.ts` eksik alanlı fixture | `as unknown as Submission` sınır cast | `c874d8a` |
| **Q6** | tsc TS2589 ×3 — `command-center-items.ts` query builder recursion | `query: any` (cadde-internal.ts ile aynı desen) — **tsc 3→0, proje geneli SIFIR** | `2761e54` |
| **Q7** | T6 rozet görsel doğrulaması (Sabit + Sponsorlu) | "Sabit" doğru (slate-700); **yeni bulgu**: Sponsorlu kartın arka planı hâlâ eski turuncu `--cadde-accent` — rozet pili düzeldi, kart çerçevesi düzelmedi. Kullanıcı onayıyla dokunulmadı | `ad62315` |
| **Q8** | Bronz "tek primary" belirsizliği (aktif filtre çipi + composer butonu) | Karar: filtre çipi durum göstergesi sayılır, kod değişikliği yok | — (karar) |
| **Q9** | `InterestForm.tsx` doğrudan `supabase.from()` çağırıyordu (B6) | `interest-registrations-api.ts`'e taşındı, 2 test eklendi | `468e766` |
| **Q10** | WS1 `m134`: "yorum yazınca hata + görsel netlik gidiyor" | **Kök neden BULUNAMADI** — araştırma bulguları ve somut sorular aşağıda | — (araştırma) |

### Q10 araştırma detayı — kapatılmadı, sorular var

- `client_error_reports` tablosu **sıfır satır** — bu hata canlıda hiç
  yakalanmamış (ya çok eski/tekrarlanmıyor ya da hata raporlama kurulmadan
  önce yaşanmış, 5 Eylül'den önce).
- `commentMutation`'ın `onError`'ı (`CaddePage.tsx:388`) doğru yazılmış:
  `error instanceof Error ? error.message : resolveCaddeRpcErrorMessage(error)`
  — hata toast'a düşüyor, sayfayı çökertecek bir kod yolu görülmedi.
- Görsel yükleme (`uploadCaddeMedia`, `cadde-media.ts:118`) dosyayı **olduğu
  gibi** yüklüyor — hiçbir sıkıştırma/yeniden boyutlandırma adımı yok, yani
  kod tarafında netlik kaybettiren bir işlem yok.
- `CaddeMediaGallery.tsx:33-38`'te **İLİŞKİLİ ama FARKLI** bir geçmiş düzeltme
  var (m64): tek görselde `object-cover` dikey fotoğrafı ince bir şeride
  kırpıyordu, `object-contain`'e çevrildi. Bu "görsel bozuk görünüyor"
  şikâyetini kısmen açıklıyor olabilir ama m134'ün "netlik" iddiasıyla birebir
  aynı değil — kırpılma ile bulanıklık farklı şeyler.

**Kullanıcıya sorulacak somut sorular (madde kapanmadan önce gerekli):**
1. Bu hata hâlâ tekrarlanıyor mu, yoksa eski bir rapor mu?
2. Hangi tarayıcı/cihaz? (masaüstü/mobil, Safari/Chrome)
3. "Sayfa hataya geçiyor" derken tam olarak ne görünüyor — beyaz ekran mı,
   bir hata mesajı mı, yoksa yorum kutusu mu tepkisiz kalıyor?
4. Görsel netliği kaybı yorum EKLERKEN mi oluyor, yoksa ana gönderi
   paylaşırken de mi? (iki farklı yükleme yolu var, hangisi olduğunu ayırt eder)
5. Hangi dosya formatı/boyutu? (HEIC gibi bazı formatlar tarayıcıda önizlemede
   bozuk görünebilir, bu da kod hatası değil format uyumsuzluğu olurdu)

---

## 0.5 — 13 Eylül eklentisi *(9-10 Eylül'ün 3 gün sonrası devamı, 10 madde/batch)*

3 gündür yeni commit yoktu ve hiçbir acil soruya cevap gelmemişti — ama tarama
sırasında **terk edilmiş bir worktree**'de yarım kalmış, commit'lenmemiş bir
Cafe-format kararı bulundu. Bu bulgu günün önceliğini belirledi. Yapılanlar:

| Batch | İş | Commit |
|---|---|---|
| **P1** | `.worktrees/c0-async`'ta bulunan taslak bitirildi: C0 kararı **async-first** onaylandı (odalar 1-7 gün açık, eskiden 2 saat), C3 (süre sonu metni) aynı pakette geldi | `98cfd76` |
| **P2** | K1 kararı: tepki seti 5→3'e indirildi (Beğendim, Destek, Soru). Kalp/Gülme kaldırıldı — canlıda hiç kullanılmamışlardı (0 satır) | `48dad5a` |
| **P3** | GOOGLE AUTH ID'nin 6 soruluk yorumu 10 Eylül sabahı yanlışlıkla silinmiş bulundu, kullanıcı onayıyla aynen geri eklendi | `77bbab3` |
| **P4** | `e2e/cadde-visual-qa.spec.ts` (yeni) — 5 ekranlık screenshot altyapısı, gerçekten çalıştırıldı ve incelendi | `5f88232` |
| **P4 bonus** | Bu incelemede bulundu: Cafe rozeti "Canlı" diyordu, hemen altındaki metin "asenkron çalışır" diyordu — DOĞRUDAN çelişki. "Açık" olarak düzeltildi | `5f88232` |
| **P5** | Gözle-QA'nın 11 maddesi tek tek kapatıldı/işaretlendi (bkz. §6) | `1bbec6d` |
| **P6** | `docs/plans/2026-09-09-cadde-ux-ui-batch-plani.md` DB ile senkronize edildi | `1bbec6d` |
| **P7** | Tek test cafe'si (`title='Test'`) arşivlendi (silinmedi, geri alınabilir) | `310d255` |
| **P8** | Eski "MVP V2 merge" todo'suna, kapsamının artık acil listeye taşındığını söyleyen not eklendi | `01e04f0` |
| **P9** | Main'e tam merge olmuş ölü `codex/limit-sprint-2026-08-30` dalı yerelden silindi (origin'e dokunulmadı — kullanıcı kararı) | — |
| **P10** | Devir notu bu bölümle 13 Eylül ölçümüne çekildi | — |

**Kapsam dışı bırakılan, kullanıcı onayıyla dokunulmayan bulgu:** mobilde
(390px) üst nav çöküyor — "Geri Bildirim" iki satıra bölünüp "Araçlar"/
"Profilim" ile çakışıyor. Bugünkü batch'lerin konusu değildi, önceden var
olan bir sorun. **Ayrı bir gün/batch olarak planlanmalı.**

**✅ DEPLOY KAPANDI (10 Eylül 00:35'te ölçüldü).** Önceki turdaki "canlıya çıkmadı"
maddesi çözüldü; kullanıcı Coolify'dan yeniden yayınladı ve soru/cevap sistemi
canlıda doğrulandı.

⚠️ **Ama doğrulama yöntemi değişti — eski reçete yanıltıcıydı.** Devir notunun
önceki hâli "chunk adını yerelde derle, canlıda `curl` ile ara" diyordu. Bu **geçersiz**:
JS chunk adları içeriğe göre türetiliyor ve build `VITE_*` değişkenlerini dosyaya
gömüyor, dolayısıyla yereldeki ad ile Coolify'daki ad **aynı commit'te bile farklı
çıkabiliyor**. Bugün tam bu tuzağa düşüldü — iki farklı yerel chunk adı da 404 döndü
ve deploy "olmamış" sanıldı, oysa olmuştu. (CSS adı env gömmediği için eşleşiyordu:
canlı ve yerel `main-C9HatNXQ.css` aynı.)

**Doğru reçete — canlı dosyanın adını canlıdan öğren:**

```text
# 1) index.html'deki giriş chunk'ını al, 2) içinden gerçek chunk adını çıkar,
# 3) o chunk'ta kendi metnini ara.
main = /assets/main-*.js            (index.html içinde yazılı)
grep 'CommandCenterManager-[A-Za-z0-9_-]+\.js'  <main>   -> canlı chunk adı
grep 'Soru / cevap ('                            <chunk> -> kendi metnin
```

Bugün böyle ölçüldü: canlı chunk `CommandCenterManager-09PZbAa-.js`, içinde
`Soru / cevap (${S.length})` **var** → `dfa50ef` yayında.

---

## 1. Bugün ne yapıldı

27 Ağustos'ta yapılan iki dış denetimin (`docs/cadde-300/2026-08-27-ux-degerlendirme.md`,
`2026-08-27-ui-kritigi.md`) **31 açık maddesinden 23'ü** kapatıldı.

| Commit | İş |
|---|---|
| `cdfa100` | H1 — sıfır tepki/yorum/paylaşım sayaçları gizlendi |
| `60d1df8` | H2 — anlamsız "Caddeye Çık" butonu kaldırıldı |
| `765fb7c` | H3 — Pinned→Sabit, Feedback Ver→Geri Bildirim, Host→Ev Sahibi (8 yer) |
| `08225f7` | H4 — girişli üyeye pazarlama sloganı gösterilmiyor |
| `9021507` | H5 — beta bandı kapatılabilir + kalıcı |
| `d90350d` | **B1+B2** — boş daraltılmış akışta üst kapsam sunuluyor |
| `d5ec924` | C1+C2 — kapasite paydası gizlendi, Arşivle kebaba taşındı |
| `bdb6de8` | Y1 — kimlik şeridi kaldırıldı, zil kapsam şeridine taşındı |
| `a82d86c` | Y2 — scroll'da header daralması |
| `3a236e5` | T1 — marka token'ları + tasarım kuralı dokümanı |
| `3853a1d` | T2 — bronz birincil eylem |
| `2aa4dab` | T3 — buton hiyerarşisi |
| `0af23bf` | T4 — üst nav tek nötr renk |
| `1e0d65f` | Acil maddelere soru/cevap yorum sistemi |
| `dce73ad` | T5 — gökkuşağı şerit pillar renk koduna çevrildi |
| `f0c1740` | T6 — 13 rozet stili 3 tipe indi (`CaddeBadge`) |
| `8faa22a` | T7 — 9 yarıçap değeri 1'e indi + AA kontrast alt sınırı |
| `050a2b2` | T8 — cafe kartındaki çelişen renk sinyali giderildi |
| `dfa50ef` | Yorum sayısı kapalıyken de görünüyor (kendi kusurum) |
| `06d17cd` | 10 Eylül duyurusu + günlük özet maili tetiklendi |

Yol üstünde kapatılan eski borçlar: `74b16fb` S1 · `5493de7` S2 · `088d12d` S3 ·
`01fa683` tip borcu · `60d03ed` O2 güvenlik · `f376a4f` araç kataloğu ·
`382bbf2` sahipsiz dosyalar · `72f4bdd` kırılgan test.

---

## 2. ⚠️ ÖNCE BUNU OKU — bu oturumun en pahalı dersi

**Plandaki reçeteler DÖRT KEZ yanlış çıktı.** Dördü de dosya açılmadan doğru
varsayılsaydı zarar verecekti:

1. **H1** — plan iki adres veriyordu, **dördü** vardı. Verilen `:974` yalnız tepki
   paneli *açıkken* çiziliyor; kapalı kartta görünen sayaç başka yerde.
2. **H2** — plan "testi de kaldır" diyordu; o satır ayrı bir test değil, başka bir
   testin içindeki üç iddiadan biriydi. Ayrıca "ölü kod" denen `scrollToComposer` ve
   `Megaphone` **canlı kullanımdaydı** — silinseydi derleme kırılırdı.
3. **B1** — plan `:1283` diyordu, metin `:1305`'teydi ve **başka bir yüzeydeydi**
   (boş durum kartı değil, sağ raildeki panel). Dört test ona bağlıydı.
4. **Y1** — plan "başlığı header'a taşı" diyordu; ölçünce taşınacak başlık olmadığı
   (`h1` yok) ve şerit yüksekliğini **zilin** belirlediği çıktı. Sözlük anlamıyla
   uygulansa **~0px** kazandırıp 61 rotayı riske atacaktı.

> **KURAL:** batch metnindeki satır numarası ve "şunu da sil" talimatı, **dosya
> açılmadan doğru varsayılmaz.** Önce oku, sonra uygula.

---

## 3. Her batch'in değişmez kapanış turu

```
npm run test        # taban 262 dosya / 1.851 — DÜŞERSE DUR
npm run lint        # taban 0
npx tsc -p tsconfig.app.json --noEmit   # taban 6 — ARTMAMALI
```

**Çalışma dizini BÜYÜK harfli `C:` olmalı.** Küçük harfli `c:` ile vitest testlerin
çoğunu *sahte* kırar (Node `file:///c:/` ile `file:///C:/` adreslerini farklı modül
sayar). Bağımlılık düşürme.

**Commit her zaman pathspec'li:** `git commit -- <yalnız dokunduğun dosyalar>`.

**`src/lib` altına yeni export ya da `scripts/` altına yeni dosya eklediysen
`npm run ingest:tools` çalıştır.** Uyarı: plan "yoksa test kırılır" diyor —
**kırılmıyor**, bu oturumda üç kez sessizce sapma bıraktı. Elle koş.

---

## 4. KALAN İŞLER — küçük batch'ler

Kaynak plan: `docs/plans/2026-09-09-cadde-ux-ui-batch-plani.md`.
Tasarım kuralı: `docs/modules/cadde-design-tokens.md`.

### ✅ T — Tasarım sistemi *(T1–T8 TAMAMLANDI)*

Tüm grup kapandı. Üç sözleşme testi bu sistemi kilitliyor — **gevşetme**:
`cadde-style-contract` (renk token'dan gelir) · `cadde-surface-contract`
(tek yarıçap, kontrast tabanı) · `cadde-badge-contract` (üç rozet tipi).

### ✅ C — Cafe *(C0-C3 TAMAMEN KAPANDI, 13 Eylül)*

**C0 kararı verildi: async-first.** Terk edilmiş bir worktree'de (`.worktrees/c0-async`)
zaten neredeyse bitmiş bir taslak bulundu, kullanıcıya gösterildi, onaylandı,
rebase edilip main'e taşındı (`98cfd76`). Odalar artık 2 saat değil **1-7 gün**
açık kalıyor (`cadde_settings.cadde.cafe.mode=async_first`). **C3** aynı pakette
geldi — oda kartına gerçek davranışı anlatan tek satır eklendi.

⚠️ Bu değişiklik bir yan etki de doğurdu: cafe rozeti hâlâ **"Canlı"** diyordu,
yeni "asenkron çalışır" metniyle **doğrudan çelişiyordu**. Gözle QA'da (P5)
bulundu, **"Açık" olarak düzeltildi** (`5f88232`).

### ✅ K — Karar *(K1 KAPANDI, 13 Eylül)*

**K1 (m156) kararı verildi: evet, 3'e indi.** Beğendim, Destek, Soru (eski adı
"Emin olamadım") kaldı; Kalp ve Gülme kaldırıldı — ölçüldü, canlıda hiç
kullanılmamışlardı (`cadde_post_reactions`'ta 1 satır, o da 'like'). SQL↔TS
ayna sözleşmesi (`cadde-rules.test.ts`) ve "üç tepki tek tetiğin arkasında"
kontratı güncellendi, gevşetilmedi (`48dad5a`).

### İ — İçerik / soğuk başlangıç *(4 batch kaldı — KOD İŞİ DEĞİL)*

> Kaynak dokümanın en kritik başlığı: *"Header'ı düzeltmek 1 saatlik iş; boş akış ürünü
> öldürür."* Kodu yapıldı, **içeriği hâlâ duruyor.**

**9 Eylül'de ölçülen canlı durum** (değişmedi, yeniden ölçülmedi):
**21** yayınlanmış public gönderi · 58 şehrin **10'unda** paylaşım var · en dolu şehir
**4** (Doha, Antalya) · Berlin **1** · en dolu ülke Türkiye **8**.

**✅ İ1 KAPANDI (13 Eylül, `310d255`):** tek test cafe'si (`title='Test'`,
özet `agwdhjsajkkjsddfgsegdsfsdg`) arşivlendi — silinmedi, `archived_at` ile
geri alınabilir durumda.

| Batch | Madde | İş | Kim |
|---|---|---|---|
| **İ2** | m164 | Test içeriği için admin'e görünür seviye ya da staging kur | UBT (kod+DB) |
| **İ3** | m165 | Berlin, Londra, Sydney, Dubai için 8-10 gerçek soru/not hazırla | Burak |
| **İ4** | m166 | Resmî hesaptan yayınla, tarihleri geriye yay | Burak · İ3 sonrası |
| **İ5** | m167 | Blog ↔ Cadde döngüsü | Burak |

⚠️ İ1'de canlı DB'ye **Türkçe SQL** yazacaksan **UTF-8 dosya + `psql -f`** kullan;
PowerShell komut satırından geçen Türkçe karakter bozulur (`0xc7 0x69` hatası).
⚠️ `geo_cities` **76.990** satır. Satır başına fonksiyon çağıran keşif sorgusu
**canlıyı düşürür** — 5 Ağustos'ta tam olarak bu oldu, 50 dakika kesinti. Önce
`select distinct` ile küçült, sonra join'le.

---

## 5. Acil işler listesi (TOP 10 HOT FIX) — kod değil, **cevap** bekliyor

Panoda **9 madde** var (tavan 10, bir slot boş). İlk 4'ü 5 Eylül'den; kalan 5'i
13 Mayıs toplantı paketinden 10 Eylül'de taşındı (mig `20260910010000`).
Dokuzunun her birinde **6 soru** var — toplam **54 soru**.

⚠️ **13 Eylül'de 3 gün sonra tekrar bakıldı: hiçbir soruya cevap gelmemiş.**
Tek değişiklik, GOOGLE AUTH ID'nin sorularının 10 Eylül sabahı **yanlışlıkla
silindiğinin** fark edilip aynen geri eklenmesiydi (`77bbab3`) — kullanıcıya
sorulup teyit edildi. Cevaplar gelmeden bu 9 maddeye kod yazma.

### İlk dört madde — **ölçtüm; dördü de yazılandan farklı çıktı:**

| Yazılan | Gerçek durum |
|---|---|
| Radar'ı "açalım" | Kapalı **değil**. Cron her sabah 05:00 başarıyla koşuyor (88 başarılı çalışma) ama **20 Temmuz'dan beri tek tarama üretmiyor** — ~7 haftadır sessizce bozuk. **"Aç" işi değil, "tamir" işi.** |
| Grupları "açalım" | Sayfalar 4 Ağustos'ta **silinmiş** (hiçbir yerden bağlantı yoktu). Veri duruyor (10 grup). Katılım talebi tablosu **boş**. |
| Etkinlik "kolayca eklenir" | `events`/`event_details` tabloları var ama **tamamen boş**. Cadde'deki "Etkinlikler" süzgeci 4 Ağustos'ta **kullanıcının kendi kararıyla** kaldırılmış. |
| Google Auth | Planı **2 Ağustos'ta yazılmış** (`docs/operations/2026-08-02-supabase-custom-domain-google-oauth.md`), hiçbir adımı başlamamış. Çoğu ayar işi. |

### Sonradan eklenen beş madde — 13 Mayıs paketi *(10 Eylül)*

`GRUP EKLEME POLİTİKASI` · `GRUP ONAY AKIŞI` · `GRUP FORMU ALANLARI` ·
`ŞEHİR GRUPLARINI TOPLAMA` · `GRUP EKLEME ÇAĞRISI` — hepsi `Burak`, priority 9.
Kaynağı: Komuta Merkezi'nde priority 9 + urgent olan tam olarak bu beş todo'ydu
(ölçüldü, hepsi `sort_order 13018`). **Kaynak todo'lar silinmedi** — bu depoda bir
işin iki yüzeyde birlikte durması yerleşik desen.

⚠️ **Ölçüm bu beş maddenin gerekçesini çürüttü — bunu okumadan koda dokunma.**
Maddeler "şunu belirle / şunu yaz" diye yazılmış ama grup ekleme özelliği
**canlıda çalışıyor**: `/addcom` production'da **200**, ana sayfadan link var,
üye giriş yapıp grup gönderebiliyor, gönderi admin onayına düşüyor
(`status` pending/approved/rejected + `rejection_reason`), moderasyon ekranı
`/admin/whatsapp-landings` admin menüsünde, gönderen rolü ayrımı
(`submitterRole: manager | member`) formda. Yani sorulan kararların çoğu koda girmiş.

| Ölçülen gerçek kusur | Sayı |
|---|---|
| `whatsapp_landings.city = 'Genel'` | **10/10** — şehir bilgisi fiilen yok |
| `country` serbest metin | `GCC` · `Global` · `GCC-Global` · `EU+MENA` · `KATAR` · biri **şehir** (`İstanbul`) |
| `member_approved = false` | **10/10** — "Üye onaylı!" rozeti canlıda **hiç** görünmemiş |
| `whatsapp_join_requests` | **0 satır** — bugüne kadar tek katılma talebi yok |
| `whatsapp_link` boş | **1/10** (METU QATAR) — sayfa açılır, katılınamaz |
| `member_count` dolu | **1/10** · `whatsapp_message_templates` **boş** |
| Yazılı kural metni | **yok** · `/addcom` sitemap'te de **yok** |

10 grubun tamamı iki yönetici hesabımızdan eklenmiş — dışarıdan gelen başvuru yok.
Sözleşme testi: `src/lib/dashboard/hot-fix-whatsapp-seed.test.ts` (8 test). En çok
işe yarayan ikisi **liste tavanını** (10) ve **soru sayısının sessizce eksilmesini**
kilitliyor; ikisi de bozulsa hiçbir şey patlamaz, kimse fark etmezdi.

**✅ Sorular artık panonun İÇİNDE — ayrı belgeye bakmaya gerek yok.** Dört maddenin
her birinin altındaki **"Soru / cevap"** bölümüne birer yorum yazıldı: önce
"DURUM (… bakıldı)" paragrafı, sonra **6'şar numaralı soru** (anlaşılan aralık
madde başına 5–10). **Dokuz madde × 6 = 54 soru**, günlük dille — cevaplayacak kişi
geliştirici değil. İlk dördünün yedek kopyası:
`docs/plans/2026-09-09-hotfix-sorulari.md`.

Sistem veritabanı bağlantılı: `command_center_hot_fix_comments` (mig
`20260909210000`), RLS yalnız admin, silme *soft*. Hem soruyu hem cevabı iki taraf
da aynı yere yapıştırabiliyor. Düğme yorum sayısını **kapalıyken de** gösteriyor —
"Soru / cevap (6)".

**Cevaplar gelmeden bu dört madde için kod yazma** — dördünde de yanlış işe girişilir.

---

## 6. Gözle-QA — **KONTROL EDİLDİ (13 Eylül, P4+P5)**

⚠️ Gerçek bir tarayıcıda DEĞİL — Playwright ile mock ağ üzerinden 5 ekran
üretildi ve tek tek incelendi (`e2e/cadde-visual-qa.spec.ts`,
`$env:VISUAL_QA="1"; npx playwright test e2e/cadde-visual-qa.spec.ts`,
çıktı `test-results/visual-qa-cadde/*.png`). Bu, tıklama akıcılığı/jitter gibi
gerçek etkileşim hislerini ölçmez ama yerleşim, renk ve metin çelişkilerini
kesin olarak gösterir. Aşağıdaki 11 madde bu ekranlara göre kapatıldı:

1. **Üst alan** — ✅ kimlik şeridi yok, ilk gönderi ("Berlin'de ilk buluşma")
   900px yükseklikte fold'un üstünde net görünüyor.
2. **Scroll'da header** — ✅ KISMEN: 400px scroll sonrası header bandı görünür
   şekilde küçülüyor (~55px kazanç). **Akıcılık/titreme/yukarı-dönünce-büyüme**
   statik screenshot'la ölçülemedi — video/etkileşim testi gerekir.
3. **Zilin yeri** — ✅ filtre satırının sağ ucunda, mobilde de bozulmuyor.
4. **Kapsam şeridi sarma** — ✅ mobilde (390px) dört çip iki satıra doğal
   şekilde sarıyor, kırık/üst üste binme yok.
5. **Boş şehir akışı** — ✅ TAM DOĞRULANDI: `?city=Berlin` ile açılan ekranda
   "Almanya akışındaki 1 paylaşım → gör" (ikincil buton) + "İlk paylaşımı yap"
   (tek bronz primary) yan yana, metin `sparseContentHint` ile birebir eşleşiyor.
6. **Cafe odası** — ✅ payda yok ("2 üye", "2/100" değil), Arşivle ana pozisyonda
   DEĞİL — kebab (⋯) menüsü kartın sağ altında duruyor.
7. **Bronz butonlar / tek primary kuralı** — ⚠️ KISMEN ÇELİŞKİLİ: ana akışta
   "Paylaş" (composer) VE aktif "Tümü" filtre çipi AYNI ANDA bronz renkte.
   Boş-şehir kartında ise kural tam tutuyor (yalnız "İlk paylaşımı yap" bronz).
   Filtre çipinin "aktif durum" rengi mi sayılacağı yoksa T3'ün "primary"
   tanımına mı gireceği bir ürün kararı — kesin hüküm verilmedi.
8. **Kart şeritleri (T5)** — ✅ NET ÇALIŞIYOR: gönderi kartı bronz üst şerit,
   Cafe odası kartı yeşil üst şerit. Karışık akışta bağlam gerçekten renkten
   okunuyor, gürültülü değil.
9. **Rozetler (T6)** — ❌ DOĞRULANMADI: mock veri "Sabit" veya "Sponsorlu"
   içermiyordu, bu iki rozet hiç ekrana gelmedi. Ayrı bir tur gerekir.
10. **Köşeler (T7)** — ✅ tek, tutarlı yarıçap; "sert" değil, derli toplu duruyor.
11. **Gri metinler (T7)** — ✅ ikincil metinler (konum/tarih/etiket) okunaklı
    orta-koyu gri, hiyerarşi kaybolmamış.

### Taramada bulunan İKİ YENİ sorun (11 maddenin dışında)

- **✅ DÜZELTİLDİ (13 Eylül, `5f88232`):** Cafe odası rozeti "Canlı" diyordu
  ama hemen altındaki metin "Bu Cafe asenkron çalışır" diyordu — aynı kartta
  DOĞRUDAN çelişki, bugünkü C0 (async-first) kararının "Canlı" etiketini
  güncellemeden bırakmasından kaynaklanıyordu. "Açık" olarak değiştirildi.
- **⚠️ AÇIK, DOKUNULMADI (kullanıcı kararı — kapsam dışı):** Mobilde (390px)
  üst nav çöküyor — "Geri Bildirim" iki satıra bölünüp "Araçlar"/"Profilim"
  ile çakışıyor. Bugünkü batch'lerin konusu değildi, önceden var olan bir
  sorun. Ayrı bir gün/batch olarak planlanmalı.

---

## 7. Bu oturumda öğrenilen tuzaklar

1. **Sözleşme testinde `toContain` YETMEZ.** Yazdığım sınıf-adı testi, adı `__logoX`
   yapınca **düşmedi** — alt dize eşliyor. Word-boundary regex şart. *Kasten bozarak
   denemeseydim, koruduğunu sanıp bırakacaktım.*
2. **Kırılgan testte önce mock'a bak, iddiaya değil.** Yorum sayfalama testini **iki kez
   yanlış** düzelttim (`toHaveBeenLastCalledWith` → `toHaveBeenNthCalledWith`); ikisi de
   çağrı sırasına dayanıyordu. Asıl sorun `mockResolvedValueOnce` zinciriydi — mock
   imlece bağlanınca kökten çözüldü.
3. **`git checkout -- <dosya>` commit'lenmemiş işi siler.** Bir testi denerken kendi CSS
   bloğumu böyle kaybettim. Denemeden önce commit et.
4. **Yeni DB tablosu eklerken `types.ts`'i yeniden üret**, `as any` ile geçiştirme.
   Yol: Management API + `.env.local`'daki `SUPABASE_ACCESS_TOKEN`. (tsc 6→12 çıkmıştı,
   üretince 6'ya döndü.)
5. **supabase-js hataları DÜZ NESNEDİR**, `Error` değil. `sanitizeError` yalnız
   `instanceof Error` bakıyor — supabase hatalarında mesajı yutar. Kardeş modüllerdeki
   `message`/`details`/`hint` okuyan eşleyiciyi kullan.
6. **Deploy'u "oldu" sayma, canlı bundle'da kendi metnini ara — ama chunk adını
   YERELDE ÜRETME.** Bu ders bugün iki kez, iki farklı yönde öğrenildi.
   Önce doğru tarafı: deploy zaman damgası taze görünüyordu, oysa commit kuyruğa
   girmemişti. Sonra yanlış tarafı: yerelde derleyip bulduğum chunk adını canlıda
   arayınca **404** aldım ve "hâlâ çıkmamış" dedim — halbuki çıkmıştı. JS chunk
   adları içerik hash'i taşır ve build `VITE_*` değişkenlerini dosyaya gömer, bu
   yüzden **aynı commit yerelde ve Coolify'da farklı ad üretebilir**. Doğru yol:
   canlı `index.html` → canlı `main-*.js` → onun içinden gerçek chunk adını
   oku → o chunk'ta kendi metnini ara. (Ayrıntı ve komut: bu notun başındaki
   "Doğru reçete" bloğu.)

---

## 8. İlgili belgeler

- `docs/plans/2026-09-09-cadde-ux-ui-batch-plani.md` — batch dökümü (H/B/Y ✅, T kısmen)
- `docs/plans/2026-09-09-hotfix-sorulari.md` — acil maddeler için sorular
- `docs/modules/cadde-design-tokens.md` — T grubunun dayanağı
- `docs/cadde-300/2026-08-27-ux-degerlendirme.md` · `2026-08-27-ui-kritigi.md` — kaynak denetimler
- `docs/plans/2026-09-07-kalan-isler-batch-listesi.md` — genel teknik borç (ayrı plan)
  ⚠️ **Harf çakışması:** orada `T` = tip borcu, burada `T` = tasarım sistemi. Batch
  numarası söylerken hangi plandan olduğunu belirt.
