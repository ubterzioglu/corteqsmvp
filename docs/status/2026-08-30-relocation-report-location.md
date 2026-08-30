# C6 — Araç Raporlarında Konum Kabul Kanıtı

Durum: **teknik batch tamamlandı** (30 Ağustos 2026).

## Uygulanan sözleşme

- Her yeni `relocation_tool_results` kaydı, merkezi `rl_tool_write_result` içinde ülke/şehir snapshot'ı alır.
- Kaynak sırası: onaylı AFS `country` + `city`, ardından bireysel profil çekirdek alanları. Eksik değerler yalnız ikisi birlikte çözülebiliyorsa kabul edilir.
- Tarihsel sonuçlara bugünkü konum geriye dönük yazılmaz; konumsuz eski sonuç için araç yeniden çalıştırılır.
- `request_relocation_tool_report` sahiplik, snapshot konumu, doğrulanmış e-posta, 10/24 saat sınırı ve sonuç başına tek gönderim kontrollerini DB/RPC sınırında uygular.
- Rapor e-postası mevcut private outbox ve Zoho göndericisini kullanır. Alıcı adresi yalnız deny-by-default outbox payload'ında tutulur.

## Kabul kanıtı

- Migration dry-run ve `BEGIN … ROLLBACK` şema testi geçti.
- Canlı rollback senaryosu:
  - konumlu kullanıcı sonucu: `İtalya / Roma / approved_attributes` ve `resolved_at` dolu;
  - konumsuz kullanıcı sonucu: tüm snapshot alanları boş;
  - aynı sonuç için iki RPC çağrısı: tek outbox satırı (`pending`);
  - konumsuz sonuç: `rl_report_location_required` ile reddedildi;
  - `anon` execute: kapalı; `authenticated` report RPC: açık; ortak writer'a doğrudan execute: kapalı.
- 3 dosyada 16 hedef test geçti; TypeScript ve değişen kapsam ESLint temiz.
- Üretim build'i geçti; 500 KB üzeri JS chunk yok.
- Migration canlı ledger'a `20260830141000` olarak işlendi; 372/372 ve drift temiz.
- `send-notification-emails` Edge Function sürüm 10 olarak `ACTIVE` deploy edildi.

Gerçek bir üyeye istenmeyen test e-postası gönderilmedi. Uçtan uca inbox kabulü, kullanıcının sonuç ekranındaki açık gönderim talebiyle yapılmalıdır.
