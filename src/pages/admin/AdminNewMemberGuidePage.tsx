import AdminPageGuideAccordion, { type AdminPageGuideSection } from "@/components/admin/AdminPageGuideAccordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";

const guideSections: AdminPageGuideSection[] = [
  {
    title: "Yeni sistemin mantigi",
    items: [
      "Bu alan, yeni üye sistemindeki tüm operasyon ekranlarini tek bir akista toplar.",
      "Yeni yapida once uyeyi bulur, sonra rolunu kontrol eder, gerekiyorsa rol kurallarini duzenler, en sonda da istisna gerekiyorsa override verirsin.",
      "Temel mantik su: genel kural once rolde cozulur, tekil istisna gerekiyorsa override kullanilir.",
    ],
  },
  {
    title: "Menu sirasiyla ekranlar ne ise yarar?",
    items: [
      "`Uye Takibi`: Tum uye havuzunu, operasyon akisini ve genel uye incelemesini buradan yonetirsin.",
      "`Loginli Uyeler & Roller`: Login olmus kullanicinin aktif rolunu gorur ve ana rol atamasini burada degistirirsin.",
      "`Rol Yonetimi`: Rol bazinda attribute, feature ve profile section kurallarini tek tabloda gorur ve duzenlersin.",
      "`Feature Override`: Sadece tek kullanici icin rol varsayimini bozmadan ozel feature istisnasi verirsin.",
      "`Roller Onizleme`: Sistemde tanimli aktif rolleri sadece okunur sekilde kontrol edersin.",
      "`AFS Onizleme`: Attribute, Feature ve Section kataloglarini sadece okunur sekilde toplu olarak gorursun.",
      "`Onboarding Importlari`: Onboarding tarafindan gelen veri setlerini, mapping mantigini ve import akislarini yonetirsin.",
    ],
  },
  {
    title: "Hangi durumda hangi ekrana gitmelisin?",
    items: [
      "Kullaniciya yanlis deneyim aciliyorsa once `Loginli Uyeler & Roller` ekraninda rol dogru mu diye bak.",
      "Ayni sorun o roldeki herkesi etkiliyorsa `Rol Yonetimi` ekranina git ve genel kuralı orada duzelt.",
      "Sorun sadece bir kiside varsa ve diger ayni rol kullanicilarinda olmamasi gerekiyorsa `Feature Override` kullan.",
      "Rol adlarini, sluglarini veya aciklamalarini toplu kontrol etmek istiyorsan `Roller Onizleme` ekranina git.",
      "Bir kaydin attribute mu feature mi section mi oldugunu hizlica anlamak istiyorsan `AFS Onizleme` ekranina git.",
      "Onboarding kaynakli veri eksigi, toplu veri girisi veya import kontrolu gerekiyorsa `Onboarding Importlari` ekranina git.",
    ],
  },
  {
    title: "Rol Yonetimi ekranini nasil okumalisin?",
    items: [
      "Tablodaki `A` kayitlari attribute'tur; form alani davranisini temsil eder.",
      "Tablodaki `F` kayitlari feature'dir; modül veya capability acik-kapali durumunu temsil eder.",
      "Tablodaki `S` kayitlari profile section'dir; profil kartinda hangi bolumun nasil gorundugunu temsil eder.",
      "Rol secmeden katalog gorunur; rol sectiginde ayni satirlarda o role ait kurallar aktif edit moduna doner.",
      "Bir degisikligi kaydetmeden once bunun rol seviyesi genel kural mi yoksa tekil istisna mi olduguna karar ver.",
    ],
  },
  {
    title: "Onerilen calisma sirasi",
    items: [
      "1. Once `Uye Takibi` veya ilgili operasyon kaydindan kullaniciyi bul.",
      "2. Sonra `Loginli Uyeler & Roller` ekraninda ana rol atamasini kontrol et.",
      "3. Sorun rol kaynakliysa `Rol Yonetimi` ekraninda attribute, feature veya section satirini duzelt.",
      "4. Sorun sadece tek kullanici icinse `Feature Override` ile istisna ver.",
      "5. Son kontrol icin `Roller Onizleme` ve `AFS Onizleme` ekranlarindan kayit tanimlarini capraz kontrol et.",
      "6. Veri girisi veya toplu kaynak guncellemesi gerekiyorsa `Onboarding Importlari` tarafina gec.",
    ],
  },
  {
    title: "Operasyon kurallari",
    items: [
      "Override'i ilk cozum olarak kullanma; once rol seviyesinde cozulup cozulmeyecegine bak.",
      "Ayni problem birden fazla kullanicida varsa genel kurali `Rol Yonetimi` tarafinda duzeltmek daha temizdir.",
      "`Roller Onizleme` ve `AFS Onizleme` ekranlari duzenleme icin degil, kontrol ve dogrulama icindir.",
      "Rol degisikligi yaptiginda kullanicinin gercek deneyimini mutlaka ilgili ekran veya profil akisinda test et.",
      "Onboarding import degisiklikleri canli akisi etkileyebilecegi icin mapping ve hedef alan kontrolunu ikinci kez dogrulamak guvenlidir.",
    ],
  },
];

const AdminNewMemberGuidePage = () => {
  return (
    <div className="space-y-4">
      <AdminPageGuideAccordion
        summary="Yeni New Member System menüsündeki ekranların ne işe yaradığını, hangi durumda hangisini kullanman gerektiğini ve önerilen operasyon sırasını bu sayfada madde madde görebilirsin."
        sections={guideSections}
      />

      <Card>
        <CardHeader>
          <CardTitle>Genel Kullanım Kılavuzu</CardTitle>
          <CardDescription>
            Bu sayfa, güncel üyeler menüsündeki ekranlar için tek noktadan hızlı karar desteği verir.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Yeni akista uye operasyonu, rol atamasi, rol kurali, tekil override, katalog onizleme ve onboarding import adimlari
            birbirinden ayrildi. Boylece once dogru seviyede karar verip sonra dogru ekranda islem yapman kolaylasir.
          </p>
          <p>
            Kisa ozet: kullanicinin ana kimligi once `Rol` ile belirlenir, rolun tum uye grubuna uygulanan kurallari
            `Rol Yonetimi` ile duzenlenir, yalnizca tek kisiye ozel sapma gerekiyorsa `Feature Override` kullanilir.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNewMemberGuidePage;
