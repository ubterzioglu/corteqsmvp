# CorteQS / corfin-mvp — Clean Code Refactor Master Prompt

Bu görevde kıdemli bir Software Architect, React Refactoring Specialist ve TypeScript Code Quality Engineer gibi davran.

Repo:

```text
https://github.com/corteqssocial-web/corfin-mvp
```

Bu çalışma yalnızca yüzeysel bir clean-code raporu hazırlama görevi değildir. Mevcut davranışı bozmadan, düşük riskli iyileştirmeleri gerçekten uygula; yüksek riskli değişiklikler için ise kanıtlı ve aşamalı bir refactor planı çıkar.

Ana hedefler:

1. Kod okunabilirliğini artırmak
2. Büyük dosyaları güvenli şekilde modülerleştirmek
3. Tekrarlanan kodu azaltmak
4. Veri erişimini standartlaştırmak
5. TypeScript type güvenliğini kademeli artırmak
6. Legacy compatibility yapılarını bilinçli biçimde azaltmak
7. Uygulamanın mevcut route, auth, admin ve build davranışlarını korumak
8. Refactor sonrasında test, lint ve build sonuçlarını doğrulamak

---

# 0. Kritik Çalışma Kuralları

Bu projede kapsamlı ama kontrollü refactor yap.

## 0.1 Mevcut Davranışı Koru

Aşağıdakileri değiştirme:

* Kullanıcıya görünen özellikler
* Mevcut route path değerleri
* Redirect davranışları
* Supabase tablo isimleri
* RPC isimleri
* Feature key değerleri
* Role key değerleri
* Auth akışının davranışı
* Admin erişim mantığı
* Public sayfa içerikleri
* İş kuralları
* SQL schema
* RLS policy değerleri
* Migration geçmişi
* Deployment davranışı

Clean-code refactor sırasında yeni ürün özelliği ekleme.

## 0.2 İlk Turda Dokunulmaması Gereken Alanlar

Aşağıdaki alanları ilk refactor turunda değiştirme:

```text
server.mjs
vite.config.ts
src/integrations/supabase/client.ts
src/integrations/supabase/types.ts
src/components/ui/*
supabase/migrations/*
info-*.html
lansman/index.html
```

Bu alanlarda sorun tespit edersen rapora yaz; fakat yalnızca ayrı ve açıkça gerekçelendirilmiş bir sonraki faz önerisi oluştur.

## 0.3 Silme Konusunda Katı Kural

Hiçbir dosyayı yalnızca import edilmediği için silme.

Özellikle:

* Route dosyaları runtime sırasında aktif olabilir.
* `info-*.html` dosyaları `vite.config.ts` içindeki özel plugin tarafından kullanılabilir.
* Migration dosyaları geçmiş kayıt niteliğindedir.
* Compatibility shim dosyaları eski import noktalarını destekliyor olabilir.
* Generated shadcn UI bileşenleri ayrı değerlendirilmelidir.
* Public asset dosyaları HTML içinde string olarak referans edilmiş olabilir.

Dosya silmeden önce import graph, route graph, string reference, build output ve runtime kullanımını doğrula.

## 0.4 Domain Terimlerini Koruma Kuralı

Türkçe domain terimlerini İngilizceleştirme veya rename etme:

```text
muhasebe
gelirler
giderler
nakit akışı
lansman
cadde
kaynak
kişi
oda
referans
ambasador
yönetici
anket
üye
danışman
```

Kod okunabilirliği için dosya organizasyonunu iyileştirebilirsin; fakat domain dilini keyfi biçimde değiştirme.

## 0.5 Büyük Patlama Refactor Yapma

Tek seferde yüzlerce dosyayı değiştirme.

Her faz sonunda:

```bash
npm run verify:text
npm run lint
npm run test
npm run build
git diff --stat
```

çalıştır.

Bir faz test veya build sonucunu bozarsa:

1. Hatanın kaynağını araştır.
2. Yalnızca ilgili değişikliği düzelt.
3. Gerekirse o fazı geri al.
4. Kırık durumda sonraki faza geçme.

Commit oluşturma. Push yapma. Deploy yapma. Supabase üzerinde write işlemi çalıştırma.

---

# 1. Önce Repo Gerçekliğini Çıkar

Herhangi bir dosyayı değiştirmeden önce aşağıdaki komutları çalıştır:

```bash
git status --short
git branch --show-current
git rev-parse --short HEAD
node --version
npm --version
npm run verify:text
npm run lint
npm run test
npm run build
npx tsc -p tsconfig.app.json --noEmit
```

