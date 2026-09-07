-- Cadde Workshop WS3 — 27.08.2026 tarihli iki denetim dokümanının AÇIK maddeleri.
--
-- Kaynak dosyalar (repo kökü):
--   * "cadde ve cafe-ux-degerlendirme.md"  (UX ve içerik değerlendirmesi)
--   * "cadde-cafe-ui-kritigi.md"           (görsel dil / design-token kritiği)
--
-- ÖNEMLİ: Bu seed iki dokümanın TAMAMI değildir. 07.09.2026'da her madde koda karşı
-- tek tek doğrulandı; ZATEN YAPILMIŞ olanlar bilinçli olarak DIŞARIDA bırakıldı:
--   * Yorum kutusu placeholder'ı ("Yorum yaz")  -> CaddePage.tsx:1103'te var.
--   * Tepkilerin tek tetik arkasına alınması    -> commit 9af6727 (7 ikon -> 1 tetik).
--   * Sağ raydaki cafe kartında kapasite paydası-> CaddeCafesPanel.tsx:163 yalnız "üye" yazar.
--   * Fotoğraf yüklenince akışın yenilenmemesi  -> WS2 m63/m64 ile kapandı; medya submit'ten
--     ÖNCE yükleniyor (CaddeComposer.tsx:138) ve feedRoot invalidate ediliyor
--     (CaddePage.tsx:277). Kod yolunda kusur görünmüyor; gözle QA'da doğrulanmalı.
--
-- item_no HARDCODE EDİLMEZ: (workshop_key, item_no) tekildir ve panelden madde
-- eklendikçe numaralar kayar (ölçüm 07.09.2026: cadde max item_no = 135). Bu yüzden
-- numara mevcut maksimumdan devam ettirilir — WS2 seed'inde yaşanan "on conflict do
-- nothing sessizce yuttu" tuzağına düşmemek için sonda satır sayısı doğrulanır.

do $$
declare
  base_no  integer;
  ws3_count integer;
