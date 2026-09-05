-- Cadde kafe acis formu tema katalogu duzeltmesi (revizyon 1c5b3049).
--
-- Olculen durum (canli, 2026-09-05): public.cadde_cafe_themes 16 satir.
-- Kolonlar: key, label_tr, icon_key, sort_order, is_active. ("label" kolonu YOKTUR.)
-- Istenen 11 temanin 9'u birebir vardi. Iki eksik:
--   1) "is" temasi HIC YOKTU -> ekleniyor (sort_order 65: meslek 60 ile hr 70 arasi).
--   2) "hr" satirinin etiketi Ingilizce "HR" idi -> Turkce urun dilinde "IK"
--      (Insan Kaynaklari) olmali. ANAHTAR DEGISMIYOR: cadde_cafes.theme_key = 'hr'
--      olan mevcut kayitlar bozulmasin diye yalniz label_tr guncelleniyor.
--
-- Frontend'de sabit tema listesi YOK: src/lib/cadde-cafe-api.ts listCaddeCafeThemes()
-- dogrudan bu tabloyu okur, create_cadde_cafe_v1 de temayi bu tabloya karsi dogrular
-- (cadde_invalid_cafe_theme). Bu yuzden kod degisikligi gerekmiyor, deploy da gerekmez.
--
-- Turkce karakterler U&'\XXXX' unicode escape ile yazildi: migration psql'e stdin
-- uzerinden gecer ve Windows'ta client_encoding UTF-8 olmayabilir (CLAUDE.md
-- "psql/Windows tuzagi"). Escape ile literal tamamen ASCII kalir.
--   U&'\0130\015F' = "Is" (I-noktali + s-cedilli)
--   U&'\0130K'     = "IK" (I-noktali + K)

insert into public.cadde_cafe_themes (key, label_tr, icon_key, sort_order, is_active)
values ('is', U&'\0130\015F', 'building-2', 65, true)
on conflict (key) do update
  set label_tr = excluded.label_tr,
      icon_key = excluded.icon_key,
      sort_order = excluded.sort_order,
      is_active = true;

update public.cadde_cafe_themes
set label_tr = U&'\0130K'
where key = 'hr';
