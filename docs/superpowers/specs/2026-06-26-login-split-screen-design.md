# /login Split-Screen Yenileme — Tasarım Spec'i

**Tarih:** 2026-06-26
**Kapsam:** Tek dosya — `src/pages/LoginPage.tsx` (görsel/layout yenileme)
**Referans:** Kullanıcının paylaştığı "BATUBT / Footer kod yönetimi" split-screen login mockup'ı.

## Amaç

Mevcut `/login` ekranını, referans mockup'taki **split-screen** estetiğine taşımak:
solda koyu + renkli marka/branding paneli, sağda açık ve okunaklı form paneli.
Renkler referansın amber/mor hissi yerine **CorteQS marka paletine** (teal + turuncu)
uyarlanır.

## Kapsam Kararları (kullanıcı onaylı)

1. **Tek `/login` ekranı yenilenir.** Sistemde ayrı bir admin login ekranı yoktur —
   hem normal kullanıcı hem admin `/login`'den girer, admin yetkisi giriş sonrası
   `AdminLayout` tarafından kontrol edilir. Dolayısıyla "admin login de kullanıcı login
   de bunun gibi olsun" tek ekran yenilemesiyle karşılanır.
2. **Sol panel:** teal→turuncu marka gradient + mevcut `DiasporaNetworkLayer` ağ
   animasyonu (yeniden kullanılır, yeni görsel üretilmez).
3. **Tema:** sol panel koyu + renkli, sağ form paneli açık (siteyle tutarlı, referansa yakın).
4. **Form içeriği:** Google ile giriş + e-posta/şifre giriş + "Kayıt Ol" sekmesi +
   hata/başarı mesajları **aynen korunur**; yalnız görünüm değişir.
5. **Slogan:** Sol panelde "CorteQS" başlığı + diaspora mesajı
   (örn. "Diasporanın profesyonel ağına giriş yap").

## Mimari

- **Tek dosya değişikliği:** `src/pages/LoginPage.tsx`.
- **Korunan mantık (dokunulmaz):** tüm hook'lar ve handler'lar — `useAuth`, OAuth
  (`handleGoogleSignIn`), e-posta/şifre (`handlePasswordSignIn`), signup
  (`handlePasswordSignUp`), `mode`/`nextPath`/`redirectTo` hesapları, `document.title`
  + meta robots efekti, `Navigate to={nextPath}` yönlendirmesi, tüm `useState` alanları.
- **Değişen tek şey:** component'in `return (...)` JSX'i — kapsayıcı layout ve sınıflar.
- **Yeniden kullanım:** `DiasporaNetworkLayer` (`@/components/landing/DiasporaNetworkLayer`),
  mevcut `landing-ambient-orb` utility'leri, shadcn primitives (`Card`, `Tabs`, `Button`,
  `Input`, `Label`, `Separator`). Logo: `/logocorteqsbig.png`.
- **Yeni dosya / route / component yok.**

## Layout

```
┌──────────────────────────────┬───────────────────────────────┐
│  SOL PANEL (koyu + renkli)   │  SAĞ PANEL (açık form)        │
│  • koyu lacivert taban +     │  • • SECURE rozeti            │
│    teal→turuncu radyal grad. │  • "ÜYE ERİŞİMİ" etiketi      │
│  • DiasporaNetworkLayer ağ   │  • "CorteQS Hesabı" başlık    │
│    (düşük opaklık, aria-hidden)│  • açıklama metni            │
│  • ambient orb'lar           │  • Giriş Yap / Kayıt Ol tabs  │
│  • CorteQS logosu            │  • Google butonu              │
│  • Başlık: CorteQS           │  • ── veya ──                 │
│  • Slogan (diaspora)         │  • E-posta + Şifre alanları   │
│                              │  • Giriş / Kayıt butonu       │
│                              │  • hata/başarı mesajları      │
└──────────────────────────────┴───────────────────────────────┘
```

- Masaüstü (`lg:`): iki sütun, `lg:grid-cols-2`, `min-h-screen`.
- Mobil: tek sütun — sol panel üstte kısa bir hero bandına küçülür, form altta tam genişlik.

## Görsel Dil

- **Sol panel zemin:** koyu lacivert (`hsl(var(--foreground))` tonu) üzerine
  teal (`--glow-teal`) → turuncu (`--glow-orange`) radyal gradient. Referansın
  amber/mor gradient hissinin marka karşılığı.
- **Sağ panel:** `bg-card` / `bg-background`, okunaklı form.
- **Tipografi:** başlıklar `font-display` (Space Grotesk), gövde Inter.
- **Tab'lar & butonlar:** mevcut turuncu aktif-tab stili + buton varyantları korunur.
- **Dekoratif katmanlar:** `aria-hidden`, `pointer-events-none`, `z-0`.

## Türkçe Metin Kuralları (CLAUDE.md zorunlu)

- Yeni uppercase etiketler (örn. "ÜYE ERİŞİMİ") **CSS `uppercase`** (text-transform)
  ile yapılır — JS `toUpperCase()` kullanılmaz.
- Marka/teknik sabitler ("SECURE", "CorteQS") olduğu gibi kalır.
- `<html lang="tr">` korunur (zaten index.html'de).

## Erişilebilirlik & Responsive

- `Label`/`id`/`htmlFor` bağları **korunur** (testler `getByLabelText` kullanıyor).
- Form `autoComplete` nitelikleri korunur.
- Dekoratif ağ/orb katmanları `aria-hidden`; `prefers-reduced-motion` zaten CSS'te
  animasyonları durduruyor.
- Mobilde sol panel küçülür, form öncelikli ve tam genişlik.

## Test Stratejisi (sıfır kırık test hedefi)

Mevcut `src/pages/LoginPage.test.tsx` şu selektörlere bağlı — hepsi korunur:

- Buton metinleri (rol + isim): `google ile giriş yap`, `google ile devam et`,
  `e-posta ve şifre ile giriş yap`, `e-posta ve şifre ile kayıt ol`.
- `getByLabelText(/e-posta/i)`, `getByLabelText(/şifre/i)` → Label↔Input bağı şart.
- Başarı metni: `doğrulama bağlantısını e-posta adresine gönderdik`.
- Auth davranışı: OAuth `redirectTo`, password çağrısı, signup `emailRedirectTo`,
  authenticated → `/profile` yönlendirmesi (mantık değişmediği için aynen geçer).

Doğrulama: `npm run test -- src/pages/LoginPage.test.tsx`, ardından `npm run lint`.
Hedef sıfır kırık test; gerekirse yalnız görsel kaynaklı selektör kayması düzeltilir
(string'ler değiştirilmeden).

## Kapsam Dışı (YAGNI)

- Ayrı `/admin/login` route'u (sistemde tek giriş kapısı var).
- Auth akışı / davranış değişiklikleri (sadece görsel).
- Yeni illüstrasyon/maskot üretimi (mevcut ağ animasyonu kullanılır).
- Diğer sayfaların stil değişiklikleri.