`tsc` mevcut durumda başarısız olursa bunu saklama. Baseline hata sayısını ve hata türlerini kaydet.

`AGENT_CONTEXT.md` mevcutsa oku. Mevcut değilse hata verme. Dokümanlarda yazan bilgileri repo gerçekliğinin üzerinde kabul etme.

Aşağıdaki alanları incele:

```text
package.json
src/
src/App.tsx
src/main.tsx
src/components/
src/components/auth/
src/components/admin/
src/contexts/
src/hooks/
src/lib/
src/pages/
src/pages/admin/
src/pages/admin/muhasebe/
src/integrations/supabase/
scripts/
public/
supabase/
docs/
eslint.config.js
tsconfig*.json
vite.config.ts
server.mjs
```

---

# 2. Refactor Öncesi Ölçüm Raporu Hazırla

Önce mevcut durumu ölç. Bu ölçümleri aşağıdaki dosyaya yaz:

```text
docs/refactor/YYYY-MM-DD-clean-code-baseline.md
```

Tarihi çalışma gününe göre değiştir.

Raporda en az aşağıdaki metrikler olsun:

```text
- Toplam src dosya sayısı
- TS dosya sayısı
- TSX dosya sayısı
- Test dosyası sayısı
- App.tsx satır sayısı
- App.tsx import sayısı
- App.tsx route sayısı
- AdminLayout.tsx satır sayısı
- src/lib/admin.ts satır sayısı
- src/lib altındaki dosya sayısı
- Component içinde doğrudan supabase.from() kullanım sayısı
- Component içinde doğrudan supabase.rpc() kullanım sayısı
- "@/integrations/supabase/client" import sayısı
- "@/lib/supabase" import sayısı
- "@/contexts/AuthContext" import sayısı
- "@/components/auth/useAuth" import sayısı
- `any` kullanım sayısı
- `as any` kullanım sayısı
- `@ts-ignore` kullanım sayısı
- `@ts-expect-error` kullanım sayısı
- ESLint disable yorum sayısı
- TODO sayısı
- FIXME sayısı
- HACK sayısı
- Lazy import sayısı
- Build sonucu
- Lint sonucu
- Test sonucu
- TypeScript typecheck sonucu
```

Ölçüm için yeni dependency kurma. Mevcut shell araçlarını kullan:

```bash
rg
find
wc
grep
git grep
```

Her sayının nasıl elde edildiğini rapora kısa biçimde yaz.

---

# 3. Projenin Doğrulanmış Kritik Yapıları

Aşağıdaki yapıları başlangıç noktası olarak kabul et; fakat repo içindeki güncel durumla yeniden doğrula.

## 3.1 Route Merkezi

```text
src/App.tsx
```

Bu dosya public route değerlerini, admin route değerlerini, redirect değerlerini ve feature-gated route yapılarını tek yerde topluyor.

Refactor sırasında aşağıdaki URL değerlerini kesinlikle koru:

```text
/
/founders
/radar
/commercial
/commercial/:slug
/diaspora/:slug
/lansman
/founding-1000
/blogger-yarismasi
/vlogger-yarismasi
/19051919
/19051919/harita
/190519idea
/190519memory
/addcom
/addcom/edit/:slug
/anket
/anket/:slug
/anket/tesekkurler
/login
/auth
/welcome/activate
/directory
/directory/catalog/:slug
/directory/profile/:userId
/profile
/profile/:type
/profile/catalog/:itemId
/cadde
/privacy-policy
/legal/privacy
/legal/terms
/legal/kvkk
/legal/cookies
/iletisim
/pricing
/kariyer
/reset-password
/admin/*
```

Redirect değerlerini de koru:

```text
/hakkimizda → /founders
/190519 → /190519memory
/addwa → /addcom
/whatsapp-groups → /addcom
/whatsapp-groups/:id → /addcom?group=<id>
/contributor → /commercial/contributor
/influencer-partner → /commercial/influencer-partner
/strategic-partner → /commercial/strategic-partner
/community-leader → /commercial/community-leader
/ambassador → /commercial/ambassador
```

## 3.2 Auth Yapısı

Canonical auth yapısı:

```text
src/components/auth/AuthProvider.tsx
src/components/auth/auth-context.ts
src/components/auth/useAuth.ts
src/components/auth/RequireAuth.tsx
src/components/auth/RequireFeature.tsx
src/hooks/useFeatureFlags.ts
```

Compatibility shim:

```text
src/contexts/AuthContext.tsx
```

