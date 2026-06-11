# CorteQS Admin Panel V2
## Baştan Yazım, Yenilikçi Layout ve E2E Uygulama Master Planı

**Repo:** `corteqssocial-web/corfin-mvp`  
**Hedef alan:** `/admin/*`  
**Doküman tarihi:** 10 Haziran 2026  
**Önerilen repo içi hedef dosya:** `docs/plans/2026-06-10-admin-panel-v2-masterplan.md`  
**Amaç:** Mevcut admin panelinin işlevlerini kaybetmeden; çok daha rahat kullanılabilir, modern, renkli, büyümeye uygun ve modüler bir admin deneyimini sıfırdan kurmak.

---

# 1. Yönetici Özeti

CorteQS admin alanı kısa sürede çok sayıda farklı işlevi tek panel altında toplamıştır: katalog ve kullanıcı kayıtları, AFS yönetimi, feature override, approval queue, audit logs, topluluk landing yönetimi, workspace, muhasebe, anketler, içerik akışları ve çeşitli operasyon ekranları aynı `/admin` kabuğu içinde çalışmaktadır.

Mevcut shell işlevsel olmakla birlikte ölçeklenebilir değildir. Masaüstü navigasyonu üst header içine sıkışmış çok sayıda link ve dropdown üzerinden ilerlemektedir. Mobilde ise ayrıca elle tutulan uzun bir link listesi bulunmaktadır. Bu yaklaşım yeni ekran eklendikçe zorlaşır; aynı bilginin birden fazla yerde tekrar tanımlanmasına, tutarsız aktif durumlara ve bakım maliyetine neden olur.

Yeni yaklaşımda admin paneli yalnızca yeniden renklendirilmeyecek; bilgi mimarisi ve frontend kabuğu yeniden yazılacaktır:

- Masaüstünde **sabit ve daraltılabilir sol sidebar** kullanılacaktır.
- Üstte ince bir **utility topbar** yer alacaktır.
- Tüm ekranlar ortak bir **AdminPageShell** düzenine geçirilecektir.
- Navigasyon tek bir **Admin Module Registry** dosyasından üretilecektir.
- Mobil sidebar aynı registry üzerinden Sheet olarak açılacaktır; ayrı statik mobil link listesi tutulmayacaktır.
- Global arama / command palette ile menü içinde gezmeden ekran bulunabilecektir.
- Breadcrumb, modül renk kodu, favoriler ve son kullanılanlar panel kullanım hızını artıracaktır.
- Yeni ekranların sisteme eklenmesi kolaylaşacaktır.
- İlk etapta backend veya veritabanı yeniden yazılmayacaktır. Mevcut route ve çalışan fonksiyonlar korunacaktır.

Bu doküman tasarım kararlarını, klasör yapısını, bileşen spesifikasyonlarını, geçiş sırasını, testleri ve Claude Code için doğrudan uygulanabilir görev listesini içerir.

---

# 2. Kaynaklar ve Gerçeklik Sırası

Bu çalışma aşağıdaki kaynaklara göre hazırlanmıştır:

1. Canlı repo içindeki güncel kod.
2. `CLAUDE.md` çalışma kuralları.
3. `AGENT_CONTEXT.md` proje özeti.
4. `AI_TECHNICAL_REFERENCE.md` derin teknik referans.
5. Mevcut migration ve AFS rebuild gerçekliği.

Çakışma olması durumunda sıralama şöyledir:

```text
Canlı repo kodu + migrationlar
> AI_TECHNICAL_REFERENCE.md
> AGENT_CONTEXT.md
> CLAUDE.md
> eski dokümanlar
```

---

# 3. Mevcut Sistem Fotoğrafı

## 3.1 Teknoloji altyapısı

Admin V2 mevcut stack üzerinde kurulmalıdır. Yeni bir framework eklenmeyecektir.

```text
React 18.3
TypeScript 5.8
Vite 5.4
react-router-dom 7.x
Tailwind CSS 3.4
shadcn/ui + Radix UI
lucide-react
@tanstack/react-query 5
Supabase JS 2.101
react-hook-form + zod
Vitest + Playwright
next-themes
cmdk
```

`cmdk` zaten dependency olarak bulunduğu için command palette için yeni paket gerekmez.

## 3.2 Mevcut admin route alanları

Mevcut URL yapısı korunmalıdır. Admin yeniden yazımı URL değiştirme projesi değildir.

Ana route grupları:

```text
/admin
/admin/data
/admin/veritabani-tablolari
/admin/new-member/*
/admin/referral/*
/admin/approvals
/admin/audit-logs
/admin/whatsapp-landings/*
/admin/surveys/*
/admin/cadde
/admin/marquee
/admin/social-media
/admin/advisors/*
/admin/consulates
/admin/may19/*
/admin/workspace/*
/admin/muhasebe/*
/admin/about
```

## 3.3 Mevcut shell sorunları

Mevcut `src/components/admin/AdminLayout.tsx` birçok sorumluluğu aynı dosyada taşır:

- session dinleme,
- login formu,
- parola resetleme,
- admin erişim kontrolü,
- logout,
- desktop header navigasyonu,
- dropdown açık-kapalı state yönetimi,
- mobil link listesi,
- hardcoded güncelleme bildirimleri,
- route aktifliği,
- outlet render.

Bu nedenle shell yeni bir modül olarak ayrıştırılmalıdır.

Tespit edilen pratik problemler:

1. Masaüstü navigasyonu genişledikçe header kalabalıklaşır.
2. Hover tabanlı dropdown kullanımı hızlı olsa da keşfedilebilirlik düşüktür.
3. Mobil linkler desktop registry’den üretilmemekte, elle tekrar yazılmaktadır.
4. Yeni ekran eklenince farklı listeleri ayrı ayrı güncellemek gerekir.
5. Erişim reddi ekranında drop edilmiş eski `admin_users` tablosuna referans veren açıklama bulunur.
6. Güncellemeler header içinde hardcoded durmaktadır.
7. Sidebar olmadığı için kullanıcı bulunduğu modülün komşu ekranlarını kolay göremez.
8. Modüllerin derinleşmesi halinde üst menü ölçeklenemez.
9. Bazı sayfalarda ortak page shell yaklaşımı kullanılmakta, bazılarında doğrudan `div className="space-y-*"` ile ilerlenmektedir.
10. Görsel tutarlılık sayfa bazında değişmektedir.

## 3.4 Mevcut olumlu parçalar

Her şey çöpe atılmamalıdır. Korunacak ve geliştirilecek parçalar vardır:

- `/admin` landing ekranındaki renkli kart grid yaklaşımı değerlidir.
- `AdminPageLayout` ortak spacing fikrini başlatmıştır.
- `admin-navigation.ts` navigasyon verisini kısmen merkezileştirmiştir.
- Muhasebe modülündeki `routes.tsx` ve nested layout yaklaşımı iyi örnektir.
- AFS rebuild sonrasında backend veri modeli daha net hale gelmiştir.
- `src/lib/admin.ts` domain API dosyalarına ayrıştırılmış barrel yapıdadır.
- Tek Supabase client kullanımı tamamlanmıştır.
- React Query projede hazırdır.

Yeni tasarım bu parçaları olgunlaştıracaktır.

---

# 4. Kesinlikle Korunacak Teknik Kurallar

