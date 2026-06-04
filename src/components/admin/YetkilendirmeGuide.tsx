import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RoleCategoryFeatureMatrixSection from "@/components/admin/RoleCategoryFeatureMatrixSection";

const YetkilendirmeGuide = () => {
  const [activeSection, setActiveSection] = useState("basla");

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll("[data-section]");
      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 100) {
          setActiveSection(section.getAttribute("data-section") || "basla");
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const sections = [
    { id: "basla", label: "Başlangıç" },
    { id: "hikaye", label: "Hikaye" },
    { id: "roller", label: "Roller" },
    { id: "yetkiler", label: "Yetkiler" },
    { id: "matris", label: "Rol-Kategori Matrisi" },
    { id: "itemler", label: "Katalog İtemler" },
    { id: "birlikli", label: "Hepsi Birlikte" },
    { id: "ornek", label: "Örnek Akış" },
    { id: "admin", label: "Admin Kontrolü" },
    { id: "sorular", label: "SSS" },
  ];

  const scrollToSection = (id: string) => {
    const element = document.querySelector(`[data-section="${id}"]`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
  };

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <Card className="sticky top-4 h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">📚 Bölümler</CardTitle>
          </CardHeader>
          <CardContent>
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors ${
                    activeSection === section.id
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">🎓 Yetkilendirme Sistemi — Çok Basit Rehberi</CardTitle>
            <CardDescription>Gerizekalıya anlatır gibi açıklanan rehber</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            {/* BAŞLANGIÇ */}
            <div data-section="basla" className="scroll-mt-4 mb-10">
              <h2 className="text-xl font-bold text-blue-600 mb-4">🌟 Başlangıç</h2>
              <p className="mb-4">Bir kullanıcı giriş yapıyor. Sistem şu soruları soruyor:</p>
              <ul className="list-none space-y-2 mb-4 bg-gray-50 p-4 rounded-lg">
                <li>✓ Bu kişi kim? (Roller)</li>
                <li>✓ Bu kişinin yetkileri neler? (Yetkiler)</li>
                <li>✓ Hangi şeyleri görebilir? (Katalog İtemler)</li>
                <li>✓ Hangi şeyleri oluşturabilir?</li>
              </ul>
              <p>Bu rehber bu soruların cevaplarını açıklıyor.</p>
            </div>

            {/* BASIT HİKAYE */}
            <div data-section="hikaye" className="scroll-mt-4 mb-10">
              <h2 className="text-xl font-bold text-blue-600 mb-4">📖 Basit Bir Hikaye</h2>
              <p className="mb-4">Ayşe adında birisi var. Ayşe ne yapabileceğini anlamak istiyorum:</p>

              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-4 rounded">
                <strong className="text-blue-700">Adım 1: Ayşe kim?</strong><br />
                Ayşe bir "Blogger". Bu onun <span className="bg-yellow-100 px-2 py-1 rounded font-semibold">Rolü</span>.
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-4 rounded">
                <strong className="text-blue-700">Adım 2: Blogger ne yapabilir?</strong><br />
                Blogger şu şeyleri yapabilir:
                <ul className="list-disc list-inside mt-2 ml-2">
                  <li>✅ Blog yazısı yazmak</li>
                  <li>✅ Etkinlik oluşturmak</li>
                  <li>❌ Danışman profili açmak (bunu yapamaz)</li>
                  <li>❌ İş ilanı yayınlamak (bunu yapamaz)</li>
                </ul>
                Bunlar Blogger'ın <span className="bg-yellow-100 px-2 py-1 rounded font-semibold">Yetkileri</span>.
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-4 rounded">
                <strong className="text-blue-700">Adım 3: Ayşe etkinlik oluşturmak istiyor</strong><br />
                Sistem kontrol ediyor:
                <ul className="list-disc list-inside mt-2 ml-2">
                  <li>Ayşe blogger mi? ✅ EVET</li>
                  <li>Blogger'lar etkinlik oluşturabilir mi? ✅ EVET</li>
                  <li>O halde izin ver!</li>
                </ul>
              </div>
            </div>

            {/* ROLLER */}
            <div data-section="roller" className="scroll-mt-4 mb-10">
              <h2 className="text-xl font-bold text-blue-600 mb-4">👥 Roller — Kullanıcı Tipleri</h2>
              <p className="mb-4">Sistemde 6 tane rol var. Her rol bir "etikettir":</p>

              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-blue-600 text-white">
                    <tr>
                      <th className="p-2 text-left">🏷️ Rol Adı</th>
                      <th className="p-2 text-left">Kim Bu?</th>
                      <th className="p-2 text-left">Örnek Kişiler</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b odd:bg-gray-50">
                      <td className="p-2"><strong>Bireysel</strong></td>
                      <td className="p-2">Normal kullanıcı</td>
                      <td className="p-2">Ayşe, Mehmet, Fatma</td>
                    </tr>
                    <tr className="border-b odd:bg-gray-50">
                      <td className="p-2"><strong>Danışman</strong></td>
                      <td className="p-2">Profesyonel danışman</td>
                      <td className="p-2">Hukuk danışmanı, muhasebe danışmanı</td>
                    </tr>
                    <tr className="border-b odd:bg-gray-50">
                      <td className="p-2"><strong>İşletme</strong></td>
                      <td className="p-2">Şirket veya mağaza</td>
                      <td className="p-2">Restoran, berber, kütüphane</td>
                    </tr>
                    <tr className="border-b odd:bg-gray-50">
                      <td className="p-2"><strong>Kuruluş/Dernek</strong></td>
                      <td className="p-2">Örgüt</td>
                      <td className="p-2">NGO, ticaret odası, dernek</td>
                    </tr>
                    <tr className="border-b odd:bg-gray-50">
                      <td className="p-2"><strong>İçerik Üreticisi</strong></td>
                      <td className="p-2">Blogger, YouTuber, vlogger</td>
                      <td className="p-2">Blogger, YouTuber</td>
                    </tr>
                    <tr className="odd:bg-gray-50">
                      <td className="p-2"><strong>Şehir Elçisi</strong></td>
                      <td className="p-2">Bölgesel lider</td>
                      <td className="p-2">Şehir temsilcisi</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <strong className="text-yellow-800">💡 Örnek:</strong> Ahmet bir blogger. Sistem Ahmet'e "İçerik Üreticisi" etiketi yapıştırıyor. Bu etiket Ahmet'in ne yapabileceğini belirliyor.
              </div>
            </div>

            {/* YETKİLER */}
            <div data-section="yetkiler" className="scroll-mt-4 mb-10">
              <h2 className="text-xl font-bold text-blue-600 mb-4">🔑 Yetkiler — Ne Yapabileceğiniz</h2>
              <p className="mb-4">Yetkiler, bir rolün yapabileceği şeylerdir. Mesela:</p>

              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-blue-600 text-white">
                    <tr>
                      <th className="p-2 text-left">Yetki Adı</th>
                      <th className="p-2 text-left">Ne Demek?</th>
                      <th className="p-2 text-left">Örnek</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b odd:bg-gray-50">
                      <td className="p-2">Blog yazısı yazabilir</td>
                      <td className="p-2">Blog yazısı oluşturabilir mi?</td>
                      <td className="p-2">Blogger ✅, Danışman ❌</td>
                    </tr>
                    <tr className="border-b odd:bg-gray-50">
                      <td className="p-2">Etkinlik oluşturabilir</td>
                      <td className="p-2">Etkinlik açabilir mi?</td>
                      <td className="p-2">Blogger ✅, Bireysel ❌</td>
                    </tr>
                    <tr className="border-b odd:bg-gray-50">
                      <td className="p-2">Directory'de görünebilir</td>
                      <td className="p-2">Herkese açık listede görünür mü?</td>
                      <td className="p-2">Danışman ✅, Bireysel ❌</td>
                    </tr>
                    <tr className="odd:bg-gray-50">
                      <td className="p-2">Profil düzenleyebilir</td>
                      <td className="p-2">Kendi bilgilerini değiştirebilir mi?</td>
                      <td className="p-2">Hepsi ✅</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded">
                <strong className="text-green-700">✅ Kısaca:</strong> Her rolle gelen bir yetki listesi var. Blogger'lar blog yazabilir, etkinlik açabilir. Danışmanlar directory'de görünür.
              </div>
            </div>

            <RoleCategoryFeatureMatrixSection />

            {/* KATALOG İTEMLER */}
            <div data-section="itemler" className="scroll-mt-4 mb-10">
              <h2 className="text-xl font-bold text-blue-600 mb-4">📦 Katalog İtemler — Oluşturulan Şeyler</h2>
              <p className="mb-4">İtemler, platformda gerçekten oluşturulan şeylerdir:</p>

              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-blue-600 text-white">
                    <tr>
                      <th className="p-2 text-left">İtem Tipi</th>
                      <th className="p-2 text-left">Ne?</th>
                      <th className="p-2 text-left">Örnek</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b odd:bg-gray-50">
                      <td className="p-2"><strong>Danışman Profili</strong></td>
                      <td className="p-2">Birinin danışman sayfası</td>
                      <td className="p-2">Ahmet'in hukuk danışmanı profili</td>
                    </tr>
                    <tr className="border-b odd:bg-gray-50">
                      <td className="p-2"><strong>İşletme Profili</strong></td>
                      <td className="p-2">Bir dükkan/restoran sayfası</td>
                      <td className="p-2">ABC Restoran'ın sayfası</td>
                    </tr>
                    <tr className="border-b odd:bg-gray-50">
                      <td className="p-2"><strong>Etkinlik</strong></td>
                      <td className="p-2">Bir etkinlik duyurusu</td>
                      <td className="p-2">Yazılım konferansı — 15 Haziran</td>
                    </tr>
                    <tr className="border-b odd:bg-gray-50">
                      <td className="p-2"><strong>Blog Yazısı</strong></td>
                      <td className="p-2">Bir blog yazısı</td>
                      <td className="p-2">"React'e Giriş" yazısı</td>
                    </tr>
                    <tr className="border-b odd:bg-gray-50">
                      <td className="p-2"><strong>İş İlanı</strong></td>
                      <td className="p-2">Açık pozisyon</td>
                      <td className="p-2">Junior Developer arıyoruz</td>
                    </tr>
                    <tr className="odd:bg-gray-50">
                      <td className="p-2"><strong>Pazar İlanı</strong></td>
                      <td className="p-2">Satış/Kiralık</td>
                      <td className="p-2">İkinci el bisiklet satılık</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <strong className="text-yellow-800">💡 Örnek:</strong> Ayşe blog yazısı oluşturuyor. Bu yazı bir <span className="bg-yellow-100 px-2 py-1 rounded">İtem</span> oluyor. O yazının bir "tipi" var: "Blog Yazısı".
              </div>
            </div>

            {/* HEPSI BIRLIKTE */}
            <div data-section="birlikli" className="scroll-mt-4 mb-10">
              <h2 className="text-xl font-bold text-blue-600 mb-4">🔗 Hepsi Birlikte Nasıl Çalışır?</h2>
              <p className="mb-4">Rol + Yetki + İtem = Güvenlik</p>

              <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-xs mb-4">
{`┌──────────────────────────────────────────┐
│ AYŞE GIRIŞ YAPIYOR                       │
└──────────────────────────────────────────┘
         ⬇️
┌──────────────────────────────────────────┐
│ SİSTEM KONTROL EDİYOR:                   │
│ "Ayşe kim?"                              │
│ CEVAP: "Blog yazarı" (İçerik Üreticisi) │
└──────────────────────────────────────────┘
         ⬇️
┌──────────────────────────────────────────┐
│ "Blogger ne yapabilir?"                  │
│ ✅ Blog yazı yazabilir                   │
│ ✅ Etkinlik oluşturabilir                │
│ ❌ Danışman profili açamaz               │
└──────────────────────────────────────────┘
         ⬇️
┌──────────────────────────────────────────┐
│ AYŞE BLOG YAZISINA TIKLADI                │
└──────────────────────────────────────────┘
         ⬇️
┌──────────────────────────────────────────┐
│ "Blogger blog yazı yazabilir mi?"        │
│ CEVAP: EVET ✅                           │
└──────────────────────────────────────────┘
         ⬇️
┌──────────────────────────────────────────┐
│ "O HALDE İZİN VER!"                      │
│ Ayşe blog yazı yazabiliyor               │
└──────────────────────────────────────────┘`}
              </pre>
            </div>

            {/* ÖRNEK AKIŞ */}
            <div data-section="ornek" className="scroll-mt-4 mb-10">
              <h2 className="text-xl font-bold text-blue-600 mb-4">🎬 Gerçek Örnek: Etkinlik Oluşturma</h2>

              <h3 className="text-lg font-semibold text-purple-600 mb-3">Senaryo: Blogger Fatma etkinlik açmak istiyor</h3>

              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-4 rounded">
                <strong className="text-blue-700">1️⃣ Fatma giriş yapıyor</strong><br />
                Sistem: "Hoşgeldiniz Fatma. Siz İçerik Üreticisisiniz."
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-4 rounded">
                <strong className="text-blue-700">2️⃣ Fatma "Etkinlik Oluştur" butonuna basıyor</strong><br />
                Sistem arka planda kontrol ediyor:
                <ul className="list-disc list-inside mt-2 ml-2">
                  <li>Fatma authentice mi? ✅ EVET</li>
                  <li>Fatma'nın rolü ne? ✅ İçerik Üreticisi</li>
                  <li>İçerik Üreticileri etkinlik oluşturabilir mi? ✅ EVET</li>
                </ul>
              </div>

              <div className="bg-green-50 border-l-4 border-green-600 p-4 mb-4 rounded">
                <strong className="text-green-700">✅ SONUÇ:</strong> Fatma etkinlik formu görüyor. Başlık, tarih, yer gibi bilgileri doldurabilir.
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-4 rounded">
                <strong className="text-blue-700">3️⃣ Fatma formu doldurup "Yayınla" butonuna basıyor</strong><br />
                Sistem kontrol ediyor:
                <ul className="list-disc list-inside mt-2 ml-2">
                  <li>Bu bir etkinlik mi? ✅ EVET</li>
                  <li>Yetki var mı? ✅ EVET (İçerik Üreticileri yapabilir)</li>
                  <li>Veri doğru mu? ✅ EVET</li>
                </ul>
              </div>

              <div className="bg-green-50 border-l-4 border-green-600 p-4 mb-4 rounded">
                <strong className="text-green-700">✅ BAŞARILI!</strong> Etkinlik oluşturuldu. Herkese görünüyor.
              </div>

              <hr className="my-6" />

              <h3 className="text-lg font-semibold text-purple-600 mb-3">Peki Bireysel Kullanıcı Ayşe ne olur?</h3>

              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-4 rounded">
                <strong className="text-blue-700">1️⃣ Ayşe giriş yapıyor</strong><br />
                Sistem: "Hoşgeldiniz Ayşe. Siz Bireyselsiniz."
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-4 rounded">
                <strong className="text-blue-700">2️⃣ Ayşe "Etkinlik Oluştur" butonuna basıyor</strong><br />
                Sistem kontrol ediyor:
                <ul className="list-disc list-inside mt-2 ml-2">
                  <li>Ayşe'nin rolü ne? ✅ Bireysel</li>
                  <li>Bireysel kullanıcılar etkinlik oluşturabilir mi? ❌ HAYIR</li>
                </ul>
              </div>

              <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
                <strong className="text-red-700">❌ SONUÇ:</strong> Sistem hata gösteriyor: "Maalesef etkinlik oluşturmak için yeterli yetkiniz yok."
              </div>
            </div>

            {/* ADMIN KONTROLÜ */}
            <div data-section="admin" className="scroll-mt-4 mb-10">
              <h2 className="text-xl font-bold text-blue-600 mb-4">🔧 Admin Nasıl Kontrol Edebilir?</h2>
              <p className="mb-4">Admin (yönetici) hepsi bu kontrol edebilir. Üç ana yer vardır:</p>

              <h3 className="text-lg font-semibold text-purple-600 mb-2">1️⃣ Roller Sayfası</h3>
              <p className="mb-2">Admin buraya gidiyor: <span className="bg-gray-200 px-2 py-1 rounded">/admin/new-member/users-roles</span></p>
              <p className="mb-4">Ne yapabilir?</p>
              <ul className="list-disc list-inside mb-4">
                <li>Ayşe'nin rolünü değiştirebilir: Bireysel → İçerik Üreticisi</li>
                <li>Böylece Ayşe blog yazı yazabilir hale gelir</li>
              </ul>

              <h3 className="text-lg font-semibold text-purple-600 mb-2">2️⃣ Yetkiler Sayfası</h3>
              <p className="mb-2">Admin buraya gidiyor: <span className="bg-gray-200 px-2 py-1 rounded">/admin/new-member/roles-features</span></p>
              <p className="mb-4">Ne yapabilir?</p>
              <ul className="list-disc list-inside mb-4">
                <li>Blogger'lar etkinlik oluşturabilir mi? Kontrol edebilir ✅ veya ❌</li>
                <li>Örneğin "Geçici olarak kimse etkinlik oluşturmasın" diye kapatabilir</li>
              </ul>

              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-blue-600 text-white">
                    <tr>
                      <th className="p-2 text-left">Yetki</th>
                      <th className="p-2 text-left">Bireysel</th>
                      <th className="p-2 text-left">Blogger</th>
                      <th className="p-2 text-left">Danışman</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b odd:bg-gray-50">
                      <td className="p-2">Blog yazı yazabilir</td>
                      <td className="p-2">❌</td>
                      <td className="p-2">✅</td>
                      <td className="p-2">❌</td>
                    </tr>
                    <tr className="border-b odd:bg-gray-50">
                      <td className="p-2">Etkinlik oluşturabilir</td>
                      <td className="p-2">❌</td>
                      <td className="p-2">✅</td>
                      <td className="p-2">❌</td>
                    </tr>
                    <tr className="border-b odd:bg-gray-50">
                      <td className="p-2">Directory'de görünebilir</td>
                      <td className="p-2">❌</td>
                      <td className="p-2">✅</td>
                      <td className="p-2">✅</td>
                    </tr>
                    <tr className="odd:bg-gray-50">
                      <td className="p-2">Profil düzenleyebilir</td>
                      <td className="p-2">✅</td>
                      <td className="p-2">✅</td>
                      <td className="p-2">✅</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-lg font-semibold text-purple-600 mb-2">3️⃣ İstisna Sayfası</h3>
              <p className="mb-2">Admin buraya gidiyor: <span className="bg-gray-200 px-2 py-1 rounded">/admin/new-member/overrides</span></p>
              <p className="mb-4">Ne yapabilir?</p>
              <ul className="list-disc list-inside mb-4">
                <li>Ayşe (Bireysel) sadece etkinlik oluşturmasına izin verebilir</li>
                <li>"Ayşe özel durum, etkinlik oluşturabilir" diye not düşebilir</li>
              </ul>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <strong className="text-yellow-800">💡 Örnek:</strong> Ayşe başkan oldu. Admin şimdi "Ayşe'ye etkinlik oluşturma izni ver" diyor. Ayşe etkinlik oluşturabiliyor artık.
              </div>
            </div>

            {/* SSS */}
            <div data-section="sorular" className="scroll-mt-4">
              <h2 className="text-xl font-bold text-blue-600 mb-4">❓ Sık Sorulan Sorular</h2>

              <h3 className="text-lg font-semibold text-purple-600 mb-2">Soru: Aynı kişi iki role sahip olabilir mi?</h3>
              <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-4 rounded">
                <strong className="text-red-700">Cevap:</strong> HAYIR. Her kişinin sadece BİR rolü vardır. Ayşe ya Blogger ya Danışman, ikisi olamaz.
              </div>

              <h3 className="text-lg font-semibold text-purple-600 mb-2">Soru: Bir yetki tüm roller için aynı mı?</h3>
              <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-4 rounded">
                <strong className="text-red-700">Cevap:</strong> HAYIR. "Profil düzenle" her rol için açık. Ama "etkinlik oluştur" blogger'lar için açık, danışmanlar için kapalı.
              </div>

              <h3 className="text-lg font-semibold text-purple-600 mb-2">Soru: Admin yetkilerini değiştirebilir mi?</h3>
              <div className="bg-green-50 border-l-4 border-green-600 p-4 mb-4 rounded">
                <strong className="text-green-700">Cevap:</strong> EVET! Admin herşeyi kontrol edebilir. Blogger'ların etkinlik oluşturmasını engelleyebilir, Ayşe'ye özel izin verebilir, vb.
              </div>

              <h3 className="text-lg font-semibold text-purple-600 mb-2">Soru: Bir kişiye yanılı yetki vermişsem?</h3>
              <div className="bg-green-50 border-l-4 border-green-600 p-4 mb-4 rounded">
                <strong className="text-green-700">Cevap:</strong> Admin geri alabilir. Ayşe'nin rolünü değiştirir, izin kapatır, veya istisna siler.
              </div>

              <h3 className="text-lg font-semibold text-purple-600 mb-2">Soru: Tüm sistem ne zaman kontrol edilir?</h3>
              <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded">
                <strong className="text-green-700">Cevap:</strong> HER ZAMAN. Ayşe bir şey yapmak istediğinde, sistem öncesinde kontrol eder. Yetkisi yoksa izin vermez.
              </div>

              <div className="text-center text-gray-500 text-xs mt-8 pt-8 border-t">
                <p>CorteQS Fin Yetkilendirme Sistemi — Basit Rehberi</p>
                <p>Admin kontrol panelinden her şeyi yönetebilirsiniz.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default YetkilendirmeGuide;
