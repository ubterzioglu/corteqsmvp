-- Revizyon İstekleri — MVP Revizyon Listesi seed (revizyon_1.html, 51 madde).
-- Kaynak: MVP DÜZELTMELER.xlsx (25 madde, 12.06.2026) + MVP DÜZELTMELER TEXT.docx (26 madde, 17-18.07.2026).
-- Her madde revision_requests'e serbest kalem olarak eklenir (status=acik, priority=5 varsayılan).
-- title = madde metninin kendisi, detail = aynı metin (tam), area_label = BÖLÜM başlığı.
-- Idempotent: aynı title+area_label ikilisi zaten varsa (silinmemiş) tekrar eklenmez.

insert into public.revision_requests (title, detail, status, priority, area_label)
select v.title, v.detail, 'acik', 5, v.area_label
from (values
  ('Klişe ters yazılmış: ekonomik ve sosyal', 'Klişe ters yazılmış: ekonomik ve sosyal', 'HERO'),
  ('Searchde super admin yönetici vs çıkıyor', 'Searchde super admin yönetici vs çıkıyor', 'ARAMA SONRASI FİLTRE EKRANI'),
  ('Açıklama veya başka bir yerdeki yazım hataları', 'Açıklama veya başka bir yerdeki yazım hataları', 'PROFİL'),
  ('Ana Sayfadaki Şehir elçisi araması sonrası tüm dir. geliyor', 'Ana Sayfadaki Şehir elçisi araması sonrası tüm dir. geliyor', 'SEARCH'),
  ('Form ekranını göstersek ama üzerine ''Yakında'' bandı mı çeksek?', 'Form ekranını göstersek ama üzerine ''Yakında'' bandı mı çeksek?', 'RELOKASYON MOTORU'),
  ('Radardaki itemlara biraz daha uzun metinler koysak derim. Şu an çok mock/hazırlanılmamış gibi duruyor', 'Radardaki itemlara biraz daha uzun metinler koysak derim. Şu an çok mock/hazırlanılmamış gibi duruyor', 'RADAR'),
  ('Bunları daha başka nasıl düşünebiliriz. Bireysel Kullanıcılara default ilan ver açmak iyi olur. İkinci el ilan koyar ve Çarşıya çıkar', 'Bunları daha başka nasıl düşünebiliriz. Bireysel Kullanıcılara default ilan ver açmak iyi olur. İkinci el ilan koyar ve Çarşıya çıkar', 'RADAR'),
  ('Experimental kalmış burada', 'Experimental kalmış burada', 'RADAR'),
  ('Like destek vs pop over hoover olsun', 'Like destek vs pop over hoover olsun', 'CADDE'),
  ('Ülke ve Şehir Filtreleri fazla daralmış, ABD sadece Newyork Şehri çıkıyor..', 'Ülke ve Şehir Filtreleri fazla daralmış, ABD sadece Newyork Şehri çıkıyor..', 'CADDE'),
  ('User Manual gibi bir tasarım gelmiş- Ne olduğu belli alanların üstlerinde gereksiz açıklamalar var/Paylaşım satırına ''Paylaşım Oluştur'' yazılmış.', 'User Manual gibi bir tasarım gelmiş- Ne olduğu belli alanların üstlerinde gereksiz açıklamalar var/Paylaşım satırına ''Paylaşım Oluştur'' yazılmış.', 'CADDE'),
  ('Ekran görünümü ve yan menüler orta feed alanı sağdaki billboard bölgesi için belki mascotun ekran görüntüsünü verebiliriz', 'Ekran görünümü ve yan menüler orta feed alanı sağdaki billboard bölgesi için belki mascotun ekran görüntüsünü verebiliriz', 'CADDE'),
  ('Yani macro ile yazılmış da excele oturmuş gibi. Web sitesi veya sosyal medya Şablonu (estetiği biraz abartılı olur ama excel görünüme göre öyle denebilir)', 'Yani macro ile yazılmış da excele oturmuş gibi. Web sitesi veya sosyal medya Şablonu (estetiği biraz abartılı olur ama excel görünüme göre öyle denebilir)', 'CADDE'),
  ('AI arama barından filtre ekranına geçiyorsun, filtreleri uyguluyorsun ama arama işlevini tetikleyeceğin bir buton yok.', 'AI arama barından filtre ekranına geçiyorsun, filtreleri uyguluyorsun ama arama işlevini tetikleyeceğin bir buton yok.', 'CADDE'),
  ('https://corteqs.net/cadde. geliyor.', 'https://corteqs.net/cadde. geliyor.', 'TAŞINMA MOTORU TIKLANINCA'),
  ('Hata veriyor. Burada çalışmayan butonları bıraksak ama dondursak mı?', 'Hata veriyor. Burada çalışmayan butonları bıraksak ama dondursak mı?', 'HOŞGELDİN PAKETİ'),
  ('Dünya üzerinde daha çok nod ve bağlantı', 'Dünya üzerinde daha çok nod ve bağlantı', 'AĞI HARİTADA GÖR'),
  ('8 Kıta'' biraz fazla olmuş :) 6 desek?', '8 Kıta'' biraz fazla olmuş :) 6 desek?', '8 KITAYA YAYILMIŞ ŞEHİR'),
  ('Sistemin 5 Katmanı', 'Sistemin 5 Katmanı', 'AĞIN 5 KATMANI'),
  ('Kategoriler sıralaması Uzmanlar-İşletmeler-Kuruluşlar-Topluluklar-Şehir Elçileri-İnsanlar', 'Kategoriler sıralaması Uzmanlar-İşletmeler-Kuruluşlar-Topluluklar-Şehir Elçileri-İnsanlar', 'KATEGORİLER'),
  ('Kart gösterimi ''kuruluşlardaki'' gibi olabilir. Sadece İnsanlarda satır satır olabilir.', 'Kart gösterimi ''kuruluşlardaki'' gibi olabilir. Sadece İnsanlarda satır satır olabilir.', 'KATEGORİLERE GİRİNCE KART GÖSTERİMİ'),
  ('Founders''a gidiyor', 'Founders''a gidiyor', 'ŞEHİR ELÇİLERİ'),
  ('Ülke ve Şehir Filtresi', 'Ülke ve Şehir Filtresi', 'HABERLER VE REHBERLER'),
  ('Yurt dışındaki hayatı şekillendiren sisteme katıl', 'Yurt dışındaki hayatı şekillendiren sisteme katıl', 'Yurt dışındaki Türk hayatını şekillendiren ağa katıl'),
  ('Buradaki tasarım planı nedir?', 'Buradaki tasarım planı nedir?', 'KULLANICI PANELİ'),
  ('''Ol'' tek başına kalmış tasarımda — metin akışın sağındaki kutuda yer alıyor.', '''Ol'' tek başına kalmış tasarımda — metin akışın sağındaki kutuda yer alıyor.', 'CADDE ▸ Cadde İçinde Görünür Ol'),
  ('''Geri bildirim'' WhatsApp hoşgeldine gidiyor. Maile / Corbot''a veya iletişim kutusuna mı gitse?', '''Geri bildirim'' WhatsApp hoşgeldine gidiyor. Maile / Corbot''a veya iletişim kutusuna mı gitse?', 'CADDE ▸ Cadde İçinde Görünür Ol'),
  ('Akışın üzerindeki saatler 3 taneye düşebilir; biraz daha sempatik tasarımlara bakabiliriz.', 'Akışın üzerindeki saatler 3 taneye düşebilir; biraz daha sempatik tasarımlara bakabiliriz.', 'CADDE ▸ Cadde İçinde Görünür Ol'),
  ('''Bu kapsamda ilan yok — ilk ilanı sen ver.'' metni.', '''Bu kapsamda ilan yok — ilk ilanı sen ver.'' metni.', 'CADDE ▸ Çarşı'),
  ('İlan ver mantığı nasıl çalışacak — foto / video vs. girilecek mi?', 'İlan ver mantığı nasıl çalışacak — foto / video vs. girilecek mi?', 'CADDE ▸ Çarşı'),
  ('Bu kısmın çalışma mantığını yerleştirelim. Taglere tıklayınca kategorilere veya (çalışıyorsa) fonksiyonlara gidebilir.', 'Bu kısmın çalışma mantığını yerleştirelim. Taglere tıklayınca kategorilere veya (çalışıyorsa) fonksiyonlara gidebilir.', 'CADDE ▸ Çarşı'),
  ('Tema''lar tema değil kategori olmuş.', 'Tema''lar tema değil kategori olmuş.', 'CADDE ▸ Kafe Açış Formu'),
  ('Temalar: spor, sağlık, gusto, hobi, girişim, party, meslek, iş, ik, müzik, gündem.', 'Temalar: spor, sağlık, gusto, hobi, girişim, party, meslek, iş, ik, müzik, gündem.', 'CADDE ▸ Kafe Açış Formu'),
  ('Marka isimlere blue tik verelim. Bilinen cafe ve markalar veri tabanımız olsun; bu isimleri sadece belgeli profil açanlar kullanabilsin. Gucci Cafe, Big Chefs, Starbucks açamasınlar; açmak isterler...', 'Marka isimlere blue tik verelim. Bilinen cafe ve markalar veri tabanımız olsun; bu isimleri sadece belgeli profil açanlar kullanabilsin. Gucci Cafe, Big Chefs, Starbucks açamasınlar; açmak isterlerse başlarına ''Parodi'' eklensin.', 'CADDE ▸ Kafe Açış Formu'),
  ('Kapasite için 50 — 100 — 250 — 500 — 999 yapalım.', 'Kapasite için 50 — 100 — 250 — 500 — 999 yapalım.', 'CADDE ▸ Kafe Açış Formu'),
  ('Billboard veya sponsorlu akışta yer almak için talep bırak.', 'Billboard veya sponsorlu akışta yer almak için talep bırak.', 'CADDE ▸ Billboard / Sponsorlu'),
  ('Bunun yerine ilan vermeyi çalıştırsak? İlan verme tamamlandığında (Stripe eklentisi gelince) ödeme yapıp ilan yayınlanabilir densin. İçerisi biraz dolunca; önce Global, sonra ülkeler arttıkça ülke ...', 'Bunun yerine ilan vermeyi çalıştırsak? İlan verme tamamlandığında (Stripe eklentisi gelince) ödeme yapıp ilan yayınlanabilir densin. İçerisi biraz dolunca; önce Global, sonra ülkeler arttıkça ülke ekranlarına yavaşça alalım.', 'CADDE ▸ Billboard / Sponsorlu'),
  ('Paylaşım yaparken tagleme olayını netleştirelim.', 'Paylaşım yaparken tagleme olayını netleştirelim.', 'CADDE ▸ Paylaşım'),
  ('Doğrudan text, foto-video paylaşsa… konuşalım.', 'Doğrudan text, foto-video paylaşsa… konuşalım.', 'CADDE ▸ Paylaşım'),
  ('''Aktif Cafe Özeti'' yerine: Cafe''ler (seçilen filtre dahilinde).', '''Aktif Cafe Özeti'' yerine: Cafe''ler (seçilen filtre dahilinde).', 'CADDE ▸ Feed / Filtre'),
  ('Aşağıdaki bölüme ihtiyaç var mı? Kullanıcı direkt ne istiyorsa paylaşsa?', 'Aşağıdaki bölüme ihtiyaç var mı? Kullanıcı direkt ne istiyorsa paylaşsa?', 'CADDE ▸ Feed / Filtre'),
  ('Cadde refresh olduğunda footer''a gidiyor.', 'Cadde refresh olduğunda footer''a gidiyor.', 'CADDE ▸ Feed / Filtre'),
  ('''Yurt Dışındaki Yaşamın Sistemi'' diyelim. (Bir araya gelmek istiyor muyuz, emin değiliz.)', '''Yurt Dışındaki Yaşamın Sistemi'' diyelim. (Bir araya gelmek istiyor muyuz, emin değiliz.)', 'CADDE ▸ Tool Sayfası Tagline'),
  ('ISO ile ülke-şehir doldurma biraz zorlayıcı olabilir. Burada drill-down çalıştırsak?', 'ISO ile ülke-şehir doldurma biraz zorlayıcı olabilir. Burada drill-down çalıştırsak?', 'ARAÇLAR (17.07.2026) ▸ Hangi Ülke Sana Uygun'),
  ('Test bittikten sonra çıkan yatay bar grafikler; görselli kutular içinde renkli grafikler olabilir mi?', 'Test bittikten sonra çıkan yatay bar grafikler; görselli kutular içinde renkli grafikler olabilir mi?', 'ARAÇLAR (17.07.2026) ▸ Hangi Ülke Sana Uygun'),
  ('Test altındaki ''Berlin''de diaspora üyelerine ulaş'' CTA''leri çok başarılı. Ancak tıklayınca Berlin aramasına düşüyorsun (iyi) ama test sonuç sayfasına dönemiyorsun — geri dönüş koyalım. Test sonucun...', 'Test altındaki ''Berlin''de diaspora üyelerine ulaş'' CTA''leri çok başarılı. Ancak tıklayınca Berlin aramasına düşüyorsun (iyi) ama test sonuç sayfasına dönemiyorsun — geri dönüş koyalım. Test sonucunu kişi paylaşabilir mi (email, WhatsApp) veya kendi profiline dosya olarak koysak mı?', 'ARAÇLAR (17.07.2026) ▸ Hangi Ülke Sana Uygun'),
  ('Oluşan ilgi alanları ve kullanıcı profili verilerinden marketplace teklifi gönderebileceğimiz düşünülünce, sonucu kendi profiline kaydetmek en akıllıcası.', 'Oluşan ilgi alanları ve kullanıcı profili verilerinden marketplace teklifi gönderebileceğimiz düşünülünce, sonucu kendi profiline kaydetmek en akıllıcası.', 'ARAÇLAR (17.07.2026) ▸ Hangi Ülke Sana Uygun'),
  ('Sistem, araçlardan biriken sonuç dosyalarını bir havuzda toplar; talepleri platforma kayıtlı hizmet sağlayıcılardan karşılayabilir. ''Platformda kayıtlı N talep var, teklif gönderenlerden olmak iste...', 'Sistem, araçlardan biriken sonuç dosyalarını bir havuzda toplar; talepleri platforma kayıtlı hizmet sağlayıcılardan karşılayabilir. ''Platformda kayıtlı N talep var, teklif gönderenlerden olmak ister misin?'' CTA''sı yaratabiliriz; havuz günlük update olarak düşer.', 'ARAÇLAR (17.07.2026) ▸ Hangi Ülke Sana Uygun'),
  ('UK seçtim, testi çözdüm, sona geldim: ''aradığın kriterde şehir bulunamadı'' diyor. Buna cevap üretmek lazım; test zahmetine giren kişi hayal kırıklığı yaşar.', 'UK seçtim, testi çözdüm, sona geldim: ''aradığın kriterde şehir bulunamadı'' diyor. Buna cevap üretmek lazım; test zahmetine giren kişi hayal kırıklığı yaşar.', 'ARAÇLAR (17.07.2026) ▸ Hangi Ülke Sana Uygun'),
  ('Meslek seçeneği az.', 'Meslek seçeneği az.', 'ARAÇLAR (17.07.2026) ▸ Mesleğiniz Dünyada Ne Kazandırıyor?'),
  ('Test sonucu çıkan CTA linklerinden ikisi çalışmıyor.', 'Test sonucu çıkan CTA linklerinden ikisi çalışmıyor.', 'ARAÇLAR (17.07.2026) ▸ Yurt Dışına Taşınmaya Hazır mısınız?')
) as v(title, detail, area_label)
where not exists (
  select 1 from public.revision_requests r
  where r.title = v.title and r.area_label = v.area_label and r.deleted_at is null
);
