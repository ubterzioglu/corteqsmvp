# W04-W06 Kullanıcı Adımları — WhatsApp Bot Kurulumu

> **Tarih:** 5 Ekim 2026  
> **Durum:** W04-W06 kod tarafı TAMAM, ancak sırlar ve deploy bekleniyor

## Özet

WhatsApp otomatik yanıt botu kodlandı:
- **W04:** Bot altyapısı (migration, RPC fonksiyonları, ayar tablosu)
- **W05:** Autoreply edge function (Gemini RAG, rate limiting, handover)
- **W06:** Webhook entegrasyonu (whatsapp-webhook → whatsapp-autoreply)

**Ancak bot devre dışı** (`enabled=false`) ve sırlar eksik. Aşağıdaki adımları tamamlamanız gerekiyor.

---

## U09 — Meta/WhatsApp Sırları (5 adet)

### Adım 1: Meta Business Portal'a Giriş Yap

1. https://business.facebook.com → **System Users** → **Admin** yetkili kullanıcı
2. **WhatsApp** → **API Setup** → **Permanent Token** oluştur

⚠️ **ÖNEMLİ:** 24 saatlik test token'ı KULLANMAYIN — bot ertesi gün sessizce susar.

### Adım 2: 5 Secret'ı Supabase'e Gir

Supabase Dashboard → Project Settings → Secrets:

| Secret | Nerede Bulunur |
|--------|----------------|
| `WHATSAPP_ACCESS_TOKEN` | Meta Business → System User → Permanent Token |
| `WHATSAPP_APP_SECRET` | Meta App Dashboard → Settings → Basic |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp → API Setup → Phone Number ID |
| `WHATSAPP_VERIFY_TOKEN` | Kendiniz belirleyin (webhook doğrulama için, rastgele string) |
| `WHATSAPP_GRAPH_API_VERSION` | `v18.0` (veya en güncel sürüm) |

### Adım 3: Webhook URL'i Meta'ya Bildir

Supabase Edge Function URL:
```
https://<project-ref>.supabase.co/functions/v1/whatsapp-webhook
```

Meta Business → WhatsApp → Webhook:
1. **Callback URL** yukarıdaki URL
2. **Verify Token** = `WHATSAPP_VERIFY_TOKEN` (adım 2'de belirlediğiniz)
3. **Subscribe** → `messages` events

---

## Deploy — Edge Functions

### Adım 4: Edge Function'ları Deploy Et

```bash
# whatsapp-autoreply (yeni)
npx supabase functions deploy whatsapp-autoreply --project-ref injprdrsklkxgnaiixzh

# whatsapp-webhook (güncellendi)
npx supabase functions deploy whatsapp-webhook --project-ref injprdrsklkxgnaiixzh
```

### Adım 5: verify_jwt Kontrolü

Deploy sonrası kontrol:
```bash
# whatsapp-autoreply: verify_jwt=false olmalı
# whatsapp-webhook: verify_jwt=false olmalı (değişmedi)
```

Supabase Dashboard → Edge Functions → [function] → Settings → Verify JWT

---

## Test — Uçtan Uca

### Adım 6: Bot'u Aktif Et

⚠️ **DİKKAT:** Bu adımı yapmadan önce U09 sırlarının doğru girildiğinden emin olun.

```sql
-- Supabase SQL Editor'da çalıştır
UPDATE whatsapp_bot_settings
SET enabled = true,
    updated_at = now(),
    updated_by = auth.uid()
WHERE id = true;
```

### Adım 7: Test Senaryoları

**Senaryo 1: Basit soru**
- WhatsApp'tan bot'a mesaj gönder: "Merhaba"
- Beklenen: Bot yanıt verir (RAG search + Gemini)

**Senaryo 2: Handover keyword**
- Mesaj: "İnsan temsilci istiyorum"
- Beklenen: Bot yanıt vermez, thread `bot_handed_over_at` set edilir, status=`in_progress`

**Senaryo 3: 24 saat dışı**
- 24 saat bekleyin (veya `last_inbound_at`'i manuel güncelleyin)
- Mesaj gönderin
- Beklenen: Bot template kullanmak zorunda (şablon yoksa yanıt vermez)

**Senaryo 4: Rate limit**
- Aynı numaradan 10+ mesaj gönderin (günlük limit)
- Beklenen: 11. mesajdan sonra bot yanıt vermez

**Senaryo 5: Handover sonrası**
- Bir thread'de handover yapın (senaryo 2)
- Aynı thread'de yeni mesaj gönderin
- Beklenen: Bot yanıt vermez (thread handed over)

### Adım 8: Log Kontrolü

Supabase Dashboard → Edge Functions → Logs:
- `whatsapp-webhook`: inbound_message event'leri görünmeli
- `whatsapp-autoreply`: her event için log (success/skipped/error)

---

## Geri Alma Planı

Bot'u devre dışı bırakmak:
```sql
UPDATE whatsapp_bot_settings
SET enabled = false,
    updated_at = now(),
    updated_by = auth.uid()
WHERE id = true;
```

Bu SQL çalıştırıldıktan sonra bot hiçbir mesaja yanıt vermez (redeploy gerektirmez).

---

## Bilinen Sınırlamalar

1. **Dar korpus:** Yalnız `blog` (91 belge) public. `catalog` ve `docs-member` member-only, `docs-admin` admin-only → bot bunlara erişemez.

2. **Model kalitesi:** Gemini 2.0 Flash kullanılıyor. Yanıt kalitesi test edilmedi (U09 sırları gerekli).

3. **Rate limiting:** Günlük 10 mesaj/sender (ajan ihtiyatı). Kullanıcı teyidi bekleniyor.

4. **Handover keywords:** `["insan", "temsilci", "yetkili"]` — Türkçe, sabit liste.

---

## Kanıtlanamayanlar

- ❌ Gerçek Meta webhook davranışı (U09 sırları gerekli)
- ❌ Gerçek model yanıt kalitesi (GEMINI_API_KEY gerekli)
- ❌ Uçtan uca akış (tüm sırlar + deploy gerekli)

---

## Commit Hash'leri

```
ac9d5ec7 feat(W04): WhatsApp bot foundation - migration + acceptance test
b2fdc356 feat(W05): WhatsApp autoreply edge function + shared logic
a5888025 feat(W06): WhatsApp webhook triggers autoreply
```

---

**Sonraki adım:** U09 sırlarını girin, deploy edin, test edin. Sorun olursa loglara bakın.
