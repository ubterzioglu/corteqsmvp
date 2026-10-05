# AJAN PROMPTU — CorteQS: ajanın yapabileceği tüm kalan işler (5 Ekim 2026)

> Bu dosyayı bir kodlama ajanına (Qwen) olduğu gibi ver. Ajan bu repoyu daha önce görmedi;
> aşağıdaki her şey ona yöneliktir. Dil: **Türkçe** konuş, kod ve değişken adları İngilizce.

---

## 0 · Kimsin, ne yapıyorsun

Sen `C:\temp_private\corteqs\corteqs_fin` deposunda (CorteQS: React + Vite + Supabase) çalışan bir
kodlama ajanısın. Aşağıdaki işler **senin yapabileceğin** işlerdir. Karar, panel adımı, canlı
veritabanı yazımı ve deploy gerektiren işler SENİN DEĞİLDİR; onları §9'da listeledim, dokunma.

**Önce oku (sırayla, ezberleme, ölç):**
1. `CLAUDE.md` (kök) — repo kuralları. Çok uzun; en azından "Değişmez sözleşmeler", "Türkçe Metin
   Kuralları", "Test", "Database & Migrations" bölümlerini oku.
2. `docs/plans/2026-10-05-whatsapp-otp-plani.md` — bu oturumda yazılan WhatsApp OTP işi.
3. `docs/handover/2026-10-04-yan-ajan-ilerleme.md` — önceki ajanların ilerleme notu (sonuna kadar).
4. `docs/kalanlar/KALANLAR.md` §2 "DURUM PANOSU" (satır ~132–280).

## 1 · DEĞİŞMEZ ÇALIŞMA KURALLARI (ihlal = işi geri al)

1. **Sır kuralı.** `.env.local` ve benzeri dosyaların DEĞERLERİNİ asla ekrana basma, loglama,
   commit'leme, rapora yazma. Anahtar ADLARINI listelemek serbest. Bir komut çıktısında token
   görürsen dur, kullanıcıya bildir. Çıplak `EAA…` ile başlayan bir satır görürsen onu da yazdırma.
2. **Push YOK.** Hiçbir koşulda `git push`. Yalnız yerel commit.
3. **Commit kuralı.** Çalışma ağacında başka oturumların dosyaları var. **Asla** `git add -A`,
   `git add .`, `git commit -a`. Her commit: `git add -- <yalnız senin dosyaların>` +
   `git commit -m "..." -- <aynı dosyalar>`. Commit mesajı **Türkçe**, biçim `tip(KAPSAM): açıklama`
   (örn. `feat(G16): ...`, `fix(...)`, `docs(...)`, `test(...)`). Mesaja yapay zekâ imza satırı EKLEME.
4. **Dokunma listesi** (başkasının, takipsiz): `.agents/` · `ROADMAP.md` · `corteqs-ekstre-motoru/` ·
   `maillogo.png` · `public/mail/` · `skills-lock.json` · `sunuekleglobalSKILL.md` ·
   `docs/plans/2026-09-29-ekstre-motoru-*` · `docs/handover/2026-10-05-ajan-prompt-kalanlar.md` ·
   `docs/handover/2026-10-05-devir-notu-koordinator.md`. Bunları okuyabilirsin, DEĞİŞTİRME, commit'leme.
5. **Canlıya yazma YOK.** Production Supabase'e `psql` ile YAZMA, migration UYGULAMA, edge function
   DEPLOY ETME, secret değiştirme. Migration dosyası yazarsın (`supabase/migrations/applied/`),
   uygulamayı kullanıcıya bırakırsın. Salt-okunur canlı sorgu bile gerekiyorsa önce izin iste;
   izin denetçisi reddederse DOLANMA, "ölçülemedi" diye raporla ve hazır SQL dosyası bırak.
6. **Uygulanmış migration'ı düzenleme.** Yeni değişiklik = yeni dosya, yeni zaman damgası
   (mevcut damgayı tekrar kullanma; en son `20261005400000`).
7. **Türkçe metin kuralı.** Kullanıcıya görünen metinlerde Türkçe karakterler EKSİKSİZ olmalı
   (ı, ş, ğ, ü, ö, ç, İ). `npm run verify:text` eksik harfi YAKALAMAZ — gözle kontrol et. Arama/case
   için `src/lib/text-normalization.ts` (`trIncludes`, `trUpper`...). DB'ye yazılan anahtar
   değerlerinden Türkçe karakter silme.
