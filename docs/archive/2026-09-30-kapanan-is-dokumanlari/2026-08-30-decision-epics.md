# Karar Bekleyen Epic'ler — Uygulanabilir İlk Batch'ler

Bu kartlar kodlama yetkisi değil, belirsiz toplantı notlarını uygulanabilir işe dönüştürür.

## 1. Jukebox ayrı modülü

- Durum: **insan onayı/senaryo bekliyor**.
- Amaç: Cafe deneyimine sonradan gömülebilen, bağımsız deploy edilebilir müzik modülü.
- Bağımlılıklar: Burak'ın dinleyici/işletme/admin senaryoları; müzik kataloğu kaynağı; ticari çalma lisansı; CorBot/Jukebox IP sözleşmesi.
- Kabul: Yetkisiz playback yok; sağlayıcı token'ı client'ta değil; oda başına sıra ve moderasyon; embed kapalıyken Cafe etkilenmez.
- İlk batch: Kod yazmadan 5 senaryo kararı — kim parça ekler, kim atlar, sıra ne kadar sürer, Spotify embed mi metadata mı, ticari mekânda lisans sorumlusu kim?
- Go/no-go: Senaryolar ve lisans sahibi yazılı onaylanmadan entegrasyon başlamaz.

## 2. Cadde video paylaşımı

- Durum: **teknik bağımlılık bekliyor**.
- Amaç: Gönderi içinde kontrollü kısa video gösterimi.
- Bağımlılıklar: Depolama/CDN bütçesi, transcoding servisi, süre/boyut limitleri, moderasyon ve telif politikası.
- Kabul: MIME/magic-byte doğrulama; virüs tarama; poster frame; adaptif çıktı; private upload + signed processing; raporlama/silme; kota/rate limit.
- İlk batch: 30–60 sn, 100 MB kaynak, MP4/H.264 tek formatlı kapalı pilot; 10 test videosuyla maliyet ve işlem süresi ölçümü.
- Go/no-go: Aylık depolama+egress üst sınırı ve moderasyon SLA'sı olmadan public upload açılmaz.

## 3. Cadde auto-refresh

- Durum: **hazır; performans ölçümüyle başlanabilir**.
- Amaç: Yeni post/yorum geldiğinde tüm sayfayı yenilemeden yalnız ilgili alanı güncellemek.
- Bağımlılıklar: Realtime kanal kapasitesi, görünür tab kontrolü, query invalidation sözleşmesi.
- Kabul: Kendi optimistic kaydı duplicate olmaz; görünmeyen tab gereksiz trafik üretmez; bağlantı kopunca ölçülü polling fallback; scroll konumu korunur.
- İlk batch: Yalnız açık postun yorumları; 15 sn polling, Page Visibility ile durdurma, ETag/timestamp delta ve 2 kullanıcı E2E.
- Go/no-go: 100 eşzamanlı session ölçümünde sorgu/egress bütçesi aşılırsa interval uzatılır veya Realtime pilotuna geçilir.

## 4. Google/Supabase OAuth branding

- Durum: **insan hesabı/DNS erişimi bekliyor**.
- Amaç: Giriş ve consent ekranlarında CorteQS adı, logo ve doğrulanmış alan adını göstermek.
- Bağımlılıklar: Google Cloud OAuth console sahibi, Supabase custom domain/DNS, privacy/terms URL'leri, logo asset onayı.
- Kabul: `auth.corteqs.net` veya onaylı alan; doğru redirect URI; CorteQS publisher/branding; test ve prod client ayrımı; Google login/logout/refresh E2E.
- İlk batch: `docs/operations/2026-08-02-supabase-custom-domain-google-oauth.md` kontrol listesiyle erişim ve DNS envanteri; değişiklik yapmadan ekran görüntülü mevcut durum kanıtı.
- Go/no-go: DNS rollback ve hesap sahibi belirlenmeden redirect URI değiştirilmez.

## 5. Şok/pano formatı

- Durum: **insan ürün tanımı bekliyor**.
- Amaç: Workshop'taki belirsiz “şok veya pano” fikrini ölçülebilir Cadde yüzeyine çevirmek.
- Bağımlılıklar: “Şok” kelimesinin anlamı, hedef kullanıcı, içerik üreticisi, süre ve moderasyon kuralı.
- Kabul: Tek cümle değer önerisi; giriş/çıkış; kart alanları; yayınlayan rol; süre; sıralama; rapor/itiraz; başarı metriği net.
- İlk batch: Burak ile 20 dakikalık karar oturumu ve üç wireframe seçeneği: duyuru panosu, süreli spotlight, topluluk çağrısı.
- Go/no-go: Format seçilmeden tablo, route veya admin ekranı açılmaz.

## Karar oturumu çıktısı

Her epic için yalnız şu altı alan doldurulur: `seçilen senaryo`, `sahip`, `bütçe`,
`hukuk/lisans`, `ilk pilot`, `başarı metriği`. Eksik alan varsa kart “hazır” sayılmaz.
