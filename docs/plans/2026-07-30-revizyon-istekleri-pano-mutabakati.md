# /admin/revision-requests — Pano Mutabakatı + Hızlı Kazanımlar

> Plan tarihi: 30 Temmuz 2026 · Durum: **yazıldı, uygulanmadı** (kod/SQL yok)
> Kapsam kararı kullanıcı onaylı: mutabakat + hızlı kazanımlar. Büyük özellikler ve karar bekleyenler parkedilir.

## Neden

`/admin/revision-requests`, adminlerin site/ürün revizyon taleplerini açtığı serbest kalem panosu
(tablolar: `revision_requests`, `revision_request_comments`, `revision_request_attachments`;
migration `20260628100000`, veri katmanı [revision-requests.ts](../../src/lib/admin-shell/revision-requests.ts)).
İçeriği 12 Haziran'daki *MVP DÜZELTMELER* listesi + 17-18 Temmuz'daki ek liste
(seed `20260718120000_revision_requests_mvp_seed.sql`).

**Sorun: pano kodun gerisinde kalmış, bu yüzden yanlış tabloyu gösteriyor.**

Canlı DB ölçümü (30 Temmuz): **53 madde · 43 açık · 6 yapıldı · 4 iptal · 10 yorum · 4 ek.**

19 Temmuz'da bir triyaj yapılmış ([admin-updates.ts:332-343](../../src/lib/admin-shell/admin-updates.ts#L332))
ve o triyaj kapasite seçenekleri, tema/kategori karışıklığı, WhatsApp geri bildirim linki,
"Aktif Cafe Özeti" başlığı, Çarşı+Cadde foto/video maddelerini açıkça **"hâlâ geçerli"** işaretlemiş.
Ardından 29-30 Temmuz'da Cadde V1 (`0824125` → `cbc64f7`) ve 29 Temmuz arayüz onarımları (`0d2eab7`)
tam bu maddeleri teslim etmiş — **ama panoya dönülmemiş.** 43 açığın 14'ü kodda bitmiş durumda.

**Amaç:** panoyu gerçeğe döndürmek, sonra kalan maddelerden yeri kanıtla saptanmış olanları düzeltmek,
kalanları karar bekleyen / ayrı spec olarak açıkça parkederek listeyi güvenilir hale getirmek.

Faz 1 maddeleri `yapildi` DEĞİL **`inceleniyor`** olarak kapatılır — kod main'de ama canlıya deploy
edilmedi (`SONDURUM.md` §C), pano yalan söylememeli.

---

## Faz 1 — 14 maddeyi kanıtla ve `inceleniyor`a çek

Tek SQL geçişi: her maddeye hangi commit/dosyanın karşıladığını yazan bir
`revision_request_comments` kaydı + `revision_requests.status = 'inceleniyor'`.
Kanıtların **tamamı doğrulandı** (canlı DB + kod okuması):

