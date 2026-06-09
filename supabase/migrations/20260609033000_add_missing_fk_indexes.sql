-- ============================================================
-- Purpose:                Add missing indexes on 44 foreign-key columns (join/cascade/RLS performance)
-- Module:                 CROSS-CUTTING (catalog, cadde, surveys, referral, workspace, ...)
-- Risk level:             low (additive, idempotent, CONCURRENTLY = no long lock; reversible via DROP INDEX)
-- Preconditions:          FK column has no left-most supporting index (verified live 2026-06-09)
-- Rollback:               DROP INDEX CONCURRENTLY IF EXISTS <name>; for each below
-- Data migration required: no
-- Estimated lock impact:  minimal (CREATE INDEX CONCURRENTLY takes only a brief ShareUpdateExclusiveLock)
-- Manual verification:    SELECT after apply that each idx_* exists; monitor pg_stat_user_indexes.idx_scan over time
-- NOTE: CONCURRENTLY cannot run inside a transaction; this file is applied statement-by-statement.
-- ============================================================

-- Replay-safety (2026-06-09): some referenced tables (e.g. command_center_legacy_map,
-- wa_*/whatsapp_* and other prod-only tables) exist only in the production DB and not
-- in a clean migration replay. CONCURRENTLY was also removed (cannot run in the supabase
-- migration pipeline). Each index is created only if its table exists; no-op on prod where
-- all tables are present and every index uses IF NOT EXISTS.
DO $$
DECLARE
  v_idx text;
  v_tbl text;
  v_col text;
  specs text[][] := ARRAY[
    ['idx_approval_requests_target_feature_key','approval_requests','target_feature_key'],
    ['idx_cadde_billboard_cards_city_id','cadde_billboard_cards','city_id'],
    ['idx_cadde_billboard_cards_country_id','cadde_billboard_cards','country_id'],
    ['idx_cadde_cafe_members_user_id','cadde_cafe_members','user_id'],
    ['idx_cadde_cafes_city_id','cadde_cafes','city_id'],
    ['idx_cadde_cafes_country_id','cadde_cafes','country_id'],
    ['idx_cadde_cafes_host_user_id','cadde_cafes','host_user_id'],
    ['idx_cadde_post_comments_user_id','cadde_post_comments','user_id'],
    ['idx_cadde_post_reactions_user_id','cadde_post_reactions','user_id'],
    ['idx_cadde_posts_author_user_id','cadde_posts','author_user_id'],
    ['idx_cadde_posts_city_id','cadde_posts','city_id'],
    ['idx_cadde_sponsored_placements_city_id','cadde_sponsored_placements','city_id'],
    ['idx_cadde_sponsored_placements_country_id','cadde_sponsored_placements','country_id'],
    ['idx_catalog_item_attribute_overrides_attribute_key','catalog_item_attribute_overrides','attribute_key'],
    ['idx_catalog_item_feature_overrides_feature_key','catalog_item_feature_overrides','feature_key'],
    ['idx_catalog_item_relations_related_item_id','catalog_item_relations','related_item_id'],
    ['idx_catalog_item_section_overrides_section_key','catalog_item_section_overrides','section_key'],
    ['idx_catalog_item_types_linked_role_key','catalog_item_types','linked_role_key'],
    ['idx_command_center_legacy_map_command_center_item_id','command_center_legacy_map','command_center_item_id'],
    ['idx_duplicate_candidates_right_item_id','duplicate_candidates','right_item_id'],
    ['idx_expenses_created_by','expenses','created_by'],
    ['idx_incomes_created_by','incomes','created_by'],
    ['idx_item_type_attribute_rules_attribute_id','item_type_attribute_rules','attribute_id'],
    ['idx_item_type_feature_defaults_feature_key','item_type_feature_defaults','feature_key'],
    ['idx_item_type_features_feature_key','item_type_features','feature_key'],
    ['idx_merge_history_source_item_id','merge_history','source_item_id'],
    ['idx_moderation_queue_item_id','moderation_queue','item_id'],
    ['idx_moderation_queue_source_record_id','moderation_queue','source_record_id'],
    ['idx_notifications_user_id','notifications','user_id'],
    ['idx_profile_onboarding_imports_source_submission_id','profile_onboarding_imports','source_submission_id'],
    ['idx_referral_codes_type_id','referral_codes','type_id'],
    ['idx_role_profile_section_rules_section_id','role_profile_section_rules','section_id'],
    ['idx_role_taxonomy_rules_group_id','role_taxonomy_rules','group_id'],
    ['idx_service_proposals_consultant_id','service_proposals','consultant_id'],
    ['idx_service_proposals_request_id','service_proposals','request_id'],
    ['idx_service_requests_user_id','service_requests','user_id'],
    ['idx_survey_responses_respondent_user_id','survey_responses','respondent_user_id'],
    ['idx_surveys_approved_by','surveys','approved_by'],
    ['idx_surveys_created_by','surveys','created_by'],
    ['idx_user_taxonomy_selections_group_id','user_taxonomy_selections','group_id'],
    ['idx_user_taxonomy_selections_option_id','user_taxonomy_selections','option_id'],
    ['idx_welcome_pack_proposals_order_id','welcome_pack_proposals','order_id'],
    ['idx_whatsapp_join_requests_user_id','whatsapp_join_requests','user_id'],
    ['idx_whatsapp_landing_editors_granted_by','whatsapp_landing_editors','granted_by']
  ];
  i int;
BEGIN
  FOR i IN 1 .. array_length(specs, 1) LOOP
    v_idx := specs[i][1];
    v_tbl := specs[i][2];
    v_col := specs[i][3];
    IF to_regclass('public.' || v_tbl) IS NOT NULL
       AND EXISTS (select 1 from information_schema.columns
                   where table_schema='public' and table_name=v_tbl and column_name=v_col) THEN
      EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (%I);', v_idx, v_tbl, v_col);
    END IF;
  END LOOP;
END $$;
