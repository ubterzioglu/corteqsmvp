-- Relocation Tools — Banka Seçimi (Almanya) [banka_secim_almanya].
-- Kaynak: ref101/app/(site)/banka-secim (almanya101). result_kind = ranked_list.
-- 20 soru → 8 profil sinyali → her banka için ağırlıklı skor → top-3 banka.
--
-- AYNA SÖZLEŞMESİ: PROFILES/BANKS/QUESTIONS option-add'leri ve banka weights'leri hem bu
-- migration'da hem src/lib/relocation-tools-banka.ts'te BİREBİR (relocation-tools-banka.test.ts kilitler).
-- Dispatcher (20260626230000) 'relocation_score_' || tool_key || '_v1' yedeğini kullandığından
-- skor RPC adı relocation_score_banka_secim_almanya_v1 → otomatik bağlanır (dispatcher düzenlenmez).

-- ---------------------------------------------------------------------------
-- 1) Araç seed. ranked_list aracı; weights = profil sinyali ağırlıkları (gösterim/ayna).
-- ---------------------------------------------------------------------------
insert into public.relocation_tools
  (key, slug, title_tr, title_en, summary_tr, category, quick_question_count,
   detailed_question_count, result_kind, requires_auth, is_active, sort_order, weights)
values (
  'banka_secim_almanya',
  'banka-secim-almanya',
  'Banka Seçimi (Almanya)',
  'Germany Bank Chooser',
  'Almanya''da 20 kısa soruyla bankacılık profilini çıkar; dijital, direkt, yerel/şubeli ve yatırım odaklı bankalar arasından sana en uygun 3 bankayı somut gerekçelerle öner.',
  'germany_tools',
  20, 20, 'ranked_list', true, true, 100,
  jsonb_build_object(
    'DIGITAL', 1, 'DIRECT', 1, 'LOCAL', 1, 'EXPAT', 1,
    'INVEST', 1, 'CRYPTO', 1, 'LOW_COST', 1, 'BRANCH', 1
  )
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
-- 2) Soru seed (idempotent). Her option 'value' = ref101 option.key; 'add' = profil sinyali katkıları.
-- mode = 'both' (araç tek modlu; quick=detailed=20). scoring jsonb'de option-add saklanır.
-- ---------------------------------------------------------------------------
delete from public.relocation_tool_questions where tool_key = 'banka_secim_almanya';

insert into public.relocation_tool_questions
  (tool_key, question_key, mode, section_key, prompt_tr, help_tr, answer_type, options, scoring, is_required, sort_order)
