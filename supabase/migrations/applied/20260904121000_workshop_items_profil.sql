-- Profil Workshop panosu — /admin/workshop/profil ilk oturumu (WS1).
-- Kaynak: 3 Eylül 2026 "Profiller" toplantısı (Komuta Merkezi'nde T19 olarak da duruyor,
-- mig 20260904120000_seed_command_center_meeting_t19.sql).
--
-- Neden ikinci bir kayıt: Komuta Merkezi toplantının TAMAMINI (operasyon, WordPress,
-- Excel vb. dahil) tutar; Profil Workshop panosu yalnız PROFİL ile ilgili maddelerin
-- kopyasını, Cadde workshop'uyla aynı formatta (madde + UBT/Burak onay kutusu) tutar.
-- İki panonun amacı farklı olduğu için kopya bilinçlidir.
--
-- item_no yalnız (workshop_key, item_no) çiftinde tekil olduğu için 'profil'
-- workshop'u 1'den başlar; Cadde'nin 136 maddesiyle çakışmaz.

insert into public.workshop_items (workshop_key, session_key, section, item_no, title) values
  -- ── Profil Formu ve Alanlar ────────────────────────────────────────────────
  ('profil', 'WS1', 'Profil Formu ve Alanlar', 1, 'Telefon numarası profil formunda en üste, ilk kutuya alınacak.'),
  ('profil', 'WS1', 'Profil Formu ve Alanlar', 2, 'Profil tipi kullanıcıya net görünecek biçimde yeniden düzenlenecek.'),
  ('profil', 'WS1', 'Profil Formu ve Alanlar', 3, 'Rozetlerin yanına, üzerine gelince açıklama veren bilgi (i) ikonu eklenecek.'),
  ('profil', 'WS1', 'Profil Formu ve Alanlar', 4, 'Kayıt formundaki "Bizi nereden buldunuz?" alanı tamamen kaldırılacak.'),
  ('profil', 'WS1', 'Profil Formu ve Alanlar', 5, 'Bireysel ilgi alanları diğer kullanıcılara görünür (public) olacak.'),
  ('profil', 'WS1', 'Profil Formu ve Alanlar', 6, 'LinkedIn hesabı alanı opsiyonel kalacak ancak kullanıcıya şiddetle tavsiye edilecek.'),

  -- ── Doğrulama ve Giriş ─────────────────────────────────────────────────────
  ('profil', 'WS1', 'Doğrulama ve Giriş', 7, 'Supabase üzerinden giriş yapanlar için e-posta doğrulaması (confirmation) aktif edilecek.'),
  ('profil', 'WS1', 'Doğrulama ve Giriş', 8, 'Telefon doğrulaması (phone verification) profil akışına entegre edilecek.'),
  ('profil', 'WS1', 'Doğrulama ve Giriş', 9, 'Kullanıcının hangi ülkeden / diasporadan geldiği ülke seçimi ile tespit edilecek.'),
  ('profil', 'WS1', 'Doğrulama ve Giriş', 10, 'Ülke bilgisi telefon alan kodundan TÜRETİLMEYECEK; +90 numaralı üye Berlin''de yaşıyor olabilir.'),
  ('profil', 'WS1', 'Doğrulama ve Giriş', 11, 'Sisteme giren her kullanıcıdan e-posta ve telefon doğrulaması zorunlu olarak alınacak.'),
  ('profil', 'WS1', 'Doğrulama ve Giriş', 12, 'Eski üyeleri yeni Gmail girişine ve profillerini tamamlamaya yönlendiren e-posta akışı kurulacak.'),

  -- ── Rol ve Etiket Mimarisi ─────────────────────────────────────────────────
  ('profil', 'WS1', 'Rol ve Etiket Mimarisi', 13, 'Kullanıcı platformda TEK bir ana profil ile gezecek; hesaplar arası geçiş (toggle) olmayacak.'),
  ('profil', 'WS1', 'Rol ve Etiket Mimarisi', 14, 'Rol bazlı profil etiketleme sistemi kurgulanacak: tek profil, aynı anda birden fazla unvan.'),
  ('profil', 'WS1', 'Rol ve Etiket Mimarisi', 15, 'Rol başvurusu onaylanan kullanıcıya ek etiket eklenecek ve işlemler bu etiketlerle yürütülecek.'),
  ('profil', 'WS1', 'Rol ve Etiket Mimarisi', 16, 'Kurum, dernek, hastane gibi tüzel kişilikler şahıs ismi olmadan doğrudan kurum olarak yer alacak.'),

  -- ── Referans Sistemi ───────────────────────────────────────────────────────
  ('profil', 'WS1', 'Referans Sistemi', 17, 'Referans kodu alanı ilk giriş ekranından kaldırılıp giriş sonrası (post-login) forma taşınacak.'),
  ('profil', 'WS1', 'Referans Sistemi', 18, 'Referans eşleştirmeleri üye içeri alındıktan sonra platform içinde yapılacak.'),
  ('profil', 'WS1', 'Referans Sistemi', 19, 'Referans sistemi kural kitapçığı yazılacak: kontribütör getirisi %15, emlakçı getirene indirim veya kredi vb.'),

  -- ── Paketleme ve Yetkiler ──────────────────────────────────────────────────
  ('profil', 'WS1', 'Paketleme ve Yetkiler', 20, 'Grup ve WhatsApp yayınlama gibi ekstra özellik taleplerinin kapsamı gözden geçirilecek.'),
  ('profil', 'WS1', 'Paketleme ve Yetkiler', 21, 'Özellikler "Default" ve "Talep Edilebilir" olmak üzere iki ayrı pakete (sepete) ayrılacak.'),
  ('profil', 'WS1', 'Paketleme ve Yetkiler', 22, 'Paketler ödeme (checkout) adımına bağlanacak.'),
  ('profil', 'WS1', 'Paketleme ve Yetkiler', 23, 'Etkinlik oluşturma, WhatsApp numarası gösterme, teklif verme yetkileri tekil fiyat yerine abonelik paketiyle sunulacak.'),

  -- ── Operasyon ──────────────────────────────────────────────────────────────
  ('profil', 'WS1', 'Operasyon', 24, 'Google Auth ve admin paneli yetkilendirme rehberi hazırlanıp Burak''a iletilecek.'),
  ('profil', 'WS1', 'Operasyon', 25, 'Toplantı notları "Profil Workshop Notları" formatında Burak''a gönderilecek.'),
  ('profil', 'WS1', 'Operasyon', 26, 'Burak''ın yanlışlıkla silinen admin yetkisi geri verilecek ve panelde test ettirilecek.')
on conflict (workshop_key, item_no) do nothing;

-- Seed sayısını doğrula — `on conflict do nothing` eksik satırı sessizce yutmasın
-- (WS2 seed'inde yaşanan tuzak; bu bloğu kaldırma).
do $$
declare
  seeded integer;
begin
  select count(*) into seeded
  from public.workshop_items
  where workshop_key = 'profil' and session_key = 'WS1';

  if seeded <> 26 then
    raise exception 'Profil workshop WS1 seed 26 madde olmalıydı, % bulundu.', seeded;
  end if;
end
$$;

comment on table public.workshop_items is
  'Workshop madde panosu: workshop_key bazlı maddeler + UBT/Burak onay kutuları (ortak, admin-only). Aktif workshoplar: cadde (30.07.2026 + 04.08.2026), profil (03.09.2026).';
