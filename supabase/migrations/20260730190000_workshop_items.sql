-- Admin "Workshop" bölümü — workshop bazlı madde panosu (DB-bağlı).
-- /admin/workshop/cadde sayfasının veri kaynağı.
--
-- Format kararı 30.07.2026 Cadde workshop'unda alındı (caddeworkshdp.md 1:26:00):
--   "workshop bazında, cadde workshop, altında maddeler, başka hiçbir şey yok,
--    hiç yorum falan yok. İki tane checkbox olacak, UBT ve Burak. UBT okeyledi,
--    Burak okeyledi demek ki bitmiştir."
-- Bu yüzden tabloda yorum/thread YOK; madde başına iki bağımsız onay kutusu var.
--
-- Görünürlük: tüm adminler ortak okur/yazar. RLS gate = public.is_admin(auth.uid()).
-- Desen kaynağı: 20260628100000_revision_requests.sql (RLS + updated_at + soft-delete).

-- 1) Tablo -------------------------------------------------------------------
create table if not exists public.workshop_items (
  id            uuid primary key default gen_random_uuid(),
  -- Workshop kimliği: 'cadde', ileride 'profil' vb. Yeni workshop = yeni key.
  workshop_key  text not null check (length(trim(workshop_key)) > 0),
  -- Maddelerin gruplandığı başlık (ör. "Paylaşım Kutusu"). Boş bırakılabilir.
  section       text not null default '',
  -- Workshop içindeki görünür madde sırası; (workshop_key, item_no) tekil.
  item_no       integer not null check (item_no > 0),
  title         text not null check (length(trim(title)) > 0),
  ubt_done      boolean not null default false,
  burak_done    boolean not null default false,
  ubt_done_at   timestamptz,
  burak_done_at timestamptz,
  created_by    uuid references auth.users (id) on delete set null,
  deleted_at    timestamptz,                              -- soft-delete
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint workshop_items_key_no_unique unique (workshop_key, item_no)
);

create index if not exists workshop_items_workshop_idx
  on public.workshop_items (workshop_key, item_no);
create index if not exists workshop_items_deleted_at_idx
  on public.workshop_items (deleted_at);

-- 2) updated_at trigger ------------------------------------------------------
create or replace function public.set_workshop_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_workshop_items_updated_at on public.workshop_items;
create trigger set_workshop_items_updated_at
before update on public.workshop_items
for each row
execute function public.set_workshop_items_updated_at();

-- 3) RLS — yalnız admin okur/yazar ------------------------------------------
alter table public.workshop_items enable row level security;

drop policy if exists workshop_items_admin_select on public.workshop_items;
create policy workshop_items_admin_select on public.workshop_items
  for select using (public.is_admin(auth.uid()));

drop policy if exists workshop_items_admin_insert on public.workshop_items;
create policy workshop_items_admin_insert on public.workshop_items
  for insert with check (public.is_admin(auth.uid()));

drop policy if exists workshop_items_admin_update on public.workshop_items;
create policy workshop_items_admin_update on public.workshop_items
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

comment on table public.workshop_items is
  'Workshop madde panosu: workshop_key bazlı maddeler + UBT/Burak onay kutuları (ortak, admin-only).';

