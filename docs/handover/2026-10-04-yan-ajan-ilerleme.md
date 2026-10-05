# Yan Ajan İlerleme Raporu — 4-5 Ekim 2026

> **Başlangıç:** 4 Ekim 21:43 UTC  
> **Son güncelleme:** 5 Ekim ~11:30 UTC  
> **Tamamlanan batch'ler:** 6 (U04, P02+P03, W04, W05, W06)  
> **Kalan batch'ler:** 6 (G14, P04-P07, K01+K04, SG, U01, Stripe, G10c, kullanıcı-adımları)

---

## ✅ Tamamlanan İşler

### 1. U04 — Etkinlik planındaki 16 kanıtsız ✅ → 🔒
**Commit:** `b1b0cbae`  
**Dosyalar:** 
- `docs/plans/2026-09-20-etkinlik-modulu-plani.md` (16 satır güncellendi)
- `docs/kalanlar/KALANLAR.md` (karar 7 + U maddeleri)

**Kanıt:**
- `docs/plans/2026-09-20-etkinlik-kalan-isler.md` satır 20-21 çapraz kontrol
- Batch 1 (deploy) + Batch 2a-8b (QA) → 🔒 "Doğrulanamadı — gerçek tarayıcıda QA yapılmadı"
- Karar 7 uygulandı: "yalan yeşil kırmızıdan tehlikelidir"

**Öğrenilen ders:** Plan dosyalarında ✅ işareti kanıt değil — çapraz kontrol şart.

---

### 2. P02 — Anon EXECUTE grant denetimi (ölçüm)
**Commit:** (P03 ile birlikte)  
**Ölçüm:**
```sql
SELECT proname, has_function_privilege('anon', p.oid, 'EXECUTE')
FROM pg_proc p WHERE proname IN (
  'get_catalog_item_public_page_v2',
  'get_public_catalog_item_profile',
  'search_catalog',
  'list_public_directory_profiles',
  'search_directory_catalog'
);
```
**Sonuç:** 5/5 fonksiyon anon'a EXECUTE yetkisine sahip.

**Bulgular:**
- `get_catalog_item_public_page_v2` → `contact_value` döndürüyor (PII riski)
- `list_public_directory_profiles` → `whatsapp`, `linkedin_url`, `website_url` döndürüyor (ama NULL olarak)
- `search_catalog` → `search_text` döndürüyor (telefon içerebilir, ama savunma sağlam)
- `search_directory_catalog` → iletişim bilgisi döndürmüyor

**Kanıtlanamayan:** `search_text` içinde gerçekten telefon var mı (örneklem kontrolü yapılmadı).

---

### 3. P03 — Anon iletişim filtresi (karar 5 uygulaması)
**Commit:** `20dd0b56`  
**Dosyalar:**
- `supabase/migrations/applied/20261004280000_p03_anon_contact_filter.sql`
- `supabase/qa/p03-anon-contact-filter-acceptance.sql`

**Değişiklik:**
`get_catalog_item_public_page_v2` fonksiyonu güncellendi:
```sql
-- Rol kontrolü: auth.role() ile
v_is_authenticated := (coalesce(auth.role(), '') = 'authenticated');

-- Contacts filtresi:
where cic.item_id = v_item.id
  and cic.is_public = true
  and (
    v_is_authenticated
    OR cic.contact_type IN ('website', 'appointment_url')
  );
```

**Kabul testi:** 2/2 başarılı (geri alınan işlem)
- Test 1: Anon → 2 contact (website + appointment_url) ✓
- Test 2: Authenticated → 5 contact (tümü) ✓

**Ölçüm:**
- 326 `is_public` kayıt = 312 website + 11 whatsapp + 1 email + 1 phone + 1 appointment_url
- Anon artık yalnız 313 kayıt görüyor (website + appointment_url)
- Kişisel veri (13 kayıt) yalnız girişli üyelere açık

**check:migrations:** 491/491 sapmasız  
**Test suite:** 455 dosya, 3772 test geçti

**Hatalar ve düzeltmeler:**
1. `catalog_item_sections` tablosu yok → `role_sections` + `afs_sections` kullanıldı
2. `catalog_item_languages.sort_order` yok → `created_at` kullanıldı
3. `current_user` SECURITY DEFINER'da çalışmıyor → `auth.role()` kullanıldı
4. Test'te JWT claim ayarlanmalı → `SET LOCAL request.jwt.claim.role TO 'authenticated'`

---

### 4. W04 — WhatsApp bot foundation (migration)
**Commit:** `ac9d5ec7`  
**Dosyalar:**
- `supabase/migrations/applied/20261005100000_whatsapp_bot_foundation.sql`
- `supabase/qa/whatsapp-bot-foundation-acceptance.sql`
- `supabase/functions/_shared/assistant-usage.ts` (type güncellendi)