## 4.1 Canonical auth

Yeni kodda canonical auth hook kullanılmalıdır:

```ts
import { useAuth } from "@/components/auth/useAuth";
```

Yeni dosyalarda `@/contexts/AuthContext` shim kullanılmamalıdır.

Admin yetkisi için eski tablo okuması yapılmamalıdır:

```ts
userIsAdmin() -> is_admin() RPC
```

Erişim kontrolü ad-hoc tablo sorgularıyla yeniden yazılmamalıdır.

## 4.2 AFS rebuild gerçekliği

AFS = Attributes / Features / Sections.

Canonical tablolar:

```text
roles
afs_attributes
afs_features
afs_sections
role_attributes
role_features
role_sections
catalog_items
catalog_item_roles
catalog_item_attribute_values
catalog_item_claims
catalog_item_managers
user_role_assignments
user_profile_attributes
user_feature_overrides
```

Aşağıdaki eski isimler yeni frontend koduna girmemelidir:

```text
profiles
user_profiles
admin_users
role_feature_defaults
attribute_catalog
feature_catalog
profile_section_catalog
role_attribute_rules
role_feature_flags
role_profile_section_rules
catalog_item_attributes
catalog_claim_requests
catalog_item_memberships
catalog_item_types
```

## 4.3 URL güvenliği

Mevcut route path değerleri değiştirilmemelidir. Admin panelin görünür isimleri ve kategori düzeni değişebilir; URL’ler korunmalıdır.

## 4.4 Dokunulmayacak dosyalar

```text
src/integrations/supabase/client.ts
src/integrations/supabase/types.ts   # yalnızca supabase gen types ile üretilir
src/components/ui/*                  # shadcn generated
server.mjs
vite.config.ts
eski production migrationları
```

## 4.5 Yeni kod standardı

Yeni feature ve yeni shell kodunda:

```text
lib/*-api.ts + React Query hooks
```

kullanılmalıdır. Component içinde yeni `supabase.from()` çağrıları eklenmemelidir.

---

# 5. Hedef Kullanıcı Deneyimi

## 5.1 Genel deneyim

Panel açıldığında kullanıcı şu hissi almalıdır:

- Nereye gideceği nettir.
- En sık kullanılan işlemlere bir veya iki tıklamayla ulaşır.
- Renkli ancak kurumsal bir arayüz görür.
- Çok fazla menü öğesiyle aynı anda boğulmaz.
- İçinde bulunduğu modülü her zaman anlar.
- Mobilde masaüstünün kırpılmış haliyle değil, doğal bir mobil drawer ile çalışır.
- Yeni modül eklendiğinde layout bozulmaz.

## 5.2 Tasarım dili

Ana tasarım yaklaşımı:

```text
New-age operational dashboard
+ clean SaaS admin shell
+ CorteQS renkli global network ruhu
```

Renkli görünüm; her yüzeyi rastgele boyamak anlamına gelmez. Canvas nötr olmalı, renkler navigasyon, badge, ikon kutusu, accent çizgisi ve KPI kartlarında kontrollü kullanılmalıdır.

### Önerilen renk mantığı

```text
Overview / Genel Bakış        -> indigo / violet
Üyeler ve Dizin               -> sky / cyan
Roller ve AFS                 -> emerald / teal
Topluluklar                   -> rose / pink
İçerik ve Kampanyalar         -> amber / orange
Operasyon Workspace           -> slate / blue
Muhasebe                      -> green
Sistem ve Güvenlik            -> red / zinc
```

### Görsel kararlar

- Nötr arka plan: açık gri / beyaz katmanlar.
- Sidebar: hafif koyu veya yarı transparan açık yüzey.
- Aktif modül: accent sol çizgi + soft gradient background.
- Kart radius: `rounded-2xl` veya `rounded-[20px]`.
- Ana dashboard hero: hafif radial gradient.
- Büyük gölge yerine yumuşak shadow.
- Tablo ve veri ekranlarında renk azaltılır; okunabilirlik öne çıkar.
- Durum badge’leri semantik renklidir.
- Dark mode kırılmamalıdır.

---

# 6. Yeni Bilgi Mimarisi

## 6.1 Sidebar ana grupları

Yeni sidebar aşağıdaki sırayı kullanmalıdır.

### A. Genel Bakış

| Görünür isim | URL | Amaç |
|---|---|---|
| Genel Bakış | `/admin` | Yeni ana dashboard |
| Hızlı İşlemler | Dashboard içinde | En sık kullanılan aksiyonlar |

### B. Üyeler ve Dizin

| Görünür isim | URL | Amaç |
|---|---|---|
| Kayıt Veritabanı | `/admin/data` | Tüm katalog ve profil kayıtları |
| Kullanıcı Rol Atama | `/admin/new-member/profile-role-assignment` | Aynı sayfanın iş akışına özel girişi |
| Approval Queue | `/admin/approvals` | Bekleyen talepler |
| Feature Override | `/admin/new-member/overrides` | Kullanıcı bazlı istisnalar |
| Audit Logs | `/admin/audit-logs` | Kritik admin işlem geçmişi |

Not: `/admin/data` ve `/admin/new-member/profile-role-assignment` aynı component’i render etse bile sidebar içinde tek ana ekran gösterilebilir. İkinci URL backward compatibility için korunur. Gerekirse ana ekrandaki bir quick action ikinci URL’ye geçebilir.

### C. Roller ve AFS

| Görünür isim | URL | Amaç |
|---|---|---|
| AFS Genel Bakış | `/admin/new-member/roles-overview` | Roller ve entity genel bakış |
| Roller AFS Matrisi | `/admin/new-member/role-matrix` | Attribute / feature / section kuralları |
| Durum Raporu | `/admin/new-member/durum-raporu` | Canlı rebuild sağlığı |
| Veritabanı Tabloları | `/admin/veritabani-tablolari` | Teknik tablo görünümü |
| Sistem Kullanım Kılavuzu | `/admin/new-member/guide` | Admin rehberi |

### D. Topluluklar

| Görünür isim | URL | Amaç |
|---|---|---|
| Topluluk Landingleri | `/admin/whatsapp-landings` | Topluluk kayıtları |
| Topluluk Editörleri | `/admin/whatsapp-landings/editors` | Editor atama |
| Topluluk Kılavuzu | `/admin/whatsapp-landings/guide` | Akış rehberi |
| Diplomatik Profiller | `/admin/consulates` | Mevcut ekran korunur; kullanım gerçekliği ayrıca değerlendirilir |

### E. İçerik ve Kampanyalar

| Görünür isim | URL | Amaç |
|---|---|---|
| Cadde | `/admin/cadde` | Cadde yönetimi |
| Anketler | `/admin/surveys` | Survey CRUD ve cevaplar |
| Haber Bandı | `/admin/marquee` | Marquee yönetimi |
| Sosyal Medya | `/admin/social-media` | Sosyal medya bağlantıları |
| Sosyal Link Profilleri | `/admin/advisors/*` | Profil bazlı sosyal link içerikleri |
| 19 Mayıs İçerikleri | `/admin/may19/*` | Kampanya kayıtları; inactive alt grubunda gösterilebilir |

### F. Operasyon Workspace

