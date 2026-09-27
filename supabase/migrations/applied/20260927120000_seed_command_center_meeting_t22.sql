-- Seed: 17 Eylül 2026 -> command_center_items (item_type=meeting_note)
-- Kaynak kod: T22. ⚠️ NUMARA KRONOLOJİK DEĞİLDİR — 17 Eylül, T20 (21 Eylül) ve
-- T21 (25 Eylül)'den SONRA eklendiği için sıradaki boş kodu aldı.
--
-- ⚠️ EN ÖNEMLİ UYARI: Kaynak bir TOPLANTI TRANSKRİPTİ DEĞİLDİR.
-- `docs/notes/2026-09-17-persembe-burak-toplantisi.md` UBT'nin Burak'la konuşmadan
-- ÖNCE hazırladığı bir soru listesidir; toplantıda ne konuşulduğu ve hangi cevapların
-- verildiği KAYITLI DEĞİLDİR. Bu yüzden buradaki satırlar "alınan karar" değil,
-- "cevap bekleyen soru"dur ve karar sahibi Burak'tır.
--
-- Üç sorunun 27 Eylül'deki gerçek durumu ölçüldü (tahmin değil):
--   1. Profil menüsü: ProfilePage.tsx:757 aside hâlâ lg:col-span-4 + sticky;
--      "Bölümler" listesi kodda YOK → soru hâlâ açık.
--   2. Google Auth custom domain: docs/operations/2026-09-25-google-auth-admin-
--      yetkilendirme-rehberi.md var ama kendisi "hiçbir adım başlamadı, add-on
--      açılmadı" diyor → maliyet onayı hâlâ bekliyor.
--   3. Etkinlik vizyonu: events tablosu canlıda, 1 etkinlik kayıtlı, modül yapıldı
--      (mig 20260920140000 saat dilimi dahil) → soru FİİLEN CEVAPLANMIŞ, Tamamlandi.
--
-- 2 Beklemede (Burak kararı) + 1 Tamamlandi + 2 Baslanmadi (UBT) = 5 satır.
-- Idempotent guard: legacy_source_date_label = '17 Eylül 2026'.

