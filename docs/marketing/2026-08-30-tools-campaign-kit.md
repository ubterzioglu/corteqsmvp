# CorteQS Araçlar — Üç Sütunlu Kampanya Kiti

Durum: **yayına hazır taslak; dışarı paylaşılmadı**  
Hedef: `https://corteqs.net/tools` · 18 aktif araç · ücretsiz üyelik gerekir.

Bu paket mevcut Social Vault üretim altyapısını tamamlar. Ayrıntılı görsel varyantları
`docs/social-share-outputs/social-share-vault-prompts.md`, WhatsApp uzun/kısa metinleri
`docs/marketing/2026-08-30-tools-whatsapp-post.md` içinde hazırdır.

## Ortak üretim çerçevesi

- Kare görsel: 1024×1024, sıcak krem zemin, koyu teal ana renk, kontrollü turuncu/mavi vurgu, en az %12 güvenli alan; okunabilir metin/logo/watermark yok.
- Video: kare görselden 6–8 saniye, yavaş push-in + 2–3 anlamlı obje hareketi; yüz/el bozulması, yeni nesne, yazı ve sert kamera hareketi yok.
- Metin: tek problem, tek somut çıktı, tek CTA. “Kesin sonuç”, “garanti iş/vize” veya mevzuat tavsiyesi iddiası yok.

## 18 araçlık üretim panosu