| Görünür isim | URL | Amaç |
|---|---|---|
| Workspace | `/admin/workspace` | Workspace ana sayfası |
| Command Center | `/admin/workspace/command-center` | Todo ve koordinasyon |
| Dosyalar ve Linkler | `/admin/workspace/resources` | Kaynak merkezi |
| MVP Listesi | `/admin/workspace/mvp` | MVP takip |
| Dokümanlar | `/admin/workspace/docs/:slug` | Dinamik docs alt grubu |

### G. Muhasebe

| Görünür isim | URL | Amaç |
|---|---|---|
| Muhasebe Dashboard | `/admin/muhasebe` | KPI özet |
| Giderler | `/admin/muhasebe/giderler` | Gider CRUD |
| Gelirler | `/admin/muhasebe/gelirler` | Gelir CRUD |
| Nakit Akışı | `/admin/muhasebe/nakit-akisi` | Finansal akış |

Muhasebe modülü nested layout yaklaşımını korur.

### H. Sistem

| Görünür isim | URL | Amaç |
|---|---|---|
| Ürün Güncellemeleri | `/admin/about` | Güncellemeler |
| Dış Bağlantılar | Sidebar footer / command palette | Engine, Globe, Founders |
| Çıkış | User menu | Logout |

## 6.2 Sidebar davranışı

Desktop:

```text
>= 1280 px: 280 px geniş sidebar açık
1024–1279 px: 248 px sidebar açık
768–1023 px: collapsed icon sidebar veya drawer tercihi
< 768 px: sidebar gizli, hamburger ile Sheet açılır
```

Sidebar özellikleri:

- collapse / expand,
- kategori başlıkları,
- kategori açma-kapama,
- aktif route highlight,
- aktif child bulunan parent’ın açık gelmesi,
- badge alanları,
- tooltip,
- favorilere ekleme,
- mobil drawer,
- footer’da user ve external links.

## 6.3 Tek kaynaklı navigasyon registry

Tüm menüler tek kaynaktan üretilecektir.

Önerilen dosya:

```text
src/lib/admin-shell/admin-navigation-registry.ts
```

Örnek tip:

```ts
import type { LucideIcon } from "lucide-react";

export type AdminNavBadgeKind =
  | "approval-count"
  | "claim-count"
  | "system-warning"
  | "static";

export type AdminNavItem = {
  id: string;
  label: string;
  shortLabel?: string;
  description?: string;
  to?: string;
  href?: string;
  icon: LucideIcon;
  accent: AdminAccent;
  match?: string[];
  aliases?: string[];
  children?: AdminNavItem[];
  isExternal?: boolean;
  isInactive?: boolean;
  requiredAccess?: "admin" | "moderator";
  badge?: AdminNavBadgeKind;
};

export type AdminNavGroup = {
  id: string;
  label: string;
  icon?: LucideIcon;
  accent: AdminAccent;
  defaultOpen?: boolean;
  items: AdminNavItem[];
};
```

Bu registry aşağıdaki yüzeyleri beslemelidir:

```text
AdminSidebar
AdminMobileSidebar
AdminCommandPalette
AdminBreadcrumbs
AdminDashboard quick navigation
Favorites
Recent pages
```

Böylece route eklemek için altı ayrı liste güncellenmez.

---

# 7. Hedef Layout

## 7.1 Desktop wireframe

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Sidebar                 │ Utility Topbar                                    │
│                         │ [Breadcrumb]        [⌘K Ara] [Bildirim] [Profil]   │
│  CorteQS Admin          ├────────────────────────────────────────────────────┤
│  Global Network OS      │                                                    │
│                         │  Page Header                                       │
│  ◉ Genel Bakış          │  Başlık + açıklama                  [Aksiyonlar]   │
│                         │                                                    │
│  ÜYELER VE DİZİN        │  Optional KPI / Filter Bar                         │
│  ○ Kayıt Veritabanı     │                                                    │
│  ○ Approval Queue   [4] │  Main Content                                     │
│  ○ Feature Override     │  Table / cards / forms / detail panels            │
│                         │                                                    │
│  ROLLER VE AFS          │                                                    │
│  ○ AFS Genel Bakış      │                                                    │
│  ○ Roller AFS Matrisi   │                                                    │
│  ○ Durum Raporu         │                                                    │
│                         │                                                    │
│  ...                    │                                                    │
│                         │                                                    │
│  [Daralt]               │                                                    │
│  UBT · Admin            │                                                    │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 7.2 Mobil wireframe

```text
┌──────────────────────────────────┐
│ [☰] CorteQS Admin   [🔍] [Profil] │
├──────────────────────────────────┤
│ Genel Bakış > Approval Queue     │
│                                  │
│ Approval Queue                   │
│ Bekleyen talepleri yönet         │
│                                  │
│ [Filtre] [Ara]                   │
│                                  │
│ Card / responsive table          │
└──────────────────────────────────┘
```

Hamburger menüsü açıldığında desktop registry’den üretilen Sheet görünür. Ayrı `mobileMainLinks` listesi tutulmaz.

## 7.3 Topbar

Topbar ince ve operasyonel olmalıdır.

Sol taraf:

- mobil hamburger,
- breadcrumb,
- gerekiyorsa aktif modül badge.

Sağ taraf:

- global search butonu ve `Ctrl/Cmd + K`,
- bildirim merkezi,
- dark/light toggle,
- kullanıcı menüsü,
- logout.

Topbar içine çok sayıda işlev linki konulmamalıdır.

## 7.4 Breadcrumb

Örnekler:

```text
Genel Bakış
Üyeler ve Dizin > Kayıt Veritabanı
Roller ve AFS > Roller AFS Matrisi
Operasyon Workspace > Command Center
Muhasebe > Nakit Akışı
```

Breadcrumb registry üzerinden otomatik çözülmelidir.

## 7.5 Command palette

`cmdk` ile oluşturulmalıdır.

Kısayol:

```text
Ctrl + K
Cmd + K
```

Arama alanları:

- label,
- alias,
- description,
- grup adı,
- URL,
- mevcut hızlı işlemler.

Örnek aramalar:

```text
rol
feature
override
veritabanı
muhasebe
anket
todo
claim
approval
```

Sonuçlar kategori bazlı gruplanmalıdır.

---

# 8. Yeni Dashboard Tasarımı

Mevcut renkli kart landing çalışması tamamen silinmemeli; daha işlevsel bir operasyon dashboard’una dönüştürülmelidir.

## 8.1 Dashboard blokları

### A. Welcome hero

İçerik:

```text
Günaydın, Umut Barış
CorteQS operasyon merkezine hoş geldin.
Bugün dikkat isteyen 4 approval, 2 sistem uyarısı ve 8 açık todo bulunuyor.
```

İlk sürümde kişisel isim güvenilir şekilde gelmiyorsa email kullanılabilir.

### B. KPI strip

Örnek kartlar:

```text
Toplam katalog kaydı
Aktif roller
Bekleyen approval
Feature override sayısı
Açık workspace todo
Son 24 saatte audit log
AFS sağlık durumu
```

İlk etapta bütün KPI’lar zorunlu değildir. Veri güvenilir şekilde alınabilen metriklerle başlanmalıdır.

### C. Dikkat isteyenler

Öncelik sırasına göre:

```text
Approval Queue bekleyen kayıtlar
Primary rolü olmayan katalog item sayısı
Sistem sağlık uyarıları
Açık workspace todo
Güncel olmayan doküman / migration uyarıları
```

