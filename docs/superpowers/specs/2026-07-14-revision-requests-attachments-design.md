# Revizyon İstekleri — Görsel Ekleme Tasarımı

**Tarih:** 2026-07-14
**Sayfa:** `/admin/revision-requests` (`src/pages/admin/AdminRevisionRequestsPage.tsx`)
**Durum:** Onaylandı, implementasyon planı bekleniyor

## 1. Amaç

`/admin/revision-requests` şu an tamamen metin tabanlı: talep (başlık/açıklama/durum/öncelik)
+ talep başına yorum thread'i. Ekran görüntüsü / referans görsel paylaşmanın tek yolu harici bir
link yapıştırmak.

Bu iş, hem **revizyon talebine** hem **yorumlara** çoklu görsel ekleme imkânı ekler — DB'ye kalıcı
yazılır, tüm adminler ortak görür (mevcut sayfa RLS deseniyle aynı: admin-only, ortak).

## 2. Kapsam

### Dahil
- Bir revizyon talebine çoklu görsel eklenebilir (talep detay drawer'ından).
- Bir yoruma çoklu görsel eklenebilir (yorum thread'inde, yorumla birlikte ya da sonradan).
- Görseller Supabase Storage'a (private bucket) yüklenir, kalıcı DB kaydı ile ilişkilendirilir.
- Thumbnail önizleme + büyütme (yeni sekmede aç) + tekil silme.
- Yeni talep oluşturma formunda görsel alanı **yok** — kayıt oluşturulduktan sonra detay
  drawer'ından eklenir (bkz. Bölüm 6).

### Dahil değil (YAGNI)
- Video/döküman yükleme yok — yalnız görsel (image/*), `burak-share` bucket'ıyla aynı MIME kısıtı.
- Draft/taslak yükleme (talep henüz kaydedilmeden dosya seçme) yok — form önce kaydedilir.
- Görsel düzenleme (kırpma, yeniden boyutlandırma) yok — ham dosya olduğu gibi saklanır.
- Görsel sırası/galeri düzenleme yok — yükleme sırasına göre listelenir.

## 3. Veri Modeli

Yeni tablo **`revision_request_attachments`** — her satır bir dosya, ya bir talebe ya bir yoruma
bağlı (ikisine birden değil):

| kolon | tip | not |
|---|---|---|
| `id` | uuid PK default gen_random_uuid() | |
| `request_id` | uuid null references revision_requests(id) on delete cascade | talebe bağlıysa dolu |
| `comment_id` | uuid null references revision_request_comments(id) on delete cascade | yoruma bağlıysa dolu |
| `storage_path` | text not null | bucket içi path |
| `file_name` | text not null | orijinal dosya adı (görüntüleme için) |
| `content_type` | text null | MIME type |
| `size_bytes` | integer null | |
| `created_by` | uuid null references auth.users(id) on delete set null | |
| `created_at` | timestamptz not null default now() | |
| `deleted_at` | timestamptz null | soft-delete (sayfanın geri kalanıyla tutarlı) |

CHECK kısıtı: `(request_id is not null)::int + (comment_id is not null)::int = 1` — tam olarak bir
üst kayda bağlı olmalı.

**RLS:** sayfanın geri kalanıyla birebir aynı desen — yalnız admin okur/yazar
(`public.is_admin(auth.uid())`), tüm adminler ortak görür. `revision_requests` /
`revision_request_comments` ile aynı migration dosyasının deseni (20260628100000) izlenir.

**Storage bucket:** yeni private bucket **`revision-attachments`**. MIME kısıtı
`image/jpeg, image/png, image/webp, image/gif`; boyut limiti 15MB (`burak-share` ile aynı).
Path şeması:
- Talebe bağlı: `request/<request_id>/<timestamp>-<rand>-<safeName>`
- Yoruma bağlı: `comment/<comment_id>/<timestamp>-<rand>-<safeName>`

Storage RLS policy'leri `burak-share` ile birebir aynı desen (admin select/insert/update/delete).

## 4. API Katmanı

`src/lib/admin-shell/revision-requests.ts` içine eklenir (yeni dosya açmaya gerek yok, mevcut
dosya zaten bu sayfanın tüm DB katmanı):

```ts
export type RevisionAttachment = {
  id: string;
  requestId: string | null;
  commentId: string | null;
  storagePath: string;
  fileName: string;
  contentType: string | null;
  sizeBytes: number | null;
  createdBy: string | null;
  createdAt: string;
};

fetchAttachments(parent: { requestId: string } | { commentId: string }): Promise<RevisionAttachment[]>
uploadAttachment(parent: { requestId: string } | { commentId: string }, file: File): Promise<RevisionAttachment>
deleteAttachment(id: string): Promise<void>   // storage.remove + soft-delete satır
getAttachmentUrl(storagePath: string): Promise<string>   // createSignedUrl (300sn), revision-requests.ts LooseQuery deseniyle
```

- Mevcut `table()` / `LooseQuery` köprüsü (types.ts senkron değil — CLAUDE.md B1) aynen kullanılır.
- Hata yönetimi: mevcut `sanitizeError()` + `throw new Error(...)` deseni (dosyadaki diğer
  fonksiyonlarla birebir tutarlı).
- Dosya adı güvenliği: `buildImagePath` (burak-share-assets.ts'teki) ile aynı `safeName` temizliği
  (`[^a-zA-Z0-9._-]` → `_`).

## 5. UI Bileşenleri

### Yeni: `src/components/admin/revision/RevisionAttachmentGrid.tsx`
Ortak, yeniden kullanılabilir bileşen — hem talep detayında hem yorum thread'inde kullanılır.

Props: `{ requestId } | { commentId }`, salt-okunur değilse yükleme/silme aktif.

İçerir:
- Küçük thumbnail grid (signed URL, lazy-loaded).
- Thumbnail tıklanınca yeni sekmede tam boy açılır.
- Her thumbnail üzerinde silme ikonu (hover).
- "Görsel Ekle" butonu (`<input type=file accept=image/* multiple>`) — çoklu seçim destekler,
  seçilen tüm dosyalar sırayla `uploadAttachment` ile yüklenir.
- Yükleme sırasında spinner/disabled state (mevcut `BurakMediaPanel` deseniyle tutarlı).

### `AdminRevisionRequestsPage.tsx` (düzenleme)
- Detay drawer'ında (`AdminDetailDrawer` içinde, `selected.detail` metninden hemen sonra,
  `RevisionCommentThread`'den önce): `<RevisionAttachmentGrid requestId={selected.id} />`.

### `RevisionCommentThread.tsx` (düzenleme)
- Her yorum kartının altına (body'den sonra): `<RevisionAttachmentGrid commentId={comment.id} />`.
- Draft compose alanı (yeni yorum yazma): yorum **önce** `addComment` ile oluşturulur (mevcut akış
  değişmez), `onSuccess` sonrası dönen `comment.id` ile eğer kullanıcı dosya da seçtiyse otomatik
  yüklenir. Yani: yorum kutusunun yanına bir "dosya ekle" ataç ikonu + seçilen dosya sayısı rozeti
  eklenir; "Gönder" tıklanınca önce yorum, hemen ardından seçilen dosyalar yüklenir (tek kullanıcı
  aksiyonu, iki API çağrısı arka arkaya — draft state karmaşıklığı yaratmaz çünkü yorum metni zaten
  mevcut controlled `draft` state'inde tutuluyor, dosya seçimi için ayrı bir `File[]` state yeterli).

**Not — talep formu ile tutarlılık:** Yeni talep formunda (`RevisionRequestForm`) görsel alanı YOK
(Bölüm 2). Ama yorum composer'da VAR — çünkü yorum zaten aynı anda hem metin hem eylem olarak
gönderiliyor (draft state zaten var), talep formundaki gibi ayrı bir dialog akışı değil. Bu, iki
farklı görsel-ekleme UX'i gibi görünse de kök sebebi tutarlı: **her ikisinde de üst kayıt (request
veya comment) DB'de var olmadan dosya yüklenmez** — yorumda üst kayıt "gönder" anında anlık
oluşturuluyor, talep formunda ise kullanıcı önce "Oluştur"a basıp drawer'a geçmeli.

## 6. Yeni Talep Akışı (talep formu → görsel ekleme)

Kullanıcı onayı: **önce kaydet, sonra görsel ekle**.

1. Kullanıcı "Yeni Revizyon İsteği" formunu doldurur, "Oluştur"a basar (mevcut akış, değişmez).
2. `upsertMutation.onSuccess` zaten `queryClient.invalidateQueries` yapıyor — buna ek olarak
   yeni oluşturulan talebin `id`'sini `setSelectedId(newRequest.id)` ile detay drawer'ını otomatik
   açacak şekilde genişletilir (şu an `createRevisionRequest` dönen veriyi mutation'da kullanmıyoruz
   — `onSuccess(data)` parametresinden alınabilir).
3. Drawer açılınca kullanıcı `RevisionAttachmentGrid`'den görsel ekler.

Bu, ekstra dialog/adım eklemeden "oluştur → hemen görsel ekle" akışını doğal kılar.

## 7. Migration

Yeni migration `supabase/migrations/20260714120000_revision_request_attachments.sql`:
1. `create table revision_request_attachments (...)` (Bölüm 3 şeması + CHECK kısıtı).
2. `alter table ... enable row level security` + admin-only select/insert/update/delete policy'leri
   (`revision_requests`/`revision_request_comments` ile aynı migration'daki policy isimlendirme
   deseni: `revision_request_attachments_admin_select` vb.).
3. Index: `create index on revision_request_attachments (request_id) where deleted_at is null;` ve
   aynısı `comment_id` için (drawer/thread açılışında sık sorgu).
4. `insert into storage.buckets (...)` bucket `revision-attachments` (varsa atla, `burak-share`
   deseniyle birebir) + storage.objects RLS policy'leri (admin select/insert/update/delete).

**Not:** Migration commit ≠ canlı DB. Canlıya uygulama ayrı adım (Management API curl,
memory: `project_referral_admin_rls_fix` dersi).

## 8. Doğrulama & Test

- `npm run lint`, `tsc` temiz.
- Unit test: `revision-requests.test.ts`'e attachment fonksiyonları için testler (path üretimi,
  CHECK-uyumlu payload inşası) — mevcut dosyadaki test deseniyle tutarlı.
- Manuel QA: talep oluştur → drawer'da görsel ekle → önizleme görünür → sayfa yenile → kalıcı →
  ikinci admin görüyor; yorum yaz + dosya ekle → thread'de görünür; silme her iki yerde çalışıyor.

## 9. Bitiş

1. `admin-updates.ts`'e günlük dille duyuru girdisi (memory: admin-updates deploy-gap alışkanlığı).
2. Commit (conventional + trailer'lar).
3. Push (main classifier'a takılırsa kullanıcıdan onay + `dangerouslyDisableSandbox`).
4. Kalan (kullanıcı tarafı): migration'ı canlıya uygula + Coolify deploy + görsel QA.
