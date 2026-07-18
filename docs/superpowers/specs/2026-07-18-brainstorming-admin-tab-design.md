# Brainstorming Admin Sekmesi — statusreport3006'yı Admin Paneline Taşıma Tasarımı

**Tarih:** 2026-07-18
**Sayfa:** `/admin/brainstorming` (yeni)
**Kaldırılan:** public `/statusreport3006` route'u
**Durum:** Onaylandı, implementasyon planı bekleniyor

## 1. Amaç

`/statusreport3006` şu an herkese açık (giriş gerektirmeyen), kendine özgü koyu temalı bir
sayfa — Cadde 3.0 & Premium Panel durum raporu, teknik+sade iki sütunlu satırlar ve
bölüm başına anonim yorum thread'i içeriyor. İçerik `src/content/status-report-3006-data.ts`
dosyasında statik olarak tutuluyor, kod değişikliği olmadan güncellenemiyor.

Bu iş, sayfayı admin paneline **"Brainstorming"** sekmesi olarak taşır:
- Admin panelin görsel diliyle (AdminPageShell + shadcn) tam uyumlu hale getirir.
- İçeriği statik dosyadan veritabanına taşır — tüm adminler panelden bölüm/satır
  ekleyip düzenleyip silebilir.
- Yorum sistemini admin kimliğine bağlar (serbest isim alanı kalkar).
- Eski public route'u ve anonim yorum erişimini kapatır.

## 2. Kapsam

### Dahil
- Yeni admin sayfası `/admin/brainstorming`, sol menüde "Roller ve AFS" grubu altında.
- Sol liste (bölüm başlıkları) + sağ detay (seçili bölümün satırları + yorumlar) yerleşimi.
- Bölüm CRUD: ekle/düzenle/sil, `group_label` serbest metin etiketi (ayrı grup yönetimi yok).
- Satır CRUD: ekle/düzenle/sil, alanlar: `label`, `technical`, `plain`, `status` (ok/partial/open).
- Bölüm ve satır sıralaması (`order_index`, yukarı/aşağı taşıma — sürükle-bırak YAGNI).
- Yorum thread'i bölüm başına: yazan admin'in adı otomatik (auth session'dan), serbest isim
  alanı kalkar.
- Mevcut 12 bölüm / ~35 satırlık içerik seed migration ile DB'ye taşınır (`section_key`'ler
  korunur ki varsa geçmiş yorumlar kopmasın).
- Public `/statusreport3006` route'u ve sayfası App.tsx'ten kaldırılır.
- `statusreport_comments` RLS/RPC admin-only'e daraltılır (yeni migration).
- Tüm adminler görebilir, düzenleyebilir, yorum yazabilir (mevcut admin erişim kontrolü —
  ekstra kısıtlama yok, blog/anketler ile aynı yetki modeli).

### Dahil değil (YAGNI)
- Ayrı "grup" yönetim tablosu/ekranı — grup adı her bölümde serbest metin.
- Sürükle-bırak sıralama — yukarı/aşağı butonları veya `order_index` girişi yeterli.
- Yorum düzenleme/silme UI'ı (moderasyon) — mevcut sistemde de yoktu, kapsam dışı bırakılıyor
  (ileride istenirse ayrı iş).
- Rich text / markdown editör — düz metin textarea (mevcut sistemle aynı).
- Versiyon geçmişi / audit log satır değişiklikleri için — kapsam dışı.

## 3. Veri Modeli

### Yeni tablo `brainstorming_sections`

| kolon | tip | not |
|---|---|---|
| `id` | uuid PK default gen_random_uuid() | |
| `section_key` | text unique not null | eski statik key'lerle uyumlu (`ozet`, `a1-backend` vb.) |
| `group_label` | text null | ör. "Bölüm 1 — Cadde 3.0" |
| `title` | text not null | |
| `intro` | text null | |
| `order_index` | integer not null default 0 | |
| `created_by` | uuid null references auth.users(id) on delete set null | |
| `updated_by` | uuid null references auth.users(id) on delete set null | |
| `created_at` | timestamptz not null default now() | |
| `updated_at` | timestamptz not null default now() | |

### Yeni tablo `brainstorming_rows`

| kolon | tip | not |
|---|---|---|
| `id` | uuid PK default gen_random_uuid() | |
| `section_id` | uuid not null references brainstorming_sections(id) on delete cascade | |
| `label` | text not null | |
| `technical` | text not null | |
| `plain` | text not null | |
| `status` | text null check (status in ('ok','partial','open')) | |
| `order_index` | integer not null default 0 | |
| `created_at` | timestamptz not null default now() | |
| `updated_at` | timestamptz not null default now() | |

