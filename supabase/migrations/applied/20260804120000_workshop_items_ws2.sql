-- Workshop panosuna oturum (toplantı) ayrımı + 2. Cadde workshop maddeleri.
-- /admin/workshop/cadde sayfası artık WS1 / WS2 sütunu ve filtresi gösteriyor.
--
-- Karar (04.08.2026): madde numarası oturumlar arasında DEVAM EDER, böylece
-- (workshop_key, item_no) tekilliği ve "madde 57" gibi tek referans korunur.
-- Bu yüzden unique kısıtına dokunulmuyor.
--
-- WS1 seed'i 48 madde ile başlamıştı; panelden 5 madde daha eklendiği için
-- (49-53: CAFE / Çarşı maddeleri) WS2 numaralandırması 54'ten başlar.
-- Kaynak: 04.08.2026 ikinci Cadde workshop toplantısı notları (79 madde, 6 bölüm).

-- 1) Oturum kolonu -----------------------------------------------------------
-- Mevcut 53 madde default ile WS1'e düşer; ayrıca backfill'e gerek yok.
alter table public.workshop_items
  add column if not exists session_key text not null default 'WS1';

alter table public.workshop_items
  drop constraint if exists workshop_items_session_key_format;
alter table public.workshop_items
  add constraint workshop_items_session_key_format
  check (session_key ~ '^WS[0-9]+$');

create index if not exists workshop_items_session_idx
  on public.workshop_items (workshop_key, session_key, item_no);

comment on column public.workshop_items.session_key is
  'Workshop oturumu: WS1 = 30.07.2026 birinci toplantı, WS2 = 04.08.2026 ikinci toplantı. Yeni toplantı = WS3.';