| Araç | Kare görsel brief'i | 6–8 sn video prompt'u | LinkedIn/teaser açılışı |
|---|---|---|---|
| Taşınma Hazırlık Skoru | Masada finans, evrak, dil ve iş dosyalarını dört parçalı pusulada karşılaştıran kişi | Pusula dört başlık arasında döner, iki eksik dosya yumuşakça öne gelir | “Yurt dışına taşınmaya hazır olmak bir his değil; dört ayrı hazırlık alanının toplamı.” |
| Ülke Seçimi | Üç şehir silüeti arasında bütçe, kariyer ve yaşam önceliklerini tartan kişi | Üç rota belirir, kriter simgeleri en uyumlu rotada birleşir | “Popüler ülke ile sana uygun ülke aynı şey olmayabilir.” |
| Şehir Eşleştirme | Ulaşım, kira, iş ve topluluk kartlarını şehir haritası üzerinde karşılaştıran çift | Harita pinleri sırayla parlar, en dengeli şehir merkezde kalır | “Bir şehri güzel yapan şey, senin günlük hayatına uyup uymadığıdır.” |
| Öncelikli Taşınma Sorunu | Evrak, ev, dil ve bütçe düğümleri içinden ilk çözülmesi gerekeni seçen kişi | Düğümler sırayla çözülür, ilk kritik adım tek ışıkla vurgulanır | “On sorun aynı anda görünüyorsa ilk hangisini çözmelisin?” |
| Meslek–Maaş Karşılaştırma | Aynı mesleği üç ülkede ücret ve satın alma gücü terazisinde kıyaslayan profesyonel | Ücret çubukları değil yaşam sepetleri dengelenir | “Maaşı para birimiyle değil, o şehirde kurduğu hayatla karşılaştır.” |
| İş Bulma Olasılığı | CV, dil seviyesi, deneyim ve network düğümlerini rota üzerinde birleştiren aday | Dört düğüm bağlanır, zayıf halka somut aksiyona dönüşür | “İş bulma ihtimalini artıran şey tek bir güçlü CV değil.” |
| Yurt Dışı Kariyer Yolu | Üç kariyer rotası önünde beceri çantasıyla karar veren kişi | Rotalar açılır, en gerçekçi ilk adım yaklaşır | “Aynı deneyimle üç farklı yurt dışı kariyer yolu mümkün.” |
| İlk 90 Gün Planlayıcı | Takvim, ev anahtarı, banka kartı ve sağlık dosyasını haftalara bölen yeni gelen | Takvim ilk hafta/ilk ay/90 gün olarak akar | “Taşındıktan sonraki ilk 90 gün, belirsiz bir liste olmak zorunda değil.” |
| Diaspora Ağı Eşleştirme | İki kişi arasında güvenli köprü ve onay işaretleri; iletişim bilgisi görünmez | İki taraf onay verince köprü tamamlanır | “Doğru şehirde doğru kişiyi bulmak, ilk ayları kısaltabilir.” |
| Expat Yaşam Tarzı Persona | Sosyal merkez, sakin mahalle ve mobil yaşam sahneleri arasında kendini bulan kişi | Üç yaşam sahnesi akar, uyumlu persona netleşir | “Yurt dışındaki iyi hayatın tek bir tarifi yok.” |
| Maaş Hesaplama (DE) | Brüt maaş zarfından vergi, sigorta ve net ödeme akışını inceleyen çalışan | Brüt zarf katmanlara ayrılır, net tutar sakin biçimde ortaya çıkar | “Almanya'da yıllık brüt maaş, cebine girecek rakam değildir.” |
| Vize Seçimi (DE) | Mavi Kart, Chancenkarte ve Ausbildung yollarını koşullarıyla karşılaştıran aday | Evrak simgeleri uygun rotalarda eşleşir; garanti işareti yok | “Almanya için ‘hangi vize?’ sorusunun cevabı profilindeki birkaç kritik ayrıntıda.” |
| Vatandaşlık Testi (DE) | Çalışma masasında soru kartları, eyalet haritası ve deneme sayacı | Kartlar kontrollü akar, deneme modu seçilir | “Einbürgerungstest ezber maratonu değil, düzenli pratik işi.” |
| StepStone Maaş Karşılaştırma (DE) | Maaşı sektör, deneyim ve eyalet medyanlarıyla karşılaştıran profesyonel | Üç referans çizgisi görünür, kişinin konumu aralarında belirir | “Teklifin yüksek mi, yoksa yalnızca rakamı mı büyük?” |
| Para Transferi (DE→TR) | Aynı gönderim tutarını ücret, kur ve net teslim açısından üç rotada kıyaslayan kişi | Ücretler ayrışır, alıcıya ulaşan net tutar öne gelir | “En düşük ücret, her zaman en çok TL ulaştıran yöntem değil.” |
| Banka Seçimi (DE) | Mobil kullanım, şube, ücret ve dil desteğini dört kartta kıyaslayan yeni gelen | Kartlar ihtiyaca göre sıralanır | “Almanya'da doğru banka, herkes için aynı banka değildir.” |
| Sigorta Seçimi (DE) | Sağlık, sorumluluk ve gelir güvenliği kalkanlarını önceliklendiren aile | Kalkanlar ‘önce/güçlü öneri/opsiyonel’ halkalarına yerleşir | “Her sigortayı aynı gün almak değil, doğru sırayı kurmak önemli.” |
| ZGEN Nesil Bulucu | Farklı kuşaklardan dört kişinin ortak masada iletişim kurması | Kuşak simgeleri çarpışmak yerine ortak konuşma balonunda birleşir | “Kuşak etiketi hüküm değil; iletişim farklarını konuşmak için bir başlangıç.” |

## LinkedIn metinleri

### 1 — Karar araçları

Yurt dışına taşınma kararları çoğu zaman tek bir soruya sıkışıyor: “Hangi ülke daha iyi?”

Oysa doğru soru daha kişisel: bütçem, mesleğim, dilim, yaşam beklentim ve hazırlık seviyem birlikte hangi seçenekleri gerçekçi kılıyor?

CorteQS Araçlar'da hazırlık skoru, ülke seçimi, şehir eşleştirme ve öncelikli sorun araçlarını aynı akışta topladık. Sonuç yalnız bir rozet değil; güçlü alanları, riskleri ve atılabilecek ilk adımı gösteriyor.

Ücretsiz üyelikle deneyin: https://corteqs.net/tools

