-- Komuta Merkezi: "şişman" todoları ayrı todolara böl (2026-08-04)
--
-- Sorun: 13 Mayıs toplantı import paketinden gelen bazı command_center_items kayıtlarının
-- detail alanı 8-13 adet "- [ ]" maddesi taşıyor. Tek satırda bu kadar iş birimi olunca
-- kayıt ne atanabiliyor ne durumu takip edilebiliyor.
--
-- Kapsam: yalnızca AÇIK (Baslanmadi/Beklemede) 3 todo bölünür -> 11 yeni todo.
--   * Tamamlanmış 9 şişman kayda dokunulmaz (bölmek listeye ~90 "Tamamlandi" satırı ekler).
--   * "13 Mayıs Toplantı Kararları" (meeting_note) bölünmez: içeriği karar, todo değil ve
--     kararların todo karşılıkları listede zaten ayrı kayıt olarak Tamamlandi durumunda.
--
-- Bölme kürasyonludur, mekanik değil: alt kırılım maddeleri ("İşletmeler.", "Dernekler.")
-- ayrı todo olmaz, ilgili todonun detayında liste olarak kalır. 30 kaynak maddenin tamamı
-- ya bir başlığa ya bir detaya taşınır -- kayıp madde yoktur.
--
-- Çocuk kayıtlar ebeveynin kategori/atama/prio/acil/due_date/sort_order alanlarını devralır,
-- durumları Baslanmadi olur. Ebeveynler arşive kaldırılır (silinmez).
--
-- Idempotent: legacy_source_title UNIQUE olduğu için ON CONFLICT DO NOTHING çift kayıt
-- üretmez; ebeveyn UPDATE'leri "archived_at is null" koşuluyla notu ikinci kez eklemez.
--
-- Türkçe içerik: bu dosya UTF-8'dir ve psql'e -f ile verilmelidir. Metinler dollar-quote
-- ($t$ / $d$) ile sarılmıştır -- Türkçe kesme işareti ("dashboard'a", "FAQ'yı") tek tırnak
-- kaçışı gerektirmesin diye.

begin;

-- ---------------------------------------------------------------------------
-- 1) "WhatsApp grubu ekleme politikasını netleştir" (9 madde) -> 5 todo
--    Burak · prio 9 · ACİL · Topluluk, Referral & Onboarding · due 2026-05-19
-- ---------------------------------------------------------------------------
insert into public.command_center_items (
  item_type, title, detail, category_label, assignee, status, priority, due_date, urgent,
  legacy_source_type, legacy_source_code, legacy_source_date_label, legacy_source_category,
  legacy_source_title, sort_order
)
select
  'todo',
  c.title,
  c.detail || E'\n\nBölündü: "' || p.title || E'" · Import Kaynağı: 13 Mayıs toplantı todo paketi',
  p.category_label,
  p.assignee,
  'Baslanmadi',
  p.priority,
  p.due_date,
  p.urgent,
  'todo_items',
  p.legacy_source_code,
  p.legacy_source_date_label,
  p.legacy_source_category,
  c.slug,
  p.sort_order
from public.command_center_items p
cross join (values
  (
    'cc-split-2026-08-04-whatsapp-grup-politikasi-01',
    $t$WhatsApp grubu ekleme platform politikasını yaz$t$,
    $d$- [ ] WhatsApp grubu ekleme özelliği için platform politikası yaz.
- [ ] Grup admini olmayanların gönderisinin de moderasyona düşeceğini netleştir.
- [ ] Yayına alınacak gruplarda kalite ve güvenlik kriterlerini belirle.$d$
  ),
  (
    'cc-split-2026-08-04-whatsapp-grup-politikasi-02',
    $t$Grup onay akışlarını belirle (açık davet linkli / kapalı gruplar)$t$,
    $d$- [ ] Grup admini onayı gerekiyorsa bunun nasıl alınacağını tarif et.
- [ ] Açık davet linkli gruplar için basit onay akışı belirle.
- [ ] Kapalı gruplar için adminle manuel iletişim akışı belirle.$d$
  ),
  (
    'cc-split-2026-08-04-whatsapp-grup-politikasi-03',
    $t$Grup ekleme formundaki alanları Barış ile netleştir$t$,
    $d$- [ ] Grup ekleme formundaki alanları Barış ile netleştir.$d$
  ),
  (
    'cc-split-2026-08-04-whatsapp-grup-politikasi-04',
    $t$Contributorlardan kendi şehirlerindeki WhatsApp gruplarını toplamalarını iste$t$,
    $d$- [ ] Contributorların kendi şehirlerindeki WhatsApp gruplarını bulmasını iste.$d$
  ),
  (
    'cc-split-2026-08-04-whatsapp-grup-politikasi-05',
    $t$"Bildiğiniz faydalı WhatsApp gruplarını ekleyin" sosyal medya mesajını hazırla$t$,
    $d$- [ ] "Bildiğiniz faydalı WhatsApp gruplarını ekleyin" mesajını sosyal medya için hazırla.$d$
  )
) as c(slug, title, detail)
where p.id = '1c0dc021-2621-493d-8ae1-6eee93bf578c'
on conflict (legacy_source_title) do nothing;

