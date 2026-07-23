-- Admin "Brainstorming" — statusreport3006'nın DB-destekli admin sürümü.
-- Eski public /statusreport3006 sayfasının statik içeriği (status-report-3006-data.ts,
-- 12 bölüm/~35 satır) buraya taşınır; tüm adminler panelden bölüm/satır ekleyip
-- düzenleyip silebilir. section_key'ler statusreport_comments ile eşleşmesi için
-- birebir korunur (mig 20260701100000 — ayrı migration'da admin-only'e daraltılıyor).
--
-- Görünürlük: tüm adminler ortak okur/yazar. RLS gate = public.is_admin(auth.uid()).
-- Desen kaynağı: 20260628100000_revision_requests.sql (RLS/trigger/soft-delete yok,
-- bölüm/satır serbest kalem, cascade delete yeterli — moderasyon/soft-delete kapsam dışı).

-- 1) Bölümler ------------------------------------------------------------------
create table if not exists public.brainstorming_sections (
  id           uuid primary key default gen_random_uuid(),
  section_key  text unique not null,
  group_label  text,
  title        text not null,
  intro        text,
  order_index  integer not null default 0,
  created_by   uuid references auth.users (id) on delete set null,
  updated_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists brainstorming_sections_order_idx
  on public.brainstorming_sections (order_index);

-- 2) Satırlar --------------------------------------------------------------------
create table if not exists public.brainstorming_rows (
  id           uuid primary key default gen_random_uuid(),
  section_id   uuid not null references public.brainstorming_sections (id) on delete cascade,
  label        text not null,
  technical    text not null,
  plain        text not null,
  status       text check (status in ('ok', 'partial', 'open')),
  order_index  integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists brainstorming_rows_section_order_idx
  on public.brainstorming_rows (section_id, order_index);

-- 3) updated_at trigger'ları ------------------------------------------------------
create or replace function public.set_brainstorming_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_brainstorming_sections_updated_at on public.brainstorming_sections;
create trigger set_brainstorming_sections_updated_at
before update on public.brainstorming_sections
for each row
execute function public.set_brainstorming_updated_at();

drop trigger if exists set_brainstorming_rows_updated_at on public.brainstorming_rows;
create trigger set_brainstorming_rows_updated_at
before update on public.brainstorming_rows
for each row
execute function public.set_brainstorming_updated_at();

-- 4) RLS — yalnız admin okur/yazar; tüm adminler ortak görür/düzenler --------------
alter table public.brainstorming_sections enable row level security;
alter table public.brainstorming_rows     enable row level security;

drop policy if exists brainstorming_sections_admin_select on public.brainstorming_sections;
create policy brainstorming_sections_admin_select on public.brainstorming_sections
  for select using (public.is_admin(auth.uid()));

drop policy if exists brainstorming_sections_admin_insert on public.brainstorming_sections;
create policy brainstorming_sections_admin_insert on public.brainstorming_sections
  for insert with check (public.is_admin(auth.uid()));

drop policy if exists brainstorming_sections_admin_update on public.brainstorming_sections;
create policy brainstorming_sections_admin_update on public.brainstorming_sections
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists brainstorming_sections_admin_delete on public.brainstorming_sections;
create policy brainstorming_sections_admin_delete on public.brainstorming_sections
  for delete using (public.is_admin(auth.uid()));

drop policy if exists brainstorming_rows_admin_select on public.brainstorming_rows;
create policy brainstorming_rows_admin_select on public.brainstorming_rows
  for select using (public.is_admin(auth.uid()));

drop policy if exists brainstorming_rows_admin_insert on public.brainstorming_rows;
create policy brainstorming_rows_admin_insert on public.brainstorming_rows
  for insert with check (public.is_admin(auth.uid()));

drop policy if exists brainstorming_rows_admin_update on public.brainstorming_rows;
create policy brainstorming_rows_admin_update on public.brainstorming_rows
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists brainstorming_rows_admin_delete on public.brainstorming_rows;
create policy brainstorming_rows_admin_delete on public.brainstorming_rows
  for delete using (public.is_admin(auth.uid()));

comment on table public.brainstorming_sections is
  'Admin Brainstorming bölümleri: statusreport3006 içeriğinin DB sürümü (ortak, admin-only).';
