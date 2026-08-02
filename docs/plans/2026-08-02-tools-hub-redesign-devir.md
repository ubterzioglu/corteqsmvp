# DEVİR — /tools (Araçlar) Görsel Yenileme — 2 Ağustos 2026

## Bugün yapılan

`/tools` sayfası (`RelocationToolsHubPage` → `RelocationToolsHub`) kullanıcı isteğiyle görsel
olarak yenilendi. Önce hafif bir cila (Plan A), sonra kullanıcı geri bildirimiyle ("kartları
biraz alengirli yap") daha zengin bir ikinci geçiş yapıldı.

**Değişen dosyalar:**
- `src/components/relocation/tools/RelocationToolsHub.tsx` — hero bölümüne `tech-aurora` +
  `tech-grid` arka plan katmanı ve `text-gradient-tech` gradyanlı başlık.
- `src/components/relocation/tools/ToolLandingCard.tsx` (masaüstü) ve `ToolAccordionCard.tsx`
  (mobil) — görsel üstü karartma gradyanı + üstte başlık, hover'da glow-gölge + hafif yükselme +
  görsel zoom + köşegen shine geçişi, soru sayısı bilgisi.
- `src/lib/relocation-tools-copy.ts` — `RESULT_KIND_BADGE_LABELS` (result_kind → Türkçe rozet
  etiketi: Skor/Sıralama/Persona/Görev Planı/Eşleşme/Karşılaştırma).
- `src/lib/relocation-tools-result-style.ts` (yeni) — `resultKindStyle()`: her result_kind'i
  logonun 6 renginden birine (teal/mavi/indigo/pembe/turuncu/sarı) + bir lucide ikonuna eşliyor.
  İkonlu rozet, kart halkası, üst şerit (masaüstü) ve sol kenar çizgisi (mobil) buradan besleniyor.

**Doğrulama:** Playwright ile `/tools` gerçek dev server'da mock veriyle (yerel `.env`'de
Supabase URL placeholder olduğu için gerçek veri çekilemiyordu) masaüstü + mobil + hover
durumları ekran görüntüsüyle kontrol edildi. Lint temiz, mevcut testler etkilenmedi (bu
bileşenler için özel test yoktu).

**Durum:** `is-bulma-olasiligi` branch'inde commit'lendi → main'e merge edildi → push'landı
(main: `89dbcd5..8b186b1` ilk geçiş, `8b186b1..5e5710d` renk/ikon geçişi).
**Coolify'a HENÜZ deploy edilmedi** — corteqs.net/tools'ta görünmesi için deploy tetiklenmeli.
Admin panelinde de duyuru olarak eklendi (`src/lib/admin-shell/admin-updates.ts`,
id `20260802-araclar-hub-gorsel-yenileme`).

## Açık görev — kök dizindeki kullanılmayan dosyaların temizliği

Kullanıcı talebi: **kökte duran kullanılmayan dosyalar `docs/` altına taşınsın ve
`.gitignore`'a işlensin.** Bu oturumda yalnız tespit yapıldı, taşıma/gitignore işlemi
**yapılmadı** — sıradaki oturumda ele alınmalı.

Tespit edilen adaylar (kök dizin, `git ls-files` + `ls -la` karşılaştırması):

| Dosya | Durum | Not |
|---|---|---|
| `1readme.md` | Git'te takip ediliyor, içerik: tek satır `uieauieauieaieua` | Anlamsız/test dosyası — silinebilir ya da `docs/archive/`'a taşınabilir |
| `tab_of.json` | Git'te takip ediliyor, `src/` içinde hiçbir yerden referans edilmiyor (grep ile doğrulandı) | Muhtemelen eski bir manuel test/taslak verisi (burak/diaspora/tools/tests kategorili 100 item) — kaynağı belirsiz, taşımadan önce sahibine sorulmalı |
| `walast.txt` | Git'te TAKİP EDİLMİYOR, 1.7 MB, kökte duruyor | Büyük ve içeriği incelenmedi — `docs/`'a taşımadan önce içeriği kontrol edilmeli; gitignore'a eklenmesi muhtemelen yeterli (zaten commit'lenmemiş) |
| `.secretdb` | Git'te TAKİP EDİLMİYOR, 2.2 KB | ⚠️ İsminden dolayı hassas olabilir — **docs'a taşınmamalı**, sadece `.gitignore`'da kalması teyit edilmeli, içeriği asla commit edilmemeli |

CLAUDE.md kuralı: kökte yalnız 4 bakımlı doküman (`CLAUDE.md`, `AGENT_CONTEXT.md`,
`ARCHITECTURE.md`, `rapor.html`) + `README.md` + build/config dosyaları kalmalı. `SONDURUM.md`
bilinçli geçici 5. dosya (bkz. kendi başlığı). Yukarıdaki 4 aday bu kurala uymuyor.

**Önerilen sıradaki adım:** `1readme.md` ve `tab_of.json` için kullanıcıyla teyit alıp ya sil
ya da `docs/archive/root-2026-08-02/` gibi bir klasöre `git mv` ile taşı (geçmiş korunur);
`walast.txt` ve `.secretdb` için önce içerik/hassasiyet kontrolü yap, sonra `.gitignore`'a
kesin pattern ekle.
