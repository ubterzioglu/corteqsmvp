-- relocation_rank_locations_v1: her satıra `explanations` alanı (geriye uyumlu).
--
-- Canlı hata (client_error_reports, route=/relocation, 20.09–23.09 arası 11 kayıt):
--   "Cannot read properties of undefined (reading 'length')"
--   component_stack: RelocationHomePage → radix Tabs → şehir kartı.
-- Kök neden: TS sözleşmesi (`RelocationLocationRecommendation.explanations: string[]`)
-- bu alanı zorunlu sayıyordu ama RPC onu HİÇ üretmiyordu. 2026-06-19 tarihli
-- `20260619103000_relocation_recommendations.sql` gövdesinde de `explanations` yoktur;
-- yani alan ilk günden beri eksikti, 22.09 demo seed'iyle şehir kartı ilk kez
-- çizilince görünür oldu.
--
-- Bu migration:
--   * İmza (p_move_id uuid) ve dönüş tipi (jsonb) DEĞİŞMEZ → DROP gerekmez,
--     CREATE OR REPLACE mevcut grant'leri korur.
--   * Gövde, CANLI tanımdan (pg_get_functiondef, 2026-09-25) birebir alınmıştır;
--     tek fark jsonb_build_object'e eklenen `'explanations', '[]'::jsonb` satırıdır.
--   * Açıklama metni üretimi ayrı bir iştir; şimdilik boş dizi döner. İstemci
--     (src/lib/relocation-normalize.ts) alanı yine de ayrıca normalize eder — eski
--     sürüm RPC'ye karşı da çökmez.
--
-- Diğer RPC'ler tarandı, SQL değişikliği GEREKMEDİ:
--   * relocation_rank_services_v1 → SETOF relocation_services; `languages text[]
--     NOT NULL default '{}'`. Tablo `location_id/is_active/created_at/updated_at`
--     ek sütunlarını da döner (TS tipinde yok, zararsız).
--   * relocation_build_checklist_v1 → SETOF relocation_bureaucratic_steps;
--     `required_documents` / `output_artifacts` text[] NOT NULL default '{}'.
--   * relocation_emergency_contacts → düz tablo okuması, dizi alanı yok.
--   Bu sözleşmeler bugün tabloda NOT NULL ile korunuyor; istemci normalizasyonu
--   ikinci savunma hattıdır.

create or replace function public.relocation_rank_locations_v1(p_move_id uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_move public.relocation_moves%rowtype := public.relocation_owned_move(p_move_id);
  v_rows jsonb;
begin
  with scored as (
    select
      l.id,
      l.country_code,
      l.city_code,
      l.city_name,
      l.freshness_at,
      -- Bileşenler (0..1) — clamp_neutral ile.
      -- budget_fit: bütçe yoksa nötr; varsa cost_index düşükse yüksek uyum (basit ters orantı).
      public.relocation_clamp_neutral(
        case when v_move.budget_monthly is null then null
             else greatest(0, least(1, 1 - coalesce(l.cost_index, 0.5))) end
      ) as budget_fit,
      public.relocation_clamp_neutral(1 - coalesce(l.bureaucracy_complexity, 0.5)) as bureaucracy_ease,
      public.relocation_clamp_neutral(l.healthcare_access) as healthcare_access,
      public.relocation_clamp_neutral(l.gsm_coverage) as gsm_coverage,
      public.relocation_clamp_neutral(l.community_density) as community_fit,
      public.relocation_clamp_neutral(l.flight_access) as flight_access,
      -- Sert filtre: hedef ülke eşleşmesi + tazelik (90 günden eski değil veya null kabul).
      (
        (array_length(v_move.target_country_codes, 1) is null
         or l.country_code = any (v_move.target_country_codes))
        and l.is_active
      ) as hard_filter_pass,
      (select count(*) filter (where r.authority_level in ('official','official_city','regulator'))::numeric
              / nullif(count(*), 0)
       from public.relocation_source_registry r where r.id = l.source_id) as official_ratio,
      case when l.freshness_at is null then null
           else extract(epoch from (now() - l.freshness_at)) / 3600.0 end as freshness_hours
    from public.relocation_locations l
    where l.is_active
  ),
  ranked as (
    select *,
      round(
        budget_fit * 0.30 + bureaucracy_ease * 0.20 + healthcare_access * 0.15
        + gsm_coverage * 0.15 + community_fit * 0.10 + flight_access * 0.10,
        4
      ) as rule_score
    from scored
    where hard_filter_pass
  )
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'entity_id', id,
      'country_code', country_code,
      'city_code', city_code,
      'title', city_name,
      'hard_filter_pass', hard_filter_pass,
      'rule_score', rule_score,
      'final_score', rule_score,    -- Faz 1: final = rule (ml yok)
      'score_breakdown', jsonb_build_object(
        'budget_fit', budget_fit,
        'bureaucracy_ease', bureaucracy_ease,
        'healthcare_access', healthcare_access,
        'gsm_coverage', gsm_coverage,
        'community_fit', community_fit,
        'flight_access', flight_access
      ),
      -- 2026-09-25: TS sözleşmesi bu alanı zorunlu sayar; eksikliği /relocation'ı düşürüyordu.
      'explanations', '[]'::jsonb,
      'source_quality', jsonb_build_object(
        'official_sources_ratio', coalesce(official_ratio, 0),
        'freshness_hours', freshness_hours
      )
    ) order by rule_score desc
  ), '[]'::jsonb)
  into v_rows
  from ranked;

  return v_rows;
end;
$function$;

-- CREATE OR REPLACE grant'leri korur; yine de sözleşmeyi açık yaz (idempotent).
grant execute on function public.relocation_rank_locations_v1(uuid) to authenticated;
