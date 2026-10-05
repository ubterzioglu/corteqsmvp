# K01 + K04 Karar Hazırlığı — sade dil + görsel tarif

> **Tarih:** 5 Ekim 2026 · **Durum:** KARAR BEKLİYOR (kod değiştirilmedi)
> **Amaç:** Burak'ın "anlamadım" dediği iki konuyu teknik olmayan dille anlatmak.

---

## K01 · Cadde ana sayfa sıralaması

### Soru ne?

Cadde sayfasında bazı paneller (Konum, Aktif Cafeler, İnsanları Keşfet) **sağ kolonda** mı
dursun, yoksa **akışın üstünde** (tam genişlik) mi?

### İki seçenek

**Seçenek A — Sağ kolon (BUGÜNKİ DURUM):**
```
┌─────────────────────────────────────────────────────────────┐
│  [Paylaşım kutusu]                                          │
├──────────────────────────────┬──────────────────────────────┤
│                              │  📍 Konum                    │
│  📝 Akış (gönderiler)        │  ☕ Aktif Cafeler            │
│  ...                         │  👥 İnsanları Keşfet         │
│  ...                         │  🌟 Öne Çıkan                │
│  ...                         │                              │
└──────────────────────────────┴──────────────────────────────┘
```

**Seçenek B — Akışın üstünde:**
```
┌─────────────────────────────────────────────────────────────┐
│  📍 Konum  ·  ☕ Aktif Cafeler  ·  👥 İnsanları Keşfet     │
├─────────────────────────────────────────────────────────────┤
│  [Paylaşım kutusu]                                          │
├─────────────────────────────────────────────────────────────┤
│  📝 Akış (gönderiler)                                       │
│  ...                                                        │
└─────────────────────────────────────────────────────────────┘
```

### Geçmiş (neden bugünkü durum böyle?)

05.08.2026'da **üç deneme** yapıldı:
1. **İlk deneme:** Paneller üstte üç satır → paylaşım kutusu katlamanın altında kaldı
2. **İkinci deneme:** Paneller üstte üç kolon → yine paylaşım kutusu katlamanın altında
3. **Üçüncü deneme (BUGÜN):** Paneller sağ kolona → akışın üstü tamamen boşaldı, paylaşım kutusu görünür

**Kullanıcı kararı (05.08.2026, üçüncü ve son revizyon):** Akış doğrudan ilk sırada gelir.
Sağ kolon panelleri orada kalır.

### Karar sorusu

**Bugünkü düzen (sağ kolon) devam etsin mi, yoksa paneller akışın üstüne mi taşınsın?**

⚠️ Eğer "üstte" seçilirse: Paylaşım kutusu katlamanın altına düşer — bu 05.08'de
**istenmeyen** bulunan bir sonuçtu.

---

## K02 · (Bu dosyada yok — ayrı karar)

---

## K04 · Cadde davet kodu alanı — 🔴 CANLIDA DURAN KUSUR

### Bu bir soru DEĞİL, kusur

Profil sayfasındaki "Davet Kodu" alanı **ters yönde çalışıyor.**

### Ne yazıyor?

Profil → Rolüne Özel Alanlar kartında:
```
┌─────────────────────────────────────────────────────────────┐
│  Rolüne Özel Alanlar                                        │
│                                                             │
│  Davet Kodu                                                 │
│  ┌─────────────────────────┐                               │
│  │ Sizi yönlendiren        │                               │
│  │ admin/davet kodunu gir  │  ← AÇIKLAMA BU               │
│  │ — kaydederken doğrulanır│                               │
│  └─────────────────────────┘                               │
│                                                             │
│  [Kaydet]                                                   │
└─────────────────────────────────────────────────────────────┘
```

### Kusur ne?

**Açıklama diyor ki:** "Sizi yönlendiren admin/davet kodunu gir" = **seni davet eden kişinin kodu**

**Ama kullanıcılar şöyle anlıyor:** "Benim davet kodum" = **başkalarına vereceğim kod**

Yani alan **ters yönde** çalışıyor:
- Kullanıcı düşünüyor: "Benim kodumu girip paylaşabilirim"
- Gerçekte: "Seni kim davet ettiyse onun kodunu gir"

### Teknik arka plan (kısa)

- `referral_code` attribute'u `user_attributes` tablosunda saklanıyor
- Doğrulama: girilen kod `referral_codes` tablosunda var mı + aktif mi?
- Başarılı doğrulama → `referral_code_usages` tablosuna kayıt düşer
- Doğrulanmış kod kilitlenir (değiştirilemez, yöneticiyle iletişime geç)

### İki seçenek

**Seçenek A — Alanı düzelt (yönlendirme net olsun):**
- Etiket: "Seni Davet Edenin Kodu"
- Açıklama: "Kaydolduğunda seni kim davet etti? Onun kodunu gir. Kodun yoksa boş bırak."
- ✅ Doğru yönlendirme
- ⚠️ Kullanıcıların çoğu kod bilmiyor → alan boş kalır

**Seçenek B — Alanı kaldır:**
- Profil sayfasından "Davet Kodu" alanı çıkarılır
- ✅ Kusur yok, kafa karışıklığı yok
- ⚠️ Referral takibi yapılamaz (ama zaten kullanım çok düşük)

### Karar sorusu

**Davet kodu alanı düzeltilsin mi (A), kaldırılsın mı (B)?**

⚠️ **ÖNEMLİ:** Bugün canlıda "Park = kusur yok" izlenimi verme. Alan **var** ve
**yanlış yönlendiriyor.** Kullanıcılar "benim kodum" sanıyor ama "seni davet edenin kodu"
anlamına geliyor.

---

## Özet — Burak'a sorulacak iki karar

| # | Konu | Soru |
|---|---|---|
| **K01** | Cadde panel sıralaması | Sağ kolon (bugün) mi, akış üstü mü? |
| **K04** | Davet kodu alanı | Düzeltilsin mi, kaldırılsın mı? |

**Kod değiştirilmedi.** Karar geldikten sonra uygulanacak.
