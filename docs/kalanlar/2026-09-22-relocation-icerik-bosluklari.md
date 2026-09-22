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

## 22.09 · KARAR VE UYGULAMA — "çalışan demo"

**Kullanıcı kararı:** motor çalışan bir demo olsun — **kod gerçek, veri demo.**

Uygulandı: `docs/operations/2026-09-22-relocation-demo-seed.sql`

| Tablo | Önce | Sonra |
|---|---|---|
| `relocation_services` | 0 | **120** (12 ülke × 5 kategori × 2 sağlayıcı) |
| `relocation_bureaucratic_steps` | 2 | **62** (12 ülke × 5 adım + var olan 2) |
| `relocation_emergency_contacts` | 4 | **21** (10 ülke tamamlandı) |

**Motor uçtan uca doğrulandı** (RPC'ler `auth.uid()` ister; sahibin kimliği JWT talebi
olarak taklit edilip salt-okuma işlemde koşuldu, sonra `rollback`):
servis sıralaması beş kategoride de **2/2**, kontrol listesi **6 adım**, şehir
sıralaması **bozulmadı**.

⚠️ **İki kural seed'de kilitli:**
1. **Demo satırlar DB'den ayırt edilebilir** — hepsi `demo_seed_relocation` kaynağına
   (`authority_level='user_generated'`) bağlı. `[DEMO]` öneki yalnız ikinci işarettir;
   "bu veri gerçek mi?" sorusu SQL'le cevaplanır.
2. **Acil numaralar DEMO DEĞİLDİR.** Sahte bir acil numara gerçekten aranabilir.
   Gerçek resmî değerler girildi (AB 112 · US/CA 911 · GB 999 · CH 112/117/144 ·
   AE 999/998/997 · QA 999), `official_url` ile ve ayrı gerçek kaynağa
   (`emergency_official_numbers`) bağlı.

**`/relocation` `DEMO_ROUTES`'a geri kondu.** B27'de "kalan sekmeler gerçek veri
okuyor" diye çıkarılmıştı; içerik demo olduğu sürece işaret de durur.

## Gerçek içeriğe geçişte yapılacak iş

Demo veri motoru çalıştırır ama üründe kalamaz. Gerçeğe geçiş sırası:

1. ✅ **Acil numaralar — BİTTİ.** Zaten gerçek girildi (demo değil).
2. **Bürokrasi adımları** (`relocation_bureaucratic_steps`) — bugün 60 demo satır.
   Gerçeği ülkeye göre değişir ve **kaynak ister**; defterde uygun kayıtlar hazır:
   `eu_your_europe`, `de_make_it_in_germany`, `de_berlin_service`, `nl_government`.
   Gerçek adım girilirken o ülkenin demo satırları silinmelidir.
3. **Servis sağlayıcılar** (`relocation_services`) — bugün 120 demo satır. Gerçeği
   **uydurulamaz**: bunlar gerçek işletmelerdir (banka, sigorta, GSM, doktor). Gerçek
   sağlayıcı listesi dışarıdan gelmelidir.

**Demo satırları silmek tek sorgudur** — hepsi tek kaynağa bağlı:

```sql
delete from public.relocation_services
where source_id = (select id from public.relocation_source_registry
                   where source_key = 'demo_seed_relocation');
```

⚠️ Son demo satır da silindiğinde `/relocation` `DEMO_ROUTES`'tan çıkarılmalıdır —
ve tersi de doğrudur: demo satır durduğu sürece o işaret kalmalıdır.

⚠️ Maliyet rakamlarında yaptığımız hatayı tekrarlama: kaynağı olmayan içeriği
"genel bilgi" diye girip sonra ona kaynak aramak yerine, **önce kaynağı belirle**
(bkz. B28 düzeltmesi).