`src/contexts/AuthContext.tsx` dosyasını orphan kabul etme. Bu dosya geçmiş import noktalarını canonical sisteme yönlendiren backward-compatibility shim olabilir.

Önce shim kullanım envanteri çıkar. Ardından import noktalarını aşamalı biçimde canonical path değerlerine geçir:

```ts
import { useAuth } from "@/components/auth/useAuth";
```

Shim import sayısı sıfıra düşmeden dosyayı silme.

## 3.3 Supabase Client Yapısı

İki farklı Supabase client mevcut olabilir:

```text
src/integrations/supabase/client.ts
src/lib/supabase.ts
```

Canonical tercih:

```text
src/integrations/supabase/client.ts
```

Ancak körlemesine konsolidasyon yapma.

İki client arasında auth ayarları farklı olabilir:

* Session persistence
* Auto refresh
* Local storage kullanımı
* Runtime config key değerleri
* Type desteği
* Kullanıldığı akışlar

Önce tüm import noktalarını çıkar. `src/lib/supabase.ts` kullanan her dosyayı sınıflandır:

```text
Public anonymous query
Authenticated query
Admin query
Import script
Legacy helper
Test
Muhtemel orphan
```

Davranış eşdeğerliği kanıtlanmadan import değiştirme.

İlk turda yalnızca güvenli olan import değişikliklerini uygula. Riskli olanları rapora taşı.

`src/integrations/supabase/client.ts` generated dosyadır. Doğrudan düzenleme yapma.

## 3.4 Admin Yapısı

Aşağıdaki dosyalar büyük ve farklı sorumlulukları birleştiriyor olabilir:

```text
src/components/admin/AdminLayout.tsx
src/lib/admin.ts
```

`AdminLayout.tsx` içinde auth state, admin access kontrolü, login, logout, password reset, responsive menü, navigasyon, global action ve layout render mantığı iç içe olabilir.

`src/lib/admin.ts` içinde admin access, role işlemleri, feature override, taxonomy, profile attribute, referral ve katalog işlemleri aynı dosyada olabilir.

Bu dosyaları aşamalı biçimde küçült.

## 3.5 Referans Pattern

Muhasebe modülü iyi bir modülerleşme örneğidir:

```text
src/pages/admin/muhasebe/routes.tsx
src/lib/muhasebe-api.ts
src/types/muhasebe.ts
```

Özellikle aşağıdaki pattern değerlerini örnek al:

* Feature bazlı route subtree
* Lazy loading
* UI ile veri erişiminin ayrılması
* Type dosyası
* API helper dosyası
* Küçük ve odaklı dosyalar

Bu pattern’i körlemesine kopyalama; ilgili modülün ihtiyaçlarına göre uygula.

---

# 4. Uygulama Fazları

Aşağıdaki sıralamayı takip et. Bir faz tamamlanmadan sonraki faza geçme.

---

## Faz 1 — Güvenli Kod Hijyeni

Amaç: İş davranışını değiştirmeden düşük riskli temizlik yapmak.

Şunları incele ve güvenli olanları düzelt:

```text
- Kullanılmayan import değerleri
- Kullanılmayan local değişkenler
- Duplicate import değerleri
- Aynı package üzerinden iki ayrı import satırı
- Açıkça gereksiz yorum blokları
- Eski örnek kullanım yorumları
- Yanlış veya eski açıklama yorumları
- Basit isimlendirme tutarsızlıkları
- Gereksiz parantezler
- Gereksiz type assertion
- Kullanılmayan helper değerleri
- Aynı dosya içindeki tekrar eden sabitler
```

Kurallar:

* Public API isimlerini değiştirme.
* Route path değerlerini değiştirme.
* RPC isimlerini değiştirme.
* Database key değerlerini değiştirme.
* Generated dosyalara dokunma.
* Yalnızca kanıtlanabilir düşük riskli değişiklikleri uygula.

Özellikle kontrol et:

```text
src/components/admin/admin-navigation.ts
src/components/admin/AdminLayout.tsx
src/components/auth/AuthProvider.tsx
src/hooks/useFeatureFlags.ts
src/lib/features.ts
src/lib/admin.ts
```

Her dosyada değiştirdiğin şeyi final raporda listele.

Faz sonunda çalıştır:

```bash
npm run verify:text
npm run lint
npm run test
npm run build
npx tsc -p tsconfig.app.json --noEmit
git diff --stat
```

---

## Faz 2 — App.tsx Route Modülerleştirme

Amaç: `src/App.tsx` dosyasını sadeleştirmek; mevcut URL değerlerini ve davranışları birebir korumak.

