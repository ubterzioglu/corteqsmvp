# §B1 — Secret Rotasyonu + Git Geçmişi Temizliği (SONRA YAPILACAK)

> **Durum:** ⏸️ SONRA YAPILACAK — 6 Ekim 2026
> **Öncelik:** 🔴 EN ACİL (KVKK/GDPR ihlali riski)
> **Tahmini süre:** 2-4 saat + GitHub Support yanıt süresi
> **Gerekli erişim:** GitHub repo ayarları, Supabase dashboard, Coolify paneli, e-posta hesabı

---

## Özet

Repo **public** iken `.env.local` (service_role key, DB parolası, WhatsApp token, vs.) git geçmişine düşmüş (commit `52e6faf4`, 2026-05-30). Bu dosya `refs/original/refs/heads/main` ve `refs/original/refs/stash` altında hâlâ var.

**Risk:** Repoyu klonlayan herkes üyelerin kişisel verisini alır (KVKK/GDPR ihlali); SCRAM verifier'ları çevrimdışı kırılabilir; iptal edilmemiş refresh token'lar oturum verir; bcrypt hash'ler kırılabilir.

---

## Adımlar (Sıralı)

### 1. Repoyu Private Yap
**GitHub UI:**
- `https://github.com/ubterzioglu/corteqsmvp/settings` → **Danger Zone** → **Change repository visibility**
- **Private** seç → Onayla

**Doğrulama:**
```bash
gh repo view ubterzioglu/corteqsmvp --json visibility
# Beklenen: "visibility": "private"
```

**Uyarı:** Bu adım geri alınamaz. Public → Private dönüşü GitHub audit log'da görünür.

---

### 2. Tüm Secret'ları Döndür

#### 2.1 Supabase Service Role Key
**Supabase Dashboard:**
- `Project Settings` → `API` → `Service Role Key` → **Reset**
- Yeni key: `sb_secret_...` (64 karakter)

**Güncellenecek yerler:**
- Supabase Edge Functions env vars (Coolify paneli)
- Yerel `.env.local` (diskten sil, yeniden oluştur)
- CI/CD secrets (GitHub Actions → Settings → Secrets)

#### 2.2 Supabase DB Parolası
**Supabase Dashboard:**
- `Project Settings` → `Database` → `Reset database password`
- Yeni parolayı oluştur (32+ karakter, rastgele)

**Güncellenecek yerler:**
- `SUPABASE_DB_URL` (Coolify env vars)
- Yerel `.env.local`

#### 2.3 Auth Refresh Tokens + Sessions Temizle
**Supabase SQL Editor:**
```sql
-- Tüm oturumları kapat (kullanıcılar yeniden giriş yapacak)
BEGIN;
DELETE FROM auth.refresh_tokens;
DELETE FROM auth.sessions;
COMMIT;
```

**Uyarı:** Bu işlem tüm aktif kullanıcıları çıkış yaptıracak. Duyuru yap: "Sistem bakımı, yeniden giriş yapın."

#### 2.4 Dump'taki 5 Kullanıcıya Parola Sıfırlama
**Supabase SQL Editor:**
```sql
-- Dump'ta şifresi sızan 5 kullanıcıyı bul (docs/archive/backups/20260520_085229/database.sql)
-- Örnek: email IN ('user1@example.com', 'user2@example.com', ...)
-- Gerçek listeyi dump dosyasından çıkar, buraya yapıştır.

SELECT id, email FROM auth.users
WHERE email IN (
  -- BURAYA 5 KULLANICI EMAIL'İ
);
```

**Parola sıfırlama maili gönder:**
```sql
-- Supabase Auth API ile (veya dashboard'dan manuel)
-- Her kullanıcı için:
SELECT auth.send_reset_password_email('user@example.com');
```

**Alternatif:** Dashboard → Authentication → Users → "Send reset password email" (tek tek)

#### 2.5 Diğer Secret'lar
**GitHub Secrets:**
- `SUPABASE_ACCESS_TOKEN` → Supabase Dashboard → Account → Access Tokens → Yeni token
- `SUPABASE_ACCESS_TOKEN_BACKUP` → Aynı
- `WHATSAPP_APP_SECRET` → WhatsApp Business API → Yeni secret
- `RAG_API_SECRET` → RAG servisi → Yeni secret
- `VITE_ADMIN_PASSWORD` → Yeni güçlü parola

**Coolify Paneli:**
- Tüm env vars'ları güncelle (yukarıdaki yeni değerlerle)

---

### 3. Git Geçmişini Temizle

#### 3.1 Backup Dizinini Geçmişten Çıkar
```bash
# git-filter-repo kurulu mu kontrol et
pip install git-filter-repo

# docs/archive/backups dizinini geçmişten çıkar
git filter-repo --path docs/archive/backups --invert-paths --force

# Tüm dallar ve etiketler için
git filter-repo --path docs/archive/backups --invert-paths --force --tag-references all
```

**Uyarı:** Bu işlem tüm commit hash'lerini değiştirir. Force-push gerekecek.

#### 3.2 Yerel Ref'leri Temizle
```bash
# filter-repo'un yarattığı backup ref'lerini sil
git update-ref -d refs/original/refs/heads/main
git update-ref -d refs/original/refs/stash

# Reflog'u temizle
git reflog expire --expire=now --all

# Çöp toplayıcıyı çalıştır (tüm objeleri sil)
git gc --prune=now --aggressive
```

