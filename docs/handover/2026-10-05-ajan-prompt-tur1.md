# AJAN PROMPTU — TUR 1 (5 Ekim 2026): A-batch doğrulama + örnek ilan + etkinlik hizalama + balon/rehber + G17 QA

> Bu dosyayı Qwen'e olduğu gibi ver. Dil: **Türkçe** konuş; kod ve değişken adları İngilizce.
> Plan dosyası bu prompt'un parçasıdır: **`docs/plans/2026-10-05-tur1-ajan-plani.md`** — işin ayrıntısı orada.

---

## 0 · Kimsin, ne yapıyorsun

`C:\temp_private\corteqs\corteqs_fin` (CorteQS: React + Vite + Supabase) deposunda çalışan bir kodlama ajanısın.
Bu turda beş iş var, **bu sırayla**: **V** (A1–A16 doğrulama) → **2.2** (örnek ilan SQL'i) → **2.4** (etkinlik hizalama) →
**2.5** (balon + üye rehberi taslakları) → **2.9** (G17 QA). Karar, panel adımı, canlı DB yazımı, deploy SENİN DEĞİL (§4).

**Önce oku (sırayla; ezberleme, ölç):**
1. `docs/plans/2026-10-05-tur1-ajan-plani.md` (işin kendisi) ve `docs/plans/2026-10-05-tek-plan-kalan-isler.md` §0, §1 (kararlar), §2.4–2.5, §6.
2. `CLAUDE.md` (kök): "Değişmez sözleşmeler", "Türkçe Metin Kuralları", "DEMO içerik deseni", "Cadde 3.0 Rules", "Test", "Database & Migrations".
3. Kaynak planlar (izlenmeyen, başkasının; **okuyabilirsin, düzenleme/commit'leme**): `docs/plans/2026-10-05-birlesik-plan-cv-ilan-rol-talepleri.md` (A1–A8), `docs/plans/2026-10-05-plan-8-urun-istegi.md` (A9–A16).

## 1 · DEĞİŞMEZ KURALLAR (ihlal = işi geri al)

1. **Sır kuralı.** `.env.local` ve benzerlerinin DEĞERLERİNİ ekrana basma, loglama, commit'leme, rapora yazma. Anahtar ADLARI serbest. Çıktıda token/JWT görürsen dur, kullanıcıya söyle.
2. **Push YOK.** Yalnız yerel commit.
3. **Commit kuralı.** `git add -A`, `git add .`, `git commit -a` **YASAK**. Her commit: `git add -- <yollar>` + `git commit -m "…" -- <aynı yollar>`. Mesaj **Türkçe**, biçim `tip(KAPSAM): açıklama`; yapay zekâ imza satırı EKLEME. Interaktif `git add -p` çalışmaz: aynı dosyaya dokunan batch'leri **birlikte** commit'le, mesajda batch kimliklerini yaz.
4. **Dokunma listesi:** `.agents/` · `ROADMAP.md` · `corteqs-ekstre-motoru/` · `maillogo.png` · `public/mail/` · `skills-lock.json` · `sunuekleglobalSKILL.md` · `CORTEQS_LANSMAN_HAZIRLIK_PLANI_v2.md` · `CorteQS_Rol_Tablosu_v2.xlsx` · `docs/plans/2026-09-29-ekstre-motoru-*` · `docs/handover/2026-10-05-ajan-prompt-kalanlar.md` · `docs/handover/2026-10-05-devir-notu-koordinator.md` · kaynak planlar (§0.3). Cadde "kimler beğendi" işi (`CaddeReactionActorsPopover.tsx`, `cadde-api.ts`, `cadde-types.ts`, `20261005150000_cadde_post_reactors_list.sql`): **commit'leme**, yalnız incele (plan V7).
5. **Canlıya yazma YOK.** Production Supabase'e `psql` ile yazma, migration UYGULAMA, edge function DEPLOY ETME, secret değiştirme. **Salt-okunur bile canlı DB sorgusu çalıştırma** (izin denetçisi reddeder; DOLANMA). Canlı ölçüm gereken yere hazır SQL dosyası bırak, raporda "ölçülemedi" yaz.
6. **`npm run ai:ingest`, `ai:embed`, `node scripts/ai-knowledge/ingest.mjs …`, `embed.mjs` ÇALIŞTIRMA.** Canlı bilgi tabanına YAZAR; geçmişte `npm --` argüman tuzağı canlıya gerçek yazım yaptırdı.
7. **Uygulanmış migration'ı düzenleme.** Henüz uygulanmamış (bu turdaki 7 dosya) düzenlenebilir/yeniden adlandırılabilir. Yeni dosya = yeni, çakışmasız 14 haneli damga (`ls supabase/migrations/applied | tail`). Damga **14 hane** (iki dosya 15 haneli olarak yazılmış — bu bir hatadır).
8. **Türkçe metin.** Kullanıcıya görünen metinde Türkçe karakterler EKSİKSİZ (ı ş ğ ü ö ç İ). `npm run verify:text` eksik harfi YAKALAMAZ — gözle oku. DB'ye yazılan anahtar değerlerinden Türkçe karakter silme. Arama/case için `src/lib/text-normalization.ts`.
9. **Windows araç tuzakları:**
   - Vitest/tsc/eslint'i **PowerShell** ile, çalışma dizinini **büyük harfli** ver: `Set-Location 'C:\temp_private\corteqs\corteqs_fin'`. Küçük harfli `c:` Vitest'i `Cannot read properties of undefined (reading 'config')` ile bozuk gösterir — kod hatası değildir.
   - Başka bir node süreci çalışırken Vitest `Timeout waiting for worker` verebilir → `--maxWorkers=2`.
   - Bash'te her komut sonunda `claude-…-cwd: No such file or directory` satırı çıkabilir; ortam gürültüsü, komutun sonucu değil.
   - Python gerekirse **Windows yoluyla ve PowerShell'den** çalıştır; iç içe tırnaklı çok satırlı betiği bash'e gömme (dosyaya yaz).
   - Satır sayısı için `(Get-Content f).Count` (`Measure-Object -Line` boş satırları saymaz).
   - `npm run build` `public/sitemap.xml` `lastmod`'larını değiştirir → commit'e katma: `git checkout -- public/sitemap.xml`.
10. **Yazan ≠ onaylayan.** Bu turun V işi, başkasının yazdığı kodu **kırmaya çalışmak**tır. Her batch'te mutasyon dene (koşulu boz → test kırılmalı → geri al). Kırılmayan mutasyon = zayıf test, güçlendir.
11. **İddia = komut + çıktı.** "Geçti/yok/düzeldi" demeden önce komutu çalıştır, çıktıyı gör. Rapora her rakamın yanına komutunu yaz. (Önceki turda bir ajanın rakamları tüm-depo/`src` karışıklığı ve `Measure-Object -Line` yüzünden yanlıştı; aynı hatayı yapma.)
12. **Dosya boyutu:** üretim dosyası ≤800 satır. `src/pages/ProfilePage.tsx` şu an **833** → V5 düzeltir. Fonksiyon <50 satır.
13. **Karar uydurma.** Kural bir dosyada yoksa dur, raporda "KARAR GEREKİR" yaz.
14. **`CLAUDE.md`'yi DEĞİŞTİRME** (kullanıcı onayı yok); öneriyi diff olarak `docs/plans/` altına yaz.

## 2 · Bitirme kapısı (HER batch sonunda; yeşil değilse commit yok)

```powershell
Set-Location 'C:\temp_private\corteqs\corteqs_fin'
npx tsc -p tsconfig.app.json --noEmit
npx eslint <değiştirdiğin dosyalar> --max-warnings 0
npm run verify:text
npm run check:dead          # 0 yeni erişilemez dosya
npm run check:drift
npm run ingest:tools:check  # bayatsa: npm run ingest:tools, farkı commit'e kat
npx vitest run <ilgili dosyalar> --maxWorkers=2     # sonra bir kez tam: npx vitest run --maxWorkers=2
```
Bilinen, SENİN OLMAYAN kırmızı: `npm run lint` tüm repoda ~35 hata verir (`corteqs-ekstre-motoru/` + `supabase/functions/*whatsapp-autoreply*`). Kendi dosyalarını tek tek lint'le.
`check:migrations` uygulanmamış migration'lar için drift gösterir — beklenen, raporla.

## 3 · İŞLER (ayrıntı plan dosyasında)

**V — A1–A16 doğrulama (ilk iş).** Plan §V1–V8: envanter yaz · iki 15 haneli migration'ı yeniden adlandır (sıra 600000→700000→800000→900000→910000→920000) ·
**eksik kabul SQL'lerini YAZ** (çalıştırma) · A13'ün toplu "bekleyenleri yayınla" `update`'ini migration'dan çıkarıp ayrı operasyon SQL'ine taşı (B9b: maillesiz, önce sayım, geri alınabilir) ·
`xlsx` devDependency'yi `npm audit` ile değerlendir (kendi başına `audit fix` çalıştırma) · `ProfilePage.tsx` 833→≤800 · her batch için kapı+mutasyon · Cadde "kimler beğendi" işini yalnız incele · mantıklı gruplarla yeşil commit'ler.
Yapılmamış batch bulursan (A6 şüpheli) uydurma: "YAPILMAMIŞ" yaz.
**2.2 — Örnek ilan SQL'i:** `docs/operations/2026-10-05-ornek-ilan-seed.sql` (6–8 `[ÖRNEK]` ilan, sahip `:owner_user_id` psql değişkeni, silme SQL'i, `DEMO_ROUTES` satırı).
**2.4 — Etkinlik hizalama (B9):** tüm üyeler `published`, limit 2, T1 korunur, eski sözleşme testlerinin güncelliğini sına (bayatlama kapanı), kullanıcı metinleri, `?tab=events`, `CLAUDE.md` önerisi.
**2.5 — Balon + rehber:** `AssistantBubble` ziyaretçi/üye metni; `docs/guides/` altına 4 üye rehberi taslağı (koda dayalı; ingest ÇALIŞTIRMA).
**2.9 — G17 QA:** `supabase/qa/g17-health-score-reports-acceptance.sql`'e pencere-bağımsızlığı senaryoları (çalıştırma).

## 4 · BİLEREK YAPMA

- Meta/Twilio/WhatsApp OTP işleri, Business Verification, secret girme, edge function deploy, migration **uygulama**, frontend deploy.
- U01 anahtar iptali, git geçmişi temizleme, **push**.
- Tur 2 işleri: B2 CV görüntüleme, rol zinciri (R1–R5), B10 dizin kartı etkinliği, B12 arama genişlemesi, B13 hesap silme — **başlama.**
- G14 tasarım kararları, G16 politikası, G10c, Excel "Açık Noktalar", konsolosluk yayını, Stripe.
- Canlıda gerçek veri okuma/yazma, `ingest`/`embed`.

## 5 · Dur ve sor

Şunlardan biri olursa **dur, kullanıcıya sor**: kural dosyalarda yok · iki doküman çelişiyor · bir komut canlı DB'ye/dış servise yazacak ya da okuyacak · token/sır göründü ·
bir test kırmızı ve sebebi senin değişikliğin mi başkasının mı belirsiz · dosya silmek/taşımak gerekiyor (yeniden adlandırma hariç) · iki batch'i ayıramıyorsun.

## 6 · RAPOR (iş bitince, tek mesaj)

Her iş için: **yapıldı / yapılamadı / KIRMIZI+neden / KARAR GEREKİR** · commit hash'leri · çalıştırdığın kapı komutları ve **çıktı özetleri** (geçen/kalan sayılar) · mutasyon sonuçları (kaç denedin/kaç yakalandı) ·
dokunduğun dosyalar · **kanıtlanamayanlar** (canlıda ölçülemeyenler) · bulduğun sürprizler · "Burak'a sor" listesi (rehber taslaklarında emin olmadığın şeyler dahil).
"Hepsi tamam" deme; ölçmediğini açıkça yaz.
