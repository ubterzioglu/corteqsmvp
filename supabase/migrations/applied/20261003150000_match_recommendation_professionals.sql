-- M18 · Faz 2 (Tavsiye İste) — Migration 2: match_recommendation_professionals.
-- Bir tavsiye talebi için kategori + şehir/ülke eşleşen profesyonelleri döner.
--
-- ═══ KURALLAR (plan Faz 2 + dizin araması dersi) ═══
--   • 🔴 EŞLEŞME ELER DEĞİL SIRALAR (match_rank dersi): kategori/şehir/ülke yalnız
--     SKOR'u besler ve `order by match_score desc` ile sıralar; WHERE'da sert filtre
--     YOKTUR (sert filtre kısmi eşleşmeleri — örn. aynı ülke farklı şehir — eler ve
--     boş sonuç üretirdi). Aday kümesi = dizin-görünür üyeler; skor sıralar.
--   • 🔴 `catalog_search_documents.search_text` KULLANILMAZ — iletişim bilgisi taşır
--     (email/telefon). Yalnız title/category_slugs/country_code/city (herkese açık
--     dizin alanları) okunur; dönen tabloda İLETİŞİM YOK.
--   • `catalog_search_normalize()` (lower+unaccent+trim) ile katlanır — Türkçe
--     duyarsız karşılaştırma (İstanbul/ISTANBUL/ıstanbul aynı).
--   • Aday kümesi DİZİN-GÖRÜNÜRLÜK kuralını aynen yansıtır: member + published +
--     public + non-placeholder + directory-visible rol (admin/test hesapları elenir —
--     bu bir EŞLEŞME filtresi değil, güvenlik/dizin kuralı).
--   • is_admin() PARAMETRESİZ DEĞİL — directory-visible rol join'i admin rollerini
--     zaten eler; ek is_admin çağrısı gerekmez (yanlış imza riski yok).
--
-- Hata kodları M17 ile aynı aile: recommendation_auth_required · recommendation_request_not_found.

begin;

create or replace function public.match_recommendation_professionals(
  p_request_id uuid,
  p_limit integer default 25
)
returns table (
  item_id uuid,
  title text,
  slug text,
  country_code text,
  city text,
  category_slugs text[],
  match_score integer,
  match_reason text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_req public.recommendation_requests%rowtype;
  v_cat text;
  v_city text;
  v_country text;
  v_limit integer := greatest(least(coalesce(p_limit, 25), 100), 1);
begin
  if v_actor is null then
    raise exception 'recommendation_auth_required';
  end if;

  select * into v_req from public.recommendation_requests where id = p_request_id;
  if v_req.id is null then
    raise exception 'recommendation_request_not_found';
  end if;

  -- Türkçe duyarsız katlama (tek kaynak: catalog_search_normalize).
  v_cat     := public.catalog_search_normalize(v_req.category_slug);
  v_city    := public.catalog_search_normalize(v_req.city);
  v_country := public.catalog_search_normalize(v_req.country);

  return query
  with scored as (
    select
      ci.id                       as m_item_id,
      ci.title                    as m_title,
      ci.slug                     as m_slug,
      ci.country_code             as m_country_code,
      ci.city                     as m_city,
      coalesce(d.category_slugs, '{}'::text[]) as m_category_slugs,
      -- 🔴 İletişim metni (contact info) OKUNMAZ — yalnız category_slugs/geo/title.
      (case when v_cat <> '' and exists (
          select 1 from unnest(coalesce(d.category_slugs, '{}'::text[])) s
          where public.catalog_search_normalize(s) = v_cat
        ) then 100 else 0 end)     as cat_score,
      (case when v_city <> '' and public.catalog_search_normalize(ci.city) = v_city
            then 30 else 0 end)    as city_score,
      (case when v_country <> '' and public.catalog_search_normalize(ci.country_code) = v_country
            then 15 else 0 end)    as country_score
    from public.catalog_items ci
    join public.roles rl
      on rl.key = ci.platform_role_key and rl.is_directory_visible = true
    left join public.catalog_search_documents d
      on d.item_id = ci.id
    where ci.item_type = 'member'
      and ci.status = 'published'
      and ci.visibility = 'public'
      and coalesce(ci.is_placeholder, false) = false
    -- ⚠️ EŞLEŞME FİLTRESİ YOK (category/city/country WHERE'da DEĞİL) — eler değil sıralar.
  )
  select
    s.m_item_id,
    s.m_title,
    s.m_slug,
    s.m_country_code,
    s.m_city,
    s.m_category_slugs,
    (s.cat_score + s.city_score + s.country_score)::integer as match_score,
    nullif(concat_ws(', ',
      case when s.cat_score     > 0 then 'kategori' end,
      case when s.city_score    > 0 then 'şehir'    end,
      case when s.country_score > 0 then 'ülke'     end
    ), '') as match_reason
  from scored s
  order by (s.cat_score + s.city_score + s.country_score) desc, s.m_title asc
  limit v_limit;
end;
$$;

comment on function public.match_recommendation_professionals(uuid, integer) is
  'M18: tavsiye talebi için dizin-görünür profesyonelleri kategori+şehir+ülke EŞLEŞME '
  'SKORUYLA SIRALAR (eler değil — match_rank dersi). catalog_search_normalize ile katlanır. '
  'search_text (iletişim) KULLANILMAZ; dönen tabloda iletişim YOK. auth.uid() zorunlu.';

revoke all on function public.match_recommendation_professionals(uuid, integer) from public, anon;
grant execute on function public.match_recommendation_professionals(uuid, integer) to authenticated;

commit;
