import AdminPageGuideAccordion, { type AdminPageGuideSection } from "@/components/admin/AdminPageGuideAccordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";

const guideSections: AdminPageGuideSection[] = [
  {
    title: "Yeni sistemin mantığı",
    items: [
      "Bu alan, yeni üye sistemindeki tüm operasyon ekranlarını tek bir akışta toplar.",
      "Yeni yapıda önce üyeyi bulur, sonra rolünü kontrol eder, gerekiyorsa rol kurallarını düzenler, en sonda da gerçekten ihtiyaç varsa override verirsin.",
      "Temel mantık şudur: genel kural önce rolde çözülür, tekil istisna gerekiyorsa override kullanılır.",
    ],
  },
  {
    title: "Menü sırasıyla ekranlar ne işe yarar?",
    items: [
      "`Üye Takibi`: Tüm üye havuzunu, operasyon akışını ve genel üye incelemesini buradan yönetirsin.",
      "`Loginli Üyeler & Roller`: Login olmuş kullanıcının aktif rolünü görür ve ana rol atamasını burada değiştirirsin.",
      "`Rol Yönetimi`: Rol bazında attribute, feature ve profile section kurallarını tek tabloda görür ve düzenlersin.",
      "`Feature Override`: Sadece tek kullanıcı için rol varsayımını bozmadan özel feature istisnası verirsin.",
      "`Roller Önizleme`: Sistemde tanımlı aktif rolleri sadece okunur şekilde kontrol edersin.",
      "`AFS Önizleme`: Attribute, Feature ve Section kataloglarını sadece okunur şekilde toplu olarak görürsün.",
      "`Onboarding Importları`: Onboarding tarafından gelen veri setlerini, mapping mantığını ve import akışlarını yönetirsin.",
      "`Kullanım Klavuzu`: Bu ekranların hangi sırayla ve hangi durumda kullanılacağını hızlıca tekrar hatırlarsın.",
    ],
  },
  {
    title: "Hangi durumda hangi ekrana gitmelisin?",
    items: [
      "Kullanıcıya yanlış deneyim açılıyorsa önce `Loginli Üyeler & Roller` ekranında rol doğru mu diye bak.",
      "Aynı sorun o roldeki herkesi etkiliyorsa `Rol Yönetimi` ekranına git ve genel kuralı orada düzelt.",
      "Sorun sadece bir kişide varsa ve diğer aynı rol kullanıcılarında olmaması gerekiyorsa `Feature Override` kullan.",
      "Rol adlarını, sluglarını veya açıklamalarını toplu kontrol etmek istiyorsan `Roller Önizleme` ekranına git.",
      "Bir kaydın attribute mu feature mi section mı olduğunu hızlıca anlamak istiyorsan `AFS Önizleme` ekranına git.",
      "Onboarding kaynaklı veri eksiği, toplu veri girişi veya import kontrolü gerekiyorsa `Onboarding Importları` ekranına git.",
    ],
  },
  {
    title: "Rol Yönetimi ekranını nasıl okumalısın?",
    items: [
      "Tablodaki `A` kayıtları attribute'tur; form alanı davranışını temsil eder.",
      "Tablodaki `F` kayıtları feature'dir; modül veya capability açık-kapalı durumunu temsil eder.",
      "Tablodaki `S` kayıtları profile section'dir; profil kartında hangi bölümün nasıl göründüğünü temsil eder.",
      "Rol seçmeden katalog görünür; rol seçtiğinde aynı satırlarda o role ait kurallar aktif edit moduna döner.",
      "Bir değişikliği kaydetmeden önce bunun rol seviyesi genel kural mı yoksa tekil istisna mı olduğuna karar ver.",
    ],
  },
  {
    title: "Önerilen çalışma sırası",
    items: [
      "1. Önce `Üye Takibi` veya ilgili operasyon kaydından kullanıcıyı bul.",
      "2. Sonra `Loginli Üyeler & Roller` ekranında ana rol atamasını kontrol et.",
      "3. Sorun rol kaynaklıysa `Rol Yönetimi` ekranında attribute, feature veya section satırını düzelt.",
      "4. Sorun sadece tek kullanıcıya özelse `Feature Override` ile istisna ver.",
      "5. Son kontrol için `Roller Önizleme` ve `AFS Önizleme` ekranlarından kayıt tanımlarını çapraz kontrol et.",
      "6. Veri girişi veya toplu kaynak güncellemesi gerekiyorsa `Onboarding Importları` tarafına geç.",
    ],
  },
  {
    title: "Operasyon kuralları",
    items: [
      "Override'i ilk çözüm olarak kullanma; önce rol seviyesinde çözülüp çözülemeyeceğine bak.",
      "Aynı problem birden fazla kullanıcıda varsa genel kuralı `Rol Yönetimi` tarafında düzeltmek daha temizdir.",
      "`Roller Önizleme` ve `AFS Önizleme` ekranları düzenleme için değil, kontrol ve doğrulama içindir.",
      "Rol değişikliği yaptığında kullanıcının gerçek deneyimini mutlaka ilgili ekran veya profil akışında test et.",
      "Onboarding import değişiklikleri canlı akışı etkileyebileceği için mapping ve hedef alan kontrolünü ikinci kez doğrulamak güvenlidir.",
    ],
  },
];

const AdminNewMemberGuidePage = () => {
  return (
    <div className="space-y-4">
      <AdminPageGuideAccordion
        summary="Yeni üyeler menüsündeki ekranların ne işe yaradığını, hangi durumda hangisini kullanman gerektiğini ve önerilen operasyon sırasını bu sayfada madde madde görebilirsin."
        sections={guideSections}
      />

      <Card>
        <CardHeader>
          <CardTitle>Kullanım Klavuzu</CardTitle>
          <CardDescription>
            Bu sayfa, güncel üyeler menüsündeki ekranlar için tek noktadan hızlı karar desteği verir.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Yeni akışta üye operasyonu, rol ataması, rol kuralı, tekil override, katalog önizleme ve onboarding import adımları
            birbirinden ayrıldı. Böylece önce doğru seviyede karar verip sonra doğru ekranda işlem yapman kolaylaşır.
          </p>
          <p>
            Kısa özet: kullanıcının ana kimliği önce `Rol` ile belirlenir, rolün tüm üye grubuna uygulanan kuralları
            `Rol Yönetimi` ile düzenlenir, yalnızca tek kişiye özel sapma gerekiyorsa `Feature Override` kullanılır.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNewMemberGuidePage;
