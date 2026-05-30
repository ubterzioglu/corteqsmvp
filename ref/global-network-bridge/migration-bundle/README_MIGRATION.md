# CorteQS — Lovable Cloud → Self-Hosted Supabase + Gemini Migration

Bu paket, projeyi Lovable Cloud'dan kendi Supabase sunucunuza ve kendi Gemini API key'inize taşımak için gereken her şeyi içerir.

## Paket İçeriği

```
migration-bundle/
├── supabase/
│   ├── migrations/        # 20 adet sıralı migration (Lovable'da uygulananlar)
│   ├── functions/         # 3 edge function (diaspora-search, relocation-chat, whatsapp-bot-lookup)
│   └── config.toml
├── full_schema.sql        # Mevcut DB'nin tam schema dump'ı (tek dosya, hızlı kurulum için)
├── seed_data.sql          # Mevcut public şemadaki tüm veri
└── README_MIGRATION.md
```

## Migration Adımları

### 1. Yeni Supabase Projesi Hazırlığı
- supabase.com → New Project (kendi org'unuzda)
- Project Ref ve DB password not edin
- Anon key + Service role key + JWT secret'ı kaydedin

### 2. Database Schema
İki seçenek:
**A) Tek seferde (önerilen):** `psql "$NEW_DB_URL" -f full_schema.sql` ardından `psql "$NEW_DB_URL" -f seed_data.sql`
**B) Sıralı:** `supabase/migrations/` içindeki dosyaları sırayla `supabase db push` ile uygula

### 3. Storage Buckets
Yeni projede manuel oluştur:
- `service-attachments` (public)
- `interest-uploads` (private)

### 4. Auth Configuration
- Email/Password aktif
- Google OAuth provider ekle (Client ID + Secret kendi GCP'nizden)
- Site URL + Redirect URL'leri yeni domain'inize ayarla
- (İstersen) Auto-confirm email = OFF, HIBP password check = ON

### 5. Edge Functions Deployment
```bash
supabase link --project-ref YENI_REF
supabase functions deploy diaspora-search
supabase functions deploy relocation-chat
supabase functions deploy whatsapp-bot-lookup
```

### 6. Secrets (Edge Function Env)
Kendi sunucunuzda set edilmeli:
```bash
supabase secrets set GEMINI_API_KEY=<KENDI_GEMINI_KEYINIZ>
supabase secrets set SUPABASE_URL=<YENI_URL>
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<YENI_SERVICE_KEY>
supabase secrets set SUPABASE_ANON_KEY=<YENI_ANON_KEY>
```

> **Önemli:** Kod halen `LOVABLE_API_KEY` çağırıyor olabilir. Migration sırasında edge function'larda
> `LOVABLE_API_KEY` → `GEMINI_API_KEY` ve `https://ai.gateway.lovable.dev/v1/chat/completions`
> → `https://generativelanguage.googleapis.com/v1beta/...` (veya OpenAI uyumlu kendi gateway'iniz) olarak
> değiştirilmelidir. Bunu kod tarafında ayrı bir PR olarak yapmak en temiz yol.

### 7. Frontend `.env`
```
VITE_SUPABASE_URL=https://<YENI_REF>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<YENI_ANON_KEY>
VITE_SUPABASE_PROJECT_ID=<YENI_REF>
```

### 8. `src/integrations/supabase/types.ts`
Yeni projede şunu çalıştırarak yeniden üret:
```bash
supabase gen types typescript --project-id YENI_REF > src/integrations/supabase/types.ts
```

### 9. Doğrulama Checklist
- [ ] Login / Signup çalışıyor (email + Google)
- [ ] RLS policy'leri aktif (kullanıcı sadece kendi verisini görüyor)
- [ ] Notifications trigger'ları çalışıyor (yeni service_request → consultant'a notification)
- [ ] Storage upload (service-attachments, interest-uploads) çalışıyor
- [ ] Edge functions 200 dönüyor + Gemini cevabı geliyor
- [ ] WhatsApp landings akışı (insert → admin notification)
