-- Relocation Tools — Sigorta Seçimi (Almanya) [sigorta_secim_almanya].
-- Kaynak: ref101/app/(site)/sigorta-secim (almanya101). result_kind = ranked_list.
-- 20 soru → 13 sigorta tipinin skoru (base + soru katkıları) → mustAt/shouldAt eşikleriyle
-- öncelik bandı (Önce Al / Güçlü Öneri / Opsiyonel) → skora göre sıralı liste.
--
-- AYNA SÖZLEŞMESİ: INSURANCE_TYPES (base/mustAt/shouldAt) + soru add'leri hem bu migration'da
-- hem src/lib/relocation-tools-sigorta.ts'te BİREBİR (relocation-tools-sigorta.test.ts kilitler).
-- Skor RPC adı relocation_score_sigorta_secim_almanya_v1 → dispatcher (20260626230000) yedeğiyle otomatik bağlanır.
-- NOT: ref101'in 'yesno' soruları burada iki option'lı ('yes'/'no') single sorulara normalize edildi.

-- ---------------------------------------------------------------------------
-- 1) Araç seed.
-- ---------------------------------------------------------------------------
insert into public.relocation_tools
  (key, slug, title_tr, title_en, summary_tr, category, quick_question_count,
   detailed_question_count, result_kind, requires_auth, is_active, sort_order, weights)
values (
  'sigorta_secim_almanya',
  'sigorta-secim-almanya',
  'Sigorta Seçimi (Almanya)',
  'Germany Insurance Prioritizer',
  'Almanya''da 20 soruyla sigortalarını önceliklendir: hangisi "önce al", hangisi güçlü öneri, hangisi opsiyonel? Durumuna göre öncelik sıralı bir liste al.',
  'germany_tools',
  20, 20, 'ranked_list', true, true, 101,
  jsonb_build_object('priority', 1)
)
on conflict (key) do update set
  slug = excluded.slug, title_tr = excluded.title_tr, title_en = excluded.title_en,
  summary_tr = excluded.summary_tr, category = excluded.category,
  quick_question_count = excluded.quick_question_count,
  detailed_question_count = excluded.detailed_question_count,
  result_kind = excluded.result_kind, requires_auth = excluded.requires_auth,
  is_active = excluded.is_active, sort_order = excluded.sort_order,
  weights = excluded.weights, updated_at = now();

-- ---------------------------------------------------------------------------
-- 2) Soru seed (idempotent). scoring->'add' = option_value → sigorta tipi katkıları.
-- ---------------------------------------------------------------------------
delete from public.relocation_tool_questions where tool_key = 'sigorta_secim_almanya';

insert into public.relocation_tool_questions
  (tool_key, question_key, mode, section_key, prompt_tr, help_tr, answer_type, options, scoring, is_required, sort_order)
