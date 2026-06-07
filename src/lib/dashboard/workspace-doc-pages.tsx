import type { ReactNode } from "react";

export type WorkspaceDocSection = {
  id: string;
  title: string;
  accentColor: string;
  content: ReactNode;
};

export type WorkspaceDocPage = {
  slug: string;
  title: string;
  description: string;
  badge: string[];
  sections: WorkspaceDocSection[];
};

export const workspaceDocPages: WorkspaceDocPage[] = [
  {
    slug: "kortexdocs",
    title: "Kortex — CTO, Pitch & PRD Dokümanları",
    description: "Teknik omurga, pitch anlatısı ve PRD hattını tek admin alanında toplayan referans sayfa.",
    badge: ["CTO Handoff", "Investor Pitch", "PRD"],
    sections: [
      {
        id: "vision",
        title: "Doküman Setinin Amacı",
        accentColor: "#1A6DC2",
        content: (
          <ul className="space-y-2 text-sm leading-7 text-slate-700">
            <li>Kortex teknik, ürün ve yatırımcı anlatılarını tek çatı altında toplar.</li>
            <li>Bu alan ekiplerin aynı sistemin farklı yüzlerini ortak dille görmesini sağlar.</li>
            <li>Admin içi erişim sayesinde artık ayrı dashboard repo ihtiyacı kalmaz.</li>
          </ul>
        ),
      },
      {
        id: "cto",
        title: "CTO Handoff Özeti",
        accentColor: "#34A853",
        content: (
          <ul className="space-y-2 text-sm leading-7 text-slate-700">
            <li>Temel mimari diaspora odaklı hiyerarşik keşif modeline dayanır.</li>
            <li>Supabase tabanlı backend, auth, listing, search ve claim akışlarını merkeze alır.</li>
            <li>Güvenlik, rol bazlı erişim ve ölçeklenebilirlik erken aşamada planın parçası kabul edilir.</li>
          </ul>
        ),
      },
      {
        id: "pitch",
        title: "Investor Pitch Özeti",
        accentColor: "#FBBC04",
        content: (
          <ul className="space-y-2 text-sm leading-7 text-slate-700">
            <li>Vizyon: global Türk diasporası için merkezi süper app olmak.</li>
            <li>Problem: hizmet, topluluk ve fırsatlara dağınık erişim.</li>
            <li>Çözüm: discovery, community ve marketplace katmanlarını tek üründe birleştirmek.</li>
          </ul>
        ),
      },
    ],
  },
  {
    slug: "roadmap",
    title: "Roadmap",
    description: "MVP'den seed-ready seviyesine giden 12 aylık ürün ve büyüme planı.",
    badge: ["M1-M12", "Growth", "Revenue"],
    sections: [
      {
        id: "phases",
        title: "Faz Kurgusu",
        accentColor: "#1A6DC2",
        content: (
          <ul className="space-y-2 text-sm leading-7 text-slate-700">
            <li>Akış MVP, Launch, Growth, PMF, Scale, Expansion ve Seed Ready fazlarına ayrılır.</li>
            <li>Her faz sadece ürün teslimi değil, arz, talep ve gelir dengesini birlikte taşır.</li>
            <li>Bu panel karar alma ve yatırımcı anlatısı için aynı anda kullanılır.</li>
          </ul>
        ),
      },
      {
        id: "mvp",
        title: "MVP ve Launch Dönemi",
        accentColor: "#34A853",
        content: (
          <ul className="space-y-2 text-sm leading-7 text-slate-700">
            <li>İlk dönem auth, listing, booking, search, admin ve SEO temelini kurar.</li>
            <li>Launch ile odak kullanılabilirlikten ölçülebilir gelir ve onboarding verimine kayar.</li>
            <li>Referral, analytics ve mobile optimizasyon bu noktada devreye girer.</li>
          </ul>
        ),
      },
      {
        id: "scale",
        title: "Scale ve Seed Ready",
        accentColor: "#FBBC04",
        content: (
          <ul className="space-y-2 text-sm leading-7 text-slate-700">
            <li>Doğrulanan yapı yeni şehirler, partnerlikler ve B2B gelir katmanlarıyla büyütülür.</li>
            <li>Hedef metrikler advisor, kullanıcı ve revenue dengesini birlikte takip eder.</li>
            <li>Son durum yatırımcıya anlatılabilir, tekrarlanabilir bir büyüme sistemi yaratmaktır.</li>
          </ul>
        ),
      },
    ],
  },
  {
    slug: "ambassador",
    title: "Ambassador",
    description: "Şehir bazlı topluluk büyüme motoru, onboarding ve saha dağıtımı modeli.",
    badge: ["City Lead", "Community", "Revenue Share"],
    sections: [
      {
        id: "role",
        title: "Rol ve Amac",
        accentColor: "#1A6DC2",
        content: (
          <ul className="space-y-2 text-sm leading-7 text-slate-700">
            <li>Ambassador yapısı yerel toplulukları aktive eden büyüme motoru olarak tasarlanır.</li>
            <li>Kullanıcı ve advisor onboarding ile şehir içi ağ etkisini güçlendirir.</li>
            <li>Platformu sahada görünür kılar ve geri bildirim toplar.</li>
          </ul>
        ),
      },
      {
        id: "ops",
        title: "Operasyon Modeli",
        accentColor: "#34A853",
        content: (
          <ul className="space-y-2 text-sm leading-7 text-slate-700">
            <li>WhatsApp, Telegram, LinkedIn ve etkinlik organizasyonu temel kanallardır.</li>
            <li>Tematik buluşmalar ve şehir bazlı etkinlikler topluluk derinliğini artırır.</li>
            <li>Yerel büyüme verisi merkezi dashboard akışlarına geri beslenir.</li>
          </ul>
        ),
      },
      {
        id: "revenue",
        title: "Gelir ve Teşvik",
        accentColor: "#FBBC04",
        content: (
          <ul className="space-y-2 text-sm leading-7 text-slate-700">
            <li>Kupon, subscription ve etkinlik gelir paylaşımı modelin merkezindedir.</li>
            <li>Oranlar şehir olgunluğu ve operasyon yoğunluğuna göre ayarlanabilir.</li>
            <li>Sistem statüden çok etki ve aktif katkıyı ödüllendirir.</li>
          </ul>
        ),
      },
    ],
  },
  {
    slug: "captable",
    title: "Cap Table V2 — Hisse Yapısı",
    description: "Kurucu hisse yapısı, ESOP kurgusu ve seyrelme senaryoları için referans panel.",
    badge: ["Founders", "ESOP", "Vesting"],
    sections: [
      {
        id: "structure",
        title: "Temel Sermaye Yapısı",
        accentColor: "#1A6DC2",
        content: (
          <ul className="space-y-2 text-sm leading-7 text-slate-700">
            <li>Kurucu payları ve ESOP havuzu fully diluted mantıkla okunur.</li>
            <li>Bu yapı işe alım, option grant ve gelecek turlar için referans işlevi görür.</li>
            <li>Doküman kurucu kontrolü ile ekip teşvikini birlikte dengelemeyi hedefler.</li>
          </ul>
        ),
      },
      {
        id: "vesting",
        title: "Vesting Yaklaşımı",
        accentColor: "#34A853",
        content: (
          <ul className="space-y-2 text-sm leading-7 text-slate-700">
            <li>Kurucular için uzun vadeli bağlılığı garanti eden cliff + aylık vesting mantığı vardır.</li>
            <li>Kilit roller ve advisor grantları rol tipine göre farklı sürelerle kurgulanır.</li>
            <li>Yatırımcı beklentileriyle uyumlu standardizasyon hedeflenir.</li>
          </ul>
        ),
      },
      {
        id: "deferred",
        title: "Deferred Compensation",
        accentColor: "#FBBC04",
        content: (
          <ul className="space-y-2 text-sm leading-7 text-slate-700">
            <li>Erken aşamada piyasa maaşının tam ödenemediği roller için referans değer tutulur.</li>
            <li>Bu kayıt gelecekteki denkleme, due diligence ve ekip beklenti yönetimine yardım eder.</li>
            <li>Cap table yalnız oran değil, katkıların ekonomik hafızasına da dönüşür.</li>
          </ul>
        ),
      },
    ],
  },
  {
    slug: "ekip",
    title: "Ekip ve Bütçe",
    description: "Rol mimarisi, ücret bantları, ESOP dağılımı ve işe alım altyapısı.",
    badge: ["16 Rol", "Hiring", "Compensation"],
    sections: [
      {
        id: "team",
        title: "Ekip Yapısı",
        accentColor: "#1A6DC2",
        content: (
          <ul className="space-y-2 text-sm leading-7 text-slate-700">
            <li>Kurucu, ürün, mühendislik ve destek rolleri çok katmanlı bir yapı içinde ele alınır.</li>
            <li>Plan mevcut ekipten daha büyük gelecek yapıyı modellemek için kullanılır.</li>
            <li>Vesting ve rol seviyeleri ilerideki işe alım dalgalarına referans olur.</li>
          </ul>
        ),
      },
      {
        id: "hiring",
        title: "Hiring ve Değerlendirme",
        accentColor: "#34A853",
        content: (
          <ul className="space-y-2 text-sm leading-7 text-slate-700">
            <li>Rol, aşama, CV, görüşmeci ve not alanları ile merkezi takip hedeflenir.</li>
            <li>Doküman bugünkü haliyle tam dolu değil, ama operasyonel omurgayı kurar.</li>
            <li>Admin içinde bu sayfa karar bağlamını kaybetmeden korunur.</li>
          </ul>
        ),
      },
      {
        id: "budget",
        title: "Bütçe ve Hisse",
        accentColor: "#FBBC04",
        content: (
          <ul className="space-y-2 text-sm leading-7 text-slate-700">
            <li>Farklı ülke pazarlarına göre maaş bantları ve toplam ekip maliyeti izlenir.</li>
            <li>Hisse dağıtımı kritik teknik ve liderlik rollerine göre katmanlanır.</li>
            <li>Belge planlama iskeletidir; canlı veriyle beslendiğinde yönetim aracına dönüşür.</li>
          </ul>
        ),
      },
    ],
  },
  {
    slug: "dijitalpazarlama",
    title: "Dijital Pazarlama",
    description: "İçerik ve kampanya yönetimini tek çalışma sistemi içinde toplayan operasyon paneli.",
    badge: ["Content Ops", "Campaigns", "Distribution"],
    sections: [
      {
        id: "content",
        title: "İçerik Yönetimi",
        accentColor: "#1A6DC2",
        content: (
          <ul className="space-y-2 text-sm leading-7 text-slate-700">
            <li>İçerik adı, tür, sahip, durum, tarih ve dosya bağlamlarıyla takip edilir.</li>
            <li>Email, sosyal medya, blog ve benzeri kanallar aynı sistemde toplanır.</li>
            <li>Yapı bugün iskelet olsa da dağıtım motoru için sağlam bir çerçeve sunar.</li>
          </ul>
        ),
      },
      {
        id: "campaign",
        title: "Kampanya Yönetimi",
        accentColor: "#34A853",
        content: (
          <ul className="space-y-2 text-sm leading-7 text-slate-700">
            <li>Kampanya sahibi, tarihleri, notları ve aşamaları aynı panelde tutulur.</li>
            <li>Fikirden yayına kadar net bir ilerleme mantığı tanımlanır.</li>
            <li>Bu sayfa growth operasyonunu command center dışında destekleyen stratejik bir katmandır.</li>
          </ul>
        ),
      },
      {
        id: "next",
        title: "Operasyonel Tamamlama",
        accentColor: "#FBBC04",
        content: (
          <ul className="space-y-2 text-sm leading-7 text-slate-700">
            <li>Sorumlu, tarih, dosya ve not alanları canlı veriyle doldurulmalıdır.</li>
            <li>Placeholder kampanya türleri netleştikçe ekipler aynı panel üzerinden hizalanır.</li>
            <li>Admin içi konumlandırma sayesinde growth çalışmaları ayrı repo bağımlılığından kurtulur.</li>
          </ul>
        ),
      },
    ],
  },
  {
    slug: "projetakibi",
    title: "Proje Takibi Şablonu",
    description: "Ekiplerin iş parçası, sahiplik ve teslim mantığını hizalamak için kullandığı yönetim çerçevesi.",
    badge: ["Tracking", "Ownership", "Execution"],
    sections: [
      {
        id: "tracking-model",
        title: "Takip Mantığı",
        accentColor: "#1A6DC2",
        content: (
          <ul className="space-y-2 text-sm leading-7 text-slate-700">
            <li>Proje takibi, görevleri yalnız listelemek yerine sahiplik ve teslim bağlamıyla ele alır.</li>
            <li>Her kalem iş parçası, öncelik, sorumlu ve durum ekseninde okunur.</li>
            <li>Bu panel command center ve operasyon modülleri arasında yönetsel köprü görevi görür.</li>
          </ul>
        ),
      },
      {
        id: "execution-rhythm",
        title: "Çalışma Ritmi",
        accentColor: "#34A853",
        content: (
          <ul className="space-y-2 text-sm leading-7 text-slate-700">
            <li>Günlük akış, haftalık kontrol ve karar noktalarının aynı dilden izlenmesi hedeflenir.</li>
            <li>Dağıtık notların ve geçici takiplerin tek merkezde toplanması operasyonel netlik sağlar.</li>
            <li>Böylece ayrı dashboard bağımlılığı olmadan süreç devamlılığı korunur.</li>
          </ul>
        ),
      },
      {
        id: "next-steps",
        title: "Uygulama Önerisi",
        accentColor: "#FBBC04",
        content: (
          <ul className="space-y-2 text-sm leading-7 text-slate-700">
            <li>Takip şablonu command center, kaynak merkezi ve MVP backlog ile paralel okunmalıdır.</li>
            <li>Yüksek riskli işler için sahip, tarih ve bağımlılık zorunlu hale getirilmelidir.</li>
            <li>Bu sayfa wiki hafızasını korurken yeni admin işletim modeline bağlanır.</li>
          </ul>
        ),
      },
    ],
  },
  {
    slug: "captablev2",
    title: "Cap Table V2",
    description: "Cap table içeriğinin kısaltılmış erişim etiketi; aynı hisse yapısı dokümanına ikinci giriş noktası sağlar.",
    badge: ["Alias", "Equity", "Reference"],
    sections: [
      {
        id: "alias-note",
        title: "Aynı Doküman, İkinci Giriş",
        accentColor: "#1A6DC2",
        content: (
          <ul className="space-y-2 text-sm leading-7 text-slate-700">
            <li>Bu başlık eski wiki akışını bozmamak için korunur.</li>
            <li>İçerik, hisse yapısı ve ESOP mantığını anlatan ana cap table dokümanının ikinci erişimidir.</li>
            <li>Yeni sistemde bilgi kaybı olmadan eski başlık alışkanlığı devam eder.</li>
          </ul>
        ),
      },
    ],
  },
  {
    slug: "whatsappbot",
    title: "WhatsApp Bot",
    description: "Topluluk tanıtımı, opt-in akışı ve token mantığı için fikir ve operasyon paneli.",
    badge: ["Bot", "Opt-in", "Community"],
    sections: [
      {
        id: "purpose",
        title: "Genel Amac",
        accentColor: "#1A6DC2",
        content: (
          <ul className="space-y-2 text-sm leading-7 text-slate-700">
            <li>Bot reklamdan çok kullanıcıya fayda sunan bir temas noktası olarak düşünülür.</li>
            <li>Grup akışına zarar vermeden bilgi ve fırsat paylaşımını düzenlemeyi hedefler.</li>
            <li>Spam riski ve platform kuralları erken aşamadan hesaba katılır.</li>
          </ul>
        ),
      },
      {
        id: "model",
        title: "Teknik ve Operasyonel Model",
        accentColor: "#34A853",
        content: (
          <ul className="space-y-2 text-sm leading-7 text-slate-700">
            <li>Resmi API ve esnek ama riskli gayriresmi çözümler yan yana değerlendirilir.</li>
            <li>Komut tetikleyicileri, zamanli mesajlar ve DM yonlendirmeleri temel senaryolardir.</li>
            <li>Opt-in ve opt-out akislari grup spamini azaltmak icin zorunludur.</li>
          </ul>
        ),
      },
      {
        id: "token",
        title: "Odul ve Takip Katmani",
        accentColor: "#FBBC04",
        content: (
          <ul className="space-y-2 text-sm leading-7 text-slate-700">
            <li>Numara, wallet ve ozel link eslestirmesi uzerinden odul mekanizmasi kurgulanir.</li>
            <li>Tiklama limiti, suistimal engelleme ve gunluk kurallar backend tasariminin parcasidir.</li>
            <li>Bu alan hem growth hem topluluk sadakati icin deneysel bir ar-ge panelidir.</li>
          </ul>
        ),
      },
    ],
  },
];

  {
    slug: "out-of-order",
    title: "Out of Order — Bekleyen Sistem Borçları",
    description: "Bilerek arka planda tutulan, zamanı gelince devreye alınacak ya da silinecek kod ve sistemlerin envanteri.",
    badge: ["Teknik Borç", "Beklemede", "Karar Gerekiyor"],
    sections: [
      {
        id: "orphaned-auth",
        title: "Orphaned Auth Sistemi (38 dosya kör)",
        accentColor: "#EA4335",
        content: (
          <div className="space-y-4 text-sm leading-7 text-slate-700">
            <p>
              <strong>Durum:</strong> Bilerek arka planda, dokunulmadan bekliyor.
            </p>
            <p>
              <strong>Ne var:</strong> <code>src/contexts/AuthContext.tsx</code> — Lovable-v2 overlay'inden gelen
              ikinci bir AuthProvider. Kendi içinde session, profile, accountType, signOut ve refreshProfile
              destekliyor. <code>profiles</code> tablosundan veri çekiyor.
            </p>
            <p>
              <strong>Sorun:</strong> Bu provider <code>App.tsx</code>'te mount edilmemiş. Bu context'ten{" "}
              <code>useAuth</code> import eden 38 dosya her zaman <code>user: null</code>,{" "}
              <code>loading: true</code> alıyor — kullanıcı giriş yapmış olsa bile.
            </p>
            <p>
              <strong>Etkilenen 38 dosya:</strong>
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>src/pages/Feed.tsx</li>
              <li>src/pages/Events.tsx</li>
              <li>src/pages/MapSearch.tsx</li>
              <li>src/pages/Onboarding.tsx</li>
              <li>src/pages/PostGenerator.tsx</li>
              <li>src/pages/WhatsAppGroups.tsx</li>
              <li>src/pages/WhatsAppGroupLanding.tsx</li>
              <li>src/pages/CityAmbassadors.tsx</li>
              <li>src/pages/ConsultantDetail.tsx</li>
              <li>src/pages/VolunteerMentorDetail.tsx</li>
              <li>src/components/Navbar.tsx</li>
              <li>src/components/DetailAuthLock.tsx</li>
              <li>src/components/ProfileCompletePopup.tsx</li>
              <li>src/components/ProfileSetupBanner.tsx (profiles/)</li>
              <li>src/components/PhoneVerification.tsx</li>
              <li>src/components/CreateEventForm.tsx</li>
              <li>src/components/CouponCheckoutDialog.tsx</li>
              <li>src/components/CaddeProfileGate.tsx</li>
              <li>src/components/WelcomePackCTA.tsx</li>
              <li>src/components/WelcomePackOrderForm.tsx</li>
              <li>src/components/AmbassadorReferralCard.tsx</li>
              <li>src/components/feed/CreatePostForm.tsx</li>
              <li>src/components/feed/CreateCafeForm.tsx</li>
              <li>src/components/messaging/PlatformMessageButton.tsx</li>
              <li>src/components/messaging/PlatformMessageDialog.tsx</li>
              <li>src/components/messaging/MessagesInbox.tsx</li>
              <li>src/components/profiles/IndividualPublicCard.tsx</li>
              <li>src/components/profiles/ProfileIndividual.tsx</li>
              <li>src/components/connections/NotificationsPanel.tsx</li>
              <li>src/components/connections/ConnectionsFollowersStats.tsx</li>
              <li>src/components/booking/AppointmentBookingDialog.tsx</li>
              <li>src/components/booking/AppointmentManagePanel.tsx</li>
              <li>src/components/booking/BloggerAnalytics.tsx</li>
              <li>src/components/booking/CategoryPerformance.tsx</li>
              <li>src/hooks/useConnections.ts</li>
              <li>src/hooks/useIsPremium.ts</li>
              <li>src/hooks/useFeedSocial.ts</li>
              <li>src/hooks/useCafes.ts</li>
            </ul>
            <p>
              <strong>Zamanı gelince yapılacak:</strong>
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Seçenek A (bu sayfalar gerçek auth gerektiriyor):</strong>{" "}
                <code>src/contexts/AuthContext.tsx</code>'teki AuthProvider'ı App.tsx'e ekle —{" "}
                canonical AuthProvider'ın altına, iç içe değil yan yana. Sonra 38 dosyadaki{" "}
                <code>useAuth</code> import'larının doğru context'i kullandığını doğrula.
                <br />
                Not: İki context'in field adları farklı (<code>isLoading</code> vs <code>loading</code>) —
                geçiş sırasında tip hatalarını kontrol et.
              </li>
              <li>
                <strong>Seçenek B (bu sayfalar zaten auth gerektirmiyor):</strong>{" "}
                38 dosyayı sil ya da canonical <code>src/components/auth/useAuth</code>'a geçir.
                Orphaned context'i tamamen kaldır.
              </li>
              <li>
                <strong>Seçenek C (live'a geçildi, hala kullanılmıyor):</strong>{" "}
                38 dosyayı ve <code>src/contexts/AuthContext.tsx</code>'i sil.
              </li>
            </ul>
          </div>
        ),
      },
      {
        id: "dual-role-system",
        title: "İki Paralel Rol/Yetki Sistemi",
        accentColor: "#FBBC04",
        content: (
          <div className="space-y-4 text-sm leading-7 text-slate-700">
            <p>
              <strong>Durum:</strong> Her ikisi de aktif, canonical olan netleşmemiş.
            </p>
            <p>
              <strong>Eski sistem:</strong> <code>public.admin_users</code> tablosu.{" "}
              <code>src/lib/admin.ts</code>'deki <code>userIsAdmin()</code> bu tabloyu sorgular.{" "}
              <code>AdminLayout</code> tüm admin bölümünü bu kontrol üzerinden kilitler.
            </p>
            <p>
              <strong>Yeni sistem:</strong> <code>user_profiles_v2</code> + <code>rolesgo_*</code>{" "}
              tabloları (RolesGo MVP, Mayıs 2026). <code>RequireFeature</code> ve{" "}
              <code>useFeatureFlags</code> hook'ları bu sistemi kullanıyor.
            </p>
            <p>
              <strong>Zamanı gelince yapılacak:</strong>
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Yeni sistemin (rolesgo) admin erişim kontrolünü de kapsayacağı kararlaştırıldığında
                <code>AdminLayout</code>'taki <code>userIsAdmin()</code> çağrısı yeni sisteme taşınır.</li>
              <li><code>admin_users</code> tablosu deprecated edilir, migration ile kaldırılır.</li>
              <li>Bu karar verilmeden profile/role logic'e dokunma.</li>
            </ul>
          </div>
        ),
      },
      {
        id: "profiles-table",
        title: "profiles vs user_profiles_v2 Tablosu",
        accentColor: "#9334E9",
        content: (
          <div className="space-y-4 text-sm leading-7 text-slate-700">
            <p>
              <strong>Durum:</strong> Orphaned auth context <code>profiles</code> tablosundan çekiyor,
              yeni sistem <code>user_profiles_v2</code> kullanıyor.
            </p>
            <p>
              <strong>Sorun:</strong> İki ayrı profil tablosu var. Orphaned context mount edilseydi bile
              yanlış tablodan veri okuyacaktı.
            </p>
            <p>
              <strong>Zamanı gelince yapılacak:</strong> Auth sistemi kararı verildikten sonra orphaned
              context'i <code>user_profiles_v2</code>'ye taşı ya da tamamen kaldır.
            </p>
          </div>
        ),
      },
    ],
  },
];

export function getWorkspaceDocPage(slug: string) {
  return workspaceDocPages.find((page) => page.slug === slug) ?? null;
}

