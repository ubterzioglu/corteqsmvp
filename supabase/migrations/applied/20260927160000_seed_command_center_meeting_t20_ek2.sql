-- Seed ek #2: 21 Eylül 2026 (T20) — resmi toplantı çıktısıyla karşılaştırma sonrası.
--
-- T20 iki aşamada kuruldu: özetten 24 satır (20260925193000), tam transkriptten
-- 7 satır (20260925194000) = 31. 27 Eylül'de toplantının RESMİ ÇIKTI LİSTESİ
-- geldi ve karşılaştırıldı; iki sınıf eksik bulundu:
--
-- (a) BURAK'IN DÖRT MADDESİ HİÇ YOKTU. Resmi listede bunlar Burak'ta; bizde yalnız
--     UBT'nin teknik karşılıkları vardı. İkisi AYRI iştir ve ikisi de durmalıdır:
--       Burak içeriği/kararı üretir  →  UBT uygular.
--     Örnek: "RAG kütüphanesi için ülke/şehir/konsolosluk içeriği hazırla" (Burak)
--     ile "RAG kütüphanesini oluştur" (UBT) aynı madde değildir. UBT'nin satırları
--     DEĞİŞTİRİLMEZ, Burak'ınkiler eklenir.
--
-- (b) İki karar satırı eksikti (sayfa içi asistan prensibi, davet kodu görünürlüğü)
--     ve sprint kararında modül adları yazılı değildi.
--
-- T20 toplamı: 31 + 6 = 37 satır.

do $$
declare
  v_eklenen int;
begin
  if exists (
    select 1 from public.command_center_items
    where item_type = 'meeting_note'
      and legacy_source_code = 'T20'
      and legacy_source_title = 'RAG kütüphanesi için ülke / şehir / konsolosluk içeriklerini hazırla'
  ) then
    raise notice 'T20 ek#2 seed already present, skipping.';
    return;
  end if;

  -- Sprint kararına hangi modüllerin kastedildiğini işle.
  update public.command_center_items
  set detail = detail || ' Kapsamdaki modüller (resmi çıktı): Radar · Dijital Gruplar · Rehberler · Etkinlikler — bu dördü stabil ve çalışır hâle gelince sprint kapanır.'
  where item_type = 'meeting_note'
    and legacy_source_code = 'T20'
    and legacy_source_title = 'KARAR: önce mevcut sistem çalışır + düzgün UI + test edilebilir, sonra Cadde + Profil'
    and detail not like '%Dijital Gruplar%';

  insert into public.command_center_items
    (item_type, title, detail, category_label, assignee, status, priority, due_date, urgent,
     legacy_source_type, legacy_source_code, legacy_source_date_label, legacy_source_category, legacy_source_title, sort_order)
  values
    -- ── Burak'ın kendi maddeleri (UBT'nin teknik karşılıkları ayrıca duruyor) ──
    ('meeting_note', 'RAG kütüphanesi için ülke / şehir / konsolosluk içeriklerini hazırla', 'Bilgi tabanına beslenecek içerik dokümanları Burak tarafından hazırlanacak: ülkeler, şehirler, konsolosluklar ve blog konuları. UBT''nin "RAG kütüphanesini oluştur" maddesi bunun TEKNİK karşılığıdır — içerik gelmeden o iş boşa çalışır. Ölçüm 27.09: korpusta ülke/şehir/konu kaynağı YOK; mevcut 4.794 kaydın 4.214''ü depo dokümanı.', '21 Eylül 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'veritabani-tasarimi', 'RAG kütüphanesi için ülke / şehir / konsolosluk içeriklerini hazırla', 320),
    ('meeting_note', 'Rehberler sayfası için yazıları hazırla', 'Rehberler sekmesi altına popüler doktor, danışman, topluluk ve ülke rehberi yazıları hazırlanacak/yazdırılacak. UBT''nin "Guides sayfasını içerikle doldur" maddesi teknik taraftır. Ölçüm 27.09: sayfa 50 yazı gösteriyor ama en yenisi 13 Haziran''dan — 21 Eylül''den beri tek içerik eklenmemiş.', '21 Eylül 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'topluluk-yonetimi', 'Rehberler sayfası için yazıları hazırla', 330),
    ('meeting_note', 'Rol geçişi davranışını revizyon olarak netleştir', 'Danışman/profesyonel role geçildiğinde son kullanıcı profiline dönüş mantığı ve arayüzdeki kafa karışıklığı Burak tarafından revizyon maddelerine yazılacak. UBT''nin "role switching kontrolü + dokümantasyon" maddesi bunun uygulama tarafıdır.', '21 Eylül 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'kullanici-kisitlamalari', 'Rol geçişi davranışını revizyon olarak netleştir', 340),
    ('meeting_note', 'Davet kodunun yerini ve onay akışını revizyona yazdır', 'Özel kafelerin davet kodlarının nerede görüneceği (profil mi Cadde içi mi) ve katılım onay akışı Burak tarafından takip listesine/revizyonlara yazılacak. ⚠️ Ölçüm 27.09: kullanıcının KENDİ davet kodu diye bir kavram sistemde HİÇ YOK; profildeki referans alanı ters yönde çalışıyor (başkasının kodunu girme alanı). Yani bu, göründüğünden büyük bir iştir.', '21 Eylül 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'topluluk-yonetimi', 'Davet kodunun yerini ve onay akışını revizyona yazdır', 350),

    -- ── Eksik iki karar ────────────────────────────────────────────────────────
    ('meeting_note', 'KARAR: sayfa içi yardımcı asistan prensibi kabul edildi', 'Kullanıcı form doldururken zorlanmasın diye (kapak görseli adresi, belge yükleme vb.) sağ altta o sayfanın kılavuzunu bilen bir yapay zekâ destek botu bulunacak — prensip olarak kabul edildi. Ölçüm 27.09: bot yalnız ana sayfada çalışıyor ve hangi sayfada olduğunu sunucuya bildirmiyor, yani iki niteliğin ikisi de henüz yok.', '21 Eylül 2026', 'B+B', 'Beklemede', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'mvp-hedefleri', 'KARAR: sayfa içi yardımcı asistan prensibi kabul edildi', 360),
    ('meeting_note', 'KARAR: davet kodu profilde/Cadde''de görünecek, bildirim akışı eklenecek', 'Özel kafelere giriş için üretilen davet kodları kullanıcının kendi profilinde veya Cadde üzerinde görünecek; gelen katılım talepleri için bildirim ve kabul akışı eklenecek.', '21 Eylül 2026', 'B+B', 'Beklemede', 5, null, false, 'meeting_notes', 'T20', '21 Eylül 2026', 'topluluk-yonetimi', 'KARAR: davet kodu profilde/Cadde''de görünecek, bildirim akışı eklenecek', 370);

  get diagnostics v_eklenen = row_count;
  if v_eklenen <> 6 then
    raise exception 'T20 ek#2 seed 6 satır eklemeliydi, % eklendi.', v_eklenen;
  end if;

  if (
    select count(*) from public.command_center_items
    where item_type = 'meeting_note' and legacy_source_date_label = '21 Eylül 2026'
  ) <> 37 then
    raise exception 'T20 toplamı ek#2 sonrası 37 satır olmalıydı.';
  end if;
end
$$;
