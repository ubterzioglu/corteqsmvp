-- GOOGLE AUTH ID maddesindeki 9 Eylül soru yorumu 10 Eylül 07:49 UTC'de yanlışlıkla
-- silinmişti (kullanıcı teyit etti, 13 Eylül). Aynı 6 soru yeniden eklenir.
--
-- Idempotent: madde altında zaten silinmemiş bir "Barış (sorular)" yorumu varsa
-- tekrar eklenmez.

do $mig$
declare
  v_id uuid;
begin
  select id into v_id
  from public.command_center_hot_fixes
  where title = 'GOOGLE AUTH ID' and deleted_at is null;

  if v_id is null then
    raise exception 'GOOGLE AUTH ID maddesi bulunamadi';
  end if;

  if not exists (
    select 1 from public.command_center_hot_fix_comments
    where hot_fix_id = v_id and author_name = 'Barış (sorular)' and deleted_at is null
  ) then
    insert into public.command_center_hot_fix_comments (hot_fix_id, author_name, body)
    values (
      v_id,
      'Barış (sorular)',
      $q$DURUM (9 Eylül'de bakıldı, 13 Eylül'de yeniden eklendi — ilk yorum yanlışlıkla silinmişti): Şikâyetin doğru. Google ile giriş yapan üye şu an "injprdrsklkxgnaiixzh.supabase.co uygulamasında oturum açın" yazan bir ekran görüyor; bu güven vermiyor. İyi haber: bunun için hazırlanmış bir plan zaten var (2 Ağustos'ta yazılmış, adım adım). Hiçbir adımı başlamamış. Bu iş büyük ölçüde kod değil, hesap ve ayar işi.

SORULAR:

1) Yeni giriş adresi ne olsun? Planda öneri auth.corteqs.net ama karar verilmemiş. Uygun mu, başka bir şey mi istersin?

2) Bu iş için Supabase'de ücretli bir ek özellik açmak gerekiyor (aylık ek ücret). Bunu açma kararı sende mi? Açılmadan iş ilerlemiyor.

3) Giriş ekranındaki logo ve "CorteQS" adı Google tarafındaki bir panelden ayarlanıyor. O panele erişimi olan kim — sen mi, ben mi?

4) Değişiklik sırasında kısa bir kesinti olabilir (dakikalar), bu sırada girişler etkilenebilir. Gece yapalım mı, fark etmez mi?

5) Giriş ekranında logo dışında ne görünsün? Sadece "CorteQS" mi, yoksa "CorteQS — Global Türk Diaspora Network" gibi bir açıklama da olsun mu?

6) Bu iş bittikten sonra mevcut üyelerin yeniden giriş yapması gerekebilir. Kabul edilebilir mi, yoksa bunu önlemek öncelikli mi?$q$
    );
  end if;
end
$mig$;

-- Doğrulama: madde altında en az bir yorum var ve 5-10 arası numaralı soru taşıyor.
do $check$
declare
  v_soru integer;
  v_body text;
begin
  select c.body into v_body
  from public.command_center_hot_fixes h
  join public.command_center_hot_fix_comments c on c.hot_fix_id = h.id and c.deleted_at is null
  where h.title = 'GOOGLE AUTH ID' and h.deleted_at is null
  order by c.created_at desc
  limit 1;

  if v_body is null then
    raise exception 'GOOGLE AUTH ID hala yorumsuz';
  end if;

  select count(*) into v_soru from regexp_matches(v_body, '(^|\n)\s*\d+\)', 'g');

  if v_soru < 5 or v_soru > 10 then
    raise exception 'SORU SAYISI ARALIK DISI: % soru var (5-10 olmali)', v_soru;
  end if;
end
$check$;
