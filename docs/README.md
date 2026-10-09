# CorteQS Dokümantasyon Dizini

Kökte yalnız `CLAUDE.md` (agent kuralları) ve `README.md` (depo girişi) durur.
Diğer her doküman burada, aşağıdaki klasörlerden birindedir.
**Kök dizine ve bu dizinin köküne yeni doküman eklenmez** — ilgili klasöre eklenir.

> Bu dizinde **rakam yazılmaz** (dosya/test/migration sayısı çabuk bayatlar). Ölçmek için:
> `git ls-files` ile say; çıplak `find` gitignore'lu `referanslovable/` klonunu da tarar.
> Eski tarihli güncelleme notları: [`history/README-degisiklik-gunlugu-2026.md`](history/README-degisiklik-gunlugu-2026.md).

## Nereden başlamalı?

| İhtiyaç | Doküman |
|---------|---------|
| Yeni oturum / hızlı bağlam | [`AGENT_CONTEXT.md`](AGENT_CONTEXT.md) |
| Mimari | [`ARCHITECTURE.md`](ARCHITECTURE.md) (tek bakımlı mimari belge) |
| Deploy / DB / secret tuzakları | [`operations/2026-09-30-kalici-operasyon-dersleri.md`](operations/2026-09-30-kalici-operasyon-dersleri.md) |
| Kalan işler | [`kalanlar/KALANLAR.md`](kalanlar/KALANLAR.md) |
| Proje durumu | [`status/rapor.html`](status/rapor.html) |
| Cadde 3.0 | [`cadde-300/change-report.md`](cadde-300/change-report.md) |
| Ölçülmüş depo/SEO gerçeği | [`audits/`](audits/) — `CLAUDE.md` ile çelişirse ölçüm geçerli |

> ⚠️ `AGENT_CONTEXT.md` ve `ARCHITECTURE.md` yollarını `scripts/check-drift.mjs` ile
> `scripts/agent/drift-rules.mjs` sabit yazar. Taşırsan ikisini de güncelle; yoksa drift
> kuralı sessizce hiç bulgu üretmez.

## Kök seviyedeki dokümanlar

| Dosya | Konu |
|-------|------|
| `AGENT_CONTEXT.md`, `ARCHITECTURE.md` | Yukarıda |
| `PROJECT_OVERVIEW.md` | Proje tanıtımı |
| `AS_ANY_POLICY.md` | `as any` kullanım politikası |
| `coolify-deployment.md` | Coolify deploy notları |
| `migration-runbook.md`, `migration-status.md` | Migration uygulama rehberi ve durumu |
| `supabase-exit-plan.md`, `supabase-plan-decision.md` | Supabase çıkış planı ve karar kaydı |

## Klasör sözlüğü

### Aktif

| Klasör | İçerik |
|--------|--------|
| `plans/` | Uygulama planları (`plans/admin-v2/`, `plans/service-finder/` alt klasörleri dahil) |
| `kalanlar/` | Biten işlerden artan, **karar bekleyen** maddeler. Karar verilip iş bitince silinir. Kendi `README.md`'si açık maddeleri tutar |
| `handover/` | Oturumlar arası devir notları ve ajan promptları |
| `operations/` | Deploy, veritabanı, güvenlik, release rehberleri |
| `guides/` | Kullanıcı ve admin/developer rehberleri |
| `modules/` | Modül belgeleri (Türkçe domain adları) |
| `audits/` | Kanıta dayalı denetim raporları (+ `orphan-route-scan.mjs` tarayıcısı) |
| `security/` | Güvenlik denetimi, kullanım envanteri |
| `refactor/` | Refactor backlog'u |
| `dijital-gruplar/` | Dijital Gruplar politika v1.1 ve motor tasarımı (kaynak: `CLAUDE.md` ilgili bölümü) |
| `investor/` | Parolalı yatırımcı / teknik danışman sayfası (`/information`): işletim rehberi + içerik taslağı |
| `agent/` | Ajan araç kataloğu (`tools.json`, `openapi.yaml`) — `npm run ingest:tools:check` ile üretilir/denetlenir, elle düzenleme |
| `status/` | Durum panoları |
| `stripe/` | Stripe demo/mock ödeme rehberleri |
| `marketing/`, `analytics/` | Kampanya kitleri, Clarity haftalık rapor paketi |
| `notes/` | Toplantı ve karar notları |

### Referans (biten işlerin kaydı)

| Klasör | İçerik |
|--------|--------|
| `cadde-300/` | Cadde 3.0 spec, faz dokümanları, kapanış raporu |
| `catalog-role-afs-rebuild/` | Catalog / flat-rol / AFS rebuild raporları |
| `commandcenter/` | Komuta Merkezi notları (gitignore'lu) |
| `10tool/` | Relocation araçları (10 araç) E2E talimatları |
| `database-audit/`, `cleanup/` | DB audit ve temizlik çıktıları |
| `history/` | Tamamlanmış planlar, eski handoff'lar, kapanış raporları, değişiklik günlükleri |

### Dondurulmuş / üretilen

| Klasör | İçerik |
|--------|--------|
| `archive/` | Dondurulmuş içerik; alt klasör dizini [`archive/README.md`](archive/README.md)'de. Kök temizlikleri tarihli klasörlerdedir (`root-2026-…`) |
| `reference/` | Referans repo kopyaları |
| `partner-materials/` | Influencer / Strategic Partner tanıtım materyalleri |
| `assets/`, `backup/`, `fallback-images/`, `social-share-outputs/` | Görseller (sosyal paylaşım çıktılarında adlandırma kuralı `social-share-outputs/NAMING.md`) |
| `exports/` | Üretilen dışa aktarımlar (`blog-md/`) |
| `proref/`, `inbox-review/`, `superpowers/` | Sınıflandırılmamış / agent çıktıları |

> `archive/`, `reference/`, `partner-materials/` `verify:text` encoding denetiminden muaftır.
> Canlı doküman buralara değil, ilgili aktif klasöre eklenir.

## Kurallar

1. **Yeni doküman = ilgili klasöre, `YYYY-AA-GG-konu.md` adıyla.**
2. **Taşırken `git mv`** kullan (geçmiş korunur); taşıdıktan sonra eski yola verilen linkleri `grep` ile ara.
3. **Biten planı silme, `history/` veya `archive/`'e taşı.** Arşivde ne olduğunu klasörün `README.md`'sine yaz.
4. **Sayı yazma, komutu yaz** — rakam bayatlar, komut bayatlamaz.
5. Biten bir kalan-iş maddesi `kalanlar/KALANLAR.md`'den silinir; tarihçesi `history/`'de kalır.
