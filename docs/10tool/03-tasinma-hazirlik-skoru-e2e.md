# Tool 03 — Yurt Dışına Taşınmaya Hazır mısınız? — Hazırlık Skoru E2E Dokümanı

> **Tool key:** `relocation_readiness`  
> **Slug:** `tasinma-hazirlik-skoru`  
> **Route:** `/relocation/tools/tasinma-hazirlik-skoru`  
> **Result kind:** `score`  
> **Öncelik:** Yüksek  
> **Tahmini efor:** 2-4 gün ortak engine sonrası

## 1. Ürün amacı

Finans, evrak, dil, iş/gelir, konaklama ve destek ağına göre taşınma hazırlığını ölçer ve aksiyon listesi üretir.

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

1. Kullanıcı taşınmayı düşündüğü ülke/şehir varsa seçer.
2. Finans, evrak, dil, iş, konaklama ve sosyal destek sorularını cevaplar.
3. `relocation_score_readiness_v1` alt skorları hesaplar.
4. Sonuçta readiness skoru, en zayıf 3 boyut ve 7 günlük aksiyon planı gösterilir.
5. Negatif cevaplar `First 90 Days Planner` veya mevcut checklist sekmesine task olarak aktarılabilir.

## 3. Soru kapsamı

- Quick mode: 6 soru.
- Detailed mode: 15 soru.
- Soru metinleri DB seed olarak `relocation_tool_questions` tablosuna yazılmalı.
- Frontend soru render'ı generic `QuestionRenderer` üzerinden yapılmalı.

| Key | Soru | Tip | Not/opsiyon |
|---|---|---|---|
| `target_known` | Hedef ülke/şehir belli mi? | `single` | country_known, city_known, not_yet |
| `savings_months` | Kaç aylık yaşam gideri birikimin var? | `single` | 0, 1-2, 3-5, 6+ |
| `debt_pressure` | Kısa vadede taşınmayı zorlayacak borç/ödeme baskın var mı? | `scale` | 1-5 ters skor |
| `passport_validity` | Pasaport ve temel kimlik evrakların güncel mi? | `single` | yes, expiring, no |
| `visa_route` | Hedef ülke için net bir vize/oturum rotan var mı? | `single` | yes, researching, no |
| `diploma_docs` | Diploma, transkript, referans ve iş belgelerin hazır mı? | `single` | ready, partial, no |
| `language_level` | Hedef ülke iş/yaşam dili seviyen? | `scale` | 0-5 CEFR mapping |
| `housing_first_month` | İlk ay konaklama planın var mı? | `single` | secured, leads, no |
| `job_income_plan` | İlk 3 ay gelir/iş planın var mı? | `single` | job_offer, remote_income, savings_only, no |
| `health_insurance` | Sağlık sigortası / erişim planın var mı? | `single` | yes, researching, no |
| `support_network` | Hedef yerde tanıdık/topluluk desteğin var mı? | `single` | strong, weak, none |
| `family_alignment` | Eş/çocuk/aile kararları net mi? | `single` | not_applicable, aligned, partial, conflict |
| `emergency_plan` | Acil durumda iletişim ve dönüş planın var mı? | `single` | yes, partial, no |
| `adaptability` | Belirsizlik ve kültürel uyuma hazır hissediyor musun? | `scale` | 1-5 |
| `timeline_realism` | Taşınma takvimin gerçekçi mi? | `scale` | 1-5 |

## 4. Skor / karar modeli

| Boyut | Ağırlık | Alt sinyaller |
|---|---:|---|
| `financial_readiness` | 25 | Birikim ayı, borç baskısı, kurulum bütçesi. |
| `legal_document_readiness` | 20 | Pasaport, vize rotası, diploma/denklik belgeleri. |
| `language_readiness` | 15 | Dil seviyesi ve hedef ülke gerekliliği. |
| `housing_logistics` | 15 | İlk ay konaklama, taşınma takvimi, hane karmaşıklığı. |
| `job_income_readiness` | 15 | İş teklifi, remote gelir, iş arama planı. |
| `support_adaptability` | 10 | Destek ağı, acil plan, psikolojik uyum. |

Bucket: `80-100 hazır`, `60-79 kontrollü ilerle`, `40-59 önce hazırlık`, `<40 yüksek risk`.

Skor üretimi deterministic olmalı. SQL tarafındaki ağırlıklar TS mirror içinde de tutulacaksa, `relocation-tools-ranking.test.ts` ağırlık drift'ini yakalamalıdır. Eksik veri durumunda varsayılan davranış “nötr 0.50” veya dokümanda belirtilen güvenli fallback olmalıdır; kullanıcıya eksik veri uyarısı gösterilmelidir.

## 5. Veritabanı ve RPC planı

Bu araç için ortak tablolar yeterli. İsteğe bağlı profile write:

- `user_profile_attributes`: `relocation_readiness_bucket`, `relocation_target_country`, `relocation_next_action_tags`.
- `relocation_tool_results.recommendations`: task list JSON.

RPC: `relocation_score_readiness_v1(p_session_id uuid)`.

Ortak RPC sözleşmesi:

```text
relocation_tool_start_session -> relocation_tool_save_answer -> relocation_tool_complete_session -> tool-specific scoring RPC -> relocation_tool_results
```

Bu araç için seed satırı:

```json
{
  "key": "relocation_readiness",
  "slug": "tasinma-hazirlik-skoru",
  "title_tr": "Yurt Dışına Taşınmaya Hazır mısınız? — Hazırlık Skoru",
  "category": "relocation_assessment",
  "quick_question_count": 6,
  "detailed_question_count": 15,
  "result_kind": "score",
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

> Hazırlık skorun 68/100. Finans ve evrak tarafın orta-iyi; dil ve ilk ay konaklama tarafında açık var. Önümüzdeki 7 gün için önerilen ilk 3 aksiyon: pasaport geçerliliğini kontrol et, hedef ülke vize rotasını netleştir, ilk ay konaklama bütçesini çıkar.

Detay: radar chart veya alt skor kartları + “eksikse ekle” görev listesi.

CTA'lar:

- İlk 90 Gün Planlayıcı'ya geç
- Ülke seçimi aracına dön
- Mentor/topluluk desteği bul
- Sonucu profiline kaydet

## 8. Veri kaynakları ve ingestion notu

- Resmi göçmenlik checklist'leri
- CorteQS relocation_bureaucratic_steps
- GDPR/KVKK minimizasyon prensipleri

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
login -> /relocation/tools/tasinma-hazirlik-skoru -> quick mode -> cevapları doldur -> tamamla -> result -> ilk CTA click event'i
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
