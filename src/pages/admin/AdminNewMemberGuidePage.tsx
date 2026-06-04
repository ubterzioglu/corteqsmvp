import AdminPageGuideAccordion, { type AdminPageGuideSection } from "@/components/admin/AdminPageGuideAccordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";

const guideSections: AdminPageGuideSection[] = [
  {
    title: "New Member System nedir?",
    items: [
      "Bu menü, login olmuş kullanıcıların rol, feature, profil alanı, public profil görünümü ve taxonomy sınıflandırmasını birlikte yönettiğin yeni yönetim alanıdır.",
      "Eski mantıkta birbirine karışan yetki, görünüm ve profil verisi artık ayrı ekranlara bölünmüştür. Böylece yanlış ekranda yanlış ayarı değiştirme riski azalır.",
      "Temel kural şudur: Rol ayrı, feature ayrı, attribute ayrı, public kart bölümü ayrı, taxonomy ayrı yönetilir.",
    ],
  },
  {
    title: "Hangi ekran ne için var?",
    items: [
      "`Loginli Kullanıcılar & Roller`: Kullanıcının ana rolünü görür ve değiştirirsin.",
      "`Roller & Featurelar`: Rol bazında gerçek yetkileri ve dashboard erişimlerini açıp kapatırsın.",
      "`Attribute Yönetimi`: Profil formundaki alanların açık/kapalı, zorunlu, public varsayılanı ve onay kurallarını belirlersin.",
      "`Profile Sections`: Public directory/profile kartında hangi bölümün görüneceğini ve sırasını ayarlarsın.",
      "`Taxonomy Yönetimi`: Consultant alt kategorileri ve business alt tipleri gibi sınıflandırmaları yönetirsin.",
      "`Feature Override`: Sadece tek kullanıcı için rol varsayımını ezerek geçici veya özel izin verirsin.",
    ],
  },
  {
    title: "Hangi sorunda hangi ekrana gitmelisin?",
    items: [
      "Kullanıcı yanlış profil deneyimi yaşıyorsa önce `Loginli Kullanıcılar & Roller` ekranında rolü kontrol et.",
      "Kullanıcı bir modüle veya dashboard sekmesine erişemiyorsa `Roller & Featurelar` ekranına git.",
      "Kullanıcı bir alanı göremiyor, dolduramıyor, gizleyemiyor veya alan zorunlu davranıyorsa `Attribute Yönetimi` ekranına git.",
      "Public profilde kart parçası eksik, fazla veya yanlış sıradaysa `Profile Sections` ekranına git.",
      "Consultant uzmanlık etiketi veya business subtype yanlışsa `Taxonomy Yönetimi` ekranına git.",
      "Sorun sadece tek kullanıcıdaysa ve herkesi etkilemeyecekse `Feature Override` kullan.",
    ],
  },
  {
    title: "Kategori değişikliği karar ağacı",
    items: [
      "Kategori görünmüyor veya yanlışsa önce kullanıcının rolünü doğrula; yanlış rol doğru taxonomy grubunu hiç göstermeyebilir.",
      "Rol doğruysa `Taxonomy Yönetimi` içinde ilgili grubun aktif, zorunlu ve seçim tipini kontrol et.",
      "Option pasif yapıldıysa yeni kullanıcılarda görünmez; eski kullanıcı kaydı duruyorsa ayrıca profil ekranından seçimi doğrula.",
      "Kategori değişikliğinden sonra şartlı alanlar beklenmiyorsa `Attribute Yönetimi` yerine önce taxonomy etkisini incele.",
      "Son kontrol olarak public profile veya directory görünümünde kategori etiketinin doğru isimle çıktığını doğrula.",
    ],
  },
  {
    title: "Ekranlar arasındaki görev ayrımı",
    items: [
      "`Roller & Featurelar` public kart görünümünü yönetmez; yalnızca gerçek feature/capability yönetir.",
      "`Attribute Yönetimi` taxonomy seçimi yapmaz; yalnızca alan davranışını yönetir.",
      "`Profile Sections` public/private veri kuralını değiştirmez; yalnızca section görünürlüğünü yönetir.",
      "`Taxonomy Yönetimi` bir feature flag ekranı değildir; sınıflandırma ve koşullu profil davranışı içindir.",
      "`Feature Override` alan, section veya taxonomy istisnası vermez; yalnızca feature override yazar.",
    ],
  },
  {
    title: "Önerilen çalışma sırası",
    items: [
      "1. Önce kullanıcının rolünü doğrula.",
      "2. Sonra feature erişimi gerekiyor mu kontrol et.",
      "3. Ardından attribute/form davranışını kontrol et.",
      "4. Consultant veya business ise taxonomy seçimini doğrula.",
      "5. Gerekirse public profile section görünümünü düzenle.",
      "6. En sonda, gerçekten gerekiyorsa kullanıcı bazlı override ver.",
    ],
  },
  {
    title: "Önemli operasyon notları",
    items: [
      "Önce rolü düzeltmeden override vermek genelde sistemi kirletir; mümkünse önce temel modeli düzelt.",
      "Aynı sorunu yaşayan birden fazla kullanıcı varsa override yerine rol, feature veya attribute seviyesinde çözüm düşün.",
      "Business subtype ve consultant category bazı alanları şartlı zorunlu yapabilir; bu yüzden özellikle bu rollerde profil ekranını test etmek önemlidir.",
      "Public profile tarafında veri görünmüyorsa sebep section kapalı olması, attribute public olmaması veya approval beklemesi olabilir.",
      "Kategori değişikliği yaptıktan sonra en az bir gerçek kullanıcı profiliyle form davranışını test etmek, sadece admin ayar ekranına bakmaktan daha güvenlidir.",
    ],
  },
];

const AdminNewMemberGuidePage = () => {
  return (
    <div className="space-y-4">
      <AdminPageGuideAccordion
        summary="New Member System içindeki tüm ekranların ne işe yaradığını, hangi durumda hangisini kullanman gerektiğini ve ekranların birbirinden nasıl ayrıldığını bu sayfadan topluca görebilirsin."
        sections={guideSections}
      />

      <Card>
        <CardHeader>
          <CardTitle>Genel Kullanım Kılavuzu</CardTitle>
          <CardDescription>
            Bu sayfa, New Member System menüsündeki tüm yönetim ekranları için tek noktadan hızlı karar desteği verir.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            New Member System artık tek bir “roller ekranı” değil; rol, yetki, profil alanı, public profil render ve taxonomy
            sınıflandırmasını ayrı ayrı yöneten bir yapı. Bu ayrım özellikle yanlış ekranda değişiklik yapıp beklenmedik yan etki
            üretmemen için önemli.
          </p>
          <p>
            Kısa özet: kullanıcı seviyesinde kim olduğunu `Rol`, ne yapabildiğini `Feature`, hangi bilgiyi dolduracağını
            `Attribute`, dışarıya nasıl görüneceğini `Profile Sections`, nasıl sınıflanacağını ise `Taxonomy` belirler.
            Yalnızca çok istisnai durumlarda `Feature Override` kullanılır.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNewMemberGuidePage;