comment on table public.brainstorming_rows is
  'Admin Brainstorming satırları: bölüm başına teknik/sade açıklama + durum (ortak, admin-only).';

-- 5) Seed — mevcut status-report-3006-data.ts içeriği (12 bölüm, 35 satır) ---------
-- section_key'ler eski statik dosyayla birebir aynı.

insert into public.brainstorming_sections (section_key, group_label, title, intro, order_index) values
('ozet', 'Genel', '0. Yönetici Özeti',
 'İki cümlede: Cadde 3.0''ın ALTYAPISI (arka plan) çekirdek olarak bitti ve canlıda. Ama kullanıcının gördüğü premium panelin 11 sekmesinden sadece 3''ü gerçekten çalışıyor; 8''i ''yakında'' yazan boş ekran — ancak çoğunun arka planı zaten hazır, sadece bağlanması gerekiyor.',
 0),
('a1-backend', 'Bölüm 1 — Cadde 3.0', '1A. Cadde''nin arka plan (backend) eksikleri',
 'Cadde''nin görünmeyen tarafında söz verilip henüz bitmeyen veya bilinçli ertelenen işler.',
 1),
('a2-frontend', 'Bölüm 1 — Cadde 3.0', '1B. Cadde''nin görünen yüz (frontend) eksikleri',
 'Kullanıcının gözüyle gördüğü tarafta eksik kalan yüzeyler.',
 2),
('a3-test', 'Bölüm 1 — Cadde 3.0', '1C. Test ve kalite eksikleri',
 null,
 3),
('ref', 'Bölüm 1 — Cadde 3.0', '1D. Eski ''corteqs_plus'' projesinden alınabilecekler',
 'Lovable''da yapılan önceki nesil projede güzel fikirler var. Kodu birebir kopyalayamayız (eski tablolara yazıyor, bizde kapalı), ama FİKİR/ARAYÜZ olarak alınabilir.',
 4),
('panel-sekmeler', 'Bölüm 2 — Premium Panel', '2A. 11 sekmenin durumu',
 'Premium kullanıcının (ör. experimental2@corteqs.net) profilinde gördüğü panel. Bir ''maketi'' gerçeğe çevirmek genelde sadece ''var olan veriyi ekrana bağlamak'' demek — sıfırdan yazmak değil.',
 5),
('panel-borc', 'Bölüm 2 — Premium Panel', '2B. ⚠️ ''Çalışıyor'' görünen ama aslında demo olan parçalar',
 'Bunları ''bitti'' sanmayalım — ekranda çalışıyor görünür, arkada gerçek işlem yoktur.',
 6),
('sosyal-medya-otomasyon', 'Bölüm 3 — Sosyal Medya', '3. LinkedIn Görsel Üretim Sistemi (16 Temmuz eklendi)',
 'BURAK BURAYA BAK sekmesindeki 12 test aracı için Canva''da tek tek uğraşmadan, tek komutla 36 LinkedIn görseli üreten otomatik sistem kuruldu.',
 7),
('revizyon-gorsel-ekleri', 'Bölüm 4 — Diğer Temmuz İşleri', '4A. Revizyon istekleri — görsel ekleri (14 Temmuz)',
 'Revizyon talebi/yorum akışına görsel ekleme yeteneği eklendi; canlıda ve testli.',
 8),
('bireysel-premium-sunum', 'Bölüm 4 — Diğer Temmuz İşleri', '4B. Bireysel profil — tek tip premium sunum (14-15 Temmuz)',
 'Experimental_2/3 pilotunda denenen premium hero/kart tasarımı tüm ''Bireysel'' kategorisindeki rollere yayıldı.',
 9),
('burak-share-sekme', 'Bölüm 4 — Diğer Temmuz İşleri', '4C. BURAK BURAYA BAK — 4. sekme (8 Temmuz)',
 '/admin/social-share-vault sayfasına Burak için özel bir paylaşım sekmesi eklendi.',
 10),
('uye-geri-bildirim', 'Bölüm 4 — Diğer Temmuz İşleri', '4D. Üye geri bildirim sistemi (7 Temmuz)',
 'Üyelerin site hakkında geri bildirim bırakabileceği uçtan uca bir sistem eklendi.',
 11),