begin
  if exists (
    select 1 from public.workshop_items
    where workshop_key = 'cadde' and session_key = 'WS3'
  ) then
    raise notice 'Cadde WS3 seed already present, skipping.';
    return;
  end if;

  select coalesce(max(item_no), 0) into base_no
  from public.workshop_items
  where workshop_key = 'cadde';

  insert into public.workshop_items (workshop_key, session_key, section, item_no, title)
  select 'cadde', 'WS3', entry.section, base_no + entry.ord, entry.title
  from (
    values
      -- ── Görsel Dil ve Tasarım Sistemi (UI kritiği) ───────────────────────────
      (1,  'Görsel Dil ve Tasarım Sistemi', 'Design-token dokümanı yazılacak (renk, buton, rozet, yüzey, dil) ve arayüzün tek kaynağı olacak.'),
      (2,  'Görsel Dil ve Tasarım Sistemi', 'Marka altını #aa8c42 arayüzde birincil eylem rengi olarak kullanılacak — bugün src/ altında hiç geçmiyor, yalnız index.html theme-color etiketinde var.'),
      (3,  'Görsel Dil ve Tasarım Sistemi', 'Buton dili üç seviyeye indirilecek: primary (altın dolu, sayfa başına bir tane), secondary (nötr outline), tertiary (metin link).'),
      (4,  'Görsel Dil ve Tasarım Sistemi', 'Üst navigasyondaki dört link tek nötr renge çekilecek — bugün Araçlar #1E3A8A mavi, Feedback Ver #ee652b turuncu, Profilim #34A853 yeşil, Çıkış gri.'),
      (5,  'Görsel Dil ve Tasarım Sistemi', 'Kartların üstündeki gökkuşağı şerit pillar renk kodlamasına çevrilecek (Cadde altın / Cafe yeşil / Çarşı terracotta) — bugün index.css içindeki .cadde-card::before her kartta beş renkli gradient çiziyor.'),
      (6,  'Görsel Dil ve Tasarım Sistemi', 'Rozetler üç tipe indirilecek: durum (dolu renk), kimlik (tek ikon + nötr), kategori (outline) — her tipin tek sabit stili olacak.'),
      (7,  'Görsel Dil ve Tasarım Sistemi', 'Köşe yarıçapı tek değere sabitlenecek (öneri 12px; pill butonlar hariç) — bugün rounded-md / xl / 2xl / [24px] karışık kullanılıyor.'),
      (8,  'Görsel Dil ve Tasarım Sistemi', 'Gölge iki seviyeye indirilecek: kart (hafif) ve yükseltilmiş kart/modal (belirgin).'),
      (9,  'Görsel Dil ve Tasarım Sistemi', 'Gövde metni grisi için #6b7280 alt sınırı uygulanacak; daha açık tonlara inilmeyecek (AA kontrast sınırı).'),
      (10, 'Görsel Dil ve Tasarım Sistemi', 'Arayüzdeki "Pinned" etiketi "Sabit" olarak Türkçeleştirilecek (CaddePage.tsx:742 ve AdminCaddePage.tsx:360).'),
      (11, 'Görsel Dil ve Tasarım Sistemi', 'Üst bardaki "Feedback Ver" etiketi "Geri Bildirim" olarak değiştirilecek (SiteHeader.tsx:54, FeedbackPage.tsx:74).'),
      (12, 'Görsel Dil ve Tasarım Sistemi', 'Cafe oda başlığındaki "Host" etiketi "Ev Sahibi" olarak değiştirilecek (CaddeCafePage.tsx:206) — Cafe metaforunun doğal karşılığı.'),
      (13, 'Görsel Dil ve Tasarım Sistemi', 'Cafe kartındaki turuncu/amber çerçeve ile yeşil "Canlı" rozeti arasındaki çelişki giderilecek: tek sinyal, tek renk.'),

      -- ── Akış ve Yerleşim (UX md.1-2) ─────────────────────────────────────────
      (14, 'Akış ve Yerleşim', 'Beta bandı kapatılabilir yapılacak ve tercih localStorage''da tutulacak — bugün SiteHeader.tsx''te kapatma düğmesi de saklama da yok.'),
      (15, 'Akış ve Yerleşim', 'Logo bandı ile sayfa başlığı tek satırda birleştirilecek (sol logo + sağ sayfa adı).'),
      (16, 'Akış ve Yerleşim', 'Giriş yapmış kullanıcıya pazarlama sloganı gösterilmeyecek — SiteHeader.tsx:131''deki "Dünyadaki Türkleri Bir Araya Getiren Platform" satırı koşullanacak.'),
      (17, 'Akış ve Yerleşim', 'Scroll edildiğinde header sticky kalacak ama yüksekliği yarıya inecek; hedef ilk gönderiyi fold''un üstüne çıkarmak (bugün içerikten önce ~300px yığın var).'),
      (18, 'Akış ve Yerleşim', '"Caddeye Çık" butonu gerçek işlevine göre yeniden adlandırılacak veya kaldırılacak — bugün CaddePage.tsx:1250''de yalnız composer''a kaydırıyor, composer zaten sayfada.'),

      -- ── Tepkiler ve Boş Durumlar (UX md.3-4) ─────────────────────────────────
      (19, 'Tepkiler ve Boş Durumlar', 'Sıfır olan tepki ve yorum sayıları gizlenecek, sayı 1''e ulaşınca görünecek — bugün CaddePage.tsx:974 ve :1003 sayıyı koşulsuz basıyor, boş ağda her kartta 0 yazıyor.'),
      (20, 'Tepkiler ve Boş Durumlar', 'Tepki seti gözden geçirilecek: bugün 5 tip var (beğeni, kalp, gülme, destek, emin olamadım); öneri beğeni + soru + yorum üçlüsü. "Emin olamadım" diaspora akışında değerli, korunmalı.'),
      (21, 'Tepkiler ve Boş Durumlar', 'Şehri boş olan kullanıcı otomatik olarak ülke akışına veya en yakın dolu şehre düşürülecek — bugün CaddePage.tsx:1283 yalnız metinle "ilk paylaşımı sen yapabilirsin" diyor, kullanıcı ilk paylaşımı yapmaz.'),
      (22, 'Tepkiler ve Boş Durumlar', 'Boş durum metni dolu bir alternatif sunacak: "bu şehirde kimse yok" yerine "Berlin''deki 12 paylaşımı gör" gibi.'),

      -- ── CAFE (UX md.5) ───────────────────────────────────────────────────────
      (23, 'CAFE', 'Cafe format kararı verilecek: async-first oda (24 saat - 7 gün, "Canlı" ayrı etkinlik modu) mu, yoksa platformun duyurduğu programlı canlı slotlar mı. Boş bir CANLI oda boş akıştan daha zararlı — süre akarken kimse yoksa kullanıcı bir daha denemiyor.'),
      (24, 'CAFE', 'Oda sayfasındaki "2/100 üye" paydası gizlenecek veya doluluk %20''yi geçince gösterilecek (CaddeCafePage.tsx:206) — sağ raydaki kart zaten yalnız "üye" yazıyor, iki yüzey ayrışmış durumda.'),
      (25, 'CAFE', '"Cafe''yi Arşivle" kebab (...) menüsüne taşınacak; ana pozisyonda "Davet Et" / "Paylaş" duracak — bugün CaddeCafePage.tsx:212''de oda canlıyken en görünür aksiyon odayı kapatmak.'),
      (26, 'CAFE', 'Süre dolunca ne olacağı oda kartında tek satırla yazılacak ("Süre dolunca oda arşivlenir, içerik okunabilir kalır") — bugün bu bilgi yalnız kod yorumunda (CaddeCafePage.tsx:4), kullanıcı göremiyor.'),

      -- ── İçerik ve Soğuk Başlangıç (UX md.4 — en kritik başlık) ───────────────
      (27, 'İçerik ve Soğuk Başlangıç', 'Test gönderileri ve test cafe''leri canlı akıştan temizlenecek (bug raporu gönderisi, "agwdhjsajkkjsddfgsegdsfsdg" açıklamalı oda). Onaylı rozetin ilk göründüğü yer bir test odası olmamalı.'),
      (28, 'İçerik ve Soğuk Başlangıç', 'Test içeriği için ayrı staging ortamı veya yalnız admin''e görünür bir görünürlük seviyesi kurulacak; bug raporları feedback kanalına taşınacak.'),
      (29, 'İçerik ve Soğuk Başlangıç', 'Dört hedef şehir için 8-10 gerçek soru/not hazırlanıp tohumlanacak (Berlin, Londra, Sydney, Dubai); içerik blog ve Reel serilerindeki konulardan türetilecek (oturum izni, çalışma vizesi, vatandaşlık, okul denkliği, kira/kefil, yaşam maliyeti).'),
      (30, 'İçerik ve Soğuk Başlangıç', 'Tohum gönderiler CorteQS resmî hesabı veya şehir elçisi hesaplarından yayınlanacak ve tarihleri geriye yayılacak — hepsi aynı gün görünmemeli.'),
      (31, 'İçerik ve Soğuk Başlangıç', 'Blog ile Cadde arasında döngü kurulacak: blog yazısı Cadde''de soru olarak açılacak, gelen yanıtlar sonraki blog içeriğini besleyecek.')
  ) as entry(ord, section, title)
  order by entry.ord;

  select count(*) into ws3_count
  from public.workshop_items
  where workshop_key = 'cadde' and session_key = 'WS3';

  if ws3_count <> 31 then
    raise exception 'WS3 maddeleri eksik: beklenen 31, bulunan %.', ws3_count;
  end if;
end;
$$;

comment on column public.workshop_items.session_key is
  'Workshop oturumu: WS1 = 30.07.2026 birinci toplantı, WS2 = 04.08.2026 ikinci toplantı, WS3 = 27.08.2026 UX/UI denetim dokümanlarının açık maddeleri. Yeni toplantı = WS4.';
