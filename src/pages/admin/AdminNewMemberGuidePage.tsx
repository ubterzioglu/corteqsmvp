import { AdminPageLayout } from "@/components/admin/AdminPageLayout";

const ruleLegendItems = [
  "A: Aktif",
  "Z: Zorunlu",
  "P: Public",
  "D: Düzenler",
  "G: Gizler / Global",
  "O: Onay",
  "R: Rol",
  "S: Sıra",
] as const;

const guideSections = [
  {
    title: "Yeni sistemin mantığı",
    items: [
      "Bu alan, yeni üye sistemindeki tüm operasyon ekranlarını tek bir akışta toplar.",
      "Yeni yapıda önce üyeyi bulur, sonra rolünü kontrol eder, gerekiyorsa rol kurallarını düzenler, en sonda da gerçekten ihtiyaç varsa override verirsin.",
      "Temel mantık şudur: genel kural önce rolde çözülür, tekil istisna gerekiyorsa override kullanılır.",
    ],
  },
  {
    title: "Tablodaki kısaltmalar ne anlama gelir?",
    items: [
      "A = Aktif. İlgili attribute, feature veya section şu anda açık mı onu gösterir.",
      "Z = Zorunlu. Alanın kullanıcı tarafından doldurulmasının zorunlu olup olmadığını gösterir.",
      "P = Public. Alanın varsayılan olarak public görünür olup olmadığını gösterir.",
      "D = Düzenler. Kullanıcının ilgili alanı düzenleyip düzenleyemediğini gösterir.",
      "G = Gizler / Global. Attribute tarafında kullanıcı alanı gizleyebilir mi, feature tarafında ise feature global olarak açık mı onu temsil eder.",
      "O = Onay. Değişiklik admin onayı gerektiriyor mu onu gösterir.",
      "R = Rol. Feature satırında bu özelliğin seçili role açık olup olmadığını gösterir.",
      "S = Sıra. Alanın veya section'ın ekrandaki sıralama değerini gösterir.",
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
      "Tablodaki `A` rozetleri attribute satırlarını temsil eder; bunlar form alanı davranışını yönetir.",
      "Tablodaki `F` rozetleri feature satırlarını temsil eder; bunlar modül veya capability açık-kapalı durumunu yönetir.",
      "Tablodaki `S` rozetleri profile section satırlarını temsil eder; bunlar profil kartında hangi bölümün nasıl göründüğünü yönetir.",
      "Rol seçmeden katalog görünür; rol seçtiğinde aynı satırlar o role ait kurallarla edit moduna döner.",
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
  {
    title: "Rehber (Directory) ve Katalog Sahiplenme İşleyişi",
    items: [
      "Rehber (Directory) ekranı artık sadece kayıtlı kullanıcı profillerini değil, dışarıdan içe aktarılmış sahiplenilebilir 'Katalog (Catalog)' kayıtlarını da tek bir listede birleşik (unified) olarak gösterir.",
      "Yeni rollere ait (Örn: Doktor, Diş Hekimi vb.) toplu veri yüklemeleri, geliştirici ekibi tarafından generic CSV importer aracıyla auth user yaratmadan, public katalog kayıtları olarak içeri alınır.",
      "İçe aktarılan katalog kayıtlarının CSV'deki hangi sütunlarla (ad, iletişim, kategori vb.) eşleşeceği altyapıdaki 'catalog-role-import-map.json' kural dosyasından yönetilir.",
      "Kullanıcılar henüz kimseye ait olmayan katalog kayıtlarını '/directory/catalog/:slug' özel detay sayfasında görüntüler.",
      "Sisteme giriş yapmış üyeler, bu sayfadan 'Claim' (Sahiplen) butonunu kullanarak kaydın kendilerine ait olduğunu beyan edebilir (submit_catalog_claim_request).",
      "Gelen sahiplenme (claim) talepleri, mevcut talep onay mekanizması üzerinden yönetici tarafından değerlendirilir ve onaylandığında kayıt üyenin profiline dönüşür.",
    ],
  },
] as const;

const AdminNewMemberGuidePage = () => {
  return (
    <AdminPageLayout className="max-w-5xl gap-8">
      <section className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Kullanım Klavuzu
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Yeni üyeler menüsündeki ekranların ne işe yaradığını, hangi durumda
            hangisini kullanman gerektiğini ve rol yönetimi tablosundaki
            kısaltmaların ne anlama geldiğini bu sayfada düz anlatımla
            görebilirsin.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {ruleLegendItems.map((item) => (
            <span
              key={item}
              className="rounded-full border border-border bg-muted/40 px-3 py-1.5 font-medium tracking-[0.01em]"
            >
              {item}
            </span>
          ))}
        </div>
      </section>

      <div className="space-y-8">
        {guideSections.map((section) => (
          <section
            key={section.title}
            className="space-y-3 border-b border-border/70 pb-6 last:border-b-0 last:pb-0"
          >
            <h2 className="text-lg font-semibold text-foreground">
              {section.title}
            </h2>
            <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
              {section.items.map((item) => (
                <li key={item} className="flex gap-3">
                  <span
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                    aria-hidden
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </AdminPageLayout>
  );
};

export default AdminNewMemberGuidePage;
