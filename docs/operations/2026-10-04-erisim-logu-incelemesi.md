# Erişim logu incelemesi — kapatılan güvenlik açıkları kötüye kullanıldı mı?

> **Tarih:** 4 Ekim 2026 · **Kapsam:** 90 gün (2026-07-06 → 2026-10-04)
> **Yöntem:** Supabase Analytics `logs` tablosu, gün gün tarandı (90/90, hatalı gün 0)
> **Toplam incelenen istek:** 2.167.303
> **Sonuç:** 🟢 **Kötüye kullanım kanıtı YOK**

## Neden yapıldı

3–4 Ekim'de altı güvenlik açığı kapatıldı. En ağırı
`_submission_backfill_log_20260609`: RLS'siz, `anon`'a okuma **ve yazma** açık,
içinde **938 satır** üye verisi (`user_id` + `<telefon>@wa.local` biçiminde
e-postalar, yani pratikte telefon numaraları). Kapatmak "daha önce girilmedi"
demek değildir — bu inceleme o soruyu yanıtlar.

## Bulgu: 39 isteğin HEPSİNİN hesabı çıktı

90 günde sızan tabloya toplam **39** istek gitmiş. Tek tek incelendi:

| Ne zaman | Adet | Kim / ne | Kanıt |
|---|---|---|---|
| 06.07 · 14.07 · 31.07 · 16.08 (×2) | **25** | **Supabase paneli — Tablo Düzenleyici** | Beş kez birebir aynı imza: 1× `206` (`select=count`) + 4× `200` (`limit=50&offset=0/50/100/150`), hepsi **1 saniye içinde**. Panelin sayfalama davranışı. |
| 19.08 19:46 | **1** | **Supabase'in kendi yedekleme servisi** | user-agent **`servicebackup-supabase`** |
| 26.09 17:11 | **1** | **Tam katalog envanter taraması** | ↓ aşağıda |
| 03.10 | **12** | **Bizim güvenlik doğrulamamız** | Kapatma öncesi/sonrası kanıt turu (öncesi 200, sonrası 401) |
| **Toplam** | **39** | | |

**Diğer 83 günde istek sayısı SIFIR.**

## 26 Eylül taraması — hedefli değil, envanter

Tek başına bakınca ürkütücü duruyordu: `GET …?select=*&limit=150` → `200`.
Çevresine bakılınca aydınlandı — 17:11–17:14 arası **301 istek**, veritabanındaki
**her tabloyu ve her RPC'yi alfabetik sırayla** geziyor. Sızan tablo
**hedeflenmemiş**; alfabetik listede sıradaki 10. kalem olarak bir kez okunmuş.

Saldırgan olmadığının üç kanıtı:

1. **PostGIS iç fonksiyonları da taranmış** (`rpc/_st_orderingequals`,
   `rpc/gettransactionid`, `rpc/longtransactionsenabled`). Saldırgan bunları aramaz;
   bu liste **şemadan üretilmiş**.
2. **Durum kodları ayrıcalıklı DEĞİL:** 128× `200`, 156× `404`, **10× `403`**,
   5× `400`. `service_role` olsaydı hepsi `200` olurdu. Yani tarama "neye
   erişilebiliyor" diye bakıyordu — bir güvenlik/envanter denetiminin profili.
3. **Zamanlama:** repo'nun kendi envanter çalışmasıyla aynı döneme düşüyor
   (`docs/supabase-exit-plan.md`, ölçüm 2026-09-20; aynı dosya bucket envanteri
   çıkarılırken `cv-files`'ın public olduğunu da o sırada fark etmiş).

## ⚠️ Bu incelemenin SINIRLARI — abartma, eksiltme

1. **Log penceresi 90 gün.** Geriye en fazla **2026-07-06**'ya gidiliyor
   (120 gün sorgulandı → 0 satır). Tablo **2026-06-09**'da yaratıldı, yani
   **ilk ~27 gün kapsam DIŞI** ve o dönem hakkında hiçbir şey söylenemez.
2. **Log satırı IP ve API anahtarı taşımıyor.** Biçim
   `METOD | DURUM | URL | user-agent` — kimlik yok. "Panel taraması" ve
   "envanter" teşhisleri **desen kanıtına** dayanır, kimlik kanıtına değil.
3. **`Mozilla/5.0` user-agent'ı kanıt değildir** — script de böyle gönderebilir.
   Ayırt eden şey desen (sayım + sayfalama, 1 saniye) oldu.

## Özgeçmiş dosyaları

Aynı taramada `career`/`cv` deseni de sayıldı: 90 günde **114** istek, hepsi
01.10 ve 03.10'da — yani **kariyer modülünün geliştirildiği günlerde**. Sızan
`cv-files` kovasına dışarıdan erişim izi çıkmadı. (Dosyalar 04.10'da zaten
yedeklenip silindi — hiçbir canlı kayıt onlara işaret etmiyordu.)

## Sonuç ve öneri

**Kanıt bulunamadı.** 39 isteğin hepsi ya proje sahibinin panel kullanımı, ya
Supabase'in kendi servisi, ya envanter taraması, ya da bizim doğrulamamız.
Anonim/dış erişim izi **yok**.

Bu, "kesinlikle sızmadı" demek değildir — kapsam dışı 27 gün ve kimlik
taşımayan log biçimi yüzünden kesinlik iddia edilemez. Ama **bildirim
gerektiren bir ihlal bulgusu da yoktur.**

📌 **Kullanıcıya tek soru:** 26 Eylül ~17:11 UTC (19:11 Berlin) civarında
bir envanter/şema taraması çalıştırdın mı (ya da Supabase panelinde API
dokümanları sayfasını açtın mı)? Hatırlıyorsan bu dosyadaki son belirsizlik
de kapanır.