### D. Hızlı işlemler

```text
Kayıt ara
Approval Queue aç
AFS matrisi aç
Feature override tanımla
Topluluk landinglerini aç
Command Center aç
Yeni anket oluştur
Gider ekle
```

### E. Modül kartları

Mevcut renkli grid daha kontrollü biçimde korunur. Her ana grup için bir modül kartı kullanılır. Her route için ayrı büyük kart üretmek yerine modül kartı içinde 3–5 hızlı child link sunulur.

### F. Son kullanılanlar

İlk etapta localStorage yeterlidir:

```text
corteqs.admin.recent-pages.v1
```

Son kullanılan maksimum 8 ekran gösterilir.

### G. Favoriler

İlk etapta localStorage yeterlidir:

```text
corteqs.admin.favorite-pages.v1
```

Backend migration gerekmez.

## 8.2 Dashboard veri yaklaşımı

### İlk sürüm

Mevcut RPC ve tablolardan okunabilen güvenli metrikler kullanılır.

Yeni kod:

```text
src/lib/admin-shell/admin-dashboard-api.ts
src/hooks/admin/useAdminDashboardSummary.ts
```

### İkinci sürüm — opsiyonel

Çok sayıda istek oluşursa tek RPC eklenebilir:

```sql
get_admin_dashboard_summary()
```

Bu RPC sadece admin için çalışmalı ve aşağıdaki JSON’u döndürmelidir:

```json
{
  "catalogItems": 239,
  "activeRoles": 76,
  "pendingApprovals": 4,
  "featureOverrides": 12,
  "openTodos": 8,
  "recentAuditLogs": 14,
  "itemsWithoutPrimaryRole": 0,
  "systemWarnings": 0
}
```

İlk shell teslimi bu RPC’ye bağımlı yapılmamalıdır.

---

# 9. Ortak Page Shell Standardı

Tüm admin sayfaları aynı görsel dile kademeli olarak geçirilmelidir.

## 9.1 Yeni temel bileşen

```text
src/components/admin/page/AdminPageShell.tsx
```

Önerilen API:

```ts
type AdminPageShellProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: LucideIcon;
  accent?: AdminAccent;
  breadcrumbs?: AdminBreadcrumb[];
  actions?: ReactNode;
  stats?: ReactNode;
  filters?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  contentWidth?: "wide" | "default" | "narrow";
};
```

Kullanım:

```tsx
<AdminPageShell
  title="Approval Queue"
  description="Bekleyen talepleri incele, onayla veya reddet."
  icon={ClipboardList}
  accent="sky"
  actions={<RefreshButton />}
  filters={<ApprovalFilters />}
>
  <ApprovalList />
</AdminPageShell>
```

## 9.2 Alt bileşenler

```text
AdminPageHeader
AdminPageActions
AdminFilterBar
AdminStatsGrid
AdminEmptyState
AdminLoadingState
AdminErrorState
AdminSectionCard
AdminDataTableShell
AdminDetailDrawer
AdminStatusBadge
AdminJsonDiffViewer
AdminGuidePanel
```

## 9.3 Veri yoğun sayfalar

`AdminCatalogPage`, `AdminAuditLogsPage`, `AdminApprovalsPage`, `AdminUserOverridesPage`, `AdminRoleManagementPage` gibi ekranlar yeni page shell’e öncelikli geçirilecektir.

### Ortak davranışlar

- sticky filter bar,
- responsive toolbar,
- empty state,
- loading skeleton,
- error state,
- pagination,
- detail drawer,
- URL query param senkronizasyonu,
- semantik badge,
- destructive aksiyonlarda confirmation dialog,
- filtre sıfırlama,
- mobil kart görünümü veya yatay scroll tablo.

---

# 10. Yeni Klasör Yapısı

Önerilen yapı:

```text
src/
├── components/
│   └── admin/
│       ├── shell/
│       │   ├── AdminShell.tsx
│       │   ├── AdminAccessGate.tsx
│       │   ├── AdminSidebar.tsx
│       │   ├── AdminSidebarGroup.tsx
│       │   ├── AdminSidebarItem.tsx
│       │   ├── AdminMobileSidebar.tsx
│       │   ├── AdminTopbar.tsx
│       │   ├── AdminBreadcrumbs.tsx
│       │   ├── AdminCommandPalette.tsx
│       │   ├── AdminNotificationsMenu.tsx
│       │   ├── AdminUserMenu.tsx
│       │   ├── AdminExternalLinksMenu.tsx
│       │   ├── AdminShellLoading.tsx
│       │   └── index.ts
│       ├── page/
│       │   ├── AdminPageShell.tsx
│       │   ├── AdminPageHeader.tsx
│       │   ├── AdminFilterBar.tsx
│       │   ├── AdminStatsGrid.tsx
│       │   ├── AdminEmptyState.tsx
│       │   ├── AdminLoadingState.tsx
│       │   ├── AdminErrorState.tsx
│       │   ├── AdminDetailDrawer.tsx
│       │   ├── AdminStatusBadge.tsx
│       │   └── index.ts
│       └── dashboard/
│           ├── AdminDashboardHero.tsx
│           ├── AdminDashboardKpis.tsx
│           ├── AdminAttentionQueue.tsx
│           ├── AdminQuickActions.tsx
│           ├── AdminModuleGrid.tsx
│           ├── AdminRecentPages.tsx
│           └── AdminFavorites.tsx
├── hooks/
│   └── admin/
│       ├── useAdminAccess.ts
│       ├── useAdminNavigation.ts
│       ├── useAdminBreadcrumbs.ts
│       ├── useAdminCommandPalette.ts
│       ├── useAdminSidebarState.ts
│       ├── useAdminRecentPages.ts
│       ├── useAdminFavorites.ts
│       └── useAdminDashboardSummary.ts
├── lib/
│   └── admin-shell/
│       ├── admin-shell-types.ts
│       ├── admin-navigation-registry.ts
│       ├── admin-route-meta.ts
│       ├── admin-dashboard-api.ts
│       ├── admin-storage.ts
│       └── admin-navigation-utils.ts
└── pages/
    └── admin/
        ├── dashboard/
        │   └── AdminDashboardPage.tsx
        └── routes.tsx
```

## 10.1 Eski dosyalarla uyumluluk

`src/components/admin/AdminLayout.tsx` tamamen silinmek zorunda değildir. İlk aşamada compatibility wrapper olabilir:

```tsx
export { default } from "@/components/admin/shell/AdminShell";
export { useAdminOutletContext } from "@/components/admin/shell/AdminShell";
```

Bu yaklaşım import kırılma riskini azaltır.

`AdminPageLayout.tsx` de ilk aşamada compatibility wrapper olarak tutulabilir:

```tsx
export function AdminPageLayout({ children, className = "" }: Props) {
  return <div className={cn("w-full", className)}>{children}</div>;
}
```

Yeni sayfalarda doğrudan `AdminPageShell` kullanılmalıdır.

---

# 11. Shell Bileşenlerinin Ayrıntılı Spesifikasyonu

## 11.1 `AdminShell.tsx`

Sorumlulukları:

- `AdminAccessGate` üzerinden erişim doğrulama,
- layout grid oluşturma,
- sidebar state,
- topbar,
- command palette,
- outlet context,
- route değişiminde recent pages kaydı.

