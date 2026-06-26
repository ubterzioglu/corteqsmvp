# Tool 08 — İlk 90 Gün Planlayıcı — Taşınma Sonrası Görev Motoru E2E Dokümanı

> **Tool key:** `first_90_days_planner`  
> **Slug:** `ilk-90-gun-planlayici`  
> **Route:** `/relocation/tools/ilk-90-gun-planlayici`  
> **Result kind:** `checklist`  
> **Öncelik:** Orta-Yüksek  
> **Tahmini efor:** 4-7 gün mevcut checklist RPC genişletmesi; ülke seed'leriyle 2 hafta

## 1. Ürün amacı

Varış öncesi ve sonrası ilk 90 gün için ülke/şehir/hane durumuna göre yapılacakları timeline checklist olarak üretir.

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

1. Kullanıcı hedef ülke/şehir, varış tarihi ve hane durumunu girer.
2. Sistem mevcut `relocation_bureaucratic_steps` ve kullanıcı cevaplarından görev üretir.
3. Sonuçta `before_departure`, `day_0_7`, `day_8_30`, `day_31_90`, `ongoing` timeline'ı gösterilir.
4. Kullanıcı task'leri kişisel checklist'e kaydedebilir; bildirimler `relocation-notifications` ile tetiklenebilir.

## 3. Soru kapsamı

- Quick mode: 12 soru.
- Detailed mode: 20 soru.
- Soru metinleri DB seed olarak `relocation_tool_questions` tablosuna yazılmalı.
- Frontend soru render'ı generic `QuestionRenderer` üzerinden yapılmalı.

| Key | Soru | Tip | Not/opsiyon |
|---|---|---|---|
| `destination` | Hedef ülke/şehir? | `country/city` | zorunlu |
| `arrival_date` | Tahmini varış tarihin? | `date` | deadline hesapları |
| `visa_status` | Vize/oturum durumun? | `single` | approved, applied, researching, not_needed, none |
| `housing_status` | İlk konaklama durumun? | `single` | secured, temporary, searching, none |
| `address_registration_known` | Adres kaydı / belediye kaydı gerekliliğini biliyor musun? | `single` | yes, no, not_applicable |
| `health_insurance` | Sağlık sigortası planın? | `single` | active, will_buy, employer, none |
| `banking` | Yerel banka/ödeme çözümü planın? | `single` | ready, researching, none |
| `phone_internet` | Telefon/internet planın? | `single` | ready, temporary, none |
| `children_school` | Çocuk okul/kayıt ihtiyacı var mı? | `single` | yes, no |
| `pets` | Evcil hayvan taşınması var mı? | `single` | yes, no |
| `job_start` | İş/okul başlangıç tarihin belli mi? | `single` | yes, no, not_applicable |
| `documents_ready` | Belgelerin dijital/fiziksel kopyaları hazır mı? | `single` | yes, partial, no |
| `emergency_contacts` | Acil iletişimleri kaydettin mi? | `single` | yes, no |
| `transport` | İlk hafta ulaşım planın? | `single` | public_transport, car, taxi, none |
| `language_course` | Dil kursu/entegrasyon programı ihtiyacın var mı? | `single` | yes, no, not_sure |
| `community_intro` | İlk ay topluluk/mentor desteği ister misin? | `single` | yes, no |
| `tax_social_security` | Vergi/sosyal güvenlik adımlarını biliyor musun? | `single` | yes, no, not_applicable |
| `credential_recognition` | Mesleki denklik/lisans adımı gerekiyor mu? | `single` | yes, no, not_sure |
| `driving_license` | Ehliyet dönüşümü/araç ihtiyacı var mı? | `single` | yes, no |
| `notification_consent` | Görev hatırlatmaları almak ister misin? | `consent` | email/in-app |

## 4. Skor / karar modeli

Bu araç skor yerine görev önceliği üretir. Her task için `priority_score` hesaplanır.

`priority_score = deadline_urgency * 0.40 + legal_dependency * 0.25 + user_gap * 0.25 + source_trust * 0.10`

Timeline grupları:

- `before_departure`: vize, belge, sigorta, konaklama, evcil hayvan.
- `day_0_7`: adres kaydı, acil hatlar, telefon, ulaşım.
- `day_8_30`: banka, sağlık sistemi, vergi, okul, topluluk.
- `day_31_90`: denklik, kalıcı konut, dil kursu, iş arama optimizasyonu.
- `ongoing`: yenilemeler, entegrasyon, network.

Skor üretimi deterministic olmalı. SQL tarafındaki ağırlıklar TS mirror içinde de tutulacaksa, `relocation-tools-ranking.test.ts` ağırlık drift'ini yakalamalıdır. Eksik veri durumunda varsayılan davranış “nötr 0.50” veya dokümanda belirtilen güvenli fallback olmalıdır; kullanıcıya eksik veri uyarısı gösterilmelidir.

## 5. Veritabanı ve RPC planı

Mevcut `relocation_bureaucratic_steps` kullanılmalı. Kişisel task takibi istenirse:

```sql
create table public.relocation_user_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  source_result_id uuid references public.relocation_tool_results(id) on delete set null,
  country_code text,
  city_code text,
  title text not null,
  description text,
  due_date date,
  phase text not null,
  status text not null default 'open' check (status in ('open','done','dismissed')),
  source_step_id uuid references public.relocation_bureaucratic_steps(id),
  created_at timestamptz not null default now()
);
```

RPC: `relocation_score_first_90_days_v1(p_session_id uuid)`; mevcut `relocation_build_checklist_v1` mantığını answer gap'leriyle birleştirir.

Ortak RPC sözleşmesi:

```text
relocation_tool_start_session -> relocation_tool_save_answer -> relocation_tool_complete_session -> tool-specific scoring RPC -> relocation_tool_results
```

Bu araç için seed satırı:

```json
{
  "key": "first_90_days_planner",
  "slug": "ilk-90-gun-planlayici",
  "title_tr": "İlk 90 Gün Planlayıcı — Taşınma Sonrası Görev Motoru",
  "category": "relocation_assessment",
  "quick_question_count": 12,
  "detailed_question_count": 20,
  "result_kind": "checklist",
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

> İlk 90 gün planında 18 görev var. Kritik ilk 3: varıştan önce sağlık sigortasını netleştir, ilk hafta adres kaydı için randevu kontrolü yap, yerel telefon hattı edin. 6 görev resmi kaynak linki içeriyor.

CTA'lar:

- Görevleri kişisel checklist'e kaydet
- Hatırlatmaları aç
- Acil iletişimleri göster
- Şehirdeki servis önerilerini gör

## 8. Veri kaynakları ve ingestion notu

- Resmi ülke/şehir taşınma ve kayıt kılavuzları
- Konsolosluklar
- relocation_bureaucratic_steps
- WHO/emergency contact kaynakları

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
login -> /relocation/tools/ilk-90-gun-planlayici -> quick mode -> cevapları doldur -> tamamla -> result -> ilk CTA click event'i
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