8. **Test araçları (Windows tuzakları):**
   - Vitest/tsc/eslint'i **PowerShell** ile ve çalışma dizinini **büyük harfli** ver:
     `Set-Location 'C:\temp_private\corteqs\corteqs_fin'`. Küçük harfli `c:` ile Vitest
     `Cannot read properties of undefined (reading 'config')` hatasıyla BOZUK görünür — bu kod hatası değildir.
   - Bash aracında her komut sonunda `claude-…-cwd: No such file or directory` satırı çıkabilir; bu
     ortam gürültüsüdür, komutun sonucu değildir.
   - Python gerekiyorsa Windows yolu kullan (PowerShell'den çalıştır).
9. **Yazan ≠ onaylayan.** Kendi yazdığın kodu kendin onaylama. Her kod batch'inin sonunda ayrı bir
   inceleme turu yap: "bunu nasıl kırarım?" diye bak (özellikle sahte-yeşil testler: kodu bozsam bu
   test kırılır mı?). Mümkünse en az bir mutasyon dene (kodda bir koşulu boz, test kırılmalı, sonra geri al).
10. **İddia yazmadan önce ölç.** "Düzeldi", "geçti", "yok" demeden önce komutu çalıştır, çıktıyı gör.
    Çıktısını görmediğin şeyi "doğrulandı" diye yazma. Rapor dosyalarına rakam yazarken komutun
    adını da yaz.
11. **Dosya boyutu:** üretim kaynak dosyası 800 satırı geçmesin (`src/pages/ProfilePage.tsx` şu an
    TAM 800 — oraya satır ekleme). Fonksiyonlar <50 satır, iç içe derinlik ≤4.
12. **Karar uydurma.** İş kuralı bir dosyada yoksa dur ve raporda "KARAR GEREKİR" diye yaz.

## 2 · Bitirme kapısı (HER batch sonunda, hepsi yeşil olmadan commit yok)

```powershell
Set-Location 'C:\temp_private\corteqs\corteqs_fin'
npx tsc -p tsconfig.app.json --noEmit          # 0 hata
npx eslint <değiştirdiğin dosyalar> --max-warnings 0
npm run verify:text
npm run check:dead                              # 0 yeni erişilemez dosya
npm run check:drift
npm run ingest:tools:check                      # bayatsa: npm run ingest:tools, farkı commit'e kat
npx vitest run <ilgili dosyalar>                # sonra bir kez tam: npx vitest run
```
Bilinen, SENİN OLMAYAN kırmızı: `npm run lint` tüm repoda ~35 hata verir; hepsi
`corteqs-ekstre-motoru/` ve `supabase/functions/*whatsapp-autoreply*` dosyalarında. Kendi dosyalarını
tek tek lint'le; bu hataları düzeltmeye çalışma.

## 3 · İŞ SIRASI

### İŞ 1 — WhatsApp OTP işini bağımsız incele ve commit'le  *(önce bu)*
Bağlam: `docs/plans/2026-10-05-whatsapp-otp-plani.md`. Kod yazıldı ama **commit edilmedi**. Dosyalar:
```
supabase/functions/_shared/phone-otp-hook.ts            (+ .test.ts)
supabase/functions/_shared/phone-otp-claim-contract.test.ts
supabase/functions/_shared/whatsapp-graph.ts            (yalnız tip genişledi)
supabase/functions/send-phone-otp-hook/index.ts
supabase/migrations/applied/20261005400000_phone_otp_send_claim.sql
supabase/config.toml                                    (send-phone-otp-hook verify_jwt=false)
src/lib/phone-verification-api.ts (+ .test.ts)
src/components/profile/PhoneVerificationCard.tsx (+ .test.tsx)
src/components/profile/premium/ProfilePremiumLayout.tsx
src/pages/ProfilePage.tsx
docs/agent/tools.json · docs/agent/openapi.yaml · src/lib/agent/tools-catalog.generated.ts
docs/plans/2026-10-05-whatsapp-otp-plani.md
```
Yapılacak:
1. `git status` ile bu dosyaların gerçekten değişmiş/yeni olduğunu doğrula (başkasınınkileri karıştırma).
2. **Düşmanca incele:** imza doğrulama, kota SQL'i (özellikle `claim_phone_otp_send`: sayımlar,
   `retry_after`, kilit), istemci hata eşlemesi. Her testi "kodu bozsam kırılır mı" diye sına; en az
   3 mutasyon dene ve geri al. Gerçek bir kusur bulursan düzelt + test ekle.
