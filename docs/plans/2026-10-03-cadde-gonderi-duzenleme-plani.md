# Cadde Gönderi Düzenleme UI'ı — Uygulama Planı (CD01–CD04)

> ✅ **SERİ TAMAM 03.10** — CD01 `7a3f3f84` · CD02 `591caa84` · CD03 `4023751e` ·
> CD04 canlı kabul 10/10 (kanıt KALANLAR satır 163'te). Ekran sıradaki frontend
> deploy'unda canlıya çıkar.
>
> **Durum: ONAYA SUNULDU (03.10, gece turu).** Backend hazır: `update_cadde_post_v1`
> canlıda (A11b, mig `20260929140000`, smoke'lanmış). Eksik olan tek şey UI:
> sarmalayıcı + composer'ın "düzenleme modu" + menü bağlantısı. Bu plan KALANLAR
> satır 162'nin ("Ayrı plan ister — batch'e bölünmedi") karşılığıdır.
>
> **Kaynaklar:** mig başlığı `applied/20260929140000_update_cadde_post_v1.sql` (tasarım
> özeti orada) · A11c/d (üç nokta menüsü + silme, `196bcec`/`f91ee21`) · m94 medya
> kararları · m75 RPC-hata dersi (`cadde-rules.ts`).

## Ölçülen taban (03.10 — keşif raporu)

- `update_cadde_post_v1(p_post_id, p_title, p_body, p_media, p_interests, p_need_category, p_targets, p_mentions)`
  → `void`, security definer, authenticated. **null = dokunma** semantiği. Yetki: sahip
  VEYA admin/moderatör (`cadde_post_owner_required`). Hidden gönderi = `cadde_post_not_found`.
  Yasaklı → `cadde_banned`. Medya `cadde_validate_media`'dan geçer (create ile aynı).
  Hashtag'ler body'den otomatik re-sync; **mentions p_mentions null ise KORUNUR**.
  `p_targets` verilirse fold-matching ile TAMAMEN yeniden çözülür (cafe gönderilerinde
  YOK SAYILIR); çoklu hedef premium kapısına takılır (`cadde_multi_target_premium_required`
  — canlı `cadde.post.multi_target_requires_premium=true`).
- **Yeni hata kodu YOK** — `cadde-rules.ts` haritası zaten tam (`cadde-error-map.test.ts` geçiyor).
- Frontend: `cadde-api.ts`'te create/delete var, **update YOK**. `CaddePostMenu` yalnız
  kendi gönderisinde görünüyor (Paylaş + Sil). Composer'da başlık/tip/etiket girişi YOK
  (m13 sadeliği: tek kutu body + medya + konum) — düzenleme modu da aynı yüzeyi kullanır.
- types.ts RPC'yi içeriyor (16.068–16.080) → `as never` GEREKMEZ (cadde tipli client kullanıyor).

## Tuzaklar (T1/T2 — her batch'te geçerli)

- **T1 (mentions):** body düzenlenirken `p_mentions` **null gönderilir** (mevcut anmalar
  korunur — RPC tasarımı). Composer'ın `mentions` alanı düzenlemede payload'a KONMAZ;
  konursa body'den düşen anma satırları da silinir (kullanıcı beklemez).
- **T2 (media TAM değişim):** `p_media` null değilse liste TAMAMEN değişir. Composer
  düzenleme modunda mevcut medyayla açılır; chip silme `removeCaddeMedia` (öksüz temizliği
  best-effort, mevcut desen). Boş liste `[]` göndermek medyayı temizler (null DEĞİL —
  null "dokunma" demek).
- **T3 (premium kapı):** düzenleme modunda **ek hedef EKLENEMEZ** (`canAddExtraTarget=false`
  create'te de kilitli). Tek birincil hedefin ülke/şehri değiştirilebilir (p_targets tek
  öğe). Cafe varyantında konum paneli hiç gösterilmez (RPC zaten yok sayar).
- **T4 (test sözleşmeleri):** `cadde-api-facade.test.ts` export listesine `updateCaddePost`
  **bilinçli** eklenir (A11c emsali) · `cadde-write-diagnostics.test.ts` → sarmalayıcı
  `caddeWriteError("updateCaddePost", error)` kullanmak ZORUNDA · `CaddePostMenu.test.tsx`
  genişletilir (Düzenle öğesi).
- **T5 (invalidation):** başarıdan sonra `caddeQueryKeys.feedRoot` invalidate (silme ile aynı)
  + `?post=<id>` derin bağlantısı korunur.
- Genel: `as TablesInsert` CAST YASAK (`satisfies`) · RPC hataları DÜZ NESNE (`instanceof Error`
  daraltma YASAK) · kapanış turu zorunlu doğrulama bloğu aynen.

## Batch'ler

### CD01 — API sarmalayıcı + şema (küçük, migration yok)

- `src/lib/cadde-schemas.ts`: `caddePostUpdateSchema` (Çarşı `carsiItemUpdateSchema` deseni):
  `postId` + opsiyonel `title?` (≤160), `body?` (≤4000), `media?` (≤5/≤4 img/≤1 vid — create
  şemasıyla aynı medya kuralı), `needCategory?`, `targets?` (max **1** — T3), `mentions YOK` (T1).
  `superRefine`: en az bir alan verilmeli (boş update = no-op çağrısı atılmasın).
- `src/lib/cadde-api.ts`: `updateCaddePost(input)` — Zod parse (`parseWithUserError`),
  `db.rpc("update_cadde_post_v1", { p_post_id, p_title?, p_body?, p_media?, p_need_category?, p_targets? })`
  (verilmeyen alan **hiç gönderilmez** = null = dokunma), hata → `caddeWriteError("updateCaddePost", error)`.
- Facade export listesi güncellenir (T4).
- **Kabul:** yeni `cadde-api-update.test.ts` — null-semantiği (undefined alan payload'a girmez),
  medya `[]` ile temizleme ayrımı, premium kapısı istemcide de tek hedefle sınırlı, hata sarmalayıcı
  bağlamı. Tam takım yeşil.

### CD02 — Composer düzenleme modu (orta)

- `CaddeComposer`'a `editTarget?: { postId, body, media, country, city, isCafe }` prop'u:
  verilince başlık "Paylaşımını düzenle", buton "Kaydet", body/media/konum ön dolu açılır;
  `onSubmit` farklı kanaldan (aşağıda). İptal düğmesi (`onCancelEdit`).
- `src/hooks/cadde/useCaddeComposerState.ts`: `updateMutation` — `updateCaddePost` çağırır;
  onSuccess: composer'ı kapat + `feedRoot` invalidate + toast "Paylaşım güncellendi";
  onError toast (`resolveCaddeRpcErrorMessage` mevcut desen).
- Konum: düzenlemede tek hedef değişimi serbest (T3); cafe varyantında panel gizli.
- **Kabul:** `CaddeComposer.test.tsx` genişletilmiş — edit modunda ön dolu açılır · Kaydet →
  `updateCaddePost` doğru payload (mentions YOK — T1 kilidi) · İptal → çağrı yok · medya `[]`
  temizleme. tsc/lint/test yeşil.

### CD03 — Menü bağlantısı + akış kablolaması (küçük)

- `CaddePostMenu`'ye "Düzenle" öğesi (Sil'in üstünde, Pencil ikonu) → `onEdit` prop'u.
- `CaddeFeedView`: `editingPostId` state — menüden gelince ilgili gönderinin verisiyle
  composer edit moduna geçer (feed'in ÜSTÜNE taşınmaz; composer yerinde dönüşür) +
  sayfada yumuşak kaydırma/focus. Düzenleme bitince normal moda döner.
- Görünürlük: menü zaten yalnız kendi gönderisinde → düzenleme öğesi de orada; **gerçek
  yetki DB'de** (A11c deseni — istemci kapısı kozmetik).
- **Kabul:** `CaddePostMenu.test.tsx` — Düzenle → `onEdit(postId)` · Sil akışı bozulmadı.
  `CaddePage.test.tsx` genişletme: menü → composer edit modu → Kaydet → invalidate zinciri.

### CD04 — Canlı doğrulama + kapanış (küçük, kanıt turu)

- Geri alınan işlemde SQL/RPC smoke: sahip body günceller (row + updated_at) · mentions null →
  anmalar KORUNDU (T1 canlı kanıtı) · medya `[]` → temizlendi · hedef değişimi tek öğeyle OK ·
  ikinci hedef → `cadde_multi_target_premium_required` · sahip-olmayan → `cadde_post_owner_required`
  · banned → `cadde_banned` · hidden → `cadde_post_not_found` · cafe gönderisinde p_targets yok
  sayıldı. Rollback sonrası canlı dokunulmamış.
- Kapanış: admin-updates kaydı ("Paylaşımını artık düzenleyebilirsin") + KALANLAR satır 162
  kapanışı + A11c/d "DÜZENLEME UI'I YOK" notunun güncellenmesi.
- **Kabul:** smoke çıktısı kanıt olarak batch kaydında; tam takım + tsc + lint + verify:text temiz.

## Sıra ve boyut

CD01 → CD02 → CD03 → CD04 (bağlayıcı sıra; her batch bir oturum bir commit).
Toplam ~1 günlük ajan işi; migration YOK; yeni edge/fonksiyon YOK; feature flag'e DOKUNULMAZ.

## Onaya sorular (opsiyonel — varsayılanlar planın içine işlendi)

1. Düzenlenen gönderiye "düzenlendi" işareti konsun mu? (RPC `updated_at` yazıyor; feed
   bugün yalnız `created_at` gösteriyor → **varsayılan: işaret YOK**, istenirse CD03'e küçük ekleme.)
2. Admin/moderatör başkasının gönderisini düzenleyebilsin mi? (RPC izin veriyor; UI menüsü
   yalnız sahip gönderisinde → **varsayılan: UI'da yalnız sahip**, moderatör silme yolu zaten açık.)