('header-admin-iyilestirmeler', 'Bölüm 4 — Diğer Temmuz İşleri', '4E. Header, Araçlar menüsü ve admin panel iyileştirmeleri (14 Temmuz)',
 'Aynı gün içinde yapılan bir dizi küçük ama kullanıcının doğrudan gördüğü iyileştirme.',
 12),
('relocation-tools-temmuz', 'Bölüm 4 — Diğer Temmuz İşleri', '4F. Taşınma araçları — küçük düzeltmeler (1-7 Temmuz)',
 null,
 13),
('kararlar', 'Ortak', '4. Karar bekleyen başlıklar (ortakla konuşulacak)',
 'Aşağıdakiler teknik değil, ÜRÜN kararı. Bunlara karar verilmeden bazı işler başlayamaz.',
 14)
on conflict (section_key) do nothing;

-- Satırlar (section_id, section_key üzerinden alt-sorguyla çözülür)
insert into public.brainstorming_rows (section_id, label, technical, plain, status, order_index)
select s.id, r.label, r.technical, r.plain, r.status, r.order_index
from (values
  ('ozet', 'Cadde altyapısı',
   'RPC-only yazma mimarisi (~37 security-definer RPC), CKS feed sıralaması, moderasyon kuyruğu, bildirim, tanıtım/kampanya backend''i, çoklu diaspora — hepsi canlıda ve testli.',
   'Cadde''nin görünmeyen motoru hazır ve sağlam: paylaşımlar güvenli kaydediliyor, akış sıralanıyor, uygunsuz içerik için moderasyon var, bildirim ve reklam altyapısı çalışıyor.',
   'ok', 0),
  ('ozet', 'Premium panel',
   '11 sekmenin 3''ü işlevsel (Profil Ayarları, Mesaj Kutusu, Hizmet Talepleri); 8''i placeholder. Çoğunun backend''i mevcut, sekmeye bağlanması gerekiyor.',
   'Kullanıcının profilinde gördüğü panelde 11 sekme var; sadece 3''ü iş görüyor, 8''i şimdilik boş ''yakında'' ekranı. İyi haber: çoğunun verisi zaten hazır, sadece ekrana bağlanacak.',
   'partial', 1),
  ('ozet', 'Gerçekten sıfırdan iş',
   'Kalıcı Takip ve Kupon sistemleri sıfırdan backend ister. Ayrıca ''çalışıyor görünen'' demo''lar var (Stripe ödemesi, kupon, takip localStorage''da).',
   'Tümüyle yeni yapılması gerekenler az: kalıcı ''takip'' ve ''kupon'' sistemleri. Bir de çalışıyor gibi görünen ama aslında demo olan parçalar var — bunları gerçek sanmayalım.',
   'open', 2),

  ('a1-backend', 'Tip dosyası yenileme (B1)',
   'supabase types.ts güncel değil; cadde-internal.ts''te izole bir ''db as any'' cast var. Yenilemek için geçerli SUPABASE_ACCESS_TOKEN gerekiyor.',
   'Kod ile veritabanı arasındaki ''sözlük'' güncel değil; geliştirme sırasında küçük bir kestirme kullanılıyor. Bir komutla düzeltilir, kullanıcıyı etkilemez.',
   'open', 0),
  ('a1-backend', 'Telefon doğrulama / SMS (D-03)',
   'user_verifications altyapısı kurulu ama OTP Edge Function yok ve zorunluluk kapalı. SMS sağlayıcı (Twilio/Vonage vb.) seçimi bekliyor.',
   'Telefonla SMS doğrulama için zemin hazır ama açık değil; hangi SMS firması kullanılacak (ve maliyeti) kararı bekliyor. Karar verilince açılır.',
   'partial', 1),
  ('a1-backend', 'Eski tabloların silinmesi',
   'Eski feed/cafe/follow tabloları yazıma kapatıldı (write-revoke) ama DROP edilmedi. Canary sonrası ayrı karar + migration gerekiyor.',
   'Cadde''nin eski sürümünden kalan boş tablolar pasifleştirildi ama henüz silinmedi. Bir süre gözlemleyip sonra temizlenecek — acelesi yok, risk düşük.',
   'partial', 2),
  ('a1-backend', 'Cafe bitiş bildirimi zamanlaması',
   'cadde_notify_expiring_cafes() hazır; pg_cron varsa 10 dk''da bir çalışır, yoksa ''scheduler kararı açık'' notice''i düşer.',
   'Süresi dolan cafe''ler için otomatik bildirim fonksiyonu hazır; ama bunun düzenli çalışması için bir zamanlayıcı gerekiyor — canlıda var mı kontrol edilmeli.',
   'partial', 3),
  ('a1-backend', 'Görsel moderasyonu',
   'Otomatik tarama trigger''ları yalnız metni tarıyor; görsel/medya taraması yok.',
   'Uygunsuz içerik denetimi şu an sadece yazılarda çalışıyor. Çarşı''ya görsel yükleme açılırsa, görseller için de bir denetim eklenmeli.',
   'open', 4),

  ('a2-frontend', 'Public profil vitrini',
   'CaddeMyContentCard panel parity tamam; ama açık cafe + çarşı ilanları başkalarının gördüğü katalog profilinde (directory) görünmüyor.',
   'Kullanıcı kendi açtığı cafe''leri/ilanlarını kendi panelinde görüyor; ama BAŞKALARI onun profiline bakınca bunları göremiyor. Bu vitrini herkese açmak lazım.',
   'open', 0),
  ('a2-frontend', 'Diaspora seçici (Cadde içi)',
   'useCaddeDiasporaKey tüm sorgulara bağlı, header''da global switcher var; Cadde içi görünür switcher yok.',
   'Cadde farklı ülke topluluklarını destekliyor ama kullanıcı Cadde içinden topluluğu kolayca değiştiremiyor — bir seçici eklenmeli (küçük iş).',
   'partial', 1),
  ('a2-frontend', 'Premium kademe ekranı (D-07)',
   'Cadde''de premium entitlement UI''ı yok; limitler cadde_settings''te sabit.',
   'Ücretli/üst üyelik kademesi (ör. daha çok ilan hakkı) için bir ekran yok. İş modeli kararı verilince eklenecek.',
   'open', 2),

  ('a3-test', 'RLS entegrasyon testleri',
   'Birim/ayna testleri var; uçtan uca RPC + RLS entegrasyon testi yok.',
   'Güvenlik kurallarının uçtan uca otomatik testi yok; şu an elle doğrulamaya bağlı. Otomatik test eklenirse güvenlik hataları erken yakalanır.',
   'open', 0),
  ('a3-test', 'Playwright persona matrisi',
   'TR-yerleşik / diaspora / business / banlı / admin gibi personalar için E2E test matrisi yok.',
   'Farklı kullanıcı tiplerinin (Türkiye''deki, yurtdışındaki, işletme, yasaklı...) akışlarını otomatik test eden bir set yok — bunlar şimdilik elle test ediliyor.',
   'open', 1),

  ('ref', 'Dünya saatleri bandı',
   'WorldClocksBand.tsx (~152 satır), salt görsel; bağımlılığı az.',
   'Farklı ülkelerdeki saatleri gösteren şık bir şerit. Kolayca alınabilir, ilk aday.',
   'open', 0),
  ('ref', 'Çarşı vitrini + ilan görseli',
   'CarsiUserShowcase + görsel yükleme. Bizim ''public profil yüzeyi'' eksiğiyle birebir örtüşüyor.',
   'Kullanıcının ilanlarını profilinde sergileyen vitrin + ilana fotoğraf ekleme. Bizim eksik listemizdeki işle aynı — öncelikli.',
   'open', 1),
  ('ref', 'Cafe atmosferi (post-it/anket/jukebox)',
   'CafeAmbiance.tsx (~695 satır) tamamen localStorage — kullanıcılar birbirinin notunu görmüyor. Gerçek paylaşım için tablo+RPC+Realtime gerekir.',
   'Cafe odasına his katan not duvarı, anket, müzik kutusu. Şu an herkes sadece kendi yazdığını görüyor (sahte). Gerçekten ortak olması ayrı bir iş — karar gerekiyor.',
   'open', 2),
  ('ref', 'Takip + kişi keşfi',
   'useFeedSocial: user_follows + benzerlik skorlaması. Cadde follow grafiğini bilinçle bıraktı; geri gelirse yeni cadde_follows + RPC gerekir.',
   '''Birini takip et'' ve ''sana benzeyen kişiler'' önerisi. Şu an yok; geri istenirse sıfırdan, kalıcı bir sistem kurulmalı (panel ''Takip'' sekmesiyle aynı iş).',
   'open', 3),

  ('panel-sekmeler', '1–3: Profil Ayarları, Mesaj Kutusu, Hizmet Talepleri',
   'Çalışıyor. (Hizmet Talepleri çalışıyor ama ÖDEMESİ demo — aşağıda 2B.)',
   'Bu üçü iş görüyor. Sadece Hizmet Talepleri''nin ödeme kısmı şimdilik göstermelik.',
   'ok', 0),
  ('panel-sekmeler', '4–7: Çarşı, Taşınma, Etkinlik, Takvim',
   'Maket ama backend HAZIR (cadde-carsi-api, relocation-api, events, appointments tabloları mevcut). Sadece sekmeye bağlanacak.',
   'Şu an ''yakında'' ekranı; ama arka planları zaten hazır. Birkaç günde ''dolu'' hale getirilebilir — hızlı kazanım.',
   'partial', 1),
  ('panel-sekmeler', '8–9: Bildirimler, WhatsApp',
   'Kısmen var. Bildirim tablosu var ama üreten tetikleyiciler eksik; WhatsApp tablosu var, UI ref''ten port edilmeli.',
   'Yarı hazır. Bildirimler için ''hangi olay bildirim üretsin'' kararı; WhatsApp için eski projeden ekran taşınması gerekiyor.',
   'partial', 2),
  ('panel-sekmeler', '10–11: Takip, Kuponlar',
   'Sıfırdan backend. Takip şu an localStorage (kalıcı değil), Kupon tamamen in-memory mock.',
   'Bunlar gerçekten sıfırdan yapılacak. Şu an ikisi de sahte (sayfayı yenileyince kayboluyor). Ürün kararı gerektiriyor.',
   'open', 3),

  ('panel-borc', 'Stripe ödemesi',
   'MockStripeCheckout — gerçek tahsilat YOK; ''başarılı'' deyince talep kaydediliyor.',
   'Ödeme ekranı gerçek Stripe''ı taklit ediyor ama PARA ÇEKMİYOR. Sunum için güzel, ama gerçek satış için bağlanması gerekiyor.',
   'open', 0),
  ('panel-borc', 'Kupon yönetimi',
   'CouponManager tamamen in-memory mock — sayfa yenilenince kaybolur, DB yok.',
   'Kupon oluştur/listele çalışıyor gibi ama hiçbir yere kaydedilmiyor; yenileyince gidiyor.',
   'open', 1),
  ('panel-borc', 'Takip',
   'useFollow.ts sadece localStorage — kalıcı değil, kimse takipçisini görmüyor.',
   '''Takip et'' butonu çalışıyor gibi ama sadece o cihazda kalıyor; gerçek bir takip sistemi değil.',
   'open', 2),

  ('sosyal-medya-otomasyon', 'Ne yapıldı',
   'scripts/social-generate/ altında Node CLI: 12 araç x 3 varyant için deterministik SVG arka plan (12 motif, marka renkleri) + Sharp compositing (logo+başlık+açıklama+CTA+domain overlay) ile 1200x1200 PNG üretir. Görsel üretim API''si kullanılmaz — backgroundMethod hep ''deterministic-svg''. npm run social:generate -- --all komutu.',
   '12 test aracımızın (Hangi Ülke Sana Uygun, Almanya Banka/Sigorta vb.) her biri için 3 farklı LinkedIn görseli artık otomatik çıkıyor — Canva''da elle uğraşmaya gerek yok. Tek komutla 36 görsel birden üretiliyor.',
   'ok', 0),
  ('sosyal-medya-otomasyon', 'Kalite ve düzeltmeler',
   'Final code review sonrası 4 minor bulgu giderildi: CLI --variant validasyonu (0/NaN artık hata veriyor), logo çevresindeki hafif seam (navy renk kaynağı logo crop''uyla eşitlendi), shortDescription regex''i maxLen parametresine bağlandı, ve BurakShareTab''a otomatik üretilen görsel önizlemesi (GeneratedImagePreview.tsx) eklendi.',
   'Bir kod incelemesinden geçirildi, küçük kusurlar (yanlış komut girilirse sessiz kalması, logo kenarında zar zor görünen çizgi) düzeltildi. Ayrıca admin panelindeki her Canva kutusunun altına üretilen görselin küçük önizlemesi + indir butonu eklendi.',
   'ok', 1),
  ('sosyal-medya-otomasyon', 'Kalan iş',
   'public/social/generated/ altındaki 36 PNG main''de commit''li ve Coolify deploy sonrası canlıda erişilebilir olacak. Üretilen görsellerin gerçek admin oturumuyla tarayıcıda görsel QA''i yapılmadı (auth gerektiriyor).',
   'Kod tarafı tamam ve main''de; kalan tek şey deploy edip panelde gözle bir kontrol etmek.',
   'partial', 2),

  ('revizyon-gorsel-ekleri', 'Ne yapıldı',
   'revision_request_attachments tablosu + storage bucket migration''ı (talep XOR yorum CHECK kısıtı); ek API katmanı (fetch/upload/delete/signed-url); ortak RevisionAttachmentGrid bileşeni; talep detay drawer''ına ve yorum thread''ine görsel grid; compose''da çoklu dosya seçimi; yeni talep sonrası panel otomatik açılıyor.',
   'Revizyon isteği açarken veya yorum yazarken artık görsel ekleyebiliyorsunuz — hem talebe hem tek tek yorumlara. Birden fazla dosya birden seçilebiliyor.',
   'ok', 0),

  ('bireysel-premium-sunum', 'Ne yapıldı',
   'profile-types.ts''deki tek kaynak sınıflandırma (getUiProfileType) üzerinden User_*/Admin_* prefix''leri, Job_Candidate, Marketplace_IndividualSeller ve tanımsız rol varsayılanı dahil tüm bireysel profillere premium hero/kart tasarımı uygulandı. Deneysel_2/3 pilotu ayrı config olarak korundu (ileride ayrışma esnekliği için).',
   'Herkesin bireysel profili artık daha önce sadece deneme kullanıcılarında gördüğümüz şık/premium görünümde. Kullanıcı doğrudan canlıya almayı tercih etti (kademeli açılım yerine).',
   'ok', 0),
  ('bireysel-premium-sunum', 'SuperAdmin istisnası',
   'İki kurucu hesap (ubterzioglu@gmail.com, burakakcakanat@gmail.com) rol kategorisi olarak ''bireysel'' sayılsa da resolveProfilePresentation içinde bilinçli olarak sade/generic görünümde tutuluyor — sadece sunum katmanı, izin/veri modeli değişmedi.',
   'Umut ve Burak''ın kendi hesapları bu yeni premium görünümü almıyor, bilinçli olarak eski sade haliyle kalıyor.',
   'ok', 1),

  ('burak-share-sekme', 'Ne yapıldı',
   'social_share_assets tablosu + RLS + burak-share storage bucket migration''ı; medya asset API''si (slot_key upsert, storage) + testleri; 12 aracın statik içerik verisi; BurakMediaPanel + BurakShareTab (12 araç akordeon + medya yuvaları); 4. sekme ''BURAK BURAYA BAK'' + bulk kopyala butonları.',
   'Panelde artık 4. bir sekme var: her araç için Burak''ın kullanacağı hazır metinler + görsel/video/link yükleyebileceği kutular, tek tıkla kopyalama butonlarıyla birlikte.',
   'ok', 0),
  ('burak-share-sekme', 'Durum',
   'Migration canlı DB''de doğrulandı (tablo + bucket + 8 policy). Kod main''de.',
   'Bu bölüm canlıda çalışır durumda, sadece görsel QA (gözle kontrol) bekliyor.',
   'ok', 1),

  ('uye-geri-bildirim', 'Ne yapıldı',
   'Üst barda giriş yapmış üyeye ''Feedback Ver'' linki (geldiği sayfa page_path olarak taşınır); /feedback formu (RequireAuth, submitFeedback); /admin/feedback listesi (Yeni/Okundu/Arşiv durumları + soft-delete, e-posta çözümlemesi); member_feedback tablosu + RLS migration''ı (üye kendi kaydını ekler, görme/güncelleme admin-only). 14 yeni test.',
   'Üyeler artık üst menüden ''Feedback Ver''e tıklayıp kısa bir form dolduruyor; adminler bu geri bildirimleri /admin/feedback''te okuyup ''okundu/arşiv'' olarak işaretleyebiliyor.',
   'ok', 0),
  ('uye-geri-bildirim', 'Durum',
   'Kod main''de, migration canlı DB''de doğrulandı.',
   'Canlıda çalışıyor, kalan sadece görsel QA.',
   'ok', 1),

  ('header-admin-iyilestirmeler', 'Araçlar açılır menüsü',
   'Masaüstünde Genel/Almanya araçları gruplandıran premium tasarımlı dropdown''a geçildi, sonra doğrudan linke çevrildi (sitemap''ten korumalı /tools/:slug alt sayfalarının çıkarılması + GSC indeksleme düzeltmesiyle birlikte); mobilde tam ekran aç/kapa panele dönüştürüldü; araç kartlarına ''Ücretsiz'' rozeti eklendi.',
   'Üst menüdeki Araçlar açılır listesi hem masaüstünde hem mobilde daha şık ve kullanışlı hale geldi, ücretsiz araçlar artık rozetle belli.',
   'ok', 0),
  ('header-admin-iyilestirmeler', 'Admin panel',
   'Topbara Clarity/Search Console/Drive''a tek tıkla erişim için AdminQuickToolLinks eklendi; /admin/data''ya rol bazlı kayıt sayılarını gösteren akordeon kart + admin_role_record_counts RPC''si eklendi.',
   'Adminler topbardan sık kullanılan araçlara (Clarity, Search Console, Drive) tek tıkla ulaşabiliyor; /admin/data''da her role kaç kayıt düştüğünü akordeon bir kartta görebiliyor.',
   'ok', 1),
  ('header-admin-iyilestirmeler', 'Giriş ekranı',
   'LoginPage''e ''Ücretsiz'' rozeti eklendi.',
   'Giriş ekranında ücretsiz olduğumuzu vurgulayan bir rozet var artık.',
   'ok', 2),

  ('relocation-tools-temmuz', 'Soru akışı ve admin görünümü',
   'QuestionStepper artık is_required bayrağına bakmaksızın her soruyu zorunlu sayıyor (slider varsayılan değeri cevap sayılmıyor); admin panelindeki hızlı/normal kolon ayrımı kaldırıldı (ürün artık tek modlu sabit soru akışı kullandığı için); /admin''e canlı soru sayısı sayfası + nav girdisi eklendi; Almanya araçlarının (banka/maaş/para transferi/sigorta) eksik hero görselleri tamamlandı.',
   'Taşınma araçlarında bir soruyu cevaplamadan sonrakine geçilemiyor artık. Admin panelindeki soru sayısı ekranı gerçek ürün davranışını yansıtacak şekilde sadeleşti, 7 Almanya aracının eksik kapak görselleri eklendi.',
   'ok', 0),

  ('kararlar', 'Takip sistemi geri gelsin mi?',
   'Yeni cadde_follows tablosu + RPC + CKS skor etkisi + gizlilik kuralı gerekir.',
   'Kullanıcılar birbirini takip edebilsin mi? Evetse kalıcı bir sistem kurulacak (panel + Cadde tek sistem). Hayırsa sadece ''keşif önerisi'' yeter.',
   null, 0),
  ('kararlar', 'Cafe atmosferi gerçek mi olsun?',
   'Gerçek paylaşım = tablo+RPC+Realtime+moderasyon; ya da lokal kalır.',
   'Not duvarı/anket/müzik herkese ortak mı görünsün, yoksa kişisel mi kalsın? Önerimiz: önce basit/lokal, sonra gerçek sürüm.',
   null, 1),
  ('kararlar', 'SMS sağlayıcı kararı',
   'Twilio / Vonage / Supabase phone / e-posta fallback? Maliyet + KVKK.',
   'Telefon doğrulama için hangi SMS firması? Maliyeti ve yasal tarafı kararı bekliyor.',
   null, 2),
  ('kararlar', 'Premium iş modeli + Kupon sahipliği',
   'Feature-bazlı entitlement (afs_features) mi, gerçek abonelik (Stripe/Paddle) mi? Kupon işletmeye mi, premium bireysele mi?',
   'Ücretli üyelik nasıl olacak ve kuponlar kime ait? (işletme mi verir, üye mi kullanır?) Bu karar hem premium ekranını hem kuponları açar.',
   null, 3)
) as r(section_key, label, technical, plain, status, order_index)
join public.brainstorming_sections s on s.section_key = r.section_key
where not exists (
  select 1 from public.brainstorming_rows br
  where br.section_id = s.id and br.label = r.label and br.order_index = r.order_index
);
