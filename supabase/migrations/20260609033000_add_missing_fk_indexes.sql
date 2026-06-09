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

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_approval_requests_target_feature_key ON public.approval_requests (target_feature_key);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cadde_billboard_cards_city_id ON public.cadde_billboard_cards (city_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cadde_billboard_cards_country_id ON public.cadde_billboard_cards (country_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cadde_cafe_members_user_id ON public.cadde_cafe_members (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cadde_cafes_city_id ON public.cadde_cafes (city_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cadde_cafes_country_id ON public.cadde_cafes (country_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cadde_cafes_host_user_id ON public.cadde_cafes (host_user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cadde_post_comments_user_id ON public.cadde_post_comments (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cadde_post_reactions_user_id ON public.cadde_post_reactions (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cadde_posts_author_user_id ON public.cadde_posts (author_user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cadde_posts_city_id ON public.cadde_posts (city_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cadde_sponsored_placements_city_id ON public.cadde_sponsored_placements (city_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cadde_sponsored_placements_country_id ON public.cadde_sponsored_placements (country_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_catalog_item_attribute_overrides_attribute_key ON public.catalog_item_attribute_overrides (attribute_key);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_catalog_item_feature_overrides_feature_key ON public.catalog_item_feature_overrides (feature_key);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_catalog_item_relations_related_item_id ON public.catalog_item_relations (related_item_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_catalog_item_section_overrides_section_key ON public.catalog_item_section_overrides (section_key);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_catalog_item_types_linked_role_key ON public.catalog_item_types (linked_role_key);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_command_center_legacy_map_command_center_item_id ON public.command_center_legacy_map (command_center_item_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_duplicate_candidates_right_item_id ON public.duplicate_candidates (right_item_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_expenses_created_by ON public.expenses (created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_incomes_created_by ON public.incomes (created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_item_type_attribute_rules_attribute_id ON public.item_type_attribute_rules (attribute_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_item_type_feature_defaults_feature_key ON public.item_type_feature_defaults (feature_key);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_item_type_features_feature_key ON public.item_type_features (feature_key);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_merge_history_source_item_id ON public.merge_history (source_item_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_moderation_queue_item_id ON public.moderation_queue (item_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_moderation_queue_source_record_id ON public.moderation_queue (source_record_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_onboarding_imports_source_submission_id ON public.profile_onboarding_imports (source_submission_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referral_codes_type_id ON public.referral_codes (type_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_role_profile_section_rules_section_id ON public.role_profile_section_rules (section_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_role_taxonomy_rules_group_id ON public.role_taxonomy_rules (group_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_proposals_consultant_id ON public.service_proposals (consultant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_proposals_request_id ON public.service_proposals (request_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_requests_user_id ON public.service_requests (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_survey_responses_respondent_user_id ON public.survey_responses (respondent_user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_surveys_approved_by ON public.surveys (approved_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_surveys_created_by ON public.surveys (created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_taxonomy_selections_group_id ON public.user_taxonomy_selections (group_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_taxonomy_selections_option_id ON public.user_taxonomy_selections (option_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_welcome_pack_proposals_order_id ON public.welcome_pack_proposals (order_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_join_requests_user_id ON public.whatsapp_join_requests (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_landing_editors_granted_by ON public.whatsapp_landing_editors (granted_by);