-- ---------------------------------------------------------------------------
-- 2) "Contributor kaynak toplama sistemi taslağı hazırla" (13 madde) -> 2 todo
--    Burak · prio 6 · Topluluk, Referral & Onboarding
--    13 maddenin 10'u ilk maddenin alt listesiydi; kaynak tipleri detaya taşındı.
-- ---------------------------------------------------------------------------
insert into public.command_center_items (
  item_type, title, detail, category_label, assignee, status, priority, due_date, urgent,
  legacy_source_type, legacy_source_code, legacy_source_date_label, legacy_source_category,
  legacy_source_title, sort_order
)
select
  'todo',
  c.title,
  c.detail || E'\n\nBölündü: "' || p.title || E'" · Import Kaynağı: 13 Mayıs toplantı todo paketi',
  p.category_label,
  p.assignee,
  'Baslanmadi',
  p.priority,
  p.due_date,
  p.urgent,
  'todo_items',
  p.legacy_source_code,
  p.legacy_source_date_label,
  p.legacy_source_category,
  c.slug,
  p.sort_order
from public.command_center_items p
cross join (values
  (
    'cc-split-2026-08-04-contributor-kaynak-toplama-01',
    $t$Contributorların toplayacağı kaynak tiplerini listele$t$,
    $d$- [ ] Contributorların toplayacağı kaynak tiplerini listele.

Kaynak tipleri: işletmeler, danışmanlar, dernekler, WhatsApp grupları, influencerlar, etkinlikler, yerel Facebook grupları, yerel Instagram sayfaları, yerel profesyonel topluluklar, yerel hizmet sağlayıcılar.$d$
  ),
  (
    'cc-split-2026-08-04-contributor-kaynak-toplama-02',
    $t$Kaynakların dashboard'a giriş sürecini yaz$t$,
    $d$- [ ] Bu kaynakların ileride dashboard'a nasıl girileceğini anlatan kısa süreç yaz.

Kısıt: Şimdilik "kaydet, listele, bize ilet" prensibi geçerli.$d$
  )
) as c(slug, title, detail)
where p.id = 'a72bf604-11bd-471f-a101-73a32c85b93b'
on conflict (legacy_source_title) do nothing;

-- ---------------------------------------------------------------------------
-- 3) "Contributor soru-cevap dokümanı oluştur" (8 madde) -> 4 todo
--    Burak · prio 6 · Dokümantasyon, Drive & Operasyon
--    FAQ yazım kuralları (net ama bağlayıcı olmayan cevaplar, kesinleşmeyen konular)
--    ayrı todo değil, "FAQ dokümanını yaz" maddesinin detayıdır.
-- ---------------------------------------------------------------------------
insert into public.command_center_items (
  item_type, title, detail, category_label, assignee, status, priority, due_date, urgent,
  legacy_source_type, legacy_source_code, legacy_source_date_label, legacy_source_category,
  legacy_source_title, sort_order
)
select
  'todo',
  c.title,
  c.detail || E'\n\nBölündü: "' || p.title || E'" · Import Kaynağı: 13 Mayıs toplantı todo paketi',
  p.category_label,
  p.assignee,
  'Baslanmadi',
  p.priority,
  p.due_date,
  p.urgent,
  'todo_items',
  p.legacy_source_code,
  p.legacy_source_date_label,
  p.legacy_source_category,
  c.slug,
  p.sort_order
from public.command_center_items p
cross join (values
  (
    'cc-split-2026-08-04-contributor-soru-cevap-01',
    $t$Contributor sorularını topla (toplantı + WhatsApp)$t$,
    $d$- [ ] Toplantıda gelen soruları not al.
- [ ] WhatsApp grubunda gelen soruları ayrıca topla.$d$
  ),
  (
    'cc-split-2026-08-04-contributor-soru-cevap-02',
    $t$Soruları konu başlıklarına göre tasnif et$t$,
    $d$- [ ] Soruları konu başlıklarına göre ayır.$d$
  ),
  (
    'cc-split-2026-08-04-contributor-soru-cevap-03',
    $t$FAQ dokümanını yaz$t$,
    $d$- [ ] Aynı sorular tekrar gelmesin diye FAQ formatına getir.
- [ ] Çalışma modeli, gelir modeli, görev paylaşımı, şehir sahipliği gibi konuları FAQ'ya ekle.
- [ ] Cevapları net ama bağlayıcı olmayacak şekilde yaz.
- [ ] Henüz kesinleşmeyen konular için "bu konu ayrıca netleştirilecek" de.$d$
  ),
  (
    'cc-split-2026-08-04-contributor-soru-cevap-04',
    $t$FAQ'yı tüm contributorlara yazılı olarak paylaş$t$,
    $d$- [ ] Tüm contributorlara yazılı cevap olarak paylaş.$d$
  )
) as c(slug, title, detail)
where p.id = '0991dab8-5683-4d15-afbe-6b886ec5fac4'
on conflict (legacy_source_title) do nothing;

-- ---------------------------------------------------------------------------
-- 4) Ebeveynleri arşive kaldır (silme DEĞİL -- Arşiv görünümünde tam metniyle kalır)
-- ---------------------------------------------------------------------------
update public.command_center_items
set
  archived_at = now(),
  updated_at = now(),
  detail = detail || E'\n\n[2026-08-04] Bu kayıt 5 ayrı todoya bölündü ve arşivlendi.'
where id = '1c0dc021-2621-493d-8ae1-6eee93bf578c'
  and archived_at is null;

update public.command_center_items
set
  archived_at = now(),
  updated_at = now(),
  detail = detail || E'\n\n[2026-08-04] Bu kayıt 2 ayrı todoya bölündü ve arşivlendi.'
where id = 'a72bf604-11bd-471f-a101-73a32c85b93b'
  and archived_at is null;

update public.command_center_items
set
  archived_at = now(),
  updated_at = now(),
  detail = detail || E'\n\n[2026-08-04] Bu kayıt 4 ayrı todoya bölündü ve arşivlendi.'
where id = '0991dab8-5683-4d15-afbe-6b886ec5fac4'
  and archived_at is null;

commit;
