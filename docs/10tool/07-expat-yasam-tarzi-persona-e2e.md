# Tool 07 — Sizin Yurt Dışı Yaşam Tarzınız? — Expat Persona Quiz E2E Dokümanı

> **Tool key:** `expat_lifestyle_persona`  
> **Slug:** `expat-yasam-tarzi-persona`  
> **Route:** `/relocation/tools/expat-yasam-tarzi-persona`  
> **Result kind:** `persona`  
> **Öncelik:** Düşük ama hızlı engagement  
> **Tahmini efor:** 1-2 gün ortak engine sonrası

## 1. Ürün amacı

Eğlenceli, düşük riskli persona quizi; paylaşılabilir sonuç ve CorteQS topluluk CTA'sı üretir.

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

1. Kullanıcı 8-10 hafif yaşam tarzı sorusunu cevaplar.
2. TS veya SQL rule mapping persona puanlarını hesaplar.
3. En yüksek persona sonucu, kısa açıklama, güçlü yönler ve önerilen CorteQS alanları gösterilir.
4. Kullanıcı sonucu paylaşabilir veya profil badge'i olarak kaydedebilir.

## 3. Soru kapsamı

- Quick mode: 8 soru.
- Detailed mode: 10 soru.
- Soru metinleri DB seed olarak `relocation_tool_questions` tablosuna yazılmalı.
- Frontend soru render'ı generic `QuestionRenderer` üzerinden yapılmalı.

| Key | Soru | Tip | Not/opsiyon |
|---|---|---|---|
| `weekend_style` | Yeni bir şehirde ilk hafta sonu ne yaparsın? | `single` | network_event, museum_walk, hiking, family_market, quiet_cafe |
| `social_energy` | Yeni insanlarla tanışmak sana nasıl gelir? | `scale` | 1-5 |
| `planning_style` | Planlı mı spontane mi? | `scale` | 1=planlı 5=spontane |
| `local_language` | Yerel dili yanlış yaparak konuşmayı dener misin? | `scale` | 1-5 |
| `community_need` | Kendi kültüründen insanlarla bağ kurma ihtiyacın? | `scale` | 1-5 |
| `comfort_zone` | Konfor alanından çıkma isteğin? | `scale` | 1-5 |
| `career_focus` | Taşınmada kariyer/network odağın? | `scale` | 1-5 |
| `family_rhythm` | Aile ve rutin odaklı yaşam sana ne kadar uygun? | `scale` | 1-5 |
| `city_vs_nature` | Büyük şehir mi doğa/sakinlik mi? | `scale` | 1=doğa 5=şehir |
| `sharing` | Sonucunu toplulukla paylaşmak ister misin? | `single` | yes, no |

## 4. Skor / karar modeli

Persona skorları cevap başına +0/+1/+2 ağırlıklarla artar.

| Persona | Sinyaller |
|---|---|
| `global_networker` | sosyal enerji, kariyer/network, şehir hayatı |
| `quiet_local` | sakinlik, rutin, yerel kültüre yavaş uyum |
| `adventure_seeker` | spontane, konfor alanı dışı, doğa/keşif |
| `family_planner` | aile, güvenlik, planlı yaşam |
| `career_builder` | kariyer, yoğun şehir, networking |
| `community_anchor` | diaspora topluluğu, yardım etme, kültürel bağ |

Eşitlikte iki persona “hibrit” olarak gösterilir.

Skor üretimi deterministic olmalı. SQL tarafındaki ağırlıklar TS mirror içinde de tutulacaksa, `relocation-tools-ranking.test.ts` ağırlık drift'ini yakalamalıdır. Eksik veri durumunda varsayılan davranış “nötr 0.50” veya dokümanda belirtilen güvenli fallback olmalıdır; kullanıcıya eksik veri uyarısı gösterilmelidir.

## 5. Veritabanı ve RPC planı

Ortak tablolar yeterli. İsteğe bağlı olarak `relocation_tool_results.primary_result.persona_key` profile badge olarak `user_profile_attributes` içine yazılabilir. Consent olmadan profile write yapılmaz.

RPC: `relocation_score_lifestyle_persona_v1(p_session_id uuid)` veya tamamı TS'de hesaplanıp RPC result write yapabilir. DB-first tutarlılık için RPC önerilir.

Ortak RPC sözleşmesi:

```text
relocation_tool_start_session -> relocation_tool_save_answer -> relocation_tool_complete_session -> tool-specific scoring RPC -> relocation_tool_results
```

Bu araç için seed satırı:

```json
{
  "key": "expat_lifestyle_persona",
  "slug": "expat-yasam-tarzi-persona",
  "title_tr": "Sizin Yurt Dışı Yaşam Tarzınız? — Expat Persona Quiz",
  "category": "relocation_assessment",
  "quick_question_count": 8,
  "detailed_question_count": 10,
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

> Persona'n: Global Networker. Yeni şehirlerde hızlı bağlantı kurar, etkinlik ve profesyonel ağlardan enerji alırsın. Sana uygun CorteQS adımları: Cadde akışını aç, şehir etkinliklerini takip et, mentor eşleşmesini dene.

CTA'lar:

- Sonucu paylaş
- Profil badge'i olarak kaydet
- Benzer personadaki üyeleri gör
- Cadde'ye git

## 8. Veri kaynakları ve ingestion notu

- Harici veri gerekmez; içerik ve UX odaklıdır

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
login -> /relocation/tools/expat-yasam-tarzi-persona -> quick mode -> cevapları doldur -> tamamla -> result -> ilk CTA click event'i
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
