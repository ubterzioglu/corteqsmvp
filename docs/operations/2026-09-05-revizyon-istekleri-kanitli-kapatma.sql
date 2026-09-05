-- Revizyon istekleri — kanıtlı kapatma (2026-09-05, Batch E triyajı).
--
-- Bu beş madde canlı kodda ZATEN karşılanmış durumda; liste onları açık gösterdiği için
-- yanıltıcıydı. Her satıra kapatma gerekçesi `detail` alanının sonuna eklenir (mevcut
-- detail KORUNUR), status 'yapildi' yapılır. Geri alma: status'ü 'acik'/'inceleniyor'a
-- döndür, eklenen not zararsızdır.
--
-- Kanıt kaynağı: 2026-09-05 çok ajanlı triyaj turu (4 keşif ajanı dosya:satır doğruladı)
-- + bu oturumda elle doğrulama. Kanıtı tartışmalı olan maddeler BİLİNÇLİ olarak
-- kapatılmadı (4f9717ab saat tasarımı, fd196b41 "konuşalım", 9170fc50 tema/kategori
-- adlandırması, a8477e82 ilan limitleri) — onlar insan kararı bekliyor.

update public.revision_requests
set status = 'yapildi',
    detail = coalesce(detail || E'\n\n', '') ||
      '[05.09.2026 kanıtlı kapatma] Ana sayfadaki kapanış bölümünde hedef metin zaten canlı: ' ||
      'src/components/home-trial/FinalCtaSection.tsx içinde "Yurt dışındaki hayatı şekillendiren ' ||
      'sisteme katıl" yazıyor ve bölüm ana sayfada render ediliyor (LandingTrialPage). Eski metin ' ||
      '("Yurt dışındaki Türk hayatını şekillendiren ağa katıl") src ağacında hiç geçmiyor.',
    updated_at = now()
where id = '3832df14-e574-42b3-9e5f-b2fd6bb7ce4e' and status <> 'yapildi';

update public.revision_requests
set status = 'yapildi',
    detail = coalesce(detail || E'\n\n', '') ||
      '[05.09.2026 kanıtlı kapatma] Başlıktaki satır kırılması düzeltilmiş: ' ||
      'src/pages/cadde/CaddePage.tsx içindeki "Cadde İçinde Görünür Ol" başlığı text-balance ile ' ||
      'çiziliyor ve kodda "Ol tek başına ikinci satıra düşmesin (dar sidebar''da kırılıyordu)" ' ||
      'yorumu duruyor.',
    updated_at = now()
where id = 'a4380b4f-429b-4973-8a13-178af93f2504' and status <> 'yapildi';

update public.revision_requests
set status = 'yapildi',
    detail = coalesce(detail || E'\n\n', '') ||
      '[05.09.2026 kanıtlı kapatma] Bağlantı artık WhatsApp''a gitmiyor: ' ||
      'src/pages/cadde/CaddePage.tsx içindeki "Beta geri bildirimi ver" bağlantısı ' ||
      '/feedback?kaynak=cadde adresine gidiyor. Maddenin şikâyet ettiği davranış ortadan kalkmış.',
    updated_at = now()
where id = 'e77455bf-674f-4032-bef9-408459863d71' and status <> 'yapildi';

update public.revision_requests
set status = 'yapildi',
    detail = coalesce(detail || E'\n\n', '') ||
      '[05.09.2026 kanıtlı kapatma] İstenen beş kapasite değeri (50 / 100 / 250 / 500 / 999) ' ||
      'kafe açış formunda birebir canlı. Kod tarafında yapılacak iş kalmadı.',
    updated_at = now()
where id = '25e8d1cc-12aa-4757-92f8-f7cbf7ef2268' and status <> 'yapildi';

update public.revision_requests
set status = 'yapildi',
    detail = coalesce(detail || E'\n\n', '') ||
      '[05.09.2026 kanıtlı kapatma] Muhasebe Bütçe sekmesi canlı: rota muhasebe routes.tsx ' ||
      'içinde tanımlı (ButcePage), MuhasebeLayout menüsünde "Bütçe" girdisi var, ' ||
      'muhasebe-butce-api muhasebe_butce_state tablosunu okuyup yazıyor ve migration ' ||
      'applied/ altında. Eski "worktree''de kaldı, route bağlanmadı" notu bayattı.',
    updated_at = now()
where id = '09396183-b467-412c-851e-ec028c18a336' and status <> 'yapildi';

-- Doğrulama: 5 satır kapanmış olmalı, açık sayısı 44 → 39'a inmeli.
select status, count(*) as adet
from public.revision_requests
where deleted_at is null
group by status
order by adet desc;
