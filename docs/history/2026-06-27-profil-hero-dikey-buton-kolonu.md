# Değişiklik Özeti — Profil Paneli: Hero Kartına Dikey 4'lü Buton Kolonu

**Tarih:** 27 Haziran 2026
**Branch / Commit:** `main` — kod `8f144c8`, güncelleme girdisi `33a2018` (origin/main'e push edildi)
**Kapsam:** Frontend-only (DB / migration / Edge Function yok)
**Durum:** Kod + güncelleme girdisi canlıda main'de. **Kalan:** Coolify frontend deploy + görsel QA.

---

## İstek

Profil panelinde (`/profile`) en üstteki kartın (kullanıcı bilgilerinin olduğu hero kart) sağ üstüne,
**alt alta (dikey)**, **eşit genişlik/yükseklikte**, **küçük yazı tipli (alttaki sekmeler kadar)**
4 buton konması: **Profil Ayarları · Bildirimler · Yardım · Çıkış Yap**.
Bu ikisi (Profil Ayarları, Bildirimler) alttaki sekme çubuğundan kaldırılacağı için kalan sekmeler
**tek satıra** sığacak.

## Neden

- Sekme çubuğu 11 sekmeyle iki satıra taşıyordu ("Profil Ayarları … Bildirimler" alt satıra düşüyordu).
- "Yardım" ve "Çıkış Yap" butonları hero kartının içinde diğer butonlarla (Public Profili, Fotoğraf)
  karışık duruyordu.

---

## Yapılan Değişiklikler

### 1. Hero kartı — sağ üstte dikey 4'lü buton kolonu
**Dosya:** `src/components/profile/premium/PremiumProfileHero.tsx`

- Sağ üst köşeye alt alta 4 eşit boyutlu buton: **Profil Ayarları (Settings) · Bildirimler (Bell) ·
  Yardım (HelpCircle) · Çıkış Yap (LogOut)**.
- Ortak `HERO_ACTION_BUTTON` sınıfı (`h-8 w-full text-xs`) ile eşit boyut + sekmelerle aynı küçük yazı tipi.
- Eski yatay eylem satırından **Yardım** ve **Çıkış Yap** çıkarıldı; Public Profili / Fotoğraf butonları yerinde kaldı.
- Yeni proplar: `onShowSettings`, `onShowNotifications` (mevcut `onShowHelp`, `onSignOut` korundu).
- Mobilde kolon tam genişliğe akıyor (`md:w-44` ile geniş ekranda sabit).

### 2. Sekme çubuğu — 2 sekme gizlendi, bileşen kontrollü hale getirildi
**Dosya:** `src/components/profile/premium/PremiumProfileTabs.tsx`

- `PremiumTabConfig`'e `hiddenFromTabBar?: boolean` eklendi; `settings` ve `notifications` girdileri
  gizlendi (panel içerikleri render edilmeye devam ediyor, sadece sekme tetikleyicisi çizilmiyor).
- `PREMIUM_TAB_KEYS` export edildi (settings/notifications) — hero ve sayfa ortak kaynak kullanıyor.
- Bileşen kontrollü: yeni proplar `activeTab` + `onActiveTabChange` (iç `useState` kaldırıldı).
- Sekme çubuğu `PREMIUM_TABS.filter((t) => !t.hiddenFromTabBar)` ile çiziliyor → kalan **9 sekme tek satır**
  (Mesaj Kutusu, Hizmet Talepleri, Taşınma Yönetimi, Takvim, Etkinliklerim, Kuponlar, Çarşı, Takip, WhatsApp).

### 3. Sayfa — aktif sekme durumu sahiplenildi
**Dosya:** `src/pages/ProfilePage.tsx`

- `premiumActiveTab` state üst seviyede tutuluyor (hook-safe, koşulsuz).
- Hero butonları sekmeyi değiştiriyor:
  - **Profil Ayarları** → düzenleme paneli (`settings`)
  - **Bildirimler** → "yakında" placeholder paneli (`notifications`)
  - **Yardım** → yardım kartına kaydırır · **Çıkış Yap** → oturumu kapatır

### 4. Test güncellemesi
**Dosya:** `src/components/profile/premium/PremiumProfileTabs.test.tsx`

- Kontrollü props için yerel state'li `ControlledTabs` sarmalayıcı eklendi.
- "Profil Ayarları" / "Bildirimler" artık `tab` rolünde render edilmediği doğrulandı.
- `activeTab` prop'u ile settings ve notifications panellerinin gösterimi test edildi.
- **Sonuç: 6/6 test geçti.**

---

## Davranış değişmeyen kısımlar

- Hiçbir veri sözleşmesi / handler değişmedi — yalnızca sunum + sekme durumunun sahibi değişti.
- Türkçe etiketler ve domain terimleri korundu.

## Doğrulama

| Kontrol | Sonuç |
|---|---|
| `npm run test -- …/PremiumProfileTabs.test.tsx` | ✅ 6/6 geçti |
| `npm run lint` (3 değişen dosya) | ✅ temiz (exit 0) |
| `tsc --noEmit` (değişen dosyalar) | ✅ yeni hata yok |
| `npm run build` | ✅ `built in 37.32s` (exit 0) |

## Güncellemeler girdisi

`src/lib/admin-shell/admin-updates.ts` listesinin en üstüne `20260626-profil-hero-dikey-buton-kolonu`
girdisi eklendi → admin panosu Güncellemeler kartı, zil (🔔) menüsü ve `/admin/about` sayfasında görünür.

## Git notu (paralel IDE)

- Oturum `fix/single-individual-profile` branch'inde başladı; push anında **`main`** üzerindeydi.
- Profil-hero kod değişikliklerinin 4 dosyası, paralel bir IDE süreci tarafından `8f144c8` ("." mesajlı)
  commit'i içinde main'e alınmıştı. Bu oturumda yalnızca güncelleme girdisi `33a2018` ile commit + push edildi.

## Kalan iş

1. **Coolify frontend deploy** — değişikliklerin sitede görünmesi için (DB değişikliği yok).
2. **Görsel QA** — premium pilot bir kullanıcıyla `/profile`: sağ üstte 4 eşit buton dikey, sekmeler tek satır,
   her butonun doğru paneli/eylemi tetiklemesi, mobil akış.
