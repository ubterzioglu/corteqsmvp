# Tool 06 — Yurt Dışında Hangi Kariyer Sana Uygun? — Kariyer Yolu Aracı E2E Dokümanı

> **Tool key:** `career_path_abroad`  
> **Slug:** `yurtdisi-kariyer-yolu`  
> **Route:** `/relocation/tools/yurtdisi-kariyer-yolu`  
> **Result kind:** `persona`  
> **Öncelik:** Orta  
> **Tahmini efor:** 4-6 gün içerik + skor; veri entegrasyonu ile 2 hafta

## 1. Ürün amacı

Kullanıcının beceri, ilgi, eğitim, risk ve hedeflerine göre yurt dışı kariyer patikaları önerir.

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

1. Kullanıcı mevcut rolünü, becerilerini, çalışma tarzını ve eğitim isteğini girer.
2. Sistem 6 kariyer patikası için skor üretir.
3. Sonuçta birincil patika, ikincil alternatif ve 6-12 aylık hazırlık roadmap'i gösterilir.
4. Kullanıcı maaş karşılaştırma, iş bulma olasılığı veya diaspora mentor eşleşmesine yönlenir.

## 3. Soru kapsamı

- Quick mode: 7 soru.
- Detailed mode: 15 soru.
- Soru metinleri DB seed olarak `relocation_tool_questions` tablosuna yazılmalı.
- Frontend soru render'ı generic `QuestionRenderer` üzerinden yapılmalı.

| Key | Soru | Tip | Not/opsiyon |
|---|---|---|---|
| `current_field` | Şu anki alanın / bölümün / mesleğin? | `profession` | ESCO/free tag |
| `favorite_work` | En çok hangi iş tipinden enerji alırsın? | `multi` | analysis, building, people, research, operations, sales, teaching |
| `core_skills` | Güçlü becerilerin? | `multi` | technical, communication, language, leadership, craft, healthcare, finance |
| `study_willingness` | Yurt dışında yeniden eğitim/sertifika almaya açık mısın? | `scale` | 1-5 |
| `risk_appetite` | Kariyerde yeniden başlama riskine toleransın? | `scale` | 1-5 |
| `work_environment` | Çalışma ortamı tercihin? | `single` | startup, corporate, academic, public, freelance, field_work |
| `salary_vs_stability` | Maaş mı istikrar mı? | `scale` | 1=istikrar 5=maaş |
| `regulated_barrier` | Alanında lisans/denklik bariyeri var mı? | `single` | yes, no, not_sure |
| `language_level` | İş dilinde seviyen? | `scale` | 0-5 |
| `portfolio_signal` | Portföy, yayın, proje veya referansların var mı? | `single` | strong, partial, none |
| `entrepreneurship` | Girişimcilik/freelance çalışma ilgisi? | `scale` | 1-5 |
| `research_interest` | Araştırma/akademi ilgisi? | `scale` | 1-5 |
| `hands_on_interest` | Pratik/mesleki uygulama ilgisi? | `scale` | 1-5 |
| `people_helping` | İnsanlara doğrudan destek veren rollere ilgin? | `scale` | 1-5 |
| `timeline` | Kariyer dönüşümü için zaman ufkun? | `single` | 0-3m, 3-12m, 1-2y, 2y+ |

## 4. Skor / karar modeli

6 patika aynı anda skorlanır:

| Patika | Güçlü sinyaller |
|---|---|
| `international_professional` | mevcut uzmanlık + deneyim + dil + kurumsal uyum |
| `academic_research` | araştırma ilgisi + yüksek eğitim isteği + yayın/proje |
| `vocational_practical` | hands-on beceri + denklik/sertifika açıklığı |
| `startup_entrepreneur` | risk + girişimcilik + network/ürün ilgisi |
| `remote_global` | portföy + teknik/dijital beceri + çalışma bağımsızlığı |
| `public_ngo_community` | insan/impact motivasyonu + dil + saha deneyimi |

Her patika 0-100. Birincil patika ile ikinci patika farkı <8 ise “hibrit yol” öner.

Skor üretimi deterministic olmalı. SQL tarafındaki ağırlıklar TS mirror içinde de tutulacaksa, `relocation-tools-ranking.test.ts` ağırlık drift'ini yakalamalıdır. Eksik veri durumunda varsayılan davranış “nötr 0.50” veya dokümanda belirtilen güvenli fallback olmalıdır; kullanıcıya eksik veri uyarısı gösterilmelidir.

## 5. Veritabanı ve RPC planı

Ek referans tabloları:

```sql
create table public.relocation_career_paths (
  key text primary key,
  title_tr text not null,
  description_tr text not null,
  required_signals jsonb not null default '{}',
  roadmap_template jsonb not null default '{}'
);

create table public.relocation_role_path_mappings (
  id uuid primary key default gen_random_uuid(),
  profession_code text,
  career_path_key text references public.relocation_career_paths(key),
  fit_prior numeric(4,3) not null default 0.5,
  source_id uuid references public.relocation_source_registry(id)
);
```

RPC: `relocation_score_career_path_v1(p_session_id uuid)`.

Ortak RPC sözleşmesi:

```text
relocation_tool_start_session -> relocation_tool_save_answer -> relocation_tool_complete_session -> tool-specific scoring RPC -> relocation_tool_results
```

Bu araç için seed satırı:

```json
{
  "key": "career_path_abroad",
  "slug": "yurtdisi-kariyer-yolu",
  "title_tr": "Yurt Dışında Hangi Kariyer Sana Uygun? — Kariyer Yolu Aracı",
  "category": "relocation_assessment",
  "quick_question_count": 7,
  "detailed_question_count": 15,
  "result_kind": "persona",
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

> Birincil yolun: International Professional (78/100). İkinci güçlü alternatif: Remote Global (71/100). 6 aylık odak: dil seviyesini B2'ye taşımak, portföyünü İngilizceye çevirmek, hedef ülkelerde maaş ve iş bulma olasılığını karşılaştırmak.

CTA'lar:

- Maaş karşılaştırma aracını aç
- İş bulma olasılığını hesapla
- Bu patikada mentor bul
- Roadmap'i profiline kaydet

## 8. Veri kaynakları ve ingestion notu

- ESCO occupation/skills
- UNESCO UIS education data
- EURES labour market info
- CorteQS mentor/profile data

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
login -> /relocation/tools/yurtdisi-kariyer-yolu -> quick mode -> cevapları doldur -> tamamla -> result -> ilk CTA click event'i
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
