import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "CorteQS nedir ve nasıl çalışır?",
    a: (
      <>
        <p>
          CorteQS, yurt dışındaki Türk diasporasını şehir bazlı olarak danışmanlar, işletmeler,
          topluluklar, içerik üreticileri ve fırsat alanlarıyla buluşturan bir diaspora network
          platformudur. Amaç yalnızca bir rehber sunmak değil, aynı şehirde veya aynı ihtiyaca yakın
          insanları daha hızlı ve daha anlamlı biçimde bir araya getirmektir.
        </p>
        <p className="mt-3">
          Kullanıcılar kategori seçerek kayıt bırakır, yaşadıkları ya da taşınmak istedikleri şehri
          belirtir ve platform açıldığında kendi kullanım senaryolarına uygun alanlara yönlendirilir.
          Böylece CorteQS, dağınık diaspora bilgisini tek yerde toplarken iş birliği, görünürlük ve
          güven temelli bağlantı kurmayı kolaylaştırır.
        </p>
      </>
    ),
  },
  {
    q: "Yurtdışına taşınmak için CorteQS nasıl yardımcı olur?",
    a: (
      <>
        <p>
          Yurt dışına taşınma sürecinde en büyük zorluk, bilgiye değil doğru bilgiye ve doğru kişiye
          zamanında ulaşmaktır. CorteQS, vize, oturum, ev bulma, iş arama, şehirde ilk kurulum ve yerel
          yaşam gibi başlıklarda şehir bazlı bağlantılar kurmanıza yardımcı olmayı hedefler.
        </p>
        <p className="mt-3">
          Platform açıldığında taşınmak istediğiniz konuma göre ilgili danışmanları, toplulukları,
          etkinlikleri ve yerel iş çevrelerini daha düzenli biçimde görmeniz mümkün olacak. Bu sayede
          belirsizlik azalır, ilk bağlantılar daha erken kurulur ve yeni bir şehirde sosyal ve profesyonel
          ağ oluşturma süreci hızlanır.
        </p>
      </>
    ),
  },
  {
    q: "CorteQS'te nasıl danışman bulabilirim?",
    a: (
      <>
        <p>
          CorteQS'te danışman bulma mantığı, ihtiyacınızı genel kalabalık içinde kaybetmeden daha hedefli
          bir filtreleme sunmaktır. Vize, oturum, emlak, iş kurma, vergi, hukuk veya kariyer gibi başlıklarda
          hangi konuda destek aradığınızı belirtmeniz, sizi daha uygun profillere yaklaştırır.
        </p>
        <p className="mt-3">
          Bunun yanında yaşadığınız veya gitmek istediğiniz şehir bilgisinin eklenmesi, yerel uzmanlara
          ulaşmayı kolaylaştırır. Amaç yalnızca bir isim listesi göstermek değil; konum, uzmanlık ve diaspora
          bağlamı açısından daha anlamlı eşleşmeler oluşturarak doğrudan iletişimi daha verimli hale getirmektir.
        </p>
      </>
    ),
  },
  {
    q: "İşletmemi CorteQS'e nasıl eklerim?",
    a: (
      <>
        <p>
          İşletmeler CorteQS'e kayıt bırakarak kendi şehirlerinde ve hedefledikleri diaspora kitlesi içinde daha
          görünür hale gelmeyi amaçlayabilir. Bu görünürlük yalnızca müşteri bulmak için değil, aynı zamanda iş
          ortaklıkları, tedarik bağlantıları, etkinlik katılımı ve diaspora içindeki güven ilişkilerini güçlendirmek
          için de değerlidir.
        </p>
        <p className="mt-3">
          Platform yapısı, işletmelerin kendilerini kategori ve konum üzerinden konumlandırmasına imkan verir.
          Böylece bir şirket, hem bulunduğu şehirdeki Türk topluluğuna ulaşabilir hem de benzer ihtiyaçlara sahip
          profesyoneller, danışmanlar ve kurumlarla daha organik bir temas kurabilir.
        </p>
      </>
    ),
  },
  {
    q: "CorteQS şehir elçisi (Ambassador) nedir, nasıl olunur?",
    a: (
      <>
        <p>
          Şehir elçileri, CorteQS'in yerel topluluk ayağını güçlendiren kişiler olarak düşünülür. Bulundukları
          şehirde diaspora ağını görünür kılmak, insanları birbirine bağlamak, etkinlikleri desteklemek ve yerel
          ihtiyaçları merkeze taşımak bu rolün temel parçalarıdır.
        </p>
        <p className="mt-3">
          Şehir elçisi olmak isteyen kişiler ilgili kategori üzerinden başvuru bırakabilir ve kendi şehirleri için
          ilgi gösterebilir. Bu rol, yalnızca temsil niteliği taşımaz; aynı zamanda şehirdeki topluluk hareketini,
          iş birliğini ve iletişimi organize etmeye yatkın kişiler için aktif bir katkı alanı sunar.
        </p>
      </>
    ),
  },
  {
    q: "CorteQS üzerinden etkinliklere nasıl katılabilirim?",
    a: (
      <>
        <p>
          Etkinlikler diaspora topluluklarında güven ve ilişki kurmanın en hızlı yollarından biridir. CorteQS,
          bulunduğunuz şehirde veya ilgi duyduğunuz lokasyonlarda gerçekleşen buluşmaları, topluluk etkinliklerini,
          iş odaklı görüşmeleri ve içerik temelli organizasyonları daha erişilebilir hale getirmeyi hedefler.
        </p>
        <p className="mt-3">
          Kullanıcılar etkinlikleri keşfedebilecek, uygun olanlara katılım gösterebilecek ve zamanla kendi
          organizasyonlarını da görünür kılabilecek bir yapıya dahil olacaktır. Bu model hem sosyal bağları
          kuvvetlendirir hem de profesyonel network oluşturmayı daha doğal ve sürdürülebilir bir hale getirir.
        </p>
      </>
    ),
  },
  {
    q: "CorteQS ücretsiz mi?",
    a: (
      <>
        <p>
          CorteQS'in erken erişim ve temel katılım tarafı ücretsiz kurgulanmaktadır. Kullanıcıların kategori seçip
          kayıt bırakabilmesi, platform açılışıyla ilgili haber alması ve ilk topluluk akışına dahil olması için
          ücretli bir bariyer öngörülmemektedir.
        </p>
        <p className="mt-3">
          İlerleyen aşamalarda premium görünürlük, işletmeler için ek tanıtım alanları veya bazı gelişmiş kullanım
          imkanları sunulabilir. Ancak ana yaklaşım, temel ağ kurma ve katılım deneyimini mümkün olduğunca erişilebilir
          tutmak ve diaspora topluluğunu önce güçlü bir temel üzerinde bir araya getirmektir.
        </p>
      </>
    ),
  },
  {
    q: "CorteQS hangi ülkelerde ve şehirlerde aktif?",
    a: (
      <>
        <p>
          CorteQS küresel bir diaspora fikriyle kurulsa da en güçlü başlangıç, Türk diasporasının yoğun olduğu şehirler
          üzerinden yapılmaktadır. Berlin, Londra, Amsterdam, Dubai, Sydney ve New York gibi merkezler ilk ilgi odağı
          olan şehirler arasında yer alırken, kayıt bırakan topluluk yoğunluğuna göre yeni lokasyonlar da önceliklendirilecektir.
        </p>
        <p className="mt-3">
          Bu yaklaşım platformun rastgele değil, gerçek ihtiyaç ve topluluk hareketine göre büyümesini sağlar. Yani CorteQS
          tek bir ülkede sınırlı kalmayı değil, farklı ülkelerdeki Türk diasporasını yerel bağlamı bozmadan aynı ekosistem içinde
          birleştirmeyi amaçlar.
        </p>
      </>
    ),
  },
  {
    q: "CorteQS ile iş veya müşteri bulabilir miyim?",
    a: (
      <>
        <p>
          Evet, CorteQS'in önemli kullanım alanlarından biri de iş ve müşteri bağlantılarıdır. Danışmanlar uzmanlıklarını
          daha görünür hale getirebilir, işletmeler kendi hedef kitlelerine ulaşabilir ve bireysel kullanıcılar da iş,
          proje, ortaklık veya yönlendirme fırsatlarını keşfetmeye daha yakın hale gelir.
        </p>
        <p className="mt-3">
          Buradaki fark, bağlantıların yalnızca geniş bir dizin mantığıyla değil diaspora bağlamı içinde kurulmasıdır.
          Aynı dili, benzer göç deneyimlerini veya ortak şehir gerçekliğini paylaşan insanlar arasında kurulan temaslar,
          çoğu zaman daha hızlı güven üretir ve daha somut iş sonuçlarına dönüşebilir.
        </p>
      </>
    ),
  },
  {
    q: "CorteQS'e nasıl katılabilirim?",
    a: (
      <>
        <p>
          CorteQS'e katılmak için landing page üzerindeki kayıt alanından kategorinizi seçerek ilginizi bırakmanız yeterlidir.
          Danışman, işletme, dernek, vakıf, içerik üreticisi, şehir elçisi veya bireysel kullanıcı olarak hangi rolde yer almak
          istediğinizi belirtmeniz, açılış sonrası size uygun akışların hazırlanmasına yardımcı olur.
        </p>
        <p className="mt-3">
          Kayıt bırakan kullanıcılar erken erişim duyurularını, toplulukla ilgili haberleri ve uygun olduğunda WhatsApp veya benzeri
          onboarding kanallarını takip edebilir. Bu süreç, platform tamamen açılmadan önce doğru kişileri doğru kategoriler altında
          toplamayı ve ilk kullanıcı deneyimini daha güçlü başlatmayı amaçlar.
        </p>
      </>
    ),
  },
  {
    q: "Almanya'ya taşınmak istiyorum, CorteQS relocation sürecinde nasıl yardımcı olur?",
    a: (
      <>
        <p>
          Almanya'ya taşınma sürecinde vize başvuruları, oturum izni (Aufenthaltstitel), ev bulma, Anmeldung,
          banka hesabı açma ve sağlık sigortası gibi birçok adım vardır. CorteQS, bu süreçlerde Almanya'daki
          Türk diasporasından doğrulanmış danışmanlar ve şehir elçileriyle sizi buluşturur.
        </p>
        <p className="mt-3">
          Berlin, Dortmund, Köln, Hamburg ve München gibi şehirlerde yerel danışmanlar ve topluluk üyeleri,
          relocation sürecinizde size rehberlik edebilir. Platform üzerinden şehrinizi seçerek ilgili
          uzmanlara ve topluluk kaynaklarına erişebilirsiniz.
        </p>
      </>
    ),
  },
  {
    q: "CorteQS'te doğrulanmış hizmet sağlayıcılarını nasıl bulabilirim?",
    a: (
      <>
        <p>
          CorteQS, platformdaki danışman ve hizmet sağlayıcılarını doğrulama sürecinden geçirir. Doğrulanmış
          sağlayıcılar, profesyonel niteliklerini ve diaspora topluluğundaki güvenilirliklerini kanıtlamış
          kişilerdir. Bu sayede yanlış bilgilendirme veya güven sorunu yaşamadan hizmet alabilirsiniz.
        </p>
        <p className="mt-3">
          Platform açıldığında danışman profillerinde doğrulama durumu görüntülenecek, kullanıcılar
          değerlendirme ve geri bildirimlerle topluluk kalitesini destekleyebilecektir. Bu sistem, diaspora
          bağlamında güven temelli ilişkilerin oluşmasını hızlandırmayı hedefler.
        </p>
      </>
    ),
  },
];

