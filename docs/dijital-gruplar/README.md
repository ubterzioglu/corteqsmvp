# Dijital Gruplar — modül dokümanları

> Kaynak paket: *"DİJİTAL GRUPLAR"* (27 Eylül 2026). Repoya **G01** batch'inde alındı.
> İş kurallarının tek kaynağı bu klasördür; burada olmayan bir kuralı uydurma, dur ve sor.

## Dosyalar

| Dosya | Ne işe yarar |
|---|---|
| [`01_politika_v1.1.md`](01_politika_v1.1.md) | Kurallar: kim ekler, form, moderasyon, kırmızı çizgiler, kategoriler, skor, Grup Sözü |
| [`02_motor-tasarimi.md`](02_motor-tasarimi.md) | Politikanın kod karşılığı: durum makinesi, akışlar, veri modeli, skor formülü, zamanlanmış görevler, bildirim metinleri, kabul testleri |
| [`07_insa-notlari-eklentisi.md`](07_insa-notlari-eklentisi.md) | Paketin özgün BE/FE/Admin kontrol listesi — **arşiv niteliğinde**, aşağıdaki nota bak |

## ⚠️ Hangi liste canlı takip ediliyor

`07_insa-notlari-eklentisi.md` paketin kendi kontrol listesidir ve **takip edilen liste DEĞİLDİR.**
Paket onu `claude_corteqs-insa-notlari.md` dosyasının sonuna eklemeyi söylüyor; **o dosya bu
repoda yok** (ölçüldü 2026-10-01: `git ls-files` ile 0 eşleşme, repoda `[ ] **BE**` deseni
taşıyan hiçbir doküman yok) — Barış'ın repo dışı notları olduğu anlaşılıyor.

Bu yüzden 07 buraya **değiştirilmeden** kondu ve ikinci bir takip listesi açılmadı.
Canlı takip tek yerdedir: **[`docs/kalanlar/KALANLAR.md`](../kalanlar/KALANLAR.md) → G bölümü
(G01–G25)**. 07'deki her madde oradaki bir batch'e karşılık gelir; ikisi ayrışırsa **KALANLAR
doğrudur**. 07'yi güncelleme — tarihsel kayıttır.

## ⚠️ Tasarımın çürüyen beş varsayımı

`02_motor-tasarimi.md` 27 Eylül'de yazıldı; **30 Eylül'de canlıda ölçüldüğünde beş varsayımı
çürüdü.** Tasarımı okurken düzeltilmiş tabloyu da oku: `CLAUDE.md` → "Dijital Gruplar modülü"
bölümü ve [`docs/plans/2026-09-30-dijital-gruplar-plani.md`](../plans/2026-09-30-dijital-gruplar-plani.md)
("M0 Keşif" bölümü). Özellikle: `whatsapp_link_requests` ve grup sayfası gönderi tabloları
**yok**, `site_settings` anahtar-değer tablosu **değil**, "Seviye 2 doğrulanmış kuruluş" kavramı
**yok**, telefon OTP **hiç kurulmamış**.

## Pakette kalan, repoya alınmayan dosyalar

`00_OKU_BENI.md` · `03_claude-code_motor.md` · `04_claude-code_sayfa-form.md` ·
`05_instagram-tanitim.md` · `06_linkedin-tanitim.md` — ajan promptları ve tanıtım metinleri.
Bunlar iş kuralı taşımaz; repoya alınmadı. `03`'ün "Ortak bağlam" bölümü CLAUDE.md'ye işlendi
(G01), tanıtım dosyaları içerik ekibindedir ve **tanıtım S1/S2 canlıya çıkmadan başlamaz**
(paketin kendi kuralı — eski sayfaya trafik gönderilmez).
