# corteqs_fin — Teknik Durum Belgesi (2026-05-31)

> **Bu belge agent okunabilirliği için optimize edilmiştir.**
> Bir agent bu projeye ilk kez bakıyorsa bu dosyayı önce oku; sonra CLAUDE.md'yi oku.
> Kodlama yapmadan önce `src/App.tsx` ve ilgili `*-api.ts` dosyalarını incele.

---

## 1. REPO KÖKENİ — Neyin Nereden Geldiği

Bu repo (`corteqs_fin`) 3 ayrı reponun 2026-05-30 tarihinde tek oturumda birleştirilmesiyle oluşturuldu.

### 1.1 Merge Zinciri

| Sıra | Commit | Kaynak | Ne Katkı Sağladı |
|------|--------|--------|-----------------|
| 1 | `5a80882` | **corteqslanding** (BASE) | Tüm altyapı, admin paneli, auth sistemi, migration'lar, Dockerfile, CLAUDE.md |
| 2 | `28abaa8` | **corteqs-mvp-merged-lovable-v2** (OVERLAY) | 35 yeni sayfa, 101 yeni component, 8 hook, contexts/, data/, content/ dizinleri, 46 migration |
| 3 | `eba2cc1` | Merge commit | İki dalın `main`'de birleştirilmesi |

### 1.2 Kaynak Repo → Dosya Eşlemesi

#### BASE: `corteqslanding` → `https://github.com/ubterzioglu/corteqslanding`

Bu repo, `corteqs_fin`'in **çekirdeğidir**. Aşağıdaki her şey buradan geldi:

```
src/
  App.tsx                          # Tüm route tablosu (base'den)
  components/auth/                 # AuthProvider, RequireAuth, RequireFeature
  components/admin/                # Admin panel bileşenleri
  components/surveys/              # Survey renderer
  components/may19/                # Mayıs kampanyası UI
  lib/muhasebe-*.ts                # Muhasebe domain (referans mimari)
  lib/submissions.ts               # Ana form kayıt servisi
  lib/lansman.ts                   # Lansman akışı
  lib/referral-codes.ts            # Referral sistemi
  lib/marquee.ts                   # Duyuru akışı
  lib/cadde.ts                     # Cadde modülü
  lib/member-profile.ts            # Üye profil servisi
  integrations/supabase/           # Lovable kaynaklı typed client (DOKUNMA)
  pages/admin/                     # Admin sayfaları (orijinal set)
  pages/FormPage.tsx               # Public kayıt formu
  pages/LansmanPage.tsx            # Lansman sayfası
  pages/CaddePage.tsx              # Cadde sayfası
supabase/migrations/ (20260530'a kadar)  # 60+ orijinal migration
supabase/functions/
  send-submission-email            # Resend API ile mail
  chat-register                    # Gemini AI kayıt botu
  find-matches                     # AI eşleştirme
  lansman-admin                    # Deprecated (410 döner)
  submit-survey-response           # Anket yanıt kaydı
Dockerfile                         # nginx tabanlı, port 80
nixpacks.toml                      # server.mjs tabanlı, port 3000
server.mjs                         # Runtime env injection + /api/chat proxy
CLAUDE.md                          # Proje kuralları
```

#### OVERLAY: `corteqs-mvp-merged-lovable-v2`

Bu repo, lovable.dev üzerinde geliştirilen **global network / diaspora MVP** uygulamasının kodudur.
Base'e eklenen benzersiz dosyalar (çakışan dosyalar base'den korundu):

