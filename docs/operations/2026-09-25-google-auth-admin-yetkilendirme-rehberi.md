# Google Auth + Admin Yetkilendirme Rehberi — Burak'a Sunum Özeti

> **m24:** Google Auth ve admin paneli yetkilendirme rehberi hazırlanıp Burak'a iletilecek.

## Mevcut Durum

İki ayrı rehber hazır, Burak'a sunulmayı bekliyor:

### 1. Google OAuth Custom Domain Rehberi
**Dosya:** `docs/operations/2026-08-02-supabase-custom-domain-google-oauth.md`

**Sorun:** Google ile giriş yapan üyeler onay ekranında `injprdrsklkxgnaiixzh.supabase.co uygulamasında oturum açın` görüyor — çirkin ve güven vermiyor.

**Çözüm:** Supabase Custom Domain add-on ile `auth.corteqs.net` (öneri) alt domainini Supabase gateway'in önüne koymak.

**Adımlar (özet):**
1. Custom Domain add-on aç (ücretli)
2. DNS CNAME kaydı ekle (`auth.corteqs.net` → Supabase)
3. Domain'i Supabase'e kaydet + doğrula
4. Google Cloud Console'da yeni callback URI ekle
5. Coolify'da `VITE_SUPABASE_URL` değiştir
6. Test et

**Durum:** Hiçbir adım başlamadı. Add-on bile açılmadı.

**Detay:** Rehber dosyasında 11 adım + geri alma planı var.

---

### 2. Admin Panel Yetkilendirme Rehberi
**Dosya:** `src/assets/docs/yetkilendirme-rehberi.html` (1167 satır, standalone HTML)

**İçerik:**
- Kategori-Rol-Feature sistemi
- Karar ağacı (hangi rol hangi özelliklere erişebilir)
- Claim sistemi
- Rol bazlı izin matrisi

**Son güncelleme:** 2026-06-04

**Durum:** Rehber hazır, güncel mi kontrol edilmeli.

---

## Burak'a Sunulacak Kararlar

### Karar 1: Google Auth Custom Domain
- **Subdomain adı:** `auth.corteqs.net` (öneri) veya `login.corteqs.net`
- **Maliyet:** Supabase Pro plan + Custom Domain add-on (ayrı ücret)
- **Zaman:** DNS yayılması + SSL sertifikası = 30 dk - birkaç saat
- **Risk:** Yok — eski adres geçiş boyunca çalışmaya devam eder

### Karar 2: Admin Yetkilendirme Rehberi
- Mevcut rehber güncellensin mi? (2026-06-04'ten beri değişen bir şey var mı?)
- Burak'a hangi formatta sunulacak? (HTML dosyası mı, özet mi?)

---

## Önerilen Aksiyonlar

1. **Google Auth:** Custom Domain add-on aç → DNS → Google Console → Coolify deploy → test
2. **Admin Yetkilendirme:** Mevcut HTML rehberi Burak'a ilet, güncelleme gerekip gerekmediğini sor

---

## İlgili Dosyalar

| Dosya | Açıklama |
|-------|----------|
| `docs/operations/2026-08-02-supabase-custom-domain-google-oauth.md` | Google OAuth custom domain rehberi (11 adım) |
| `src/assets/docs/yetkilendirme-rehberi.html` | Admin yetkilendirme tam rehberi (HTML) |
| `src/assets/docs/yetkilendirme-basit-rehberi.html` | Basitleştirilmiş versiyon |
| `src/lib/admin-shell/admin-todos.ts:60-71` | "Google giriş ekranındaki çirkin adresi düzelt" todo'su |

---

## Workshop m24 Durumu

**Başlık:** "Google Auth ve admin paneli yetkilendirme rehberi hazırlanıp Burak'a iletilecek."

**Durum:** Rehberler hazır, Burak'a sunum bekleniyor.

**Engel:** Subdomain adı ve custom domain add-on maliyeti için karar gerekli.
