# DEVİR NOTU — Koordinatör oturumu (5 Ekim 2026)

> Bu oturumun bağlamı bitiyor. Devralan oturum: önce bu dosyayı, sonra
> `docs/handover/2026-10-04-yan-ajan-ilerleme.md` dosyasını oku. Başka bir şeyi ezberleme, ölç.

## 1 · Oturumda ne oldu (özet)

Koordinatör olarak yan ajanlara iş dağıttım. Kod yazmadım; yalnız iki doküman yazdım ve ajanları yönettim.

| Sıra | İş | Sonuç |
|---|---|---|
| 1 | G14 (grup şikayet sistemi) ajana verildi | Bitti: `ea40f63e` |
| 2 | Bağımsız `code-reviewer` turu | 0 kritik / 0 yüksek / 2 orta / 1 düşük |
| 3 | İkinci ajan: G14 düzeltmeleri + Stripe + K01/K04 + kullanıcı-adımları | Bitti (aşağıda hash'ler) |
| 4 | Üçüncü ajan: P04–P07, U01, G10c, SG, kullanıcı-adımları güncellemesi | **ÇALIŞIYOR olabilir** (aşağıya bak) |

## 2 · Yerel commit'ler (HEPSİ PUSH EDİLMEDİ)

```
c43b985b docs(kullanici-adimlari): tum kalan isler tek dosyada
569ac58b docs(K01+K04): karar hazirligi - sade dil + gorsel tarif
19c02b89 docs(stripe): karar 9 uygulandi - urun modeli /pricing = 3 kademe x aylik/yillik
0910a336 docs(ilerleme): G14 tamamlandı + inceleme düzeltmeleri notu
3bf47622 fix(G14): review_group_report_v1 deadlock + ASCII + error type
ea40f63e feat(G14): grup şikayet sistemi — group_reports + eşik + moderatör kuyruğu
```
Ayrıca öncesinden: W04–W06 (`ac9d5ec7`, `b2fdc356`, `a5888025`), P02+P03 (`20dd0b56`), U04 (`b1b0cbae`).
Yerel `origin/main`'in önünde 17+ commit var. **Push'u koordinatör (kullanıcı) yapar; incelemeden push'lama.**

Canlıya uygulanan migration'lar: `20261004280000` (P03) · `20261005100000` (W04) ·
`20261005200000` (G14) · `20261005300000` (G14 düzeltme). Bunların `schema_migrations` satırları
ELLE eklendi; W04'ünki eksikti, G14 ajanı ekledi. `npm run check:migrations` ile teyit et.

## 3 · Çalışan / bekleyen ajan

**Üçüncü ajan** şu işleri yapıyor: P04–P07 → U01 → G10c → SG → kullanıcı-adımları güncellemesi.
Talimat: `docs/handover/2026-10-05-ajan-prompt-kalanlar.md` (**takipsiz, commit'lenmedi**).
- Bu dosya kullanıcı tarafından başka bir oturuma da verilmek istenmiş olabilir (kullanıcı bir
  noktada "ben sadece prompt istedim" dedi). **Aynı işi iki ajan yapmasın:** başlamadan önce
  `git log --oneline -10` ve `git status` ile P04–P07/U01/G10c/SG için yeni commit olup olmadığına bak.
- Ajan bitince bildirim gelir. Gelmediyse yeni commit'lere ve ilerleme dosyasına bak.
- Sonucu doğrulamadan "bitti" deme. Önceki ajan G10c'yi raporunda hiç anmamıştı; her kalemi tek tek ara.

## 4 · KULLANICIDAN BEKLENEN KARARLAR

Ayrıntılı dil: `docs/handover/2026-10-05-g14-kullanici-adimlari.md`. Kullanıcıya sade biçimde sorulmuştu; **cevap gelmedi.**
1. **Kendi grubuna şikayet yasak** mı? (ajan: yasak yaptı; öneri: kalsın)
2. **Tek onay = tek ihlal** mi? (ajan: öyle yaptı; öneri: kalsın)
3. **Onaydan sonra grup gizli mi kalsın?** Politika §7 "1. ihlal: uyarı, grup yayında kalır" ↔ sistem gizli
   bırakıyor, panelde geri açma düğmesi yok. Öneri: A = otomatik yayına dön (küçük migration).
4. **Mail:** eşikle gizlenen grubun sahibine "incelemeye alındı" maili? Şikayetçiye sonuç maili?
   Öneri: sahibe evet (kimliksiz), şikayetçiye hayır.
5. **Sebep → kırmızı çizgi eşlemesi** doğru mu? (2, 4, 6 doğrudan kalıcı kaldırma + yasak)

Kullanıcı cevap verirse 3 ve 4 için küçük bir migration batch'i yazdırılır (yeni dosya; uygulanmış
migration düzenlenmez). Ek küçük iş: G16 "güvenilir üye" ve G17 sağlık skoru hâlâ `group_reports`'a bakmıyor.

## 5 · KANITLANAMAYANLAR (dürüst liste)

- G14: gerçek telefonla şikayet (U06 yok → bugün kimse telefon doğrulayamaz), gerçek tarayıcıda arayüz.
- Deadlock düzeltmesi (`3bf47622`): yalnız kod okumasıyla doğrulandı; iki oturumlu gerçek eşzamanlı
  onay denenmedi (üçüncü ajana "vakit kalırsa kanıtla" dendi).
- W04–W06: gerçek Meta webhook ve model yanıt kalitesi (secret'lar, GEMINI_API_KEY).
- Stripe ve K01+K04 hazırlık dosyaları yazıldı, **kimse okuyup incelemedi**.
- G14 ajanı bağımsız inceleme gelmeden commit etti; sonradan `code-reviewer` incelemesi yapıldı (bulgular
  yukarıda ve `3bf47622` ile kapatıldı).

## 6 · Ölçümün çürüttüğü öncüller (bu oturum)

- "Kurucu 1000 = 99 €": ürün modeli `/pricing` 3 kademe × aylık/yıllık; 99 € ayrı kampanya.
- "SG01–SG08 planı hazır": dosya repoda yok (grep yalnız devir notunda çıkıyor).
- W04 migration'ı canlıdaydı ama ledger satırı eksikti.
- Doğrulanmış sahip kendi grubunu RLS'ten okuyamıyor (`whatsapp_landings` politikaları `user_id` ister,
  `owner_user_id` değil).
- G22 claim değiştirme deseni tek başına eksik: `auth.role()` önce `request.jwt.claim.role` okur; üç GUC birlikte saklanıp geri yüklenmeli.

## 7 · Bilinen açık kalemler / tuzaklar

- `npm run check:dead` KIRMIZI: `PhoneVerificationCard.tsx` + `phone-verification-api.ts` hiçbir sayfaya
  bağlı değil (G05 açık kalemi). Başka kimsenin değil, ayrı iş.
- `npm run lint` ~29 hata `corteqs-ekstre-motoru/` içinde (takipsiz, bizim değil).
- Takipsiz dosyalar bırakılacak: `.agents/` · `ROADMAP.md` · `corteqs-ekstre-motoru/` · `maillogo.png` ·
  `public/mail/` · `skills-lock.json` · `sunuekleglobalSKILL.md` · `docs/plans/2026-09-29-ekstre-*`.
- types.ts regen borcu: yeni RPC'ler üretilmiş tiplerde yok (`as never` deseni).
- Frontend deploy yapılmadı; G14 arayüzü canlıda görünmez. Edge function'lar için Coolify deploy etmez
  (`npx supabase functions deploy` + `npm run check:functions`).
- Çalışma kuralları (git pathspec, DB bağlantısı, sır kuralı, PowerShell backtick tuzağı):
  `docs/handover/2026-10-04-yan-ajan-ana-prompt.md` §1.

## 8 · Devralanın ilk 5 adımı

1. `git log --oneline -15` + `git status -sb` (üçüncü ajan commit attı mı?).
2. `docs/handover/2026-10-04-yan-ajan-ilerleme.md` oku.
3. Üçüncü ajanın raporunu / commit'lerini doğrula: P04, P05, P06, P07, U01, G10c, SG — her biri ayrı.
4. Kullanıcıya §4 kararlarını yeniden hatırlat (kısa, tek cümleli seçenekler).
5. Push için kullanıcıdan onay al; bağımsız inceleme yapılmamış batch'leri (Stripe, K01+K04) raporda belirt.
