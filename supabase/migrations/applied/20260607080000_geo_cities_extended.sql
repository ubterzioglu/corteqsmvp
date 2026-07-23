-- Extended city seed — adds more cities to existing countries
-- Idempotent: on conflict do nothing

do $$
declare
  v_country_id uuid;
begin

  -- Almanya (DE) — extend existing 20 cities
  select id into v_country_id from public.geo_countries where code = 'DE' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Wuppertal',      210, true),
      (v_country_id, 'Bielefeld',      220, true),
      (v_country_id, 'Gelsenkirchen',  230, true),
      (v_country_id, 'Mönchengladbach',240, true),
      (v_country_id, 'Braunschweig',   250, true),
      (v_country_id, 'Kiel',           260, true),
      (v_country_id, 'Chemnitz',       270, true),
      (v_country_id, 'Aachen',         280, true),
      (v_country_id, 'Halle',          290, true),
      (v_country_id, 'Magdeburg',      300, true),
      (v_country_id, 'Freiburg',       310, true),
      (v_country_id, 'Krefeld',        320, true),
      (v_country_id, 'Mainz',          330, true),
      (v_country_id, 'Lübeck',         340, true),
      (v_country_id, 'Erfurt',         350, true),
      (v_country_id, 'Oberhausen',     360, true),
      (v_country_id, 'Rostock',        370, true),
      (v_country_id, 'Kassel',         380, true),
      (v_country_id, 'Hagen',          390, true),
      (v_country_id, 'Hamm',           400, true),
      (v_country_id, 'Saarbrücken',    410, true),
      (v_country_id, 'Mülheim',        420, true),
      (v_country_id, 'Potsdam',        430, true),
      (v_country_id, 'Osnabrück',      440, true),
      (v_country_id, 'Heidelberg',     450, true),
      (v_country_id, 'Darmstadt',      460, true),
      (v_country_id, 'Regensburg',     470, true),
      (v_country_id, 'Ingolstadt',     480, true),
      (v_country_id, 'Wolfsburg',      490, true),
      (v_country_id, 'Offenbach',      500, true),
      (v_country_id, 'Ulm',            510, true),
      (v_country_id, 'Pforzheim',      520, true),
      (v_country_id, 'Göttingen',      530, true),
      (v_country_id, 'Bottrop',        540, true),
      (v_country_id, 'Recklinghausen', 550, true),
      (v_country_id, 'Reutlingen',     560, true),
      (v_country_id, 'Bremerhaven',    570, true),
      (v_country_id, 'Koblenz',        580, true),
      (v_country_id, 'Bergisch Gladbach', 590, true),
      (v_country_id, 'Jena',           600, true),
      (v_country_id, 'Remscheid',      610, true),
      (v_country_id, 'Erlangen',       620, true),
      (v_country_id, 'Moers',          630, true),
      (v_country_id, 'Siegen',         640, true),
      (v_country_id, 'Hildesheim',     650, true),
      (v_country_id, 'Salzgitter',     660, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- İngiltere (GB) — extend existing cities
  select id into v_country_id from public.geo_countries where code = 'GB' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Nottingham',     140, true),
      (v_country_id, 'Newcastle',      150, true),
      (v_country_id, 'Southampton',    160, true),
      (v_country_id, 'Portsmouth',     170, true),
      (v_country_id, 'Coventry',       180, true),
      (v_country_id, 'Leicester',      190, true),
      (v_country_id, 'Bradford',       200, true),
      (v_country_id, 'Stoke-on-Trent', 210, true),
      (v_country_id, 'Wolverhampton',  220, true),
      (v_country_id, 'Derby',          230, true),
      (v_country_id, 'Plymouth',       240, true),
      (v_country_id, 'Reading',        250, true),
      (v_country_id, 'Sunderland',     260, true),
      (v_country_id, 'Luton',          270, true),
      (v_country_id, 'Preston',        280, true),
      (v_country_id, 'Aberdeen',       290, true),
      (v_country_id, 'Dundee',         300, true),
      (v_country_id, 'Swansea',        310, true),
      (v_country_id, 'Newport',        320, true),
      (v_country_id, 'Inverness',      330, true),
      (v_country_id, 'Milton Keynes',  340, true),
      (v_country_id, 'York',           350, true),
      (v_country_id, 'Exeter',         360, true),
      (v_country_id, 'Peterborough',   370, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Fransa (FR) — extend existing cities
  select id into v_country_id from public.geo_countries where code = 'FR' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Rennes',         110, true),
      (v_country_id, 'Reims',          120, true),
      (v_country_id, 'Le Havre',       130, true),
      (v_country_id, 'Saint-Étienne',  140, true),
      (v_country_id, 'Toulon',         150, true),
      (v_country_id, 'Grenoble',       160, true),
      (v_country_id, 'Dijon',          170, true),
      (v_country_id, 'Angers',         180, true),
      (v_country_id, 'Nîmes',          190, true),
      (v_country_id, 'Villeurbanne',   200, true),
      (v_country_id, 'Le Mans',        210, true),
      (v_country_id, 'Aix-en-Provence',220, true),
      (v_country_id, 'Brest',          230, true),
      (v_country_id, 'Tours',          240, true),
      (v_country_id, 'Amiens',         250, true),
      (v_country_id, 'Metz',           260, true),
      (v_country_id, 'Perpignan',      270, true),
      (v_country_id, 'Caen',           280, true),
      (v_country_id, 'Orléans',        290, true),
      (v_country_id, 'Mulhouse',       300, true),
      (v_country_id, 'Rouen',          310, true),
      (v_country_id, 'Nancy',          320, true),
      (v_country_id, 'Clermont-Ferrand', 330, true),
      (v_country_id, 'Besançon',       340, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- İspanya (ES) — extend existing cities
  select id into v_country_id from public.geo_countries where code = 'ES' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Palma de Mallorca', 80, true),
      (v_country_id, 'Las Palmas',     90, true),
      (v_country_id, 'Alicante',       100, true),
      (v_country_id, 'Córdoba',        110, true),
      (v_country_id, 'Valladolid',     120, true),
      (v_country_id, 'Vigo',           130, true),
      (v_country_id, 'Gijón',          140, true),
      (v_country_id, 'Granada',        150, true),
      (v_country_id, 'Murcia',         160, true),
      (v_country_id, 'Vitoria-Gasteiz',170, true),
      (v_country_id, 'A Coruña',       180, true),
      (v_country_id, 'Santa Cruz de Tenerife', 190, true),
      (v_country_id, 'Pamplona',       200, true),
      (v_country_id, 'San Sebastián',  210, true),
      (v_country_id, 'Toledo',         220, true),
      (v_country_id, 'Burgos',         230, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- İtalya (IT) — extend existing cities
  select id into v_country_id from public.geo_countries where code = 'IT' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Catania',        90, true),
      (v_country_id, 'Genova',         100, true),
      (v_country_id, 'Bari',           110, true),
      (v_country_id, 'Verona',         120, true),
      (v_country_id, 'Trieste',        130, true),
      (v_country_id, 'Messina',        140, true),
      (v_country_id, 'Padova',         150, true),
      (v_country_id, 'Taranto',        160, true),
      (v_country_id, 'Brescia',        170, true),
      (v_country_id, 'Prato',          180, true),
      (v_country_id, 'Parma',          190, true),
      (v_country_id, 'Modena',         200, true),
      (v_country_id, 'Reggio Calabria',210, true),
      (v_country_id, 'Reggio Emilia',  220, true),
      (v_country_id, 'Perugia',        230, true),
      (v_country_id, 'Livorno',        240, true),
      (v_country_id, 'Cagliari',       250, true),
      (v_country_id, 'Foggia',         260, true),
      (v_country_id, 'Rimini',         270, true),
      (v_country_id, 'Salerno',        280, true),
      (v_country_id, 'Ferrara',        290, true),
      (v_country_id, 'Ravenna',        300, true),
      (v_country_id, 'Bergamo',        310, true),
      (v_country_id, 'Trento',         320, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Hollanda (NL) — extend existing cities
  select id into v_country_id from public.geo_countries where code = 'NL' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Tilburg',        70, true),
      (v_country_id, 'Almere',         80, true),
      (v_country_id, 'Breda',          90, true),
      (v_country_id, 'Nijmegen',       100, true),
      (v_country_id, 'Enschede',       110, true),
      (v_country_id, 'Apeldoorn',      120, true),
      (v_country_id, 'Arnhem',         130, true),
      (v_country_id, 'Zaanstad',       140, true),
      (v_country_id, 'Amersfoort',     150, true),
      (v_country_id, 'Haarlemmermeer', 160, true),
      (v_country_id, 'Haarlem',        170, true),
      (v_country_id, 'Maastricht',     180, true),
      (v_country_id, 'Leiden',         190, true),
      (v_country_id, 'Dordrecht',      200, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Avusturya (AT) — extend existing cities
  select id into v_country_id from public.geo_countries where code = 'AT' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Klagenfurt',     60, true),
      (v_country_id, 'Wels',           70, true),
      (v_country_id, 'St. Pölten',     80, true),
      (v_country_id, 'Dornbirn',       90, true),
      (v_country_id, 'Villach',        100, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- İsviçre (CH) — extend existing cities
  select id into v_country_id from public.geo_countries where code = 'CH' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'St. Gallen',     70, true),
      (v_country_id, 'Winterthur',     80, true),
      (v_country_id, 'Biel/Bienne',    90, true),
      (v_country_id, 'Thun',           100, true),
      (v_country_id, 'Köniz',          110, true),
      (v_country_id, 'La Chaux-de-Fonds', 120, true),
      (v_country_id, 'Schaffhausen',   130, true),
      (v_country_id, 'Fribourg',       140, true),
      (v_country_id, 'Vernier',        150, true),
      (v_country_id, 'Chur',           160, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Türkiye (TR) — extend existing cities
  select id into v_country_id from public.geo_countries where code = 'TR' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Mersin',         100, true),
      (v_country_id, 'Diyarbakır',     110, true),
      (v_country_id, 'Şanlıurfa',      120, true),
      (v_country_id, 'Kayseri',        130, true),
      (v_country_id, 'Eskişehir',      140, true),
      (v_country_id, 'Gebze',          150, true),
      (v_country_id, 'Pendik',         160, true),
      (v_country_id, 'Ümraniye',       170, true),
      (v_country_id, 'Samsun',         180, true),
      (v_country_id, 'Malatya',        190, true),
      (v_country_id, 'Kahramanmaraş',  200, true),
      (v_country_id, 'Hatay',          210, true),
      (v_country_id, 'Manisa',         220, true),
      (v_country_id, 'Mardin',         230, true),
      (v_country_id, 'Sakarya',        240, true),
      (v_country_id, 'Denizli',        250, true),
      (v_country_id, 'Erzurum',        260, true),
      (v_country_id, 'Van',            270, true),
      (v_country_id, 'Muğla',          280, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- ABD (US) — extend existing cities
  select id into v_country_id from public.geo_countries where code = 'US' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Las Vegas',      170, true),
      (v_country_id, 'Portland',       180, true),
      (v_country_id, 'Detroit',        190, true),
      (v_country_id, 'Memphis',        200, true),
      (v_country_id, 'Nashville',      210, true),
      (v_country_id, 'Baltimore',      220, true),
      (v_country_id, 'Louisville',     230, true),
      (v_country_id, 'Minneapolis',    240, true),
      (v_country_id, 'New Orleans',    250, true),
      (v_country_id, 'Oklahoma City',  260, true),
      (v_country_id, 'Tucson',         270, true),
      (v_country_id, 'Fresno',         280, true),
      (v_country_id, 'Sacramento',     290, true),
      (v_country_id, 'Kansas City',    300, true),
      (v_country_id, 'Columbus',       310, true),
      (v_country_id, 'Indianapolis',   320, true),
      (v_country_id, 'Charlotte',      330, true),
      (v_country_id, 'Fort Worth',     340, true),
      (v_country_id, 'El Paso',        350, true),
      (v_country_id, 'Arlington',      360, true),
      (v_country_id, 'San Antonio',    370, true),
      (v_country_id, 'Tampa',          380, true),
      (v_country_id, 'Raleigh',        390, true),
      (v_country_id, 'Jacksonville',   400, true),
      (v_country_id, 'Pittsburgh',     410, true),
      (v_country_id, 'Cincinnati',     420, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Kanada (CA) — extend existing cities
  select id into v_country_id from public.geo_countries where code = 'CA' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Winnipeg',       90, true),
      (v_country_id, 'Victoria',       100, true),
      (v_country_id, 'Saskatoon',      110, true),
      (v_country_id, 'Regina',         120, true),
      (v_country_id, 'St. John''s',    130, true),
      (v_country_id, 'Kelowna',        140, true),
      (v_country_id, 'Fredericton',    150, true),
      (v_country_id, 'Charlottetown',  160, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Polonya (PL) — extend existing cities
  select id into v_country_id from public.geo_countries where code = 'PL' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Łódź',           60, true),
      (v_country_id, 'Szczecin',       70, true),
      (v_country_id, 'Bydgoszcz',      80, true),
      (v_country_id, 'Lublin',         90, true),
      (v_country_id, 'Katowice',       100, true),
      (v_country_id, 'Białystok',      110, true),
      (v_country_id, 'Rzeszów',        120, true),
      (v_country_id, 'Toruń',          130, true),
      (v_country_id, 'Częstochowa',    140, true),
      (v_country_id, 'Kielce',         150, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Belçika (BE) — extend existing cities
  select id into v_country_id from public.geo_countries where code = 'BE' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Charleroi',      60, true),
      (v_country_id, 'Namur',          70, true),
      (v_country_id, 'Leuven',         80, true),
      (v_country_id, 'Mechelen',       90, true),
      (v_country_id, 'Mons',           100, true),
      (v_country_id, 'Aalst',          110, true),
      (v_country_id, 'Hasselt',        120, true),
      (v_country_id, 'Kortrijk',       130, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- İsveç (SE) — extend existing cities
  select id into v_country_id from public.geo_countries where code = 'SE' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Linköping',      50, true),
      (v_country_id, 'Örebro',         60, true),
      (v_country_id, 'Västerås',       70, true),
      (v_country_id, 'Helsingborg',    80, true),
      (v_country_id, 'Jönköping',      90, true),
      (v_country_id, 'Norrköping',     100, true),
      (v_country_id, 'Lund',           110, true),
      (v_country_id, 'Umeå',           120, true),
      (v_country_id, 'Gävle',          130, true),
      (v_country_id, 'Borås',          140, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Avustralya (AU) — extend existing cities
  select id into v_country_id from public.geo_countries where code = 'AU' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Newcastle',      80, true),
      (v_country_id, 'Hobart',         90, true),
      (v_country_id, 'Sunshine Coast', 100, true),
      (v_country_id, 'Geelong',        110, true),
      (v_country_id, 'Townsville',     120, true),
      (v_country_id, 'Cairns',         130, true),
      (v_country_id, 'Darwin',         140, true),
      (v_country_id, 'Toowoomba',      150, true),
      (v_country_id, 'Ballarat',       160, true),
      (v_country_id, 'Bendigo',        170, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Japonya (JP) — extend existing cities
  select id into v_country_id from public.geo_countries where code = 'JP' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Kobe',           70, true),
      (v_country_id, 'Fukuoka',        80, true),
      (v_country_id, 'Kawasaki',       90, true),
      (v_country_id, 'Saitama',        100, true),
      (v_country_id, 'Hiroshima',      110, true),
      (v_country_id, 'Sendai',         120, true),
      (v_country_id, 'Kitakyushu',     130, true),
      (v_country_id, 'Chiba',          140, true),
      (v_country_id, 'Sakai',          150, true),
      (v_country_id, 'Niigata',        160, true),
      (v_country_id, 'Hamamatsu',      170, true),
      (v_country_id, 'Kumamoto',       180, true),
      (v_country_id, 'Okayama',        190, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Çin (CN) — extend existing cities
  select id into v_country_id from public.geo_countries where code = 'CN' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Wuhan',          70, true),
      (v_country_id, 'Tianjin',        80, true),
      (v_country_id, 'Xi''an',         90, true),
      (v_country_id, 'Nanjing',        100, true),
      (v_country_id, 'Wuxi',           110, true),
      (v_country_id, 'Foshan',         120, true),
      (v_country_id, 'Suzhou',         130, true),
      (v_country_id, 'Zhengzhou',      140, true),
      (v_country_id, 'Changsha',       150, true),
      (v_country_id, 'Qingdao',        160, true),
      (v_country_id, 'Kunming',        170, true),
      (v_country_id, 'Harbin',         180, true),
      (v_country_id, 'Dalian',         190, true),
      (v_country_id, 'Nanning',        200, true),
      (v_country_id, 'Xiamen',         210, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Hindistan (IN) — extend existing cities
  select id into v_country_id from public.geo_countries where code = 'IN' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Ahmedabad',      80, true),
      (v_country_id, 'Surat',          90, true),
      (v_country_id, 'Jaipur',         100, true),
      (v_country_id, 'Lucknow',        110, true),
      (v_country_id, 'Kanpur',         120, true),
      (v_country_id, 'Nagpur',         130, true),
      (v_country_id, 'Indore',         140, true),
      (v_country_id, 'Thane',          150, true),
      (v_country_id, 'Bhopal',         160, true),
      (v_country_id, 'Visakhapatnam', 170, true),
      (v_country_id, 'Patna',          180, true),
      (v_country_id, 'Vadodara',       190, true),
      (v_country_id, 'Ghaziabad',      200, true),
      (v_country_id, 'Ludhiana',       210, true),
      (v_country_id, 'Agra',           220, true),
      (v_country_id, 'Coimbatore',     230, true),
      (v_country_id, 'Kochi',          240, true),
      (v_country_id, 'Chandigarh',     250, true),
      (v_country_id, 'Gurgaon',        260, true),
      (v_country_id, 'Noida',          270, true),
      (v_country_id, 'Mysore',         280, true),
      (v_country_id, 'Nashik',         290, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- BAE (AE) — extend existing cities
  select id into v_country_id from public.geo_countries where code = 'AE' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Fujairah',       60, true),
      (v_country_id, 'Al Ain',         70, true),
      (v_country_id, 'Umm Al Quwain',  80, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Suudi Arabistan (SA) — extend existing cities
  select id into v_country_id from public.geo_countries where code = 'SA' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Taif',           60, true),
      (v_country_id, 'Tabuk',          70, true),
      (v_country_id, 'Al Khobar',      80, true),
      (v_country_id, 'Abha',           90, true),
      (v_country_id, 'Buraidah',       100, true),
      (v_country_id, 'Najran',         110, true),
      (v_country_id, 'Hail',           120, true),
      (v_country_id, 'Yanbu',          130, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Brezilya (BR) — extend existing cities
  select id into v_country_id from public.geo_countries where code = 'BR' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Fortaleza',      60, true),
      (v_country_id, 'Belo Horizonte', 70, true),
      (v_country_id, 'Manaus',         80, true),
      (v_country_id, 'Recife',         90, true),
      (v_country_id, 'Porto Alegre',   100, true),
      (v_country_id, 'Belém',          110, true),
      (v_country_id, 'Goiânia',        120, true),
      (v_country_id, 'Guarulhos',      130, true),
      (v_country_id, 'Campinas',       140, true),
      (v_country_id, 'São Luís',       150, true),
      (v_country_id, 'Maceió',         160, true),
      (v_country_id, 'Natal',          170, true),
      (v_country_id, 'Florianópolis',  180, true),
      (v_country_id, 'Campo Grande',   190, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Güney Afrika (ZA) — extend existing cities
  select id into v_country_id from public.geo_countries where code = 'ZA' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Port Elizabeth', 50, true),
      (v_country_id, 'Bloemfontein',   60, true),
      (v_country_id, 'East London',    70, true),
      (v_country_id, 'Polokwane',      80, true),
      (v_country_id, 'Nelspruit',      90, true),
      (v_country_id, 'Kimberley',      100, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Meksika (MX) — extend existing cities
  select id into v_country_id from public.geo_countries where code = 'MX' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Puebla',         50, true),
      (v_country_id, 'Tijuana',        60, true),
      (v_country_id, 'León',           70, true),
      (v_country_id, 'Ciudad Juárez',  80, true),
      (v_country_id, 'Mérida',         90, true),
      (v_country_id, 'San Luis Potosí',100, true),
      (v_country_id, 'Querétaro',      110, true),
      (v_country_id, 'Acapulco',       120, true),
      (v_country_id, 'Cuernavaca',     130, true),
      (v_country_id, 'Aguascalientes', 140, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Portekiz (PT) — extend existing cities
  select id into v_country_id from public.geo_countries where code = 'PT' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Braga',          50, true),
      (v_country_id, 'Funchal',        60, true),
      (v_country_id, 'Setúbal',        70, true),
      (v_country_id, 'Amadora',        80, true),
      (v_country_id, 'Almada',         90, true),
      (v_country_id, 'Guimarães',      100, true),
      (v_country_id, 'Aveiro',         110, true),
      (v_country_id, 'Évora',          120, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Romanya (RO) — extend existing cities
  select id into v_country_id from public.geo_countries where code = 'RO' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Constanța',      50, true),
      (v_country_id, 'Galați',         60, true),
      (v_country_id, 'Brașov',         70, true),
      (v_country_id, 'Oradea',         80, true),
      (v_country_id, 'Bacău',          90, true),
      (v_country_id, 'Arad',           100, true),
      (v_country_id, 'Sibiu',          110, true),
      (v_country_id, 'Pitești',        120, true),
      (v_country_id, 'Craiova',        130, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Danimarka (DK) — extend existing cities
  select id into v_country_id from public.geo_countries where code = 'DK' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Esbjerg',        50, true),
      (v_country_id, 'Frederiksberg',  60, true),
      (v_country_id, 'Vejle',          70, true),
      (v_country_id, 'Randers',        80, true),
      (v_country_id, 'Kolding',        90, true),
      (v_country_id, 'Horsens',        100, true),
      (v_country_id, 'Helsingør',      110, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Norveç (NO) — extend existing cities
  select id into v_country_id from public.geo_countries where code = 'NO' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Kristiansand',   50, true),
      (v_country_id, 'Fredrikstad',    60, true),
      (v_country_id, 'Drammen',        70, true),
      (v_country_id, 'Tromsø',         80, true),
      (v_country_id, 'Sandnes',        90, true),
      (v_country_id, 'Sarpsborg',      100, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Finlandiya (FI) — extend existing cities
  select id into v_country_id from public.geo_countries where code = 'FI' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Oulu',           50, true),
      (v_country_id, 'Jyväskylä',      60, true),
      (v_country_id, 'Lahti',          70, true),
      (v_country_id, 'Vantaa',         80, true),
      (v_country_id, 'Kuopio',         90, true),
      (v_country_id, 'Pori',           100, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Güney Kore (KR) — extend existing cities
  select id into v_country_id from public.geo_countries where code = 'KR' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Gwangju',        50, true),
      (v_country_id, 'Suwon',          60, true),
      (v_country_id, 'Ulsan',          70, true),
      (v_country_id, 'Seongnam',       80, true),
      (v_country_id, 'Goyang',         90, true),
      (v_country_id, 'Yongin',         100, true),
      (v_country_id, 'Changwon',       110, true),
      (v_country_id, 'Jeonju',         120, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Malezya (MY) — extend existing cities
  select id into v_country_id from public.geo_countries where code = 'MY' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Ipoh',           40, true),
      (v_country_id, 'Kota Kinabalu',  50, true),
      (v_country_id, 'Kuching',        60, true),
      (v_country_id, 'Shah Alam',      70, true),
      (v_country_id, 'Petaling Jaya',  80, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Tayland (TH) — extend existing cities
  select id into v_country_id from public.geo_countries where code = 'TH' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Nonthaburi',     50, true),
      (v_country_id, 'Pak Kret',       60, true),
      (v_country_id, 'Hat Yai',        70, true),
      (v_country_id, 'Udon Thani',     80, true),
      (v_country_id, 'Khon Kaen',      90, true),
      (v_country_id, 'Nakhon Ratchasima', 100, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Arjantin (AR) — extend existing cities
  select id into v_country_id from public.geo_countries where code = 'AR' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Mendoza',        40, true),
      (v_country_id, 'Tucumán',        50, true),
      (v_country_id, 'La Plata',       60, true),
      (v_country_id, 'Mar del Plata',  70, true),
      (v_country_id, 'Salta',          80, true),
      (v_country_id, 'Santa Fe',       90, true),
      (v_country_id, 'San Juan',       100, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Ukrayna (UA) — extend existing cities
  select id into v_country_id from public.geo_countries where code = 'UA' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Dnipro',         50, true),
      (v_country_id, 'Zaporizhzhia',   60, true),
      (v_country_id, 'Vinnytsia',      70, true),
      (v_country_id, 'Kryvyi Rih',     80, true),
      (v_country_id, 'Mariupol',       90, true),
      (v_country_id, 'Mykolaiv',       100, true),
      (v_country_id, 'Poltava',        110, true),
      (v_country_id, 'Chernihiv',      120, true),
      (v_country_id, 'Cherkasy',       130, true),
      (v_country_id, 'Khmelnytskyi',   140, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Mısır (EG) — extend existing cities
  select id into v_country_id from public.geo_countries where code = 'EG' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Giza',           40, true),
      (v_country_id, 'Port Said',      50, true),
      (v_country_id, 'Suez',           60, true),
      (v_country_id, 'Mansoura',       70, true),
      (v_country_id, 'Tanta',          80, true),
      (v_country_id, 'Assiut',         90, true),
      (v_country_id, 'Luxor',          100, true),
      (v_country_id, 'Aswan',          110, true),
      (v_country_id, 'Hurghada',       120, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Fas (MA) — extend existing cities
  select id into v_country_id from public.geo_countries where code = 'MA' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Agadir',         60, true),
      (v_country_id, 'Meknès',         70, true),
      (v_country_id, 'Oujda',          80, true),
      (v_country_id, 'Kenitra',        90, true),
      (v_country_id, 'Tétouan',        100, true),
      (v_country_id, 'El Jadida',      110, true),
      (v_country_id, 'Beni Mellal',    120, true)
    on conflict (country_id, name) do nothing;
  end if;

  -- Nijerya (NG) — extend existing cities
  select id into v_country_id from public.geo_countries where code = 'NG' and is_active = true limit 1;
  if v_country_id is not null then
    insert into public.geo_cities (country_id, name, sort_order, is_active) values
      (v_country_id, 'Ibadan',         40, true),
      (v_country_id, 'Port Harcourt',  50, true),
      (v_country_id, 'Benin City',     60, true),
      (v_country_id, 'Enugu',          70, true),
      (v_country_id, 'Aba',            80, true),
      (v_country_id, 'Jos',            90, true),
      (v_country_id, 'Kaduna',         100, true)
    on conflict (country_id, name) do nothing;
  end if;

end;
$$;
