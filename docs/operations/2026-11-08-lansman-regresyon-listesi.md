---
durum: aktif
son_dogrulama: 2026-11-08
---

# 1 Ocak lansmanı — regresyon listesi (batch L3)

Burak'ın planındaki **12 "bozulmasın" maddesi**. Her satır: bugün onu koruyan test · açık kalan boşluk · L3'te eklenen test · yalnız canlıda bakılabilen kısım.

Plan: `docs/plans/2026-11-08-ocak-lansman-uygulama-plani.md` (L3). Tutarsızlık raporu: `docs/audits/2026-11-08-ocak-lansman-tutarsizlik-raporu.md`.

**Yeni statik sözleşme dosyası:** `src/lib/lansman-regression-contract.test.ts` (aşağıda "YENİ"). İçindeki listeler 8 Kasım 2026'nın anlık görüntüsüdür: listeye öğe eklemek serbest, çıkarmak bilinçli karar ister.
**Tarayıcı katmanı:** `e2e/lansman-smoke.spec.ts` (5 akış, girişsiz, port 8099).
**Diğer L3 kapıları:** `scripts/check/check-bundle-size.mjs` (ilk yük JS gzip bütçesi) · `scripts/lovable-forbidden-strings.test.mjs` ("Lovable'dan gelmesin").

## Özet

| Ölçü | Sayı |
|---|---|
| Madde | 12 |
| Eskiden kısmen korunan (mevcut test vardı) | 10 |
| Eskiden hiç korunmayan | 2 — (4) profil sekmesi kimlikleri · (11) analitik etiketleri |
| L3'te yeni statik sözleşme eklenen | 12 (hepsi) |
| Yalnız canlıda bakılabilen parçası olan | 12 (hepsi; aşağıdaki SQL/elle adım) |
| Hâlâ AÇIK boşluk | 2 — (10) staging/prototip noindex mekanizması yok · (8) elçi indirimi için kod yüzeyi yok |

## Madde tablosu

### (1) Üye hesapları ve oturum — mevcut üye aynı e-postayla girer
- **Mevcut:** `src/components/auth/AuthProvider.test.tsx` · `src/components/auth/RequireAuth.test.tsx` · `src/lib/auth-api.test.ts` · `src/pages/LoginPage.test.tsx` · `src/lib/auth-messages.test.ts`.
- **Boşluk:** `/login` rotası ve eski giriş adresleri (`/aiform`, `/form`) ile oturumun kalıcılığı hiçbir testte kilitli değildi. Auth bağlamı alan listesi (`isLoading`, `loading` değil) yalnız CLAUDE.md'de yazılıydı.
- **YENİ:** `lansman-regression-contract.test.ts` › "(1)": `/login` rotası, auth bağlamı yüzeyi, `persistSession` + `autoRefreshToken`. `e2e/lansman-smoke.spec.ts` › `/login` formu çiziliyor.
- **Yalnız canlıda:** mevcut üyenin gerçek girişi. Elle: deploy sonrası bir mevcut üye hesabıyla giriş. Salt okunur SQL: `select count(*) from auth.users;` — deploy öncesi/sonrası aynı olmalı (sayıyı batch başında not et).

