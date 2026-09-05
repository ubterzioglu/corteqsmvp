# Ölü kod temizliği + kalan iş envanteri — devir notu

**Devir tarihi:** 6 Eylül 2026 (gece)
**Öncül:** `docs/handover/2026-09-05-batch-cef-ve-canli-kusurlar.md`
**Dal:** `main` · `9eb9317` … `b67ebf6` — **11 commit PUSH EDİLMEDİ**

## Kısa sonuç

Bu tur iki işten oluştu: (1) devredilen iki revizyon maddesi kapatıldı, (2) **kalan iş
envanteri** çıkarıldı ve envanterin ilk üç maddesi uygulandı. Net etki:
**+1.317 / −4.934 satır** — yani tur ağırlıklı olarak SİLME turuydu.

En önemli bulgu koda değil **belgeye** dairdi: CLAUDE.md'nin teknik borç bölümü büyük
ölçüde bayattı ve gelecek oturumları çoktan ödenmiş borcu yeniden ödemeye
yönlendiriyordu. Ölçüldü ve düzeltildi.

---

## 1) Ölçülen durum (tur sonu)

| Ölçü | Tur başı | Tur sonu |
|---|---|---|
| Test | 271 dosya / 1.881 | **270 dosya / 1.878** yeşil |
| ESLint | 0 | **0** |
| `tsc` | 22 | **16** |
| Kaynak dosya (`src`) | 1.092 | **1.073** |
| `as any` | 15 | **9** |
| 300+ satır dosya | 126 | **119** (ilk kez geriledi) |
| Migration | 383/383 sapmasız | değişmedi |

⚠️ **Doğrulama komutlarını BÜYÜK harfli dizinden çalıştır** (`C:\temp_private\...`).
Küçük harfli `c:` ile vitest 266 dosyanın 262'sini SAHTE kırar — ayrıntı öncül devir
notunda, bağımlılık düşürme.

## 2) CLAUDE.md bayattı — düzeltildi (`dabee64`, `93c693b`, `b67ebf6`)

| İddia (eski) | Gerçek |
|---|---|
| ESLint 1280 problem | **0** |
| 89 `as any` | **9** |
| 83 `from(` + 42 `rpc(` bileşende | **32** + **4** |
| 21 auth shim import'u | **16** (sonra 0) |
| 98 `tsc` hatası | **16** |
| ~78 MB video | **16,4 MB** |
| `public/burak-stripe-rehberi.html` yayında | dosya **yok** |

Bayat maddeler silinmedi, **CLOSED listesi** olarak bırakıldı — yoksa eski notlardan
tekrar açılır. Kalan 16 `tsc` hatası da artık "karar bekliyor" değil, üç sınıf hâlinde
belgeli (A: insert yükü 7 · B: `Json` sütunu 5 · C: sorgu kurucusu özyinelemesi 4).

## 3) Silinen ölü kod

**`cf5ed73` — düşürülmüş `role_taxonomy_rules`'a bağlı 3 ekran (~1.350 satır).**
`AdminTaxonomyPage`, `AdminLoginUsersRolesPage`, `ProfileCompletePopup`. Hiçbirinin
rotası yoktu. `AdminTaxonomyPage` bu tabloyu KOŞULSUZ yüklüyordu — rotaya bağlansaydı
hiç veri yüklemeyecekti. Silinen testlerden biri düşürülmüş tabloyu mock'layarak bozuk
davranışı kilitliyordu.

**`b3752d8` — auth shim'i import eden 14 ölü bileşen (−3.148 satır).** 16 dosyanın
erişilebilirliği `App.tsx` köklerinden izlendi; her "ölü" kararı **iki bağımsız
çürütücüye** verildi (rota/lazy açısından ve barrel/dinamik import açısından). Sonuç:
14 ölü, 0 belirsiz. Erişilebilir çıkan 2 dosyaya (`MessagesInbox`,
`WelcomePackOrderForm`) DOKUNULMADI.

⚠️ **Bu turda öğrenilen en değerli tuzak:** `docs/reference/global-network-bridge/` ve
`docs/reference-clones/` altında AYRI referans klonları var ve bu bileşenleri
**gerçekten import ediyorlar**. Ama `@/` alias'ı yalnız `src/`'ye çözülür ve o ağaçlar
build'e girmez. Naif bir grep bunları "kullanılıyor" sayar. Bir bileşeni kullanılıyor
saymadan önce import zincirini `App.tsx`'e kadar takip et.

## 4) Auth shim kaldırıldı — B5 kapandı (`7d76155`)

16 dosya kanonik `@/components/auth/useAuth`'a geçirildi, `src/contexts/AuthContext.tsx`
silindi. Belgelerin aylardır uyardığı `loading`→`isLoading` tip çakışması **hiç
yaşanmadı**: shim'in kattığı tek şey `loading` alias'ıydı ve ölçüldüğünde hiçbir dosya
onu kullanmıyordu (hepsi yalnız `{ user }`, biri ayrıca `refreshProfile`).

