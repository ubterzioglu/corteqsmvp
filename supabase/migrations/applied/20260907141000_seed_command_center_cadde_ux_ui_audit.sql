-- Komuta Merkezi seed: 27.08.2026 Cadde & Cafe UX + UI denetim dokümanlarının AÇIK maddeleri.
--
-- Kaynak dosyalar (repo kökü):
--   * "cadde ve cafe-ux-degerlendirme.md"  (UX ve içerik)
--   * "cadde-cafe-ui-kritigi.md"           (görsel dil / design-token)
--
-- Granülerlik kararı T19 desenini izler: Komuta Merkezi'ne GRUPLANMIŞ todo'lar,
-- Cadde Workshop panosuna madde madde döküm girer (mig 20260907140000, WS3, 31 madde).
-- Buradaki 14 satır o 31 maddenin üst başlıklarıdır; detay alanı hangi maddeleri
-- kapsadığını söyler.
--
-- 07.09.2026'da koda karşı doğrulandı; ZATEN YAPILMIŞ olanlar seed'e ALINMADI:
-- yorum placeholder'ı, tepkilerin tek tetik arkasına alınması (9af6727), sağ raydaki
-- kapasite paydası, fotoğraf yükleyince akışın yenilenmemesi (WS2 m63/m64).
--
-- item_type='todo' satırlarında legacy_source_type='todo_items', legacy_source_code null
-- (mevcut todo satırlarıyla aynı şekil).

do $$
declare
  seeded integer;
