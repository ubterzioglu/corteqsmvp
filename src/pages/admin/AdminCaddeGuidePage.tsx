// Cadde Kural Kitabı (/admin/cadde/rehber) — Cadde'nin kullanıcı ve admin tarafını
// günlük dille, adım adım anlatan rehber sayfası. Topluluk Kılavuzu (AdminCommunityGuidePage)
// ile aynı sınıftadır: statik içerik, veri çekmez. Cadde'de davranış değişen bir güncelleme
// yapıldığında buradaki ilgili maddeyi de güncelle.

import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type GuideSection = {
  id: string;
  title: string;
  items: string[];
};

const userSections: GuideSection[] = [
  {
    id: "cadde-nedir",
    title: "1. Cadde nedir? Kısa tanıtım",
    items: [
      "Cadde, üyelerimizin sosyal sokağı. Tek bir adreste (/cadde) dört şey bir arada yaşar: paylaşım akışı (insanların yazdığı gönderiler), Cafe'ler (süreli sohbet odaları), Çarşı (üyeler arası ilan panosu) ve Tanıtım (sponsorlu görünürlük kampanyaları).",
      "Sokak metaforu bilinçli: akış caddenin kendisi, Cafe'ler caddedeki oturma mekânları, Çarşı alışveriş bölümü, Tanıtım da caddedeki panolar gibi düşünülebilir.",
      "Cadde çok diasporalı çalışır: Türk, Hint, Çin ve Filipinli toplulukların içerikleri birbirinden ayrıdır, birbirine karışmaz. Her üye kendi topluluğunun caddesini görür.",
    ],
  },
  {
    id: "kim-girebilir",
    title: "2. Kim girebilir, kim paylaşım yapabilir?",
    items: [
      "Okumak için üye girişi yeterli. Giriş yapan her üye akışı gezebilir, içerikleri okuyabilir.",
      "Yazmak (paylaşım, yorum, cafe, ilan...) için üyenin profilinde ülke ve şehir bilgisi dolu olmalı. Eksikse sistem üyeye nazikçe 'önce profilini tamamla' der ve hangi alanın eksik olduğunu gösterir.",
      "Telefon doğrulama şartı da var ama şu an kapalı tutuyoruz. Açıldığında, yazma işlemleri için doğrulanmış telefon istenecek. Bu bir açma/kapama anahtarıdır; açmak için kod değişikliği gerekmez, geliştiriciye söylemen yeterli.",
      "Paylaşım yetkisi üyenin rolüne bağlıdır. Yetkisi olmayan üye bir şey denediğinde Türkçe ve anlaşılır bir uyarı görür ('Hesabının Cadde paylaşım yetkisi bulunmuyor' gibi) — teknik hata mesajı görmez.",
      "Çok hızlı arka arkaya işlem yapan üyeye sistem 'biraz yavaşla' der: paylaşım, yorum, cafe açma gibi işlemlerin hepsinde hız sınırı vardır. Sınırlar ayar tablosundadır (aşağıda 'Limitler' bölümüne bak).",
    ],
  },
  {
    id: "akis-siralamasi",
    title: "3. Akış nasıl sıralanıyor? (Üye neyi neden üstte görür)",
    items: [
      "Temel fikir: herkese aynı liste değil, üyeye yakın olan üstte. Sıra şöyle işler:",
      "En üstte: üyeyle aynı şehirden gelen ve üyenin işaretlediği ihtiyaçla eşleşen paylaşımlar (örneğin üye 'ev arıyorum' demişse, şehrindeki ev ilanı tadındaki paylaşımlar).",
      "Sonra: aynı şehirden gelen diğer paylaşımlar, ardından aynı ülkeden gelenler.",
      "Daha sonra: şehir/ülke eşleşmesi olmayan ama çok ilgi görmüş (yorum ve beğeni almış) global paylaşımlar.",
      "En sonda: kalan global içerik.",
      "Tazelik de puan kazandırır: ilk 6 saatteki paylaşım en çok, ilk gün biraz daha az, ilk hafta az miktarda öne çıkar. Bir haftadan eski içerik tazelik avantajını kaybeder.",
      "Üye en fazla 3 ilgi alanı etiketi seçebilir; paylaşımın etiketleriyle eşleşme oldukça paylaşım o üye için öne çıkar.",
      "Sabitlenmiş içerik (admin'in öne çıkardığı) her şeyin üstüne geçer.",
    ],
  },
  {
    id: "kopru",
    title: "4. Köprü nedir, kim Köprü'ye yazabilir?",
    items: [
      "Köprü, yurt dışındaki üyelerle Türkiye arasındaki özel akıştır — 'memleketle bağ kurma' kanalı.",
      "Yurt dışında yaşayan her üye (profili tamamsa) Köprü'ye yazabilir.",
      "Türkiye'de yaşayan bireysel üyeler yalnız bir koşulla yazabilir: profillerinde 'yurt dışına taşınma planım var' işaretliyse. Mantık şu: Köprü gerçekten taşınma/geri dönüş yolculuğundaki insanlar için.",
      "Türkiye'deki kurum ve işletme hesapları ise yalnız 'dijital topluluk' özelliği açıksa yazabilir — yani diasporaya hizmet verdiğini beyan etmiş hesaplar.",
      "Adminler ve moderatörler her zaman yazabilir.",
      "Bir de tersi kural var: Türkiye'de yaşayan üye, normal Cadde akışında yalnız Türkiye kapsamına paylaşım yapabilir. Almanya akışına yazmak isterse sistem onu Köprü'ye yönlendirir.",
    ],
  },
  {
    id: "cafe",
    title: "5. Cafe — süreli sohbet odaları",
    items: [
      "Herhangi bir yetkili üye cafe açabilir: bir ad (3-80 karakter), kısa bir özet, başlangıç/bitiş zamanı ve istersen kişi kapasitesi belirler.",
      "Üç giriş tipi vardır: 'Herkese açık' (tıklayan girer), 'Onaylı' (cafe sahibi bir giriş sorusu sorar, cevaplara bakıp tek tek onaylar) ve 'Davet kodlu' (kodu bilen girer).",
      "İstersen cafe 'yalnız Türkiye'de yaşayanlara açık' olarak işaretlenebilir.",
      "Uygunsuz cafe adlarını (küfür, parti propagandası, kumar/bahis, ad içinde link) sistem daha form aşamasında keser. Şüpheli ama emin olunamayan adlar yayına girer fakat moderasyon kuyruğuna da düşer — son karar her zaman moderatörde.",
      "Kapasite dolunca katılım kendiliğinden kapanır. Cafe bitmeden 30 dakika önce katılımcılara otomatik hatırlatma bildirimi gider.",
      "Cafe süresi biten veya arşivlenen odalara yeni katılım ve yeni mesaj kapanır; geçmiş okunabilir kalır.",
      "Günde kaç cafe açılabileceği gibi sınırlar ayar tablosundadır.",
    ],
  },
  {
    id: "carsi",
    title: "6. Çarşı — üyeler arası ilan panosu",
    items: [
      "Üyeler birbirine yönelik ilan verir: başlık (3-100 karakter), açıklama (en çok 2000 karakter), fiyat ve para birimi, en fazla 6 görsel.",
      "Her üyenin aynı anda açık tutabileceği ilan sayısı sınırlıdır. Sınıra ulaşan üye yeni ilan vermek için eski bir ilanını kapatır.",
      "Para platformdan geçmez. Çarşı bir buluşturma yeridir: ilanla ilgilenen üye, ilan sahibinin profiline gider ve iletişimi oradan kurar.",
      "Bir üye ilandan ilan sahibinin profiline gittiğinde, sahibine 'ilanınla ilgilenen var' bildirimi düşer (aynı kişi için günde en fazla bir kez — bildirim yağmuru olmasın diye).",
      "İlanlar da şikayet edilebilir ve sistemin otomatik taramasından geçer (aşağıda 'Bildirimler ve şikayet' bölümüne bak).",
    ],
  },
  {
    id: "tanitim",
    title: "7. Tanıtım — sponsorlu görünürlük kampanyaları",
    items: [
      "Bir üye (genelde işletme), içeriğini Cadde'de öne çıkarmak için kampanya başvurusu yapar: başlık, açıklama, tarih aralığı ve kampanyanın nerede görüneceği seçilir.",
      "Her başvuru admin onayına düşer; onaylanmadan hiçbir kampanya yayına girmez.",
      "Onaylanan kampanya, tarih aralığı geldiğinde kendiliğinden yayınlanır ve süresi bitince kendiliğinden kalkar — elle açıp kapatmak gerekmez.",
      "Reddedersen yazdığın gerekçe üyenin panelinde görünür. Onayda da redde de üyeye bildirim gider.",
    ],
  },
  {
    id: "bildirim-sikayet",
    title: "8. Bildirimler ve şikayet (üye gözünden)",
    items: [
      "Üye şu durumlarda anında bildirim alır: paylaşımına yorum veya beğeni gelince, cafe katılım talebi onaylanınca, kampanya başvurusu sonuçlanınca, ilanıyla ilgilenen biri olunca.",
      "Her içeriğin yanında bir bayrak ikonu vardır. Üye uygunsuz bulduğu paylaşımı, yorumu, cafe'yi veya ilanı kısa bir sebep yazarak şikayet eder.",
      "Şikayet, içeriği anında kaldırmaz — moderasyon kuyruğuna düşer ve kararı moderatör verir. Böylece şikayet butonu bir 'sansür silahına' dönüşmez.",
      "Sistem ayrıca her yeni içeriği kendiliğinden tarar (küfür, kumar/bahis reklamı, spam kalıpları). Şüpheli bulduğunu yayından kaldırmadan kuyruğa ekler; insan kararı esastır.",
    ],
  },
];