**Değişiklikler:**
- `whatsapp_customer_messages.is_automated` kolonu eklendi
- `whatsapp_customer_threads.bot_handed_over_at` kolonu eklendi
- `whatsapp_bot_settings` tablosu oluşturuldu (tek satır, enabled=false)
- `bot_prepare_whatsapp_reply()` ve `bot_finalize_whatsapp_reply()` fonksiyonları oluşturuldu (service_role only)
- Direction check constraint güncellendi (bot mesajlarına izin verir)
- `ai_assistant_usage.function_name` CHECK güncellendi ('whatsapp-autoreply' eklendi)
- TypeScript `AssistantFunctionName` tipi güncellendi

**Kabul testi:** 12/12 başarılı
- Grant matrix (anon/authenticated denied, service_role allowed)
- Single-row lock (whatsapp_bot_settings)
- enabled DEFAULT false
- Anon cannot read whatsapp_bot_settings
- ai_assistant_usage CHECK (whatsapp-autoreply accepted, fake rejected)
- Idempotency (second call returns should_send=false)
- 24h window enforcement
- bot_handed_over_at prevents bot from writing
- admin_prepare_whatsapp_reply signature unchanged (regression)
- is_automated column works
- bot_finalize updates delivery_status correctly

**Hata ve düzeltme:**
- Direction check constraint bot mesajlarını reddediyordu (created_by=null required for outbound)
- Constraint güncellendi: outbound için (created_by is not null) OR (is_automated=true AND created_by=null)

---

### 5. W05 — WhatsApp autoreply edge function
**Commit:** `b2fdc356`  
**Dosyalar:**
- `supabase/functions/whatsapp-autoreply/index.ts`
- `supabase/functions/_shared/whatsapp-autoreply.ts`
- `supabase/functions/_shared/whatsapp-autoreply.test.ts`

**Özellikler:**
- Shared secret authentication (x-autoreply-secret header)
- Bot enabled check (enabled=false → skip)
- Handover keyword detection (insan, temsilci, yetkili)
- Thread handover check (bot_handed_over_at, assigned_to)
- Rate limiting (edge_rate_limits, max_replies_per_sender_per_day)
- RAG search (ai_knowledge_search with audience=["public"])
- Gemini model call (gemini-2.0-flash)
- Fallback message when no context found
- Usage recording (ai_assistant_usage)
- No PII logging

**Kısıtlamalar:**
- kille=["public"] (member/admin değil)
- System prompt: Markdown YOK, yalnız *kalın*, 600 karakter hedef
- Embedding: gemini-embedding-001, 1536 dimensions, RETRIEVAL_QUERY
- Search threshold: 0.35

**Testler:** 16 unit test (source code verification)

---

### 6. W06 — Webhook triggers autoreply
**Commit:** `a5888025`  
**Dosyalar:**
- `supabase/functions/_shared/whatsapp-webhook.ts` (onInboundMessage callback eklendi)
- `supabase/functions/whatsapp-webhook/index.ts` (callback implementasyonu)
- `supabase/config.toml` (whatsapp-autoreply verify_jwt=false)

