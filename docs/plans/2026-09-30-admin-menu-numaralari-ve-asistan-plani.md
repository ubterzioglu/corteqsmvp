# Admin Menü Sıra Numaraları + Asistanın Yönetici Bağlamı — Uygulama Planı

> Tarih: 2026-09-30 · Durum: onaya sunuldu
> Kapsam: admin sol menüsüne 1..N sıra numarası · CorteQS Asistanı'nın yönetici
> korpusu ve menü referansı · bot yanıtlarında tıklanabilir link
> Dokunulan alanlar: `admin-navigation-registry` · `site-assistant` · `ai_knowledge_documents`
> Sıfır migration · sıfır yeni bağımlılık

## Bağlam — bu iş neden yapılıyor

Admin sol menüsü uzun (14 grup · **75** üst seviye öğe, ölçüldü). Bir sayfayı tarif etmek
zor: CorteQS Asistanı bir ekranı anlatıyor ama kullanıcı onu menüde bulamıyor. İstenen,
menü öğelerine yukarıdan aşağı sıra numarası vermek ve botun sayfayı tarif ederken bu
numarayı söylemesi ("Menüde 17. sıra: Kullanıcılar & Roller").

Bunun yanında soru şuydu: "botun admin penceresinde admin sayfalarına özgü cevap vermesi
için ayrı RAG / ayrı model gerekir mi?" — **Gerekmiyor.** Ölçüm aşağıda; altyapı zaten var.

### Ölçülen mevcut durum (ezberden değil, dosyadan)

