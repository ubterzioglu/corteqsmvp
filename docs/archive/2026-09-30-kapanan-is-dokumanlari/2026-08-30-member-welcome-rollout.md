# Üye Hoş Geldin Maili — Rollout Durumu

**Tarih:** 2026-08-30

## Tamamlanan kontroller

- Adı bulunan ve bulunmayan üye için HTML + düz metin preview üretildi.
- Logo yerel HTTP preview'inde 1000×1000 kaynak ölçüsüyle yüklendi; masaüstü e-posta
  yerleşimi görsel olarak kontrol edildi.
- Şablon, admin setting ve outbox API kapsamındaki 48 test geçti.
- Canlı veritabanı salt-okunur kontrol edildi: `email.member_welcome.enabled = false`.
- Canlı outbox'ta 16 kayıt `skipped / global_switch_off`; bunlar bilerek yeniden
  kuyruğa alınmayacak.

## Açık release kapısı

Admin panelindeki **Bana örnek hoş geldin maili gönder** eylemiyle gerçek Gmail/Outlook
gelen kutusu doğrulanmalı. Ardından aynı admin oturumunda
`email.member_welcome.enabled` açılmalı ve yeni bir QA kullanıcısının outbox satırı
`sent` olmalı.

Bu ortamda bağlı admin tarayıcı oturumu bulunmadığı için servis rolüyle flag zorla
açılmadı. Böylece `updated_by` audit izi ve gerçek inbox kapısı korunuyor.

