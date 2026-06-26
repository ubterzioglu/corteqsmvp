# Tool 05 — CorteQS Diaspora Ağı Eşleştirme — Mentor ve Topluluk Matchmaker E2E Dokümanı

> **Tool key:** `diaspora_matchmaker`  
> **Slug:** `diaspora-ag-eslestirme`  
> **Route:** `/relocation/tools/diaspora-ag-eslestirme`  
> **Result kind:** `match_list`  
> **Öncelik:** Yüksek ama privacy-riskli  
> **Tahmini efor:** 1-2 hafta MVP; güvenli messaging ve moderasyonla 3-5 hafta

## 1. Ürün amacı

Yeni taşınan veya taşınmayı planlayan kullanıcıları ihtiyaç/teklif, şehir, meslek, dil ve uygunluk üzerinden diğer diaspora üyeleriyle eşleştirir.

Bu araç tek başına çalışmalı; ancak mümkün olduğunda mevcut `/relocation` planından, `relocation_moves` kaydından ve profil attribute'larından prefill almalıdır. Kullanıcı açık rıza vermeden hiçbir sonuç profil attribute'u olarak yazılmamalıdır.

## Repo bağlamı ve değişmez kurallar

Bu doküman `ubterzioglu/corteqsmvp` deposunun mevcut mimarisine göre yazıldı. Claude Code implementasyonu yaparken aşağıdaki repo gerçeklerini varsaymalıdır:

- Uygulama tek SPA: React 18 + Vite 5 + TypeScript + Tailwind/shadcn + Supabase/Postgres/RLS + security-definer RPC yapısı.
- Yeni feature katmanlaması şu deseni izlemeli: `src/lib/<modul>-api.ts`, `src/lib/<modul>-schemas.ts`, `src/lib/<modul>-types.ts`, `src/lib/<modul>-query-keys.ts`, `components/<modul>/`, `pages/<modul>/`.
- Yeni kodda component içinde doğrudan `supabase.from()` yazma; API modülü + React Query kullan.
- Tek Supabase client: `@/integrations/supabase/client`; bu dosyaya dokunma.
- Admin / role / profile tarafında legacy `profiles`, `user_profiles`, `admin_users`, `role_feature_defaults` tablolarına referans verme. Güncel model `user_role_assignments`, `user_profile_attributes`, `is_admin()` / `is_moderator()` RPC'leri ve AFS katmanıdır.
- Mutasyonlar mümkün olduğunca `security definer` RPC üzerinden yürümeli; frontend sadece Zod doğrulama ve UX sağlar. RLS okuma ve sahiplik sınırını korur.
- `src/components/ui/*` shadcn primitive dosyalarını manuel düzenleme.
- Kullanıcıya görünen Türkçe metinde `src/lib/text-normalization.ts` yardımcılarını kullan; çıplak `toUpperCase()/toLowerCase()` sadece teknik kodlarda kullanılmalı.
- Test ve teslim komutları: `npm run verify:text`, `npm run test`, `npm run build`, gerektiğinde `npm run test:e2e` ve `BASE_URL=https://corteqs.net npm run verify:release`.
- Mevcut `/relocation` route'u authenticated çalışıyor ve `RelocationHomePage` içinde wizard -> şehir önerileri -> servisler -> checklist -> emergency sekmeleri var. Bu 10 araç mevcut relocation omurgasının genişletmesi olarak tasarlanmalı.

## 2. E2E kullanıcı akışı

1. Kullanıcı açık rıza ekranını görür: eşleşmede hangi bilgilerin kullanılacağı ve karşı tarafa ne gösterileceği açıklanır.
2. Kullanıcı ihtiyaçlarını, sunabileceği desteği, mesleğini, hedef şehir/ülkeyi ve iletişim tercihini girer.
3. Sistem sadece opt-in kullanıcı havuzunda aday üretir.
4. Sonuçta isim yerine MVP'de güvenli özet kartlar gösterilir; doğrudan iletişim için karşılıklı kabul gerekir.
5. Kabul sonrası CorteQS iç mesajlaşma, Cadde Cafe veya directory profile CTA'sı açılır.

## 3. Soru kapsamı

- Quick mode: 8 soru.
- Detailed mode: 16 soru.
- Soru metinleri DB seed olarak `relocation_tool_questions` tablosuna yazılmalı.
- Frontend soru render'ı generic `QuestionRenderer` üzerinden yapılmalı.