Yapmaması gerekenler:

- doğrudan Supabase auth event yönetimi,
- login form state’i,
- navigasyon verisini kendi içinde tanımlamak,
- hardcoded bildirim içeriği taşımak,
- page-specific veri çekmek.

Örnek yapı:

```tsx
export default function AdminShell() {
  const { session, logout } = useAdminAccess();
  const sidebar = useAdminSidebarState();

  return (
    <AdminAccessGate>
      <div className="min-h-screen bg-admin-canvas">
        <AdminSidebar collapsed={sidebar.collapsed} />
        <div className={cn("transition-[padding]", sidebar.contentClassName)}>
          <AdminTopbar />
          <main className="min-h-[calc(100vh-64px)] p-4 md:p-6 xl:p-8">
            <Outlet context={{ session, onLogout: logout }} />
          </main>
        </div>
        <AdminCommandPalette />
      </div>
    </AdminAccessGate>
  );
}
```

## 11.2 `AdminAccessGate.tsx`

Erişim durumları ayrı ayrı ele alınmalıdır:

```text
loading session
not authenticated
checking admin access
authenticated but not admin
authorized
error
```

Erişim reddi ekranında eski `admin_users` ifadesi kesinlikle yer almamalıdır.

Doğru mesaj örneği:

```text
Bu hesabın yönetici yetkisi bulunmuyor.
Yönetici erişimi kullanıcı rol atamaları ve güvenli is_admin() kontrolü üzerinden doğrulanır.
Yetkiniz olduğunu düşünüyorsanız sistem yöneticisiyle iletişime geçin.
```

## 11.3 `AdminSidebar.tsx`

Kurallar:

- registry map edilir,
- aktif group otomatik açılır,
- collapse state localStorage’a yazılır,
- scroll area kullanılır,
- en üstte logo ve environment etiketi bulunur,
- alt kısımda external links ve user menu bulunur,
- gizli/inactive linkler ayrı alt bölümde yer alır.

LocalStorage key:

```text
corteqs.admin.sidebar.collapsed.v1
```

## 11.4 `AdminTopbar.tsx`

Topbar sabit olabilir:

```text
sticky top-0 z-30
```

İçerik:

- mobile sidebar trigger,
- breadcrumbs,
- `Ctrl K` search trigger,
- notifications,
- theme switch,
- user menu.

## 11.5 `AdminCommandPalette.tsx`

- `cmdk` kullanır.
- registry’den sonuç üretir.
- keyboard erişilebilirliği korunur.
- external link ve internal route ayrımı yapılır.
- son kullanılanlar ilk blokta gösterilir.
- item tıklandığında dialog kapanır.

## 11.6 `AdminNotificationsMenu.tsx`

İlk sürüm:

- hardcoded release notes yerine bir placeholder panel,
- approval ve sistem uyarıları gibi dinamik badge kaynaklarına bağlantı,
- `/admin/about` linki.

Hardcoded iki notification shell içine gömülmemelidir.

İkinci sürüm opsiyonu:

```text
admin_notifications
```

veya var olan güncelleme içeriğini yöneten uygun bir kaynak kullanılabilir.

---

# 12. Route Modülerizasyonu

## 12.1 Amaç

`App.tsx` route tablosu çalışmaya devam etse de admin route grubu ayrı dosyaya çıkarılmalıdır.

Önerilen dosya:

```text
src/pages/admin/routes.tsx
```

Muhasebe modülü örnek alınmalıdır.

## 12.2 Örnek

```tsx
import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";
import { muhasebeRoutes } from "@/pages/admin/muhasebe/routes";

const AdminDashboardPage = lazy(() => import("./dashboard/AdminDashboardPage"));
const AdminCatalogPage = lazy(() => import("./AdminCatalogPage"));
// ...

export const adminRoutes = (
  <Route path="/admin" element={<AdminLayout />}>
    <Route index element={<AdminDashboardPage />} />
    <Route path="data" element={<AdminCatalogPage />} />
    // mevcut path değerleri korunur
    {muhasebeRoutes}
  </Route>
);
```

`App.tsx` içinde:

```tsx
{adminRoutes}
```

## 12.3 Kural

Route modülerizasyonu sırasında:

- path değerleri değişmez,
- redirect’ler korunur,
- lazy loading korunur,
- wildcard davranışı korunur,
- public SEO route’larına dokunulmaz.

---

# 13. Veri Katmanı ve React Query Standardı

Admin V2 shell yeniden yazımına paralel olarak yeni kodda veri erişimi standardize edilmelidir.

## 13.1 Yeni shell API dosyaları

```text
src/lib/admin-shell/admin-dashboard-api.ts
src/lib/admin-shell/admin-notifications-api.ts
src/lib/admin-shell/admin-navigation-utils.ts
```

## 13.2 Query key standardı

```ts
export const adminQueryKeys = {
  all: ["admin"] as const,
  dashboard: () => [...adminQueryKeys.all, "dashboard"] as const,
  approvals: (filters: ApprovalFilters) => [...adminQueryKeys.all, "approvals", filters] as const,
  auditLogs: (filters: AuditLogFilters) => [...adminQueryKeys.all, "audit-logs", filters] as const,
  catalog: (filters: CatalogFilters) => [...adminQueryKeys.all, "catalog", filters] as const,
};
```

## 13.3 Mutation sonrası invalidation

Örnek:

```ts
await mutation.mutateAsync(payload);
await queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard() });
await queryClient.invalidateQueries({ queryKey: adminQueryKeys.approvals(filters) });
```

## 13.4 Öncelikli refactor sayfaları

Shell bitince sırayla:

```text
1. AdminApprovalsPage
2. AdminAuditLogsPage
3. AdminUserOverridesPage
4. AdminRoleManagementPage
5. AdminCatalogPage
6. AdminDurumRaporuPage
```

Sebep: Bu sayfalarda direct data fetch, tekrarlı state, elle loading/error yönetimi veya büyük component sorumlulukları bulunmaktadır.

---

# 14. Sayfa Bazlı İyileştirme Tasarımları

## 14.1 Kayıt Veritabanı — `/admin/data`

Bu sayfa admin panelinin en önemli çalışma alanlarından biridir.

Hedef düzen:

```text
Page Header
KPI mini strip
Sticky Filter Bar
Table / compact list
Right Detail Drawer
```

Filtreler:

- arama,
- kayıt türü,
- rol,
- durum,
- doğrulama durumu,
- ülke,
- şehir,
- filtre temizle.

Detay drawer tabları:

```text
Özet
Attribute değerleri
Roller
Editörler
Claim talepleri
Audit geçmişi
```

Mobilde tablo yerine compact result cards kullanılabilir.

## 14.2 Approval Queue — `/admin/approvals`

Mevcut ham JSON odaklı görünüm daha operasyonel hale getirilmelidir.

Hedef düzen:

```text
Pending / Approved / Rejected tabs
Request type filter
Date / user filter
Card list
Right decision drawer
```

Her kart:

- kullanıcı,
- request tipi,
- hedef,
- oluşturma zamanı,
- status,
- kısa özet.

Drawer:

- payload pretty view,
- human-readable açıklama,
- admin notu,
- onayla,
- reddet,
- confirmation.

## 14.3 Audit Logs — `/admin/audit-logs`

