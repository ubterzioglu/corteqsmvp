# Site Geneli AI Bot Planı

### Batch 0 — Embedding kuyruğu
- Katalog, 418 doküman ve 50 blog içeriğini kuyruğa al.
- İdempotency ve hata raporu ekle.
**Çıkış:** Embedding işlemi tekrarlanabilir.

### Batch 1 — Embedding üretimi
- `catalog_search_documents.embedding` alanını doldur.
- Semantik örnek sorgularla doğrula.
**Çıkış:** Semantik arama verisi hazır.

### Batch 2 — Backend genellemesi
- `relocation-assistant` fonksiyonunu site geneli bağlama genişlet.
- Origin, rate limit, gövde limiti, PII, geçmiş ve sistem prompt desteğini koru/ekle.
**Çıkış:** Backend bağlamlı çok turlu konuşuyor.

### Batch 3 — ChatBot bağlantısı
- `ChatBot.tsx` bağlantısını `rag.corteqs.net` yerine yeni backend’e taşı.
- Hata/timeout ve fallback davranışını düzelt.
**Çıkış:** ChatBot doğru backend’i kullanıyor.

### Batch 4 — Kalite ve maliyet
- Gemini billing/kota kontrolü yap.
- Türkçe vize, denklik ve taşınma sorularıyla kalite testi yap.
- Kullanım ve hata loglarını kontrol et.
**Çıkış:** Bot ölçülebilir ve işletilebilir.