-- 4) Cadde Workshop (30.07.2026) maddeleri — idempotent seed ----------------
-- Kaynak: caddeworkshdp.md (Zoom transkripti, 92 dk). Sıra transkriptteki
-- yukarıdan aşağı ekran gezintisini izler.
insert into public.workshop_items (workshop_key, section, item_no, title) values
  ('cadde', 'Üst Alan', 1, 'Dünya saatleri klasik yuvarlak analog saat görünümüne çevrilecek (otel resepsiyonu / havaalanı tarzı, altında şehir adı); mevcut güneş ikonu kalkacak.'),
  ('cadde', 'Üst Alan', 2, 'Aktif Kafeler bölümündeki bozuk layout düzeltilecek (davetli / incele / katıl kartları dağılmış).'),
  ('cadde', 'Üst Alan', 3, 'Corteqs''e özel bir kafe ikonu tasarlanacak; kafe kartları sadece o küçük ikondan tanınabilecek (CC veya alternatif öneri).'),
  ('cadde', 'Üst Alan', 4, 'Kafe kartı tipografisi hizalanacak: kafe adı bold, oda adı normal karakter, yan yana düzen.'),

  ('cadde', 'Paylaşım Kutusu', 5, '"Detaylar" bölümü (paylaşım / soru / ilan / teklif / etkinlik tipleri) kaldırılacak — ilk sürüm WhatsApp gibi sade olacak.'),
  ('cadde', 'Paylaşım Kutusu', 6, 'Etkinlik butonu paylaşım kutusundan silinecek; şimdilik gereksiz karmaşa yaratıyor.'),
  ('cadde', 'Paylaşım Kutusu', 7, 'Fotoğraf ve video yükleme kalacak; ikisi de uçtan uca test edilecek (şu anda doğrulanmadı).'),
  ('cadde', 'Paylaşım Kutusu', 8, '"Konum" butonu "Konum ekle" olacak; default değer kullanıcının kayıtlı konumu olacak.'),
  ('cadde', 'Paylaşım Kutusu', 9, 'Konum ekle tıklandığında drill-down açılacak: bir ülke veya bir şehir daha eklenebilecek.'),
  ('cadde', 'Paylaşım Kutusu', 10, 'Birden fazla ülke/şehir ekleme premium özelliğe bırakılacak (şimdilik kapalı).'),
  ('cadde', 'Paylaşım Kutusu', 11, 'Kullanıcıya serbest "Global ekle" verilmeyecek; globale çıkış performans eşiğine bağlı kalacak (10 beğeni / 10 paylaşım).'),
  ('cadde', 'Paylaşım Kutusu', 12, 'Alt fonksiyonlara "Paylaş" (share) eklenecek — şu anda hiç yok.'),
  ('cadde', 'Paylaşım Kutusu', 13, 'Konu/etiket (tag) verme şimdilik veto; sade sürüm oturduktan sonra tekrar değerlendirilecek.'),

  ('cadde', 'Akış', 14, 'Filtreler (tümü / şehrim / ülkem / etkinlikler / kafelerim / yakınımda) korunacak; ne işe yaradığını anlatan kısa açıklama eklenecek.'),
  ('cadde', 'Akış', 15, '"Takip ettiklerim yakında" ve "İş fırsatları yakında" blokları şimdilik iptal.'),
  ('cadde', 'Akış', 16, '"5 yeni paylaşım — yenile" bildirimi yenileme sonrası sıfırlanacak (şu anda basınca kaybolmuyor).'),
  ('cadde', 'Akış', 17, 'Post başlığındaki isim yanındaki tip etiketi ("soru") kaldırılacak.'),
  ('cadde', 'Akış', 18, 'Post başlık hiyerarşisi forum görünümüne çevrilecek: konu büyük, isim daha küçük, altında ülke / şehir / tarih.'),

  ('cadde', 'Tepkiler ve Yorumlar', 19, '"Tepki ver" yazısı kaldırılacak; tepki emojileri LinkedIn tarzı doğrudan açık duracak.'),
  ('cadde', 'Tepkiler ve Yorumlar', 20, 'Tepki setine "emin olamadım / düşünüyorum" (gözlüklü, çenesine el atmış) emojisi eklenecek; set beğendim / beğenmedim / gülme / kalp / destek üzerine kurulacak.'),
  ('cadde', 'Tepkiler ve Yorumlar', 21, 'Yorum sayısı gösterilecek (ör. "18 yorum"); tıklanınca açılacak, devamı "load more" ile gelecek — DB yükü korunacak.'),
  ('cadde', 'Tepkiler ve Yorumlar', 22, 'Yorum kutusunda Enter ile gönderme çalışacak (şu anda yalnız Gönder butonu çalışıyor).'),
  ('cadde', 'Tepkiler ve Yorumlar', 23, 'Yeni yorum ve paylaşımlar için auto-refresh ayarlanacak — karşı tarafın yorumu şu anda anında görünmüyor.'),
  ('cadde', 'Tepkiler ve Yorumlar', 24, 'Yorum layout''u sıkıştırılacak; yorumlar birbirine yakın ve ilişkili görünecek ("jilet" düzen).'),
  ('cadde', 'Tepkiler ve Yorumlar', 25, 'Emoji bankası (WhatsApp tarzı emoji seçici) yorum ve paylaşım yazarken açılacak.'),

  ('cadde', 'Tasarım ve Layout', 26, 'Büyük butonlar inceltilecek ("jilet gibi"), öğeler arası boşluklar azaltılacak — cadde genelinde.'),
  ('cadde', 'Tasarım ve Layout', 27, 'Renk paleti logodaki koyu renklerden beslenecek; kontrast yüksek olacak ("silik sosyal medya olmaz").'),
  ('cadde', 'Tasarım ve Layout', 28, 'Footer sadeleştirilip inceltilecek — yalnız cadde değil tüm sayfalarda.'),
  ('cadde', 'Tasarım ve Layout', 29, 'Cadde içinde tekrar eden ana menü (Cadde / İş / Sosyal / Harita / Giriş yap / Kayıt ol) kaldırılacak; üst menüde zaten var, mükerrer.'),
  ('cadde', 'Tasarım ve Layout', 30, 'Sol kolon yeniden düzenlenecek: konum seçimi + köprü + insanları keşfet tepede, altı yalnız akış, sağ kolon reklam; akordeon kart denenecek.'),
  ('cadde', 'Tasarım ve Layout', 31, '"Kafeler" bloğunun iki yerdeki tekrarı giderilecek (biri kaldırılacak).'),

  ('cadde', 'Erişim ve Köprü', 32, 'Cadde içeriği login olmadan görünmeyecek — sosyal medya standardı ve kayıt tutulabilmesi için (karar verildi).'),
  ('cadde', 'Erişim ve Köprü', 33, 'Kural: +90 numarasıyla kayıt olan kullanıcı caddede yalnız Köprü''ye girebilir.'),
  ('cadde', 'Erişim ve Köprü', 34, 'Kural: +90 dışı numarayla kayıt olup doğrulanan diaspora kullanıcısı tüm ülkeler + tüm şehirler + Köprü''yü görebilir.'),
  ('cadde', 'Erişim ve Köprü', 35, 'Köprü''ye hover info baloncuğu eklenecek: yurt dışına gitmek isteyenler, yurt dışıyla iş yapmak isteyenler, yurt dışından Türkiye ile iş yapmak isteyenler ve Türkiye''ye dönmek isteyenlerin buluşma köprüsü.'),
  ('cadde', 'Erişim ve Köprü', 36, 'Ülke/şehir filtresi hem kafeleri hem paylaşımları süzmeye devam edecek (davranış doğrulandı, korunacak).'),
  ('cadde', 'Erişim ve Köprü', 37, 'Ülke/şehir seçim bölümündeki layout bozukluğu düzeltilecek.'),
  ('cadde', 'Erişim ve Köprü', 38, '"İnsanları keşfet" tüm kayıtlı kullanıcıları arayabilecek (Türk / yabancı numara ayrımı olmadan).'),

  ('cadde', 'Çarşı', 39, 'Çarşı linki şimdilik gizlenecek / inaktif edilecek — çarşı konuşulmadan link verilmeyecek.'),
  ('cadde', 'Çarşı', 40, 'Çarşı yerine "Diaspora''nın ikinci el pazarı Çarşı yakında" bloğu konacak; birinci seksiyon güzelleştirilip oraya yerleştirilecek.'),

  ('cadde', 'Tanıtım ve Sağ Kolon', 41, '"Cortex Panosu / Bugün caddede öne çıkanlar" iptal; yerine feature edilmiş içerik gelecek.'),
  ('cadde', 'Tanıtım ve Sağ Kolon', 42, 'Featured etkinliğin manuel mi otomatik mi seçileceğine karar verilecek.'),
  ('cadde', 'Tanıtım ve Sağ Kolon', 43, 'Tanıtım alanına billboard mantığı placeholder konacak: reklam alınmadığında "reklamınızı buraya verebilirsiniz" mesajı potansiyel müşterilere görünecek.'),
  ('cadde', 'Tanıtım ve Sağ Kolon', 44, '"Şehrinden öne çıkanlar" kartları (danışman / işletme / etkinlik) feature edilmiş kayıtları gösterecek; tıklanınca ilgili profile gidecek (ör. Almanya 101).'),
  ('cadde', 'Tanıtım ve Sağ Kolon', 45, 'Reklam CTA''sı değişecek: "talep bırak / başvuru gönder" kalkacak, yerine "profilinden ilk tanıtımını yap" gelecek — kullanıcı kendi profilinden bütçe verip reklam çıkaracak (Facebook/Instagram modeli).'),
  ('cadde', 'Tanıtım ve Sağ Kolon', 46, 'Profil menüsünün altına "Caddeye reklam ver" linki eklenecek; bunun için profil tarafı hazırlanacak.'),

  ('cadde', 'Süreç', 47, 'Workshop panosu formatı: workshop bazında yalnız maddeler, yorum yok; her maddede UBT ve Burak onay kutusu — ikisi de işaretliyse madde bitmiş sayılır.'),
  ('cadde', 'Süreç', 48, 'Sonraki workshop "Profil Workshop" olacak; kapsam: ilişkiler, mesajlaşma, profil görme, akışlar.')
on conflict (workshop_key, item_no) do nothing;