begin
  if exists (
    select 1 from public.command_center_items
    where item_type = 'todo'
      and title = 'Cadde design-token dokümanını yaz ve arayüzü ona hizala'
  ) then
    raise notice 'Cadde UX/UI denetim seed already present, skipping.';
    return;
  end if;

  insert into public.command_center_items
    (item_type, title, detail, category_label, assignee, status, priority, due_date, urgent,
     legacy_source_type, legacy_source_code, legacy_source_date_label, legacy_source_category,
     legacy_source_title, sort_order)
  values
    -- ── Görsel dil / design-token (UI kritiği) ────────────────────────────────
    ('todo', 'Cadde design-token dokümanını yaz ve arayüzü ona hizala',
     'UI kritiğinin kök nedeni tek: tanımlı bir design-token sistemi yok; renk, buton, rozet ve köşe/gölge değerleri sayfa sayfa birikmiş. Önce token dokümanı yazılacak (renk / buton / rozet / yüzey / dil), sonra bileşenler tek tek ona hizalanacak. Workshop WS3 md.1.',
     'Dashboard, Admin & UX', 'UBT', 'Baslanmadi', 5, null, false,
     'todo_items', null, null, null, null, 13101),

    ('todo', 'Marka altınını (#aa8c42) arayüzde birincil eylem rengi yap',
     'Ölçüldü 07.09.2026: #aa8c42 src/ ağacında HİÇ geçmiyor — yalnız index.html theme-color etiketinde ve docs/ altındaki HTML''lerde var. Cadde aksanı bugün turuncu (--cadde-accent: 24 92% 48%). Altın primary butonda, aktif sekmede, seçili filtrede ve link hover''ında kullanılacak: "her yerde" değil, "birincil eylem neredeyse orada". Workshop WS3 md.2.',
     'Dashboard, Admin & UX', 'UBT', 'Baslanmadi', 5, null, false,
     'todo_items', null, null, null, null, 13102),

    ('todo', 'Buton dilini üç seviyeye indir (primary / secondary / tertiary)',
     'Aynı ekran setinde dört ayrı buton stili dolaşıyor. Tek hiyerarşi kurulacak: primary altın dolu (sayfa başına bir tane), secondary nötr outline, tertiary metin link. "Caddeye Çık" bugün bg-slate-900 siyah pill (CaddePage.tsx:1251) — hiyerarşiye bağlanacak. Workshop WS3 md.3.',
     'Dashboard, Admin & UX', 'UBT', 'Baslanmadi', 5, null, false,
     'todo_items', null, null, null, null, 13103),

    ('todo', 'Üst navigasyondaki dört rengi tek nötr renge indir',
     'SiteHeader.tsx: Araçlar #1E3A8A mavi, Feedback Ver #ee652b turuncu, Profilim #34A853 yeşil, Çıkış gri. Dört link, dört renk — stillenmemiş gibi okunuyor ve göz nereye bakacağını bilemiyor. Hepsi koyu griye çekilecek; vurgu gerekirse yalnız bir öğeye (beta döneminde muhtemelen Geri Bildirim). Workshop WS3 md.4.',
     'Dashboard, Admin & UX', 'UBT', 'Baslanmadi', 5, null, false,
     'todo_items', null, null, null, null, 13104),

    ('todo', 'Kart üstündeki gökkuşağı şeridi pillar renk koduna çevir',
     'index.css içindeki .cadde-panel::before / .cadde-card::before her kartta beş renkli (kırmızı-amber-yeşil-mavi-pembe) 3px gradient çiziyor. Her kartta tekrarlanınca gürültüye dönüşüyor ve bilgi taşımıyor. Gökkuşağı logoda kalacak; şerit pillar koduna dönüşecek: Cadde altın, Cafe yeşil, Çarşı terracotta. Workshop WS3 md.5.',
     'Dashboard, Admin & UX', 'UBT', 'Baslanmadi', 5, null, false,
     'todo_items', null, null, null, null, 13105),

    ('todo', 'Rozetleri üç tipe indir: durum / kimlik / kategori',
     'Altı farklı rozet stili aynı anda dolaşımda (Canlı yeşil, Onaylı, Resmî hesap gri, Pinned siyah, Startup, AÇIK BETA altın çerçeve); her biri kendi kuralını icat etmiş. Üç tip, üç sabit kural: durum = dolu renk, kimlik = tek ikon + nötr, kategori = outline. Workshop WS3 md.6.',
     'Dashboard, Admin & UX', 'UBT', 'Baslanmadi', 5, null, false,
     'todo_items', null, null, null, null, 13106),

    ('todo', 'Yüzey sistemini sabitle: tek köşe yarıçapı, iki gölge seviyesi, #6b7280 metin alt sınırı',
     'Çok yumuşak gölge + çok yuvarlak köşe + açık gri zemin yüzünden her kart aynı seviyede yüzüyor, derinlik hiyerarşisi yok. Köşe yarıçapı tek değere sabitlenecek (öneri 12px, pill butonlar hariç), gölge iki seviyeye inecek (kart / yükseltilmiş), gövde metni grisi #6b7280''in altına inmeyecek (AA kontrast). Workshop WS3 md.7-9.',
     'Dashboard, Admin & UX', 'UBT', 'Baslanmadi', 5, null, false,
     'todo_items', null, null, null, null, 13107),

    ('todo', 'Arayüzdeki İngilizce kalıntıları Türkçeleştir: Pinned, Feedback Ver, Host',
     'Türkçe arayüzde üç İngilizce kalıntı ölçüldü: "Pinned" -> "Sabit" (CaddePage.tsx:742, AdminCaddePage.tsx:360), "Feedback Ver" -> "Geri Bildirim" (SiteHeader.tsx:54, FeedbackPage.tsx:74), "Host" -> "Ev Sahibi" (CaddeCafePage.tsx:206). "Ev Sahibi" Cafe metaforunun doğal uzantısı. Workshop WS3 md.10-12.',
     'Dashboard, Admin & UX', 'UBT', 'Baslanmadi', 5, null, false,
     'todo_items', null, null, null, null, 13108),

    -- ── Akış ve yerleşim (UX md.1-2) ──────────────────────────────────────────
    ('todo', 'Cadde header yığınını düşür: beta bandı kapatılabilsin, slogan gitsin, scroll''da daralsın',
     'İçerik başlamadan önce dört katman var (beta bandı ~40px + üst nav ~40px + logo bandı ~90px + sayfa başlığı ~70px = ~300px); ilk gönderi fold''un altında kalıyor. Beta bandı kapatılabilir olacak ve tercih localStorage''da tutulacak (bugün SiteHeader.tsx''te ne düğme ne saklama var), logo bandı ile sayfa başlığı tek satırda birleşecek, giriş yapmış kullanıcıya slogan gösterilmeyecek (SiteHeader.tsx:131), header scroll''da yarıya inecek. Workshop WS3 md.14-17.',
     'Dashboard, Admin & UX', 'UBT', 'Baslanmadi', 5, null, false,
     'todo_items', null, null, null, null, 13109),

    ('todo', '"Caddeye Çık" butonunu yeniden adlandır veya kaldır',
     'Kullanıcı zaten Cadde''de; sağ kolonda siyah, yüksek kontrastlı "Caddeye Çık" CTA''sı görünce ne yapacağını bilemiyor. Ölçüldü: CaddePage.tsx:1250''de yalnız scrollToComposer çağırıyor, composer ise zaten sayfada duruyor. Ya kaldırılacak ya gerçek işlevine göre adlandırılacak ("Global Akışa Geç" / "Şehir Değiştir" / "Paylaşımını Öne Çıkar"). Workshop WS3 md.18.',
     'Dashboard, Admin & UX', 'UBT', 'Baslanmadi', 5, null, false,
     'todo_items', null, null, null, null, 13110),

    -- ── Tepkiler ve boş durumlar (UX md.3-4) ──────────────────────────────────
    ('todo', 'Sıfır sayıları gizle ve boş şehirde otomatik ülke akışına düş',
     'Boş bir ağda her kartta yazan 0''lar boşluğu bağırıyor: CaddePage.tsx:974 (tepki) ve :1003 (yorum) sayıyı koşulsuz basıyor — sayı 1''e ulaşınca görünecek. Ayrıca şehri boş olan kullanıcı otomatik olarak ülke akışına veya en yakın dolu şehre düşürülecek; bugün CaddePage.tsx:1283 yalnız "ilk paylaşımı sen yapabilirsin" diyor, oysa kullanıcı ilk paylaşımı yapmaz. Boş durum dolu bir alternatif sunacak ("Berlin''deki 12 paylaşımı gör"). NOT: tepkiler 02.09''da tek tetik arkasına alındı (9af6727), 5 tip kaldı; üçe indirme kararı ayrıca değerlendirilecek. Workshop WS3 md.19-22.',
     'Dashboard, Admin & UX', 'UBT', 'Baslanmadi', 5, null, false,
     'todo_items', null, null, null, null, 13111),

    -- ── Cafe formatı — karar maddesi ──────────────────────────────────────────
    ('todo', 'KARAR: Cafe formatı async-first mi, programlı canlı slotlar mı',
     'Mevcut model 2 saatlik canlı pencere. Boş bir akış kötüdür, boş bir CANLI oda çok daha kötüdür: kullanıcı girer, kimse yoktur, süre akmaktadır, çıkar ve bir daha denemez. İki seçenek: (a) async-first — odalar 24 saat/7 gün yaşasın, "Canlı" ayrı etkinlik modu olsun; (b) programlı canlı slotlar — ad-hoc "Cafe Aç" yerine platformun duyurduğu sabit saatler ("Berlin Oturum İzni Saati, her perşembe 20:00"), Reel takvimiyle senkron. İkisi birlikte de kurulabilir. Karar verilmeden oda arayüzü işleri (payda gizleme, Arşivle''yi kebaba taşıma, süre sonu metni) yarım kalır. Workshop WS3 md.23.',
     'Strateji, Roadmap & PMO', 'B+B', 'Beklemede', 5, null, false,
     'todo_items', null, null, null, null, 13112),

    ('todo', 'Cafe oda arayüzü: paydayı gizle, Arşivle''yi kebaba taşı, süre sonu davranışını yaz',
     'Üç madde: (1) CaddeCafePage.tsx:206''daki "2/100 üye" paydası gizlenecek veya doluluk %20''yi geçince gösterilecek — sağ raydaki kart (CaddeCafesPanel.tsx:163) zaten yalnız "üye" yazıyor, iki yüzey ayrışmış. (2) CaddeCafePage.tsx:212''deki "Cafe''yi Arşivle" kebab (...) menüsüne taşınacak, ana pozisyonda "Davet Et"/"Paylaş" duracak — oda canlıyken en görünür aksiyon odayı kapatmak olmamalı. (3) Süre dolunca ne olacağı oda kartında tek satırla yazılacak; bu bilgi bugün yalnız kod yorumunda (CaddeCafePage.tsx:4), kullanıcı göremiyor ve bilmeden yazmıyor. Workshop WS3 md.24-26.',
     'Dashboard, Admin & UX', 'UBT', 'Baslanmadi', 5, null, false,
     'todo_items', null, null, null, null, 13113),

    -- ── Soğuk başlangıç — dokümanın en kritik başlığı ─────────────────────────
    ('todo', 'Cadde soğuk başlangıcı: test içeriğini temizle, dört şehri tohumla',
     'Dokümanın en kritik maddesi: "Header''ı düzeltmek 1 saatlik iş; boş akış ürünü öldürür." Doha''dan giren beta kullanıcısı akışta test gönderisi, bug raporu ve tek resmî duyuru görüyor. (1) Test gönderileri ve test cafe''leri canlı akıştan temizlenecek ("agwdhjsajkkjsddfgsegdsfsdg" açıklamalı oda Onaylı rozetiyle listeleniyor — onaylı rozetin ilk göründüğü yer test odası olmamalı). (2) Test içeriği için staging veya yalnız admin''e görünür görünürlük seviyesi kurulacak; bug raporları feedback kanalına taşınacak. (3) Berlin, Londra, Sydney, Dubai için 8-10 gerçek soru/not hazırlanıp resmî hesap veya şehir elçilerinden yayınlanacak, tarihler geriye yayılacak. İçerik zaten elde: blog ve Reel serilerindeki oturum izni, çalışma vizesi, vatandaşlık, okul denkliği, kira/kefil, yaşam maliyeti konuları doğrudan Cadde gönderisine dönüşür. Workshop WS3 md.27-31.',
     'İçerik, SEO & Sosyal Medya', 'B+B', 'Baslanmadi', 5, null, true,
     'todo_items', null, null, null, null, 13114);

  get diagnostics seeded = row_count;
  if seeded <> 14 then
    raise exception 'Cadde UX/UI denetim seed 14 satır eklemeliydi, % eklendi.', seeded;
  end if;
end;
$$;