const adminSections: GuideSection[] = [
  {
    id: "admin-ekranlar",
    title: "9. Admin tarafı: dört ekran, dört görev",
    items: [
      "Cadde Yönetimi (/admin/cadde): içerik yönetiminin ana ekranı. Paylaşımları ve cafe'leri buradan görür, gerekirse düzenler veya öne çıkarırsın.",
      "Moderasyon Kuyruğu (/admin/cadde/moderation): üye şikayetleri ile sistemin otomatik yakaladığı şüpheli içerikler tek listede toplanır. Otomatik yakalananlar 'auto:' etiketiyle gelir, üye şikayetinden ayırt edersin.",
      "Kuyruktaki her kayıt için dört seçeneğin var: 'Kapat' (sorun yok, dosyayı kapat), 'Gizle' (içeriği yayından kaldır), 'Geri Yayınla' (gizlenmişi geri aç), 'Sahibini Banla' (7 gün yazma yasağı). Yazdığın not karar kaydına işlenir ve içerik sahibine bildirimle gider.",
      "Tanıtım Onayı (/admin/cadde/promotions): bekleyen kampanya başvuruları burada. Onayla veya gerekçe yazıp reddet; gerisi (yayına girme/çıkma) takvimle kendiliğinden işler.",
      "Çarşı Denetimi (/admin/cadde/carsi): bütün ilanlar durum filtresiyle (yayında / pasif / reddedilmiş) listelenir. Uygunsuz ilanı 'Gizle' ile kaldırır, düzeltilmişi 'Yayınla' ile geri açarsın. Her işlem kayıt altına alınır ve ilan sahibine bildirim gider.",
    ],
  },
  {
    id: "ban",
    title: "10. Ban nasıl çalışır?",
    items: [
      "Banladığın üye okumaya devam eder ama Cadde'de hiçbir yere yazamaz: paylaşım, yorum, beğeni, cafe açma/katılma, ilan, kampanya — hepsi tek seferde kapanır.",
      "Bunu tek tek kapatmana gerek yok; ban tek bir merkezi anahtardır, Cadde'deki bütün yazma kapılarını aynı anda kilitler. İleride Cadde'ye yeni bir özellik eklense bile banlı üye ona da otomatik yazamaz.",
      "Süre dolunca her şey kendiliğinden açılır; elle kaldırman gerekmez.",
      "Ban üyeye bildirilir ve denediği her yazma işleminde 'Hesabın Cadde'de kısıtlanmış durumda' mesajını görür.",
    ],
  },
  {
    id: "limitler",
    title: "11. Limitler ve ayarlar — kod gerekmez",
    items: [
      "Cadde'deki bütün sayısal kurallar (günde kaç cafe açılabilir, kaç aktif ilan tutulabilir, yorum hız sınırı, cafe süre üst sınırı...) tek bir ayar tablosunda durur.",
      "Telefon doğrulama şartı da aynı yerde bir açma/kapama anahtarıdır.",
      "Bir limiti değiştirmek ürün kararıdır, yazılım işi değildir: 'günlük cafe sınırını 3'ten 5'e çıkaralım' demen yeterli — geliştirici tek bir ayar değişikliğiyle uygular, site yeniden yayınlanmaz.",
    ],
  },
  {
    id: "rutin",
    title: "12. Önerilen günlük moderasyon rutini",
    items: [
      "1. Günde 1-2 kez Moderasyon Kuyruğu'na bak; önce üye şikayetlerini, sonra 'auto:' etiketlileri ele al.",
      "2. Emin olamadığın içerikte 'Gizle' kullan — geri alınabilir bir karardır, 'Geri Yayınla' ile düzeltirsin. Ban son çaredir; tekrarlayan veya kasıtlı ihlallerde kullan.",
      "3. Her kararda kısa bir not yaz. Not hem kayıt defterine geçer hem üyeye gider; 'neden gizlendi' sorusunu baştan cevaplar.",
      "4. Tanıtım Onayı ekranını günde bir kez kontrol et; bekleyen kampanya üyeyi bekletmek demektir.",
      "5. Haftada bir Çarşı Denetimi'nde yayındaki ilanları hızlıca tara; eskimiş veya şüpheli ilanları ele al.",
      "6. Aynı üyeden üst üste şikayet geliyorsa geçmiş kararlarına bak; desen varsa ban düşün, yoksa içerik bazında kal.",
    ],
  },
];