### (2) Roller, AFS yetkileri ve admin'in kullanıcı bazlı yetki ekranı
- **Mevcut:** `src/lib/features.test.ts` · `src/components/auth/RequireFeature.test.tsx` · `src/lib/role-catalog.test.ts` · `src/lib/admin-shell/admin-navigation-registry.test.ts` (menüdeki her adres rota ağacında geçerli mi).
- **Boşluk:** "Feature Override" ekranının menüde DURDUĞUNU ve rol/AFS yönetim rotalarının var olduğunu kimse kilitlemiyordu; menü testi yalnız "var olan öğe geçerli mi" der, öğe silinirse susar.
- **YENİ:** "(2)": `feature-overrides` → `/admin/new-member/overrides`; rol matrisi ve rol genel bakışı menüde; `users-roles`, `roles-features`, `attributes`, `profile-sections`, `profile-role-assignment` rotaları `src/pages/admin/routes.tsx` içinde; `cadde.access` anahtarı.
- **Yalnız canlıda:** rol/yetki satırları. Salt okunur SQL:
  ```sql
  select count(*) filter (where is_active) as aktif, count(*) as toplam from public.roles;
  select count(*) from public.user_role_assignments;
  select count(*) from public.user_feature_overrides;
  select count(*) from public.role_features;
  ```
  Beklenen: batch öncesi ölçülenle aynı (CLAUDE.md'deki 82/78 bayat olabilir; ölç).

### (3) Katalog + uzmanlar (konsolosluk/büyükelçilik dahil) dizinlerde görünür
- **Mevcut:** `src/lib/catalog-directory.test.ts` · `src/lib/directory-role-groups.test.ts` · `src/pages/DirectoryCatalogItemPage.test.tsx` · `src/pages/CityAmbassadorsPage.test.tsx` · `scripts/generate/generate-sitemap.test.mjs`.
- **Boşluk:** `/directory`, `/consultants`, `/associations`, `/city-ambassadors`, `/businesses`, `/directory/profile/:userId` rotalarının varlığı ve konsolosluk yönetim sayfasının admin ağacında durması kilitli değildi.
- **YENİ:** "(3)": 7 rota, `consulates` admin rotası, dizin adreslerinin sitemap'te kalması. `e2e/lansman-smoke.spec.ts` › `/directory?q=avukat` en az bir sonuç kartı çiziliyor (boş sonuç ve hata başarısızlıktır).
- **Yalnız canlıda:** kayıtların kendisi (rota durması veri göründüğünü kanıtlamaz). Salt okunur SQL:
  ```sql
  select status, count(*) from public.catalog_items group by status order by 1;
  select count(*) from public.turkish_missions;
  ```
  Elle: `/directory?q=konsolosluk` ve `/directory?q=avukat` sonuç getiriyor.

### (4) Profil paneli bugünkü sekmeleri (legacy `profile-sidebar-menu.tsx`) silinmez
- **Mevcut:** `src/pages/ProfilePage.test.tsx` › "yan panel menüsü (kurumsal düzen)" — yalnız danışman rolünde ve **sıra** olarak. Koşullu sekmeler (Rozetler, Contributor) ve premium düzen dışında kalan rollerde sekme kaybı yakalanmaz; testin tamamı `ProfilePage` mount ister.
- **Boşluk:** Sekme kimlik→etiket eşlemesi hiçbir yerde saf olarak kilitli değildi.
- **YENİ:** "(4)": `buildProfileSidebarMenu` tüm kartlar dolu çağrılır; 12 bugünkü kimlik ve etiket (`overview … help`) aranır, "Profil Özeti" ilk, "Yardım" son kalır (yeni sekmeler Yardım'dan önce eklenir), `ProfilePage` menüyü hâlâ kurar. Kimlik ya da etiket değişirse düşer; yeni sekme eklenmesi serbesttir.
- **Yalnız canlıda:** gerçek üyede sekmelerin içeriği. Elle: bir üye hesabıyla `/profile` → 12 sekmeyi gez.

### (5) 18 araç (`/tools`) ve kayıtlı sonuç/oturum sayfaları
- **Mevcut:** `src/components/relocation/tools/RelocationToolsHub.test.tsx` · `src/pages/relocation/tools/RelocationToolPage.standalone.test.tsx` · `src/hooks/useRelocationToolSession.test.tsx` · `scripts/agent/tools-catalog.test.mjs`.
- **Boşluk:** Hub'ın araç listesi iki kaynaktan gelir: 6 bağımsız araç statik koddadır (`STANDALONE_TOOLS`), kalan 12 araç `relocation_tools` tablosundandır (DB-tabanlı). 18'lik kümenin hiçbir yerde sabit kaydı yoktu; `/tools/:toolSlug/session/:sessionId` ve `…/result/:resultId` rotaları kilitli değildi.
- **YENİ:** "(5)": 18 slug × hero görseli kaydı (hub kart görseli ve araç ilk ekranı) + görsel dosyası var; 6 bağımsız araç `STANDALONE_TOOLS`'ta; dört rota (`/tools`, araç, oturum, sonuç; `App.tsx` desenleriyle TAM eşleşme); `/tools` sitemap'te.
- **Kapsam sınırı:** DB-tabanlı 12 aracın hub'dan düşmesi STATİK olarak yakalanamaz (liste canlı tablodan gelir); o kısım yalnız canlıda doğrulanır (aşağıdaki `relocation_tools` SQL'i). Testler görsel kaydının ve bağımsız araçların silinmesini yakalar, DB satırının silinmesini yakalamaz.
- **Yalnız canlıda:** araç soruları ve kayıtlı sonuçlar DB'de. Salt okunur SQL:
  ```sql
  select count(*) from public.relocation_tools;   -- 12 DB aracı beklenir (öncesi/sonrası aynı)
  select slug from public.relocation_tools order by 1;
  select count(*) from public.relocation_tool_questions;
  select count(*) from public.relocation_tool_sessions;
  select count(*) from public.relocation_tool_results;
  ```
  Elle: eski bir `/tools/<slug>/result/<id>` bağlantısı hâlâ açılıyor.

### (6) Cadde içeriği (gönderi, yorum, tavsiye, cafe)
- **Mevcut:** `src/App.cadde-routes.test.tsx` · `src/pages/cadde/CaddePage.test.tsx` · `src/lib/cadde-rules.test.ts` · `src/lib/cadde-ranking.test.ts` · `src/lib/community-free-features.test.ts` (Cadde'nin `cadde.access` arkasında kalması).
- **Boşluk:** yazma/okuma RPC'lerinin istemci kodunda çağrılmaya devam ettiği kilitli değildi; ekran sökülürse çağrı da gider, kullanıcı içerik yazamaz, test patlamazdı.
- **YENİ:** "(6)": 4 Cadde rotası; HER rotanın kendi bloğunda `RequireAuth` + `cadde.access` kapısı (pencere bir sonraki rotanın çıpasında biter); RPC'ler yorum satırları atılarak `.rpc("ad")` ÇAĞRI NOKTASI olarak aranır: gönderi (`create_cadde_post_v1/v2` seçimi + `.rpc(rpcName`), `update/delete_cadde_post_v1`, `create_cadde_comment_v1`, `toggle_cadde_reaction_v1`, `list_cadde_feed_v1`, `create_cadde_cafe_v1`, `join_cadde_cafe_v1` ve tavsiye (`create_recommendation_request_v1`, `answer_recommendation_v1`). `e2e/lansman-smoke.spec.ts` › `/cadde` ziyaretçiyi `/login?next=%2Fcadde`'e yönlendiriyor.
- **Yalnız canlıda:** içerik satırları ve eşikler. Salt okunur SQL:
  ```sql
  select count(*) from public.cadde_posts;
  select count(*) from public.cadde_cafes;
  select key, value from public.cadde_settings where key like 'cadde.global%';
  ```
  Elle: girişli üyeyle Cadde akışı açılıyor, gönderi yazılıyor.

### (7) Etkinlikler, dijital gruplar, Kurucu 1000 / blogger / vlogger, liderlik, 19 Mayıs
- **Mevcut:** `src/lib/events-api.test.ts` · `src/lib/events-vocabulary.test.ts` · `src/pages/Founding1000Page.test.tsx` · `src/pages/CampaignHubPage.test.tsx` · `src/pages/LeaderboardPage.test.tsx` · `src/pages/May19CampaignPage.test.tsx` · `src/pages/May19MapPage.test.tsx` · `src/App.may19-routes.test.tsx` · `src/App.addwa-routes.test.tsx` · `src/lib/whatsapp-landings.test.ts`.
- **Boşluk:** tek yerde "bu 19 adres durur" yoktu; her birini ayrı test koruyordu, menü/rota yeniden yazımında toplu kayıp yakalanmazdı.
- **YENİ:** "(7)": 19 rota (`/events`, `/events/create`, `/addcom`, `/founding-1000`, `/campaign/*`, `/liderlik`, `/19051919` ailesi, `/lansman`, `/anket`, `/ilanlar`, `/relocation`, `/kariyer`); `/campaign/founding-1000` ve `/addwa`, `/whatsapp-groups` 301 hedefleri.
- **Yalnız canlıda:** başvuru satırları ve liderlik verisi. Salt okunur SQL:
  ```sql
  select status, count(*) from public.events group by status order by 1;
  select count(*) from public.whatsapp_landings;
  select count(*) from public.submissions;
  ```
  Elle: `/events` listesi, `/liderlik` sıralaması dolu.

### (8) Referans kodları ve elçi indirimleri
- **Mevcut:** `src/lib/referral-codes.test.ts` · `src/lib/admin/admin-referral-api.test.ts` · `src/lib/admin/referral-page-logic.test.ts` · `src/lib/welcome-pack-orders-api.test.ts`.
- **Boşluk:** kod üretim yüzeyi, davet bağlantısı karşılama bileşeni (`InviteRedemption`) ve admin referans ekranı kilitli değildi.
- **YENİ:** "(8)": referans kodu üretim/doğrulama fonksiyonları; admin `referral` menü öğesi + rotası; `<InviteRedemption />` ağaçta; elçi başvuru formu ve `submitWelcomePackOrder`.
- **AÇIK BOŞLUK:** "elçi indirimi" için istemci kodunda ayrı bir yüzey YOK (yalnız `referral_codes` tablosu ve karşılama paketinin `needs_flight_discount` alanı). İndirimin nerede uygulandığı (Stripe/L7 kapsamı) netleşmeden kilitlenecek bir şey yok.
- **Yalnız canlıda:** mevcut kodların geçerliliği. Salt okunur SQL: `select count(*) from public.referral_codes;` — öncesi/sonrası aynı. Elle: bilinen bir `?ref=` bağlantısı kodu kaydediyor.

### (9) Admin + Revizyon İstekleri modülü
- **Mevcut:** `src/lib/admin-shell/admin-navigation-registry.test.ts` · `src/lib/admin-shell/revision-requests.test.ts` · `src/lib/admin-shell/revision-number-format.test.ts` · `src/components/admin/revision/RevisionAttachmentGrid.test.tsx` · `src/App.admin-route.test.tsx`.
- **Boşluk:** `revision-requests` menü öğesinin silinmesi ve rotasının kalkması yakalanmıyordu.
- **YENİ:** "(9)": `revision-requests` → `/admin/revision-requests` menüde; rota `routes.tsx`'te; API `revision_requests` tablosunda; `/admin` yerleşimi `AdminLayout`.
- **Yalnız canlıda:** yönetici yetkisi ve açık revizyon kayıtları. Salt okunur SQL: `select count(*) from public.revision_requests;`. Elle: yönetici hesabıyla `/admin/revision-requests` açılıyor ve ek görseller yükleniyor.

### (10) SEO: indeksli adres aynı kalır ya da 301 ile gider; sitemap güncel; staging/prototip noindex
- **Mevcut:** `src/lib/redirects.test.ts` (nginx ↔ tablo) · `scripts/generate/generate-sitemap.test.mjs` · `src/lib/route-seo-contract.test.ts` · `src/App.notfound-seo.test.tsx` · `src/lib/seo.test.ts` · `src/lib/index-html-csp.test.ts`.
- **Boşluk:** sitemap'in statik listesinden bir adres çıkarılırsa (ya da rotası kalkıp 301'i yazılmazsa) hiçbir test düşmüyordu; `STATIC_ROUTES` sayısı sabit değildi.
- **YENİ:** "(10)": bugünkü 30 indeksli adres sitemap'te kalır; sitemap'teki her statik adres bir rota ya da 301 kaynağıdır (ölü adres yok); hiçbiri 301 kaynağı değildir; 5 bilinen eski adres 301 tablosunda; `/landingtrial` noindex ve sitemap dışı.
- **AÇIK BOŞLUK:** staging/prototip için sunucu tarafı `noindex` mekanizması YOK. `nginx.conf.template` yalnız `mvp.` ve `www.` adreslerini apex'e 301'ler; ayrı bir staging host'u tanımlı değil. Staging açılırsa `X-Robots-Tag: noindex` o host'a eklenmeli ve test yazılmalı (L4/L8 kararı).
- **Yalnız canlıda:** nginx'in çalışan davranışı (testler yalnız şablon METNİ denetler). Elle, deploy sonrası:
  ```
  curl -I https://corteqs.net/            # güvenlik başlıkları + CSP geliyor, X-Robots-Tag YOK
  curl -I https://corteqs.net/blog        # 301 → /radar/rehberler
  curl -s https://corteqs.net/sitemap.xml | grep -c "<loc>"   # beklenen: öncesiyle aynı ya da artmış
  ```
  Google Search Console: "Sayfa dizine eklenmedi" sayısı deploy sonrası artmıyor.

### (11) Analitik etiketleri (Clarity, GA, Ahrefs — `public/analytics.js`) her sayfada
- **Mevcut:** `src/lib/index-html-csp.test.ts` yalnız CSP'yi denetler; etiketlerin kendisini hiçbir test denetlemiyordu.
- **Boşluk:** `index.html`'den `/analytics.js` satırı ya da `analytics.js` içinden Clarity/gtag yükleyicisi silinirse sessizce veri toplanmaz.
- **YENİ:** "(11)": `index.html` `/analytics.js`'i `defer` ile yüklüyor; gtag/js + Ahrefs betikleri; `analytics.js` gtag config + Clarity yükleyicisi (`wdkgdje6rb`); GA kimliği iki yerde aynı; CSP üç ana makineye izin veriyor; satır içi analitik betiği yok.
- **Yalnız canlıda:** etiketin gerçekten veri göndermesi. Elle: canlı sayfada tarayıcı ağ sekmesinde `google-analytics.com/g/collect`, `clarity.ms/collect`, `analytics.ahrefs.com` istekleri; konsolda CSP ihlali yok. GA4 gerçek zamanlı raporda ziyaret görünüyor.

### (12) Rehber Motoru ve Radar içerikleri aynı adreslerle açılır
- **Mevcut:** `src/lib/radar-guides.test.ts` · `src/components/radar/RadarRehberlerSection.test.tsx` · `src/pages/BlogPostPage.test.tsx` · `src/lib/blog-seo.test.ts` · `src/lib/radar-pipeline.test.ts` · `src/lib/redirects.test.ts` (`/blog` 301).
- **Boşluk:** `/radar` ve `/radar/rehberler` rotalarının aynı sayfaya çıktığı, `/blog/:slug` ve `/diaspora/:slug` rotalarının durduğu kilitli değildi.
- **YENİ:** "(12)": 4 rota; `/radar` ve `/radar/rehberler` ikisi de `RadarHubPage`; `/blog` → `/radar/rehberler` 301; rehber bölümü ve `radar-guides.ts` yerinde.
- **Yalnız canlıda:** yayınlanmış rehber ve haber içeriği. Salt okunur SQL:
  ```sql
  select count(*) from public.blog_posts;
  select count(*) from public.radar_news_candidates;
  ```
  Elle: `/radar/rehberler` rehber listesi dolu, bir `/blog/<slug>` adresi açılıyor.

## Diğer L3 kapıları

| Kapı | Dosya | Ne korur |
|---|---|---|
| İlk yük JS bütçesi | `scripts/check/check-bundle-size.mjs` (`npm run check:bundle`) | `dist/index.html`'in eager yüklediği JS'in gzip toplamı: 258,2 KB ölçüldü (8 Kasım), bütçe 271 KB. Parça başına 500 KB ham tavan aynen duruyor |
| Lovable'dan gelmesin | `scripts/lovable-forbidden-strings.test.mjs` | 12 yasak dizge; `src/`, `supabase/functions/`, `public/**` ve kök yapılandırma dosyaları (izlenmeyen dosyalar dahil) taranır; `MockStripeCheckout` kod dizinlerinde, test dosyasındaki olumsuz iddia serbest. `GGVBLA-` listede yok: Barış 08.11 kararı, bizim gerçek kampanya kodumuz. Çıplak `lovable.app` de yok (yatırımcı sayfası bilerek kullanır) |
| Tarayıcı smoke | `e2e/lansman-smoke.spec.ts` | Ana sayfa, dizin araması, giriş, fiyat, Cadde kapısı |

## Lighthouse (elle protokol)

Lighthouse CI değil, elle ölçülür. Rapor dosyaları kök dizine `corteqs.net-*.html` adıyla iner; bu desen `.gitignore`'dadır, depoya girmez.

1. `npm run build && npx vite preview --port 8099`
2. Chrome DevTools › Lighthouse › Mobil, "Navigation", yalnız Performans. Ana sayfa (`/`), `/directory`, `/pricing`.
3. Her sayfa için 3 koşu, ortanca alınır. Skor ve LCP'yi bu dosyanın altına tarihle ekle.
4. Kabul: ana sayfa mobil skoru batch öncesinin altında değil.