Hedef düzen:

```text
Filter bar
Compact log table
Expandable diff rows veya detail drawer
Before / after JSON diff viewer
```

Öneri:

- raw JSON her kartta sürekli açık olmamalı,
- satır detayına tıklanınca diff açılmalı,
- renkli eklenen/silinen alan vurgusu yapılmalı,
- actor / target / action / date kolonları öne çıkarılmalı.

## 14.4 Feature Override — `/admin/new-member/overrides`

Hedef düzen:

```text
Sol: yeni override formu
Sağ: override tablosu
Üst: rehber drawer veya info popover
```

İyileştirmeler:

- kullanıcı araması,
- feature araması,
- rol scope badge,
- override nedenini zorunlu hale getirme seçeneği,
- kaldırma confirmation,
- filtreler,
- “sadece aktif override” seçeneği.

## 14.5 Roller AFS Matrisi — `/admin/new-member/role-matrix`

Bu sayfa geniş ekran ağırlıklı bir power-user ekranıdır.

Hedef düzen:

```text
Sticky page header
Sticky role selector
Sticky catalog type filter
Horizontal scroll matrix
Legend drawer
Save / unsaved state göstergesi
```

Kurallar:

- masaüstü öncelikli,
- mobilde readonly özet + yatay scroll,
- legend sürekli büyük alan kaplamamalı; açılır yardım paneline alınabilir,
- URL query param ile seçili rol korunmalıdır.

## 14.6 Durum Raporu — `/admin/new-member/durum-raporu`

Mevcut canlı metrik mantığı korunmalıdır.

İyileştirmeler:

- overview health card,
- metric kategori grupları,
- warning list,
- son refresh zamanı,
- manuel refresh,
- sistem sağlık badge’inin dashboard’a taşınması.

## 14.7 Workspace

Workspace kendi alt navigasyonuna sahip olabilir ancak ana sidebar ile çakışmamalıdır.

Öneri:

- sidebar ana navigation,
- page içinde yatay sub-navigation,
- docs listesi sidebar altında dinamik alt grup veya workspace sayfasında docs browser.

## 14.8 Muhasebe

Mevcut nested route ve tabs yaklaşımı korunmalıdır. Yeni shell içinde çalışması yeterlidir.

İyileştirme:

- Muhasebe sidebar parent item açıldığında child linkler görülebilir.
- Page içi tabs korunabilir.
- Duplicate navigasyon rahatsız ederse ikinci fazda page içi tabs sadeleştirilebilir.

---

# 15. Responsive Kurallar

## 15.1 Breakpoint hedefleri

```text
Mobile:    360–767
Tablet:    768–1023
Desktop:   1024–1439
Wide:      1440+
```

## 15.2 Mobil kuralları

- Sidebar Sheet ile açılır.
- Mobilde ayrı hardcoded link listesi kullanılmaz.
- Topbar tek satır kalır.
- Breadcrumb gerektiğinde kısalır.
- Tables horizontal scroll veya cards olur.
- Detail panel Sheet olarak açılır.
- Form action bar altta sticky olabilir.
- Butonlar minimum 44 px touch hedefi sunar.

## 15.3 Desktop kuralları

- Sidebar sabittir.
- İçerik genişliği tablo ekranlarında `wide`, form ekranlarında `default`, doküman ekranlarında `narrow` olabilir.
- Filtre bar gerektiğinde sticky olur.
- Drawer desktopta sağ panel olarak açılır.

---

# 16. Accessibility Standardı

Zorunlu kriterler:

```text
[ ] Sidebar klavye ile gezilebilir
[ ] Command palette klavye ile tamamen kullanılabilir
[ ] Focus görünür
[ ] Icon-only butonlarda aria-label var
[ ] Active link aria-current ile işaretli
[ ] Sheet ve dialog focus trap çalışıyor
[ ] Color tek anlam taşıyan işaret değil; metin veya ikon eşlik ediyor
[ ] Kontrast yeterli
[ ] Reduced motion dikkate alınıyor
[ ] Mobil touch hedefleri yeterli
```

---

# 17. Aşamalı Uygulama Planı

## Faz 0 — Baseline ve güvenlik ağı

Amaç: Yeniden yazım öncesi mevcut davranışı sabitlemek.

Görevler:

```text
[ ] npm run verify:text
[ ] npm run lint
[ ] npm run test
[ ] npm run build
[ ] mevcut admin route listesini snapshot dokümanına yaz
[ ] mevcut admin ekranları için Playwright smoke testi hazırla
[ ] kırık veya pre-existing testleri ayrı raporla
```

Çıktı:

```text
docs/plans/admin-v2/00-baseline-report.md
```

## Faz 1 — Registry ve route metadata

Amaç: Navigasyon bilgisini tek kaynağa geçirmek.

Yeni dosyalar:

```text
src/lib/admin-shell/admin-shell-types.ts
src/lib/admin-shell/admin-navigation-registry.ts
src/lib/admin-shell/admin-navigation-utils.ts
src/lib/admin-shell/admin-route-meta.ts
```

Görevler:

```text
[ ] mevcut admin-navigation.ts içeriğini audit et
[ ] tüm görünür route’ları registry’ye taşı
[ ] redirect-only route’ları visible navigation’dan ayır
[ ] external links’i registry’ye taşı
[ ] advisorProfileSections ve workspaceDocPages dinamik child olarak bağla
[ ] route matching util yaz
[ ] breadcrumb util yaz
[ ] registry unit test yaz
```

Kabul kriteri:

```text
Registry’de görünen tüm internal URL’ler App route ağacında geçerli.
Desktop, mobile ve command palette aynı registry’yi kullanabilecek durumda.
```

## Faz 2 — Access gate ve yeni shell

Amaç: `AdminLayout.tsx` sorumluluklarını ayırmak.

Yeni dosyalar:

```text
src/hooks/admin/useAdminAccess.ts
src/components/admin/shell/AdminAccessGate.tsx
src/components/admin/shell/AdminShell.tsx
src/components/admin/shell/AdminShellLoading.tsx
```

Görevler:

```text
[ ] login / reset / logout akışını access hook ve gate içine taşı
[ ] admin kontrolünde userIsAdmin() kullan
[ ] stale admin_users mesajını kaldır
[ ] Outlet context uyumluluğunu koru
[ ] compatibility wrapper oluştur
```

Kabul kriteri:

```text
Admin kullanıcı /admin açabilir.
Admin olmayan kullanıcı doğru erişim reddi ekranını görür.
Login, reset, logout çalışır.
Eski admin_users tablosuna referans yoktur.
```

## Faz 3 — Sidebar, topbar ve mobile drawer

Amaç: Yeni layout’un ana deneyimini teslim etmek.

Yeni dosyalar:

```text
AdminSidebar.tsx
AdminSidebarGroup.tsx
AdminSidebarItem.tsx
AdminMobileSidebar.tsx
AdminTopbar.tsx
AdminBreadcrumbs.tsx
AdminUserMenu.tsx
AdminExternalLinksMenu.tsx
useAdminSidebarState.ts
useAdminBreadcrumbs.ts
```

Görevler:

```text
[ ] desktop sidebar
[ ] collapse state
[ ] mobile Sheet
[ ] route active state
[ ] breadcrumbs
[ ] user menu
[ ] external links
[ ] theme toggle
[ ] mevcut dropdown header navigasyonunu kaldır
[ ] mobileMainLinks tekrarını kaldır
```

