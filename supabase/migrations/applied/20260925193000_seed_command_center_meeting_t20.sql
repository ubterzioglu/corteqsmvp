-- Seed: 21 Eylül 2026 toplantısı -> command_center_items (item_type=meeting_note)
-- Kaynak toplantı: T20 (21 Eylül 2026). T19 = 3 Eylül zaten kullanımda.
-- Assignee eşlemesi: UBT'nin maddeleri -> UBT, Burak'ın maddeleri -> Burak,
-- ortak alınan kararlar -> B+B (mig 20260830120000 ile CHECK'e eklendi).
-- Burak'ın "istedi" dediği ve işi UBT'nin yapacağı maddeler UBT'ye yazıldı; detayda
-- "Burak'ın isteği" notu durur. Burak'ın ortaya koyduğu fikirler Burak/Beklemede.
-- 16 yapılacak + 2 fikir (Beklemede) + 6 karar (B+B / Beklemede) = 24 satır.
-- Kategori (legacy_source_category) mevcut 9 MEETING_CATEGORIES kimliğinden seçildi.
-- Idempotent guard: legacy_source_date_label = '21 Eylül 2026'.
--
-- Toplantının en önemli kararı: önce "her şeyi eklemek" yerine mevcut modülleri
-- çalışır + düzgün UI + test edilebilir hâle getirip ilk sprinti bitirmek; ardından
-- Cadde + Profil tarafına dönmek.

do $$
begin
  if exists (
    select 1 from public.command_center_items
    where item_type = 'meeting_note'
      and legacy_source_date_label = '21 Eylül 2026'
  ) then
    raise notice 'T20 (21 Eylül 2026) seed already present, skipping.';
    return;
  end if;

  insert into public.command_center_items
    (item_type, title, detail, category_label, assignee, status, priority, due_date, urgent,
     legacy_source_type, legacy_source_code, legacy_source_date_label, legacy_source_category, legacy_source_title, sort_order)
  values
    -- ── UBT — Kadro / Profil ve revizyon akışı ──────────────────────────────────
    ('meeting_note', 'Kadro/profil artefact çalışmasını küçük parçalara böl', 'Kadro ve profil artefact çalışması büyük tek iş olarak değil, küçük ve bağımsız incelenebilir parçalar hâlinde ilerletilecek.', '21 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'mvp-hedefleri', 'Kadro/profil artefact çalışmasını küçük parçalara böl', 10),
    ('meeting_note', 'Tamamlanan ana başlıkları Burak''a incelemeye aktar', 'Kadro/profil çalışmasında tamamlanan her ana başlık Burak''a inceleme için aktarılacak.', '21 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'ekip-ve-isbirligi', 'Tamamlanan ana başlıkları Burak''a incelemeye aktar', 20),
    ('meeting_note', 'Burak''ın revizyonlarını ana plana ekle ve sırayla uygula', 'Burak''ın incelemeden çıkan revizyonları ana plana işlenecek ve sırayla uygulanacak.', '21 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'ekip-ve-isbirligi', 'Burak''ın revizyonlarını ana plana ekle ve sırayla uygula', 30),
    ('meeting_note', 'Revizyonlara dosya yükleme özelliği ekle', 'Revizyon isteklerine dosya eklenebilecek. Bugünkü durum: revizyon ekranı yalnız görsel (image/*) kabul ediyor; belge/dosya yükleme yok.', '21 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'mvp-hedefleri', 'Revizyonlara dosya yükleme özelliği ekle', 40),
    ('meeting_note', 'Role switching davranışını kontrol et, dokümantasyonu güncelle', 'Rol değiştirme (role switching) davranışı kontrol edilip netleştirilecek ve dokümantasyon buna göre güncellenecek.', '21 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'kullanici-kisitlamalari', 'Role switching davranışını kontrol et, dokümantasyonu güncelle', 50),

    -- ── UBT — Radar, RAG ve AI ──────────────────────────────────────────────────
    ('meeting_note', 'Radar API key''lerini test et, Radar''ı yeniden çalıştır', 'Radar haber taramasının API key''leri test edilecek ve Radar yeniden çalışır hâle getirilecek.', '21 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'mvp-hedefleri', 'Radar API key''lerini test et, Radar''ı yeniden çalıştır', 60),
    ('meeting_note', 'RAG kütüphanesini oluştur: ülkeler / şehirler / konular', 'Ülke, şehir ve konu başlıklarından oluşan RAG kütüphanesi hazırlanıp bilgi tabanına eklenecek. Bugünkü durum: ai_knowledge_documents korpusunda yalnız catalog + blog kaynakları var.', '21 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'veritabani-tasarimi', 'RAG kütüphanesini oluştur: ülkeler / şehirler / konular', 70),
    ('meeting_note', 'Sayfa kullanım kılavuzlarını üret ve RAG''e aktar', 'Her sayfa için kullanım kılavuzu üretilecek ve RAG''e aktarılacak; bot bu kılavuzları kullanarak kullanıcıya sayfanın nasıl kullanılacağını anlatacak (Burak''ın isteği).', '21 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'mvp-hedefleri', 'Sayfa kullanım kılavuzlarını üret ve RAG''e aktar', 80),
    ('meeting_note', 'Sağ altta sürekli çalışan sayfa bazlı AI yardımcı bot', 'Sağ altta her sayfada çalışan AI yardımcı bot altyapısı hazırlanacak; bot bulunduğu sayfanın nasıl kullanılacağını anlatabilecek. Bugünkü durum: site-assistant fonksiyonu ve bilgi tabanı 21 Eylül''de canlıya alındı; sayfa bağlamı ve kılavuzlar henüz yok.', '21 Eylül 2026', 'UBT', 'Devam ediyor', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'mvp-hedefleri', 'Sağ altta sürekli çalışan sayfa bazlı AI yardımcı bot', 90),
    ('meeting_note', 'Arama klasik aramadan konuşmalı AI Search''e dönüşsün', 'Burak''ın isteği: arama RAG + LLM hibrit, konuşmalı bir AI Search olacak. "Washington Konsolosluğu" gibi doğal dil sorgularını anlayacak, sonuç hakkında konuşabilecek ve kayıt olma gibi durumlarda kullanıcıyı doğru sayfaya yönlendirecek.', '21 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'mvp-hedefleri', 'Arama klasik aramadan konuşmalı AI Search''e dönüşsün', 100),

    -- ── UBT — Cadde ve içerik ───────────────────────────────────────────────────
    ('meeting_note', 'Cadde workshop transcriptini yeniden tara, eksik revizyonları plana ekle', 'Cadde workshop transcripti tekrar taranacak; yapılmamış kalan revizyonlar plana eklenecek (UBT + Burak''ın isteği).', '21 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'mvp-hedefleri', 'Cadde workshop transcriptini yeniden tara, eksik revizyonları plana ekle', 110),
    ('meeting_note', 'Cadde edit/delete, bildirim ve kalan workshop revizyonlarını tamamla', 'Burak''ın isteği: Cadde''de gönderi düzenleme/silme, bildirimler ve workshop''ta kalan diğer revizyonlar tamamlanacak.', '21 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'mvp-hedefleri', 'Cadde edit/delete, bildirim ve kalan workshop revizyonlarını tamamla', 120),
    ('meeting_note', 'Cadde davet kodu profilde görünsün, davet/katılım bildirimleri eklensin', 'Burak''ın isteği: kullanıcının Cadde davet kodu profilinde görünecek; davet gönderildiğinde ve davet edilen kişi katıldığında bildirim gidecek.', '21 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'topluluk-yonetimi', 'Cadde davet kodu profilde görünsün, davet/katılım bildirimleri eklensin', 130),
    ('meeting_note', 'Guides sayfasını içerikle doldur', 'Guides (rehberler) sayfasına daha fazla içerik eklenecek (UBT + Burak''ın isteği).', '21 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'topluluk-yonetimi', 'Guides sayfasını içerikle doldur', 140),

    -- ── Burak Akcakanat ─────────────────────────────────────────────────────────
    ('meeting_note', 'İlk sprinti "mevcut araçlar + paneller + revizyonlar çalışır" olarak kapat', 'İlk sprintin kapanış ölçütü: mevcut araçlar, paneller ve revizyonlar çalışır durumda olacak. Burak kapanışı takip edecek.', '21 Eylül 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'mvp-hedefleri', 'İlk sprinti "mevcut araçlar + paneller + revizyonlar çalışır" olarak kapat', 150),
    ('meeting_note', 'Kadro/profil parçalarını incele, yeni revizyonları sisteme gir', 'Kadro/profil revizyonları küçük parçalar hâlinde takip edilecek; tamamlanan her parça incelenip çıkan yeni revizyonlar sisteme girilecek.', '21 Eylül 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'ekip-ve-isbirligi', 'Kadro/profil parçalarını incele, yeni revizyonları sisteme gir', 160),
    ('meeting_note', 'FİKİR: rol başvurusunda bot gerekli belgeleri hatırlatsın', 'Burak''ın fikri: kullanıcı bir role başvururken AI bot o rol için gerekli belgeleri kullanıcıya hatırlatacak. Karar verilmedi, değerlendirme bekliyor.', '21 Eylül 2026', 'Burak', 'Beklemede', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'kullanici-kisitlamalari', 'FİKİR: rol başvurusunda bot gerekli belgeleri hatırlatsın', 170),
    ('meeting_note', 'FİKİR: Cadde çalışınca WhatsApp bekleyenleri Cadde''ye yönlendir, Instagram''da tanıt', 'Burak''ın fikri: Cadde çalışır hâle geldiğinde WhatsApp''ta bekleyen kullanıcılar Cadde''ye yönlendirilecek ve Instagram üzerinden Cadde tanıtımı yapılacak. Zamanlama Cadde''nin hazır olmasına bağlı.', '21 Eylül 2026', 'Burak', 'Beklemede', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'influencer-partnerlikleri', 'FİKİR: Cadde çalışınca WhatsApp bekleyenleri Cadde''ye yönlendir, Instagram''da tanıt', 180),

    -- ── Ortak kararlar (B+B) ────────────────────────────────────────────────────
    ('meeting_note', 'KARAR: önce mevcut sistem çalışır + düzgün UI + test edilebilir, sonra Cadde + Profil', 'Toplantının en önemli kararı: "her şeyi eklemek" yerine mevcut modüller çalışır, düzgün arayüzlü ve test edilebilir hâle getirilip ilk sprint bitirilecek. Profil revizyonları tamamlandıktan sonra yeniden Cadde + Profil''e odaklanılacak.', '21 Eylül 2026', 'B+B', 'Beklemede', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'mvp-hedefleri', 'KARAR: önce mevcut sistem çalışır + düzgün UI + test edilebilir, sonra Cadde + Profil', 190),
    ('meeting_note', 'KARAR: büyük işler küçük parçalara bölünerek ilerleyecek', 'Çalışma yöntemi: büyük işler küçük parçalara bölünecek; her parça tamamlandıkça incelemeye gidecek ve revizyonlar sıraya alınacak.', '21 Eylül 2026', 'B+B', 'Beklemede', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'ekip-ve-isbirligi', 'KARAR: büyük işler küçük parçalara bölünerek ilerleyecek', 200),
    ('meeting_note', 'KARAR: arama RAG + LLM hibrit konuşmalı arama olacak', 'AI Search yaklaşımı RAG + LLM hibrit, konuşmalı arama olarak belirlendi. Bilgi tabanına ülke, şehir, konu ve platform kullanım kılavuzları eklenecek; sayfa içinde sağ altta kullanıcıya yardım eden bot bu tabanı kullanacak.', '21 Eylül 2026', 'B+B', 'Beklemede', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'mvp-hedefleri', 'KARAR: arama RAG + LLM hibrit konuşmalı arama olacak', 210),
    ('meeting_note', 'KARAR: Radar yeniden çalıştırılacak, role switching netleştirilecek', 'Radar API key''leri test edilip yeniden çalıştırılacak. Role switching davranışı netleştirilip belgelenecek.', '21 Eylül 2026', 'B+B', 'Beklemede', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'kullanici-kisitlamalari', 'KARAR: Radar yeniden çalıştırılacak, role switching netleştirilecek', 220),
    ('meeting_note', 'KARAR: Subscription ve Founder tarafı traction sonrası kontrollü açılacak', 'Subscription ve Founder tarafı, Cadde/ürün traction kazandıktan sonra daha kontrollü açılacak.', '21 Eylül 2026', 'B+B', 'Beklemede', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'reklam-modeli', 'KARAR: Subscription ve Founder tarafı traction sonrası kontrollü açılacak', 230),
    ('meeting_note', 'KARAR: ilk dönemde düşük fiyat / €1 giriş modeli test edilebilir', 'Fiyatlandırma: ilk dönemde düşük fiyatlı (€1 gibi) bir giriş modeli test edilebilir. Kesin kararın veriyle verilmesi gerektiği vurgulandı; bu henüz fiyat kararı değildir.', '21 Eylül 2026', 'B+B', 'Beklemede', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'reklam-modeli', 'KARAR: ilk dönemde düşük fiyat / €1 giriş modeli test edilebilir', 240);

  -- Seed sayısını doğrula: eksik/fazla satır sessizce geçmesin (WS2 seed dersi).
  if (
    select count(*) from public.command_center_items
    where item_type = 'meeting_note' and legacy_source_date_label = '21 Eylül 2026'
  ) <> 24 then
    raise exception 'T20 seed 24 satır eklemeliydi.';
  end if;
end
$$;
