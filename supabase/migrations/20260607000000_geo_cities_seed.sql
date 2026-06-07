-- Seed geo_cities from countryCities.ts data
-- Idempotent: on conflict do nothing
-- Maps Turkish country names to ISO codes already in geo_countries

do $$
declare
  v_country_id uuid;
begin

  -- Helper: insert cities for a country by its ISO code
  -- Almanya (DE)
  select id into v_country_id from public.geo_countries where code = 'DE' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Berlin', 10, true),
      (v_country_id, 'Münih', 20, true),
      (v_country_id, 'Frankfurt', 30, true),
      (v_country_id, 'Hamburg', 40, true),
      (v_country_id, 'Düsseldorf', 50, true),
      (v_country_id, 'Köln', 60, true),
      (v_country_id, 'Stuttgart', 70, true),
      (v_country_id, 'Bremen', 80, true),
      (v_country_id, 'Hannover', 90, true),
      (v_country_id, 'Leipzig', 100, true),
      (v_country_id, 'Dortmund', 110, true),
      (v_country_id, 'Essen', 120, true),
      (v_country_id, 'Nürnberg', 130, true),
      (v_country_id, 'Bochum', 140, true),
      (v_country_id, 'Mannheim', 150, true),
      (v_country_id, 'Karlsruhe', 160, true),
      (v_country_id, 'Wiesbaden', 170, true),
      (v_country_id, 'Augsburg', 180, true),
      (v_country_id, 'Bonn', 190, true),
      (v_country_id, 'Münster', 200, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- İngiltere (GB)
  select id into v_country_id from public.geo_countries where code = 'GB' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Londra', 10, true),
      (v_country_id, 'Manchester', 20, true),
      (v_country_id, 'Birmingham', 30, true),
      (v_country_id, 'Edinburgh', 40, true),
      (v_country_id, 'Glasgow', 50, true),
      (v_country_id, 'Liverpool', 60, true),
      (v_country_id, 'Bristol', 70, true),
      (v_country_id, 'Leeds', 80, true),
      (v_country_id, 'Sheffield', 90, true),
      (v_country_id, 'Cardiff', 100, true),
      (v_country_id, 'Belfast', 110, true),
      (v_country_id, 'Oxford', 120, true),
      (v_country_id, 'Cambridge', 130, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Hollanda (NL)
  select id into v_country_id from public.geo_countries where code = 'NL' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Amsterdam', 10, true),
      (v_country_id, 'Rotterdam', 20, true),
      (v_country_id, 'Den Haag', 30, true),
      (v_country_id, 'Utrecht', 40, true),
      (v_country_id, 'Eindhoven', 50, true),
      (v_country_id, 'Groningen', 60, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Fransa (FR)
  select id into v_country_id from public.geo_countries where code = 'FR' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Paris', 10, true),
      (v_country_id, 'Lyon', 20, true),
      (v_country_id, 'Marsilya', 30, true),
      (v_country_id, 'Strasbourg', 40, true),
      (v_country_id, 'Toulouse', 50, true),
      (v_country_id, 'Nice', 60, true),
      (v_country_id, 'Bordeaux', 70, true),
      (v_country_id, 'Lille', 80, true),
      (v_country_id, 'Nantes', 90, true),
      (v_country_id, 'Montpellier', 100, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Avusturya (AT)
  select id into v_country_id from public.geo_countries where code = 'AT' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Viyana', 10, true),
      (v_country_id, 'Graz', 20, true),
      (v_country_id, 'Salzburg', 30, true),
      (v_country_id, 'Linz', 40, true),
      (v_country_id, 'Innsbruck', 50, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- İsviçre (CH)
  select id into v_country_id from public.geo_countries where code = 'CH' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Zürih', 10, true),
      (v_country_id, 'Cenevre', 20, true),
      (v_country_id, 'Basel', 30, true),
      (v_country_id, 'Bern', 40, true),
      (v_country_id, 'Lozan', 50, true),
      (v_country_id, 'Lugano', 60, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- İspanya (ES)
  select id into v_country_id from public.geo_countries where code = 'ES' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Madrid', 10, true),
      (v_country_id, 'Barcelona', 20, true),
      (v_country_id, 'Valencia', 30, true),
      (v_country_id, 'Sevilla', 40, true),
      (v_country_id, 'Malaga', 50, true),
      (v_country_id, 'Bilbao', 60, true),
      (v_country_id, 'Zaragoza', 70, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- İtalya (IT)
  select id into v_country_id from public.geo_countries where code = 'IT' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Roma', 10, true),
      (v_country_id, 'Milano', 20, true),
      (v_country_id, 'Napoli', 30, true),
      (v_country_id, 'Floransa', 40, true),
      (v_country_id, 'Torino', 50, true),
      (v_country_id, 'Bologna', 60, true),
      (v_country_id, 'Venedik', 70, true),
      (v_country_id, 'Palermo', 80, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Yunanistan (GR)
  select id into v_country_id from public.geo_countries where code = 'GR' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Atina', 10, true),
      (v_country_id, 'Selanik', 20, true),
      (v_country_id, 'Patras', 30, true),
      (v_country_id, 'Heraklion', 40, true),
      (v_country_id, 'Girit', 50, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- İsveç (SE)
  select id into v_country_id from public.geo_countries where code = 'SE' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Stockholm', 10, true),
      (v_country_id, 'Göteborg', 20, true),
      (v_country_id, 'Malmö', 30, true),
      (v_country_id, 'Uppsala', 40, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Norveç (NO)
  select id into v_country_id from public.geo_countries where code = 'NO' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Oslo', 10, true),
      (v_country_id, 'Bergen', 20, true),
      (v_country_id, 'Trondheim', 30, true),
      (v_country_id, 'Stavanger', 40, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Finlandiya (FI)
  select id into v_country_id from public.geo_countries where code = 'FI' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Helsinki', 10, true),
      (v_country_id, 'Espoo', 20, true),
      (v_country_id, 'Tampere', 30, true),
      (v_country_id, 'Turku', 40, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Danimarka (DK)
  select id into v_country_id from public.geo_countries where code = 'DK' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Kopenhag', 10, true),
      (v_country_id, 'Aarhus', 20, true),
      (v_country_id, 'Odense', 30, true),
      (v_country_id, 'Aalborg', 40, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Belçika (BE)
  select id into v_country_id from public.geo_countries where code = 'BE' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Brüksel', 10, true),
      (v_country_id, 'Antwerp', 20, true),
      (v_country_id, 'Gent', 30, true),
      (v_country_id, 'Liège', 40, true),
      (v_country_id, 'Brugge', 50, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Portekiz (PT)
  select id into v_country_id from public.geo_countries where code = 'PT' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Lizbon', 10, true),
      (v_country_id, 'Porto', 20, true),
      (v_country_id, 'Coimbra', 30, true),
      (v_country_id, 'Faro', 40, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- İrlanda (IE)
  select id into v_country_id from public.geo_countries where code = 'IE' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Dublin', 10, true),
      (v_country_id, 'Cork', 20, true),
      (v_country_id, 'Galway', 30, true),
      (v_country_id, 'Limerick', 40, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Polonya (PL)
  select id into v_country_id from public.geo_countries where code = 'PL' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Varşova', 10, true),
      (v_country_id, 'Krakov', 20, true),
      (v_country_id, 'Wrocław', 30, true),
      (v_country_id, 'Poznań', 40, true),
      (v_country_id, 'Gdańsk', 50, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Çekya (CZ)
  select id into v_country_id from public.geo_countries where code = 'CZ' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Prag', 10, true),
      (v_country_id, 'Brno', 20, true),
      (v_country_id, 'Ostrava', 30, true),
      (v_country_id, 'Plzeň', 40, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Macaristan (HU)
  select id into v_country_id from public.geo_countries where code = 'HU' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Budapeşte', 10, true),
      (v_country_id, 'Debrecen', 20, true),
      (v_country_id, 'Szeged', 30, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Romanya (RO)
  select id into v_country_id from public.geo_countries where code = 'RO' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Bükreş', 10, true),
      (v_country_id, 'Cluj', 20, true),
      (v_country_id, 'Timişoara', 30, true),
      (v_country_id, 'İaşi', 40, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Bulgaristan (BG)
  select id into v_country_id from public.geo_countries where code = 'BG' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Sofya', 10, true),
      (v_country_id, 'Plovdiv', 20, true),
      (v_country_id, 'Varna', 30, true),
      (v_country_id, 'Burgaz', 40, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Sırbistan (RS)
  select id into v_country_id from public.geo_countries where code = 'RS' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Belgrad', 10, true),
      (v_country_id, 'Novi Sad', 20, true),
      (v_country_id, 'Niş', 30, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Hırvatistan (HR)
  select id into v_country_id from public.geo_countries where code = 'HR' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Zagreb', 10, true),
      (v_country_id, 'Split', 20, true),
      (v_country_id, 'Rijeka', 30, true),
      (v_country_id, 'Dubrovnik', 40, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Slovenya (SI)
  select id into v_country_id from public.geo_countries where code = 'SI' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Ljubljana', 10, true),
      (v_country_id, 'Maribor', 20, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Slovakya (SK)
  select id into v_country_id from public.geo_countries where code = 'SK' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Bratislava', 10, true),
      (v_country_id, 'Košice', 20, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Bosna Hersek (BA)
  select id into v_country_id from public.geo_countries where code = 'BA' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Saraybosna', 10, true),
      (v_country_id, 'Mostar', 20, true),
      (v_country_id, 'Banja Luka', 30, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Karadağ (ME)
  select id into v_country_id from public.geo_countries where code = 'ME' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Podgorica', 10, true),
      (v_country_id, 'Budva', 20, true),
      (v_country_id, 'Kotor', 30, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Kuzey Makedonya (MK)
  select id into v_country_id from public.geo_countries where code = 'MK' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Üsküp', 10, true),
      (v_country_id, 'Manastır', 20, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Arnavutluk (AL)
  select id into v_country_id from public.geo_countries where code = 'AL' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Tiran', 10, true),
      (v_country_id, 'Draç', 20, true),
      (v_country_id, 'İşkodra', 30, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Kosova (XK)
  select id into v_country_id from public.geo_countries where code = 'XK' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Priştine', 10, true),
      (v_country_id, 'Prizren', 20, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Ukrayna (UA)
  select id into v_country_id from public.geo_countries where code = 'UA' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Kiev', 10, true),
      (v_country_id, 'Lviv', 20, true),
      (v_country_id, 'Odessa', 30, true),
      (v_country_id, 'Harkov', 40, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Rusya (RU)
  select id into v_country_id from public.geo_countries where code = 'RU' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Moskova', 10, true),
      (v_country_id, 'Saint Petersburg', 20, true),
      (v_country_id, 'Kazan', 30, true),
      (v_country_id, 'Yekaterinburg', 40, true),
      (v_country_id, 'Novosibirsk', 50, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Litvanya (LT)
  select id into v_country_id from public.geo_countries where code = 'LT' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Vilnius', 10, true),
      (v_country_id, 'Kaunas', 20, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Letonya (LV)
  select id into v_country_id from public.geo_countries where code = 'LV' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Riga', 10, true),
      (v_country_id, 'Daugavpils', 20, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Estonya (EE)
  select id into v_country_id from public.geo_countries where code = 'EE' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Tallinn', 10, true),
      (v_country_id, 'Tartu', 20, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Türkiye (TR)
  select id into v_country_id from public.geo_countries where code = 'TR' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'İstanbul', 10, true),
      (v_country_id, 'Ankara', 20, true),
      (v_country_id, 'İzmir', 30, true),
      (v_country_id, 'Bursa', 40, true),
      (v_country_id, 'Antalya', 50, true),
      (v_country_id, 'Adana', 60, true),
      (v_country_id, 'Konya', 70, true),
      (v_country_id, 'Gaziantep', 80, true),
      (v_country_id, 'Trabzon', 90, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Lüksemburg (LU)
  select id into v_country_id from public.geo_countries where code = 'LU' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Lüksemburg', 10, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Malta (MT)
  select id into v_country_id from public.geo_countries where code = 'MT' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Valletta', 10, true),
      (v_country_id, 'Sliema', 20, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- İzlanda (IS)
  select id into v_country_id from public.geo_countries where code = 'IS' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Reykjavik', 10, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- BAE (AE)
  select id into v_country_id from public.geo_countries where code = 'AE' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Dubai', 10, true),
      (v_country_id, 'Abu Dhabi', 20, true),
      (v_country_id, 'Sharjah', 30, true),
      (v_country_id, 'Ajman', 40, true),
      (v_country_id, 'Ras Al Khaimah', 50, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Katar (QA)
  select id into v_country_id from public.geo_countries where code = 'QA' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Doha', 10, true),
      (v_country_id, 'Al Wakrah', 20, true),
      (v_country_id, 'Al Khor', 30, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Suudi Arabistan (SA)
  select id into v_country_id from public.geo_countries where code = 'SA' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Riyad', 10, true),
      (v_country_id, 'Cidde', 20, true),
      (v_country_id, 'Mekke', 30, true),
      (v_country_id, 'Medine', 40, true),
      (v_country_id, 'Dammam', 50, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Kuveyt (KW)
  select id into v_country_id from public.geo_countries where code = 'KW' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Kuveyt', 10, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Bahreyn (BH)
  select id into v_country_id from public.geo_countries where code = 'BH' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Manama', 10, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Umman (OM)
  select id into v_country_id from public.geo_countries where code = 'OM' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Maskat', 10, true),
      (v_country_id, 'Salalah', 20, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Ürdün (JO)
  select id into v_country_id from public.geo_countries where code = 'JO' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Amman', 10, true),
      (v_country_id, 'Akabe', 20, true),
      (v_country_id, 'Zerka', 30, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Lübnan (LB)
  select id into v_country_id from public.geo_countries where code = 'LB' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Beyrut', 10, true),
      (v_country_id, 'Trablus', 20, true),
      (v_country_id, 'Sayda', 30, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- İsrail (IL)
  select id into v_country_id from public.geo_countries where code = 'IL' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Tel Aviv', 10, true),
      (v_country_id, 'Kudüs', 20, true),
      (v_country_id, 'Hayfa', 30, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Irak (IQ)
  select id into v_country_id from public.geo_countries where code = 'IQ' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Bağdat', 10, true),
      (v_country_id, 'Erbil', 20, true),
      (v_country_id, 'Basra', 30, true),
      (v_country_id, 'Süleymaniye', 40, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- İran (IR)
  select id into v_country_id from public.geo_countries where code = 'IR' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Tahran', 10, true),
      (v_country_id, 'İsfahan', 20, true),
      (v_country_id, 'Şiraz', 30, true),
      (v_country_id, 'Meşhed', 40, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Azerbaycan (AZ)
  select id into v_country_id from public.geo_countries where code = 'AZ' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Bakü', 10, true),
      (v_country_id, 'Gence', 20, true),
      (v_country_id, 'Sumgayıt', 30, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Gürcistan (GE)
  select id into v_country_id from public.geo_countries where code = 'GE' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Tiflis', 10, true),
      (v_country_id, 'Batum', 20, true),
      (v_country_id, 'Kutaisi', 30, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Ermenistan (AM)
  select id into v_country_id from public.geo_countries where code = 'AM' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Erivan', 10, true),
      (v_country_id, 'Gümrü', 20, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Kazakistan (KZ)
  select id into v_country_id from public.geo_countries where code = 'KZ' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Astana', 10, true),
      (v_country_id, 'Almatı', 20, true),
      (v_country_id, 'Şımkent', 30, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Özbekistan (UZ)
  select id into v_country_id from public.geo_countries where code = 'UZ' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Taşkent', 10, true),
      (v_country_id, 'Semerkant', 20, true),
      (v_country_id, 'Buhara', 30, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Kırgızistan (KG)
  select id into v_country_id from public.geo_countries where code = 'KG' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Bişkek', 10, true),
      (v_country_id, 'Oş', 20, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Türkmenistan (TM)
  select id into v_country_id from public.geo_countries where code = 'TM' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Aşkabat', 10, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Tacikistan (TJ)
  select id into v_country_id from public.geo_countries where code = 'TJ' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Duşanbe', 10, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Çin (CN)
  select id into v_country_id from public.geo_countries where code = 'CN' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Pekin', 10, true),
      (v_country_id, 'Şanghay', 20, true),
      (v_country_id, 'Guangzhou', 30, true),
      (v_country_id, 'Şenzhen', 40, true),
      (v_country_id, 'Hangzhou', 50, true),
      (v_country_id, 'Chengdu', 60, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Hong Kong (HK)
  select id into v_country_id from public.geo_countries where code = 'HK' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Hong Kong', 10, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Japonya (JP)
  select id into v_country_id from public.geo_countries where code = 'JP' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Tokyo', 10, true),
      (v_country_id, 'Osaka', 20, true),
      (v_country_id, 'Kyoto', 30, true),
      (v_country_id, 'Yokohama', 40, true),
      (v_country_id, 'Nagoya', 50, true),
      (v_country_id, 'Sapporo', 60, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Güney Kore (KR)
  select id into v_country_id from public.geo_countries where code = 'KR' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Seul', 10, true),
      (v_country_id, 'Busan', 20, true),
      (v_country_id, 'Incheon', 30, true),
      (v_country_id, 'Daegu', 40, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Singapur (SG)
  select id into v_country_id from public.geo_countries where code = 'SG' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Singapur', 10, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Malezya (MY)
  select id into v_country_id from public.geo_countries where code = 'MY' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Kuala Lumpur', 10, true),
      (v_country_id, 'Penang', 20, true),
      (v_country_id, 'Johor Bahru', 30, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Tayland (TH)
  select id into v_country_id from public.geo_countries where code = 'TH' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Bangkok', 10, true),
      (v_country_id, 'Chiang Mai', 20, true),
      (v_country_id, 'Phuket', 30, true),
      (v_country_id, 'Pattaya', 40, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Vietnam (VN)
  select id into v_country_id from public.geo_countries where code = 'VN' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Hanoi', 10, true),
      (v_country_id, 'Ho Chi Minh', 20, true),
      (v_country_id, 'Da Nang', 30, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Endonezya (ID)
  select id into v_country_id from public.geo_countries where code = 'ID' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Cakarta', 10, true),
      (v_country_id, 'Surabaya', 20, true),
      (v_country_id, 'Bali', 30, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Hindistan (IN)
  select id into v_country_id from public.geo_countries where code = 'IN' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Yeni Delhi', 10, true),
      (v_country_id, 'Mumbai', 20, true),
      (v_country_id, 'Bangalore', 30, true),
      (v_country_id, 'Chennai', 40, true),
      (v_country_id, 'Hyderabad', 50, true),
      (v_country_id, 'Kolkata', 60, true),
      (v_country_id, 'Pune', 70, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Pakistan (PK)
  select id into v_country_id from public.geo_countries where code = 'PK' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'İslamabad', 10, true),
      (v_country_id, 'Karaçi', 20, true),
      (v_country_id, 'Lahor', 30, true),
      (v_country_id, 'Peşaver', 40, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Bangladeş (BD)
  select id into v_country_id from public.geo_countries where code = 'BD' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Dakka', 10, true),
      (v_country_id, 'Çitagong', 20, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Sri Lanka (LK)
  select id into v_country_id from public.geo_countries where code = 'LK' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Kolombo', 10, true),
      (v_country_id, 'Kandy', 20, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- ABD (US)
  select id into v_country_id from public.geo_countries where code = 'US' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'New York', 10, true),
      (v_country_id, 'Los Angeles', 20, true),
      (v_country_id, 'Chicago', 30, true),
      (v_country_id, 'Houston', 40, true),
      (v_country_id, 'Washington DC', 50, true),
      (v_country_id, 'San Francisco', 60, true),
      (v_country_id, 'Boston', 70, true),
      (v_country_id, 'Miami', 80, true),
      (v_country_id, 'Seattle', 90, true),
      (v_country_id, 'Atlanta', 100, true),
      (v_country_id, 'Dallas', 110, true),
      (v_country_id, 'Philadelphia', 120, true),
      (v_country_id, 'Phoenix', 130, true),
      (v_country_id, 'San Diego', 140, true),
      (v_country_id, 'Denver', 150, true),
      (v_country_id, 'Austin', 160, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Kanada (CA)
  select id into v_country_id from public.geo_countries where code = 'CA' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Toronto', 10, true),
      (v_country_id, 'Vancouver', 20, true),
      (v_country_id, 'Montreal', 30, true),
      (v_country_id, 'Ottawa', 40, true),
      (v_country_id, 'Calgary', 50, true),
      (v_country_id, 'Edmonton', 60, true),
      (v_country_id, 'Halifax', 70, true),
      (v_country_id, 'Quebec', 80, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Meksika (MX)
  select id into v_country_id from public.geo_countries where code = 'MX' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Mexico City', 10, true),
      (v_country_id, 'Guadalajara', 20, true),
      (v_country_id, 'Monterrey', 30, true),
      (v_country_id, 'Cancun', 40, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Brezilya (BR)
  select id into v_country_id from public.geo_countries where code = 'BR' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'São Paulo', 10, true),
      (v_country_id, 'Rio de Janeiro', 20, true),
      (v_country_id, 'Brasilia', 30, true),
      (v_country_id, 'Salvador', 40, true),
      (v_country_id, 'Curitiba', 50, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Arjantin (AR)
  select id into v_country_id from public.geo_countries where code = 'AR' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Buenos Aires', 10, true),
      (v_country_id, 'Cordoba', 20, true),
      (v_country_id, 'Rosario', 30, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Şili (CL)
  select id into v_country_id from public.geo_countries where code = 'CL' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Santiago', 10, true),
      (v_country_id, 'Valparaiso', 20, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Kolombiya (CO)
  select id into v_country_id from public.geo_countries where code = 'CO' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Bogota', 10, true),
      (v_country_id, 'Medellin', 20, true),
      (v_country_id, 'Cali', 30, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Avustralya (AU)
  select id into v_country_id from public.geo_countries where code = 'AU' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Sydney', 10, true),
      (v_country_id, 'Melbourne', 20, true),
      (v_country_id, 'Brisbane', 30, true),
      (v_country_id, 'Perth', 40, true),
      (v_country_id, 'Adelaide', 50, true),
      (v_country_id, 'Canberra', 60, true),
      (v_country_id, 'Gold Coast', 70, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Yeni Zelanda (NZ)
  select id into v_country_id from public.geo_countries where code = 'NZ' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Auckland', 10, true),
      (v_country_id, 'Wellington', 20, true),
      (v_country_id, 'Christchurch', 30, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Mısır (EG)
  select id into v_country_id from public.geo_countries where code = 'EG' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Kahire', 10, true),
      (v_country_id, 'İskenderiye', 20, true),
      (v_country_id, 'Şarm El-Şeyh', 30, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Fas (MA)
  select id into v_country_id from public.geo_countries where code = 'MA' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Rabat', 10, true),
      (v_country_id, 'Kazablanka', 20, true),
      (v_country_id, 'Marakeş', 30, true),
      (v_country_id, 'Tanca', 40, true),
      (v_country_id, 'Fes', 50, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Tunus (TN)
  select id into v_country_id from public.geo_countries where code = 'TN' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Tunus', 10, true),
      (v_country_id, 'Sfaks', 20, true),
      (v_country_id, 'Sus', 30, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Cezayir (DZ)
  select id into v_country_id from public.geo_countries where code = 'DZ' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Cezayir', 10, true),
      (v_country_id, 'Vahran', 20, true),
      (v_country_id, 'Konstantin', 30, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Güney Afrika (ZA)
  select id into v_country_id from public.geo_countries where code = 'ZA' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Johannesburg', 10, true),
      (v_country_id, 'Cape Town', 20, true),
      (v_country_id, 'Durban', 30, true),
      (v_country_id, 'Pretoria', 40, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Nijerya (NG)
  select id into v_country_id from public.geo_countries where code = 'NG' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Lagos', 10, true),
      (v_country_id, 'Abuja', 20, true),
      (v_country_id, 'Kano', 30, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Kenya (KE)
  select id into v_country_id from public.geo_countries where code = 'KE' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Nairobi', 10, true),
      (v_country_id, 'Mombasa', 20, true)
    on conflict (country_id, name) do nothing;
  end if;

end;
$$;
