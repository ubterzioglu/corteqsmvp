-- Dizin aramasından `[PLACEHOLDER]` kayıtlarını ele.
--
-- Ölçüm (22.09, canlı): `is_placeholder = true` olan **77** katalog kaydı var; 76'sının
-- başlığı `[PLACEHOLDER] …` ve 77'sinin de embedding'i dolu. Bunlar gerçek bir kişi ya
-- da kurum değil, kategori iskeletini dolduran boş kayıtlar — ama `published + public`
-- oldukları için dizin aramasında gerçek kayıtlarla birlikte çıkıyorlardı. Ölçüldü:
-- `psikolog` araması **2 sonuç döndürüyordu ve ikisi de placeholder'dı.**
--
-- Semantik dal (B21.3) bunu BÜYÜTÜYOR: placeholder başlığı kategorinin tam adı olduğu
-- için gerçek kayıtlardan DAHA İYİ eşleşir. Aynı kusur AI bot korpusunda 21.09'da
-- ölçülmüş ve `scripts/ai-knowledge/sources.mjs` içinde kapatılmıştı; dizin RPC'sinde
-- kapatılmamıştı. Bu migration iki yüzeyi aynı kurala getirir.
--
-- Kayıtlar SİLİNMEZ, yayından da kaldırılmaz — yalnız arama sonucunda görünmezler.
-- Doğrudan `/directory/catalog/<slug>` bağlantısı çalışmaya devam eder.
--
-- Geri alma: yeni bir forward migration ile `and not coalesce(ci.is_placeholder, false)`
-- koşulunu kaldır.

do $migration$
declare
  v_definition text;
  v_next text;
begin
  select pg_get_functiondef(
    'public.search_directory_catalog(text,text,text,text,boolean,integer,integer,vector)'::regprocedure
  ) into v_definition;

  if v_definition is null then
    raise exception 'search_directory_catalog 8-arg definition not found';
  end if;

  -- B20 yönetici koşulları ve semantik dal bu yamada kaybolamaz.
  if position('not ilike ''Admin_%''' in v_definition) = 0
    or position('not ilike ''Moderator_%''' in v_definition) = 0
    or position('r_x.key ilike ''Admin_%''' in v_definition) = 0
    or position('r_x.key ilike ''Moderator_%''' in v_definition) = 0
    or position('semantic_hits' in v_definition) = 0
  then
    raise exception 'live directory contract differs; refusing placeholder patch';
  end if;

  if position('is_placeholder' in v_definition) > 0 then
    raise exception 'placeholder filter already present; nothing to patch';
  end if;

  v_next := replace(
    v_definition,
    $find$    where ci.status = 'published'
      and ci.visibility in ('public', 'unlisted')$find$,
    $insert$    where ci.status = 'published'
      and not coalesce(ci.is_placeholder, false)
      and ci.visibility in ('public', 'unlisted')$insert$
  );
  if v_next = v_definition then raise exception 'placeholder patch point not found'; end if;

  execute v_next;
end;
$migration$;

comment on function public.search_directory_catalog(
  text, text, text, text, boolean, integer, integer, vector
) is 'Public directory search: lexical + optional semantic ranking; B20 admin guards and placeholder exclusion preserved.';
