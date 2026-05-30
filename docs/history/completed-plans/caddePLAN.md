# CorteQS Cadde Loginli Kullanıcı Sistemi Planı

## Özet
`cadde.md` ve mevcut repo birlikte değerlendirildiğinde en doğru yaklaşım, yeni bir auth sistemi kurmak değil; mevcut `Supabase Auth + user_profiles + roles/features + admin_users` altyapısını kullanarak Cadde’yi bu yapıya bağlamak. Uygulama mevcut stack ile devam etmeli: `Vite + React Router + React Query + Supabase`. Bugün eklenmiş `supabase/migrations/20260529213000_create_cadde_mvp.sql` temel alınacak ve artımlı migration’larla genişletilecek.

İlk hedef yalnızca “login gate” değil; login olmuş kullanıcılar için tam rol uyumlu Cadde katılım sistemi olacak. Bu kapsamda üyeler post/reaction/comment/cafe akışlarını kullanacak, premium/verified/business/consultant farkları mevcut rol-feature sistemi üzerinden yönetilecek, admin tarafı da mevcut `/admin` kabuğuna entegre edilecek.

## Uygulama Değişiklikleri
- `src/App.tsx` içine yeni rotalar eklenir: `/cadde`, `/cadde/cafes/:id`, `/cadde/admin` yerine mevcut admin altında `/admin/cadde`, `/admin/cadde/posts`, `/admin/cadde/cafes`, `/admin/cadde/billboard`, `/admin/cadde/locations`.
- Yeni frontend modülü `src/pages/CaddePage.tsx` ve ilgili `src/components/cadde/*` bileşenleri ile kurulur. Bileşen seti: header, location card, mode toggle, country/city filters, bridge toggle, world time chips, cafe row, post composer gate, feed list, post card, comments drawer/expand area, sponsored banner, billboard column, people discovery card.
- Loginli kullanıcı davranışı mevcut `AuthProvider` ve `RequireAuth` üstünden değil, sayfa içi “graceful gate” ile çözülür:
  - ziyaretçi feed’i görür ama post/reaction/comment/cafe create CTA’larında `/login` yönlendirmesi veya modal prompt görür
  - loginli kullanıcı composer, reaction, comment, cafe create/join işlemlerini yapar
  - login sonrası dönüş hedefi `/cadde` olur
- Cadde kullanıcı yetkileri mevcut feature sistemiyle bağlanır. Yeni feature key’ler eklenir:
  - `cadde.view`
  - `cadde.post.create`
  - `cadde.post.react`
  - `cadde.comment.create`
  - `cadde.cafe.create`
  - `cadde.cafe.join`
  - `cadde.billboard.submit`
  - `cadde.moderate`
  Bunlar `roles`, `role_feature_flags`, `user_feature_overrides`, `get_current_user_features()` akışına dahil edilir.
- Rol eşlemesi net tanımlanır:
  - tüm aktif loginli kullanıcılar `cadde.view`
  - standart üyeler `post/react/comment/cafe.join`
  - cafe create premium veya uygun role-feature ile açılır; başlangıçta standart üyeye de açık olabilir ama günlük limit uygulanır
  - premium/verified görünürlük ve cafe süresi gibi farklar feature veya user override ile çözülür
  - business/consultant/event owner billboard self-service için şimdilik approval tabanlı ilerler
- People discovery, sıfırdan yeni arama motoru yerine mevcut `/directory` RPC’sine bağlanır. Cadde filtreleri `country` ve `city` query param olarak taşınır. İkinci adımda directory sonuçları Cadde sol paneline hafif kartlar olarak gömülebilir.
- UI mimarisi `cadde.md`’deki ekranı baz alır ama repo gerçeklerine göre uygulanır:
  - demo/real toggle URL ile senkron olur
  - country/city/bridge/mode filtreleri `useSearchParams` ile tutulur
  - time chips client-side dakika bazlı güncellenir
  - responsive davranış mevcut tasarım sistemiyle yapılır; mobilde sidebar drawer, billboard feed içine taşınır

## Veri Modeli ve Arayüzler
- Mevcut `cadde_*` tabloları korunur; yeni migration’larla genişletilir.
- `cadde_posts` genişletilir:
  - `post_type` enum değerleri `general|question|help|job|housing|event|business|bridge` olacak şekilde genişletilir
  - `search_text` veya FTS alanı eklenir
  - `author_role` mevcut role snapshot olarak tutulmaya devam eder
  - opsiyonel `author_profile_type`, `visibility`, `comment_count_cache`, `reaction_count_cache` alanları eklenir
- `cadde_post_reactions` genişletilir:
  - reaction type seti `like|laugh|celebrate|support` olarak netlenir
  - UI quick reactions bu listeye bağlanır
- `cadde_post_comments` için `status`, `is_demo`, soft moderation alanları eklenir.
- `cadde_cafes` genişletilir:
  - `participant_limit`, `category`, `daily_limit_bucket_date`, `visibility`, `host_profile_type`
  - `ends_at` hesaplama kuralı feature tabanlı olur: standart 2 saat, premium 4 saat