#YurtDışı #GöçPlanlama #Kariyer #CorteQS

### 2 — Kariyer ve maaş

Bir iş teklifini yalnız brüt maaşla değerlendirmek, taşınma kararının yarısını görünmez bırakıyor.

Aynı meslek farklı ülkelerde ne kazandırıyor? Dil, deneyim ve network iş bulma ihtimalini nasıl değiştiriyor? Almanya'daki teklif sektör ve eyalet medyanının neresinde?

Meslek–Maaş Karşılaştırma, İş Bulma Olasılığı, Kariyer Yolu ve StepStone karşılaştırma araçları bu soruları ayrı ayrı görünür kılıyor.

Araçları inceleyin: https://corteqs.net/tools

#GlobalKariyer #Maaş #Almanya #CorteQS

### 3 — Almanya başlangıç paketi

Almanya planında birbirine bağlı dört soru var: hangi vize, net maaş ne olur, hangi banka ve hangi sigorta önce?

Bu kararları ayrı sekmelerde ve dağınık notlarda bırakmak yerine, CorteQS'te yedi Almanya aracını tek merkezde topladık. Amaç resmî danışmanlık vermek değil; seçenekleri ve ilk kontrol noktalarını anlaşılır hale getirmek.

Başlangıç noktası: https://corteqs.net/tools

#Almanya #Vize #BrütNet #YeniHayat #CorteQS

### 4 — İlk 90 gün ve topluluk

Taşınma günü bir bitiş değil; banka, ev, sağlık, kayıtlar ve sosyal çevrenin aynı anda başladığı gün.

İlk 90 Gün Planlayıcı işleri sıraya koyuyor. Diaspora Ağı Eşleştirme ise iletişim bilgilerini otomatik açmadan, iki tarafın onayıyla güvenli bir tanışma zemini kuruyor.

Planını ve destek ağını birlikte başlat: https://corteqs.net/tools

#Diaspora #YeniGelenler #Topluluk #CorteQS

## Kafe kampanya metinleri

### Kısa sosyal metin

“Yeni şehirde tanışmak için kalabalık bir grup değil, doğru masa gerekir. CorteQS Cafe: süreli, kontrollü ve konu odaklı küçük topluluklar. Yakında Cadde'de.”

### Uzun sosyal metin

“WhatsApp grubunda yüzlerce mesajın arasında kaybolmadan, aynı şehirde aynı konuyu konuşmak isteyen küçük bir grup düşünün. CorteQS Cafe'ler süreli açılır; katılım sahibi tarafından kabul edilir, profil görünürlüğü kontrollüdür ve sohbet yerine yönetilebilir paylaşım/yorum düzeni kullanır. Hızlı bağ kurmak için küçük, güvenli bir masa.”

### Görsel brief

Kare 1:1 sahnede farklı yaşlardan dört diaspora üyesi, sıcak ama modern bir dijital kafe masasında; arka planda şehir pini, süre göstergesi ve kapalı/onaylı giriş simgesi. Mesaj balonu kalabalığı yok, telefon ekranı ana unsur değil, metin/logo yok.

### Video prompt

Masadaki boş sandalyeler yumuşakça dolsun; şehir pini parlasın, onay halkası kapanıp güvenli masa oluşsun. 7 saniye, sabit kompozisyon, doğal mikro hareket, yeni kişi/obje üretme ve okunabilir yazı yok.

## Yayın kontrolü

1. Araç sayısı ve doğrudan URL canlıdan tekrar doğrulanır.
2. Vize/vergi/mevzuat metinlerine “kişisel/resmî danışmanlık değildir” notu eklenir.
3. Görselde resmî kurum logosu, bayrak dekorasyonu veya okunabilir sahte UI kullanılmaz.
4. UTM: `utm_source`, `utm_medium`, `utm_campaign=tools_launch_2026q3`, `utm_content=<tool_slug>`.
5. İnsan içerik onayı olmadan paylaşım yapılmaz.