| # | Madde (area ▸ başlık) | Kanıt |
|---|---|---|
| 1 | Kafe Açış ▸ Kapasite 50–999 | [cadde-schemas.ts:8](../../src/lib/cadde-schemas.ts#L8) — istenen 5 değerin birebiri · `1d86d10` |
| 2 | Kafe Açış ▸ Temalar (spor/sağlık/gusto/hobi/girişim/party/meslek/ik/müzik/gündem) | canlı `cadde_cafe_themes` = 16 tema · `1d86d10` |
| 3 | Kafe Açış ▸ "Tema'lar tema değil kategori olmuş" | aynı — kod gömülü 7 kategori kalktı, temalar DB'de |
| 4 | Kafe Açış ▸ Marka blue tik + Parodi | canlı `cadde_protected_brands` = **96 marka** + `AdminCaddeBrandsPage` · `1d86d10` |
| 5 | Çarşı ▸ İlan foto/video | `CarsiItemForm.tsx` (6 foto + 1 video) · `c7f90a1` |
| 6 | Paylaşım ▸ Doğrudan text/foto-video | `CaddeComposer.tsx` · `0824125` |
| 7 | Paylaşım ▸ Tagleme netleşsin | serbest #hashtag + @mention · `5758f24` |
| 8 | Feed ▸ "Aşağıdaki bölüme ihtiyaç var mı — direkt paylaşsa" | tek kutulu composer · `0824125` |
| 9 | Feed ▸ "Aktif Cafe Özeti" → Cafe'ler (filtre dahil) | [CaddePage.tsx:374](../../src/pages/cadde/CaddePage.tsx#L374) — istenen biçimin birebiri |
| 10 | Görünür Ol ▸ Geri bildirim WhatsApp'a gidiyor | [CaddePage.tsx:759](../../src/pages/cadde/CaddePage.tsx#L759) → `/feedback?kaynak=cadde` · `0d2eab7` |
| 11 | Görünür Ol ▸ Saatler 3'e düşsün | [CaddeWorldClocks.tsx](../../src/components/cadde/CaddeWorldClocks.tsx) — senin saatin + İstanbul + filtre şehri · `0d2eab7` |
| 12 | Feed ▸ Refresh'te footer'a gidiyor | scroll yönetimi uygulamaya alındı · `0d2eab7` — ⚠️ gerçek cihazda doğrulanmadı |
| 13 | Cadde ▸ Ülke/şehir filtresi fazla daralmış (ABD sadece NY) | `cbc64f7` — şehir 6→51, ülke 5→18 · ⚠️ ABD kapsamı ayrıca ölçülmeli |
| 14 | Billboard ▸ "ilan vermeyi çalıştırsak, Stripe gelince ödeme" | ücretli mod altyapısı kurulu ama **kapalı** · `c7f90a1` — kısmi |

**12-13-14 kısmi:** yorumları "hangi kısmı bitti, neyi doğrulamak lazım" diye açık yazılacak,
tamamlanmış gibi gösterilmeyecek.

**Uygulama:** tek SQL dosyası; her `update` önce `begin; … rollback;` ile kuru koşulur, sonra
`--single-transaction -f` ile uygulanır. Migration değil — yalnız veri güncellemesi,
`schema_migrations` kaydı gerekmez.

---

## Faz 2 — Yeri kanıtla saptanmış düzeltmeler

Panodaki 6 madde + araştırmada çıkan 2 ek bulgu. **Çoğu SQL tarafında** — beklentiden farklı olan
nokta bu: Araçlar modülünün soruları ve CTA'ları koda değil DB'ye gömülü.

### 2A — Veri / SQL (yeni migration)

| İş | Konum | Not |
|---|---|---|
| Readiness testinde 2 kırık CTA href'i: `/relocation/tools/<slug>` → `/tools/<slug>` | `20260701120000_relocation_tools_20q_normalize.sql:723-727` | Route `/relocation/tools/*` hiç yok ([App.tsx:169](../../src/App.tsx#L169) `/tools/:toolSlug`). Panodaki "CTA linklerinden ikisi çalışmıyor" tam bu. |
| **Bonus regresyon:** `yurtdisi-is-bulma-olasiligi` → `is-bulma-olasiligi` | aynı migration `:479, :2015, :2313` | Daha önce `20260626240000_relocation_tools_cta_fixes.sql` ile düzeltilmiş, `20q_normalize` geri getirmiş. Panoda yok — araştırmada bulunan ek kusur. |
| `relocation_professions` seed genişletme | canlı tablo: **5 kayıt** | "Meslek seçeneği az" maddesi literal doğru. |
| `relocation_locations` seed genişletme | canlı tablo: **2 kayıt** (1×DE, 1×NL) | "UK'de şehir bulunamadı" maddesinin **gerçek kök nedeni**. Araç dünyada 2 şehirle eşleşebiliyor; UK'de boş dönmesi kaçınılmaz. Fallback tek başına çözmez. |
| `search_directory_catalog` RPC'sine admin/yönetici rol dışlaması | canlı fonksiyonda **admin filtresi YOK** | "Searchde super admin yönetici çıkıyor" maddesi. Dizin listesi TS'ten değil bu RPC'den geliyor ([catalog-directory.ts:191](../../src/lib/catalog-directory.ts#L191)) → düzeltme SQL tarafında. |

### 2B — Frontend

| İş | Konum | Not |
|---|---|---|
| **Kritik:** `disabled` sabit kodlu, `Link`/`navigate` hiç yok → 3 CTA'nın tamamı tıklanamaz | [ResultCtaPanel.tsx:36](../../src/components/relocation/tools/ResultCtaPanel.tsx#L36) | `onCtaClick` hiçbir çağırandan geçilmiyor. Pano "ikisi kırık" diyor; gerçek durum daha kötü. `ResultCtaPanel.test.tsx:25-48` bu davranışı kilitliyor → test de güncellenecek. |
| Test sonuç sayfasına geri dönüş | `useRelocationToolSession.ts:40` + route [App.tsx:185](../../src/App.tsx#L185) | Sonuç `relocation_tool_results`'ta **kalıcı** (`result_id`) ve `/tools/:toolSlug/result/:resultId` route'u zaten var → **düşük maliyet, şema değişikliği yok.** |
| `city_match` boş sonuç fallback'i (en yakın N şehir) | [ToolResultView.tsx:91-96](../../src/components/relocation/tools/ToolResultView.tsx#L91) · SQL `relocation_score_city_match_v1` boşaltan filtre `20q_normalize:891-893` | 2A'daki şehir seed'iyle **birlikte** yapılmalı. |
| Like/destek hover-card | [CaddePage.tsx:582-632](../../src/pages/cadde/CaddePage.tsx#L582) · hazır bileşen [hover-card.tsx](../../src/components/ui/hover-card.tsx) | Popover var, hover yok. Yeni bağımlılık gerekmiyor. |

**Commit bölümlemesi:** 2A tek migration + 2B'de Araçlar / Cadde ayrı commit'ler; her biri kendi testiyle.

---

## Faz 3 — Park listesi (koda dokunulmaz)

### 3A — Ürün kararı bekleyen (~16 madde)
"Tasarım planı nedir?", "konuşalım", "ne düşünebiliriz" diyenler: kullanıcı paneli tasarımı ·
RADAR ikinci el ilan fikri · RADAR item metinleri · CADDE mascot billboard · CADDE "excel gibi
duruyor" estetiği · kategori kart gösterimi · relokasyon "Yakında" bandı · haritada daha çok nod ·
haberler ülke/şehir filtresi · arama kutusunda diaspora vs diaspora+TR ayrımı.

Kullanıcı bu turda ikisini açıkça parkettı:
- **Tool sayfası tagline'ı** — istenen "Yurt Dışındaki Yaşamın Sistemi" metni kod tabanında hiç
  geçmiyor; 3 aday var (`relocation-tools-copy.ts:98` · `CaddePage.tsx:283` ·
  `GlobalNetworkShowcaseSection.tsx:183` = "Yurt Dışında Yaşayan Türklerin Sistemi"). Hedef belirsiz.
- **"Filtre ekranında ara butonu yok"** — Cadde kodunda AI/metin arama barı **hiç yok**, filtreler
  `onChange` ile anında uygulanıyor ([CaddePage.tsx:236](../../src/pages/cadde/CaddePage.tsx#L236)).
  Kastedilen ekran belirsiz (muhtemelen `DirectoryFilters.tsx`).

Yeri saptanamayan 3 madde — canlı sitede birlikte gezinme gerektirir, tahminle dokunulmayacak:
- **PROFİL yazım hataları** — hangi metin olduğu belirtilmemiş.
- **RADAR "Experimental kalmış"** — public radar kodunda (`RadarHubPage.tsx`, `components/radar/*`)
  "Experimental" metni geçmiyor.
- **"'Ol' tek başına kalmış"** — [CaddePage.tsx:805-824](../../src/pages/cadde/CaddePage.tsx#L805)
  zaten `text-balance` + `clamp` kullanıyor; cihazda doğrulanıp sorun yoksa Faz 1'e taşınır.

Ayrıca **"Yurt dışındaki hayatı şekillendiren sisteme katıl"** maddesi:
[FinalCtaSection.tsx:32](../../src/components/home-trial/FinalCtaSection.tsx#L32) zaten
"şekillendiren sisteme katıl" diyor → doğrulanıp muhtemelen Faz 1'e taşınacak.

### 3B — Ayrı spec gerektiren büyük iş (~7 madde)
Billboard/sponsorlu talep formu · hizmet sağlayıcı teklif havuzu (marketplace) · test sonucunu
profile kaydetme · görselli renkli grafikler · ISO ülke-şehir drill-down ·
**MUHASEBE ▸ BÜTÇE (Ö6 — panonun en yüksek öncelikli maddesi:** geçmiş gider çekme + bütçeyi seçilen
kura çevirme + fiş/fatura görselinden OCR ile gider girişi**)**.

⚠️ Stripe'a bağlı olanlar açılmaz: `cadde.carsi.paid_mode` anahtarı gerçek ödeme akışı hazır olmadan
açılırsa ilanlar taslakta kalır ve kullanıcı ilanını hiçbir şekilde yayınlayamaz (CLAUDE.md Cadde kuralı).

---

## Doğrulama

**Canlı DB (okuma + yazma çalışıyor, `dangerouslyDisableSandbox: true` şart):**
```bash
set -a && source <(grep -E "^SUPABASE_DB_PASSWORD=" .env.local) && set +a
PGPASSWORD="$SUPABASE_DB_PASSWORD" PGCLIENTENCODING=UTF8 psql \
  "host=aws-1-eu-west-2.pooler.supabase.com port=5432 dbname=postgres user=postgres.injprdrsklkxgnaiixzh sslmode=require" \
  -v ON_ERROR_STOP=1 --single-transaction -f <dosya>.sql
```

1. **Faz 1 sonrası:** `select status, count(*) from revision_requests where deleted_at is null group by 1;`
   → beklenen `acik` 43→29, `inceleniyor` 0→14. Her maddede kanıt yorumu olduğu doğrulanır.
2. **Faz 2A sonrası:** kırık CTA href'i kalmadığını sorgula (`like '/relocation/tools/%'` = 0 satır);
   `relocation_professions` / `relocation_locations` yeni sayıları raporla.
   `search_directory_catalog`'u çağırıp yönetici hesapların listede olmadığını gör.
3. **Faz 2B sonrası:** `npm run test` (`ResultCtaPanel.test.tsx` güncellenmiş beklentiyle geçmeli) ·
   `npm run lint` · `npm run verify:text` (Türkçe UTF-8/mojibake denetimi) · `npm run build`.
4. **Uçtan uca (deploy sonrası):** Readiness testini çöz → 4 CTA'nın hepsi tıklanabilir ve doğru
   route'a gidiyor mu; "Hangi Ülke" testini UK ile çöz → artık şehir dönüyor mu; sonuçtan dizine
   git ve **geri dön**; `/directory` aramasında yönetici hesabı görünmüyor mu.
5. `BASE_URL=https://corteqs.net npm run verify:release`.

Her fazın sonuna proje geleneğine uygun [admin-updates.ts](../../src/lib/admin-shell/admin-updates.ts)
kaydı eklenir. **Dikkat:** post-commit mail hook'u yalnız en üstteki kaydı yolluyor — aynı güne çok
kayıt girilirse birleşik mail elle gönderilir.

## Riskler ve sınırlar

- **Deploy boşluğu:** Faz 1'in tamamı ve Faz 2'nin çıktısı `corteqs.net`'te görünmeyecek; Cadde V1
  zaten deploy kuyruğunda (`SONDURUM.md` §C). Bu yüzden `yapildi` yerine `inceleniyor` kullanılıyor.
- **Çalışma ağacı kirli:** `admin-updates.ts` + `AdminDurumRaporuPage.tsx` +
  `admin-navigation-registry.ts` + `admin-route-meta.ts` içinde commit'lenmemiş 5 durum-raporu kaydı
  ve -317 satırlık bir tekilleştirme var (dünkü işlerin özetleri). **Bu işe karıştırılmayacak**, ayrı
  commit olarak kalır.
- Faz 2A üretim DB'sine yazıyor; her adım önce `rollback` ile kuru koşulur.
- `20q_normalize` migration'ının daha önceki bir düzeltmeyi geri aldığı görüldü (slug regresyonu) —
  bu dosyaya dokunan her değişiklik aynı riski taşır, önceki CTA fix migration'ları okunmadan
  değiştirilmemeli.

## Bu planın kapsamadığı, sırada bekleyen işler

`SONDURUM.md`'ye göre bugünün asıl 1. işi bu değildi. Hâlâ bekliyor:
**profil referral doğrulama + admin kullanım görünürlüğü**
([plan](2026-07-29-profil-referral-dogrulama-admin-kullanim.md), commit'lenmedi, kod yok) ·
`member_welcome` migration + Edge Function deploy · Coolify deploy kuyruğu (bildirim + Cadde V1 +
hoş geldin) · 3 bekleyen migration'ın housekeeping'i · Cadde Faz 2/3.