-- 2) WS2 maddeleri — idempotent seed ----------------------------------------
insert into public.workshop_items (workshop_key, session_key, section, item_no, title) values
  ('cadde', 'WS2', 'Cadde — Öncelikli İşler', 54, 'Dünya saatleri kartı yaklaşık %15 büyütülecek.'),
  ('cadde', 'WS2', 'Cadde — Öncelikli İşler', 55, 'Dünya saatleri alanında toplam beş şehir gösterilecek.'),
  ('cadde', 'WS2', 'Cadde — Öncelikli İşler', 56, 'Dünya saatleri kartı sayfanın sağ tarafına taşınacak.'),
  ('cadde', 'WS2', 'Cadde — Öncelikli İşler', 57, 'Kafe içerisinde paylaşılan gönderilere yorum yazılabilmesi sağlanacak.'),
  ('cadde', 'WS2', 'Cadde — Öncelikli İşler', 58, 'Kullanıcıların kafe içerisinde sohbet benzeri bir akış kullanabilmesi sağlanacak.'),
  ('cadde', 'WS2', 'Cadde — Öncelikli İşler', 59, 'Kafe paylaşımlarına görsel yükleme özelliği eklenecek.'),
  ('cadde', 'WS2', 'Cadde — Öncelikli İşler', 60, 'Kullanıcıların kafe paylaşımlarına bağlantı ekleyebilmesi sağlanacak.'),
  ('cadde', 'WS2', 'Cadde — Öncelikli İşler', 61, 'Kafe paylaşımlarında emoji kullanımı desteklenecek.'),
  ('cadde', 'WS2', 'Cadde — Öncelikli İşler', 62, 'Emoji ekleme ve gösterme sırasında oluşan hatalar giderilecek.'),
  ('cadde', 'WS2', 'Cadde — Öncelikli İşler', 63, 'Paylaşımlara görsel yüklerken oluşan donma ve görüntüleme sorunları çözülecek.'),
  ('cadde', 'WS2', 'Cadde — Öncelikli İşler', 64, 'Yüklenen görseller ek dosya görünümü yerine paylaşım içerisinde büyük ve gömülü olarak gösterilecek.'),
  ('cadde', 'WS2', 'Cadde — Öncelikli İşler', 65, 'Kafe bağlantılarının kolayca ayırt edilebilmesi için CorteQS''e özel bir kafe ikonu hazırlanacak.'),
  ('cadde', 'WS2', 'Cadde — Öncelikli İşler', 66, 'Kafe kartları yeni ikon ve tasarım yapısına göre düzenlenecek.'),
  ('cadde', 'WS2', 'Cadde — Öncelikli İşler', 67, 'Kafe kartlarının sayfada fazla yer kaplamaması için kart yükseklikleri küçültülecek.'),
  ('cadde', 'WS2', 'Cadde — Öncelikli İşler', 68, 'Aktif kafeler bölümü açılıp kapanabilen bir akordeon yapısına dönüştürülecek.'),
  ('cadde', 'WS2', 'Cadde — Öncelikli İşler', 69, 'Kafeler bölümünün ana paylaşım akışını domine etmesi engellenecek.'),
  ('cadde', 'WS2', 'Cadde — Öncelikli İşler', 70, 'Kafeler için ülke ve şehir filtrelerinin konumu ve görünümü yeniden tasarlanacak.'),
  ('cadde', 'WS2', 'Cadde — Öncelikli İşler', 71, 'Kullanıcı tarafından yapılan paylaşım, profilinde kayıtlı olan ülkenin akışında gösterilecek.'),
  ('cadde', 'WS2', 'Cadde — Öncelikli İşler', 72, 'Kullanıcının ülkesinde yayınlanan paylaşım şimdilik global akışta da gösterilecek.'),
  ('cadde', 'WS2', 'Cadde — Öncelikli İşler', 73, 'Kullanıcıların doğrudan global feed seçerek paylaşım yapmasına izin verilmeyecek.'),
  ('cadde', 'WS2', 'Cadde — Öncelikli İşler', 74, 'Etkileşim oranlarına göre paylaşımların global akışa taşınması sonraki fazda geliştirilecek.'),
  ('cadde', 'WS2', 'Cadde — Öncelikli İşler', 75, 'Cadde üzerinde görülen "Paylaşım gönderilemedi" hatası çözülecek.'),
  ('cadde', 'WS2', 'Cadde — Öncelikli İşler', 76, 'Paylaşım gönderme işlemi düzeltildikten sonra farklı kullanıcılarla tekrar test edilecek.'),
  ('cadde', 'WS2', 'Cadde — Öncelikli İşler', 77, 'Filtrelerde kullanılacak ülke ve şehir bilgileri mevcut profil veritabanından çekilecek.'),
  ('cadde', 'WS2', 'Cadde — Öncelikli İşler', 78, 'Yanlış ülkelere bağlı görünen şehirler doğru ülkelerle eşleştirilecek.'),
  ('cadde', 'WS2', 'Cadde — Öncelikli İşler', 79, 'Şehir isimlerindeki büyük ve küçük harf problemleri düzeltilecek.'),
  ('cadde', 'WS2', 'Cadde — Öncelikli İşler', 80, 'Enter tuşu yorumu göndermek yerine yeni satıra geçmek için kullanılacak.'),
  ('cadde', 'WS2', 'Cadde — Öncelikli İşler', 81, 'Yorumlar yalnızca gönder butonuna basıldığında yayınlanacak.'),
  ('cadde', 'WS2', 'Cadde — Öncelikli İşler', 82, 'Sayfadaki renklerin kontrastı yaklaşık %10-15 oranında artırılacak.'),
  ('cadde', 'WS2', 'Cadde — Öncelikli İşler', 83, 'Tasarım daha canlı hale getirilirken aşırı renkli ve karmaşık bir görünüm oluşması engellenecek.'),
  ('cadde', 'WS2', 'Cadde — Öncelikli İşler', 84, 'Sol tarafta bulunan alanlar sağ tarafa taşınacak veya yeniden konumlandırılacak.'),
  ('cadde', 'WS2', 'Cadde — Öncelikli İşler', 85, 'Sayfa açıldığında kullanıcının öncelikle paylaşım akışını görmesi sağlanacak.'),
  ('cadde', 'WS2', 'Cadde — Öncelikli İşler', 86, 'Konum seçiminin ne işe yaradığını açıklayan küçük bir bilgi ikonu eklenecek.'),
  ('cadde', 'WS2', 'Cadde — Öncelikli İşler', 87, 'Seçilen konumun paylaşımın hangi ülke akışında gösterileceği kullanıcıya açıklanacak.'),
  ('cadde', 'WS2', 'Cadde — Öncelikli İşler', 88, 'Henüz çalışmayan fonksiyonlar tek tek gösterilmek yerine ortak bir "Yakında gelecek özellikler" alanında toplanacak.'),

  ('cadde', 'WS2', 'Park Edilen / Sonraki Faz', 89, 'Yeni paylaşımlar geldiğinde yalnızca ilgili feed alanının otomatik olarak yenilenmesi sonraki fazda geliştirilecek.'),
  ('cadde', 'WS2', 'Park Edilen / Sonraki Faz', 90, 'Yeni yorumların sayfa tamamen yenilenmeden görünmesi performans değerlendirmesinden sonra uygulanacak.'),
  ('cadde', 'WS2', 'Park Edilen / Sonraki Faz', 91, 'Bir kullanıcı kafeye katılmak istediğinde kafe sahibine bildirim gönderilmesi sonraki faza bırakıldı.'),
  ('cadde', 'WS2', 'Park Edilen / Sonraki Faz', 92, 'Kafeye katılım talebi gönderen kullanıcının profilinin kafe sahibi tarafından görüntülenmesi sonraki fazda geliştirilecek.'),
  ('cadde', 'WS2', 'Park Edilen / Sonraki Faz', 93, 'Kafe sahibinin katılım taleplerini kabul veya reddedebilmesi daha sonra geliştirilecek.'),
  ('cadde', 'WS2', 'Park Edilen / Sonraki Faz', 94, 'Paylaşımlara video yükleme özelliği kendi sunucu ve veritabanı altyapısı tamamlandıktan sonra eklenecek.'),
  ('cadde', 'WS2', 'Park Edilen / Sonraki Faz', 95, 'Telefon doğrulaması gerektiren maddeler doğrulama sistemi tamamlanana kadar açık tutulacak.'),
  ('cadde', 'WS2', 'Park Edilen / Sonraki Faz', 96, 'Beğeni, yorum ve emoji sayılarına göre paylaşımların global feed''e taşınması sonraki fazda geliştirilecek.'),
  ('cadde', 'WS2', 'Park Edilen / Sonraki Faz', 97, 'Varsayılan Google ve Supabase giriş ekranı CorteQS veya Vortex markasına uygun hale getirilecek.'),

  ('cadde', 'WS2', 'Yeni Açılacak Görevler', 98, 'Reklam alanındaki mevcut açıklamalar ve buton metinleri yeniden yazılacak.'),
  ('cadde', 'WS2', 'Yeni Açılacak Görevler', 99, 'Reklam alanında bulunan "Talep bırak" gibi ifadeler kaldırılacak veya değiştirilecek.'),
  ('cadde', 'WS2', 'Yeni Açılacak Görevler', 100, 'Görsel olarak hazırlanan reklam alanının teknik altyapısı için ayrı bir görev oluşturulacak.'),
  ('cadde', 'WS2', 'Yeni Açılacak Görevler', 101, 'Burak tarafından belirtilen şok veya pano formatı ayrı bir geliştirme maddesi olarak eklenecek.'),
  ('cadde', 'WS2', 'Yeni Açılacak Görevler', 102, 'Kullanıcıların konum bilgisi olmadan araç raporu göndermesi engellenecek.'),
  ('cadde', 'WS2', 'Yeni Açılacak Görevler', 103, 'Araç kullanım raporlarında kullanıcının ülke veya konum bilgisi ayrı bir kolonda gösterilecek.'),

  ('cadde', 'WS2', 'Pazarlama ve Analiz', 104, 'Görsel, video ve paylaşım metninden oluşan üç sütunlu pazarlama şablonu Burak''a gönderilecek.'),
  ('cadde', 'WS2', 'Pazarlama ve Analiz', 105, 'Her araç veya özellik için kullanılabilecek kare formatta bir görsel hazırlanacak.'),
  ('cadde', 'WS2', 'Pazarlama ve Analiz', 106, 'Kare görselden kısa tanıtım videosu üretmek için kullanılacak prompt hazırlanacak.'),
  ('cadde', 'WS2', 'Pazarlama ve Analiz', 107, 'Her özellik için kullanılabilecek LinkedIn paylaşım metinleri hazırlanacak.'),
  ('cadde', 'WS2', 'Pazarlama ve Analiz', 108, 'Kullanıcı davranışlarını gösteren Microsoft Clarity raporu haftalık olarak Burak''a gönderilecek.'),
  ('cadde', 'WS2', 'Pazarlama ve Analiz', 109, 'Kullanıcıların sayfa üzerinde hangi alanlara tıkladığı incelenecek.'),
  ('cadde', 'WS2', 'Pazarlama ve Analiz', 110, 'Kullanıcıların araçları hangi aşamada terk ettiği tespit edilecek.'),
  ('cadde', 'WS2', 'Pazarlama ve Analiz', 111, 'En fazla ilgi gören araçlar ve özellikler haftalık raporda gösterilecek.'),
  ('cadde', 'WS2', 'Pazarlama ve Analiz', 112, 'Kullanıcı bir aracı tamamlamadan çıkarsa daha sonra işlemi tamamlaması için e-posta gönderilecek.'),
  ('cadde', 'WS2', 'Pazarlama ve Analiz', 113, 'Kafe özelliğinin nasıl tanıtılacağını açıklayan ayrı bir pazarlama brief''i hazırlanacak.'),
  ('cadde', 'WS2', 'Pazarlama ve Analiz', 114, 'Kullanıcıların davet koduyla özel topluluk oluşturabilmesi pazarlama içeriğinde öne çıkarılacak.'),
  ('cadde', 'WS2', 'Pazarlama ve Analiz', 115, 'Kafe özelliğinin hızlı ve kontrollü bir topluluk oluşturma aracı olduğu vurgulanacak.'),

  ('cadde', 'WS2', 'Planlama ve Toplantılar', 116, 'Cadde bölümü 6 Ağustos toplantısına kadar yaklaşık %80-90 oranında tamamlanacak.'),
  ('cadde', 'WS2', 'Planlama ve Toplantılar', 117, '6 Ağustos toplantısında profil bölümüne ayrılacak yaklaşık 30 dakika için ön hazırlık yapılacak.'),
  ('cadde', 'WS2', 'Planlama ve Toplantılar', 118, '13 Ağustos''ta yapılacak profil workshop''u için gerekli maddeler önceden belirlenecek.'),
  ('cadde', 'WS2', 'Planlama ve Toplantılar', 119, 'İlk olarak Cadde bölümündeki açık maddeler kapatılacak.'),
  ('cadde', 'WS2', 'Planlama ve Toplantılar', 120, 'Cadde tamamlandıktan sonra profil bölümünün kullanıcı akışları ve backend yapısı ele alınacak.'),
  ('cadde', 'WS2', 'Planlama ve Toplantılar', 121, 'Profil bölümünden sonra Çarşı modülünün geliştirilmesine başlanacak.'),
  ('cadde', 'WS2', 'Planlama ve Toplantılar', 122, 'Çarşı bölümünden sonra taşınma motoru yeniden değerlendirilecek.'),
  ('cadde', 'WS2', 'Planlama ve Toplantılar', 123, 'Taşınma motoruyla birlikte uzun süredir bekleyen WhatsApp botu tekrar ele alınacak.'),
  ('cadde', 'WS2', 'Planlama ve Toplantılar', 124, 'Uzun görev listeleri yerine yaklaşık on maddelik küçük çalışma grupları oluşturulacak.'),
  ('cadde', 'WS2', 'Planlama ve Toplantılar', 125, 'Uzun workshop''lar yerine ön hazırlıklı ve daha kısa toplantılar yapılacak.'),

  ('cadde', 'WS2', 'Diğer Açık İşler', 126, 'Ertelenmiş ödeme modeliyle projelere katkı sağlayacak kişiler için bir program taslağı oluşturulacak.'),
  ('cadde', 'WS2', 'Diğer Açık İşler', 127, 'Hazırlanan katkı programı taslağı değerlendirilmek üzere Umut''a gönderilecek.'),
  ('cadde', 'WS2', 'Diğer Açık İşler', 128, 'Mevcut üç site yeniden WordPress altyapısına taşınacak.'),
  ('cadde', 'WS2', 'Diğer Açık İşler', 129, 'Sitelerin altyapı ve işletme maliyetleri değerlendirilerek fiyat optimizasyonu yapılacak.'),
  ('cadde', 'WS2', 'Diğer Açık İşler', 130, 'Farklı projelerin prototiplerinin ve kodlarının merkezi bir proje kütüphanesinde tutulması sağlanacak.'),
  ('cadde', 'WS2', 'Diğer Açık İşler', 131, 'Ekip üyelerinin yalnızca yetkili oldukları projelere erişmesini sağlayacak NDA tabanlı bir yapı hazırlanacak.'),
  ('cadde', 'WS2', 'Diğer Açık İşler', 132, 'Projelerin uygun ekiplerle eşleştirilmesini sağlayacak bir takım belirleme sistemi planlanacak.')
on conflict (workshop_key, item_no) do nothing;

-- 3) Sessiz yutulmaya karşı doğrulama ---------------------------------------
-- "on conflict do nothing" çakışan maddeyi sessizce atar; item_no aralığı
-- panelden eklenen maddelerle çakışırsa seed eksik kalır ve kimse fark etmez.
do $$
declare
  ws2_count integer;
begin
  select count(*) into ws2_count
  from public.workshop_items
  where workshop_key = 'cadde' and session_key = 'WS2';

  if ws2_count <> 79 then
    raise exception 'WS2 maddeleri eksik: beklenen 79, bulunan %. item_no cakismasi olabilir.', ws2_count;
  end if;
end;
$$;
