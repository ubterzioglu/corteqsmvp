# Batch C/E/F + iki sessiz canlı kusur — devir notu

**Devir tarihi:** 5 Eylül 2026 (ikinci yarı)
**Öncül:** `docs/handover/2026-09-05-profil-ws1-batch-b.md` (aynı günün ilk yarısı)
**Dal:** `main` · commit `fff0e26` … `21e2275`

## Kısa sonuç

Üç batch tek turda ilerledi. **İki sessiz canlı kusur** bulundu ve düzeltildi; ikisi de
build'i, testi ya da lint'i hiç kırmıyordu — yalnız kullanıcıda yanlış çalışıyordu.
Batch C'de **kod yazılmadı** ve bu bilinçli: dokuz yargıç üç tasarımı da reddetti.

---

## 1) Sessiz kusur: fontlar canlıda hiç yüklenmiyordu

`index.html` fontları `media="print" onload="this.media='all'"` hilesiyle çağırıyordu.
CSP `script-src`'inde `'unsafe-inline'` YOK (bilinçli karar, "Değişmez sözleşmeler" md.3),
bu yüzden tarayıcı inline `onload`'ı **hiç çalıştırmadı** ve stylesheet `media="print"`
olarak kaldı.

**Kanıt (canlı, Playwright):** `link.media = "print"`, `document.fonts` **boş**.
Site aylardır `system-ui` ile görüntüleniyordu.

Düzeltme: hile kaldırıldı, `preload` + doğrudan stylesheet. Deploy sonrası ölçüm:
`media: ""`, `Inter:loaded`, `cspViolations: []`.

**Sözleşme testi:** `src/lib/index-html-csp.test.ts` — inline olay işleyicisi yok, font
stylesheet'i print'e park edilmemiş, inline script yalnız JSON-LD olabilir.
⚠️ Test HTML **yorumlarını eler**; yoksa dosyanın kendi uyarı yorumu yanlış pozitif üretir
ve testi susturmak için uyarıyı silmek gerekirdi — test belgeyi bozardı.

## 2) Sessiz kusur: 6 üye hiç paylaşım yapamıyordu

Profil formu ülkeyi `geo_countries`'ten seçtiriyor ("ABD", "İngiltere"), Cadde
`cadde_countries` ile eşleştiriyor ("Amerika Birlesik Devletleri", "Birlesik Krallik").
`20260805130000` fold eşleşmesi eklemişti ama bunlar yazım varyantı **değil, farklı
kelimeler** — fold da eşleştiremez. `country_id` NULL kalıyor, `create_cadde_post_v2`
`cadde_invalid_targets` fırlatıyordu.

Düzeltme: veri onarımı yerine **köprü**. `cadde_countries.geo_country_id` canlıda 22/22
dolu; join artık katalog adı **veya** bağlı geo adı ile eşleşiyor (mig `20260905120000`).
Tek tek ad onarımından üstün: formun üreteceği her eş-adı kalıcı kapatır.

**Ölçüm: çözülen üye 107 → 113.** Kalan 16 gerçek ülke değil ("Belirtilmedi" 14 eski
WhatsApp-bot kaydı + "a" + "De").

## 3) Batch C — rol/etiket mimarisi: uygulanmadı, bilinçli

3 bağımsız tasarım × 3 lens (geçiş / mantık / ürün) = 9 yargıç. **Üçü de 3/10** aldı.
Kanıtlanmış kusurlar: `update_profile_attribute`'un yetki kapısı birleşim agregatında
yapısal olarak siliniyor · `has_cadde_feature` skaler alt sorgudur, birleşim CTE'si 21000
ile kırar · yeni `SECURITY DEFINER` fonksiyonlar REVOKE'suz · üç tasarım da etiketi dizin
sorgusunda `distinct on ... is_primary desc` ile atıyor (etiket aranamıyor).

**Asıl bulgu ürünsel:** soru "etiketi nereye yazalım" değil, "etiket nerede görünsün ve
ne iş yapsın". Cevaplanması gereken ilk soru: **unvan yetki mi verir, yalnız görünür mü?**
"Yalnız görünür" cevabı işin ~%80'ini kaldırır.
Karar notu: `docs/plans/2026-09-05-rol-etiket-mimarisi-karar-notu.md`.