const faqClosedStyles = [
  "border-[#d7e7ff] bg-[linear-gradient(135deg,rgba(66,133,244,0.05),rgba(255,255,255,0.96))]",
  "border-[#d9ead7] bg-[linear-gradient(135deg,rgba(52,168,83,0.05),rgba(255,255,255,0.96))]",
  "border-[#ffe1c7] bg-[linear-gradient(135deg,rgba(251,188,5,0.06),rgba(255,255,255,0.96))]",
  "border-[#ffd8d2] bg-[linear-gradient(135deg,rgba(234,67,53,0.05),rgba(255,255,255,0.96))]",
] as const;

const FAQSection = () => {
  return (
    <section className="relative overflow-hidden py-7 lg:py-10">
      <div className="container relative z-10 mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground md:text-4xl">
            Sıkça Sorulan Sorular
          </h2>
          <Accordion type="single" collapsible className="w-full space-y-2.5">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className={`overflow-hidden rounded-[10px] border px-3 shadow-[0_8px_18px_rgba(15,23,42,0.04)] backdrop-blur-sm transition-colors duration-200 data-[state=open]:border-primary/25 data-[state=open]:bg-gradient-to-br data-[state=open]:from-primary/10 data-[state=open]:to-accent/10 md:px-4 ${faqClosedStyles[i % faqClosedStyles.length]}`}
              >
                <AccordionTrigger
                  className="py-2.5 text-left text-[12px] font-medium leading-snug text-foreground hover:text-primary hover:no-underline data-[state=open]:text-primary md:py-3 md:text-[13.5px]"
                  chevronWrapperClassName="accordion-chevron h-8 w-8 border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(243,247,252,0.94))] shadow-[0_10px_22px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.95)] ring-1 ring-slate-200/70 md:h-9 md:w-9"
                  chevronClassName="h-[13px] w-[13px] text-slate-600 md:h-[15px] md:w-[15px]"
                >
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  <div className="faq-answer space-y-2.5 text-sm leading-relaxed text-muted-foreground">
                    {faq.a}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
