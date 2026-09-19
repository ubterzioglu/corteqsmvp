# Radar Haber Sağlayıcı Rotasyon Sistemi

## Genel Bakış

Radar haber tarama sistemi, ücretsiz ve ücretli haber sağlayıcılarını dönüşümlü olarak kullanabilen bir rotasyon sistemi ile çalışır. Bu sayede maliyet optimizasyonu yapılabilir ve farklı kaynaklardan daha zengin içerik toplanabilir.

## Desteklenen Sağlayıcılar

### Ücretsiz Sağlayıcılar
| Sağlayıcı | API Key | Günlük Limit | Açıklama |
|-----------|---------|--------------|----------|
| GDELT | Gerekmez | Sınırsız | Küresel haber veritabanı, akademik kaynak |
| RSS Feeds | Gerekmez | Kaynak bazlı | DW Türkçe, Euronews Türkçe gibi RSS kaynakları |
| Atom Feeds | Gerekmez | Kaynak bazlı | Atom formatındaki haber akışları |

### Ücretli Sağlayıcılar
| Sağlayıcı | API Key | Ücretsiz Tier | Ücretli Başlangıç | Kayıt |
|-----------|---------|---------------|-------------------|-------|
| NewsAPI.org | `NEWSAPI_KEY` | 100 istek/gün | $449/ay | https://newsapi.org |
| GNews.io | `GNEWS_KEY` | 100 istek/gün | $99/ay | https://gnews.io |
| Bing News | `BING_NEWS_KEY` | Yok | $3/1000 istek | Azure Portal |
| TheNewsAPI | `THENEWSAPI_KEY` | 1500 istek/ay | $49/ay | https://thenewsapi.com |

## Rotasyon Stratejileri

### 1. Round-Robin (Varsayılan)
Her saat farklı bir sağlayıcı kullanılır. Ücretsiz ve ücretli sağlayıcılar dönüşümlü çalışır.

```env
RADAR_PROVIDER_ROTATION=round-robin
```

**Örnek:** 3 sağlayıcı aktifse (gdelt, newsapi, gnews):
- 09:00-10:00 → GDELT
- 10:00-11:00 → NewsAPI
- 11:00-12:00 → GNews
- 12:00-13:00 → GDELT (döngü başa döner)

### 2. Fallback
Tüm sağlayıcıları sırayla dener. Birincil sağlayıcı başarısız olursa sonrakine geçer.

```env
RADAR_PROVIDER_ROTATION=fallback
```

### 3. Scheduled
Gün bazlı sağlayıcı seçimi. Belirli günlerde belirli sağlayıcılar çalışır.

```env
RADAR_PROVIDER_ROTATION=scheduled
RADAR_PROVIDER_SCHEDULE={"monday":"newsapi","wednesday":"gnews","friday":"gdelt"}
```

### 4. Weighted
Ağırlıklı rastgele seçim. Belirli sağlayıcılara daha yüksek ağırlık verilebilir.

```env
RADAR_PROVIDER_ROTATION=weighted
RADAR_PROVIDER_WEIGHTS={"gdelt":30,"rss":20,"newsapi":25,"gnews":25}
```

## Yapılandırma

### Ortam Değişkenleri

`.env.local` dosyasına eklenecek değişkenler:

```env
# Rotasyon stratejisi
RADAR_PROVIDER_ROTATION=round-robin

# Aktif sağlayıcılar (opsiyonel, boş bırakılırsa API key'i olanlar otomatik aktif)
RADAR_PROVIDERS_ENABLED=gdelt,rss,newsapi

# Ücretli API anahtarları
NEWSAPI_KEY=your_newsapi_key_here
GNEWS_KEY=your_gnews_key_here
BING_NEWS_KEY=your_bing_news_key_here
THENEWSAPI_KEY=your_thenewsapi_key_here
```

### Supabase Secrets

Edge Function'a erişebilmesi için API anahtarları Supabase Vault'a da eklenmelidir:

```bash
# Supabase CLI ile
supabase secrets set NEWSAPI_KEY=your_key
supabase secrets set GNEWS_KEY=your_key

# veya Dashboard'dan: Project Settings > Secrets
```

## Admin Panelinden Yönetim

### Sağlayıcı Kaynaklarını Yönetme

1. `/admin/radar/sources` sayfasına gidin
2. İlgili sağlayıcının kaynaklarını bulun
3. `is_enabled` toggle'ını açın
4. Kaynak yapılandırmasını (config JSON) güncelleyin

### Manuel Tarama

Belirli bir sağlayıcıyı test etmek için:

1. `/admin/radar/queue` sayfasına gidin
2. "Şimdi Tara" butonuna tıklayın
3. Açılan dialog'da kaynakları filtreleyin

## Örnek Kullanım Senaryoları

### Senaryo 1: Sadece Ücretsiz Kaynaklar
```env
RADAR_PROVIDER_ROTATION=round-robin
# Hiçbir ücretli API key ekleme
```

### Senaryo 2: Haftaiçi Ücretli, Haftasonu Ücretsiz
```env
RADAR_PROVIDER_ROTATION=scheduled
RADAR_PROVIDER_SCHEDULE={"monday":"newsapi","tuesday":"gnews","wednesday":"newsapi","thursday":"gnews","friday":"newsapi","saturday":"gdelt","sunday":"gdelt"}
NEWSAPI_KEY=xxx
GNEWS_KEY=xxx
```

### Senaryo 3: %70 Ücretsiz, %30 Ücretli
```env
RADAR_PROVIDER_ROTATION=weighted
RADAR_PROVIDER_WEIGHTS={"gdelt":35,"rss":35,"newsapi":30}
NEWSAPI_KEY=xxx
```

### Senaryo 4: Fallback Zinciri
```env
RADAR_PROVIDER_ROTATION=fallback
RADAR_PROVIDERS_ENABLED=newsapi,gnews,gdelt,rss
NEWSAPI_KEY=xxx
GNEWS_KEY=xxx
```
Bu konfigürasyonda önce NewsAPI denenir, başarısız olursa GNews, o da başarısız olursa GDELT kullanılır.

## Dosya Yapısı

```
supabase/functions/radar-news-scan/
├── index.ts                          # Ana tarama mantığı
├── adapters/
│   ├── gdelt.ts                      # GDELT adapter (ücretsiz)
│   ├── rss.ts                        # RSS adapter (ücretsiz)
│   ├── atom.ts                       # Atom adapter (ücretsiz)
│   ├── newsapi.ts                    # NewsAPI adapter (ücretli)
│   ├── gnews.ts                      # GNews adapter (ücretli)
│   ├── bing-news.ts                  # Bing News adapter (ücretli)
│   └── thenewsapi.ts                 # TheNewsAPI adapter (ücretli)
└── lib/
    ├── provider-config.ts            # Sağlayıcı yapılandırması ve rotasyon
    └── types.ts                      # Tip tanımları
```

## İzleme ve Hata Ayıklama

### Tarama Geçmişi
`/admin/radar/runs` sayfasından her taramanın:
- Hangi sağlayıcıları kullandığı
- Kaç haber topladığı
- Hata durumları
görülebilir.

### Kaynak Durumu
`/admin/radar/sources` sayfasından her kaynağın:
- Son başarılı tarama zamanı
- Son hata mesajı
- Aktif/pasif durumu
görülebilir.

### Loglar
Supabase Dashboard > Edge Functions > radar-news-scan > Logs

## Maliyet Tahmini

### Düşük Kullanım (Günde 2 tarama)
| Sağlayıcı | Aylık Maliyet |
|-----------|---------------|
| Sadece ücretsiz | $0 |
| + NewsAPI (free tier) | $0 |
| + GNews (free tier) | $0 |
| + NewsAPI (paid) | ~$449 |
| + Bing News | ~$180 |

### Orta Kullanım (Günde 6 tarama)
| Sağlayıcı | Aylık Maliyet |
|-----------|---------------|
| Sadece ücretsiz | $0 |
| + TheNewsAPI (free tier) | $0 |
| + GNews (paid) | ~$99 |
| + NewsAPI (paid) | ~$449 |

## SSS

**S: Ücretli sağlayıcı eklemek zorunlu mu?**
C: Hayır. Ücretsiz sağlayıcılar (GDELT, RSS, Atom) tek başına yeterli içerik sağlayabilir. Ücretli sağlayıcılar daha zengin ve güncel içerik için opsiyoneldir.

**S: Birden fazla ücretli sağlayıcı aynı anda kullanılabilir mi?**
C: Evet. Rotasyon stratejisi ile birden fazla ücretli sağlayıcı dönüşümlü kullanılabilir.

**S: API limitine ulaşırsam ne olur?**
C: Sistem otomatik olarak bir sonraki sağlayıcıya geçer (fallback stratejisi) veya bir sonraki rotasyon zamanına kadar bekler.

**S: Sağlayıcıları nasıl test edebilirim?**
C: Admin panelinden "Şimdi Tara" butonu ile manuel tarama tetikleyebilirsiniz. Dry-run modu da kullanılabilir.