values
  ('banka_secim_almanya','q1','both','profil',
   'Almanya''da ne zamandır yaşıyorsun?',
   'Yeni gelenler için dil/kurulum kolaylığı; yerleşik olanlar için şube/danışmanlık ihtiyaçları değişir.','single',
   jsonb_build_array(
     jsonb_build_object('value','new','label','Yeni geldim (0–1 yıl)'),
     jsonb_build_object('value','mid','label','1–5 yıl'),
     jsonb_build_object('value','old','label','5+ yıl')
   ),
   jsonb_build_object('add', jsonb_build_object(
     'new', jsonb_build_object('EXPAT',3,'DIGITAL',2,'DIRECT',1),
     'mid', jsonb_build_object('DIRECT',2,'DIGITAL',1),
     'old', jsonb_build_object('LOCAL',2)
   )), true, 1),

  ('banka_secim_almanya','q2','both','profil',
   'Almanca seviyen nasıl?',
   'Dil bariyeri varsa expat/dil-dostu ve güçlü uygulama desteği kritik olur.','single',
   jsonb_build_array(
     jsonb_build_object('value','low','label','Zayıf / İngilizce tercih'),
     jsonb_build_object('value','mid','label','Orta'),
     jsonb_build_object('value','high','label','İyi / çok iyi')
   ),
   jsonb_build_object('add', jsonb_build_object(
     'low', jsonb_build_object('EXPAT',3,'DIGITAL',2),
     'mid', jsonb_build_object('DIRECT',2),
     'high', jsonb_build_object('LOCAL',2)
   )), true, 2),

  ('banka_secim_almanya','q3','both','profil',
   'Yaşadığın yer daha çok…',
   'Şube/ATM ihtiyacı, yaşadığın lokasyona göre değişir.','single',
   jsonb_build_array(
     jsonb_build_object('value','city','label','Büyük şehir merkezi'),
     jsonb_build_object('value','suburb','label','Banliyö'),
     jsonb_build_object('value','town','label','Küçük şehir/kasaba')
   ),
   jsonb_build_object('add', jsonb_build_object(
     'city', jsonb_build_object('DIGITAL',2),
     'suburb', jsonb_build_object('DIRECT',2),
     'town', jsonb_build_object('LOCAL',2,'BRANCH',2)
   )), true, 3),

  ('banka_secim_almanya','q4','both','sube',
   'Şubeye gitme ihtiyacın olur mu?',
   'Nakit yatırma, danışmanlık, özel işlemler…','single',
   jsonb_build_array(
     jsonb_build_object('value','never','label','Asla'),
     jsonb_build_object('value','rare','label','Nadiren'),
     jsonb_build_object('value','often','label','Evet, önemli')
   ),
   jsonb_build_object('add', jsonb_build_object(
     'never', jsonb_build_object('DIGITAL',3,'DIRECT',1),
     'rare', jsonb_build_object('DIRECT',2),
     'often', jsonb_build_object('BRANCH',4,'LOCAL',3)
   )), true, 4),

  ('banka_secim_almanya','q5','both','masraf',
   'En çok hangisi canını sıkar?',
   'Birincil ağrı noktanı seç: buna göre öneri keskinleşir.','single',
   jsonb_build_array(
     jsonb_build_object('value','fees','label','Yüksek ücretler'),
     jsonb_build_object('value','app','label','Kötü mobil uygulama'),
     jsonb_build_object('value','support','label','Ulaşılamayan destek')
   ),
   jsonb_build_object('add', jsonb_build_object(
     'fees', jsonb_build_object('LOW_COST',4),
     'app', jsonb_build_object('DIGITAL',4),
     'support', jsonb_build_object('BRANCH',3,'LOCAL',1)
   )), true, 5),

  ('banka_secim_almanya','q6','both','masraf',
   'Aylık hesap ücreti konusunda yaklaşımın?',
   'Ücret toleransı, banka tipini direkt etkiler.','single',
   jsonb_build_array(
     jsonb_build_object('value','nope','label','Asla'),
     jsonb_build_object('value','maybe','label','Makul olursa'),
     jsonb_build_object('value','ok','label','Sorun değil')
   ),
   jsonb_build_object('add', jsonb_build_object(
     'nope', jsonb_build_object('LOW_COST',4,'DIGITAL',1,'DIRECT',1),
     'maybe', jsonb_build_object('DIRECT',2),
     'ok', jsonb_build_object('LOCAL',2,'BRANCH',1)
   )), true, 6),

  ('banka_secim_almanya','q7','both','masraf',
   'SEPA havale/transfer sıklığın?',
   'Sık transfer yapanlar için masraf + hız önemli.','single',
   jsonb_build_array(
     jsonb_build_object('value','often','label','Çok sık'),
     jsonb_build_object('value','sometimes','label','Ara sıra'),
     jsonb_build_object('value','rare','label','Nadiren')
   ),
   jsonb_build_object('add', jsonb_build_object(
     'often', jsonb_build_object('LOW_COST',2,'DIGITAL',2),
     'sometimes', jsonb_build_object('DIRECT',1),
     'rare', jsonb_build_object('LOCAL',1)
   )), true, 7),

  ('banka_secim_almanya','q8','both','sube',
   'Nakit kullanımı senin için…',
   'Almanya''da hâlâ nakit seven çok kişi var.','single',
   jsonb_build_array(
     jsonb_build_object('value','none','label','Neredeyse hiç'),
     jsonb_build_object('value','some','label','Bazen'),
     jsonb_build_object('value','often','label','Sık sık')
   ),
   jsonb_build_object('add', jsonb_build_object(
     'none', jsonb_build_object('DIGITAL',2),
     'some', jsonb_build_object('DIRECT',1),
     'often', jsonb_build_object('BRANCH',3,'LOCAL',2)
   )), true, 8),

  ('banka_secim_almanya','q9','both','sube',
   'ATM yakınlığı/erişimi önemli mi?',
   'Banliyöde/taşrada ATM ve şube fark yaratır.','single',
   jsonb_build_array(
     jsonb_build_object('value','no','label','Değil'),
     jsonb_build_object('value','any','label','Evet ama fark etmez'),
     jsonb_build_object('value','near','label','Evet, yakın olsun')
   ),
   jsonb_build_object('add', jsonb_build_object(
     'no', jsonb_build_object('DIGITAL',1),
     'any', jsonb_build_object('DIRECT',2),
     'near', jsonb_build_object('LOCAL',2,'BRANCH',2)
   )), true, 9),

  ('banka_secim_almanya','q10','both','kart',
   'Kart tercihinde hangisi ağır basıyor?',
   'Debit vs kredi vs klasik Girocard.','single',
   jsonb_build_array(
     jsonb_build_object('value','debit','label','Sadece debit'),
     jsonb_build_object('value','both','label','Debit + kredi'),
     jsonb_build_object('value','giro','label','Klasik (Girocard vb.)')
   ),
   jsonb_build_object('add', jsonb_build_object(
     'debit', jsonb_build_object('DIGITAL',1),
     'both', jsonb_build_object('DIRECT',2),
     'giro', jsonb_build_object('LOCAL',2)
   )), true, 10),

  ('banka_secim_almanya','q11','both','yatirim',
   'Borsa/ETF yatırımı yapıyor musun?',
   'Yatırım odaklı bankalar/brokerlar farklı.','single',
   jsonb_build_array(
     jsonb_build_object('value','active','label','Evet, aktif'),
     jsonb_build_object('value','sometimes','label','Ara sıra'),
     jsonb_build_object('value','no','label','Hayır')
   ),
   jsonb_build_object('add', jsonb_build_object(
     'active', jsonb_build_object('INVEST',4,'LOW_COST',2),
     'sometimes', jsonb_build_object('INVEST',2),
     'no', jsonb_build_object()
   )), true, 11),

  ('banka_secim_almanya','q12','both','yatirim',
   'Yatırımda senin için en önemli şey?',
   'Komisyon mu, güven mi, kullanım kolaylığı mı?','single',
   jsonb_build_array(
     jsonb_build_object('value','fees','label','Düşük komisyon'),
     jsonb_build_object('value','trust','label','Banka güvencesi'),
     jsonb_build_object('value','easy','label','Mobil kolaylık')
   ),
   jsonb_build_object('add', jsonb_build_object(
     'fees', jsonb_build_object('INVEST',2,'LOW_COST',3),
     'trust', jsonb_build_object('LOCAL',2),
     'easy', jsonb_build_object('DIGITAL',2,'INVEST',1)
   )), true, 12),

  ('banka_secim_almanya','q13','both','kripto',
   'Kripto ile ilişkin nedir?',
   'Kripto aktifse doğru kanal seçimi çok fark eder.','single',
   jsonb_build_array(
     jsonb_build_object('value','active','label','Aktif alım-satım'),
     jsonb_build_object('value','curious','label','Merak ediyorum'),
     jsonb_build_object('value','none','label','Hiç ilgim yok')
   ),
   jsonb_build_object('add', jsonb_build_object(
     'active', jsonb_build_object('CRYPTO',4,'DIGITAL',2),
     'curious', jsonb_build_object('CRYPTO',2),
     'none', jsonb_build_object()
   )), true, 13),

  ('banka_secim_almanya','q14','both','kripto',
   'Kripto nerede dursun istersin?',
   'Bankada mı, ayrı platformda mı?','single',
   jsonb_build_array(
     jsonb_build_object('value','inbank','label','Bankada/uygulamada olsun'),
     jsonb_build_object('value','separate','label','Ayrı platform olur'),
     jsonb_build_object('value','no','label','Hiç gerek yok')
   ),
   jsonb_build_object('add', jsonb_build_object(
     'inbank', jsonb_build_object('CRYPTO',3,'DIGITAL',1),
     'separate', jsonb_build_object('INVEST',1),
     'no', jsonb_build_object('LOCAL',1)
   )), true, 14),

  ('banka_secim_almanya','q15','both','kullanim',
   'Finansı tek uygulamada mı yönetmek istersin?',
   'Bankacılık + yatırım + kripto gibi.','single',
   jsonb_build_array(
     jsonb_build_object('value','one','label','Evet, tek uygulama'),
     jsonb_build_object('value','any','label','Fark etmez'),
     jsonb_build_object('value','separate','label','Ayrı olsun')
   ),
   jsonb_build_object('add', jsonb_build_object(
     'one', jsonb_build_object('DIGITAL',3),
     'any', jsonb_build_object('DIRECT',1),
     'separate', jsonb_build_object('LOCAL',1)
   )), true, 15),

  ('banka_secim_almanya','q16','both','kullanim',
   'Banka seçerken en önemli kriter hangisi?',
   'Tek bir şey seç: algoritma bunu ağırlık gibi kullanır.','single',
   jsonb_build_array(
     jsonb_build_object('value','trust','label','Güven & köklülük'),
     jsonb_build_object('value','speed','label','Hız & teknoloji'),
     jsonb_build_object('value','balance','label','Dengeli olsun')
   ),
   jsonb_build_object('add', jsonb_build_object(
     'trust', jsonb_build_object('LOCAL',3,'BRANCH',1),
     'speed', jsonb_build_object('DIGITAL',3),
     'balance', jsonb_build_object('DIRECT',3)
   )), true, 16),

  ('banka_secim_almanya','q17','both','destek',
   'Müşteri hizmetlerine erişim beklentin?',
   'Telefon/şube/online chat farkı.','single',
   jsonb_build_array(
     jsonb_build_object('value','high','label','Çok önemli'),
     jsonb_build_object('value','mid','label','Orta'),
     jsonb_build_object('value','low','label','Hiç önemli değil')
   ),
   jsonb_build_object('add', jsonb_build_object(
     'high', jsonb_build_object('BRANCH',3,'LOCAL',1),
     'mid', jsonb_build_object('DIRECT',2),
     'low', jsonb_build_object('DIGITAL',2)
   )), true, 17),

  ('banka_secim_almanya','q18','both','destek',
   'Hesabın bloke/kapanma riski seni ne kadar gerer?',
   'KYC/AML süreçleri bazı fintechlerde daha sert hissedilebilir.','single',
   jsonb_build_array(
     jsonb_build_object('value','yes','label','Evet, çok gerer'),
     jsonb_build_object('value','some','label','Biraz'),
     jsonb_build_object('value','no','label','Hayır')
   ),
   jsonb_build_object('add', jsonb_build_object(
     'yes', jsonb_build_object('LOCAL',2,'DIRECT',1),
     'some', jsonb_build_object('DIRECT',1),
     'no', jsonb_build_object('DIGITAL',1)
   )), true, 18),

  ('banka_secim_almanya','q19','both','destek',
   'Banka değiştirmeye ne kadar açıksın?',
   'Esneklik yüksekse fintech/dijital daha mantıklı olur.','single',
   jsonb_build_array(
     jsonb_build_object('value','open','label','Çok açık'),
     jsonb_build_object('value','maybe','label','Gerekirse'),
     jsonb_build_object('value','hard','label','Zor')
   ),
   jsonb_build_object('add', jsonb_build_object(
     'open', jsonb_build_object('DIGITAL',2),
     'maybe', jsonb_build_object('DIRECT',1),
     'hard', jsonb_build_object('LOCAL',2)
   )), true, 19),

  ('banka_secim_almanya','q20','both','genel',
   'İdeal banka senin için hangisi?',
   'Son soru: içgüdüsel tercihin.','single',
   jsonb_build_array(
     jsonb_build_object('value','free','label','Masrafsız & mobil'),
     jsonb_build_object('value','balanced','label','Dengeli & güvenli'),
     jsonb_build_object('value','branch','label','Şubeli & klasik')
   ),
   jsonb_build_object('add', jsonb_build_object(
     'free', jsonb_build_object('DIGITAL',2,'LOW_COST',2),
     'balanced', jsonb_build_object('DIRECT',2),
     'branch', jsonb_build_object('LOCAL',2,'BRANCH',2)
   )), true, 20);

