# Supabase Custom Domain — Google OAuth Ekranını Markalama

> **Not:** CLAUDE.md kuralı yüzünden root'a değil `docs/operations/` altına yazıldı —
> root'ta yalnız `CLAUDE.md`, `AGENT_CONTEXT.md`, `ARCHITECTURE.md`, `rapor.html` durur.

## Neden

Google ile giriş yapan üyeler onay ekranında `injprdrsklkxgnaiixzh.supabase.co uygulamasında
oturum açın` görüyor — çirkin ve güven vermiyor. Sebep: Google, OAuth "app name" düzgün
markalanmamışsa callback URL'in domain'ini gösteriyor; bizim callback'imiz Supabase'in çıplak
proje adresi. Kalıcı çözüm: Supabase'in **Custom Domain** (Pro üzeri ayrı ücretli add-on)
özelliğiyle kendi alt domainimizi (örn. `auth.corteqs.net`) Supabase gateway'in önüne koymak.

**Kapsam:** Bu değişiklik yalnız Auth'u değil, projenin TÜM API gateway'ini (REST/Storage/
Realtime/Auth) yeni domain üzerinden geçirir. Kod tarafında hiçbir değişiklik gerekmiyor —
`src/integrations/supabase/client.ts` sabit URL değil `VITE_SUPABASE_URL` env değişkenini okuyor.

**Açık karar:** Subdomain adı henüz seçilmedi — öneri `auth.corteqs.net`, alternatif
`login.corteqs.net` olabilir. Adım 3'ten önce netleştir.

## Adımlar

### 0) Custom Domain add-on'unu aç
Pro plana dahil DEĞİL, ayrı ücretli add-on. Dashboard → proje → **Settings → Add-ons** →
"Custom Domain" → etkinleştir. Bu açılmadan CLI komutları çalışmaz.

### 1) CLI'ı hazırla
```bash
supabase --version        # güncel değilse güncelle
supabase login            # tarayıcıda açılan sayfadan onayla
```
CLI'da oturum açan hesabın projede **Owner veya Admin** yetkisi olmalı.

### 2) DNS — CNAME kaydı ekle
Domain'in DNS panelinde (Cloudflare/Namecheap/hangisiyse):
```
auth.corteqs.net.   CNAME   injprdrsklkxgnaiixzh.supabase.co.
```
TTL düşük tut (ör. 300s) — geri almak gerekirse hızlı olsun.

### 3) Domain'i Supabase'e kaydet
```bash
supabase domains create --project-ref injprdrsklkxgnaiixzh --custom-hostname auth.corteqs.net
```
Komut bir **TXT kaydı** döndürür, örn:
```
_acme-challenge.auth.corteqs.net.   TXT   ca3-xxxxxxxxxxxxxxxxxxxxxxxxxxx
```
Bunu da DNS paneline ekle (bazı panellerde domain adı otomatik sona ekleniyor — çift
`.corteqs.net.corteqs.net` olmasın diye kontrol et).

### 4) DNS yayılmasını doğrula
```bash
dig CNAME auth.corteqs.net
dig TXT _acme-challenge.auth.corteqs.net
```
İkisi de doğru değeri dönene kadar bekle (dakikalar-saatler, registrar'a bağlı).

### 5) Supabase'e doğrulat
```bash
supabase domains reverify --project-ref injprdrsklkxgnaiixzh
```
DNS henüz yayılmadıysa hata verir — birkaç dakika sonra tekrar dene.

### 6) Aktive et
```bash
supabase domains activate --project-ref injprdrsklkxgnaiixzh
```
SSL sertifikası çıkması **30 dk'ya kadar** sürebilir. **Güvence (Supabase resmi doküman):**
projenin eski `.supabase.co` adresi bu adımdan sonra da çalışmaya devam eder — kesinti yok,
istediğin an güvenle yapılabilir.

### 7) Google Cloud Console — doğru Client ID'yi bul, callback ekle
- Supabase Dashboard → **Authentication → Providers → Google** → Client ID'yi not al.
- console.cloud.google.com → doğru proje → **APIs & Services → Credentials**
- **OAuth 2.0 Client IDs** listesinde eşleşen kaydı aç
- **Authorized redirect URIs** → **ADD URI** → `https://auth.corteqs.net/auth/v1/callback` → **SAVE**
- Eski `https://injprdrsklkxgnaiixzh.supabase.co/auth/v1/callback` satırını **SİLME** — geçiş
  bitene kadar ikisi de dursun.

### 8) Supabase Auth URL Configuration'a bak (muhtemelen değişmeyecek)
Dashboard → Authentication → **URL Configuration** → Site URL / Redirect URLs zaten
`corteqs.net` olmalı (bizim domain, Supabase domain'i değil). Sadece göz gezdir.

### 9) Coolify — asıl anahtar adım
`VITE_SUPABASE_URL`:
```
https://injprdrsklkxgnaiixzh.supabase.co  →  https://auth.corteqs.net
```
Değiştir, **deploy et**. Kod değişmiyor, sadece bu env değişkeni.

### 10) Test et
- Gizli sekmede corteqs.net → Google ile giriş dene → ekranda `auth.corteqs.net'te oturum
  açın` görünmeli.
- E-posta/şifre ile de giriş dene, veriler normal yükleniyor mu kontrol et (REST/Storage/
  Realtime'ın da yeni domain üzerinden sorunsuz çalıştığının kanıtı).

### 11) Geri alma planı
Sorun çıkarsa: Coolify'daki `VITE_SUPABASE_URL`'i eski `.supabase.co` adresine geri çevir,
deploy et. Eski adres hiç durmadığı için anında düzelir.

### 12) Temizlik (birkaç gün sorunsuz çalıştıktan sonra, opsiyonel)
Google Console'daki eski redirect URI'yi silebilirsin — zorunlu değil.

## Kim Ne Yapıyor

| Adım | Kim |
|---|---|
| 0, 2, 4 (DNS panel) | Kullanıcı |
| 1, 3, 5, 6 (CLI) | Kullanıcı ya da onay sonrası Claude (DB/CLI erişimi var) |
| 7 (Google Console) | Kullanıcı |
| 8 (kontrol) | Kullanıcı ya da Claude |
| 9 (Coolify) | Kullanıcı (Claude'un Coolify erişimi yok) |
| 10 (test) | Birlikte |