| Bulgu | Kanıt |
|---|---|
| Kitle ayrımı **zaten var**: `resolveAudiences(isAdmin)` → `["public","member","admin"]` | `supabase/functions/_shared/ai-assistant-context.ts:46` |
| Admin kararı **sunucuda**, istemci iddiasına güvenilmiyor (`is_admin()` RPC) | `supabase/functions/site-assistant/index.ts:194` |
| `audience='admin'` kaynağı **zaten işliyor** (`docs-admin`) | `scripts/ai-knowledge/sources.mjs:199` |
| Yeni `source_key` **migration İSTEMEZ** — sütunda CHECK yok | `supabase/migrations/applied/20260921100000_ai_knowledge_base.sql:28` (CHECK yalnız `audience`'ta, satır 42-43) |
| Menü kaydı **makinece okunabilir**: `label · description · to · aliases · children` | `src/lib/admin-shell/admin-shell-types.ts:28-62` |
| Menü sırası **kullanıcıya göre değişmez** — sıra dizi sırasıdır, rol filtresi yoktur | `AdminSidebar.tsx:71`, `AdminSidebarGroup.tsx:26` |
| Asistan balonu **admin sayfalarında da var** (kök seviyede, `<Routes>` dışında) | `src/App.tsx:331` |
| Sayfa bağlamı **zaten gönderiliyor** (`page.path` + `title`, A12b) | `src/components/chat/ChatBot.tsx:114-117` |

Yani **ayrı fonksiyon, ayrı model, ayrı token gerekmiyor.** Eksik olan tek şey, korpusta
admin menüsünü anlatan bir veri seti ve promptta bir kural.

### Bu işte çözülen ikinci kusur

`src/components/chat/ChatMessage.tsx:29` yalnız `**kalın**` işliyor. Bot yanıtının altındaki
"Kaynaklar" bloğu (`chatbot-message-helpers.ts:43`) markdown link üretiyor ama kullanıcı
ham `[Başlık](/admin/members)` metni görüyor — **bugün canlıda tıklanabilir link yok.**
Kullanıcı kararı: numara ile birlikte bunu da çöz.

---

## Çözüm — dört parça, sıfır migration, sıfır yeni bağımlılık

### 1. Numaralandırma (tek kaynak, saf fonksiyon)

**Yeni:** `src/lib/admin-shell/admin-menu-numbering.ts`

`adminNavGroups` üzerinde **render sırasıyla** yürüyüp numara üretir. Sıra tam olarak
`AdminSidebar`'ın çizdiği sıradır: gruplar registry sırasında → grup içi aktif öğeler →
en sonda "İnaktif" bölümü (3 öğe). `flattenAdminNav` (`admin-navigation-utils.ts:35`)
gruptan bağımsız düz liste verdiği için **yeniden kullanılmaz**; grup/inaktif ayrımını
koruyan ayrı bir yürüyüş gerekir.

Kullanıcı kararı:
- **Üst seviye: global düz sayaç `1..N`** (gruplar boyunca kesintisiz, grup başlıkları numarasız).
- **Alt öğeler: `34.1`, `34.2`** — böylece dinamik alt sayfa eklenince (workspace dokümanları,
  danışman profilleri) sonraki üst seviye numaraları **kaymaz**.
- External öğeler (5 adet) menüde satır olarak göründüğü için numara alır.

```ts
export type AdminMenuEntry = {
  number: string;          // "17" | "34.2"
  id: string;
  label: string;
  groupId: string;
  groupLabel: string;
  path: string | null;     // item.to
  href: string | null;     // external
  description: string | null;
  aliases: string[];
  parentLabel: string | null;
  isInactive: boolean;
};
export function buildAdminMenuCatalog(groups = adminNavGroups): AdminMenuEntry[];
export const adminMenuNumberById: ReadonlyMap<string, string>;
```

### 2. Menüde numaranın görünmesi

- `src/components/admin/shell/AdminSidebarItem.tsx` — ikondan önce dar, mono, soluk bir
  numara rozeti: `adminMenuNumberById.get(item.id)`. Yalnız `collapsed=false` iken çizilir
  (72px'lik dar kolonda yer yok). Bileşen hem desktop sidebar hem `AdminMobileSidebar`
  tarafından kullanıldığı için **tek değişiklikle iki yüzey** kapanır.
- `src/components/admin/shell/AdminCommandPalette.tsx:77-83` — `CommandItem` içinde label'ın
  önüne aynı numara. Palette'ten sayfa bulan kullanıcı numarayı da öğrensin.
- Erişilebilirlik: numara `aria-hidden` **değil** — ekran okuyucu "17, Kullanıcılar & Roller"
  desin; asistanın verdiği referans sesli okumada da eşleşsin.

### 3. Asistanın yönetici bağlamı — yeni bilgi kaynağı + prompt kuralı

**a) Üretilen katalog dosyası.** `scripts/ai-knowledge/sources.mjs` saf Node'dur, TS registry'yi
(lucide ikon importlarıyla) import edemez. Repoda `tsx`/`esbuild` **yok** (ölçüldü). Yeni bağımlılık
eklemek yerine artefakt **vitest dosya snapshot'ı** ile üretilir:

**Yeni:** `src/lib/admin-shell/admin-menu-catalog.test.ts`
```ts
await expect(JSON.stringify(buildAdminMenuCatalog(), null, 2) + "\n")
  .toMatchFileSnapshot("../../../docs/agent/admin-menu.json");
```
- **Üretim:** `npm run ingest:admin-menu` → `vitest run -u src/lib/admin-shell/admin-menu-catalog.test.ts`
  (package.json'a eklenecek tek satır; env değişkeni yok, Windows'ta da çalışır).
- **Bayatlama koruması:** dosya `npm run test` içinde denetlenir. Bu, CLAUDE.md'nin
  `ingest:tools:check` için şikâyet ettiği "ne lint ne test yakalar" sınıfını **tekrarlamaz**.
- Çıktı `docs/agent/admin-menu.json` — `tools.json` ile aynı dizin. `.json` olduğu için
  `docs-admin` kaynağına **ikinci kez** girmez (`classifyDocumentationPath` yalnız `.md|.html`).

**b) Yeni kaynak.** `scripts/ai-knowledge/sources.mjs` içine `loadAdminMenuDocuments()` + tek satır:
```js
{ key: "admin-menu", label: "Yönetici menüsü", audience: "admin", load: loadAdminMenuDocuments }
```
**Öğe başına BİR belge** (tek blob değil) — semantik arama tek kayda kilitlensin. Metin şablonu,
getirme isabetini yükseltmek için kullanıcının yazacağı kelimeleri içerir:

```
Üyeler ve Roller
Yönetici panelinde menüde 17. sıra.
Menü grubu: Üyeler ve Dizin
Sayfa yolu: /admin/members
Ne işe yarar: Üye listesi, rol atama ve yetki yönetimi.
Diğer adlar: üye, kullanıcı, rol, yetki
Bu sayfa yönetici sol menüsünde nerede: 17. sıra, "Üyeler ve Dizin" grubu altında.
```
`url` alanı `item.to` olur → "Kaynaklar" bloğu **doğrudan tıklanabilir link** verir (parça 4 ile birlikte).

**c) Prompt kuralı.** `supabase/functions/_shared/ai-assistant-context.ts` içine yeni export:

```ts
export const ADMIN_MENU_PROMPT_BLOCK = `...`;
```
İçeriği (özet): *"Yönetici panelindeki bir sayfayı tarif ederken, platform verisinde o sayfanın
'menüde N. sıra' bilgisi varsa cevabın İLK cümlesinde onu ve sayfa yolunu söyle. Numarayı ASLA
uydurma — yalnız verilen veride geçiyorsa kullan; yoksa numara verme."*

Son cümle kritik: onsuz model numara uydurur ve kabul kriteri sessizce çürür.

`supabase/functions/site-assistant/index.ts:219` — blok yalnız `isAdminData === true` iken
eklenir (mevcut `buildPageContextNote` deseninin yanına):
```ts
system: SITE_ASSISTANT_SYSTEM_PROMPT
      + buildAdminModeNote(isAdminData === true, payload.page)
      + buildPageContextNote(payload.page),
```
Kapı **`is_admin()`**'dir, `page.path`'in `/admin` ile başlaması **değil** — `page` istemci
iddiasıdır ve admin, halka açık bir sayfadan da sorabilir. `page.path` yalnız vurguyu
güçlendirmek için kullanılır.

### 4. Tıklanabilir link (ChatMessage)

`src/components/chat/ChatMessage.tsx` — mevcut `**kalın**` bölmesi, önce markdown linkini
ayıran bir adımla sarılır:
- `[metin](/ic/yol)` → react-router `<Link>` (SPA gezinmesi; tam sayfa yenileme yok).
- `[metin](https://...)` → `<a target="_blank" rel="noreferrer">`.
- **Yalnız `/` veya `https://` ile başlayan hedefler kabul edilir**; `javascript:` ve diğer
  şemalar düz metne düşürülür. Model çıktısı güvenilmeyen girdidir.
- Kalan metinde `**kalın**` davranışı **aynen korunur** (mevcut testler geçmeye devam etmeli).

---

## Değiştirilecek dosyalar

**Yeni**
- `src/lib/admin-shell/admin-menu-numbering.ts`
- `src/lib/admin-shell/admin-menu-numbering.test.ts`
- `src/lib/admin-shell/admin-menu-catalog.test.ts` (snapshot üretici + drift kapanı)
- `docs/agent/admin-menu.json` (üretilen)