| Key | Soru | Tip | Not/opsiyon |
|---|---|---|---|
| `consent_match_visibility` | Eşleşme havuzunda görünmeyi kabul ediyor musun? | `consent` | zorunlu |
| `current_location` | Şu an neredesin? | `country/city` | opsiyonel city |
| `target_location` | Hedef ülke/şehir? | `country/city` | çoklu |
| `profile_status` | Durumun ne? | `single` | planning, newly_arrived, settled, mentor, organization |
| `profession_field` | Meslek/sektör alanın? | `profession` | ESCO/free tag |
| `needs` | Hangi konularda yardıma ihtiyacın var? | `multi` | job, housing, visa, language, school, community, healthcare |
| `offers` | Hangi konularda destek verebilirsin? | `multi` | mentoring, CV review, local tips, housing lead, language practice |
| `languages` | Hangi dillerde iletişim kurabilirsin? | `multi` | TR/EN/DE/... |
| `availability` | Görüşme uygunluğun? | `single` | weekdays, evenings, weekends, async_only |
| `contact_style` | İlk temas tercihin? | `single` | message, virtual_coffee, group_event, anonymous_intro |
| `mentor_capacity` | Ayda kaç kişiye destek verebilirsin? | `number` | mentor/settled için |
| `intro_text` | Karşı tarafa gösterilecek kısa tanıtım | `text` | max 280 chars |
| `sensitive_hide` | Gizlemek istediğin alanlar | `multi` | city, profession, real_name, employer |
| `timezone` | Saat dilimi / uygun saat | `single` | auto + manual |
| `trust_signals` | Profil doğrulama sinyalleri | `multi` | completed_profile, catalog_claim, phone_verified |
| `blocking_topics` | Eşleşmek istemediğin konu/tipler | `multi` | sales, legal_advice, recruiting, none |

## 4. Skor / karar modeli

Bu araç skor değil eşleşme üretir. Aday uyumluluk skoru 0-100.

| Boyut | Ağırlık | Açıklama |
|---|---:|---|
| `need_offer_complementarity` | 35 | Kullanıcı ihtiyacı karşı tarafın teklif ettiği destekle örtüşüyor mu? |
| `geo_proximity` | 20 | Aynı ülke/şehir veya hedef lokasyonda deneyim. |
| `field_overlap` | 15 | Meslek/sektör benzerliği. |
| `language_timezone_fit` | 10 | Ortak dil ve iletişim saatleri. |
| `trust_profile_completeness` | 10 | Profil doluluğu, claim/doğrulama, aktiflik. |
| `reciprocity_recent_activity` | 10 | Son aktivite ve mentor kapasitesi. |

Hard filters: consent yoksa aday yok; kullanıcı kendisiyle eşleşemez; block/ban/hidden profile adaydan çıkar; `sensitive_hide` alanları result payload'da maskelenir.

Skor üretimi deterministic olmalı. SQL tarafındaki ağırlıklar TS mirror içinde de tutulacaksa, `relocation-tools-ranking.test.ts` ağırlık drift'ini yakalamalıdır. Eksik veri durumunda varsayılan davranış “nötr 0.50” veya dokümanda belirtilen güvenli fallback olmalıdır; kullanıcıya eksik veri uyarısı gösterilmelidir.

## 5. Veritabanı ve RPC planı

Ek tablolar:

```sql
create table public.diaspora_match_preferences (
  user_id uuid primary key default auth.uid(),
  visibility_status text not null default 'off' check (visibility_status in ('off','anonymous','profile_summary')),
  target_country_codes text[] not null default '{}',
  target_city_codes text[] not null default '{}',
  needs text[] not null default '{}',
  offers text[] not null default '{}',
  profession_tags text[] not null default '{}',
  languages text[] not null default '{}',
  availability jsonb not null default '{}',
  hidden_fields text[] not null default '{}',
  max_monthly_intros integer not null default 3,
  updated_at timestamptz not null default now()
);

create table public.diaspora_matches (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null,
  candidate_id uuid not null,
  score numeric(6,2) not null,
  score_breakdown jsonb not null default '{}',
  status text not null default 'suggested' check (status in ('suggested','requested','accepted','declined','expired','blocked')),
  intro_context jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique(requester_id, candidate_id)
);
```

RPC'ler: `relocation_score_diaspora_matchmaker_v1`, `diaspora_request_intro_v1`, `diaspora_accept_intro_v1`, `diaspora_decline_intro_v1`.

Ortak RPC sözleşmesi:

```text
relocation_tool_start_session -> relocation_tool_save_answer -> relocation_tool_complete_session -> tool-specific scoring RPC -> relocation_tool_results
```

Bu araç için seed satırı:

```json
{
  "key": "diaspora_matchmaker",
  "slug": "diaspora-ag-eslestirme",
  "title_tr": "CorteQS Diaspora Ağı Eşleştirme — Mentor ve Topluluk Matchmaker",
  "category": "relocation_assessment",
  "quick_question_count": 8,
  "detailed_question_count": 16,
  "result_kind": "match_list",
  "requires_auth": true,
  "is_active": true
}
```

## 6. Frontend uygulama planı

Eklenecek/güncellenecek ana parçalar:

```text
src/lib/relocation-tools-config.ts          # Bu aracın config ve soru seed'i
src/lib/relocation-tools-api.ts             # generic RPC wrapper'ları
src/lib/relocation-tools-schemas.ts         # Zod sınırları
src/lib/relocation-tools-query-keys.ts      # React Query key factory
src/components/relocation/tools/*           # ortak tool UI
src/pages/relocation/tools/RelocationToolPage.tsx
src/pages/relocation/tools/RelocationToolResultPage.tsx
```

UI gereksinimleri:

- Progress bar: `answered / total`.
- Geri/ileri navigasyon.
- Her soru için “emin değilim” veya opsiyonel skip sadece skor modeli izin veriyorsa.
- Sonuç ekranında kısa özet, detay kırılımı, kaynak kalitesi/freshness ve CTA paneli.
- Sonuç metinleri Türkçe, sade ve garanti iddiası içermeyecek şekilde yazılmalı.

## 7. Çıktı şablonu

Kısa sonuç:

> 5 güvenli eşleşme bulundu. İlk aday Berlin'de settled software engineer; CV review ve ilk iş arama stratejisinde destek verebilir. Ortak dil: Türkçe/İngilizce. İletişim için karşılıklı onay gerekir.

MVP güvenli kart: ad, soyad ve direkt iletişim gizli; sadece onay sonrası açılır.

CTA'lar:

- Tanışma isteği gönder
- Cadde Cafe'de grup buluşması oluştur
- Profilini tamamla
- Directory'de mentorları filtrele

## 8. Veri kaynakları ve ingestion notu

- CorteQS user_profile_attributes
- catalog_items / public directory
- Cadde city/interests/activity
- Kullanıcı açık rızası

Kaynak stratejisi: önce resmi kaynak ve regülatör; sonra lisanslı ticari API; en sonda crowd-sourced fallback. Her veri satırı `source_id`, `freshness_at`, `confidence` veya `source_quality` taşımalıdır. API anahtarları DB'de tutulmaz; sadece `secret_ref` env değişken adı tutulur.

## 9. Privacy, KVKK/GDPR ve saklama

- Varsayılan: sonuç üretmek için gerekli minimum cevap toplanır.
- Ham cevaplar `relocation_tool_sessions.expires_at` ile 30 gün sonra temizlenebilir.
- Kullanıcı “profile kaydet” demedikçe `user_profile_attributes` güncellenmez.
- Partner/referral CTA'ları için ayrı açık rıza gerekir.
- Hassas veri isteme: pasaport numarası, kimlik numarası, sağlık teşhisi, tam adres, işveren iç bilgisi alınmaz.
- Analytics event'leri sadece ürün iyileştirme için; result metni içinde kişisel veriyi gereksiz tekrar etme.

## 10. QA, test ve kabul kriterleri

### Unit test

- Skor ağırlıkları toplamı 1.0 / 100 olmalı.
- Eksik cevaplarda güvenli fallback.
- Uç değerler: 0 bütçe, çok yüksek bütçe, dil bilinmiyor, hedef ülke boş, consent false.
- Bucket sınırları: eşik değerleri birebir test edilir.

### Component test

- Tool landing render.
- Quick mode soru sayısı doğru.
- Required soru boşken submit engellenir.
- Result sayfasında CTA'lar görünür.

### Playwright happy path

```text
login -> /relocation/tools/diaspora-ag-eslestirme -> quick mode -> cevapları doldur -> tamamla -> result -> ilk CTA click event'i
```

### Security test

- Kullanıcı A, kullanıcı B'nin `sessionId` / `resultId` değerini URL ile açamamalı.
- Consent false ise profile write gerçekleşmemeli.
- RPC auth yoksa `rl_auth_required` veya ortak hata kodu dönmeli.

### Definition of Done

- Migration + seed dosyaları eklendi.
- `npm run verify:text`, `npm run test`, `npm run build` yeşil.
- Tool hub'da kart görünüyor.
- Quick ve detailed mode çalışıyor.
- Sonuç ekranı açıklanabilir skor ve CTA üretiyor.
- Privacy metni görünür.

## 11. Claude Code görev listesi

1. Ortak engine yoksa önce `00-ortak-mimari-ve-agent-talimatlari.md` dosyasındaki core migration/API/UI iskeletini uygula.
2. Bu aracın `relocation_tools` seed kaydını ekle.
3. Bu aracın soru seed'lerini `relocation_tool_questions` içine ekle.
4. Tool-specific scoring RPC'sini yaz.
5. TS mirror gerekiyorsa `relocation-tools-ranking.ts` içine saf skor fonksiyonunu ekle.
6. Result copy ve CTA mapping'i `relocation-tools-copy.ts` içine ekle.
7. Vitest fixture'larını yaz.
8. Playwright happy-path senaryosuna bu slug'ı ekle.
9. Build ve text doğrulamasını çalıştır.