Yeni route modüllerini uygun bir klasörde oluştur. Önerilen yapı:

```text
src/routes/
├── public-routes.tsx
├── public-auth-routes.tsx
├── redirect-routes.tsx
├── admin-routes.tsx
├── commercial-routes.tsx
├── route-fallbacks.tsx
└── index.tsx
```

Bu yapı repo gerçekliğine uymuyorsa daha uygun ama benzer şekilde modüler bir yapı kur.

Kurallar:

1. Route path değerlerini değiştirme.
2. Redirect davranışlarını değiştirme.
3. `RequireAuth` wrapper değerlerini kaldırma.
4. `RequireFeature` wrapper değerlerini kaldırma.
5. `GENERIC_FEATURE_KEYS.caddeAccess` gate davranışını koru.
6. `PublicLayout` nesting davranışını koru.
7. Admin route nesting davranışını koru.
8. `NotFound` fallback davranışını koru.
9. Muhasebe route subtree yapısını koru.
10. Route sırasının davranış etkisini dikkate al.
11. Route parametrelerini değiştirme.
12. Query parameter davranışlarını değiştirme.

Mümkün olduğunda feature page import değerlerini lazy loading yaklaşımına taşı. Ancak önce build ve runtime davranışını doğrula.

`src/pages/admin/muhasebe/routes.tsx` yaklaşımını referans al.

Route değişikliklerinden sonra bir route snapshot tablosu hazırla:

```text
Route
Önceki davranış
Yeni davranış
Auth gate
Feature gate
Redirect
Durum
```

Tüm satırlar için `Korundu` sonucu beklenir.

Faz sonunda çalıştır:

```bash
npm run verify:text
npm run lint
npm run test
npm run build
npx tsc -p tsconfig.app.json --noEmit
```

---

## Faz 3 — AdminLayout.tsx Ayrıştırma

Amaç: Büyük admin layout bileşenini küçük, anlaşılır ve test edilebilir parçalara ayırmak.

İlk olarak `src/components/admin/AdminLayout.tsx` dosyasındaki sorumlulukları çıkar.

Muhtemel parçalar:

```text
src/components/admin/layout/
├── AdminLayout.tsx
├── AdminLoginCard.tsx
├── AdminUnauthorizedCard.tsx
├── AdminHeader.tsx
├── AdminDesktopNavigation.tsx
├── AdminMobileNavigation.tsx
├── AdminGlobalActions.tsx
├── AdminLoadingScreen.tsx
└── admin-layout-types.ts

src/hooks/admin/
└── useAdminAccess.ts
```

Repo yapısına daha uygun bir isimlendirme gerekiyorsa kullan.

Ayrıştırma kuralları:

1. `userIsAdmin()` davranışını değiştirme.
2. Supabase session davranışını değiştirme.
3. Login davranışını değiştirme.
4. Password reset davranışını değiştirme.
5. Redirect URL değerini değiştirme.
6. Toast mesajlarının anlamını değiştirme.
7. Menü sırasını değiştirme.
8. Mobile ve desktop menülerde link kaybetme.
9. External link değerlerini değiştirme.
10. Admin outlet context yapısını koru.
11. Gereksiz prop drilling oluşturma.
12. Aşırı küçük ve anlamsız component parçaları üretme.

Hedef:

```text
- Ana AdminLayout bileşeni orchestration seviyesinde kalmalı.
- Görsel alt parçalar ayrı component olmalı.
- Auth ve access side-effect mantığı hook içinde toplanmalı.
- Navigation sabitleri mevcut admin-navigation dosyasında kalmalı.
```

Faz sonunda çalıştır:

```bash
npm run verify:text
npm run lint
npm run test
npm run build
npx tsc -p tsconfig.app.json --noEmit
```

---

## Faz 4 — src/lib/admin.ts Servis Ayrıştırması

Amaç: Farklı domain sorumluluklarını tek dosyadan ayırmak.

İlk olarak `src/lib/admin.ts` içindeki export değerlerini envanterle.

Her fonksiyonu aşağıdaki domain değerlerinden biriyle eşleştir:

```text
admin-access
admin-roles
admin-features
admin-profile-attributes
admin-taxonomy
admin-approvals
admin-referrals
admin-catalog
admin-audit
unknown-manual-review
```

Önerilen yapı:

```text
src/lib/admin/
├── admin-access-api.ts
├── admin-role-api.ts
├── admin-feature-api.ts
├── admin-profile-api.ts
├── admin-taxonomy-api.ts
├── admin-approval-api.ts
├── admin-referral-api.ts
├── admin-catalog-api.ts
├── admin-types.ts
└── index.ts
```

Backward compatibility için mevcut dosyayı geçici barrel export olarak koru:

```text
src/lib/admin.ts
```

Bu dosya eski import noktalarını yeni modüllere yönlendirsin.

Kurallar:

1. Fonksiyon isimlerini ilk turda değiştirme.
2. Parametre isimlerini değiştirme.
3. RPC isimlerini değiştirme.
4. Supabase query davranışını değiştirme.
5. Return type davranışını değiştirme.
6. Error throw davranışını değiştirme.
7. Aynı anda hem taşıma hem iş kuralı değişikliği yapma.
8. Type değerlerini uygun domain dosyasına taşı.
9. Circular dependency oluşturma.
10. Barrel export kullanımını kontrollü tut.

Taşıma tamamlandıktan sonra import graph kontrolü yap.

Faz sonunda çalıştır:

```bash
npm run verify:text
npm run lint
npm run test
npm run build
npx tsc -p tsconfig.app.json --noEmit
```

---

## Faz 5 — Auth Compatibility Shim Azaltma

Amaç: Eski auth import yolunu kontrollü biçimde azaltmak.

Compatibility shim:

```text
src/contexts/AuthContext.tsx
```

Canonical import yolları:

```text
src/components/auth/AuthProvider.tsx
src/components/auth/useAuth.ts
```

Yapılacaklar:

1. Shim kullanan tüm import noktalarını listele.
2. Her import noktasında yalnızca `useAuth` mı yoksa `AuthProvider` mı kullanıldığını belirle.
3. `loading` alias değerine bağımlı bileşenleri tespit et.
4. Canonical sistemdeki `isLoading` değerine kontrollü geçiş yap.
5. Her küçük batch sonrasında lint, test ve build çalıştır.
6. Shim import sayısını raporla.
7. Shim import sayısı sıfır değilse shim dosyasını silme.
8. Shim import sayısı sıfır olsa bile son build ve grep doğrulaması olmadan silme.

Bu faz sonunda shim hâlâ gerekliyse dosyayı koru ve rapora yaz.

---

## Faz 6 — Supabase Client Konsolidasyon Planı

Amaç: İki Supabase client kullanımını analiz etmek ve yalnızca güvenli geçişleri uygulamak.

İncelenecek dosyalar:

```text
src/integrations/supabase/client.ts
src/lib/supabase.ts
```

Önemli:

* Generated client dosyasını düzenleme.
* İki client’ın session persistence davranışları farklı olabilir.
* Anonymous sorgular ile authenticated sorguları aynı kabul etme.
* Oturum gerektiren akışları körlemesine taşıma.
* Import değiştirmeden önce kullanım senaryosunu çıkar.

Rapor tablosu:

```text
Import Eden Dosya
Kullanılan Client
İşlem Türü
Authenticated mı?
Session Gerekiyor mu?
Canonical Client'a Güvenle Taşınabilir mi?
Risk
Öneri
```

Yalnızca risk seviyesi düşük olan import değişikliklerini uygula.

Riskli değişiklikleri şu dosyaya yaz:

```text
docs/refactor/YYYY-MM-DD-supabase-client-consolidation-plan.md
```

`src/lib/supabase.ts` import sayısı sıfıra düşmeden dosyayı silme.

---

## Faz 7 — Veri Erişim Katmanını Standartlaştırma

Amaç: UI component içinde dağınık Supabase sorgularını azaltmak.

İlk olarak aşağıdaki kullanımları ara:

```text
supabase.from(
supabase.rpc(
supabase.auth.
```

Kullanımları sınıflandır:

```text
Component içi doğrudan query
Hook içi query
lib/*-api.ts içi query
Auth altyapısı
Admin altyapısı
Script
Test
```

Yeni kod için tercih edilen pattern:

```text
lib/<domain>-api.ts
types/<domain>.ts
hooks/use<Domain>.ts
pages veya components
```

Kurallar:

1. Auth altyapısındaki sorguları gereksiz yere taşıma.
2. Basit tek kullanımlık sorgular için aşırı abstraction üretme.
3. Domain iş kuralı UI component içine gömülü kalmasın.
4. Mutation işlemleri tek yerde toplansın.
5. Error handling tutarlı olsun.
6. Return type açık olsun.
7. Gerektiğinde Zod validation ekle.
8. React Query zaten kullanılan modüllerde cache invalidation kontrolü yap.
9. Yeni dependency ekleme.
10. Muhasebe modülünü referans pattern olarak kullan.