**RLS:** `revision_requests` deseniyle aynı — yalnız admin okur/yazar
(`public.is_admin(auth.uid())`), tüm adminler ortak görür/düzenler. Ayrı bir "sadece
SuperAdmin" kısıtlaması yok.

### Mevcut tablo `statusreport_comments` (daraltma migration'ı)

Mevcut şema korunur, sadece erişim daraltılır:
- `author_name` parametresi RPC'den kaldırılır; RPC dönüşünde `author_name` alanı olarak
  `auth.users.email` (auth.uid() ile join) yazılır — `user_profile_attributes`'te görünen ad
  alanı garanti dolu olmayabileceği için (bazı adminlerde boş kalabilir), e-posta güvenilir
  tek kaynak. Frontend `fetchComments` dönüşünde bu e-postayı olduğu gibi gösterir.
- Yeni RPC `add_brainstorming_comment_v1(p_section_key, p_body)` — eski
  `add_statusreport_comment_v1` yerine geçer (isim parametresi yok).
- `revoke ... from anon` — eski anonim grant kaldırılır, `to authenticated` + RLS admin
  kontrolü RPC içine eklenir.
- SELECT policy admin-only'e daraltılır (`deleted_at is null` public read yerine
  `public.is_admin(auth.uid())`).
- Eski `add_statusreport_comment_v1` fonksiyonu `drop function` ile kaldırılır (kullanımdan
  kalkıyor, geriye dönük çağıran kalmıyor çünkü public sayfa siliniyor).

## 4. API Katmanı

Yeni dosya `src/lib/brainstorming-api.ts` (muhasebe-api.ts deseni):

```ts
export type BrainstormingStatus = "ok" | "partial" | "open";

export type BrainstormingRow = {
  id: string;
  sectionId: string;
  label: string;
  technical: string;
  plain: string;
  status: BrainstormingStatus | null;
  orderIndex: number;
};

export type BrainstormingSection = {
  id: string;
  sectionKey: string;
  groupLabel: string | null;
  title: string;
  intro: string | null;
  orderIndex: number;
  rows: BrainstormingRow[];
};

export type BrainstormingComment = {
  id: string;
  sectionKey: string;
  authorName: string;   // auth session'dan çözülür, sunucu tarafında
  body: string;
  createdAt: string;
};

fetchSections(): Promise<BrainstormingSection[]>              // rows join, order_index sıralı
createSection(input: {...}): Promise<BrainstormingSection>
updateSection(id: string, input: {...}): Promise<BrainstormingSection>
deleteSection(id: string): Promise<void>                       // cascade satırları da siler
reorderSections(orderedIds: string[]): Promise<void>

createRow(sectionId: string, input: {...}): Promise<BrainstormingRow>
updateRow(id: string, input: {...}): Promise<BrainstormingRow>
deleteRow(id: string): Promise<void>
reorderRows(sectionId: string, orderedIds: string[]): Promise<void>

fetchComments(sectionKey: string): Promise<BrainstormingComment[]>
addComment(sectionKey: string, body: string): Promise<BrainstormingComment>
```