```
src/
  contexts/
    AuthContext.tsx               # OVERLAY'den — lovable-v2 auth context (base ile çakışıyor, bkz. Risk #2)
    DiasporaContext.tsx           # OVERLAY'den — diaspora state yönetimi
  data/
    continents.ts                # Kıta verisi (mock)
    countryCities.ts             # Ülke/şehir verisi (mock)
    mock.ts                      # Genel mock data
    mockFeedPosts.ts             # Feed mock içeriği
    organizationCategories.ts    # Organizasyon kategorileri
    userSubcategories.ts         # Kullanıcı alt kategorileri
  content/
    founding1000WelcomeEmail     # Founding 1000 karşılama maili içeriği
  pages/ (35 yeni sayfa):
    Feed.tsx                     # Sosyal feed
    Events.tsx / EventDetail.tsx # Etkinlik modülü
    Career.tsx / JobBoard.tsx    # Kariyer modülü
    Businesses.tsx / BusinessDetail.tsx
    AITwin.tsx                   # AI ikiz profil
    DiasporaPeople.tsx / DiasporaDetailPage.tsx
    RadarPage.tsx / RadarDetail.tsx
    Associations.tsx / AssociationDetail.tsx
    Consultants.tsx / ConsultantDetail.tsx
    CityAmbassadors.tsx
    CityNews.tsx
    Bloggers.tsx / BloggerDetail.tsx
    WhatsAppGroups.tsx / WhatsAppGroupLanding.tsx
    MapSearch.tsx
    HospitalAppointment.tsx
    RegisterDiaspora.tsx
    RelocationEngine.tsx
    PostGenerator.tsx / RadioSongRequest.tsx
    Onboarding.tsx
    Dashboards.tsx
    Pricing.tsx
  components/ (101 yeni bileşen):
    AmbassadorReferralCard.tsx
    AnnouncementBoard.tsx
    booking/                     # Randevu UI
    business/                    # İşletme kartları
    city-news/                   # Şehir haberleri
    connections/                 # Bağlantı sistemi
    feed/                        # Feed bileşenleri
    messaging/                   # Mesajlaşma UI
    profiles/                    # Profil kartları
    GlobalNetworkShowcaseSection.tsx
    InternationalDiasporaHero.tsx
    InterestForm.tsx
    ServiceRequestForm.tsx
    ve diğerleri...
  hooks/ (8 yeni hook)
supabase/migrations/ (46 yeni — 20260322–20260513 arası):
  Tablolar: feed_posts, cafes, messages, appointments, connections, job_listings
  DB Kuralı: Tüm OVERLAY migration'larında CREATE TABLE IF NOT EXISTS kullanıldı
```

#### `ref/global-network-bridge/`

Bu dizin, `corteqs-mvp-merged-lovable-v2`'nin Lovable Cloud'dan self-hosted Supabase'e geçiş paketidir.
**Üretim koduna dahil değil** — referans / migrasyon rehberi olarak korunuyor.

```
ref/global-network-bridge/
  migration-bundle/
    supabase/migrations/          # 20 adet Lovable'da uygulanan migration
    supabase/functions/
      diaspora-search             # Henüz merge edilmedi
      relocation-chat             # Henüz merge edilmedi
      whatsapp-bot-lookup         # Henüz merge edilmedi
    full_schema.sql               # DB snapshot (hızlı kurulum için)
    seed_data.sql                 # Seed verisi
    README_MIGRATION.md
```

> **AGENT DİKKAT:** `ref/global-network-bridge/supabase/functions/` altındaki 3 edge function
> (diaspora-search, relocation-chat, whatsapp-bot-lookup) henüz production'a deploy edilmedi.
> Deploy edilmeden önce `LOVABLE_API_KEY` → `GEMINI_API_KEY` dönüşümü ve endpoint URL güncellemesi gerekiyor.

---

## 2. MEVCUT PROJE DURUMU (2026-05-31)

### 2.1 Son Commit'ler

```
3e17ffd  hadi bakalım (.omc güncelleme)
6b2318b  docs: timestamped teknik dokümantasyon
d2d29ff  hadi bakalım
bc3b951  feat: 'no badge' seçeneği admin edit form + badge flag'leri updateLanding'e geçirme
46a4fbe  feat: badge flag'lerini member_approved/admin_approved kolonlarına yazma
6fbb1f9  fix: parseBooleanTag kaldırıldı, tipler badge kolonlarıyla yenilendi
cc616e3  feat: member_approved/admin_approved kolonlarından badge flag'leri okunuyor
60a64e0  feat: whatsapp_landings tablosuna member_approved ve admin_approved kolonları eklendi
```

