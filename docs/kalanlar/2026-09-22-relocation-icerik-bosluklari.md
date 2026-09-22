# Relocation — sekme bazında içerik boşlukları

**Tarih:** 22 Eylül 2026 · **Ölçüm:** canlı DB
**İlgili:** [Faz 10 karar paketi](2026-09-22-faz10-relocation-karar-paketi.md) ·
[KALANLAR](2026-09-21-KALANLAR.md)

> ⚠️ **Bu dosya bir düzeltmeyle başlıyor.** B27'de "kalan beş sekme GERÇEK veri okur"
> yazmıştım. Doğruydu ama **eksikti**: sekmeler gerçek tabloları okuyor, ancak o
> tabloların **üçü neredeyse boş**. Yani üç örnek sekmeyi kaldırırken, yerlerinde
> pratikte boş kalan üç gerçek sekme bıraktım. Aşağısı ölçülmüş hâlidir.

## Ülke bazında kapsama (12 ülke)

| Ülke | Şehir | Servis | Bürokrasi | Maliyet | Belge | Acil |
|---|---|---|---|---|---|---|
| AE | 2 | **0** | **0** | 16 | 17 | **0** |
| AT | 1 | **0** | **0** | 16 | 17 | **0** |
| BE | 1 | **0** | **0** | 16 | 17 | **0** |
| CA | 3 | **0** | **0** | 16 | 18 | **0** |
| CH | 1 | **0** | **0** | 16 | 17 | **0** |
| DE | 7 | **0** | 1 | 16 | 17 | 2 |
| FR | 1 | **0** | **0** | 16 | 17 | **0** |
| GB | 4 | **0** | **0** | 16 | 17 | **0** |
| NL | 4 | **0** | 1 | 16 | 17 | 1 |
| QA | 1 | **0** | **0** | 16 | 17 | **0** |
| SE | 1 | **0** | **0** | 16 | 16 | **0** |
| US | 6 | **0** | **0** | 16 | 17 | **0** |

**Toplam:** `locations` 32 · `services` **0** · `bureaucratic_steps` **2** ·
`living_costs` 192 · `required_documents` 204 · `emergency_contacts` **4**.

## Sekmelerin gerçek durumu

| Sekme | Durum |
|---|---|
| **Şehir** | ✅ Çalışıyor — 12 ülkenin hepsinde kayıt var |
| **Maliyet** | ✅ Çalışıyor — her ülkede 16 kalem (nitelik uyarısıyla, B28) |
| **Belge** | ✅ Çalışıyor — her ülkede ~17 belge |
| **Servis** | ❌ **12 ülkenin 12'sinde boş** |
| **Kontrol listesi (bürokrasi)** | ❌ Yalnız DE ve NL'de 1'er adım; 10 ülkede boş |
| **Acil** | ❌ Yalnız DE (2) ve NL (1); 10 ülkede boş |

## 22.09'da yapılan tek düzeltme

**Servis sekmesinin boş durumu yoktu.** Kullanıcı kategoriye tıklıyor, altında
**hiçbir şey** görünmüyordu — mesaj da yok. Sayfa bozuk görünüyordu. Bu,
CLAUDE.md'deki "İş İlanları çipi" dersinin aynısı: *boş dönen bir yüzey kullanıcıya
sistemin bozuk olduğunu öğretir.* Boş durum metni eklendi (tr + en).

Diğer iki boş sekmenin (bürokrasi, acil) boş durumu **zaten vardı**
(`dict.checklist.empty`, acil panelinin kendi metni) — orada kusur görünürlük değil,
**içerik eksikliğidir.**

## Sıradaki iş — içerik, kod değil

Üçü de **gerçek dünya verisi** ister ve uydurulamaz. Savunulabilirlik sırasına göre:

1. **Acil numaralar** (`relocation_emergency_contacts`) — en kolayı: resmî ve sabit
   bilgi (AB genelinde 112, US/CA 911, GB 999 …). Kaynak `relocation_source_registry`'ye
   ülke bazında yazılabilir. 10 ülke eksik.
2. **Bürokrasi adımları** (`relocation_bureaucratic_steps`) — ülkeye göre değişir ve
   **kaynak ister**. Defterde zaten uygun kayıtlar var: `eu_your_europe`,
   `de_make_it_in_germany`, `de_berlin_service`, `nl_government`. 10 ülke eksik.
3. **Servis sağlayıcılar** (`relocation_services`) — **uydurulamaz.** Bunlar gerçek
   işletmelerdir (banka, sigorta, GSM, doktor). Ya gerçek sağlayıcı listesi girilir ya
   da sekme kaldırılır; üçüncü bir dürüst seçenek yok.

⚠️ Maliyet rakamlarında yaptığımız hatayı tekrarlama: kaynağı olmayan içeriği
"genel bilgi" diye girip sonra ona kaynak aramak yerine, **önce kaynağı belirle**
(bkz. B28 düzeltmesi).
