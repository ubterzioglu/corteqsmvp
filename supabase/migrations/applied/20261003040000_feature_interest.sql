-- M10 · Topluluk Motoru Faz 5: feature_interest + kilitli ücretli yüzey ilgisi
--
-- ═══ KAPSAM (plan Faz 5 + "Ödeme kapsam dışı" kararı) ═══
-- Ücretli yüzeyler (öne çıkarma · bilet/aidat · profesyonel yanıt kutusu)
-- KİLİTLİ durum + ilgi kaydı gösterir; Stripe ayrı plan. `feature_interest`
-- kilitli bir yüzeye tıklayanın ilgisini biriktirir — ücretli tarafın NE ZAMAN
-- yapılacağına bu tablo karar verecek (plan cümlesi).
--
-- ═══ KARARLAR ═══
--   • ⚠️ `interest_registrations` ile KARIŞTIRMA: o tablo lansman/pazarlama
--     LEAD formudur (email/telefon/mesaj, 1 satır, ölçüldü). `feature_interest`
--     özellik-düzeyi sayaçtır: (feature_key, user_id) TEKİL — aynı ilgi iki
--     kez sayılmaz (upsert), kanıt satırı SİLİNMEZ (delete/update politikası
--     YOK; kullanıcı yalnız kendi satırını okur).
--   • Anahtar BEYAZ LİSTEDEN: `event.featured` ("Öne çıkar") · `event.ticketing`
--     ("Bilet sat"). ⚠️ ajan ihtiyatı: adlar planın Türkçe yüzey adlarından
--     türetildi (key söz dağarcığı pakette sayılmamış). M20 `pro.inbox`'ı
--     eklerken listeyi GENİŞLETİR (migration + ayna testi).
--   • Yazma RPC'den (`register_feature_interest`) — doğrudan insert politikası
--     bilinçli KONMADI: beyaz liste ancak RPC'de zorlanabilir, çöp anahtar
--     birikmez.
--
-- ═══ SALT EKLEME ═══
-- Yeni tablo + yeni RPC; mevcut hiçbir şeye dokunmaz.

begin;

create table if not exists public.feature_interest (
  id uuid primary key default gen_random_uuid(),
  feature_key text not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (feature_key, user_id)
);

comment on table public.feature_interest is
  'Kilitli ücretli yüzeylere ilgi kaydı (M10, plan: "ücretli tarafın ne zaman '
  'yapılacağına bu tablo karar verecek"). (feature_key,user_id) tekil; satır '
  'SİLİNMEZ (kanıt). interest_registrations (lead formu) ile KARIŞTIRMA.';

create index if not exists feature_interest_key_idx on public.feature_interest (feature_key);

alter table public.feature_interest enable row level security;
revoke all on table public.feature_interest from anon;

-- Kullanıcı kendi satırını OKUR ("ilgin kaydedildi" durumu) — yazma YALNIZ
-- RPC'den (beyaz liste orada); insert/update/delete politikası YOK.
drop policy if exists feature_interest_select_own on public.feature_interest;
create policy feature_interest_select_own on public.feature_interest
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

create or replace function public.register_feature_interest(p_feature_key text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_existing boolean;
begin
  if v_uid is null then
    raise exception 'feature_interest_auth_required';
  end if;

  -- Beyaz liste: çöp/uydurma anahtar birikmez. Liste ürün söz dağarcığıdır;
  -- genişletme migration + ayna testiyle (M20: pro.inbox).
  if p_feature_key is null or p_feature_key not in ('event.featured', 'event.ticketing') then
    raise exception 'feature_interest_unknown_key';
  end if;

  select true into v_existing
  from public.feature_interest
  where feature_key = p_feature_key and user_id = v_uid;

  if v_existing then
    return jsonb_build_object('feature_key', p_feature_key, 'registered', true, 'already', true);
  end if;

  insert into public.feature_interest (feature_key, user_id)
  values (p_feature_key, v_uid);

  return jsonb_build_object('feature_key', p_feature_key, 'registered', true, 'already', false);
end;
$$;

comment on function public.register_feature_interest(text) is
  'Kilitli ücretli yüzey ilgisi kaydeder (M10): beyaz liste event.featured + '
  'event.ticketing (M20 pro.inbox''u ekler). Idempotent — aynı ilgi ikinci kez '
  'sayılmaz, already:true döner.';

revoke all on function public.register_feature_interest(text) from public, anon;
grant execute on function public.register_feature_interest(text) to authenticated;

commit;
