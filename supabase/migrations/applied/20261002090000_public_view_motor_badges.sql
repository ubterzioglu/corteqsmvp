-- G19 · Dijital Gruplar: dizin view'ı motor kolonları + rozet/etiket zemini
--
-- ═══ KAPSAM ═══
-- Politika §6 etiketleri ("Sahibi doğruladı" · "Üye önerisi" · "Yeni: ilk 72
-- saat" · "Onaylı Grup: skor ≥70") ve §7 "skor sıralamayı belirler" kuralı
-- istemcinin view'dan okuyacağı kolonları istiyor. G03a view'ı PII masking'i
-- AYnen KORUNUR; sona motor kolonları EKLENİR ve filtre motor durumunu da
-- kapsayacak şekilde genişletilir.
--
-- ═══ KARARLAR ═══
--   • FİLTRE DEĞİŞİKLİĞİ (bilinçli, canlı davranış etkisi bugün SIFIR):
--     `status='approved'` TEK BAŞINA artık yetmez — G12 `set_group_status_v1`
--     legacy `status`'ü DEĞİŞTİRMİYOR; moderatör bir grubu `hidden/suspended/
--     removed` yaptığında eski filtre grubu dizinde GÖSTERMEYE DEVAM EDERDİ
--     (moderasyon kararı canlıya yansımazdı — sessiz kusur). Yeni filtre:
--     `status='approved' AND listing_status IN ('published','pending_review')`.
--     'pending_review' dalı eski paketin onay yolunu korur (canlı moderasyon
--     ekranı `status='approved'` yazıyor, `listing_status`'e dokunmuyor —
--     iki sistem G10c'ye dek paralel). Ölçüldü: 10/10 satır bugün 'published'
--     → dizin içeriği DEĞİŞMEZ.
--   • "Yeni" etiketi SUNUCUDA hesaplanır (`is_new`): eşik `group_settings`'ten
--     (G09 doktrini — istemcide 72 sabiti YOK). `group_listing_is_new`
--     SECURITY DEFINER → `group_setting_int` anon'a AÇILMAZ (G09 grant
--     matrisi değişmez; kara liste json'ı da kapalı kalır).
--   • published_at motor yolunda G12 dolduruyor; eski paket onayında null
--     kalır → `coalesce(published_at, created_at)` (politika §6 "ilk 72 saat"
--     her iki yolda da çalışır).
--   • `owner_user_id`, `submitted_by`, `invite_code`, `review_flags`,
--     `strike_count` view'a KONMAZ (PII/iç moderasyon verisi — dizinin ihtiyacı
--     yok; "Sahibi doğruladı" rozeti için `ownership` değeri yeter).
--   • DROP VIEW: `create or replace` kolon EKLEYEMEZ; bağımlı 0 (pg_depend
--     ölçüldü) ve recreate aynı transaction içinde — dışarıdan bakınca atomik.
--
-- ═══ SALT EKLEME (kolon/tablo düzeyinde) ═══
-- Hiçbir kolon/tablo DÜŞÜRÜLMEZ; masking aynen korunur (4 kolon null döner).
-- View yeniden yaratılır (yukarıda gerekçesi).

begin;

-- ── 1) Eşik: "Yeni" etiketi ilk 72 saat (politika §6) ───────────────────────

insert into public.group_settings (key, value)
values
  ('groups.new_badge_hours', '72'::jsonb)
on conflict (key) do nothing;

-- ── 2) is_new yardımcısı (eşik ayarlardan; SECURITY DEFINER → anon'dan
--       group_setting_int istemez) ───────────────────────────────────────────

create or replace function public.group_listing_is_new(p_published_at timestamptz, p_created_at timestamptz)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(p_published_at, p_created_at) is not null
     and coalesce(p_published_at, p_created_at)
         > now() - make_interval(hours => public.group_setting_int('groups.new_badge_hours', 72));
$$;

comment on function public.group_listing_is_new(timestamptz, timestamptz) is
  'Dizin "Yeni" etiketi (politika §6: ilk 72 saat). Eşik groups.new_badge_hours '
  '(G09 doktrini). coalesce(published_at, created_at): motor yayını published_at '
  'doldurur (G12); eski paket onayında created_at''a düşer.';

revoke all on function public.group_listing_is_new(timestamptz, timestamptz) from public;
grant execute on function public.group_listing_is_new(timestamptz, timestamptz) to anon, authenticated;

-- ── 3) View v2: G03a masking AYNI + motor kolonları sonda ────────────────────

drop view if exists public.whatsapp_landings_public;

create view public.whatsapp_landings_public
with (security_invoker = false, security_barrier = true)
as
select
  l.id,
  null::uuid   as user_id,         -- G03: gönderenin kimliği anonime dönmez
  l.slug,
  l.group_name,
  l.category,
  l.country,
  l.city,
  l.mode,
  l.hero_image,
  l.tagline,
  l.call_to_action_text,
  l.conditions,
  null::text   as whatsapp_link,   -- G03: DAVET LİNKİ — yalnız RPC ile, girişli kullanıcıya
  l.admin_name,
  null::text   as admin_contact,   -- G03: ad + e-posta + telefon taşıyor, asla public değil
  l.description,
  l.status,
  null::text   as rejection_reason, -- yalnız sahibini/yöneticiyi ilgilendirir
  l.created_at,
  l.updated_at,
  l.member_approved,
  l.admin_approved,
  l.member_count,
  l.member_count_updated_at,
  l.group_score,
  l.language,
  l.origin,
  -- G19 motor kolonları (politika §6/§7): rozetler + sıralama + "Yeni".
  l.platform,
  l.short_description,
  l.listing_status,
  l.ownership,
  l.published_at,
  l.has_approved_badge,
  public.group_listing_is_new(l.published_at, l.created_at) as is_new
from public.whatsapp_landings l
where l.status = 'approved'
  and l.listing_status in ('published', 'pending_review');

comment on view public.whatsapp_landings_public is
  'G03a+G19 · Dijital Gruplar dizininin PII''siz okuma yüzeyi. whatsapp_link, '
  'admin_contact, user_id ve rejection_reason bilerek NULL döner. ÇİFT filtre: '
  'legacy status=''approved'' (eski paket onay yolu) AND listing_status motor '
  'durumu (published/pending_review) — hidden/suspended/removed/rejected dizine '
  'SIZMAZ. security_invoker=false: filtre view''ın İÇİNDE olmak zorunda, kaldırma.';

grant select on public.whatsapp_landings_public to anon, authenticated;

-- ── 4) Doğrulama: masking + filtre + is_new ─────────────────────────────────

do $$
declare
  v_leaky int;
  v_hidden_leak int;
begin
  select count(*) into v_leaky
  from public.whatsapp_landings_public
  where whatsapp_link is not null
     or admin_contact is not null
     or user_id is not null
     or rejection_reason is not null;

  if v_leaky <> 0 then
    raise exception 'G19: view hala PII donduruyor (% satir)', v_leaky;
  end if;

  select count(*) into v_hidden_leak
  from public.whatsapp_landings_public v
  where v.listing_status not in ('published', 'pending_review');

  if v_hidden_leak <> 0 then
    raise exception 'G19: view motor durumu sizdiriyor (% satir)', v_hidden_leak;
  end if;
end $$;

commit;
