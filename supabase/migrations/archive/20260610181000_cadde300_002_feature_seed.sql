-- Cadde 3.0 Faz 2 (2/4): Granular cadde.* feature anahtarları + flat rol mapping'i (R-02).
-- Persona string'iyle yetki verilmez; tüm kontroller bu anahtarlar üzerinden yapılır.
-- Mapping kuralları (01-decisions.md):
--   * 14 temel üye yeteneği            → tüm aktif roller (politika detayı RPC'de)
--   * promotion.create / manage_own    → Business_/Consultant_/Organization_/Admin_ + User_BloggerVlogger
--                                        (Event_/Healthcare_/Job_/Marketplace_/Community_ bilinçli KAPALI;
--                                         ürün kararıyla role_features üzerinden açılabilir)
--   * city.highlight_free              → User_CityAmbassador + Admin_
--   * moderate                         → Admin_ (ContentModerator dahil)
--   * admin                            → Admin_PlatformAdmin, Admin_SuperAdmin

begin;

insert into public.afs_features (key, label, description, scope_role, scope, feature_type, metadata, sort_order, is_active_globally)
values
  ('cadde.post.create',         'Cadde Paylaşımı',                   'Cadde akışında paylaşım oluşturma.',                          '*', 'cadde', 'capability', '{}'::jsonb, 616, true),
  ('cadde.post.edit_own',       'Kendi Paylaşımını Düzenleme',       'Kullanıcının kendi Cadde paylaşımını düzenlemesi.',           '*', 'cadde', 'capability', '{}'::jsonb, 617, true),
  ('cadde.post.comment',        'Cadde Yorumu',                      'Cadde paylaşımlarına yorum yazma.',                           '*', 'cadde', 'capability', '{}'::jsonb, 618, true),
  ('cadde.post.react',          'Cadde Reaksiyonu',                  'Cadde paylaşımlarına reaksiyon bırakma.',                     '*', 'cadde', 'capability', '{}'::jsonb, 619, true),
  ('cadde.bridge.post',         'Köprü Paylaşımı',                   'Köprü akışına paylaşım (attribute koşulları RPC''de).',       '*', 'cadde', 'capability', '{}'::jsonb, 620, true),
  ('cadde.cafe.read',           'Cafe Görüntüleme',                  'Aktif cafe listesini görüntüleme.',                           '*', 'cadde', 'capability', '{}'::jsonb, 621, true),
  ('cadde.cafe.join',           'Cafe Katılımı',                     'Cafe odalarına katılma (policy RPC''de).',                    '*', 'cadde', 'capability', '{}'::jsonb, 622, true),
  ('cadde.cafe.create',         'Cafe Açma',                         'Yeni cafe odası açma (policy RPC''de).',                      '*', 'cadde', 'capability', '{}'::jsonb, 623, true),
  ('cadde.cafe.manage_own',     'Kendi Cafe''sini Yönetme',          'Kendi cafe''sinde üye onayı, arşivleme vb.',                  '*', 'cadde', 'capability', '{}'::jsonb, 624, true),
  ('cadde.carsi.read',          'Çarşı Görüntüleme',                 'Çarşı ilanlarını görüntüleme.',                               '*', 'cadde', 'capability', '{}'::jsonb, 625, true),
  ('cadde.carsi.create',        'Çarşı İlanı Açma',                  'Çarşı''da ilan oluşturma (limitler entitlement''a bağlı).',   '*', 'cadde', 'capability', '{}'::jsonb, 626, true),
  ('cadde.carsi.manage_own',    'Kendi İlanlarını Yönetme',          'Kendi Çarşı ilanlarını düzenleme/pasife alma.',               '*', 'cadde', 'capability', '{}'::jsonb, 627, true),
  ('cadde.promotion.create',    'Tanıtım Kampanyası Oluşturma',      'Sponsorlu görünürlük kampanyası oluşturma.',                  '*', 'cadde', 'capability', '{}'::jsonb, 628, true),
  ('cadde.promotion.manage_own','Kendi Kampanyalarını Yönetme',      'Kendi Tanıtım kampanyalarını yönetme.',                       '*', 'cadde', 'capability', '{}'::jsonb, 629, true),
  ('cadde.city.highlight_free', 'Şehir Elçisi Ücretsiz Öne Çıkarma', 'Elçinin kendi şehrinde ücretsiz highlight hakkı.',            '*', 'cadde', 'capability', '{}'::jsonb, 630, true),
  ('cadde.moderate',            'Cadde Moderasyonu',                 'Post/cafe/ilan gizleme, report çözme.',                       '*', 'cadde', 'capability', '{}'::jsonb, 631, true),
  ('cadde.admin',               'Cadde Yönetimi',                    'Cadde modülünün tam yönetimi.',                               '*', 'cadde', 'capability', '{}'::jsonb, 632, true),
  ('cadde.notifications',       'Cadde Bildirimleri',                'Cadde bildirimlerini alma.',                                  '*', 'cadde', 'capability', '{}'::jsonb, 633, true),
  ('cadde.diaspora.switch',     'Diaspora Değiştirme',               'Cadde''de diaspora anahtarı değiştirme.',                     '*', 'cadde', 'capability', '{}'::jsonb, 634, true)
on conflict (key) do update
set label = excluded.label,
    description = excluded.description,
    scope_role = excluded.scope_role,
    scope = excluded.scope,
    feature_type = excluded.feature_type,
    sort_order = excluded.sort_order,
    is_active_globally = excluded.is_active_globally,
    updated_at = now();

-- 14 temel üye yeteneği → tüm aktif roller
insert into public.role_features (role_id, feature_key, is_enabled)
select r.id, f.key, true
from public.roles r
cross join (values
  ('cadde.post.create'), ('cadde.post.edit_own'), ('cadde.post.comment'), ('cadde.post.react'),
  ('cadde.bridge.post'),
  ('cadde.cafe.read'), ('cadde.cafe.join'), ('cadde.cafe.create'), ('cadde.cafe.manage_own'),
  ('cadde.carsi.read'), ('cadde.carsi.create'), ('cadde.carsi.manage_own'),
  ('cadde.notifications'), ('cadde.diaspora.switch')
) as f(key)
where r.is_active = true
on conflict (role_id, feature_key) do update
set is_enabled = excluded.is_enabled, updated_at = now();

-- Tanıtım (Çıfıt) yetkileri
insert into public.role_features (role_id, feature_key, is_enabled)
select r.id, f.key, true
from public.roles r
cross join (values ('cadde.promotion.create'), ('cadde.promotion.manage_own')) as f(key)
where r.is_active = true
  and (split_part(r.key, '_', 1) in ('Business', 'Consultant', 'Organization', 'Admin')
       or r.key = 'User_BloggerVlogger')
on conflict (role_id, feature_key) do update
set is_enabled = excluded.is_enabled, updated_at = now();

-- Şehir elçisi ücretsiz highlight
insert into public.role_features (role_id, feature_key, is_enabled)
select r.id, 'cadde.city.highlight_free', true
from public.roles r
where r.is_active = true
  and (r.key = 'User_CityAmbassador' or split_part(r.key, '_', 1) = 'Admin')
on conflict (role_id, feature_key) do update
set is_enabled = excluded.is_enabled, updated_at = now();

-- Moderasyon: tüm Admin_ rolleri
insert into public.role_features (role_id, feature_key, is_enabled)
select r.id, 'cadde.moderate', true
from public.roles r
where r.is_active = true and split_part(r.key, '_', 1) = 'Admin'
on conflict (role_id, feature_key) do update
set is_enabled = excluded.is_enabled, updated_at = now();

-- Tam yönetim: yalnız platform/super admin
insert into public.role_features (role_id, feature_key, is_enabled)
select r.id, 'cadde.admin', true
from public.roles r
where r.is_active = true and r.key in ('Admin_PlatformAdmin', 'Admin_SuperAdmin')
on conflict (role_id, feature_key) do update
set is_enabled = excluded.is_enabled, updated_at = now();

commit;
