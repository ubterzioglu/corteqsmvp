-- A4.2 · Hesap silme — FK bağımlılık analizi
--
-- Bu dosya hangi tabloların users/user_id'ye FK bağımlılığı olduğunu listeler.
-- Canlıda çalıştır: \i supabase/qa/account-deletion-fk-analysis.sql
--
-- Çıktı: RESTRICT/NO ACTION/CASCADE/SET NULL listesine göre sınıflandırma.

-- 1. Tüm FK bağımlılıklarını listele
select
  tc.table_schema,
  tc.table_name,
  kcu.column_name,
  ccu.table_name as foreign_table_name,
  ccu.column_name as foreign_column_name,
  rc.delete_rule,
  rc.update_rule
from information_schema.table_constraints as tc
join information_schema.key_column_usage as kcu
  on tc.constraint_name = kcu.constraint_name
  and tc.table_schema = kcu.table_schema
join information_schema.constraint_column_usage as ccu
  on ccu.constraint_name = tc.constraint_name
  and ccu.table_schema = tc.table_schema
join information_schema.referential_constraints as rc
  on tc.constraint_name = rc.constraint_name
  and tc.table_schema = rc.constraint_schema
where tc.constraint_type = 'FOREIGN KEY'
  and ccu.table_name = 'users'
  and ccu.table_schema = 'auth'
order by tc.table_name;

-- 2. user_id kolonuna sahip tablolar (FK olmasa bile)
select
  table_schema,
  table_name,
  column_name,
  data_type
from information_schema.columns
where column_name = 'user_id'
  and table_schema = 'public'
order by table_name;

-- 3. Beklenen RESTRICT/NO ACTION tabloları (plan'dan)
-- Bu tablolar manuel inceleme gerektirir:
-- RESTRICT:
--   - vip_invitations.created_by
--   - platform_safety_core
--   - contributor_resource_submissions.submitted_by
--   - group_strikes.decided_by
-- NO ACTION:
--   - cadde_cafe_members.approved_by
--   - cadde_moderation_queue.resolved_by
--   - cadde_promotion_campaigns.approved_by
--   - cadde_promotion_events.viewer_user_id
--   - cadde_user_bans.created_by
--   - survey_responses.respondent_user_id
--   - surveys.approved_by/created_by
