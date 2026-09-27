-- Seed ek: 3 Eylül 2026 (T19) — ilk seed'in atladığı maddeler.
--
-- İlk seed (20260904120000) 24 satır ekledi. 27 Eylül'de toplantının tam çıktı
-- listesi yeniden karşılaştırıldı ve dört madde ile bir fiyat ayrıntısının
-- eksik olduğu ÖLÇÜLDÜ (başlık + detay metinlerinde anahtar kelime taraması):
--   fiyat_ayrintisi (Freemium/9.90/20.90) = yok · cv_dosya = yok · sms = yok
--   Burak'ın "abonelik paket kapsamı" ve "admin paneli testi" maddeleri = yok
--
-- Uygulanmış seed değiştirilemez, bu yüzden ek dosya açıldı (T20'deki desenin aynısı).
-- T19 toplamı: 24 + 4 = 28 satır.
--
-- Ayrıca mevcut "sepet / abonelik paketi" kararının detayına fiyat kademeleri
-- İŞLENİR (yeni satır açılmaz — karar zaten var, eksik olan ayrıntısıydı).

do $$
declare
  v_eklenen int;
begin
  if exists (
    select 1 from public.command_center_items
    where item_type = 'meeting_note'
      and legacy_source_code = 'T19'
      and legacy_source_title = 'Uygun fiyatlı SMS / telefon doğrulama servisi araştır'
  ) then
    raise notice 'T19 ek seed already present, skipping.';
    return;
  end if;

  -- (1) Mevcut paketleme kararına fiyat kademelerini ekle.
  update public.command_center_items
  set detail = detail || ' Fiyat kademeleri (3 Eylül çıktısı): iki dikey abonelik paketi — Freemium · 9,90 · 20,90.'
  where item_type = 'meeting_note'
    and legacy_source_code = 'T19'
    and legacy_source_title = 'KARAR: monetizasyon tekil fiyat değil sepet / abonelik paketi'
    and detail not like '%Freemium%';

  -- (2) Eksik dört madde.
  insert into public.command_center_items
    (item_type, title, detail, category_label, assignee, status, priority, due_date, urgent,
     legacy_source_type, legacy_source_code, legacy_source_date_label, legacy_source_category, legacy_source_title, sort_order)
  values
    ('meeting_note', 'Uygun fiyatlı SMS / telefon doğrulama servisi araştır', 'Telefon doğrulaması için uygun fiyatlı bir SMS sağlayıcısı araştırılacak. Durum 27.09: bütçe 25 Eylül toplantısında onaylandı (6 haneli kod, 5 dakika geçerlilik) ama sağlayıcı seçimi yapılmadı; kodda OTP/SMS altyapısı YOK ve `phone_verified` niteliğinin hiçbir rolde kuralı olmadığı için alan hiçbir profilde çizilmiyor.', '3 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T19', '3 Eylül 2026', 'kullanici-kisitlamalari', 'Uygun fiyatlı SMS / telefon doğrulama servisi araştır', 250),
    ('meeting_note', 'CV / dosya yükleme alanına açıklayıcı bilgi ikonu ekle', 'LinkedIn ve rozet alanlarına eklenen açıklayıcı (i) ikonlarının aynısı CV / dosya yükleme alanına da eklenecek — kullanıcı alanın ne işe yaradığını üzerine gelince görsün.', '3 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T19', '3 Eylül 2026', 'mvp-hedefleri', 'CV / dosya yükleme alanına açıklayıcı bilgi ikonu ekle', 260),
    ('meeting_note', 'Abonelik paketlerinin kapsamını iki sepete paylaştır', 'Platformdaki özellikler ve gelen talepler (WhatsApp yayınlama, etkinlik oluşturma vb.) iki ayrı abonelik sepetine dağıtılıp her sepetin kapsamı netleştirilecek. Bu, "tekil fiyat değil sepet" kararının içini dolduran iştir ve Burak''tadır.', '3 Eylül 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T19', '3 Eylül 2026', 'reklam-modeli', 'Abonelik paketlerinin kapsamını iki sepete paylaştır', 270),
    ('meeting_note', 'Admin paneline yeniden girip yetkiyi test et', 'Barış yetkiyi tanımladıktan sonra Burak yeniden giriş yapıp admin erişimini doğrulayacak. (Yetki tanımlama işi UBT tarafında Tamamlandı; test Burak''ta.)', '3 Eylül 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T19', '3 Eylül 2026', 'ekip-ve-isbirligi', 'Admin paneline yeniden girip yetkiyi test et', 280);

  get diagnostics v_eklenen = row_count;
  if v_eklenen <> 4 then
    raise exception 'T19 ek seed 4 satır eklemeliydi, % eklendi.', v_eklenen;
  end if;

  if (
    select count(*) from public.command_center_items
    where item_type = 'meeting_note' and legacy_source_date_label = '3 Eylül 2026'
  ) <> 28 then
    raise exception 'T19 toplamı ek seed sonrası 28 satır olmalıydı.';
  end if;
end
$$;