values
  ('sigorta_secim_almanya','q1','both','genel',
   'Almanya''da ikamet edip resmi kayıt (Anmeldung) yapacak mısın?',
   'Genel sistemlere giriş için ikamet ve kayıt süreçleri çoğu senaryoda temel kabul edilir.','single',
   jsonb_build_array(jsonb_build_object('value','yes','label','Evet'), jsonb_build_object('value','no','label','Hayır')),
   jsonb_build_object('add', jsonb_build_object('yes', jsonb_build_object('HEALTH',3), 'no', jsonb_build_object('HEALTH',1))), true, 1),

  ('sigorta_secim_almanya','q2','both','calisma',
   'Çalışan mısın? (mini-job dışı düzenli iş)',
   'Çalışma şekli bazı sigorta kararlarını etkiler.','single',
   jsonb_build_array(
     jsonb_build_object('value','employee','label','Evet, çalışanım'),
     jsonb_build_object('value','self','label','Serbest/şirket (freelance)'),
     jsonb_build_object('value','student','label','Öğrenciyim'),
     jsonb_build_object('value','other','label','Diğer/şu an çalışmıyorum')
   ),
   jsonb_build_object('add', jsonb_build_object(
     'employee', jsonb_build_object('HEALTH',2,'LIABILITY',2,'LEGAL',1,'BU',2),
     'self', jsonb_build_object('HEALTH',2,'LIABILITY',2,'LEGAL',2,'BU',3),
     'student', jsonb_build_object('HEALTH',2,'LIABILITY',3),
     'other', jsonb_build_object('HEALTH',2,'LIABILITY',2)
   )), true, 2),

  ('sigorta_secim_almanya','q3','both','aile',
   'Aileni (eş/çocuk) da kapsayan bir yapı gerekir mi?',
   'Aile durumu bazı poliçe tercihlerini değiştirir.','single',
   jsonb_build_array(jsonb_build_object('value','yes','label','Evet'), jsonb_build_object('value','no','label','Hayır')),
   jsonb_build_object('add', jsonb_build_object('yes', jsonb_build_object('HEALTH',2,'LIFE',2,'HOUSEHOLD',1), 'no', jsonb_build_object('BU',1))), true, 3),

  ('sigorta_secim_almanya','q4','both','arac',
   'Araba kullanıyor musun veya Almanya''da araba almayı planlıyor musun?',
   'Araç varsa sigorta tarafı farklı bir "zorunlu" kalem doğurabilir.','single',
   jsonb_build_array(jsonb_build_object('value','yes','label','Evet'), jsonb_build_object('value','no','label','Hayır')),
   jsonb_build_object('add', jsonb_build_object('yes', jsonb_build_object('CAR',5), 'no', jsonb_build_object('CAR',-2))), true, 4),

  ('sigorta_secim_almanya','q5','both','ev',
   'Evde pahalı eşyaların var mı? (laptop/TV/kamera vb.)',
   'Hırsızlık/yangın/su basması gibi riskler değerlendirilir.','single',
   jsonb_build_array(jsonb_build_object('value','yes','label','Evet'), jsonb_build_object('value','no','label','Hayır')),
   jsonb_build_object('add', jsonb_build_object('yes', jsonb_build_object('HOUSEHOLD',3), 'no', jsonb_build_object('HOUSEHOLD',1))), true, 5),

  ('sigorta_secim_almanya','q6','both','ev',
   'Kiracı mısın, ev sahibi mi olacaksın?',
   'Ev sahipliği bazı ek sigorta türlerini gündeme getirir.','single',
   jsonb_build_array(
     jsonb_build_object('value','rent','label','Kiracı'),
     jsonb_build_object('value','own','label','Ev sahibi'),
     jsonb_build_object('value','not_sure','label','Henüz belli değil')
   ),
   jsonb_build_object('add', jsonb_build_object(
     'rent', jsonb_build_object('HOUSEHOLD',2,'LIABILITY',1),
     'own', jsonb_build_object('BUILDING',5,'LIABILITY',1,'HOUSEHOLD',2),
     'not_sure', jsonb_build_object('HOUSEHOLD',1)
   )), true, 6),

  ('sigorta_secim_almanya','q7','both','aile',
   'Çocukların var mı?',
   'Aile riskleri ve gelir güvenliği daha kritik hale gelebilir.','single',
   jsonb_build_array(jsonb_build_object('value','yes','label','Evet'), jsonb_build_object('value','no','label','Hayır')),
   jsonb_build_object('add', jsonb_build_object('yes', jsonb_build_object('LIFE',3,'BU',2,'HEALTH',1), 'no', jsonb_build_object('LIABILITY',1))), true, 7),

  ('sigorta_secim_almanya','q8','both','gunluk',
   'Düzenli olarak bisiklet/e-scooter kullanıyor musun?',
   'Günlük şehir içi kullanımda üçüncü şahıs zararları önemli olabilir.','single',
   jsonb_build_array(jsonb_build_object('value','yes','label','Evet'), jsonb_build_object('value','no','label','Hayır')),
   jsonb_build_object('add', jsonb_build_object('yes', jsonb_build_object('LIABILITY',2,'ACCIDENT',1), 'no', jsonb_build_object('ACCIDENT',0))), true, 8),

  ('sigorta_secim_almanya','q9','both','seyahat',
   'Sık seyahat ediyor musun? (AB içi/dışı)',
   'Seyahat sağlık ekleri ve iptal gibi konular ancak bazı senaryolarda anlamlıdır.','single',
   jsonb_build_array(
     jsonb_build_object('value','often','label','Evet, sık'),
     jsonb_build_object('value','sometimes','label','Ara sıra'),
     jsonb_build_object('value','rare','label','Nadiren')
   ),
   jsonb_build_object('add', jsonb_build_object(
     'often', jsonb_build_object('TRAVEL',4), 'sometimes', jsonb_build_object('TRAVEL',2), 'rare', jsonb_build_object('TRAVEL',0)
   )), true, 9),

  ('sigorta_secim_almanya','q10','both','sorumluluk',
   'Başkasına zarar verme riskin yüksek mi? (çocuk, evcil hayvan, yoğun sosyal hayat)',
   'Örneğin birine maddi/bedeni zarar verme gibi riskler.','single',
   jsonb_build_array(jsonb_build_object('value','yes','label','Evet'), jsonb_build_object('value','no','label','Hayır')),
   jsonb_build_object('add', jsonb_build_object('yes', jsonb_build_object('LIABILITY',4), 'no', jsonb_build_object('LIABILITY',2))), true, 10),

  ('sigorta_secim_almanya','q11','both','gelir',
   'Gelirin kesilmesi seni ciddi zorlar mı? (tek gelir, az birikim, kredi)',
   'Çalışamaz hale gelme senaryolarında "gelir koruma" daha anlamlı hale gelebilir.','single',
   jsonb_build_array(jsonb_build_object('value','yes','label','Evet'), jsonb_build_object('value','no','label','Hayır')),
   jsonb_build_object('add', jsonb_build_object('yes', jsonb_build_object('BU',5), 'no', jsonb_build_object('BU',1))), true, 11),

  ('sigorta_secim_almanya','q12','both','hukuk',
   'Hukuki ihtilaf yaşama ihtimalin var mı? (iş/ev/komşu/taşınma)',
   'Kiracı-ev sahibi, iş sözleşmesi, tüketici anlaşmazlıkları gibi.','single',
   jsonb_build_array(jsonb_build_object('value','yes','label','Evet'), jsonb_build_object('value','no','label','Hayır')),
   jsonb_build_object('add', jsonb_build_object('yes', jsonb_build_object('LEGAL',4), 'no', jsonb_build_object('LEGAL',1))), true, 12),

  ('sigorta_secim_almanya','q13','both','dis',
   'Diş masrafları seni düşündürüyor mu? (ortodonti, implant vb.)',
   'Tamamlayıcı diş sigortası bazı kişilerde anlamlı olabilir.','single',
   jsonb_build_array(jsonb_build_object('value','yes','label','Evet'), jsonb_build_object('value','no','label','Hayır')),
   jsonb_build_object('add', jsonb_build_object('yes', jsonb_build_object('DENTAL',4), 'no', jsonb_build_object('DENTAL',0))), true, 13),

  ('sigorta_secim_almanya','q14','both','kaza',
   'Riskli/hobisel aktivitelerin var mı? (dağ sporu, motor, ekstrem spor)',
   'Kaza ihtimali artıyorsa kaza sigortası öne çıkabilir.','single',
   jsonb_build_array(jsonb_build_object('value','yes','label','Evet'), jsonb_build_object('value','no','label','Hayır')),
   jsonb_build_object('add', jsonb_build_object('yes', jsonb_build_object('ACCIDENT',4), 'no', jsonb_build_object('ACCIDENT',1))), true, 14),

  ('sigorta_secim_almanya','q15','both','hayvan',
   'Evcil hayvanın var mı? (özellikle köpek)',
   'Bazı hayvanlarda üçüncü şahıs riski artar.','single',
   jsonb_build_array(
     jsonb_build_object('value','dog','label','Köpek'),
     jsonb_build_object('value','cat','label','Kedi'),
     jsonb_build_object('value','none','label','Yok')
   ),
   jsonb_build_object('add', jsonb_build_object(
     'dog', jsonb_build_object('PET_LIAB',5), 'cat', jsonb_build_object('PET_LIAB',1), 'none', jsonb_build_object('PET_LIAB',0)
   )), true, 15),

  ('sigorta_secim_almanya','q16','both','calisma',
   'Tehlikeli bir işte/ortamda mı çalışıyorsun? (inşaat, yüksekten çalışma vb.)',
   'Fiziksel olarak riskli işlerde kaza veya gelir kaybı riski artar.','single',
   jsonb_build_array(jsonb_build_object('value','yes','label','Evet'), jsonb_build_object('value','no','label','Hayır')),
   jsonb_build_object('add', jsonb_build_object('yes', jsonb_build_object('ACCIDENT',2,'BU',2), 'no', jsonb_build_object('ACCIDENT',0))), true, 16),

  ('sigorta_secim_almanya','q17','both','gelir',
   'Kredi veya büyük borcun var mı? (konut, taşıt vb.)',
   'Borçların varsa hayat sigortası ve gelir koruma daha önemli olabilir.','single',
   jsonb_build_array(jsonb_build_object('value','yes','label','Evet'), jsonb_build_object('value','no','label','Hayır')),
   jsonb_build_object('add', jsonb_build_object('yes', jsonb_build_object('LIFE',3,'BU',2), 'no', jsonb_build_object('LIFE',0,'BU',0))), true, 17),

  ('sigorta_secim_almanya','q18','both','konut',
   'Riskli bir bölgede (sel, fırtına vb.) mı yaşıyorsun?',
   'Fiziki riskler arttıkça bina/eşya sigortaları daha anlamlı hale gelebilir.','single',
   jsonb_build_array(jsonb_build_object('value','yes','label','Evet'), jsonb_build_object('value','no','label','Hayır')),
   jsonb_build_object('add', jsonb_build_object('yes', jsonb_build_object('BUILDING',3,'HOUSEHOLD',1), 'no', jsonb_build_object('BUILDING',0))), true, 18),

  ('sigorta_secim_almanya','q19','both','arac',
   'Günlük olarak başka araç kullanıyor musun? (motor, büyük taşıt vb.)',
   'Ek araç kullanımı üçüncü şahıs sorumluluğu ve kaza riskini artırır.','single',
   jsonb_build_array(jsonb_build_object('value','yes','label','Evet'), jsonb_build_object('value','no','label','Hayır')),
   jsonb_build_object('add', jsonb_build_object('yes', jsonb_build_object('LIABILITY',2,'ACCIDENT',2), 'no', jsonb_build_object('LIABILITY',0))), true, 19),

  ('sigorta_secim_almanya','q20','both','konut',
   'Evde yangın veya su baskını riski var mı? (eski tesisat, fırtına riski)',
   'Bu tür riskler konut/bina ve ev eşyası sigortasını önemli kılar.','single',
   jsonb_build_array(jsonb_build_object('value','yes','label','Evet'), jsonb_build_object('value','no','label','Hayır')),
   jsonb_build_object('add', jsonb_build_object('yes', jsonb_build_object('BUILDING',3,'HOUSEHOLD',2), 'no', jsonb_build_object('BUILDING',0))), true, 20);