do $$
begin
  if exists (
    select 1 from public.command_center_items
    where item_type = 'meeting_note'
      and legacy_source_date_label = '17 Eylül 2026'
  ) then
    raise notice 'T22 (17 Eylül 2026) seed already present, skipping.';
    return;
  end if;

  insert into public.command_center_items
    (item_type, title, detail, category_label, assignee, status, priority, due_date, urgent,
     legacy_source_type, legacy_source_code, legacy_source_date_label, legacy_source_category, legacy_source_title, sort_order)
  values
    ('meeting_note', 'SORU: profil menüsü sola mı taşınsın, telefonda ne görünsün?', 'Burak''tan karar bekleniyor. Öneri: sağdaki sabit kolon sola alınsın ve içine tıklanınca o bölüme atlayan bir liste konsun (Kişisel Bilgiler / İletişim / İlgi Alanları), böylece kullanıcı profili baştan sona kaydırmasın. Üç alt soru: (a) dar ekranda "Bölümler" açılır şeridi mi olsun yoksa hiç görünmesin mi, (b) sayfanın sağa kayması tasarımda sorun yaratır mı, (c) yalnız kendi profilini düzenlerken mi yoksa başkasının profilini görüntülerken de mi. ÖLÇÜM 27.09: ProfilePage.tsx:757 kolon hâlâ sağda ve sabit, bölüm listesi yok — hiçbir şey değişmedi.', '17 Eylül 2026', 'Burak', 'Beklemede', 5, null, false, 'meeting_notes', 'T22', '17 Eylül 2026', 'mvp-hedefleri', 'SORU: profil menüsü sola mı taşınsın, telefonda ne görünsün?', 10),
    ('meeting_note', 'SORU: Google girişi için aylık ek maliyet onaylanıyor mu?', 'Burak''tan karar bekleniyor. Google ile giriş yapan üye şu anda proje kimliğini içeren bir adres görüyor ("injprdrsklkxgnaiixzh.supabase.co uygulamasında oturum açın") — güven vermiyor. Düzeltmek için Supabase Custom Domain eklentisi açılıp kendi alt alan adımız bağlanmalı (öneri: auth.corteqs.net). Bu AYLIK EK ÜCRET demek; tutar Supabase faturalandırma sayfasından teyit edilmeli. İki soru: (a) maliyet onaylanıyor mu, (b) adres auth.corteqs.net mi olsun yoksa login/giris gibi başka bir ad mı. ÖLÇÜM 27.09: rehber yazıldı (docs/operations/2026-09-25-google-auth-admin-yetkilendirme-rehberi.md) ama eklenti HÂLÂ AÇILMADI — onay olmadan iş ilerlemiyor.', '17 Eylül 2026', 'Burak', 'Beklemede', 5, null, false, 'meeting_notes', 'T22', '17 Eylül 2026', 'ekip-ve-isbirligi', 'SORU: Google girişi için aylık ek maliyet onaylanıyor mu?', 20),
    ('meeting_note', 'SORU: Etkinlik özelliği ne tür bir şey olacak?', 'Burak''ın önerisiydi ama ne kastettiği netleşmemişti: Cadde''de tarihi ve yeri olan bir paylaşım mı, ayrı bir takvim/liste sayfası mı, yoksa Cafe''nin zamanlı hâli mi? UBT üç kararı zaten vermişti: etkinliği yalnız onaylı kişiler (şehir elçileri, katkıcılar) oluşturabilsin · kullanıcı "geleceğim" diyebilsin, sadece okumasın · Cadde''deki Etkinlikler süzgeci içerik üretilebilir olunca geri gelsin. ÖLÇÜM 27.09: soru FİİLEN CEVAPLANDI — etkinlik modülü yapıldı, events tablosu canlıda ve 1 etkinlik kayıtlı; saat dilimi desteği de eklendi (mig 20260920140000).', '17 Eylül 2026', 'B+B', 'Tamamlandi', 5, null, false, 'meeting_notes', 'T22', '17 Eylül 2026', 'mvp-hedefleri', 'SORU: Etkinlik özelliği ne tür bir şey olacak?', 30),
    ('meeting_note', 'Cadde''deki "Etkinlikler" süzgecini geri getir', 'Süzgeç 4 Ağustos''ta kaldırılmıştı çünkü boş bir listeyi süzüyordu. Etkinlik modülü artık çalıştığına göre geri getirilebilir — ama önce canlıda kaç etkinlik olduğuna bakılmalı: ÖLÇÜM 27.09 yalnız 1 kayıt var. Verisiz çip eklememe kuralı gereği süzgeci açmadan önce içerik birikmesi beklenmeli.', '17 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T22', '17 Eylül 2026', 'mvp-hedefleri', 'Cadde''deki "Etkinlikler" süzgecini geri getir', 40),
    ('meeting_note', 'Beş grup maddesi için Burak''a karar mesajları hazırla', 'Acil listede Burak''a atanmış beş grup maddesi var (grup ekleme politikası · grup onay akışı · grup formu alanları · şehir gruplarını toplama · grup ekleme çağrısı). Profil menüsü ve Google Auth için hazırlanan türden, seçenekli karar mesajları bunlar için de hazırlanacak.', '17 Eylül 2026', 'UBT', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T22', '17 Eylül 2026', 'topluluk-yonetimi', 'Beş grup maddesi için Burak''a karar mesajları hazırla', 50);

  if (
    select count(*) from public.command_center_items
    where item_type = 'meeting_note' and legacy_source_date_label = '17 Eylül 2026'
  ) <> 5 then
    raise exception 'T22 seed 5 satır eklemeliydi.';
  end if;
end
$$;
