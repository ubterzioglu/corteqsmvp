# Etkinlik Modülü Planı

### Batch 0a — Commit durumu ✅
- Events commit'lerini kontrol et.
**Çıkış:** `d276f3f` devir notu, `4e65a01` timezone migration uygulandı.

### Batch 0b — Migration durumu ✅
- Migration klasörlerini kontrol et.
**Çıkış:** `applied/20260920140000_events_timezone.sql` — canlıya uygulandı, pending yok.

### Batch 1 — Üretim deploy'u ⏳
- Coolify deploy'u başlat; build/nginx loglarını kontrol et.
**Çıkış:** Events üretimde yayınlandı.
**Durum:** Manuel işlem — kullanıcı yapacak.

### Batch 2a — Form timezone QA (saat gir, timezone seçme) 🔒
- Saat girip timezone seçmeden gönderimi test et.
**Durum:** Auth gerektiriyor — test hesabı gerekli.

### Batch 2b — Form timezone QA (saat girmeden) 🔒
- Saat girmeden gönderimi test et.
**Durum:** Auth gerektiriyor — test hesabı gerekli.

### Batch 2c — Form timezone QA (online etkinlik) 🔒
- Online etkinlikte timezone alanını kontrol et.
**Durum:** Auth gerektiriyor — test hesabı gerekli.

### Batch 3 — Varsayılan timezone QA 🔒
- Berlin tarayıcısında varsayılan timezone'u doğrula.
**Durum:** Auth gerektiriyor — test hesabı gerekli.

### Batch 4a — Detay saat QA (yerel saat) 🔒
- Yerel saat gösterimini test et.
**Durum:** Auth gerektiriyor — test hesabı gerekli.

### Batch 4b — Detay saat QA (farklı timezone) 🔒
- Farklı timezone gösterimini test et.
**Durum:** Auth gerektiriyor — test hesabı gerekli.

### Batch 4c — Detay saat QA (gün kayması) 🔒
- Gün kayması test et.
**Durum:** Auth gerektiriyor — test hesabı gerekli.

### Batch 5 — Onay durumu QA 🔒
- Onay bekleyen etkinlikte paylaşım kilidini doğrula.
**Durum:** Auth gerektiriyor — test hesabı gerekli.

### Batch 6a — Liste QA (paylaşım menüsü) 🔒
- Paylaşım menüsünü test et.
**Durum:** Auth gerektiriyor — test hesabı gerekli.

### Batch 6b — Liste QA (timezone etiketi) 🔒
- Timezone etiketini test et.
**Durum:** Auth gerektiriyor — test hesabı gerekli.

### Batch 6c — Liste QA (virgüllü arama) 🔒
- Virgüllü aramayı test et.
**Durum:** Auth gerektiriyor — test hesabı gerekli.

### Batch 7a — Profil QA (normal üye) 🔒
- Normal üye "Etkinliklerim" panelini test et.
**Durum:** Auth gerektiriyor — test hesabı gerekli.

### Batch 7b — Profil QA (premium pilot) 🔒
- Premium pilot "Etkinliklerim" panelini test et.
**Durum:** Auth gerektiriyor — test hesabı gerekli.

### Batch 8a — Admin QA (tarihler) 🔒
- `/admin/events` tarihlerini kontrol et.
**Durum:** Auth gerektiriyor — admin hesabı gerekli.

### Batch 8b — Admin QA (durum rozetleri) 🔒
- `/admin/events` durum rozetlerini kontrol et.
**Durum:** Auth gerektiriyor — admin hesabı gerekli.
