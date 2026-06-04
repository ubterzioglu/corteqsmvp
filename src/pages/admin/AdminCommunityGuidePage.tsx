import { Link } from "react-router-dom";

import AdminPageGuideAccordion, { type AdminPageGuideSection } from "@/components/admin/AdminPageGuideAccordion";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const guideSections: AdminPageGuideSection[] = [
  {
    title: "Topluluk yönetimi bu alanda neyi kapsar?",
    items: [
      "Topluluklar ekranı, WhatsApp topluluk landing kayıtlarını tek panelden listelediğin ve yönettiğin ana moderasyon alanıdır.",
      "Bu modül içinde yeni topluluk kaydı oluşturma, mevcut landing içeriğini düzenleme, yayın durumunu takip etme ve editör atama akışları birlikte çalışır.",
      "Temel görev ayrımı şöyledir: `Topluluklar` kayıtları yönetir, `Topluluk Editörleri` landing bazlı yetki verir, `Topluluk Kullanma Kılavuzu` ise operasyon standardını açıklar.",
    ],
  },
  {
    title: "Yeni topluluk ekleme adımları",
    items: [
      "1. Önce `Topluluklar` ekranına git ve mevcut kayıtlar içinde aynı şehir, ülke veya aynı grup adıyla mükerrer kayıt olup olmadığını kontrol et.",
      "2. Yeni kayıt oluştururken topluluk adı, şehir, ülke, açıklama, çağrı metni ve WhatsApp bağlantısı gibi zorunlu bilgilerin eksiksiz olduğundan emin ol.",
      "3. Grup linkini yapıştırmadan önce doğru topluluğa açıldığını test et; yanlış link yayına alınırsa kullanıcıyı hatalı topluluğa yönlendirir.",
      "4. İçerikte şehir ve topluluk adı yazımı tutarlı olmalı; başlık, açıklama ve çağrı metni birbiriyle çelişmemeli.",
      "5. Yeni kayıt eklendikten sonra landing kartını önizle, bağlantıyı test et ve gerekiyorsa düzenleme moduna dönerek metinleri sadeleştir.",
    ],
  },
  {
    title: "Landing page düzenleme adımları",
    items: [
      "1. Düzenleme yapılacak topluluğu `Topluluklar` ekranından veya canlı landing sayfasındaki `Landing'i Düzenle` butonundan aç.",
      "2. Önce grup adı, şehir, ülke ve üst açıklama gibi görünen alanları gözden geçir; hatalı isimlendirme varsa ilk bunları düzelt.",
      "3. Ardından çağrı metnini kontrol et; metin topluluğun amacını net anlatmalı, gereksiz uzunluk ve tekrar içermemeli.",
      "4. WhatsApp linkini her düzenlemeden sonra yeniden test et; kopyala-yapıştır sırasında boşluk veya hatalı parametre kalmamalı.",
      "5. Landing üzerinde koşullar, notlar veya ek açıklamalar varsa maddelerin güncel ve anlaşılır kaldığını doğrula.",
      "6. Kaydı güncelledikten sonra canlı sayfayı açıp butonlar, metin akışı ve link davranışının beklediğin gibi çalıştığını kontrol et.",
    ],
  },
  {
    title: "Topluluk editörü atama ve yönetme",
    items: [
      "1. `Topluluk Editörleri` ekranında önce ilgili landing kaydını seç, sonra bu kaydı düzenlemesi gereken kullanıcıyı belirle.",
      "2. Editör ataması landing bazlı çalışır; kullanıcıya tüm topluluklar için değil sadece seçilen kayıt için düzenleme hakkı verilir.",
      "3. Aynı landing için aynı kullanıcıyı tekrar atamaya çalışma; ekran zaten aktif atamaları filtreleyerek yinelenen yetkiyi engeller.",
      "4. Kullanıcı artık bu kaydı düzenlememeli ise aktif atamalar listesinden yetkisini kaldır.",
      "5. Atama sonrası kullanıcıdan landing düzenleme ekranına erişimini test etmesini istemek iyi bir operasyon adımıdır.",
    ],
  },
  {
    title: "Yayın öncesi kontrol listesi",
    items: [
      "Topluluk adı net, yazım hatasız ve platformdaki diğer kayıtlarla uyumlu mu kontrol et.",
      "Şehir ve ülke bilgisi doğru mu, yanlış lokasyon nedeniyle kullanıcı farklı topluluğa yönleniyor mu bak.",
      "Çağrı metni topluluğun değerini açık anlatıyor mu, çok kısa veya dağınık kalıyor mu incele.",
      "WhatsApp linki yeni sekmede doğru açılıyor mu mutlaka test et.",
      "Varsa editör ataması güncel mi, artık erişmemesi gereken biri listede kalmış mı kontrol et.",
      "Canlı landing sayfasında butonlar, paylaşım alanı ve düzenleme bağlantısı görsel olarak bozulmadan çalışıyor mu doğrula.",
    ],
  },
  {
    title: "Önemli operasyon notları",
    items: [
      "Önce topluluk kaydını düzeltmeden editör atamak genelde sorunu sadece dağıtır; önce doğru kaydı oluştur, sonra yetki ver.",
      "Birden fazla landing aynı topluluğu temsil ediyorsa hangisinin kanonik kayıt olduğuna karar verip mükerrer içerikleri temizlemek gerekir.",
      "Editör yetkisi sorun çözmek için kalıcı bırakılmamalı; iş tamamlandıysa gereksiz erişimleri kaldırmak daha güvenlidir.",
      "Topluluk açıklamasında tarih, kampanya veya geçici bilgi varsa zamanla eskime riskine karşı periyodik kontrol yap.",
      "Kullanıcı deneyimi açısından en kritik alanlar başlık, çağrı metni ve WhatsApp linkidir; her değişiklikte bu üçlü mutlaka test edilmelidir.",
    ],
  },
];

const AdminCommunityGuidePage = () => {
  return (
    <div className="space-y-4">
      <AdminPageGuideAccordion
        summary="Topluluk ekleme, landing düzenleme, editör atama ve yayın öncesi kontrollerin tamamını bu sayfada madde madde görebilirsin."
        sections={guideSections}
      />

      <Card>
        <CardHeader>
          <CardTitle>Topluluk Yönetimi Kullanma Kılavuzu</CardTitle>
          <CardDescription>
            Topluluk landing operasyonunun günlük kullanım standardını tek sayfada toplar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Bu rehber, admin panelindeki topluluk akışını güvenli ve tutarlı şekilde yürütmek için hazırlandı. Amaç yalnızca kayıt
            açmak değil; doğru topluluğu doğru içerikle yayınlamak, gerekirse doğru editöre yetki vermek ve canlı sayfadaki kullanıcı
            deneyimini bozmadan süreci tamamlamak.
          </p>
          <p>
            Kısa özet: yeni kayıt gerekiyorsa önce `Topluluklar`, yetki devri gerekiyorsa `Topluluk Editörleri`, süreç hakkında hızlı
            referans gerekiyorsa `Topluluk Kullanma Kılavuzu` kullanılmalı.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild variant="outline">
              <Link to="/admin/whatsapp-landings">Topluluklar</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/whatsapp-landings/editors">Topluluk Editörleri</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCommunityGuidePage;