-- ---------------------------------------------------------------------------
-- 3) relocation_score_banka_secim_almanya_v1 — profil sinyalleri → banka skorları → top-3.
--    BANKS weights tablosu RPC içinde gömülü (ref101 data.ts BANKS aynası).
--    Skor normalizasyonu: ham banka skoru → 0..100'e min-max ölçeklenir (gösterim için).
-- ---------------------------------------------------------------------------
create or replace function public.relocation_score_banka_secim_almanya_v1(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.relocation_tool_sessions%rowtype := public.rl_tool_owned_session(p_session_id);
  v_ans jsonb := public.rl_tool_answers_json(p_session_id);
  -- Banka kataloğu (id, name, type, weights) — ref101 data.ts BANKS aynası.
  v_banks jsonb := jsonb_build_array(
    jsonb_build_object('id','n26','name','N26','type','Mobil banka','w', jsonb_build_object('DIGITAL',5,'DIRECT',2,'EXPAT',4,'INVEST',5,'CRYPTO',4,'LOW_COST',3,'BRANCH',-4,'LOCAL',-3)),
    jsonb_build_object('id','revolut','name','Revolut','type','Fintech (banka)','w', jsonb_build_object('DIGITAL',5,'EXPAT',4,'CRYPTO',4,'INVEST',2,'LOW_COST',2,'DIRECT',3,'BRANCH',-5,'LOCAL',-4)),
    jsonb_build_object('id','ing','name','ING','type','Direkt banka','w', jsonb_build_object('DIRECT',5,'INVEST',4,'LOW_COST',2,'DIGITAL',2,'EXPAT',1,'BRANCH',-3,'LOCAL',-2,'CRYPTO',0)),
    jsonb_build_object('id','dkb','name','DKB','type','Direkt banka','w', jsonb_build_object('DIRECT',4,'INVEST',4,'LOW_COST',3,'DIGITAL',2,'EXPAT',0,'BRANCH',-3,'LOCAL',-2,'CRYPTO',0)),
    jsonb_build_object('id','sparkasse','name','Sparkasse','type','Yerel banka (şubeli)','w', jsonb_build_object('LOCAL',5,'BRANCH',5,'INVEST',2,'DIGITAL',1,'DIRECT',1,'LOW_COST',-2,'EXPAT',0,'CRYPTO',1)),
    jsonb_build_object('id','volksbank','name','Volksbank / Raiffeisenbank','type','Yerel banka (şubeli)','w', jsonb_build_object('LOCAL',5,'BRANCH',5,'INVEST',2,'DIGITAL',1,'DIRECT',1,'LOW_COST',-2,'EXPAT',0,'CRYPTO',0)),
    jsonb_build_object('id','commerzbank','name','Commerzbank','type','Geleneksel banka','w', jsonb_build_object('LOCAL',3,'BRANCH',3,'DIRECT',2,'INVEST',3,'DIGITAL',1,'LOW_COST',-2,'EXPAT',1,'CRYPTO',0)),
    jsonb_build_object('id','deutschebank','name','Deutsche Bank','type','Geleneksel banka','w', jsonb_build_object('LOCAL',3,'BRANCH',2,'DIRECT',1,'INVEST',3,'DIGITAL',1,'LOW_COST',-2,'EXPAT',0,'CRYPTO',0)),
    jsonb_build_object('id','traderepublic','name','Trade Republic','type','Yatırım + banka (ECB lisanslı)','w', jsonb_build_object('INVEST',6,'LOW_COST',3,'DIGITAL',3,'CRYPTO',3,'DIRECT',3,'EXPAT',1,'BRANCH',-6,'LOCAL',-4)),
    jsonb_build_object('id','c24','name','C24 Bank','type','Direkt banka (app ağırlıklı)','w', jsonb_build_object('DIGITAL',4,'DIRECT',4,'LOW_COST',4,'EXPAT',0,'INVEST',0,'CRYPTO',0,'BRANCH',-4,'LOCAL',-3)),
    jsonb_build_object('id','comdirect','name','comdirect','type','Direkt banka (Commerzbank grubu)','w', jsonb_build_object('DIRECT',4,'INVEST',5,'LOW_COST',2,'DIGITAL',2,'EXPAT',0,'CRYPTO',0,'BRANCH',-2,'LOCAL',-1)),
    jsonb_build_object('id','consorsbank','name','Consorsbank','type','Direkt banka / broker (BNP Paribas)','w', jsonb_build_object('DIRECT',3,'INVEST',6,'LOW_COST',3,'DIGITAL',2,'EXPAT',0,'CRYPTO',0,'BRANCH',-3,'LOCAL',-2)),
    jsonb_build_object('id','targobank','name','Targobank','type','Geleneksel banka (şubeli)','w', jsonb_build_object('LOCAL',3,'BRANCH',4,'DIRECT',1,'INVEST',1,'DIGITAL',1,'LOW_COST',-1,'EXPAT',0,'CRYPTO',0)),
    jsonb_build_object('id','postbank','name','Postbank','type','Geleneksel banka (şubeli)','w', jsonb_build_object('LOCAL',3,'BRANCH',4,'DIRECT',1,'INVEST',2,'DIGITAL',1,'LOW_COST',-2,'EXPAT',0,'CRYPTO',0)),
    jsonb_build_object('id','hvb','name','HypoVereinsbank (UniCredit)','type','Geleneksel banka','w', jsonb_build_object('LOCAL',3,'BRANCH',3,'DIRECT',1,'INVEST',3,'DIGITAL',1,'LOW_COST',-2,'EXPAT',0,'CRYPTO',0)),
    jsonb_build_object('id','santander','name','Santander','type','Banka (şubeli/karma)','w', jsonb_build_object('LOCAL',2,'BRANCH',2,'DIRECT',2,'INVEST',1,'DIGITAL',1,'LOW_COST',2,'EXPAT',0,'CRYPTO',0)),
    jsonb_build_object('id','bunq','name','bunq','type','Mobil banka (AB fintech)','w', jsonb_build_object('DIGITAL',5,'EXPAT',4,'DIRECT',2,'LOW_COST',-2,'INVEST',0,'CRYPTO',0,'BRANCH',-5,'LOCAL',-4)),
    jsonb_build_object('id','tomorrow','name','Tomorrow','type','Mobil banka (sürdürülebilir odak)','w', jsonb_build_object('DIGITAL',4,'DIRECT',2,'LOW_COST',1,'EXPAT',2,'INVEST',0,'CRYPTO',0,'BRANCH',-5,'LOCAL',-4)),
    jsonb_build_object('id','wise','name','Wise','type','Fintech (çoklu para / transfer)','w', jsonb_build_object('DIGITAL',4,'EXPAT',5,'LOW_COST',4,'DIRECT',1,'INVEST',0,'CRYPTO',0,'BRANCH',-6,'LOCAL',-5))
  );
  v_profile_labels jsonb := jsonb_build_object(
    'DIGITAL','Dijital (app-first)','DIRECT','Direkt/Online','LOCAL','Yerel/Klasik','EXPAT','Expat/Dil-dostu',
    'INVEST','Borsa/ETF odaklı','CRYPTO','Kripto odaklı','LOW_COST','Masraf hassasiyeti','BRANCH','Şube ihtiyacı'
  );
  v_scores jsonb := '{}'::jsonb;
  v_q record;
  v_ranked jsonb;
  v_top jsonb;
  v_top_score numeric;
  v_min numeric;
  v_max numeric;
  v_top_signals jsonb;
  v_bands jsonb := jsonb_build_array(
    jsonb_build_object('key','excellent','min',80),
    jsonb_build_object('key','strong','min',60),
    jsonb_build_object('key','good','min',40),
    jsonb_build_object('key','moderate','min',0)
  );
begin
  -- 1) Cevaplardan profil sinyallerini topla (option-add'leri scoring jsonb'den oku).
  for v_q in
    select q.question_key, (q.scoring -> 'add' -> (v_ans ->> q.question_key)) as add_obj
    from public.relocation_tool_questions q
    where q.tool_key = 'banka_secim_almanya' and q.is_active
      and v_ans ? q.question_key
  loop
    if v_q.add_obj is not null then
      select coalesce(
        v_scores || (
          select jsonb_object_agg(k, coalesce((v_scores ->> k)::numeric, 0) + (val)::numeric)
          from jsonb_each_text(v_q.add_obj) as e(k, val)
        ), v_scores
      ) into v_scores;
    end if;
  end loop;

  -- 2) Her banka için ham skor = Σ(profileScore * bankWeight).
  with bank_scores as (
    select
      b ->> 'id' as id,
      b ->> 'name' as name,
      b ->> 'type' as type,
      (
        select coalesce(sum(coalesce((v_scores ->> wk)::numeric, 0) * (wv)::numeric), 0)
        from jsonb_each_text(b -> 'w') as w(wk, wv)
      ) as raw_score
    from jsonb_array_elements(v_banks) as b
  )
  select
    min(raw_score), max(raw_score)
  into v_min, v_max
  from bank_scores;

  -- 3) Top-3 banka → 0..100 normalize edilmiş skor + tip etiketi.
  with bank_scores as (
    select
      b ->> 'id' as id,
      b ->> 'name' as name,
      b ->> 'type' as type,
      (
        select coalesce(sum(coalesce((v_scores ->> wk)::numeric, 0) * (wv)::numeric), 0)
        from jsonb_each_text(b -> 'w') as w(wk, wv)
      ) as raw_score
    from jsonb_array_elements(v_banks) as b
  ),
  ranked as (
    select id, name, type, raw_score,
      case when v_max = v_min then 100
        else round(((raw_score - v_min) / (v_max - v_min)) * 100, 0) end as score100,
      row_number() over (order by raw_score desc, name) as rn
    from bank_scores
  )
  select
    coalesce(jsonb_agg(
      jsonb_build_object(
        'key', id,
        'title', name,
        'score', score100,
        'detail', type
      ) order by rn
    ) filter (where rn <= 3), '[]'::jsonb),
    (select score100 from ranked where rn = 1)
  into v_ranked, v_top_score
  from ranked;

  v_top := coalesce((v_ranked -> 0), '{}'::jsonb);

  -- 4) En güçlü 3 profil sinyali → açıklayıcı etiketler.
  select coalesce(jsonb_agg(label order by sc desc, k), '[]'::jsonb)
  into v_top_signals
  from (
    select k, sc, v_profile_labels ->> k as label
    from (
      select key as k, value::numeric as sc
      from jsonb_each_text(v_scores)
      where value::numeric > 0
    ) s
    order by sc desc, k
    limit 3
  ) t;

  return public.rl_tool_write_result(
    p_session_id,
    'ranked_list',
    v_top_score,
    public.rl_tool_resolve_bucket(coalesce(v_top_score, 0), v_bands),
    jsonb_build_object('ranked_banks', v_ranked, 'top_signals', v_top_signals),
    '{}'::jsonb,
    v_ranked,
    jsonb_build_array(
      'Cevaplarına göre en uygun 3 banka sıralandı.',
      'Skorlar yönlendirme amaçlıdır; ücretler/koşullar değişebilir — son karardan önce bankanın güncel şartlarını kontrol et.'
    ),
    jsonb_build_array(
      jsonb_build_object('key','start_related_tool','label','Para Transferi Aracına Geç','href','/relocation/tools/para-transferi-almanya'),
      jsonb_build_object('key','start_related_tool','label','Sigorta Seçimine Geç','href','/relocation/tools/sigorta-secim-almanya')
    ),
    '{}'::jsonb,
    'rule-v1'
  );
end;
$$;

grant execute on function public.relocation_score_banka_secim_almanya_v1(uuid) to authenticated;
