# Relocation Source Registry

Bu doküman, `relocation_source_registry` tablosunun seed içeriğini ve her kaynağın lisans/cache/
redistribution kısıtlarını tanımlar. **Adapter yazılmadan önce** her Tier-2 kaynak için lisans
kısıtı bu tabloda netleşmelidir (ADR-001 kuralı).

## Güvenilirlik hiyerarşisi (`authority_level`)

```
official      > regulator > licensed_commercial > verified_community > user_generated
(en güvenilir)                                                          (en az güvenilir)
```

`trust_score` (0..1) `authority_level`'dan türetilir ama freshness ve doğrulama ile ayarlanabilir.

## Tier-1 — Resmi / Regülatör (varsayılan, ham veri serbestçe yeniden kullanılabilir genelde)

| source_key | provider_name | authority_level | kapsam | refresh_sla_hours |
|---|---|---|---|---|
| `eu_your_europe` | Your Europe | official | AB içi taşınma/haklar | 168 |
| `eu_eures` | EURES | official | AB iş hareketliliği | 168 |
| `de_make_it_in_germany` | Make it in Germany | official | DE göç/iş | 168 |
| `de_berlin_service` | Berlin Service Portal | official | DE-Berlin ikamet kaydı | 168 |
| `uk_govuk` | GOV.UK | official | UK göç/NIN | 168 |
| `fr_service_public` | Service-Public.fr | official | FR yerleşme/adres | 168 |
| `nl_government` | government.nl / BRP | official | NL gemeente/BSN | 168 |
| `tr_konsolosluk` | T.C. Konsolosluk | official | TR vatandaş işlemleri | 168 |
| `tr_ytb` | YTB | official | TR yurtdışı vatandaş | 336 |
| `de_bnetza` | BNetzA | regulator | DE GSM kapsama | 720 |
| `uk_ofcom` | Ofcom | regulator | UK GSM kapsama | 720 |
| `fr_arcep` | ARCEP | regulator | FR GSM kapsama | 720 |
| `tr_btk` | BTK | regulator | TR GSM kapsama | 720 |
| `uk_nhs_find_gp` | NHS Find a GP | official | UK doktor dizini | 168 |
| `de_kbv_116117` | KBV / 116117 / gesund.bund.de | official | DE doktor dizini | 168 |
| `fr_annuaire_sante` | ameli Annuaire Santé | official | FR doktor dizini | 168 |
| `tr_mhrs` | MHRS / e-Devlet | official | TR doktor/randevu | 168 |

## Tier-2 — Lisanslı Ticari (lisans kısıtı ZORUNLU — adapter öncesi netleştir)

| source_key | provider_name | kategori | lisans / cache / redistribution kısıtı |
|---|---|---|---|
| `idealista_api` | Idealista API | housing | Partner API; cache + redistribution kısıtlı — terms gözden geçir |
| `immoscout24_api` | ImmoScout24 API | housing | Partner/datafeed mantığı; doğrudan redistribution yok |
| `rightmove_feed` | Rightmove datafeed | housing | Datafeed sözleşmesi; partner-only |
| `funda_partner` | Funda partner endpoints | housing | Partner erişim |
| `amadeus_api` | Amadeus | flight | Self-service + production tier; cache kuralları |
| `skyscanner_partner` | Skyscanner | flight | Cache + redistribution sınırları açık (partner docs) |
| `iata_timatic` | IATA Timatic | flight/entry | Giriş şartı verisi; lisanslı |

**Topluluk (verified_community):** YTB/konsolosluk dernek dizinleri, TGD gibi çatı yapılar →
`verified_community`. InterNations / yerel guide / doğrulanmış WhatsApp-Telegram → ayrı düşük trust_score.

## Kural
- HTML scraping **varsayılan yöntem değildir**. Sadece (a) hukuki onay ve (b) alternatif resmi/lisanslı
  kaynak yokluğu durumunda, `robots.txt` saygısıyla kontrollü fallback olarak kullanılır (worker `robots.ts`).
- Her kaynağın `secret_ref` alanı yalnızca **worker env değişken adıdır**; ham API anahtarı asla DB'de tutulmaz.