**Değişen**
- `src/components/admin/shell/AdminSidebarItem.tsx`
- `src/components/admin/shell/AdminCommandPalette.tsx`
- `src/components/chat/ChatMessage.tsx` (+ yeni `ChatMessage.test.tsx`)
- `scripts/ai-knowledge/sources.mjs` (+ `sources.test.mjs`'e admin-menu vakası)
- `supabase/functions/_shared/ai-assistant-context.ts` (+ mevcut `ai-assistant-context.test.ts`)
- `supabase/functions/site-assistant/index.ts`
- `package.json` (`ingest:admin-menu`)

---

## Doğrulama

**Yerel (kod)**
```bash
npm run test -- src/lib/admin-shell src/components/chat supabase/functions/_shared
npx tsc -p tsconfig.app.json --noEmit     # prelint/pretest'te KOŞMAZ, elle çalıştır
npm run lint
npm run ingest:tools:check                # src/lib'e yeni dosya eklendi → araç kataloğu bayatlar
npm run test                              # admin-menu.json drift'i burada yakalanır
```

Test kapsamı (sözleşme testleri, gevşetilmez):
1. Numaralar **menüdeki sırayla** eşleşir: `AdminSidebar` jsdom'da render edilir, DOM'daki
   numara dizisi `1,2,3,…` olarak artar ve `buildAdminMenuCatalog()` çıktısıyla birebir aynıdır.
   *(Bu, "iki taraf ayrı hesaplıyor" sınıfını kapatan asıl test — kabul kriterinin karşılığı.)*
2. Alt öğe numarası `N.M` biçimindedir ve üst seviye sayacı bozmaz.
3. `admin-menu.json` içindeki her `path`, `collectInternalNavPaths()` içinde vardır.
4. `ChatMessage` `[x](/admin/members)` için `<a href="/admin/members">` üretir;
   `[x](javascript:alert(1))` için **üretmez**, düz metin gösterir.
5. `ADMIN_MENU_PROMPT_BLOCK` yalnız `isAdmin=true` iken sisteme eklenir.

**Canlı (kullanıcıda — sırayla)**
```bash
npm run ingest:admin-menu            # docs/agent/admin-menu.json üret
npm run ai:ingest -- --source=admin-menu --dry-run   # önce say
npm run ai:ingest -- --source=admin-menu
npm run ai:embed
supabase functions deploy site-assistant             # Coolify edge function DEPLOY ETMEZ
```
Uçtan uca kabul testi (yönetici hesabıyla, `/admin` üzerindeyken):
- **"üyeler menüde nerede"** → yanıtta bir sıra numarası geçiyor **ve** o numara sol menüde
  aynı satırda yazıyor. Yanıtın altındaki "Kaynaklar" linki tıklanınca sayfa açılıyor.
- Üye (admin olmayan) hesapla aynı soru → menü kaydı **gelmemeli** (`audience='admin'` filtresi).

---

## Riskler ve tuzaklar

1. **`hasContext` kapısı yanıtı yutar.** `ChatBot.tsx:120` — getirme 0.35 eşiğini geçemezse
   modelin cevabı ATILIR, kullanıcı `NO_CONTEXT_MESSAGE` görür. Bu yüzden belge metni
   "menüde nerede" gibi doğal ifadeleri içerir. Kabul testi başarısız olursa **ilk bakılacak
   yer eşik değil, belge metnidir** — 0.35 ölçülmüş bir değerdir, gevşetme.
2. **Numara uydurma.** Prompt bloğundaki "veride yoksa numara verme" cümlesi çıkarılmamalı.
3. **İki sayaç sorunu.** Sidebar numarayı ayrı, katalog ayrı hesaplarsa sessizce ayrışırlar.
   İkisi de `buildAdminMenuCatalog()` kullanır; doğrulama testi 1 bunu kilitler.
4. **Deploy ≠ çalışıyor.** Edge function elle deploy edilmeli; ayrıca `ai:ingest` çalıştırılmadan
   bot yeni kaynağı bilmez.
5. **Türkçe metin.** Yeni dosyalarda `npm run verify:text` yalnız kodlama/mojibake denetler,
   **eksik Türkçe harfi yakalamaz** — arayüz metinlerini gözle kontrol et.
6. **Numaralar kayar.** Grup/öğe sırası değişince numaralar değişir; bu beklenen davranıştır.
   `npm run ingest:admin-menu` + `ai:ingest` çalıştırılmazsa bot bayat numara söyler. Bu,
   `docs/kalanlar/KALANLAR.md`'ye "menü değişirse bu iki komut" notu olarak yazılmalı.