- Zod şemaları `src/lib/brainstorming-schemas.ts` (label/technical/plain zorunlu, uzunluk
  limitleri statusreport-comments.ts'teki limitlerle tutarlı: body max 4000, label max 200).
- `types.ts` bu yeni tabloları tanımamayacağı için (B1 — regen henüz yapılmadı) dar `as any`
  cast / `LooseQuery` deseni (statusreport-comments.ts, revision-requests.ts ile birebir aynı).
- React Query: `useQuery`/`useMutation`, query key `["brainstorming-sections"]`.

## 5. UI Bileşenleri

### Yeni sayfa `src/pages/admin/AdminBrainstormingPage.tsx`

`AdminPageShell` içinde iki panelli yerleşim (`AdminFeedbackPage.tsx` / muhasebe dashboard
deseni):

- **Sol panel:** Bölüm listesi (accordion veya basit tıklanabilir liste), her satırda
  `group_label` (küçük üst etiket) + `title`, yanında yukarı/aşağı sıralama okları,
  düzenle/sil ikonları. Üstte "Yeni Bölüm" butonu (dialog form: group_label, title, intro).
- **Sağ panel:** Seçili bölümün satırları — `Table` veya `Card` listesi (Konu / Teknik /
  Sade / Durum kolonları, shadcn `Badge` ile ok/partial/open renk kodlaması, mevcut
  `AdminStatusBadge` bileşeni kullanılır). Her satırda düzenle/sil, üstte "Yeni Satır" butonu
  (dialog form).
- **Yorumlar:** Sağ panelin altında, seçili bölüme ait yorum listesi + textarea + gönder
  butonu (`RevisionCommentThread.tsx` deseniyle tutarlı basit liste — isim alanı yok, sadece
  metin + gönder).

### Yeni bileşenler
- `src/components/admin/brainstorming/BrainstormingSectionList.tsx` (sol panel)
- `src/components/admin/brainstorming/BrainstormingRowTable.tsx` (sağ panel üst)
- `src/components/admin/brainstorming/BrainstormingCommentThread.tsx` (sağ panel alt)
- `src/components/admin/brainstorming/SectionFormDialog.tsx`, `RowFormDialog.tsx`

## 6. Routing & Navigasyon

1. `src/pages/admin/routes.tsx`: `const AdminBrainstormingPage = lazy(() =>
   import("@/pages/admin/AdminBrainstormingPage"));` + `<Route path="brainstorming"
   element={<AdminBrainstormingPage />} />`.
2. `src/lib/admin-shell/admin-route-meta.ts`: `ADMIN_ROUTE_PATTERNS`'a
   `"/admin/brainstorming"` eklenir.
3. `src/lib/admin-shell/admin-navigation-registry.ts`: `roles-afs` grubuna yeni item:
   ```ts
   {
     id: "brainstorming",
     label: "Brainstorming",
     description: "Cadde 3.0 & Premium Panel durum ve karar raporu — düzenlenebilir.",
     to: "/admin/brainstorming",
     icon: Lightbulb, // zaten import'ta var
     accent: "emerald",
     aliases: ["brainstorming", "durum raporu", "karar", "statusreport", "3006"],
   }
   ```

## 7. Eski Sayfanın Kaldırılması

- `src/App.tsx`: `/statusreport3006` route'u ve `StatusReport3006Page` lazy import'u silinir.
- `src/pages/StatusReport3006Page.tsx` dosyası silinir.
- `src/content/status-report-3006-data.ts` dosyası silinir (içerik migration seed'ine taşındı,
  koddan tamamen kalkar).
- Varsa sitemap/SEO kayıtlarında `/statusreport3006` referansı varsa temizlenir
  (`applySeo` çağrısı sayfayla birlikte zaten kalkıyor).

## 8. Migration'lar

### `supabase/migrations/20260718120000_brainstorming_tables.sql`
1. `brainstorming_sections` + `brainstorming_rows` tabloları (Bölüm 3 şeması).
2. RLS enable + admin-only select/insert/update/delete policy'leri.
3. Index: `brainstorming_rows (section_id, order_index)`.
4. **Seed:** mevcut `status-report-3006-data.ts` içeriğinin tamamı (12 bölüm, ~35 satır)
   `insert into` ile bire bir taşınır — `section_key`'ler birebir korunur.

### `supabase/migrations/20260718130000_statusreport_comments_admin_only.sql`
1. Eski `statusreport_comments_public_read` policy drop, yeni admin-only select policy.
2. Eski `add_statusreport_comment_v1` fonksiyonu drop.
3. Yeni `add_brainstorming_comment_v1(p_section_key, p_body)` — `auth.uid()`'den admin
   kontrolü + isim çözümleme, aynı rate-limit/uzunluk kısıtları korunur.
4. `grant execute ... to authenticated` (anon kaldırılır).

**Not:** Migration commit ≠ canlı DB. Canlıya uygulama ayrı adım (Management API curl).

## 9. Doğrulama & Test

- `npm run lint`, `tsc` temiz.
- Unit test: `brainstorming-api.test.ts` (CRUD fonksiyonları, path/payload inşası,
  Zod validasyonu) — `muhasebe-api.test.ts` deseniyle tutarlı.
- Manuel QA: bölüm ekle/düzenle/sil → satır ekle/düzenle/sil → sıralama değiştir → yorum yaz
  (isim otomatik doğru admin) → sayfa yenile → kalıcı → ikinci admin hesabıyla görünüyor →
  eski `/statusreport3006` artık 404.

## 10. Bitiş

1. `admin-updates.ts`'e günlük dille, madde madde duyuru girdisi eklenir (kullanıcı talebi —
   iş bitince yapılanlar admin güncelleme listesine eklenecek).
2. Commit (conventional + trailer'lar).
3. Push (main classifier'a takılırsa kullanıcıdan onay + `dangerouslyDisableSandbox`).
4. Kalan (kullanıcı tarafı): migration'ları canlıya uygula + Coolify deploy + görsel QA.