Kabul kriteri:

```text
Tüm ana admin ekranlarına sidebar ile ulaşılır.
Mobilde aynı registry Sheet içinde görünür.
URL değişikliği yoktur.
```

## Faz 4 — Command palette, favoriler ve recent pages

Amaç: Hızlı kullanım.

Yeni dosyalar:

```text
AdminCommandPalette.tsx
AdminFavorites.tsx
AdminRecentPages.tsx
useAdminCommandPalette.ts
useAdminFavorites.ts
useAdminRecentPages.ts
admin-storage.ts
```

Görevler:

```text
[ ] Ctrl/Cmd + K
[ ] registry search
[ ] alias search
[ ] recent pages localStorage
[ ] favorites localStorage
[ ] dashboard widget’ları
```

Kabul kriteri:

```text
Kullanıcı klavyeyle “override” yazıp doğru ekrana gidebilir.
Favoriler refresh sonrasında korunur.
Son kullanılan ekranlar çalışır.
```

## Faz 5 — Yeni dashboard

Amaç: `/admin` ekranını operasyon merkezine dönüştürmek.

Yeni dosyalar:

```text
src/pages/admin/dashboard/AdminDashboardPage.tsx
src/components/admin/dashboard/*
src/lib/admin-shell/admin-dashboard-api.ts
src/hooks/admin/useAdminDashboardSummary.ts
```

Görevler:

```text
[ ] welcome hero
[ ] KPI kartları
[ ] dikkat isteyenler
[ ] hızlı işlemler
[ ] modül kartları
[ ] favoriler
[ ] son kullanılanlar
[ ] loading / error state
```

Kabul kriteri:

```text
Dashboard yalnızca link grid değildir; operasyonel özet sunar.
Backend metrik bulunamazsa graceful fallback gösterir.
```

## Faz 6 — Ortak page shell

Amaç: Sayfalarda tutarlı görünüm.

Yeni dosyalar:

```text
src/components/admin/page/*
```

Öncelikli geçiş:

```text
[ ] AdminApprovalsPage
[ ] AdminAuditLogsPage
[ ] AdminUserOverridesPage
[ ] AdminDurumRaporuPage
[ ] AdminRoleManagementPage
[ ] AdminCatalogPage
```

Kabul kriteri:

```text
Başlık, açıklama, action, filter, empty, loading ve error davranışları tutarlı.
```

## Faz 7 — Admin route modülerizasyonu

Amaç: App.tsx sadeleştirme.

Yeni dosya:

```text
src/pages/admin/routes.tsx
```

Görevler:

```text
[ ] admin lazy importlarını routes.tsx içine al
[ ] redirectleri koru
[ ] muhasebeRoutes entegrasyonunu koru
[ ] App.tsx içindeki admin ağacını {adminRoutes} ile değiştir
```

Kabul kriteri:

```text
Tüm eski URL’ler aynı sonucu verir.
```

## Faz 8 — Veri erişim standardizasyonu

Amaç: Yeni shell sonrasında kritik admin ekranlarının clean-code iyileştirmesi.

Görevler:

```text
[ ] Approvals API + React Query hook
[ ] Audit Logs API + React Query hook
[ ] Overrides API + React Query hook
[ ] Role Matrix API + React Query hook
[ ] Catalog query’lerini gözden geçir
[ ] mutations sonrası invalidation
```

Bu faz işlevsel davranışı değiştirmemelidir.

## Faz 9 — E2E, visual QA ve temizlik

Görevler:

```text
[ ] old header dropdown kodunu kaldır
[ ] old mobileMainLinks listesini kaldır
[ ] dead imports kaldır
[ ] lint
[ ] unit tests
[ ] Playwright smoke
[ ] build
[ ] verify:release
[ ] responsive visual QA
[ ] dark mode QA
[ ] final report
```

---

# 18. Dosya Bazlı Yapılacaklar

## 18.1 İlk etapta değişecek dosyalar

```text
src/components/admin/AdminLayout.tsx
src/components/admin/admin-navigation.ts
src/pages/admin/AdminHomePage.tsx
src/App.tsx
```

## 18.2 Yeni dosyalar

```text
src/components/admin/shell/*
src/components/admin/page/*
src/components/admin/dashboard/*
src/hooks/admin/*
src/lib/admin-shell/*
src/pages/admin/dashboard/AdminDashboardPage.tsx
src/pages/admin/routes.tsx
```

## 18.3 Sonraki etapta refactor edilecek ekranlar

```text
src/pages/admin/AdminApprovalsPage.tsx
src/pages/admin/AdminAuditLogsPage.tsx
src/pages/admin/AdminUserOverridesPage.tsx
src/pages/admin/AdminRoleManagementPage.tsx
src/pages/admin/AdminCatalogPage.tsx
src/pages/admin/AdminDurumRaporuPage.tsx
```

## 18.4 Korunacak mevcut iyi örnek

```text
src/pages/admin/muhasebe/routes.tsx
src/pages/admin/muhasebe/MuhasebeLayout.tsx
src/lib/admin.ts
src/lib/admin/*
src/integrations/supabase/client.ts
```

---

# 19. Test Planı

## 19.1 Unit testler

### Registry

```text
[ ] ID’ler unique
[ ] internal `to` değerleri unique veya bilinçli alias
[ ] external item’larda href var
[ ] görünür parent item’ın icon’u var
[ ] breadcrumb doğru çözülüyor
[ ] route matching doğru çalışıyor
[ ] inactive item aktif gruba karışmıyor
```

### Storage hooks

```text
[ ] sidebar collapsed state persist
[ ] favorites add/remove
[ ] duplicate favorite oluşmaz
[ ] recent pages maksimum 8 kayıt
[ ] bozuk localStorage JSON graceful fallback
```

### Access gate

```text
[ ] unauthenticated -> login
[ ] authenticated admin -> shell
[ ] authenticated non-admin -> denied
[ ] is_admin RPC error -> error state
[ ] logout -> login
```

### Command palette

```text
[ ] Ctrl+K açıyor
[ ] Cmd+K açıyor
[ ] alias ile buluyor
[ ] route’a navigate ediyor
[ ] external link doğru davranıyor
```

## 19.2 Playwright E2E smoke senaryoları

```text
E2E-ADMIN-001 Admin login
E2E-ADMIN-002 Admin olmayan kullanıcı erişim reddi
E2E-ADMIN-003 Sidebar ile katalog ekranına geçiş
E2E-ADMIN-004 Sidebar collapse ve refresh persistence
E2E-ADMIN-005 Mobile drawer açma ve navigation
E2E-ADMIN-006 Ctrl+K ile Feature Override açma
E2E-ADMIN-007 Breadcrumb görünümü
E2E-ADMIN-008 Dashboard quick action
E2E-ADMIN-009 Approval Queue yüklenmesi
E2E-ADMIN-010 Audit Logs yüklenmesi
E2E-ADMIN-011 AFS matrisi role query param korunması
E2E-ADMIN-012 Muhasebe nested route geçişleri
E2E-ADMIN-013 Workspace nested route geçişleri
E2E-ADMIN-014 Logout
```

## 19.3 Visual QA matrisi