Öncelik sırası:

```text
1. Admin veri işlemleri
2. Directory ve profile sorguları
3. RolesGo sorguları
4. Catalog sorguları
5. Survey sorguları
6. Workspace sorguları
7. Diğer public sorgular
```

Bu faz çok genişse yalnızca en yüksek öncelikli 1–2 domain üzerinde güvenli uygulama yap; kalan alanlar için plan çıkar.

---

## Faz 8 — TypeScript Güvenliğini Kademeli Artırma

Amaç: Projeyi tek seferde kırmadan type güvenliğini artırmak.

Mevcut konfigürasyonda aşağıdaki değerler kapalı olabilir:

```json
{
  "strict": false,
  "noImplicitAny": false,
  "noUnusedLocals": false,
  "noUnusedParameters": false
}
```

Ayrıca ESLint içinde aşağıdaki kural kapalı olabilir:

```text
@typescript-eslint/no-unused-vars
```

Tek seferde `strict: true` yapma.

Önce type debt envanteri çıkar:

```text
- any
- as any
- unknown
- @ts-ignore
- @ts-expect-error
- Non-null assertion
- Eksik import edilen type değerleri
- Supabase query cast değerleri
- RPC dönüş cast değerleri
- Gereksiz type assertion
- Duplicate type tanımları
```

Aşamalı yaklaşım:

```text
1. Açık ve düşük riskli type hatalarını düzelt.
2. Kullanılmayan import ve değişkenleri temizle.
3. ESLint no-unused-vars kuralını önce warn seviyesinde aç.
4. Yeni veya refactor edilen dosyalarda any kullanımını azalt.
5. Supabase dönüşlerini domain type değerleriyle eşleştir.
6. Büyük legacy alanlarda ayrı backlog çıkar.
7. Tüm repo için strict modunu ancak ayrı refactor fazı olarak öner.
```

Generated Supabase type dosyasını manuel düzenleme.

Type üretimi gerekiyorsa komutu öner; otomatik çalıştırma:

```bash
supabase gen types typescript
```

---

## Faz 9 — Script ve Taşınabilirlik Hijyeni

`package.json` içindeki script değerlerini incele.

Özellikle:

* Yerel bilgisayara özel absolute Windows path değerleri
* Eski import scriptleri
* Write yapan scriptler
* Dry-run seçeneği bulunmayan scriptler
* Aynı scriptin tekrar eden varyasyonları
* Açıklaması bulunmayan operasyonel scriptler
* Production ile development script ayrımı
* Typecheck script eksikliği

Yerel bilgisayara özel path değerini doğrudan silme. Önce uygun ve geriye uyumlu çözüm öner:

```text
- CLI parametresi
- ENV değişkeni
- Belgelenmiş örnek komut
- Dry-run default
- --write ile açık opt-in
```

Güvenli ise iyileştir. Riskliyse yalnızca plan dosyasına yaz.

---

## Faz 10 — Dead Code ve Legacy Adayları

Amaç: Kullanılmayan kodu tespit etmek; yanlış pozitif oluşturmamak.

Ara:

```text
- Import edilmeyen TS/TSX dosyaları
- Kullanılmayan export değerleri
- Kullanılmayan helper fonksiyonları
- Kullanılmayan component değerleri
- Kullanılmayan hook değerleri
- Legacy alias değerleri
- Süresi geçmiş feature flag değerleri
- Yorum satırına alınmış eski kod
- Duplicate utility fonksiyonları
- TODO / FIXME / HACK
- Kullanılmayan dependency değerleri
```

Her aday için sınıflandırma yap:

```text
KESİN_ORPHAN
YÜKSEK_OLASILIKLA_ORPHAN
LEGACY_COMPATIBILITY
GENERATED_KEEP
ROUTE_REFERENCED
BUILD_PLUGIN_REFERENCED
STRING_REFERENCED
MANUEL_DOĞRULAMA
AKTİF
```

İlk turda dosya silme işlemini yalnızca `KESİN_ORPHAN` kategorisinde ve aşağıdaki kontrollerden sonra yap:

```text
[ ] Import graph kontrol edildi.
[ ] String referansları kontrol edildi.
[ ] Route referansları kontrol edildi.
[ ] Vite plugin referansları kontrol edildi.
[ ] HTML referansları kontrol edildi.
[ ] Build başarılı.
[ ] Test başarılı.
[ ] Git diff incelendi.
```