-- ---------------------------------------------------------------------------
-- 3) relocation_score_sigorta_secim_almanya_v1 — sigorta tipi skorları → öncelik bandı → sıralı liste.
--    INSURANCE_TYPES (base/mustAt/shouldAt/title) RPC içinde gömülü (ref101 data.ts aynası).
-- ---------------------------------------------------------------------------
create or replace function public.relocation_score_sigorta_secim_almanya_v1(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.relocation_tool_sessions%rowtype := public.rl_tool_owned_session(p_session_id);
  v_ans jsonb := public.rl_tool_answers_json(p_session_id);
  -- Sigorta tipleri: key → {title, base, mustAt, shouldAt} (ref101 INSURANCE_TYPES aynası).
  v_types jsonb := jsonb_build_array(
    jsonb_build_object('key','HEALTH','title','Sağlık Sigortası (Krankenversicherung)','base',10,'mustAt',12,'shouldAt',9),
    jsonb_build_object('key','LIABILITY','title','Özel Sorumluluk (Privathaftpflicht)','base',8,'mustAt',11,'shouldAt',8),
    jsonb_build_object('key','CAR','title','Araç Sigortası (Kfz-Haftpflicht + opsiyonel kasko)','base',0,'mustAt',5,'shouldAt',3),
    jsonb_build_object('key','HOUSEHOLD','title','Ev Eşyası (Hausrat)','base',2,'mustAt',8,'shouldAt',5),
    jsonb_build_object('key','LEGAL','title','Hukuk Koruma (Rechtsschutz)','base',1,'mustAt',9,'shouldAt',5),
    jsonb_build_object('key','BU','title','Çalışamazlık / Gelir Koruma (Berufsunfähigkeit)','base',1,'mustAt',10,'shouldAt',6),
    jsonb_build_object('key','LIFE','title','Risk Hayat (Risikolebensversicherung)','base',0,'mustAt',8,'shouldAt',4),
    jsonb_build_object('key','DENTAL','title','Diş Tamamlayıcı (Zahnzusatz)','base',0,'mustAt',7,'shouldAt',4),
    jsonb_build_object('key','ACCIDENT','title','Kaza Sigortası (Unfallversicherung)','base',0,'mustAt',7,'shouldAt',4),
    jsonb_build_object('key','TRAVEL','title','Seyahat Sağlık (Auslandsreise-KV)','base',0,'mustAt',7,'shouldAt',3),
    jsonb_build_object('key','BUILDING','title','Konut Bina (Wohngebäude) — ev sahibiysen','base',0,'mustAt',7,'shouldAt',3),
    jsonb_build_object('key','PET_LIAB','title','Evcil Hayvan Sorumluluk (Tierhalterhaftpflicht)','base',0,'mustAt',7,'shouldAt',2)
  );
  v_scores jsonb := '{}'::jsonb;
  v_q record;
  v_ranked jsonb;
  v_bands jsonb := jsonb_build_array(
    jsonb_build_object('key','excellent','min',80),
    jsonb_build_object('key','strong','min',60),
    jsonb_build_object('key','good','min',40),
    jsonb_build_object('key','moderate','min',0)
  );
  v_top_score numeric;
begin
  -- 1) Her sigorta tipinin base skoruyla başla.
  select coalesce(jsonb_object_agg(t ->> 'key', (t ->> 'base')::numeric), '{}'::jsonb)
  into v_scores
  from jsonb_array_elements(v_types) as t;

  -- 2) Cevaplardan tip katkılarını ekle (scoring->'add'->answer).
  for v_q in
    select (q.scoring -> 'add' -> (v_ans ->> q.question_key)) as add_obj
    from public.relocation_tool_questions q
    where q.tool_key = 'sigorta_secim_almanya' and q.is_active and v_ans ? q.question_key
  loop
    if v_q.add_obj is not null then
      select v_scores || (
        select jsonb_object_agg(k, coalesce((v_scores ->> k)::numeric, 0) + (val)::numeric)
        from jsonb_each_text(v_q.add_obj) as e(k, val)
      ) into v_scores;
    end if;
  end loop;

  -- 3) Tipleri skora göre sırala; öncelik bandını (must/should/optional) eşiklerle belirle.
  --    score100: ham skoru görece 0..100'e ölçekle (max ham skor = referans, en az 1).
  with scored as (
    select
      t ->> 'key' as key,
      t ->> 'title' as title,
      coalesce((v_scores ->> (t ->> 'key'))::numeric, 0) as raw,
      (t ->> 'mustAt')::numeric as must_at,
      (t ->> 'shouldAt')::numeric as should_at
    from jsonb_array_elements(v_types) as t
  ),
  banded as (
    select key, title, raw, must_at, should_at,
      case
        when raw >= must_at then 'must'
        when raw >= should_at then 'should'
        else 'optional'
      end as priority,
      greatest((select max(raw) from scored), 1) as max_raw
    from scored
  ),
  ranked as (
    select key, title, raw, priority,
      round(greatest(least(raw / max_raw, 1), 0) * 100, 0) as score100,
      case priority when 'must' then 1 when 'should' then 2 else 3 end as p_order,
      case priority when 'must' then 'Önce Al' when 'should' then 'Güçlü Öneri' else 'Opsiyonel' end as priority_label
    from banded
  )
  select
    coalesce(jsonb_agg(
      jsonb_build_object(
        'key', key,
        'title', title,
        'score', score100,
        'detail', priority_label,
        'priority', priority
      ) order by p_order asc, raw desc, title
    ), '[]'::jsonb),
    (select score100 from ranked order by p_order asc, raw desc, title limit 1)
  into v_ranked, v_top_score
  from ranked;

  return public.rl_tool_write_result(
    p_session_id,
    'ranked_list',
    v_top_score,
    public.rl_tool_resolve_bucket(coalesce(v_top_score, 0), v_bands),
    jsonb_build_object('ranked_insurances', v_ranked),
    '{}'::jsonb,
    v_ranked,
    jsonb_build_array(
      'Durumuna göre sigortaların öncelik sırasına dizildi: "Önce Al" kalemlerinden başla.',
      'Bu liste yönlendirme amaçlıdır; kapsam/koşulları sağlayıcının güncel şartlarından doğrula.'
    ),
    jsonb_build_array(
      jsonb_build_object('key','start_related_tool','label','Banka Seçimine Geç','href','/relocation/tools/banka-secim-almanya'),
      jsonb_build_object('key','find_mentor','label','Danışman/Topluluk Desteği Bul')
    ),
    '{}'::jsonb,
    'rule-v1'
  );
end;
$$;

grant execute on function public.relocation_score_sigorta_secim_almanya_v1(uuid) to authenticated;
