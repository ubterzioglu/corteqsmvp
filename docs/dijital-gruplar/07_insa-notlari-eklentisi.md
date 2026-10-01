# İnşa Notları Eklentisi · Dijital Gruplar

Aşağıdaki bölüm `claude_corteqs-insa-notlari.md` dosyasının sonuna olduğu gibi eklenir.

---

## X. Dijital Gruplar (politika v1.1)

- [ ] **BE** Grup yayın durumu, sahiplik ve gizleme sebebi alanları; tek geçiş fonksiyonu ve moderasyon logu. — 27.09.2026, dijital gruplar politikası
- [ ] **BE** Davet linki anonim kullanıcıya hiçbir yoldan dönmez (RLS + public view); link yalnızca girişli kullanıcıya, günlük sınırla verilir. — 27.09.2026
- [ ] **BE** Sahiplik doğrulama: grup adına 10 dakikalık `CQ` kodu, 3 deneme, yedek yol ekran görüntüsü. Yöntem M1 spike sonucuna göre kesinleşir. — 27.09.2026
- [ ] **BE** Hızlı şerit bayrağı (varsayılan kapalı); moderasyondan geçen ilk 100 gruptan sonra elle açılır. — 27.09.2026
- [ ] **BE** Admin olmayanın grup gönderimi ve grup sayfası yorumu moderasyona düşer; yorum önce grup adminine, 48 saat sonra platforma. — 27.09.2026
- [ ] **BE** Şikayet eşiği: 7 günlük, telefonu doğrulanmış, farklı 3 hesap → grup gizlenir. — 27.09.2026
- [ ] **BE** Uyarı sistemi: uyarı → 30 gün askı → kalıcı kaldırma. Kırmızı çizgi 2, 4, 6 doğrudan kaldırma. — 27.09.2026
- [ ] **BE** Grup Sağlık Skoru günlük; ilk 7 gün null; rozet 70'te kazanılır, 65 altında kaybedilir. — 27.09.2026
- [ ] **BE** Zamanlanmış görevler: link-health (haftalık), queue-escalation, health-score, suspension-release, owner-renewal, claim-expiry. — 27.09.2026
- [ ] **FE** Form: link → otomatik ad/görsel/platform; kategori (7); konum otomatik tamamlama + Global; kısa açıklama 160; "admini misin"; Grup Sözü onayı. Platform seçimi ve serbest metin konum kalkar. — 27.09.2026
- [ ] **FE** Dizin: "Admin onaylı!" / "Üye onaylı!" kalkar → "Sahibi doğruladı" / "Üye önerisi"; "Skor bekleniyor" hiçbir yerde görünmez; kategori filtreleri kartlarla aynı liste. — 27.09.2026
- [ ] **FE** Detay: boş "Grup koşulları" bölümü gizlenir; "Bu grup sizin mi?" ve "Şikayet et" eklenir. — 27.09.2026
- [ ] **FE** Grup sahibi paneli: düzenleme, onay kuyruğu, skor kalemleri, rozet görseli, kaldırma. — 27.09.2026
- [ ] **Admin** Moderatör paneli: 4 kuyruk, klavye kısayolları, hızlı şerit anahtarı, görevlerin son çalışma zamanı. — 27.09.2026
- [ ] **Bildirim** 02_motor-tasarimi.md Bölüm 9'daki 8 bildirim metni. — 27.09.2026
- [ ] **Veri** Mevcut 10 grup: published + unclaimed; kategori ve hedef ülke elle eşlenir (almanya101 → Almanya); kısa açıklamalar 160 karaktere indirilir. — 27.09.2026
