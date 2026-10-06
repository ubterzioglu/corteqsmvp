# B14 · Rol Talepleri — Veri Ölçümü

**Tarih:** 5 Ekim 2026
**Durum:** TAMAMLANDI (salt okunur, kod okuma)

---

## Mevcut Rol Yapısı

### Bireysel Roller (INDIVIDUAL_ROLE_KEYS)
**Kaynak:** `src/lib/cadde-rules.ts` satır 34-38

| Rol Anahtarı | Açıklama |
|--------------|----------|
| `User_Standard` | Standart Kullanıcı |
| `User_DiasporaMember` | Diaspora Üyesi |
| `User_Contributor` | Katkıda Bulunan |

**Not:** `User_CityAmbassador` ve `User_BloggerVlogger` bu listede YOK — kurumsal aktör kuralına tabi.

---

### İşletme Roller (BUSINESS_ROLE_GROUPS)
**Kaynak:** `src/lib/directory-role-groups.ts` satır 46-124
**Toplam:** 25 rol, 9 grup

| Grup | Rol Sayısı | Rol Anahtarları |
|------|------------|-----------------|
| Gastronomi | 2 | `Business_RestaurantCafe`, `Business_BakeryPatisserie` |
| Sağlık & Bakım | 5 | `Business_HealthcareClinic`, `Business_Pharmacy`, `Business_HairdresserBeauty`, `Business_Barber`, `Business_Gym` |
| Gayrimenkul & İnşaat | 2 | `Business_RealEstateOffice`, `Business_ConstructionRenovation` |
| Profesyonel Hizmetler | 5 | `Business_LawOffice`, `Business_AccountingFinance`, `Business_Insurance`, `Business_DesignAdvertising`, `Business_ITSoftware` |
| Eğitim | 2 | `Business_EducationInstitution`, `Business_LanguageSchool` |
| Ticaret & Perakende | 4 | `Business_RetailStore`, `Business_MarketGrocery`, `Business_Wholesale`, `Business_ECommerce` |
| Seyahat & Konaklama | 2 | `Business_TravelAgency`, `Business_HotelAccommodation` |
| Ulaşım & Lojistik | 2 | `Business_TransportLogistics`, `Business_Automotive` |
| Çocuk & Aile | 1 | `Business_ChildrenFamily` |

---

### Danışman Roller (CONSULTANT_ROLE_GROUPS)
**Kaynak:** `src/lib/directory-role-groups.ts` satır 136-185
**Toplam:** 11 rol + 4 Healthcare rolü, 6 grup

| Grup | Rol Sayısı | Rol Anahtarları |
|------|------------|-----------------|
| Hukuk & Vergi | 2 | `Consultant_LawTax`, `Consultant_TrademarkPatent` |
| Vize & Göçmenlik | 1 | `Consultant_VisaImmigration` |
| Şirket & İş | 2 | `Consultant_BusinessSetupWork`, `Consultant_Financial` |
| Yaşam & Relocation | 3 | `Consultant_LifeRelocation`, `Consultant_PracticalLife`, `Consultant_RealEstate` |
| Eğitim & Aile | 2 | `Consultant_Education`, `Consultant_FamilyChildren` |
| Sağlık & Psikoloji | 4 | `Healthcare_Doctor`, `Healthcare_Dentist`, `Healthcare_Psychologist`, `Consultant_PsychologistCoach` |

---

### Şehir Elçisi
**Kaynak:** `src/lib/directory-role-groups.ts` satır 188
**Toplam:** 1 rol

| Rol Anahtarı | Açıklama |
|--------------|----------|
| `User_CityAmbassador` | Şehir Elçisi |

---

### Kurumsal Roller (Organization_*)
**Kaynak:** CLAUDE.md ve migration dosyaları

Bulunan roller (kod taraması):
- `Organization_HealthcareInstitution` (Sağlık Kurumu)
- `Organization_DigitalCommunity` (Dijital Topluluk)
- `Organization_NGO` (STK)
- `Organization_Foundation` (Vakıf)

**Not:** Tam liste için canlı DB ölçümü gerekir.

---

### Diğer Roller (Kod Taraması)

| Rol Anahtarı | Kaynak | Açıklama |
|--------------|--------|----------|
| `Member` | e2e testleri | Genel üye |
| `Admin_*` | CLAUDE.md | Yönetici rolleri (gizli) |
| `Moderator_*` | CLAUDE.md | Moderatör rolleri (gizli) |
| `Community_WhatsAppAdmin` | CLAUDE.md | WhatsApp grup admini |
| `Community_TelegramAdmin` | CLAUDE.md | Telegram grup admini |
| `Community_DiscordAdmin` | CLAUDE.md | Discord grup admini |
| `Community_GroupAdmin` | CLAUDE.md | Grup admini |
| `Community_SocialMediaAdmin` | CLAUDE.md | Sosyal medya admini |

---

## Hiyerarşik Rol Kodları

**BULGU:** `consultant.ambassador.*` benzeri hiyerarşik kodlar YOK.

Mevcut yapı **flat** (düz) roller kullanıyor:
- `Business_RestaurantCafe` (tek seviye)
- `Consultant_LawTax` (tek seviye)
- `User_CityAmbassador` (tek seviye)

