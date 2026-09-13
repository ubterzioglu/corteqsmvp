-- K1 (m156): tepki seti 5'ten 3'e indirildi (13 Eylül ürün kararı).
-- Kalp ve Gülme kaldırıldı; Beğendim, Destek ve "unsure" (artık "Soru" diye
-- etiketleniyor — diaspora akışında beğeniden daha değerli bir sinyal) kaldı.
--
-- SQL↔TS ayna sözleşmesi: TS tarafı src/lib/cadde-types.ts CADDE_REACTION_TYPES,
-- test kilidi src/lib/cadde-rules.test.ts. Biri değişirse öbürü de değişmeli.
--
-- Güvenlik kontrolü: kaldırılan iki değer canlıda hiç kullanılmamıştı (ölçüldü,
-- 13 Eylül — `cadde_post_reactions`'ta toplam 1 satır vardı ve o da 'like'tı).
-- Yine de bu migration veri kaybetmemek için önce sayar, varsa DURUR.
do $check$
declare
  v_kalinti integer;
begin
  select count(*) into v_kalinti
  from public.cadde_post_reactions
  where reaction_type in ('love', 'haha');

  if v_kalinti > 0 then
    raise exception 'CADDE_REACTION_KALINTI: % satir hala love/haha kullaniyor, once veri karari ver', v_kalinti;
  end if;
end
$check$;

alter table public.cadde_post_reactions
  drop constraint cadde_post_reactions_reaction_type_check;

alter table public.cadde_post_reactions
  add constraint cadde_post_reactions_reaction_type_check
  check (reaction_type = any (array['like'::text, 'support'::text, 'unsure'::text]));