Şüpheli dosyaları silme; backlog listesine ekle.

---

# 5. Özel Koruma Kuralları

## 5.1 Vite Standalone Commercial Sayfaları

`vite.config.ts` içinde özel build mantığı olabilir.

Şu standalone belgeleri koru:

```text
info-contributor.html
info-influencer-partner.html
info-strategic-partner.html
info-community-leader.html
info-ambassador.html
```

Şu route alias davranışlarını koru:

```text
/commercial/contributor
/commercial/influencer-partner
/commercial/strategic-partner
/commercial/community-leader
/commercial/ambassador

/contributor
/influencer-partner
/strategic-partner
/community-leader
/ambassador
```

Bu HTML dosyalarını orphan olarak işaretleme.

## 5.2 Runtime Server

`server.mjs` içindeki aşağıdaki davranışları ilk refactor turunda değiştirme:

```text
- dist static serving
- env-config.js üretimi
- VITE_SUPABASE_URL runtime aktarımı
- VITE_SUPABASE_PUBLISHABLE_KEY runtime aktarımı
- VITE_SUPABASE_PROJECT_ID runtime aktarımı
- /api/chat RAG proxy
- RAG_API_SECRET
- Request body limiti
- Timeout
- Rate limiting
- Security header değerleri
- SPA fallback
```

Clean-code sorunu görürsen ayrı backlog maddesi oluştur.

## 5.3 Feature Key Değerleri

Aşağıdaki dosyada tanımlanan string değerlerini değiştirme:

```text
src/lib/features.ts
```

Örnek:

```text
individual.*
profile.*
directory.*
contact.*
content.*
events.*
offers.*
referral.*
cadde.access
city.manage
admin.requires_approval
whatsapp_landing.edit_assigned
```

Bunlar veri tabanı ve RPC tarafında kullanılan contract değerleri olabilir.

## 5.4 Admin RPC Değerleri

Aşağıdaki gibi RPC string değerlerini rename etme:

```text
get_current_user_features
admin_set_user_profile_type
admin_set_user_role
admin_set_role_feature_flag
admin_set_user_feature_override
admin_clear_user_feature_override
admin_set_attribute_rule
admin_update_user_profile_attribute
admin_review_approval_request
```

Clean-code çalışmasında yalnızca çağrı organizasyonunu iyileştir.

---

# 6. Test Stratejisi

Refactor sırasında mevcut testleri çalıştır.

Ayrıca düşük maliyetli regression testleri ekle.

Öncelikli testler:

## 6.1 Route Testleri

```text
- Public temel route değerleri render ediliyor mu?
- Redirect değerleri doğru hedefe gidiyor mu?
- /cadde auth gerektiriyor mu?
- /cadde feature gate davranışı korunuyor mu?
- /profile auth gerektiriyor mu?
- /addcom/edit/:slug auth gerektiriyor mu?
- /admin route nesting korunuyor mu?
- NotFound fallback çalışıyor mu?
```

## 6.2 Auth Testleri

```text
- useAuth provider dışında hata veriyor mu?
- RequireAuth loading state gösteriyor mu?
- RequireAuth session yoksa /login yönlendirmesi yapıyor mu?
- RequireFeature loading state gösteriyor mu?
- RequireFeature disabled ise fallback render ediyor mu?
- Auth shim loading alias davranışını koruyor mu?
```

## 6.3 AdminLayout Testleri

```text
- Session yoksa login formu render ediliyor mu?
- Admin kontrolü sırasında loading state görünüyor mu?
- Admin olmayan kullanıcı için unauthorized ekranı görünüyor mu?
- Login ve password reset handler değerleri korunuyor mu?
- Navigation link listesi kaybolmuyor mu?
```

## 6.4 Servis Katmanı Testleri

```text
- Taşınan admin API helper fonksiyonlarının export değerleri korunuyor mu?
- Barrel export backward compatibility sağlıyor mu?
- Parametre isimleri korunuyor mu?
- RPC string değerleri korunuyor mu?
```

---

# 7. Değişiklik Boyutu Yönetimi

Her fazda mümkün olduğunca küçük diff üret.

Bir fazda aşağıdaki eşiklerden biri aşılırsa dur ve fazı alt parçalara böl:

```text
- 25 dosyadan fazla değişiklik
- 1500 satırdan fazla diff
- Aynı anda 3 farklı domain alanında değişiklik
- Route, auth ve Supabase client değişikliklerinin aynı batch içinde yapılması
```

Refactor batch değerlerini birbirinden ayır:

```text
Batch A: Hygiene
Batch B: Route extraction
Batch C: AdminLayout extraction
Batch D: admin.ts service extraction
Batch E: Auth shim migration
Batch F: Supabase client analysis and safe migrations
Batch G: Type safety ratchet
```

---

# 8. Final Rapor

Çalışma sonunda aşağıdaki dosyayı oluştur:

```text
docs/refactor/YYYY-MM-DD-clean-code-refactor-report.md
```

Rapor Türkçe olsun.

Şu bölümleri içersin:

```text
# CorteQS Clean Code Refactor Raporu

## 1. Yönetici Özeti

## 2. Başlangıç Metrikleri

## 3. Uygulanan Değişiklikler

## 4. Değiştirilen Dosyalar

## 5. Route Davranışı Doğrulaması

## 6. Auth Compatibility Durumu

## 7. Supabase Client Konsolidasyon Durumu

## 8. AdminLayout Ayrıştırma Durumu

## 9. admin.ts Servis Ayrıştırma Durumu

## 10. TypeScript Teknik Borç Durumu

## 11. Dead Code ve Legacy Adayları

## 12. Ertelenen Riskli Değişiklikler

## 13. Test Sonuçları

## 14. Lint Sonucu

## 15. Build Sonucu

## 16. Typecheck Sonucu

## 17. Önce ve Sonra Metrikleri

## 18. Sonraki 10 Önerilen Aksiyon
```

Her değişiklik için:

```text
Dosya
Önceki Sorun
Uygulanan Değişiklik
Davranış Korundu mu?
Nasıl Doğrulandı?
Risk
```

tablosu oluştur.

---

# 9. Final Kontrol Listesi

İşlem sonunda aşağıdakileri doğrula:

```text
[ ] Supabase migration dosyalarına dokunmadım.
[ ] vite.config.ts değiştirmedim.
[ ] server.mjs değiştirmedim.
[ ] Generated Supabase client dosyasını değiştirmedim.
[ ] src/components/ui/* dosyalarını değiştirmedim.
[ ] info-*.html dosyalarını silmedim.
[ ] Route path değerlerini değiştirmedim.
[ ] Redirect davranışlarını değiştirmedim.
[ ] Auth gate değerlerini kaldırmadım.
[ ] Feature gate değerlerini kaldırmadım.
[ ] RPC string değerlerini değiştirmedim.
[ ] Feature key değerlerini değiştirmedim.
[ ] Database tablo isimlerini değiştirmedim.
[ ] Domain terimlerini İngilizceleştirmedim.
[ ] Auth shim kullanımını doğrulamadan dosyayı silmedim.
[ ] Supabase client davranışını doğrulamadan import değiştirmedim.
[ ] npm run verify:text başarılı.
[ ] npm run lint başarılı veya baseline ile karşılaştırmalı biçimde raporlandı.
[ ] npm run test başarılı veya baseline ile karşılaştırmalı biçimde raporlandı.
[ ] npm run build başarılı.
[ ] Typecheck sonucu raporlandı.
[ ] git diff --stat incelendi.
[ ] Yalnızca clean-code kapsamındaki değişiklikler yapıldı.
```

Son olarak çalıştır:

```bash
git status --short
git diff --stat
git diff --name-only
```

---

# 10. Bana Vereceğin Son Yanıt

Çalışma tamamlandığında aşağıdaki formatta kısa bir teslim özeti ver:

```text
Clean-code refactor tamamlandı.

Rapor:
docs/refactor/YYYY-MM-DD-clean-code-refactor-report.md

Uygulanan batch değerleri:
- Batch A:
- Batch B:
- Batch C:
- Batch D:
- Batch E:
- Batch F:
- Batch G:

Önce → Sonra:
- App.tsx satır sayısı:
- AdminLayout.tsx satır sayısı:
- src/lib/admin.ts satır sayısı:
- "@/contexts/AuthContext" import sayısı:
- "@/lib/supabase" import sayısı:
- `any` sayısı:
- `as any` sayısı:
- Unused import sayısı:
- Lazy import sayısı:

Kontroller:
- verify:text:
- lint:
- test:
- build:
- typecheck:

Değiştirilen dosya sayısı:
Yeni oluşturulan dosya sayısı:
Silinen dosya sayısı:
Manuel doğrulama gereken konu sayısı:

Not:
Deployment yapılmadı.
Supabase üzerinde write işlemi çalıştırılmadı.
Migration dosyaları değiştirilmedi.
Riskli değişiklikler otomatik uygulanmadı; rapora eklendi.
```
