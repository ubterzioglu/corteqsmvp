-- Seed ek: 25 Eylül 2026 (T21) — resmi toplantı çıktısıyla karşılaştırma sonrası.
--
-- İlk T21 seed'i (20260925195000) transkriptin yalnız ilk ~55/80 dakikasından
-- kuruldu (28 satır). 27 Eylül'de resmi çıktı listesi geldi; son bölümde alınan
-- ÜÇ KARAR ile iki iş maddesi eksikti. T21 toplamı: 28 + 6 = 34 satır.
--
-- ⚠️ EN ÖNEMLİSİ — SUPABASE PRO KARARI UYGULANMAMIŞ:
--    Toplantıda "kaynak yetersizliği ve fallback hatalarını engellemek için Pro'ya
--    yükseltildi, 25 $ onaylandı" deniyor. 27 Eylül ölçümü (Management API
--    /billing/addons): "selected_addons": [] — yani compute eklentisi YOK, örnek
--    hâlâ en küçük katmanda (~426 MB). Karar alınmış, işlem yapılmamış.
--    Bu, aynı toplantıda şikâyet edilen Cadde yüklenme sorununun doğrudan sebebi.

do $$
declare
  v_eklenen int;
begin
  if exists (
    select 1 from public.command_center_items
    where item_type = 'meeting_note'
      and legacy_source_code = 'T21'
      and legacy_source_title = 'KARAR: Supabase Pro pakete yükseltilecek (25 $ onaylandı)'
  ) then
    raise notice 'T21 ek seed already present, skipping.';
    return;
  end if;

  -- SMS bütçe kararına kesinleşen tutarı işle (ilk seed "netleştirilmeli" diyordu).
  update public.command_center_items
  set detail = detail || ' Kesinleşen tutar (resmi çıktı): 20–25 € başlangıç bütçe limiti.'
  where item_type = 'meeting_note'
    and legacy_source_code = 'T21'
    and legacy_source_title = 'KARAR: SMS telefon doğrulama bütçesi onaylandı'
    and detail not like '%20–25 €%';

  -- Cadde yüklenme maddesine 27 Eylül'deki kök neden bulgusunu işle.
  update public.command_center_items
  set detail = detail || ' ✅ KÖK NEDEN BULUNDU (27.09): (a) yorum kutusunda olay nesnesi durum güncelleyicisinin içinde okunuyordu, sayfa tamamen düşüyordu — düzeltildi; (b) bilgi tabanı araması vektör indeksini kullanmıyor, her sorgu 4.794 satırı tarayıp belleği tahliye ediyordu — düzeltildi; (c) asıl kapasite sorunu sürüyor: Pro yükseltmesi kararı UYGULANMAMIŞ.'
  where item_type = 'meeting_note'
    and legacy_source_code = 'T21'
    and legacy_source_title = 'Toplantıda Cadde akışı ve revizyon sayfası yüklenmedi — kök nedeni bul'
    and detail not like '%KÖK NEDEN BULUNDU%';

  insert into public.command_center_items
    (item_type, title, detail, category_label, assignee, status, priority, due_date, urgent,
     legacy_source_type, legacy_source_code, legacy_source_date_label, legacy_source_category, legacy_source_title, sort_order)
  values
    ('meeting_note', 'KARAR: Supabase Pro pakete yükseltilecek (25 $ onaylandı)', 'Veritabanında kaynak yetersizliği ve yedek/hata düşüşlerini engellemek için Supabase paketi Pro seviyesine yükseltilecek; 25 $ onaylandı. ⚠️ ÖLÇÜM 27.09: yükseltme YAPILMAMIŞ — faturalandırma eklentileri listesi boş, örnek hâlâ en küçük katmanda (~426 MB). Cadde akışının zaman aşımına uğramasının asıl sebebi budur.', '25 Eylül 2026', 'B+B', 'Beklemede', 8, null, true, 'meeting_notes', 'T21', '25 Eylül 2026', 'veritabani-tasarimi', 'KARAR: Supabase Pro pakete yükseltilecek (25 $ onaylandı)', 290),
    ('meeting_note', 'Supabase Pro yükseltmesini ve ödemesini tamamla', 'Pro paket yükseltmesi ve ödeme adımları tamamlanacak. ⚠️ 27 Eylül itibarıyla YAPILMADI. Ölçülen etkisi: bilgi tabanı 83 MB''a çıktıktan sonra bellek baskısı arttı; Cadde akışı normalde 278 ms sürerken tepe anlarında 7.195 ms''ye çıkıp 8 saniyelik sınıra dayanıyor, cron yazmaları 109 saniyeye kadar uzuyor.', '25 Eylül 2026', 'UBT', 'Baslanmadi', 8, null, true, 'meeting_notes', 'T21', '25 Eylül 2026', 'veritabani-tasarimi', 'Supabase Pro yükseltmesini ve ödemesini tamamla', 300),
    ('meeting_note', 'KARAR: ücretli abonelik 1 Ocak 2027''de yürürlüğe girecek', 'Ücretli abonelik sistemi 1 Ocak 2027 itibarıyla yürürlüğe girecek. Öncesinde paketler vitrinde gösterilecek ama lansman indirimi veya geçici ücretsiz kullanım ibareleriyle sunulacak. (M19)', '25 Eylül 2026', 'B+B', 'Beklemede', 5, null, false, 'meeting_notes', 'T21', '25 Eylül 2026', 'reklam-modeli', 'KARAR: ücretli abonelik 1 Ocak 2027''de yürürlüğe girecek', 310),
    ('meeting_note', 'KARAR: dış kaynaklı listeler "sahiplenilebilir" kayıt olarak duracak', 'Toplanan Instagram etkileyici verileri ve üniversite toplulukları için doğrudan resmî hesap açılmayacak; aramalarda çıkabilen "sahipsiz kayıt" statüsü kurgulanacak ve "Bu profil sizin mi? Sahiplenin" modeli benimsenecek.', '25 Eylül 2026', 'B+B', 'Beklemede', 5, null, false, 'meeting_notes', 'T21', '25 Eylül 2026', 'topluluk-yonetimi', 'KARAR: dış kaynaklı listeler "sahiplenilebilir" kayıt olarak duracak', 320),
    ('meeting_note', 'KARAR: "Yetki yükleniyor" yerine sade "Yükleniyor" yazacak', 'Sayfa ve yetki geçişlerinde beliren "Yetki yükleniyor" ifadesi kaldırılıp yerine standart "Yükleniyor" metni yazılacak. (Uygulaması 27 Eylül''de yapıldı ve yayına alındı.)', '25 Eylül 2026', 'B+B', 'Beklemede', 5, null, false, 'meeting_notes', 'T21', '25 Eylül 2026', 'mvp-hedefleri', 'KARAR: "Yetki yükleniyor" yerine sade "Yükleniyor" yazacak', 330),
    ('meeting_note', 'Abonelik sayfası kapsamını hazırla (1 Ocak öncesi vitrin)', '1 Ocak öncesinde vitrinde yer alacak paket ayrıntıları ve abonelik sayfası içeriği hazırlanıp Barış''a iletilecek. Not: sitede henüz hiç ödeme adımı yok, bu yüzden vitrin metni ile gerçek akış arasındaki fark yazılırken netleşmeli.', '25 Eylül 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T21', '25 Eylül 2026', 'reklam-modeli', 'Abonelik sayfası kapsamını hazırla (1 Ocak öncesi vitrin)', 340);

  get diagnostics v_eklenen = row_count;
  if v_eklenen <> 6 then
    raise exception 'T21 ek seed 6 satır eklemeliydi, % eklendi.', v_eklenen;
  end if;

  if (
    select count(*) from public.command_center_items
    where item_type = 'meeting_note' and legacy_source_date_label = '25 Eylül 2026'
  ) <> 34 then
    raise exception 'T21 toplamı ek sonrası 34 satır olmalıydı.';
  end if;
end
$$;
