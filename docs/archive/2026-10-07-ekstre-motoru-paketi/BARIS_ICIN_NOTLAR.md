# Barış için notlar — önce bunu oku

Kurulum adımları **README.md**'de, Claude Code'a yapıştırılacak talimat **CLAUDE_CODE_PROMPT.md**'de.
Bu dosya: Burak'la netleşen kurallar, henüz denenmeyen kısımlar ve kurulumdan sonra kontrol listesi.

## 1. Burak'la netleşen kurallar (v2)

1. **Önce gözden geçirme, sonra otomatik giriş.** Yüklenen ekstre "girişe hazır" liste olarak gelir.
   Burak "Gözden geçirdim, CorteQS muhasebesine gir" demeden hiçbir satır `expenses`'a yazılmaz.
   Mercury işlemleri de varsayılan olarak önce incelemeye düşer (`accounting_settings.mercury_auto_commit = false`).
2. **Ekstreyi Claude okur** (Gemini değil). Sır: `ANTHROPIC_API_KEY`. Model: `claude-sonnet-5`
   (zor/taranmış ekstrede `ANTHROPIC_MODEL=claude-opus-5-5`). Gemini yalnızca yedek.
3. **Tüm giderler USD girer.** `expenses.amount` = USD, `currency = 'USD'`.
   TL → TCMB USD/TRY döviz satış; EUR → TCMB EUR/USD çapraz kuru; QAR sabit 3,64.
   Asıl tutar `amount_original` / `currency_original`, TL karşılığı `amount_try` kolonunda.
4. **Gider ortağı kolonu.** Dışarıdan gider ortağı (ör. Baran) katkı verdiyse satıra ad + $ yazılır;
   CorteQS'e giren gider = brüt $ − katkı $. Brüt `amount_usd`, katkı `partner_share_usd`, ad `partner_name`.
   Geçici bir uygulama: admin'deki "Gider ortağı kolonu" anahtarıyla (`accounting_settings.partner_share_enabled`)
   kapatılabilir. Kapalıyken kolon gizlenir, katkı düşülmez, eski veriler silinmez.

## 2. Burak'ın kararını bekleyen konu

- **Kur tarihi:** Burak "güncel kur" dedi. Varsayılanı **işlem günü** TCMB kuru olarak kurduk
  (muhasebede genelde kullanılan bu). Burak **yükleme günündeki** kuru isterse kod değişikliği gerekmez;
  admin'deki kur seçicisinden ya da
  `update accounting_settings set fx_rate_date = 'upload';` ile değiştirilir.

## 3. Henüz denenmeyen kısımlar (sandbox'ta erişim yoktu)

| Konu | Neden denenmedi | Nasıl kontrol edilir |
|---|---|---|
| Gerçek PDF'in Claude API ile okunması | Anahtar yoktu; örnek bir Claude/Gemini çıktısıyla (`fixtures/ornek_gemini_cikti_qnb.json`) simüle edildi | İlk gerçek QNB sanal kart ekstresini yükle; satır sayısını ve toplamı PDF'le karşılaştır. Toplam tutmazsa ekranda mutabakat uyarısı çıkar. Satır kaçırırsa `ANTHROPIC_MODEL=claude-opus-5-5` dene. |
| Canlı TCMB kur çekimi | Sandbox dış ağa kapalıydı; testler sabit kur tablosuyla yapıldı | İlk yüklemeden sonra `select * from fx_rates order by rate_date desc limit 10;` — USD/TRY ve EUR/USD değerleri TCMB sitesiyle aynı olmalı. |
| Mercury API | Mercury kartı henüz yok; örnek işlemlerle (`fixtures/ornek_mercury_islemler.json`) test edildi | Token gelince "Mercury'yi senkronla", sonuçları Mercury panelindeki işlemlerle karşılaştır. |
| React sayfası projede | Projenin kendi bileşen yolları olmadan yalnızca sözdizimi kontrol edildi | Claude Code entegrasyonundan sonra sayfayı aç, bir CSV yükleyip uçtan uca dene. |

## 4. Test edilenler

- Motor birim testleri 13/13 (`npm test`), edge function tip kontrolü temiz.
- Drive'daki 102 satır: motor $2.709,07, Drive satır toplamı $2.709,05.
- Postgres 16'da migration iki kez üst üste çalıştı; USD giriş, gider ortağı düşümü ($200 → $100),
  kolon kapalıyken brüt giriş ($200), mükerrer engelleme, yetkisiz çağrı reddi ve geri alma doğrulandı.

## 5. Kurulumdan sonra kontrol listesi

- [ ] `is_admin()` imzası ve `expenses` enum/kısıtları migration'la uyumlu (README §2)
- [ ] `ANTHROPIC_API_KEY`, `CRON_SECRET` sırları eklendi, fonksiyonlar deploy edildi
- [ ] "Ekstre Aktar" sekmesi Muhasebe menüsünde
- [ ] İlk QNB ekstresi yüklendi, toplam tuttu, USD tutarlar ve kurlar kontrol edildi
- [ ] Maximiles kartının son 4 hanesi `payment_cards`'a eklendi
- [ ] Burak'a kur tarihi (işlem günü / güncel) soruldu
