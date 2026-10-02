# CorteQS Kariyer Sayfası — Entegrasyon Notu (Barış için)

**Dosyalar**

- `kariyer.html` — tek dosya, kendi içinde tam sayfa (giriş metni, kurucu fotoğrafları, 17 ilan, stajyer programı, başvuru formu). Fotoğraflar dosyanın içine gömülü.
- `kariyer_supabase_setup.sql` — başvuru tablosu, RLS politikaları ve özel dosya kovası.

## 1. Canlıya alma (en hızlı yol)

1. `kariyer_supabase_setup.sql` dosyasını Supabase SQL Editor'de çalıştır. Mevcut `has_role` fonksiyonunu kullanıyor; admin rol adı farklıysa `'admin'` değerini değiştir.
2. `kariyer.html` içinde en alttaki `CONFIG` bloğuna proje URL'sini ve **anon** key'i gir. Service key asla bu dosyaya girmemeli.
3. Dosyayı `corteqs.net/kariyer` altında yayınla (Lovable projesinde `public/kariyer.html` olarak koyup route'u yönlendirmek yeterli). CONFIG doluysa sayfadaki "önizleme modu" notu kendiliğinden kaybolur.

## 2. Ne oluyor?

- Aday CV (zorunlu), ön yazı ve sunum (isteğe bağlı) yükler. Dosyalar `career-applications/{başvuru-id}/cv-…` yoluna gider.
- Ardından `career_applications` tablosuna tek satır eklenir. Anon kullanıcı ne tabloyu ne dosyaları okuyabilir.
- Tarayıcı tarafında tür ve boyut kontrolü var (CV ve ön yazı 10 MB, sunum 25 MB); kova tarafında da 25 MB ve MIME sınırı var.

## 3. Önerilen sonraki adımlar

- **Bildirim:** `career_applications` için bir Database Webhook ya da mevcut `send-message-notification` edge function'ı ile yeni başvuruda ekibe e-posta/Slack bildirimi.
- **Admin ekranı:** `/admin` altına "Başvurular" sekmesi: pozisyon filtresi, `status` güncelleme (yeni → inceleniyor → görüşme → teklif/olumsuz), dosyalar için `createSignedUrl` ile geçici link.
- **Spam koruması:** Cloudflare Turnstile veya hCaptcha; ya da insert'i bir edge function arkasına alıp IP bazlı hız sınırı.
- **React'e taşıma:** Sayfa React bileşenine çevrilecekse ilan verisi (`JOBS`, `INTERN`) zaten JSON; doğrudan bir `careers.ts` dosyasına taşınabilir.

## 4. Kontrol edilecekler

- KVKK ve Gizlilik linkleri `/legal/kvkk` ve `/legal/privacy` olarak varsayıldı; gerçek yolları kontrol et.
- Yazı tipleri Google Fonts'tan yükleniyor (Bricolage Grotesque, Source Serif 4); site genelindeki font tercihine göre değiştirilebilir.