```text
Chrome desktop 1440x900
Chrome desktop 1920x1080
Chrome responsive 1024x768
iPad portrait
iPhone 390x844
Android 360x800
Light mode
Dark mode
Sidebar açık
Sidebar daraltılmış
Uzun Türkçe label
Boş veri
Loading
API hata
```

---

# 20. Definition of Done

Admin Panel V2 tamamlanmış sayılmak için:

```text
[ ] Desktop sidebar çalışıyor
[ ] Mobile sidebar aynı registry’den üretiliyor
[ ] Header dropdown navigasyonu kaldırıldı
[ ] mobileMainLinks tekrar listesi kaldırıldı
[ ] Breadcrumb çalışıyor
[ ] Command palette çalışıyor
[ ] Favorites ve recent pages çalışıyor
[ ] Yeni dashboard operasyonel özet sunuyor
[ ] Erişim reddi ekranında admin_users referansı yok
[ ] Canonical is_admin() akışı korunuyor
[ ] Mevcut admin route URL’leri korunuyor
[ ] Public SEO route’larına dokunulmadı
[ ] Yeni kodda eski AFS tablo isimleri kullanılmadı
[ ] Yeni shell kodu component içi Supabase sorgusu eklemiyor
[ ] lint sonucu raporlandı
[ ] unit test sonucu raporlandı
[ ] Playwright smoke sonucu raporlandı
[ ] build sonucu raporlandı
[ ] responsive QA yapıldı
[ ] dark mode QA yapıldı
[ ] final changed-files raporu üretildi
```

---

# 21. Riskler ve Önlemler

## Risk 1 — Route kaybı

**Önlem:** Route registry ve App route snapshot karşılaştırması yazılmalıdır.

## Risk 2 — Admin auth kırılması

**Önlem:** Access gate davranışı shell’den önce testlenmelidir. `userIsAdmin()` korunmalıdır.

## Risk 3 — Mobilde link eksikliği

**Önlem:** Mobil sidebar ayrı link listesi taşımamalı, aynı registry’den üretilmelidir.

## Risk 4 — UI refactor sırasında fonksiyon kaybı

**Önlem:** Önce shell, sonra page shell, sonra data layer refactor. Hepsi tek PR’a yığılmamalıdır.

## Risk 5 — Büyük component yeniden oluşması

**Önlem:** Shell alt bileşenleri ayrı dosyada olmalıdır. `AdminShell.tsx` hedefi yaklaşık 150–220 satırdır.

## Risk 6 — AFS legacy isimlerinin geri gelmesi

**Önlem:** CI grep kontrolü eklenebilir:

```bash
rg "profiles|user_profiles|admin_users|attribute_catalog|feature_catalog|profile_section_catalog|role_attribute_rules|role_feature_flags|role_profile_section_rules|catalog_item_attributes|catalog_claim_requests|catalog_item_memberships" src
```

Sonuç yalnızca bilinçli açıklama veya test fixture ise değerlendirilmelidir.

## Risk 7 — Dashboard metrik sorgu yükü

**Önlem:** İlk sürümde minimal query; gerekirse sonra tek admin RPC.

---

# 22. PR Stratejisi

Tek dev PR önerilmez. Aşağıdaki PR dizisi kullanılmalıdır:

```text
PR-01 admin-v2: add registry and navigation utilities
PR-02 admin-v2: extract access gate and shell foundation
PR-03 admin-v2: add sidebar, topbar and mobile drawer
PR-04 admin-v2: add command palette, favorites and recents
PR-05 admin-v2: replace admin landing with operational dashboard
PR-06 admin-v2: introduce shared page shell and migrate critical pages
PR-07 admin-v2: modularize admin routes
PR-08 admin-v2: migrate critical admin data hooks to React Query
PR-09 admin-v2: cleanup, e2e, responsive and release verification
```

Her PR sonunda:

```text
npm run verify:text
npm run lint
npm run test
npm run build
```

çalıştırılmalı ve sonuç raporlanmalıdır.

---

# 23. Claude Code İçin Uygulama Talimatı

Aşağıdaki metin Claude Code’a doğrudan verilebilir.

```text
CorteQS projesindeki /admin panelini Admin Panel V2 olarak yeniden yazacağız.

Önce şu dosyaları oku:
- CLAUDE.md
- docs/AGENT_CONTEXT.md
- docs/architecture/AI_TECHNICAL_REFERENCE.md
- docs/plans/2026-06-10-admin-panel-v2-masterplan.md
- src/components/admin/AdminLayout.tsx
- src/components/admin/admin-navigation.ts
- src/pages/admin/AdminHomePage.tsx
- src/App.tsx
- src/pages/admin/muhasebe/routes.tsx
- src/lib/admin/admin-access-api.ts

Kurallar:
1. Mevcut admin URL path değerlerini değiştirme.
2. Public SEO route’larına dokunma.
3. Eski tabloları kullanma: profiles, user_profiles, admin_users, role_feature_defaults ve eski AFS isimleri yasaktır.
4. Admin kontrolünde canonical userIsAdmin() -> is_admin() RPC akışını koru.
5. Yeni kodda @/components/auth/useAuth kullan. @/contexts/AuthContext shim’e yeni import ekleme.
6. src/integrations/supabase/client.ts, generated types.ts, src/components/ui/*, server.mjs ve vite.config.ts dosyalarını gereksiz yere değiştirme.
7. Component içine yeni Supabase sorgusu yazma. Yeni veri erişimi için lib/*-api.ts + React Query hook yaklaşımı kullan.
8. Mobil için ayrı hardcoded menü listesi üretme. Desktop, mobile, dashboard, breadcrumb ve command palette aynı registry’den beslenmeli.
9. Büyük tek dosya oluşturma. Shell’i alt bileşenlere ayır.
10. Her faz sonunda verify:text, lint, test ve build sonuçlarını raporla.

Önce sadece Faz 0 ve Faz 1’i uygula:
- baseline raporu oluştur,
- mevcut admin route envanterini çıkar,
- src/lib/admin-shell/admin-shell-types.ts oluştur,
- src/lib/admin-shell/admin-navigation-registry.ts oluştur,
- src/lib/admin-shell/admin-navigation-utils.ts oluştur,
- src/lib/admin-shell/admin-route-meta.ts oluştur,
- registry testlerini yaz,
- henüz mevcut AdminLayout görünümünü değiştirme.

İş bitiminde:
- değişen dosyaları listele,
- yeni registry yapısını açıkla,
- tüm test komutlarının sonucunu yaz,
- bir sonraki fazda yapılacakları madde madde yaz.
```

---

# 24. Son Not

Bu proje için doğru çözüm yalnızca “daha güzel bir menü” değildir. CorteQS admin alanı artık katalog, roller, AFS, topluluklar, içerik, workspace ve muhasebe gibi ayrı iş alanlarını barındırmaktadır. Yeni tasarım bu büyümeyi kabul eden bir **Admin Operating System** yaklaşımıyla ele alınmalıdır.

İlk hedef; çalışan işlevleri bozmadan yeni shell’i oturtmak, navigasyonu tek kaynağa indirmek ve kullanıcıların panel içinde kaybolmasını engellemektir. Sonraki hedef; veri yoğun ekranları ortak page shell ve React Query standardına geçirerek bakım maliyetini azaltmaktır.
