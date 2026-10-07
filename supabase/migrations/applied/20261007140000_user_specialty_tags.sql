-- B5 · Kullanıcı uzmanlık etiketleri (profil etiketi, onay gerektirmez)
--
-- ═══ KAYNAK ═══
--   Plan: "Uzmanlık onay gerektirmez, profil etiketi olur."
--   Excel: 252 uzmanlık etiketi (örn. "Ev kiralama", "Öğrenci vizesi")
--
-- ═══ TASARIM ═══
--   Kullanıcı rol başvurusu yaparken uzmanlık seçebilir (3. adım, çoklu chip).
--   Uzmanlık onay gerektirmez, doğrudan profile eklenir.
--   Tablo: user_specialty_tags (user_id, specialty_slug, specialty_label)
--
-- ═══ İLİŞKİ ═══
--   role_structure.uzmanlik → user_specialty_tags.specialty_slug eşlemesi
--   UI'da: rol seçildikten sonra uzmanlık chip'leri role_structure'dan gelir
--
-- ═══ SALT EKLEME ═══
--   Tablo/kolon düşürmez. Yalnızca yeni tablo.

begin;

-- ── 1) user_specialty_tags tablosu ────────────────────────────────────────────

create table if not exists public.user_specialty_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  specialty_slug text not null,
  specialty_label text not null,
  created_at timestamptz not null default now(),
  unique (user_id, specialty_slug)
);

comment on table public.user_specialty_tags is
  'B5: Kullanıcı uzmanlık etiketleri (profil etiketi, onay gerektirmez). '
  'Rol başvurusu sırasında seçilen uzmanlıklar buraya yazılır. '
  'specialty_slug → role_structure.uzmanlik eşlemesi ile ilişkilendirilir.';

create index if not exists user_specialty_tags_user_idx on public.user_specialty_tags (user_id);
create index if not exists user_specialty_tags_slug_idx on public.user_specialty_tags (specialty_slug);

alter table public.user_specialty_tags enable row level security;
revoke all on table public.user_specialty_tags from public, anon;
grant select on table public.user_specialty_tags to authenticated;

drop policy if exists user_specialty_tags_select_own_or_admin on public.user_specialty_tags;
create policy user_specialty_tags_select_own_or_admin on public.user_specialty_tags
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists user_specialty_tags_insert_own on public.user_specialty_tags;
create policy user_specialty_tags_insert_own on public.user_specialty_tags
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists user_specialty_tags_delete_own on public.user_specialty_tags;
create policy user_specialty_tags_delete_own on public.user_specialty_tags
  for delete to authenticated
  using (user_id = auth.uid());

-- ── 2) Yardımcı fonksiyonlar ──────────────────────────────────────────────────

create or replace function public.get_user_specialty_tags(p_user_id uuid default null)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'specialty_slug', specialty_slug,
        'specialty_label', specialty_label
      )
      order by specialty_label
    ),
    '[]'::jsonb
  )
  from public.user_specialty_tags
  where user_id = coalesce(p_user_id, auth.uid());
$$;

comment on function public.get_user_specialty_tags(uuid) is
  'B5: Kullanıcının uzmanlık etiketlerini döner. p_user_id verilmezse auth.uid() kullanılır.';

revoke all on function public.get_user_specialty_tags(uuid) from public, anon;
grant execute on function public.get_user_specialty_tags(uuid) to authenticated;

create or replace function public.add_user_specialty_tag(p_specialty_slug text, p_specialty_label text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_id uuid;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.user_specialty_tags (user_id, specialty_slug, specialty_label)
  values (v_user_id, p_specialty_slug, p_specialty_label)
  on conflict (user_id, specialty_slug) do nothing
  returning id into v_id;

  return jsonb_build_object('id', v_id, 'specialty_slug', p_specialty_slug, 'specialty_label', p_specialty_label);
end;
$$;

comment on function public.add_user_specialty_tag(text, text) is
  'B5: Kullanıcıya uzmanlık etiketi ekler. Zaten varsa sessizce atlar.';

revoke all on function public.add_user_specialty_tag(text, text) from public, anon;
grant execute on function public.add_user_specialty_tag(text, text) to authenticated;

create or replace function public.remove_user_specialty_tag(p_specialty_slug text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_deleted boolean;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  delete from public.user_specialty_tags
  where user_id = v_user_id and specialty_slug = p_specialty_slug;

  get diagnostics v_deleted = row_count;
  return v_deleted > 0;
end;
$$;

comment on function public.remove_user_specialty_tag(text) is
  'B5: Kullanıcının uzmanlık etiketini kaldırır. Silinirse true, yoksa false.';

revoke all on function public.remove_user_specialty_tag(text) from public, anon;
grant execute on function public.remove_user_specialty_tag(text) to authenticated;

commit;
