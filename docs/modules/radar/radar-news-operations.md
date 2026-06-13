# Radar Haber Pipeline — Operasyon Rehberi

## 1. Deploy adımları

```powershell
# 1. Migration uygula (canlı DB — additive, destructive değil)
supabase db push
# veya psql -f ile (Türkçe içerik UTF-8 dosya olarak gönderilmeli)

# 2. Types yeniden üret (B1) — radar tablolarını types.ts'e ekler
supabase gen types typescript --project-id injprdrsklkxgnaiixzh | Out-File -Encoding utf8 src/integrations/supabase/types.ts

# 3. Edge Function deploy
supabase functions deploy radar-news-scan

# 4. Frontend build + deploy (Coolify)
npm run build
```

## 2. Edge Function secrets

```powershell
supabase secrets set RADAR_NEWS_CRON_SECRET=<güçlü-rastgele-değer>
# SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
# Supabase tarafından otomatik enjekte edilir; manuel set gerekmez.
```

`.env.local` (yalnızca local serve için, repo'ya commit edilmez):
```env
RADAR_NEWS_CRON_SECRET=local-test-secret
SUPABASE_URL=https://injprdrsklkxgnaiixzh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ANON_KEY=...
```

## 3. Cron kurulumu (Supabase Vault + pg_cron + pg_net)

> Açık secret SQL'e yazılmaz; Vault'tan okunur.

```sql
-- 1. Cron secret'ı Vault'a koy (Supabase Dashboard → Vault veya SQL)
SELECT vault.create_secret('<cron-secret-değeri>', 'radar_news_cron_secret');

-- 2. Günlük tarama (05:00 UTC = yaz 07:00 / kış 06:00 Almanya)
SELECT cron.schedule(
  'corteqs-radar-daily-news-scan',
  '0 5 * * *',
  $$
  SELECT net.http_post(
    url := 'https://injprdrsklkxgnaiixzh.supabase.co/functions/v1/radar-news-scan',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'radar_news_cron_secret'
      )
    ),
    body := '{"triggerType":"cron","dryRun":false}'::jsonb
  );
  $$
);
```

İlk cron öncesi **dry-run** önerilir (admin panelinden "Şimdi Tara" veya):
```powershell
curl -X POST https://injprdrsklkxgnaiixzh.supabase.co/functions/v1/radar-news-scan `
  -H "Authorization: Bearer <CRON_SECRET>" `
  -H "Content-Type: application/json" `
  -d '{"triggerType":"manual","dryRun":true}'
```

## 4. Yeni RSS kaynağı açma akışı

1. `radar_news_sources`'a **pasif** kayıt ekle (`is_enabled=false`, `terms_checked=false`).
2. Kullanım şartlarını kontrol et:
   - RSS resmi mi? Syndication/yeniden kullanım izni? Ticari kısıt? Attribution? Rate limit?
3. `/admin/radar/sources` → "Şart Notları"na bulguları yaz → "Kullanım Şartları Kontrol Edildi" aç.
4. Dry-run ile endpoint'i test et.
5. "Tarama Aktif" aç.

## 5. Günlük operasyon

- **Kuyruk:** `/admin/radar/queue` → Bekleyenler sekmesi. Skor sırasına göre incele.
- **Onayla ve Radar'a Yayınla:** news_posts + marquee_items'a aktarır.
- **Sadece Haber Havuzuna Onayla:** yalnızca news_posts (marquee'ye sonra `/admin/marquee`'den).
- **Tarama Geçmişi:** `/admin/radar/runs` → metrikleri ve hatalı kaynakları izle.

## 6. Sorun giderme

| Belirti | Olası neden |
|---------|-------------|
| 409 "Zaten çalışan tarama var" | Önceki run `running`'de takıldı → `radar_news_scan_runs`'ta status'ü `failed`'a çek |
| Kaynak sürekli hata | `last_error_message`'a bak (`/admin/radar/sources`) |
| Aday gelmiyor | skor < 20 → `archived`. Keyword setini (`radar_news_keywords`) ayarla |
| 403 manuel taramada | Kullanıcı admin değil — `is_admin` RPC false |

## 7. Açık riskler / Faz 2

- **B1 types regen** yapılmadan `radarNewsPipeline.ts` `db` cast'ı kullanır (çalışır, tip güvenliği zayıf).
- Yakın-duplicate (`pg_trgm`) MVP dışı.
- LLM özet/çeviri, tam metin scraping, otomatik görsel — bilinçli olarak yok.
- TheNewsAPI/NewsAPI/GNews — varsayılan kapalı; yazılı kullanım teyidi olmadan açılmamalı.
- Radar arşivi (news_posts) vs marquee featured subset ayrımı — MVP sonrası refactor.