**B15 için öneri:** "Ana Rol → Alt Rol → Uzmanlık" seçici yapılacaksa, hiyerarşik bir yapı kurulmalı:

```
consultant.law.tax
consultant.law.trademark
consultant.visa.immigration
consultant.business.setup
...

ambassador.city.berlin
ambassador.city.istanbul
...
```

**Ancak bu büyük bir göç işi.** Mevcut 82 rol (CLAUDE.md'ye göre) ve binlerce `user_role_assignments` satırı var.

---

## Göç Eşleme Tablosu Önerisi

**EĞER** B15'te hiyerarşik yapı seçilirse, eşleme tablosu:

| Eski (Flat) | Yeni (Hiyerarşik) | Not |
|-------------|-------------------|-----|
| `Consultant_LawTax` | `consultant.law.tax` | Ana: consultant, Alt: law, Uzmanlık: tax |
| `Consultant_TrademarkPatent` | `consultant.law.trademark` | Ana: consultant, Alt: law, Uzmanlık: trademark |
| `Consultant_VisaImmigration` | `consultant.visa.immigration` | Ana: consultant, Alt: visa, Uzmanlık: immigration |
| `Consultant_BusinessSetupWork` | `consultant.business.setup` | Ana: consultant, Alt: business, Uzmanlık: setup |
| `Consultant_Financial` | `consultant.business.financial` | Ana: consultant, Alt: business, Uzmanlık: financial |
| `Consultant_LifeRelocation` | `consultant.life.relocation` | Ana: consultant, Alt: life, Uzmanlık: relocation |
| `Consultant_PracticalLife` | `consultant.life.practical` | Ana: consultant, Alt: life, Uzmanlık: practical |
| `Consultant_RealEstate` | `consultant.life.realestate` | Ana: consultant, Alt: life, Uzmanlık: realestate |
| `Consultant_Education` | `consultant.education.general` | Ana: consultant, Alt: education, Uzmanlık: general |
| `Consultant_FamilyChildren` | `consultant.family.children` | Ana: consultant, Alt: family, Uzmanlık: children |
| `Consultant_PsychologistCoach` | `consultant.health.psychocoach` | Ana: consultant, Alt: health, Uzmanlık: psychocoach |
| `Healthcare_Doctor` | `consultant.health.doctor` | Ana: consultant, Alt: health, Uzmanlık: doctor |
| `Healthcare_Dentist` | `consultant.health.dentist` | Ana: consultant, Alt: health, Uzmanlık: dentist |
| `Healthcare_Psychologist` | `consultant.health.psychologist` | Ana: consultant, Alt: health, Uzmanlık: psychologist |
| `User_CityAmbassador` | `ambassador.city.standard` | Ana: ambassador, Alt: city, Uzmanlık: standard |

**İşletme rolleri için ayrı hiyerarşi:**

```
business.gastronomy.restaurant
business.gastronomy.bakery
business.health.clinic
business.health.pharmacy
...
```

---

## Canlı DB Ölçümü (Yapılamadı)

**Neden yapılamadı:** Canlı veritabanı erişimi yok.

**Yapılması gerekenler (Barış veya canlı erişimi olan biri için):**

```sql
-- 1. Rol dağılımı
SELECT r.key, r.label, COUNT(ura.id) as assignment_count
FROM roles r
LEFT JOIN user_role_assignments ura ON ura.role_id = r.id
WHERE r.is_active = true
GROUP BY r.key, r.label
ORDER BY assignment_count DESC;

-- 2. Rol attribute dağılımı
SELECT ra.role_key, COUNT(*) as attribute_count
FROM role_attributes ra
GROUP BY ra.role_key
ORDER BY attribute_count DESC;

-- 3. Consultant.ambassador.* benzeri kodlar var mı?
SELECT key, label FROM roles WHERE key LIKE '%.%' OR key LIKE '%\_%\_%';
```

---

## Öneriler

### Seçenek 1: Flat Yapıyı Koru (ÖNERİLEN)
- **Avantaj:** Göç işi yok, mevcut kod çalışır
- **Dezavantaj:** B15'teki "Ana Rol → Alt Rol → Uzmanlık" seçici için UI'da gruplama gerekir
- **Efor:** Düşük

### Seçenek 2: Hiyerarşik Yapıya Göç
- **Avantaj:** B15 seçici doğal çalışır
- **Dezavantaj:** 82 rol + binlerce assignment göçü, testler güncellenmeli
- **Efor:** Yüksek (B16 batch'ine karşılık gelir)
- **Risk:** Orta (veri kaybı riski)

### Seçenek 3: Hibrit Yaklaşım
- Flat roller kalır, UI'da gruplama için `directory-role-groups.ts` deseni kullanılır
- B15 seçici bu grupları okur, kullanıcıya hiyerarşik görünüm sunar
- DB şeması değişmez
- **Efor:** Orta

---

## Sonraki Adım

**B15 · Rol Talepleri — sekme adı + 3 adımlı seçici** için karar gerekli:
- Burak'tan **K5 rol matrisi** cevabı bekleniyor
- Cevaba göre Seçenek 1/2/3'ten biri seçilecek

**Bu batch (B14) kod yazılmadan tamamlanmıştır.**
