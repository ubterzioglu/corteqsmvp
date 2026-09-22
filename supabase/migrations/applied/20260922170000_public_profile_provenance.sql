-- B16/B17 altyapısı: herkese açık katalog profiline kaynak künyesi (provenance).
--
-- B15 kararı: sahibi olmayan, toplu içe aktarmayla gelen kayıtlar yayına çıkacaksa
-- her kayıtta kaynak adı + tarihi görünmeli ve kişinin kaydını kaldırtmak için açık
-- bir yol bulunmalı. Bu migration künyeyi VERİ YAZMADAN türetir: `import_source`,
-- `import_batch` ve `created_at` 61 kaydın hepsinde ZATEN doludur (ölçüldü 22.09).
-- Böylece 61 satıra metin kopyalanmaz ve künye veriyle birlikte tazelenir.
--
-- Künye YALNIZ gerçekten bilineni söyler: derleme anahtarı, içe aktarma tarihi ve
-- kaydın doğrulanmamış olduğu. Kayıt bazında kaynak URL'i saklanmamıştır; bu yüzden
-- "şu siteden alındı" gibi bir iddia ÜRETİLMEZ.
--
-- Künye koşulu: sahibi yok (`created_by is null`) VE `import_source` var. Üyenin
-- kendi açtığı ya da sahiplenilmiş profillerde `provenance` null döner, arayüz de
-- kart çizmez.
--
-- Geri alma: yeni bir forward migration ile 'provenance' anahtarını return
-- bloğundan çıkar; başka hiçbir alan değişmedi.

do $migration$
declare
  v_definition text;
  v_next text;
begin
  select pg_get_functiondef('public.get_catalog_item_public_page_v2(text)'::regprocedure)
  into v_definition;

  if v_definition is null then
    raise exception 'get_catalog_item_public_page_v2 definition not found';
  end if;

  -- Canlı gövde yamalıdır; sözleşme noktaları duruyor mu önce doğrula.
  if position('v_item public.catalog_items%rowtype' in v_definition) = 0
    or position($guard$'claim', jsonb_build_object($guard$ in v_definition) = 0
  then
    raise exception 'live public page contract differs; refusing provenance patch';
  end if;

  if position('''provenance''' in v_definition) > 0 then
    raise exception 'provenance already present; nothing to patch';
  end if;

  v_next := replace(
    v_definition,
    $find$    'claim', jsonb_build_object($find$,
    $insert$    'provenance', case
      when v_item.created_by is null
        and coalesce(v_item.attributes->>'import_source', '') <> ''
      then jsonb_build_object(
        'sourceKey', v_item.attributes->>'import_source',
        'importedAt', to_char(v_item.created_at, 'YYYY-MM-DD'),
        'isVerified', coalesce(v_item.is_verified, false)
      )
      else null
    end,
    'claim', jsonb_build_object($insert$
  );
  if v_next = v_definition then raise exception 'provenance patch point not found'; end if;

  execute v_next;
end;
$migration$;

comment on function public.get_catalog_item_public_page_v2(text) is
  'Public catalog profile page payload; provenance block names the bulk-import source and date for unowned records (B15/B16).';