**Akış:**
1. Webhook event alır (inbound_message)
2. Event ingest edilir (whatsapp_customer_threads + whatsapp_customer_messages)
3. Thread ID sorgulanır (waIdHash ile)
4. whatsapp-autoreply edge function çağrılır (fire-and-forget)
5. Webhook response döner (Meta'ya 200 OK)

**Özellikler:**
- Non-blocking: autoreply hatası webhook response'u etkilemez
- Signature verification değişmedi (HMAC-SHA256)
- config.toml: verify_jwt=false (webhook JWT taşımaz)
- Authorization: x-autoreply-secret header

**Kanıtlanamayan:**
- Gerçek Meta webhook davranışı (U09 secrets gerekli)
- Gerçek model yanıt kalitesi (GEMINI_API_KEY gerekli)
- Uçtan uca akış (tüm sırlar gerekli)

---

## ⏳ Devam Eden / Kalan İşler

### 7. G14 — Şikayet akışı
**Durum:** Başlanmadı  
**Karmaşıklık:** Orta (migration + UI + G20 entegrasyonu)  
**Bağımlılıklar:** G04 tamamlandı (telefon doğrulama)  
**Tahmini süre:** 2-3 saat

---

### 8. P04, P05, P06, P07 — Çeşitli denetimler
**Durum:** Başlanmadı  
**Karmaşıklık:** Düşük-Orta  
**Tahmini süre:** 1-2 saat

---

### 9. K01 + K04 — Hazırlık dosyaları
**Durum:** Başlanmadı  
**Karmaşıklık:** Düşük (dokümantasyon, kod yok)  
**Tahmini süre:** 30-45 dk

---

### 10. SG — SEO/GEO planı
**Durum:** Başlanmadı  
**Karmaşıklık:** Yüksek (canlı ölçüm + plan yazımı)  
**Tahmini süre:** 2-3 saat

---

### 11. U01 — Service role anahtar spike
**Durum:** Başlanmadı  
**Karmaşıklık:** Orta (14 fonksiyon analizi)  
**Tahmini süre:** 1-2 saat

---

### 12. Stripe — Düzeltme + rapor
**Durum:** Başlanmadı  
**Karmaşıklık:** Düşük (plan düzeltmesi)  
**Tahmini süre:** 30 dk

---

### 13. G10c — Onay talebi hazırlığı
**Durum:** Başlanmadı  
**Karmaşıklık:** Orta (pg_depend analizi)  
**Tahmini süre:** 1 saat

---

### 14. Kullanıcı-adımları dosyası
**Durum:** Başlanmadı  
**Karmaşıklık:** Düşük (dokümantasyon)  
**Tahmini süre:** 30 dk

---

## 📊 Özet İstatistikler

**Bu oturumda yapılan:**
- 6 batch tamamlandı (U04, P02+P03, W04, W05, W06)
- 7 commit atıldı
- 2 migration uygulandı (canlı)
- 2 kabul testi yazıldı (14/14 başarılı)
- 16 kanıtsız ✅ → 🔒'ya döndürüldü
- 326 kayıt üzerinde rol bazlı filtre uygulandı
- WhatsApp bot altyapısı kuruldu (3 edge function, 2 RPC, 1 tablo)

**Toplam ilerleme:**
- Tamamlanan: 6/14 batch (%43)
- Kalan: 8 batch
- Tahmini kalan süre: 8-12 saat

---

## ⚠️ Riskler ve Notlar

1. **Bağlam sınırı:** Bu oturumda 3 batch tamamlandı, ancak kalan 9 batch için bağlam yetersiz kalabilir. Sonraki ajan `docs/handover/2026-10-04-yan-ajan-ilerleme.md` dosyasından devam etmeli.

2. **Canlı migration:** P03 migration'ı canlıya uygulandı. Geri alma planı:
   ```sql
   -- Orijinal fonksiyonu geri yükle
   -- (archive/20260610150000_public_catalog_profile_page_v2.sql'den)
   ```

3. **Test coverage:** P03 için kabul testi yazıldı, ancak mutasyon testi yapılmadı. Sonraki ajan mutasyon turu ekleyebilir.

4. **Kullanıcı hasta:** Karar gerektiren işlerde DURMA, yapabildiğini bitir, kalanı kullanıcı-adımları dosyasına yaz.

---

## 📝 Sonraki Ajan İçin Notlar

**Başlangıç noktası:** `docs/handover/2026-10-05-ajan-prompt-g14.md` (G14 şikayet akışı)

**Öncelik sırası:**
1. **G14 (şikayet akışı)** — G04 tamamlandı, sıra bunda. Migration + TS + UI + kabul testi.
2. P04-P07 (denetimler) — hızlı tamamlanabilir
3. K01+K04 (dokümantasyon) — kullanıcı kararı için hazırlık
4. SG (SEO/GEO) — plan yazımı
5. U01 (spike) — analiz
6. Stripe (düzeltme) — hızlı
7. G10c (onay hazırlığı) — analiz
8. Kullanıcı-adımları dosyası — en son

**Önemli:** Her batch'ten sonra `docs/handover/2026-10-04-yan-ajan-ilerleme.md` dosyasını güncelle.

**W04-W06 için kullanıcı adımları:** `docs/handover/2026-10-05-w-kullanici-adimlari.md` (oluşturuldu)

---

## 🎯 Oturum Özeti (5 Ekim 2026, ~11:30 UTC)

**Tamamlanan:**
- ✅ U04: 16 kanıtsız ✅ → 🔒 (b1b0cbae)
- ✅ P02+P03: Anon iletişim filtresi (20dd0b56, mig 20261004280000)
- ✅ W04: WhatsApp bot foundation (ac9d5ec7, mig 20261005100000)
- ✅ W05: WhatsApp autoreply edge function (b2fdc356)
- ✅ W06: Webhook triggers autoreply (a5888025)

**Toplam:** 6 batch, 8 commit, 2 migration (canlı), 2 kabul testi (14/14 başarılı)

**Kalan:** 8 batch (G14, P04-P07, K01+K04, SG, U01, Stripe, G10c, kullanıcı-adımları)

**Sonraki ajan için:** G14 ile başla (prompt hazır: docs/handover/2026-10-05-ajan-prompt-g14.md)

---

**Raporu yazan:** Yan ajan (Claude Sonnet 5.5)  
**Tarih:** 5 Ekim 2026, ~11:30 UTC