## 4) Batch F — 73 maddenin kanıt turu

45 kanıtlı · 21 kısmen · 1 kanıt-yok · 6 kod-dışı. Denetim **8 iddiayı çürüttü**.
Rapor: `docs/status/2026-09-05-burak-onay-kuyrugu-kanit-raporu.md`.

⚠️ **m9 — düzeltildi ama yarım:** Cadde "Ek hedef" düğmesi normal üyede paylaşımı
kaybettiriyordu (`cadde.post.multi_target` anahtarı `afs_features`'a hiç eklenmemiş;
yöneticiler muaf olduğu için test hesaplarında görünmüyordu). Composer'a
`canAddExtraTarget` kapısı eklendi, **varsayılan kapalı** — kayıp durdu. Açılması ürün
kararı bekliyor.
⚠️ **m22 geçersiz:** "Enter ile gönder" diyor, daha yeni WS2-80/81 tersini söylüyor ve
canlıda WS2 uygulanmış. Onaylanmamalı, kapatılmalı.
⚠️ **m11 bayat:** "globale çıkış performans eşiğine bağlı" — eşikler 10 Ağustos'ta 0/0/0.

## 5) Batch E — 44 revizyon isteği

Triyaj: 43 madde, 20 yapılabilir, 23 ürün kararı/ekran görüntüsü bekliyor.

**Kapatılanlar (kanıtla, 44 → 39):** tagline, "Ol" satır kırılması, geri bildirim linki,
kafe kapasitesi, muhasebe bütçe.

**Düzeltilenler:** taşınma testi CTA regresyonu (2 Ağustos'ta gerekçesiz kilitlenmiş,
testler bozuk davranışı kilitliyordu) · dizin admin filtresi (SQL önek bakıyor, TS tam
eşleşme bakıyordu → `Admin_SuperAdmin` kaçıyordu) · cafe başlığı · composer etiketleme
ipucu · fallback uyarı şeridi · Radar rehberlerine ülke filtresi · dizinde kurum kayıtları
kart görünümü.

**Ölçümle kod işi olmadığı anlaşılanlar (not düşüldü, status korundu):**
- `fb174151` Cadde şehir filtresi: katalog dar seçilmiş değil, **üye konumlarından
  türüyor** (`cadde_profile_city_sync` trigger'ı). ABD'de 2 şehir görünmesinin sebebi
  ABD'de 2 üye olması. Karar gerekiyor — filtre yalnız dolu şehirleri mi göstersin?
- `9f1d416f` Radar metinleri: 9 kayıt, özeti boş olan 0, yedek cümleye düşen 0, ortalama
  70 karakter. Metinler gerçek ama kısa; `/admin/marquee`'den uzatılır.

---

## Sıradaki adımlar

1. **Üç ürün kararı** — (a) unvan yetki mi verir, (b) ek hedef ücretli mi, (c) m22 kapatılsın mı.
2. **45 maddeyi Burak'a tek turda sun** (rapor hazır).
3. Kalan yapılabilir revizyon maddeleri: renkli sonuç grafikleri, CTA'dan test sonucuna
   geri dönüş, kafe temaları, maskot, Çarşı etiket bağlantıları, araçlarda şehir seçimi.
4. WS1-7 (SMTP → e-posta doğrulaması) ve WS1-8/11 (OTP sağlayıcı) hâlâ dış karar bekliyor.

## Bu turda öğrenilen üç şey

1. **Kodun var olması kullanıcıda çalıştığı anlamına gelmez.** m9'da arayüz hazır, sunucu
   reddediyor; fontta link var, media yanlış. Kanıt = canlı ölçüm, kaynak okuması değil.
2. **Yönetici muafiyeti kusuru gizler.** `is_admin` muaf tutan her kontrolü normal üye
   hesabıyla sına — aksi hâlde "testçide çalışıyor, üyede bozuk" aylarca sürer.
3. **Test bozuk davranışı kilitleyebilir.** CTA regresyonunda üç iddia "Yakında" rozetini
   doğruluyordu. Testin geçmesi davranışın doğru olduğunu göstermez.