3. Kapı (§2) yeşil olunca **tek commit**: `feat(G05): telefon OTP WhatsApp uzerinden - Send SMS hook + kota + kart baglantisi`.
   Migration'ı UYGULAMA. Bu dosya `applied/` altında olduğu için `npm run check:migrations`
   uygulanana dek drift gösterebilir — bu beklenen; raporda yaz.

### İŞ 2 — Plan panosunu güncelle (yalnız dokümantasyon)
`docs/kalanlar/KALANLAR.md`:
- G05 satırı ("U06 bekleniyor / Twilio") **bayat**. Yeni yol: Meta WhatsApp OTP. Satırı güncelle;
  yeni batch **G05b — WhatsApp OTP yayına alma** ekle: Business Verification → şablon `corteqs_otp`
  → migration uygulama → secret'lar → deploy → Dashboard Send SMS hook + `SEND_SMS_HOOK_SECRET` →
  SMS OTP Expiry 300 sn → uçtan uca. Kapı 🔴 (kullanıcı eli). Ayrıntıya `docs/plans/2026-10-05-whatsapp-otp-plani.md` bağla.
- U06 satırını güncelle: "Twilio" yerine "Meta WhatsApp (Business Verification bekliyor)".
- "Canlıda ölçülmedi" 4 maddeyi (GoTrue hata biçimi, `new_phone`, `+`'sız telefon, hook zaman aşımı) G05b'ye taşı.
`docs/handover/2026-10-04-yan-ajan-ilerleme.md` sonuna bu oturumun özetini ekle.
Commit: `docs(G05b): ...`. Rakam yazarsan komutla ölç.

### İŞ 3 — G16 "güvenilir üye" ve G17 sağlık skorunu `group_reports`'a bağla
Bağlam: G14 (şikayet sistemi, mig `20261005200000` + `20261005300000`) bitti ama G16/G17 hâlâ
şikayeti hesaba katmıyor. **Önce oku:** `docs/dijital-gruplar/01_politika_v1.1.md` ve
`02_motor-tasarimi.md` (kural uydurma; orada yoksa "KARAR GEREKİR" yaz), G14 migration'ları,
`supabase/qa/group-motor-acceptance.sql` (#6 TRIPWIRE: `group_reports` varlığını yoklar).
Yapılacak: (a) G16'nın "güvenilir üye" ve G17 skorunun `group_reports`'u nasıl okuması gerektiğini
politika dosyasından çıkar, bir mini-tasarım notu yaz (`docs/plans/`); (b) politika açıkça
söylüyorsa **yeni** migration dosyası yaz (salt ekleme, geri alınabilir) + kabul SQL'i
(`supabase/qa/…`, geri alınan işlemde, assert'li) + sözleşme testi; (c) politika söylemiyorsa
YAZMA, yalnız soru listesi çıkar. Migration'ı uygulama. Tripwire'ın (G25 #6) güncel durumunu
kontrol et ve notla.

### İŞ 4 — Canlıda koşturulacak hazır dosyalar (kullanıcı çalıştıracak)
Canlı DB izni olmadığı için yapılamayan işler için çalıştırmaya hazır, açıklamalı dosyalar yaz:
- **G14 deadlock iki oturumlu deneme:** `review_group_report_v1` için iki ayrı psql oturumunda
  eşzamanlı onay senaryosu. `docs/operations/2026-10-05-g14-deadlock-iki-oturum.md` (adım adım:
  hangi oturum ne zaman ne çalıştırır, beklenen çıktı, temizlik). Fixture kuralı: telefon
  doğrulanmış test kullanıcısı için `insert into auth.users (id,email)…` + `update … set phone_confirmed_at`,
  hesap yaşı için `created_at` geriye (bkz. `docs/handover/2026-10-05-ajan-prompt-g14.md`).
- **WhatsApp OTP kota kabulü:** `supabase/qa/phone-otp-claim-acceptance.sql` — **geri alınan işlemde**
  (`begin … rollback`), assert'li: bekleme süresi, saatlik/günlük, numara başına, global tavan,
  başarısız deneme tavanı, `failed` satırların kotaya sayılmaması, `NULL` outcome'un reddi. Mevcut
  `supabase/qa/*.sql` dosyalarının biçimini örnek al. Çalıştırma, yalnız yaz.
- Mevcut hazır SQL'ler (`docs/operations/2026-10-05-p06-turkce-collate-olcum.sql`, U01 §4) için
  tek sayfalık "kullanıcı bunu şu sırayla çalıştırır" çalıştırma notu.

### İŞ 5 — İncelenmemiş hazırlık dosyalarını gözden geçir (salt okuma + rapor)
Devir notuna göre kimse okuyup incelemedi: Stripe plan düzeltmesi (`19c02b89`),
K01+K04 karar hazırlığı (`569ac58b`), `docs/handover/2026-10-05-g14-kullanici-adimlari.md`,
`docs/handover/` altındaki kullanıcı-adımları dosyası (`c43b985b`). Her biri için: yanlış/çelişkili
iddia, ölçülmemiş rakam, kullanıcıyı yanıltacak karmaşık dil, eksik adım. Çıktı:
`docs/plans/2026-10-05-hazirlik-dosyalari-inceleme-raporu.md` (bulgu başına dosya:satır + öneri).
Dosyaları DEĞİŞTİRME; yalnız rapor.

### İŞ 6 — Bayat sayı ve cümle taraması (düşük risk)
`CLAUDE.md` başındaki ölçüm bloğu ve `docs/AGENT_CONTEXT.md` rakamlarını **komutla yeniden ölç**
(`git ls-files` kullan, çıplak `find` DEĞİL — `referanslovable/` klonu sayıyı şişirir):
`.ts/.tsx` dosya sayısı, test dosyası/test sayısı (`npx vitest run` özeti), `applied/` ve toplam
migration sayısı, edge function sayısı (`npm run check:functions` — salt okuma ise çalıştır,
Management API gerektirip token isterse ATLA ve raporla). Farkı bir tablo olarak
`docs/plans/2026-10-05-rakam-yenileme.md` içinde göster; **CLAUDE.md'yi kullanıcı onayı olmadan
DEĞİŞTİRME**, yalnız öneri tablosu üret.

## 4 · BİLEREK YAPMA (kullanıcının veya başka rolün işi)

- Business Verification, Meta şablon oluşturma, Meta panel işleri (webhook bağlama, W02/W07/W08).
- `supabase secrets set`, `supabase functions deploy`, Dashboard hook ayarı, migration UYGULAMA.
- Service role anahtarı iptali/yenileme (U01), git geçmişi temizleme, **push**, frontend deploy.
- G10c (eski kolon düşürme — onay bekliyor), G14 tasarım kararları 1–5 (cevap yok), K01/K02/K04/K05/K07,
  Stripe S01–S04, U03, U11, AI Legion kategorisi, TED konumu.
- `whatsapp-autoreply` deploy'u (canlıda yok; repoda var) — yalnız not et.
- Bot ile OTP numarası aynı olduğundan, kullanıcının OTP mesajına cevap yazması bota düşebilir:
  bu bir TASARIM sorusudur; kod yazma, `docs/plans/2026-10-05-whatsapp-otp-plani.md`'ye yalnız
  seçenekleri (cevabı atla / sabit yanıt / insana yönlendir) artıları-eksileriyle ekle.

## 5 · Dururken sor, uydurma

Şunlardan biri olursa **dur ve kullanıcıya sor** (tahmin etme): kural dosyalarda yok · iki doküman çelişiyor ·
bir komut canlı veritabanına/dış servise yazacak · token/sır görünür oldu · test kırmızı ve sebebi
senin değişikliğin mi başkasının mı belirsiz · bir dosyayı silmek/taşımak gerekiyor.

## 6 · RAPOR (iş bitince, tek mesaj)

Her İŞ için: yapıldı / yapılamadı / KARAR GEREKİR · commit hash'i · çalıştırdığın kapı komutlarının
sonuç özeti (geçen/kalan sayıları) · dokunduğun dosya listesi · **kanıtlanamayanlar** (canlıda
ölçülemeyenler) · bulduğun sürprizler. "Hepsi tamam" deyip geçme; ölçmediğini açıkça yaz.
