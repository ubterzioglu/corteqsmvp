# Simplification Inventory Report

Date: `2026-06-06`

## Scope

This report captures the taxonomy retirement and admin simplification surface discovered in the codebase before the cleanup pass. It is intentionally split into:

- static code/schema evidence discovered locally
- live-count SQL that should run against the linked Supabase project during deployment verification

## Static Findings

### Active admin entry points touched by this change

- `src/components/admin/admin-navigation.ts`
- `src/components/admin/AdminLayout.tsx`
- `src/App.tsx`
- `src/pages/admin/AdminHomePage.tsx`
- `src/pages/admin/AdminCatalogPage.tsx`
- `src/components/admin/catalog/CatalogEntityProfilePanel.tsx`
- `src/pages/admin/AdminNewMemberGuidePage.tsx`

### Taxonomy-related frontend/runtime usage discovered

- Retired admin route previously mounted at `/admin/new-member/taxonomy`
- Profile payload mapping previously consumed `taxonomy_groups` in `src/lib/member-profile.ts`
- Public profile view model previously turned taxonomy payload into badges in `src/lib/profile-view-model.ts`
- Profile UI previously rendered a locked taxonomy card in `src/pages/ProfilePage.tsx`
- Legacy admin/editor surfaces still mention taxonomy in copy or legacy screens:
  - `src/pages/admin/AdminLoginUsersRolesPage.tsx`
  - `src/pages/admin/AdminAttributesPage.tsx`
  - `src/pages/admin/AdminProfileSectionsPage.tsx`
  - `src/pages/admin/AdminRolesFeaturesPage.tsx`
  - `src/pages/admin/AdminTaxonomyPage.tsx`

### Item-level override/admin rule engine usage discovered

- Standard UI usage was found in:
  - `src/pages/admin/AdminCatalogPage.tsx`
  - `src/components/admin/catalog/CatalogItemRolePanel.tsx`
  - `src/components/admin/catalog/CatalogItemRuleManager.tsx`
- RPC client wrappers remain in `src/lib/admin-catalog.ts`
- Catalog entity feature override UI previously existed in `src/components/admin/catalog/CatalogEntityProfilePanel.tsx`

### Supabase functions/tables referenced by the active codebase

Taxonomy/runtime related:

- `public.get_public_profile_sections(uuid)`
- `public.get_current_user_profile()`
- `public.admin_update_user_taxonomy_selection(uuid, text, text[])`
- `public.admin_upsert_role_taxonomy_rule(text, text, boolean, boolean, text)`
- `public.admin_set_taxonomy_option_active(text, boolean)`
- `public.update_user_taxonomy_selection(text, text[])`
- `public.taxonomy_groups`
- `public.taxonomy_options`
- `public.role_taxonomy_rules`
- `public.user_taxonomy_selections`

Item-level override related:

- `public.get_catalog_item_rules(uuid)`
- `public.admin_upsert_catalog_item_attribute_override(...)`
- `public.admin_delete_catalog_item_attribute_override(...)`
- `public.admin_upsert_catalog_item_feature_override(...)`
- `public.admin_delete_catalog_item_feature_override(...)`
- `public.admin_upsert_catalog_item_section_override(...)`
- `public.admin_delete_catalog_item_section_override(...)`
- `public.catalog_item_attribute_overrides`
- `public.catalog_item_feature_overrides`
- `public.catalog_item_section_overrides`

Role-maintenance path discovered:

- `public.admin_change_catalog_item_role(uuid, text, text)`
- `public.admin_set_catalog_item_role(uuid, text)`

## Live Inventory SQL

The current local session did not execute against a live Supabase database, so the following queries should be run in the target environment to capture exact counts.

### Roles and catalog health

```sql
select 'roles_total' as metric, count(*)::text as value from public.roles
union all
select 'roles_active', count(*)::text from public.roles where is_active = true
union all
select 'catalog_items_total', count(*)::text from public.catalog_items
union all
select 'catalog_items_null_role', count(*)::text from public.catalog_items where platform_role_key is null
union all
select 'catalog_items_unknown_role', count(*)::text
from public.catalog_items ci
where ci.platform_role_key is not null
  and not exists (
    select 1 from public.roles r where r.key = ci.platform_role_key
  )
union all
select 'user_feature_overrides_total', count(*)::text from public.user_feature_overrides;
```

### Taxonomy counts

```sql
select 'taxonomy_groups' as source, count(*) from public.taxonomy_groups
union all
select 'taxonomy_options', count(*) from public.taxonomy_options
union all
select 'role_taxonomy_rules', count(*) from public.role_taxonomy_rules
union all
select 'user_taxonomy_selections', count(*) from public.user_taxonomy_selections;
```

### Item-level override counts

```sql
select 'catalog_item_attribute_overrides' as source, count(*) from public.catalog_item_attribute_overrides
union all
select 'catalog_item_feature_overrides', count(*) from public.catalog_item_feature_overrides
union all
select 'catalog_item_section_overrides', count(*) from public.catalog_item_section_overrides;
```

### Object discovery

```sql
select routine_name
from information_schema.routines
where routine_schema = 'public'
  and (
    routine_name ilike '%taxonomy%'
    or routine_name ilike '%catalog_item%override%'
    or routine_name in (
      'get_current_user_profile',
      'get_public_profile_sections',
      'get_catalog_item_profile',
      'get_catalog_item_rules',
      'admin_change_catalog_item_role',
      'admin_set_catalog_item_role'
    )
  )
order by routine_name;
```

## Notes

- Taxonomy tables should be preserved during the first retirement pass.
- Item-level override tables/functions should be treated as deprecated inventory, not dropped immediately.
- Standard admin UI should no longer expose role mutation or item-level AFS override controls after this pass.