- `cadde_cafe_members` için duplicate join mevcut unique kuralıyla korunur; aktif olmayan/expired cafe’ye join server-side engellenir.
- `cadde_billboard_cards` genişletilir:
  - consultant/business/event varyantlarını ayıran render alanları korunur
  - admin-seeded içerik ilk sürümde esas olur
  - self-service submission ayrı approval akışı olarak planlanır, doğrudan publish edilmez
- `cadde_sponsored_placements` feed-inline kullanımına devam eder; her N post sonrası inject edilir.
- Yeni tablolar eklenir:
  - `cadde_analytics_events`:
    `event_name`, `user_id`, `session_id`, `payload`, `created_at`
  - `cadde_reports`:
    post/comment/cafe report kayıtları
  - gerekirse `cadde_daily_usage`:
    user bazlı post/comment/cafe sayaçları
- RLS yaklaşımı:
  - public read yalnızca `published` + aktif kayıtlar
  - authenticated write yalnızca kendi `auth.uid()` kaydı adına
  - mutation yetkileri yalnızca ilgili Cadde feature aktifse çalışmalı; kritik limitler sadece frontend’de değil RPC veya DB function içinde denetlenmeli
- Yeni RPC / query arayüzleri:
  - `get_cadde_bootstrap(filters)`
  - `list_cadde_posts(filters, cursor)`
  - `create_cadde_post(input)`
  - `toggle_cadde_reaction(post_id, reaction_type)`
  - `list_cadde_comments(post_id, cursor)`
  - `create_cadde_comment(post_id, body)`
  - `list_cadde_cafes(filters)`
  - `create_cadde_cafe(input)`
  - `join_cadde_cafe(cafe_id)`
  - `list_cadde_billboards(filters)`
  - `list_cadde_sponsored(filters)`
  - `track_cadde_event(event_name, payload)`
  RPC tercih edilmeli; çünkü günlük limit, premium süre ve feature kontrolü merkezi kalmalı.
- TypeScript arayüzleri:
  - `CaddeFilters`
  - `CaddeViewerState`
  - `CaddePost`
  - `CaddeReactionType`
  - `CaddeCafe`
  - `CaddeBillboardCard`
  Bu tipler `src/lib/cadde/types.ts` altında toplanmalı.

## Admin ve Operasyon
- Mevcut `/admin` içine Cadde yönetim bölümü eklenir; ayrı auth mantığı yazılmaz, mevcut `admin_users` ve `AdminLayout` kullanılır.
- İlk admin ekranları:
  - posts moderation
  - cafes moderation/close
  - billboard CRUD
  - sponsored placement CRUD
  - country/city management
  - demo seed visibility toggle
- Admin işlemleri mümkün olduğunca mevcut audit yaklaşımına uyar; Cadde admin mutation’ları `admin_audit_logs` veya Cadde’ye özel audit alanına log düşer.
- Seed stratejisi:
  - mevcut migration’daki demo veriler korunur
  - ikinci migration ile `cadde.md`’ye daha yakın demo post/cafe/billboard sayısı tamamlanır
  - demo ve real içerik ayrımı sadece `content_mode` üzerinden sürdürülür

## Test Planı
- Veritabanı / RLS:
  - anonim kullanıcı post/reaction/comment/cafe create edemez
  - loginli kullanıcı yalnızca kendi post/comment/reaction/cafe kayıtlarını değiştirebilir
  - admin tüm moderation akışlarını yapabilir
  - günlük 3 cafe limiti server-side çalışır
  - premium olmayan kullanıcı için cafe süresi 2 saat, premium için 4 saat atanır
- Frontend:
  - ziyaretçi `/cadde` feed’i ve demo/real toggle’ı görür
  - ziyaretçi post composer yerine login gate görür
  - loginli kullanıcı composer, reaction, comment ve cafe create/join akışlarını kullanır
  - filtreler URL ile senkron kalır ve refresh sonrası korunur
  - `/directory` linki Cadde filtrelerini taşır
  - mobilde sidebar ve billboard yerleşimi bozulmaz
- Entegrasyon:
  - `get_current_user_features()` çıktısı Cadde buton görünürlüğünü doğru etkiler
  - login sonrası `/cadde` dönüşü çalışır
  - admin panelden gizlenen post public feed’de görünmez
- Test araçları:
  - mevcut `vitest` ile component/hook testleri
  - kritik RLS ve mutation senaryoları için Supabase test SQL veya script bazlı doğrulama
  - gerekiyorsa Playwright ile `visitor vs authenticated` temel akış smoke testleri

## Varsayımlar
- Next.js migrasyonu yapılmayacak; mevcut Vite mimarisi korunacak.
- Cadde kullanıcıları mevcut CorteQS hesabını kullanacak; ikinci auth sistemi kurulmayacak.
- Şema stratejisi mevcut `cadde_*` tablolarını koruyup artımlı genişletme olacak; yeniden adlandırma yapılmayacak.
- İlk sürümde billboard self-service publish değil, admin/approval kontrollü olacak.
- People discovery için mevcut `directory` altyapısı yeniden kullanılacak; Cadde’ye özel ayrı people veri modeli ilk adımda kurulmayacak.
- Premium/verified davranışları yeni auth rolüyle değil, mevcut role/feature/override sistemiyle yönetilecek.
