-- A03b — Profil Workshop panosundaki yanlış "bitti" onaylarını geri al.
--
-- Ölçüm: docs/kalanlar/2026-09-27-A03a-profil-workshop-olcumu.md (27.09.2026).
-- Pano /admin/workshop/profil, 26 maddenin 24'ünü iki onaylı gösteriyordu; canlı
-- koda ve DB'ye karşı ölçüldüğünde altı onayın karşılığı olmadığı görüldü.
--
-- Geri alınan altı madde ve kanıtları:
--   m11  "E-posta VE telefon doğrulaması zorunlu alınacak"
--        -> auth config: mailer_autoconfirm=false (e-posta AÇIK) ama
--           external_phone_enabled=false (telefon sağlayıcısı KAPALI).
--           Madde iki koşulu birden istiyor, yalnız biri sağlanıyor.
--           Ayrıca pano kendi içinde çelişiyordu: aynı işi tarif eden m8
--           ("telefon doğrulaması entegre edilecek") hiç onaylanmamıştı.
--   m12  "Eski üyeleri Gmail girişine yönlendiren e-posta akışı kurulacak"
--        -> src, supabase/functions ve scripts altında böyle bir akış YOK;
--           çıkan iki eşleşme Gmail'in HTML'i nasıl işlediğine dair yorum satırı.
--   m14  "Rol bazlı etiketleme: aynı anda birden fazla unvan"
--   m15  "Rol başvurusu onaylananlara ek etiket eklenecek"
--        -> user_role_assignments: 171 satır / 171 benzersiz kullanıcı, yani
--           birden fazla rolü olan 0 kişi (şema kullanıcı başına tek rol).
--           Rol başvurusu akışı (profile-requestable-features.ts) ek UNVAN değil,
--           ÖZELLİK veriyor. Çoklu rol yol haritasında ertelenmiş durumda.
--   m22  "Paketler ödeme (checkout) adımına bağlanacak"
--   m23  "Yetkiler tekil fiyat yerine abonelik paketiyle sunulacak"
--        -> Gerçek ödeme kodu YOK. checkout araması iki eşleşme veriyor, ikisi de
--           ServiceRequestForm.tsx içindeki MockStripeCheckout (göstermelik demo).
--           Abonelik kararı 01.01.2027 — bu maddelerin yapılmamış olması BEKLENEN,
--           hata panodaki onayda.
--
-- DOKUNULMAYANLAR (bilerek):
--   m7  (e-posta doğrulaması) ve m21 (iki paket) ölçümle DOĞRULANDI.
--   m19 / m24 / m25 dış teslimattır (Burak'a gönderilecek doküman/rehber);
--       repodan ölçülemez, sahibi doğrulasın. m25 zaten yalnız UBT onaylı.
--
-- Not: workshop_items tablosunda archived_at sütunu YOKTUR (soft-delete sütunu
-- deleted_at'tir). "Süresi dolan WordPress maddesi" bu tabloda değil,
-- command_center_items içindedir — aşağıda ayrıca arşivleniyor.
--
-- Migration yeniden çalıştırılabilir (idempotent).

begin;

-- 1) Karşılığı olmayan altı onayı geri al.
update public.workshop_items
   set ubt_done      = false,
       burak_done    = false,
       ubt_done_at   = null,
       burak_done_at = null,
       updated_at    = now()
 where workshop_key = 'profil'
   and session_key  = 'WS1'
   and item_no in (11, 12, 14, 15, 22, 23)
   and deleted_at is null;

-- 2) Süresi dolan "WordPress taşıma işlemlerini 13 Eylül'e kadar dondur"
--    maddesini arşivle. Dondurma penceresi 13.09'da kapandı; ayrıca aynı kararı
--    kaydeden ayrı bir madde (status=Beklemede) duruyor, o KORUNUYOR.
--    Kimlikle hedefleniyor: başlık Türkçe karakter taşıyor, metinle eşleştirme
--    kodlama kazasına açık.
update public.command_center_items
   set archived_at = now(),
       updated_at  = now()
 where id = '389cb4fd-920c-48e5-a1a2-4d04059317bc'
   and archived_at is null
   and deleted_at is null;

commit;