#### 3.3 Force-Push
```bash
# Tüm dalları force-push
git push --force --all

# Tüm etiketleri force-push
git push --force --tags
```

**Uyarı:** Bu işlem geri alınamaz. Diğer geliştiricilerin local repo'larını sıfırlaması gerekecek.

---

### 4. GitHub Support'tan Cache Temizliği

**GitHub Support Form:**
- `https://support.github.com/contact`
- Konu: "Remove sensitive data from repository cache"
- Açıklama:
  ```
  We accidentally committed sensitive data (.env.local with database credentials) 
  to our repository. We've used git-filter-repo to remove it from history and 
  force-pushed. Please purge all caches and archived versions of the repository.
  
  Repository: ubterzioglu/corteqsmvp
  Commit: 52e6faf4 (2026-05-30)
  Files: docs/archive/backups/**
  ```

**Bekleme süresi:** 24-72 saat

---

### 5. KVKK/GDPR Bildirim Değerlendirmesi

**Hukuki danışmanlık al:**
- Sızan veriler: `auth.users` (email, şifre hash'leri), `public.submissions` (ad, e-posta, telefon)
- Etkilenen kullanıcı sayısı: ~5 (dump'taki aktif kullanıcılar)
- Bildirim yükümlülüğü: KVKK (Türkiye) + GDPR (AB) — 72 saat içinde bildirim gerekebilir

**Olası aksiyonlar:**
1. **Düşük risk:** Yalnızca etkilenen 5 kullanıcıya bildirim (özel e-posta)
2. **Orta risk:** Tüm kullanıcılara genel duyuru + parola sıfırlama zorunluluğu
3. **Yüksek risk:** KVKK'ya resmi bildirim + GDPR için Data Protection Authority'ye

**Öneri:** Hukuki danışmanla görüş, "düşük risk" senaryosunu uygula (yalnızca 5 kullanıcı).

---

## Doğrulama

### 5.1 Geçmiş Temizlendi mi?
```bash
# .env.local veya docs/archive/backups geçmişte var mı?
git log --all --full-history --source -- docs/archive/backups
# Beklenen: (boş çıktı)

git log --all --full-history --source -- .env.local
# Beklenen: (boş çıktı)
```

### 5.2 Secret'lar Döndürüldü mü?
```bash
# Yeni service_role key çalışıyor mu?
curl -X POST "https://<project>.supabase.co/rest/v1/rpc/is_admin" \
  -H "apikey: <YENI_SERVICE_ROLE_KEY>" \
  -H "Authorization: Bearer <YENI_SERVICE_ROLE_KEY>" \
  -d '{"p_user_id": "test-uuid"}'
# Beklenen: 200 OK veya 401 (test-uuid yoksa)

# Eski key reddediliyor mu?
curl -X POST "https://<project>.supabase.co/rest/v1/rpc/is_admin" \
  -H "apikey: <ESKI_SERVICE_ROLE_KEY>" \
  -H "Authorization: Bearer <ESKI_SERVICE_ROLE_KEY>" \
  -d '{"p_user_id": "test-uuid"}'
# Beklenen: 401 Unauthorized
```

### 5.3 Repo Private mı?
```bash
gh repo view ubterzioglu/corteqsmvp --json visibility
# Beklenen: "visibility": "private"
```

---

## Riskler ve Uyarılar

| Risk | Etki | Azaltma |
|---|---|---|
| Force-push diğer geliştiricileri bozar | Local repo'larını sıfırlamaları gerekir | Duyuru yap, dokümantasyon hazırla |
| GitHub cache temizliği 72 saat sürer | Bu süre içinde sızan veriler erişilebilir olabilir | Repo private yapıldıktan sonra risk düşük |
| KVKK/GDPR bildirimi | Yasal yükümlülük | Hukuki danışmanla görüş |
| Tüm kullanıcılar çıkış yapacak | Kullanıcı deneyimi bozulur | Duyuru yap, bakım penceresi belirle |

---

## Zaman Çizelgesi

| Adım | Süre | Bağımlılık |
|---|---|---|
| 1. Repo private yap | 5 dakika | — |
| 2. Secret'ları döndür | 1-2 saat | Adım 1 |
| 3. Git geçmişi temizle | 30 dakika | Adım 1 |
| 4. GitHub Support cache temizliği | 24-72 saat | Adım 3 |
| 5. KVKK/GDPR değerlendirmesi | 1-2 gün | Hukuki danışman |

**Toplam:** 2-4 saat aktif çalışma + 1-3 gün bekleme

---

## İlgili Dosyalar

- `docs/security/SECURITY_AUDIT.md` — S1, S4 bulguları
- `docs/security/ilerleme.md` — Başlangıç kapı değerleri
- `docs/plans/2026-10-05-kalan-seo-geo-guvenlik-plani.md` — §B1 referansı

---

## Son Güncelleme

- **6 Ekim 2026:** Plan oluşturuldu, "SONRA YAPILACAK" olarak işaretlendi
- **Neden ertelendi:** Diğer işler tamamlandı (§A, §B2-B9), bu iş bağımsız ve acil ama zaman alıcı