**Aktif çalışma alanı:** `whatsapp_landings` tablosuna community badge sistemi eklendi.
Badge'lar `member_approved` ve `admin_approved` boolean kolonları olarak tutulmakta.

### 2.2 Teknoloji Stack

| Katman | Versiyon | Not |
|--------|----------|-----|
| React | 18.3.1 | StrictMode kapalı |
| TypeScript | 5.8.3 | strict: false, strictNullChecks: false |
| Vite | 5.4.19 | SWC + özel standalone HTML plugin |
| react-router-dom | 6.30.1 | BrowserRouter |
| @tanstack/react-query | 5.83.0 | Tutarsız kullanım |
| Tailwind CSS | 3.4.17 | CSS variables ile tema |
| shadcn/ui | — | src/components/ui/* (dokunma) |
| Supabase JS SDK | 2.101.1 | |
| Vitest | 3.x | jsdom + Testing Library |
| Playwright | 1.57 | Altyapı var, aktif kullanım yok |

### 2.3 Migration Sayısı

- **BASE (corteqslanding):** ~65 migration (20260530'a kadar)
- **OVERLAY (lovable-v2):** 46 migration (20260322–20260513 arası)
- **Toplam:** ~111 migration dosyası
- **Çakışma riski:** Tarih aralıkları örtüşüyor — `supabase migrations list` ile doğrula

### 2.4 Edge Functions (Production'da Aktif)

| Function | Durum | Açıklama |
|----------|-------|----------|
| `send-submission-email` | Aktif | Resend API ile kayıt maili |
| `chat-register` | Aktif | Gemini AI chatbot kayıt akışı |
| `find-matches` | Aktif | AI eşleştirme |
| `lansman-admin` | Deprecated | 410 döner |
| `submit-survey-response` | Aktif | Anket yanıt kaydı |

### 2.5 Deployment

- **URL:** https://mvp.corteqs.net
- **Platform:** Coolify
- **Build:** Dockerfile → nginx, port 80
- **Alternatif runtime:** nixpacks.toml → server.mjs, port 3000 (aktif değil)

---

## 3. MİMARİ HARİTA

### 3.1 Dosya Sorumluluğu Tablosu

| Dosya/Dizin | Kaynak | Sorumluluk | Dokunulabilir mi? |
|------------|--------|-----------|-----------------|
| `src/App.tsx` | BASE | Tüm route tablosu (80+ route) | Evet (dikkatli) |
| `src/main.tsx` | BASE | Hydrate/Render switch | Evet (dikkatli) |
| `src/integrations/supabase/client.ts` | BASE (Lovable gen.) | Typed Supabase client | HAYIR — overwrite riskli |
| `src/lib/supabase.ts` | BASE | Custom client re-export | Evet |
| `src/lib/muhasebe-*.ts` | BASE | Muhasebe domain (referans mimari) | Evet |
| `src/components/auth/AuthProvider.tsx` | BASE | Supabase session context | Evet (dikkatli) |
| `src/contexts/AuthContext.tsx` | OVERLAY | lovable-v2 auth context | Çakışma riski — önce audit et |
| `src/contexts/DiasporaContext.tsx` | OVERLAY | Diaspora state | Evet |
| `src/data/` | OVERLAY | Mock data (gerçek API'ye taşınacak) | Evet |
| `src/components/ui/*` | BASE (shadcn) | Primitives | HAYIR — shadcn CLI ile güncelle |
| `vite.config.ts` | BASE | Build config + standalone HTML inject | Evet (dikkatli) |
| `server.mjs` | BASE | Production runtime, env injection, chat proxy | Evet (dikkatli) |
| `Dockerfile` | BASE | nginx build, port 80 | Evet |
| `ref/global-network-bridge/` | Referans | Geçiş rehberi, prod'a dahil değil | Okuma amaçlı |

### 3.2 Auth Sistemi — Çakışma Durumu

```
BASE auth:   src/components/auth/AuthProvider.tsx  ← Supabase session, RequireAuth tarafından kullanılıyor
OVERLAY auth: src/contexts/AuthContext.tsx          ← lovable-v2 auth, hangi bileşenler kullanıyor? (doğrulanmadı)
```

**Agent kuralı:** Auth'a dokunan herhangi bir görev için önce hangi context'in kullanıldığını grep ile doğrula:
```bash
grep -r "AuthContext\|AuthProvider\|useAuth" src/ --include="*.tsx" -l
```

### 3.3 Veri Çekme Stilleri

Projede 3 farklı data fetching stili aynı anda yaşıyor:

| Stil | Örnek | Durum |
|------|-------|-------|
| Direkt component fetch | `useEffect + supabase.from()` | Anti-pattern, yaygın |
| API modül katmanı | `src/lib/muhasebe-api.ts` | Tercih edilen pattern |
| React Query hooks | `useMuhasebe.ts` | Önerilen ama az kullanılıyor |

**Yeni özellikler için:** `src/lib/<feature>-api.ts` + React Query kullan (muhasebe pattern'ini takip et).

---

## 4. AÇIK RİSKLER VE BAĞIMLILIKLAR

### Risk #1 — App.tsx Route Entegrasyonu (YÜK. ÖNCELİK)

35 yeni sayfa eklendi (OVERLAY'den). Bunların `src/App.tsx`'e route olarak eklenip eklenmediği doğrulanmadı.

```bash
# Doğrulama komutu:
grep -E "Feed|Events|Career|Businesses|AITwin|DiasporaPeople|RadarPage|Associations|Consultants|CityAmbassadors" src/App.tsx
```

### Risk #2 — Auth Sistemi Çakışması (YÜK. ÖNCELİK)

İki ayrı auth implementasyonu mevcut. Hangisinin canonical olduğu test edilmedi.

### Risk #3 — Migration Sırası (ORTA ÖNCELİK)

46 OVERLAY migration'ının (20260322–20260513) BASE migration'larla çakışıp çakışmadığı bilinmiyor.

```bash
# Kontrol komutu:
supabase migrations list
```

### Risk #4 — Mock Data (DÜŞÜK ÖNCELİK)

`src/data/` altındaki tüm dosyalar mock veri içeriyor. Production'da gerçek Supabase sorgularıyla değiştirilmeli.

### Risk #5 — Deploy Edilmemiş Edge Functions

`ref/global-network-bridge/supabase/functions/` altındaki 3 function (diaspora-search, relocation-chat, whatsapp-bot-lookup) production'a deploy edilmedi. Deploy öncesi:
1. `LOVABLE_API_KEY` → `GEMINI_API_KEY` değiştir
2. AI endpoint URL'ini güncelle
3. `supabase functions deploy` çalıştır

---

## 5. `corteqslanding` REPOSUNDAN YENİ ÖZELLİK ÇEKME — AGENT DİREKTİFLERİ

**Kaynak repo:** `https://github.com/ubterzioglu/corteqslanding`

Bu repo, `corteqs_fin`'in BASE kaynağıdır. Zaman içinde yeni özellikler ve düzeltmeler bu repoda birikebilir.

### 5.1 Sync Öncesi Kontrol Listesi

Bir agent bu repo'dan değişiklik çekmeden önce mutlaka şunları yapmalı:

```bash
# 1. Hangi dosyaların farklılaştığını gör
gh api repos/ubterzioglu/corteqslanding/commits --jq '.[0:10] | .[] | {sha: .sha[0:7], msg: .commit.message, date: .commit.author.date}'

# 2. Belirli bir dosyanın uzak versiyonunu oku
gh api repos/ubterzioglu/corteqslanding/contents/src/App.tsx --jq '.content' | base64 -d

# 3. Son commit'ten bu yana değişen dosyaları listele (BASE merge commit: 5a80882)
gh api "repos/ubterzioglu/corteqslanding/compare/BASE_SHA...HEAD" --jq '.files[].filename'
```

### 5.2 Güvenli Merge Stratejisi

**Kural 1 — Asla force-overwrite yapma.**
BASE'den gelen dosyaları OVERLAY değişiklikleri ezmeyecek şekilde işle. Çakışmalarda BASE kazanır (mevcut davranış).

**Kural 2 — Aşağıdaki dosyaları asla uzak repodan direkt kopyalama:**

```
src/App.tsx                        # Lokal route'lar (35 OVERLAY sayfası) var — merge gerekir
src/integrations/supabase/client.ts  # Lovable-generated, lokal tipler farklı
supabase/migrations/               # Hiçbir migration silinemez, yenisi eklenir
server.mjs                         # Runtime config lokal ortama özel
```

**Kural 3 — Güvenle kopyalanabilir dosyalar:**

```
src/lib/muhasebe-*.ts              # Domain logic (bağımsız)
src/lib/submissions.ts             # Kayıt servisi
src/lib/referral-codes.ts          # Referral logic
src/components/auth/AuthProvider.tsx  # Auth (dikkatli — OVERLAY AuthContext ile çakışabilir)
src/components/ui/*                # shadcn primitives (shadcn CLI ile yönet, elle değil)
supabase/functions/                # Edge functions (deploy öncesi env kontrol et)
```

### 5.3 Yeni Özellik Pull Workflow

Bir agent `corteqslanding` reposunda yeni bir özellik tespit edip `corteqs_fin`'e entegre etmek istediğinde:

```
Adım 1: GitHub API ile son commit'leri tara
   → gh api repos/ubterzioglu/corteqslanding/commits

Adım 2: Değişen dosyaları belirle
   → Sadece yeni/değişmiş dosyaları listele, tüm repo çekme

Adım 3: Çakışma analizi
   → Lokal versiyonla diff al
   → OVERLAY değişiklikleri eziyor mu?
   → Auth, App.tsx veya migration etkileniyor mu?

Adım 4: Migration varsa
   → Tarih kontrolü yap (mevcut migration'larla çakışıyor mu?)
   → CREATE TABLE IF NOT EXISTS kullanıldığından emin ol
   → supabase/migrations/ sonuna ekle

Adım 5: Uygula
   → Çakışmayan dosyaları kopyala
   → App.tsx için route ekle (override etme, ekle)
   → Auth değişikliklerini önce audit et

Adım 6: Doğrula
   → npm run build
   → npm run test
   → Etkilenen sayfayı browser'da kontrol et
```

### 5.4 Tarihsel Öneme Sahip Özellikler (Kırılmamalı)

`corteqslanding`'den gelen ve SEO / production bağımlılığı olan alanlar:

| Özellik | Neden Kritik | Nasıl Tanırsın |
|---------|-------------|----------------|
| `/lansman` route | SEO geçmişi | `src/pages/LansmanPage.tsx` |
| `/cadde` route | SEO geçmişi | `src/pages/CaddePage.tsx` |
| `/founders` route | SEO geçmişi | `src/App.tsx`'te tanımlı |
| `/commercial/<slug>` | SEO + standalone HTML | `vite.config.ts` özel plugin'i |
| `/19051919` | SEO geçmişi | `src/pages/May19*.tsx` |
| `supabase_project_id: injprdrsklkxgnaiixzh` | Production DB | `.env`, `integrations/supabase/client.ts` |
| RLS policy'leri | Güvenlik baseline | `supabase/migrations/20260512103000_security_hardening_phase1.sql` |

---

## 6. YAPI REFERANS HARİTASI — Neyi Nerede Bulursun

### 6.1 Domain Modülleri

```
muhasebe (accounting):
  lib/muhasebe-api.ts, muhasebe-schemas.ts, muhasebe-format.ts, muhasebe-aggregations.ts
  pages/admin/muhasebe/: MuhasebeDashboard, GelirlerPage, GiderlerPage
  components/admin/muhasebe/: KpiCard, StatusBadge, DialogForms
  ← REFERANS MİMARİ — yeni modüller bu yapıyı taklit etmeli

lansman (launch registration):
  lib/lansman.ts, types/lansman.ts
  pages/LansmanPage.tsx
  components/LansmanForm.tsx
  pages/admin/AdminLansmanPage.tsx, components/AdminLansmanTable.tsx

cadde (marketplace):
  lib/cadde.ts
  pages/CaddePage.tsx

anket (surveys):
  lib/surveys.ts
  pages/SurveysPage.tsx, SurveyDetailPage.tsx, SurveyThankYouPage.tsx
  pages/admin/surveys/
  components/surveys/

profil (member profiles):
  lib/member-profile.ts, member-profile-api.ts, individual-profile.ts, profile-types.ts
  pages/ProfilePage.tsx, DirectoryPage.tsx
  components/profile/, components/profiles/

referral:
  lib/referral-codes.ts
  pages/admin/referral/

workspace:
  lib/dashboard/
  pages/admin/workspace/
  components/dashboard/

auth:
  components/auth/AuthProvider.tsx  ← BASE (canonical)
  contexts/AuthContext.tsx          ← OVERLAY (audit gerekli)
```

### 6.2 Kritik Dosya Pointer'ları

| Dosya | Satır Aralığı | Ne Yapar |
|-------|-------------|---------|
| `src/App.tsx` | 1–sonuna kadar | Tüm route tanımları |
| `src/main.tsx` | 1–30 | Render/hydrate switch |
| `src/lib/muhasebe-api.ts` | tümü | Referans API katmanı |
| `supabase/migrations/20260512103000_security_hardening_phase1.sql` | tümü | Güvenlik baseline |
| `supabase/migrations/20260525000000_rolesgo_role_attribute_approval_mvp.sql` | tümü | Yeni yetki sistemi başlangıcı |
| `vite.config.ts` | ~30–80 | Standalone HTML plugin |
| `server.mjs` | ~1–50 | env injection + chat proxy |

---

## 7. AÇIK GÖREVLER

Merge sonrası doğrulanmamış konular (öncelik sırasıyla):

1. **Route audit** — 35 OVERLAY sayfasının App.tsx'te route'u var mı?
2. **Auth audit** — AuthContext vs AuthProvider çakışması test edilmedi
3. **Migration audit** — `supabase migrations list` çalıştır, sıra ve çakışma kontrol et
4. **Edge function deploy** — `ref/global-network-bridge/supabase/functions/` altındaki 3 function
5. **Mock data** — `src/data/` altındaki tüm dosyaları gerçek Supabase sorguları ile değiştir
6. **Coolify port** — port 80 girildiğinden emin ol, redeploy yap
7. **E2E smoke test** — Feed, Events, Career sayfalarının render olduğunu doğrula

---

## 8. KOMUT REFERANSI

```bash
# Geliştirme
npm run dev                           # Vite dev server, port 8080
npm run build                         # Production bundle
npm run test                          # Vitest
npm run lint                          # ESLint

# Supabase
supabase migrations list              # Migration durumu
supabase db push                      # Lokal schema push
supabase functions deploy <name>      # Edge function deploy

# Release doğrulama
npm run verify:release
BASE_URL=https://mvp.corteqs.net npm run verify:release

# GitHub — corteqslanding repo izleme
gh api repos/ubterzioglu/corteqslanding/commits --jq '.[0:5] | .[] | {sha: .sha[0:7], msg: .commit.message}'
```

---

*Belge tarihi: 2026-05-31 | Oluşturan: Claude Sonnet 4.6*