⚠️ **Test tuzağı:** `vi.mock` yolu bileşenin GERÇEKTEN import ettiği yol olmalı. Yanlış
yolu mock'lamak sessizce hiçbir şeyi değiştirmez ve test
`"useAuth must be used within AuthProvider"` ile patlar. `MessagesInbox.test.tsx` tam
bu yüzden güncellendi.

## 5) Kapatılan revizyon maddeleri

- **`0838da0b`** (`4223eb6`) — CTA ile ayrılan kullanıcıya "Test sonucuna dön" şeridi.
  `sessionStorage` izi + `PublicLayout`'ta tek noktadan bağlanan şerit. Sorgu
  parametresi bilinçli REDDEDİLDİ: kullanıcı hedefte derinleşince düşerdi.
  Adres `window.location`'dan okunur, `useLocation`'dan değil — sonuç adresini
  `replaceState` yazıyor ve o router'ı güncellemiyor.
- **`a275f131`** (`4f5a256`) — Sonuç barları puan bandına göre renklendi. Renk gözle
  değil **ölçülerek** seçildi (renk körlüğü + kontrast denetimi). Kabul edilen rampa
  `emerald-600 / sky-600 / amber-600 / rose-600` hem açık hem koyu yüzeyde geçiyor.
  ⚠️ Elenen aday: `emerald→lime→amber→rose` — iki yeşil komşu olunca normal görüde
  ΔE 10,8 (taban 15). **Yeşilin yanına ikinci yeşil koyma.**

## 6) Burak için üretilenler

- **Test kılavuzu** (`31a21c2`): `docs/guides/2026-09-05-burak-gui-test-rehberi.html`
  — 12 adımlık elle GUI testi. Maddeler **A (şimdi test edilebilir)** / **B (yayın
  sonrası)** diye ayrıldı ve başta tek adımlık bir **kanarya** var: `/cadde/carsi`'de
  kategori rozetine tıkla — gidiyorsa yeni sürüm yayında.
- **Admin panel duyurusu** (`046ba4d`): günün ikinci partisi günlük dille, 14 madde.
  18:00 Berlin günlük özetine kuyruklandı.

---

## Sıradaki adımlar

1. **11 commit'i push et** — `9eb9317` … `b67ebf6`. Diğer oturum main'e yazmayı bıraktı.
2. **Dağıtımı doğrula** — kanarya adımı (yukarıda). Son dağıtım 5 Eylül 23:06:37 Berlin.
3. **T4 — bileşen içi Supabase çağrıları:** 32 `from(` + 4 `rpc(` → `*-api.ts` +
   React Query. Büyük ve yüzeyi geniş; push'tan SONRA başla.
4. **Üç ürün kararı** — (a) unvan yetki mi verir *(Batch C bunsuz uygulanamaz)*,
   (b) ek hedef ücretli mi, (c) m22 kapatılsın mı.
5. **`50362e2a`** araç sonucunu profile kaydetme — önce ürün kararı (hangi nitelik,
   açık rıza metni).
6. **WS1-7** (SMTP → e-posta doğrulaması) ve **WS1-8/11** (OTP sağlayıcı) dış karar
   bekliyor.
7. **Operasyon:** hoş geldin maili anahtarı (**kritik** — kapalıyken kaydolan üye maili
   hiç almıyor), login'li QA turu, revizyon panosunu "yapıldı"ya çevirme, Supabase
   custom domain.

**Tam envanter** (K1–K5 kararlar · T4–T6 teknik borç · O1–O9 operasyon):
`~/.claude/plans/yap-lacak-kalanlarla-ilgili-yeni-zazzy-canyon.md`

⚠️ `public/sitemap.xml` (yalnız `lastmod`) ve
`docs/status/mevcut-profil-yapisi-raporu-2026-08-20-sade-anlatim.html` hâlâ commit
edilmemiş. Üç oturumun da ilk `git status`'ünde vardılar; kimse dokunmadı. Karar sizde.

## Bu turda öğrenilen üç şey

1. **Belge de bayatlar ve bayat belge aktif zarar verir.** "1280 lint problemi" notu
   bir sonraki oturumu var olmayan bir borcu ödemeye yollardı. Rakam yazan her satır
   ölçüm tutanağıdır; değiştirmeden önce komutu tekrar çalıştır.
2. **`tsc`'nin "karar bekliyor" listesi aslında ölü kod ihbarıydı.** 22 hatanın 6'sı,
   düşürülmüş bir tabloya bağlı üç erişilemez ekrandan geliyordu. Liste okunmadığı
   için aylarca "tip borcu" sanıldı.
3. **Erişilebilirlik grep'le ölçülmez, zincirle ölçülür.** `docs/` altındaki referans
   klonları gerçek `import` satırları taşıyor ama build'e girmiyor; tersi de mümkün
   (bir dosyayı yalnız başka ölü dosyalar import ediyor olabilir).
