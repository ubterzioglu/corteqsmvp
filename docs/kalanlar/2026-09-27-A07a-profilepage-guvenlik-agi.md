# A07a — `ProfilePage` güvenlik ağı ölçümü

**Tarih:** 27 Eylül 2026 · **Kapsam:** yalnız ölçüm, **kod değiştirilmedi.**
**Dosya durumu:** `src/pages/ProfilePage.tsx` **918 satır** (dokunulmadı).

## 1. Ağ yeşil

```text
npx vitest run src/pages/ProfilePage.test.tsx
→ 1 dosya / 22 test PASSED (77 sn)
```

Test dosyası **1208 satır**, 22 test.

## 2. ⚠️ Planın risk sıralaması TERSİNE ÇEVRİLDİ

Plan (ve dosyadaki yorum) 739–811 arasını **"premium pilot"** diye anlatıyor.
Bu adlandırma yanıltıcı: ölçüm, dalın **üyelerin neredeyse tamamının gördüğü
ana yol** olduğunu gösteriyor.

Zincir, `src/lib/profile-presentation.ts:134` ve `src/lib/profile-types.ts:191`:

```text
roleKey "User_*"  →  getUiProfileType() = "bireysel"
                  →  resolveProfilePresentation() = INDIVIDUAL_PRESENTATION
                  →  isPremiumPresentation() = true
                  →  ProfilePage satır 739 dalı çalışır
```

- `FLAT_ROLE_PREFIX_UI_TYPES`: **`User_` → bireysel**, `Admin_` → bireysel,
  `Consultant_` → danisman.
- Tek istisna `INDIVIDUAL_PRESENTATION_EXCLUDED_ROLE_KEYS` =
  **`Admin_SuperAdmin`** (bir rol).
- A03a ölçümü: `user_role_assignments` **171 satır / 171 kullanıcı**, çoğunluk
  `User_DiasporaMember`.

**Sonuç:** premium dalı bir pilot **değil**, varsayılan yoldur. Generic yol
(`sidebarMenuItems` + 907'deki `return`) yalnız `Consultant_*` / `danisman` ve
kurumsal rollerin gördüğü **azınlık yoludur**.

## 3. Ağ hangi yolu ne kadar kapsıyor

Testlerde kullanılan rol anahtarları:

| Rol | Kullanım | Düştüğü yol |
|---|---|---|
| `User_DiasporaMember` | 2 | **premium** (739) |
| `User_Contributor` | 1 | **premium** (739) |
| `bireysel` | 1 | **premium** (739) |
| `Consultant_PracticalLife` | 2 | generic / sidebar (907) |
| `danisman` | 1 | generic / sidebar (907) |

- **Premium yolu iyi kapsanıyor** — 638, 760, 795, 823, 863, 974, 996, 1011,
  1020, 1028, 1098, 1165 … çoğu test buradan geçiyor.
- **Sidebar yolunu denetleyen test sayısı: 2** — `609` ("shows DB role label for
  flat consultant roles") ve `1181` ("kurumsal (yan panelli) düzende bölüm adı
  yalnız 'Cadde'dir"). İkisi de **düzenin kendisini değil**, içindeki tek bir
  ayrıntıyı doğruluyor; menü öğelerinin listesini doğrulayan test **yok**.

## 4. Bunun A07c/A07d için anlamı

| Batch | Trafik | Ağ | Gerçek risk |
|---|---|---|---|
| **A07c** · sidebar (813–905, 93 satır) | **düşük** (yalnız danışman/kurumsal) | **zayıf — 2 test, menü listesi kapsanmıyor** | orta |
| **A07d** · premium (739–811, 73 satır) | **yüksek** (neredeyse tüm üyeler) | güçlü | düşük–orta |

Plan sırası (**A07c önce**) **doğru kalıyor** ama gerekçesi değişti: "önce
kolay/bağımsız olan" değil, **"önce ağın zayıf olduğu yeri, dikkatli"**.

⚠️ **A07c'ye girerken menü listesi için önce bir test yaz** — taşıma sonrası
"22 test yeşil" demek bu blok için bir şey kanıtlamaz, çünkü menü öğelerini
hiçbir test okumuyor.

## 5. Çıkarma sınırları temiz

- Premium dalı **kendi `return`'üyle** 810'da kapanıyor, `}` 811'de. Erken
  çıkış; generic yolla iç içe değil.
- `sidebarMenuItems` 813'te başlıyor, 905'te bitiyor; yalnız 907'deki generic
  `return` tüketiyor.
- Her iki blok da tek bir dış kapsamda — iç içe koşul yok.

## 6. A07b için taşınan bulgu

`src/lib/profile-text-health.test.ts:12` `ProfilePage.tsx`'i `readFileSync` ile
okuyup mojibake deseni arıyor, **ama doğrulama negatif**
(`expect(suspiciousPatterns.some(...)).toBe(false)`). JSX dışarı taşınınca test
**kırılmaz — sessizce daha azını denetler.** A06b'deki `cadde-brand-token`
tuzağı yüksek sesle düşmüştü; bu düşmez. A07b bunu taşımadan **önce** kapatır.