const SectionCard = ({ section }: { section: GuideSection }) => (
  <Card id={section.id}>
    <CardHeader className="pb-3">
      <CardTitle className="text-base">{section.title}</CardTitle>
    </CardHeader>
    <CardContent>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {section.items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

const AdminCaddeGuidePage = () => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Cadde Kural Kitabı</CardTitle>
          <CardDescription>
            Cadde'nin üye tarafında nasıl yaşadığını ve admin tarafında nasıl yönetildiğini günlük dille, adım adım anlatır.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Bu rehber iki bölümdür: önce üyenin gözünden Cadde (1-8), sonra senin gözünden yönetim (9-12). Teknik bilgi
            gerektirmez; amaç, Cadde'yle ilgili bir karar verirken veya bir üye sorusu cevaplarken tek sayfada doğru bilgiye
            ulaşmandır. Kuralların asıl uygulayıcısı sistemin kendisidir — burada anlatılanlar sistemin zaten otomatik
            işlettiği kurallardır.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild variant="outline">
              <Link to="/admin/cadde">Cadde Yönetimi</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/cadde/moderation">Moderasyon Kuyruğu</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/cadde/promotions">Tanıtım Onayı</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/cadde/carsi">Çarşı Denetimi</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/cadde">Canlı Cadde'yi Aç</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-1">
        <h2 className="px-1 text-sm font-semibold text-foreground">Üye tarafı — Cadde üyeler için nasıl çalışır?</h2>
      </div>
      {userSections.map((section) => (
        <SectionCard key={section.id} section={section} />
      ))}

      <div className="space-y-1 pt-2">
        <h2 className="px-1 text-sm font-semibold text-foreground">Admin tarafı — Cadde nasıl yönetilir?</h2>
      </div>
      {adminSections.map((section) => (
        <SectionCard key={section.id} section={section} />
      ))}
    </div>
  );
};

export default AdminCaddeGuidePage;
