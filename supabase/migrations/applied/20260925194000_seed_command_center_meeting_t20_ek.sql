-- Seed ek: 21 Eylül 2026 toplantısı (T20) — tam transkriptten çıkan eksik maddeler.
-- İlk seed (20260925193000) toplantı ÖZETİNDEN kuruldu (24 satır). Tam transkript
-- gelince özetin atladığı 7 madde bulundu; ilk seed üretimde değiştirilemeyeceği
-- için ayrı migration ile eklenir. T20 toplamı: 24 + 7 = 31 satır.
-- Idempotent guard: bu dosyanın ilk satırının legacy_source_title'ı.

do $$
begin
  if exists (
    select 1 from public.command_center_items
    where item_type = 'meeting_note'
      and legacy_source_code = 'T20'
      and legacy_source_title = 'Taşınma planlayıcısına "Demo" etiketi ekle'
  ) then
    raise notice 'T20 ek seed (21 Eylül 2026) already present, skipping.';
    return;
  end if;

  insert into public.command_center_items
    (item_type, title, detail, category_label, assignee, status, priority, due_date, urgent,
     legacy_source_type, legacy_source_code, legacy_source_date_label, legacy_source_category, legacy_source_title, sort_order)
  values
    ('meeting_note', 'Taşınma planlayıcısına "Demo" etiketi ekle', 'Arkasına henüz gerçek bilgi bağlı olmadığı için taşınma planlayıcısı "demo" olarak işaretlenecek. Durum: /relocation 22 Eylül''de DEMO_ROUTES listesine eklendi, sayfada demo bandı ve rozeti görünüyor.', '21 Eylül 2026', 'UBT', 'Tamamlandi', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'mvp-hedefleri', 'Taşınma planlayıcısına "Demo" etiketi ekle', 250),
    ('meeting_note', 'Taşınma planlayıcısını işlevsel olarak doldur ve RAG bilgisine bağla', 'Burak: planlayıcı görünüşünden öte işlevsel olarak da dolmalı; UBT: arka tarafına RAG bilgileri gelecek, görünümü de beğenilmedi. Toplantıda görülen "Bir hata oluştu" çökmesi 25 Eylül''de düzeltildi; içerik ve RAG bağlantısı hâlâ yok.', '21 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'mvp-hedefleri', 'Taşınma planlayıcısını işlevsel olarak doldur ve RAG bilgisine bağla', 260),
    ('meeting_note', 'Siteye Facebook linki ekle', 'Toplantıda aksiyon olarak alındı. Not: footer''da facebook.com/corteqs bağlantısı Mayıs''tan beri var — linkin başka nereye (başlık, paylaşım, iletişim) istendiği netleşmeli.', '21 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'topluluk-yonetimi', 'Siteye Facebook linki ekle', 270),
    ('meeting_note', 'Etkinlik formunda "Kapak görseli URL" alanını anlaşılır yap', 'Burak: kullanıcı "kapak görseli URL" alanını anlamaz; görselini yüklemek ister. Ya doğrudan görsel yükleme olacak ya da sağ alttaki bot ne yapılacağını anlatacak (ör. "görselinizi Drive''a yükleyin, linkini buraya yapıştırın").', '21 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'mvp-hedefleri', 'Etkinlik formunda "Kapak görseli URL" alanını anlaşılır yap', 280),
    ('meeting_note', 'Toplantı notlarını Umut''a gönder', 'Toplantı çıktıları ve notları Umut''a (UBT) gönderilecek. Durum: özet ve tam transkript 25 Eylül''de iletildi ve Komuta Merkezi''ne işlendi.', '21 Eylül 2026', 'Burak', 'Tamamlandi', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'ekip-ve-isbirligi', 'Toplantı notlarını Umut''a gönder', 290),
    ('meeting_note', 'FİKİR: Jukebox — Cadde için viral / word of mouth özelliği', 'Cadde açılırken ağızdan ağıza yayılacak viral bir özellik olarak Jukebox fikri. Cadde aşamasına park edildi; şimdilik iş değil.', '21 Eylül 2026', 'Burak', 'Beklemede', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'topluluk-yonetimi', 'FİKİR: Jukebox — Cadde için viral / word of mouth özelliği', 300),
    ('meeting_note', 'KARAR: Cadde dönmeye başlayınca Kurucu 1000 için Stripe açılacak', 'Cadde çalışır hâle gelip WhatsApp ve Instagram''dan insanlar çağrılmaya başlanınca Kurucu 1000 (Founding 1000) için Stripe ödemesi açılabilir. Fiyat 399 € yerine 99 €; ödeme şimdi alınır, 12 aylık süre 1 Ocak''tan başlar. Sayfadaki "29 Ekim" tarihi Burak tarafından silindi. İlk yılın hedefi gelir değil traction + retention.', '21 Eylül 2026', 'B+B', 'Beklemede', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'reklam-modeli', 'KARAR: Cadde dönmeye başlayınca Kurucu 1000 için Stripe açılacak', 310);

  if (
    select count(*) from public.command_center_items
    where item_type = 'meeting_note' and legacy_source_date_label = '21 Eylül 2026'
  ) <> 31 then
    raise exception 'T20 toplamı ek seed sonrası 31 satır olmalıydı.';
  end if;
end
$$;
