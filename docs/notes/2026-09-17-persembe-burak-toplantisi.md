# Perşembe (17 Eylül) toplantısı — Burak ile konuşulacaklar

> Bu dosya UBT'nin Burak'la yüz yüze/sesli konuşurken önüne koyacağı bir hazırlık
> notu. Aşağıdaki üç mesaj, Komuta Merkezi'ndeki acil listeden (Top 10 Hot Fix)
> çıktı — sırasıyla Profil Menü Taşıma, Google Auth Custom Domain ve Etkinlik
> maddeleri.

---

## 1) Profil Menü Taşıma

**Burak, profil sayfasındaki menü konusunda senin görüşün lazım:**

Sağdaki sabit kolonu (sayfa kaydıkça yerinde kalıyor) soldan yapıp içine bölüm listesi koymayı düşünüyoruz — yani "Kişisel Bilgiler / İletişim / İlgi Alanları" gibi tıklanınca o bölüme atlayan bir liste. Amaç kullanıcının profili baştan sona kaydırmak zorunda kalmaması.

Senden karar bekleyenler:
1. **Telefonda ne olsun?** Dar ekranda sabit kolona yer yok. "Bölümler ▾" diye küçük bir açılır şerit mi koyalım, yoksa telefonda hiç göstermeyelim mi?
2. **Sol kolona geçince sayfanın geri kalanı sağa kayacak** — bu senin tasarımında sorun yaratır mı, yoksa rahat mı?
3. Bu değişikliği hangi sayfa(lar)da yapalım — sadece kendi profilini düzenleme ekranında mı, yoksa başkasının profilini görüntülerken de mi?

Tavsiyem (UBT'nin asistanından): kolon sola geçsin + bölüm listesi eklensin, sekmelere bölme (daha büyük bir yeniden tasarım ister), telefonda tamamen kaybetmek yerine küçük bir "Bölümler ▾" erişim noktası bırakalım.

---

## 2) Google Auth — Custom Domain (ücretli)

**Burak, Google girişindeki çirkin adres için bir maliyet kararı lazım:**

Google ile giriş yapan üye şu an "injprdrsklkxgnaiixzh.supabase.co uygulamasında oturum açın" yazan bir ekran görüyor — güven vermiyor. Düzeltmek için Supabase'de **Custom Domain add-on**'unu açıp kendi alt alan adımızı (öneri: `auth.corteqs.net`) bağlamamız gerekiyor. Bu **aylık ek bir ücret** demek — tam tutarı Supabase Dashboard'ın Billing/Add-ons sayfasından kontrol etmemiz lazım, henüz bakmadık.

Senden karar bekleyenler:
1. **Bu aylık ek maliyeti onaylıyor musun?** Onay olmadan iş ilerlemiyor.
2. Adres ismi `auth.corteqs.net` uygun mu, yoksa farklı bir isim mi istersin (örn. `login.corteqs.net`, `giris.corteqs.net`)?

Not: Panel erişimi (Google tarafındaki logo/isim ayarı) ve zamanlama (kesinti şimdi olabilir, gece beklemeye gerek yok) UBT tarafında zaten netleşti — bunlar senden beklenmiyor.

---

## 3) Etkinlik özelliği — ne tür bir şey olduğunu anlat

**Burak, "Etkinlikler" fikrini biraz açar mısın?**

Bu senin önerinmiş ("kolayca ekleyebileceğimiz ve kullanıcı çekecek bir fonksiyon") ama tam olarak ne tür bir şey kastettiğin netleşmedi. Aklında hangisi var:
- Cadde'de normal paylaşım gibi, ama tarihi ve yeri olan bir paylaşım mı?
- Etkinliklerin takvim ya da liste hâlinde göründüğü ayrı bir sayfa mı?
- Zaten var olan Cafe'nin "şu gün şu saatte" hâli mi?
- Yoksa başka bir şey mi?

UBT diğer üç kararı zaten verdi, sen bu vizyonu netleştirince iş tanımlanabilir:
- **Kim oluşturabilsin:** Onaylı kişiler (şehir elçileri, katkıcılar) — herkes değil, sadece biz de değil.
- **Kullanıcı ne yapabilsin:** "Geleceğim" diyebilsin / kayıt olsun (sadece okuma değil).
- **Cadde'deki "Etkinlikler" süzgeci:** Etkinlik üretilebilir hale gelince geri getirilecek (4 Ağustos'ta kaldırılmıştı, boş bir şeyi süzdüğü için).

---

## Sonraki adımlar (bilgi amaçlı, Burak'a gönderilmeyecek)

- Acil listede kalan: 5 grup maddesi (zaten Burak'a atanmış — GRUP EKLEME POLİTİKASI, GRUP ONAY AKIŞI, GRUP FORMU ALANLARI, ŞEHİR GRUPLARINI TOPLAMA, GRUP EKLEME ÇAĞRISI). Bunlar için de benzer mesajlar hazırlanabilir.
- Radar: 2 aydır sessizce bozuk olan günlük tarama, `RADAR_NEWS_CRON_SECRET` senkronizasyon hatası bulunup düzeltildi (13 Eylül). Yarın sabahki (05:00) gerçek cron çalışmasıyla doğrulanacak.
