# Microsoft Clarity — Haftalık Rapor ve Import Paketi

Durum: **şablon hazır; gerçek veri bağlantısı/analizi yapılmadı**.

## Amaç ve sınır

Bu sözleşme Clarity UI/CSV verisini CorteQS ürün event'leriyle aynı haftalık raporda
buluşturur. Clarity kayıt URL'leri, e-posta, kullanıcı UUID'si, serbest form metni veya
başka doğrudan tanımlayıcılar import edilmez.

## Import sözleşmesi

Dosya: UTF-8 CSV, virgül ayraç, başlık zorunlu, tarihler ISO-8601 UTC. Her satır
`week_start + segment + page_path + device + country` seviyesinde toplulaştırılmıştır.

| Alan | Tip | Kural |
|---|---|---|
| `week_start`, `week_end` | date | Pazartesi 00:00–Pazar 23:59, Europe/Berlin rapor haftası |
| `segment` | enum | `all`, `tools`, `cadde`, `profile`, `commercial` |
| `page_path` | text | Query/hash/UUID temizlenmiş route kalıbı |
| `device` | enum | `desktop`, `mobile`, `tablet`, `unknown` |
| `country` | text | ISO-3166 alpha-2 veya `ZZ`; şehir import edilmez |
| `sessions`, `users` | integer | Negatif olamaz; kullanıcı sayısı Clarity aggregate değeridir |
| `engagement_seconds_p50` | decimal | Medyan; ortalama yerine uç değer etkisini azaltır |
| `scroll_25/50/75/100` | integer | İlgili eşiğe ulaşan session sayısı |
| `dead_clicks`, `rage_clicks`, `quick_backs` | integer | Clarity aggregate sinyalleri |
| `js_errors` | integer | Hata görülen session sayısı; hata metni bu dosyaya girmez |
| `tool_starts`, `tool_answers`, `tool_completions` | integer | Sırasıyla session, answer ve result/event haftalık aggregate'i |
| `result_views`, `cta_clicks`, `abandoned_sessions` | integer | CorteQS event/session aggregate'i |
| `source_exported_at` | datetime | Kaynak export zamanı |

### Satır örneği

```csv
week_start,week_end,segment,page_path,device,country,sessions,users,engagement_seconds_p50,scroll_25,scroll_50,scroll_75,scroll_100,dead_clicks,rage_clicks,quick_backs,js_errors,tool_starts,tool_answers,tool_completions,result_views,cta_clicks,abandoned_sessions,source_exported_at
2026-08-24,2026-08-30,tools,/tools/:toolSlug,mobile,DE,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2026-08-31T06:00:00Z
```

## Funnel tanımları

| Adım | Payda | Başarı metriği |
|---|---|---|
| Hub → araç | `/tools` session | Araç route'una geçen session / hub session |
| Araç → başlangıç | Araç route session | İlk `answer`/session start / araç session |
| Başlangıç → orta | Başlayan session | En az 10 benzersiz cevap / başlayan session |
| Başlangıç → tamamlanma | Başlayan session | `complete` / başlayan session |
| Tamamlanma → sonuç | Tamamlanan session | `result_view` / complete |
| Sonuç → aksiyon | Sonuç görüntüleme | `cta_click` / result_view |
| Terk | Başlayan session | 24 saat hareketsiz ve tamamlanmamış / başlayan session |

Araç bazında karşılaştırma yapılırken en az 30 başlangıç yoksa yüzde yerine ham sayı ve
“düşük örneklem” etiketi gösterilir.

## Hata ve davranış eşikleri

- JS error session oranı > %2: P1 inceleme.
- Rage click oranı > %5 veya önceki haftaya göre 2×: UX replay örneklemesi.
- Dead click oranı > %8: element/CTA envanteri.
- Quick back > %20: trafik niyeti, başlık ve route performansı birlikte incelenir.
- Araç completion < %35 ve en az 30 start: soru bazlı drop-off incelemesi.
- Tek adımda haftalık >15 puan düşüş: event kaybı ihtimali önce doğrulanır.

## Haftalık rapor şablonu

### 1. Yönetici özeti

- Hafta:
- Toplam session / önceki haftaya fark:
- En güçlü sinyal:
- En kritik sürtünme:
- Bu hafta alınacak tek ürün kararı:

### 2. Funnel

| Funnel | Bu hafta | Önceki hafta | Fark | Örneklem | Yorum |
|---|---:|---:|---:|---:|---|
| Hub → araç | — | — | — | — | Veri bağlantısı bekleniyor |
| Araç start → complete | — | — | — | — | Veri bağlantısı bekleniyor |
| Result → CTA | — | — | — | — | Veri bağlantısı bekleniyor |

### 3. Sorun kuyruğu

| Öncelik | Route/araç | Sinyal | Kanıt | Hipotez | En küçük deney | Sahip |
|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — |

### 4. Araç ilgisi

Start, completion ve CTA ayrı gösterilir. Yalnız page view ile “en sevilen araç” sonucu çıkarılmaz.

### 5. Veri kalitesi

- Eksik gün/satır:
- Event–Clarity zaman dilimi farkı:
- Consent/CSP kaynaklı örneklem kaybı:
- Route normalizasyon hataları:

## Çalıştırma sırası

1. Clarity'den haftalık aggregate export alınır.
2. UUID/query/hash alanları route kalıbına normalize edilir.
3. CorteQS session/answer/result/event aggregate'i aynı hafta ve zaman diliminde çıkarılır.
4. Şema, tip, negatif değer ve toplama kontrolleri çalıştırılır.
5. Rapor üretilir; replay yalnız aggregate sinyalin nedenini örneklemek için açılır.
6. Gerçek export/import olmadan “Clarity analizi tamamlandı” işareti verilmez.
