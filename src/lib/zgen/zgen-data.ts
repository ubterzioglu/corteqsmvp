import type { ZgenData } from "@/lib/zgen/zgen-types";

/* =========================================================
   ZGEN – zgen-data.ts
   Yol: src/lib/zgen/zgen-data.ts

   AVATARLAR (erkek + kadın)
   Servis edildiği yer: public/relocation-tools/zgen/

   Gerekli dosya adları:
     /relocation-tools/zgen/gen_silent_m.jpg
     /relocation-tools/zgen/gen_silent_f.jpg
     /relocation-tools/zgen/gen_boomer_m.jpg
     /relocation-tools/zgen/gen_boomer_f.jpg
     /relocation-tools/zgen/gen_genx_m.jpg
     /relocation-tools/zgen/gen_genx_f.jpg
     /relocation-tools/zgen/gen_geny_m.jpg
     /relocation-tools/zgen/gen_geny_f.jpg
     /relocation-tools/zgen/gen_genz_m.jpg
     /relocation-tools/zgen/gen_genz_f.jpg
     /relocation-tools/zgen/gen_alpha_m.jpg
     /relocation-tools/zgen/gen_alpha_f.jpg
     /relocation-tools/zgen/gen_beta_m.jpg
     /relocation-tools/zgen/gen_beta_f.jpg

   Uyum tablosu YÖNLÜDÜR:
   compat[seninKusakId][digerKusakId] => { dos: [5], donts: [5], joke: "..." }

   NOT: `id` değerleri teknik anahtardır (DB/compat eşlemesi) — ÇEVRİLMEZ.
   Kullanıcıya görünen tüm metinler Türkçedir.
   ========================================================= */

export const ZGEN_DATA: ZgenData = {
  generations: [
    {
      id: "silent",
      name: "Sessiz Kuşak",
      range: [1928, 1945],
      avatars: { m: "/relocation-tools/zgen/gen_silent_m.jpg", f: "/relocation-tools/zgen/gen_silent_f.jpg" },
      avatarAlt: "Sessiz Kuşak avatarı"
    },
    {
      id: "boomer",
      name: "Baby Boomer Kuşağı",
      range: [1946, 1964],
      avatars: { m: "/relocation-tools/zgen/gen_boomer_m.jpg", f: "/relocation-tools/zgen/gen_boomer_f.jpg" },
      avatarAlt: "Baby Boomer Kuşağı avatarı"
    },
    {
      id: "genx",
      name: "X Kuşağı",
      range: [1965, 1980],
      avatars: { m: "/relocation-tools/zgen/gen_genx_m.jpg", f: "/relocation-tools/zgen/gen_genx_f.jpg" },
      avatarAlt: "X Kuşağı avatarı"
    },
    {
      id: "geny",
      name: "Y Kuşağı (Millennials)",
      range: [1981, 1996],
      avatars: { m: "/relocation-tools/zgen/gen_geny_m.jpg", f: "/relocation-tools/zgen/gen_geny_f.jpg" },
      avatarAlt: "Y Kuşağı avatarı"
    },
    {
      id: "genz",
      name: "Z Kuşağı",
      range: [1997, 2012],
      avatars: { m: "/relocation-tools/zgen/gen_genz_m.jpg", f: "/relocation-tools/zgen/gen_genz_f.jpg" },
      avatarAlt: "Z Kuşağı avatarı"
    },
    {
      id: "alpha",
      name: "Alfa Kuşağı",
      range: [2013, 2025],
      avatars: { m: "/relocation-tools/zgen/gen_alpha_m.jpg", f: "/relocation-tools/zgen/gen_alpha_f.jpg" },
      avatarAlt: "Alfa Kuşağı avatarı"
    },
    {
      id: "beta",
      name: "Beta Kuşağı",
      range: [2026, 2100],
      avatars: { m: "/relocation-tools/zgen/gen_beta_m.jpg", f: "/relocation-tools/zgen/gen_beta_f.jpg" },
      avatarAlt: "Beta Kuşağı avatarı"
    }
  ],

  /* ===== Profiller: özellikler + vibe'lar (2. kartta kullanılır) ===== */
  profiles: {
    silent: {
      traits: [
        "Önce görev, duygular sonra",
        "Kibarca karşı çıkmayı neredeyse bir spor hâline getirmiş",
        "Güveni yavaş verir, verdi mi ömür boyu sürer",
        "Parlak uygulamalar yerine kendini kanıtlamış araçları seçer",
        "Konuşmadan önce ortamı okur",
        "Tutumluluğu trend değil, refleks",
        "Kurumlara sadık, değişime temkinli",
        "Başarısını küçük gösterir, sessizce fazlasını verir",
        "Uzmanlığa ve kıdeme saygı duyar",
        "Sakin ve net bir dille iletişim kurar"
      ],
      vibes: [
        "Sessiz yetkinlik, gür sonuçlar",
        "Sürece saygı",
        "Az laf, çok iş",
        "İsraf yok, uzun ömür var",
        "Sağlam eller, sağlam planlar"
      ]
    },

    boomer: {
      traits: [
        "Çok çalışmanın karşılığını vereceğine inanır",
        "Toplantıyı gerçek bir verimlilik birimi sayar",
        "Uzun mesaj zincirleri yerine telefonu tercih eder",
        "Çevresini önemser, ilişki odaklı çalışır",
        "Unvana, dönüm noktalarına ve net kariyer basamaklarına değer verir",
        "Kendinden emin sunum yapar, salonu yönetmekten çekinmez",
        "Mikro güncellemeler yerine büyük resmi anlatmayı sever",
        "Güvenilirlik ve dakiklik bekler",
        "Uzlaşmayı sever ama işin bir karara bağlanmasını ister",
        "Pratik çözüm üretir, 'yaparız' refleksiyle hareket eder"
      ],
      vibes: [
        "Hizalanalım ve yola çıkalım",
        "Ara beni, hallederiz",
        "Sağlam tokalaşma enerjisi",
        "Resmiyete dökelim",
        "Önce iş, sonra keyif"
      ]
    },

    genx: {
      traits: [
        "Şüpheci ama kinik değil — genelde",
        "Sorunu kendi çözer, bakım gerektirmeyen takım arkadaşı",
        "Alkıştan çok özerklik ister",
        "Kurumsal boş lafa alerjisi var",
        "Doğrudan konuşur, mizahı kurudur",
        "Coşkudan çok yetkinliğe değer verir",
        "Sekmeler icat olmadan çoklu iş yapmayı öğrendi",
        "Eyleme güvenir, vaadi sorgular",
        "Hızlı uyum sağlar, şikâyetini içine atar",
        "Net hedef ve minimum gözetim ister"
      ],
      vibes: [
        "Sadede gel",
        "Gürültüsüz ama doğru yap",
        "Daha beterini gördüm",
        "Lütfen basit tut",
        "Dram değil, sonuç"
      ]
    },

    geny: {
      traits: [
        "Anlam odaklı ama teslim tarihini de bilir",
        "Geri bildirime açık, gelişim odaklı",
        "Varsayılanı iş birliği; silolardan nefret eder",
        "Değişimden rahatsız olmaz ama bağlam bekler",
        "Sürpriz toplantı yerine yazılı netlik ister",
        "Esnekliği bir verimlilik aracı olarak görür",
        "'Nasıl'dan önce 'neden'i sorar",
        "Hırsıyla tükenmişlik radarını dengeler",
        "Emir veren değil, koçluk yapan yönetici ister",
        "Araçları sisteme ve iş akışına dönüştürür"
      ],
      vibes: [
        "Nedenini anlat",
        "Süreci iyileştirelim",
        "Kısa hizalan, sonra çıkar",
        "Esnek ama savruk değil",
        "Anlam artı ivme"
      ]
    },

    genz: {
      traits: [
        "Bilgiyi hızla tarar, boş lafa tahammülü yok",
        "Kısa mesaj ve net talep ister",
        "Fikirlere daha baştan itiraz etmekten çekinmez",
        "Resmiyetten çok samimiyete değer verir",
        "Videolarla, deneyerek ve tekrar ederek öğrenir",
        "Araçların sezgisel ve anında olmasını bekler",
        "Zamanı ve enerjisi konusunda net sınır koyar",
        "Toplumsal meselelere, riske ve markaya karşı uyanık",
        "Şeffaflık ve hızlı geri bildirim döngüsüyle açılır",
        "Yan projelerini portföye çevirir"
      ],
      vibes: [
        "Tek cümlede söyle",
        "Hava değil, kanıt göster",
        "Çıkar, öğren, tekrarla",
        "Samimi ol",
        "Sınıra saygı"
      ]
    },

    alpha: {
      traits: [
        "Önce dokunur; kılavuz onun için isteğe bağlı",
        "Yapay zekâyla düşünmeyi havalı değil, normal bulur",
        "Her yerde kişiselleştirme bekler",
        "Görsel ve etkileşimli öğrenir",
        "Dikkat süresi kısa, örüntü yakalaması keskin",
        "Kimse demeden ilerlemeyi oyunlaştırır",
        "Doğal olarak çok kanallı: ses, video, metin",
        "Tüketmek yerine birlikte üretmeyi sever",
        "Yavaş arayüze ve yavaş karara sabrı yok",
        "Hız muhakemeyi geçtiği için korkuluklara ihtiyaç duyar"
      ],
      vibes: [
        "Anında, etkileşimli, sezgisel",
        "Oynanabilir yap",
        "Kaydır, çözülsün",
        "Cevabı birlikte üretelim",
        "Sıkıcıysa bozuktur"
      ]
    },

    beta: {
      traits: [
        "Her yerde yapay zekânın ve akıllı ortamların içine doğdu",
        "Varsayılanı devretmek: 'sistem, sen hallet'",
        "Kimlik ve gizlilik ayarlarının kusursuz olmasını bekler",
        "Yapay üretim içeriği gündelik içerik gibi görür",
        "Kullanıcı deneyiminde çıtası yüksek, sürtünmeye sabrı düşük",
        "Ajanları ve otomasyonu elektrik su gibi kullanır",
        "Doğrulamaya en az yaratıcılık kadar değer verir",
        "Prompt, iş akışı ve orkestrasyon diliyle düşünür",
        "İş birliğine insanı da aracı da eşit dahil eder",
        "Öğrenmeyi kesintisiz ve kişiselleştirilmiş bir akış sayar"
      ],
      vibes: [
        "Önce ajan yaşam tarzı",
        "Sürtünme bir hatadır",
        "Önce doğrula, sonra keyfine bak",
        "Her şeyi orkestre et",
        "Varsayılan olarak kişiselleştirilmiş"
      ]
    }
  },

  /* ===== Uyum tablosu (yönlü) ===== */
  compat: {
    silent: {
      boomer: {
        dos: [
          "Bağlamı ver, sadede baştan gel.",
          "Değişiklik önermeden önce tecrübeye saygı göster.",
          "Hassas konularda telefonu ya da yüz yüze görüşmeyi tercih et.",
          "Söz verdiğin şeyi hızlıca yerine getir.",
          "Geri bildirimi baş başa ve olgulara dayalı ver."
        ],
        donts: [
          "Değişimden hoşlanmadıklarını varsayma; önce sor.",
          "Toplantıda argoyu ve iğnelemeyi abartma.",
          "Haklı çıkmak için kimseyi herkesin önünde sıkıştırma.",
          "Kötü haberi muğlak bir dilin arkasına saklama.",
          "Resmi ortamlarda unvanı önemsizmiş gibi davranma."
        ],
        joke: "Baby Boomer'ın onayını istiyorsan takvime koy; doğaçlama diye bir toplantı daveti yok."
      },
      genx: {
        dos: [
          "Kısa ve pratik ol.",
          "Özerklik ver, sonucu net söyle.",
          "Sözlü anlaşmayı yazılı notla kayda geçir.",
          "Yetkinliğini abartılı övgüye kaçmadan teslim et.",
          "Zamanına saygı göster; toplantıyı kısa tut."
        ],
        donts: [
          "İşi nasıl yaptığına burnunu sokma.",
          "Bariz adımları uzun uzun anlatma.",
          "Her şeyi komisyon kararına çevirme.",
          "İğneleyici tavrını ilgisizlik sanma.",
          "Zoraki eğlence ritüellerine mecbur bırakma."
        ],
        joke: "X Kuşağı planına başını sallar, sen daha ikinci slayttayken planı sessizce düzeltmiş olur."
      },
      geny: {
        dos: [
          "'Nasıl'dan önce 'neden'i anlat.",
          "Geri bildirimi gelişim odaklı ver, sonraki adımı da söyle.",
          "Fikir iste, sonra net karar ver.",
          "İş birliği dilini kullan ama muğlaklığa kaçma.",
          "Sonuca dönüşen emeği görünür kıl."
        ],
        donts: [
          "Anlam ve adalet olmadan sadakat bekleme.",
          "Kararı sadece hiyerarşiyle gerekçelendirme.",
          "Geri bildirimi yıllık değerlendirmeye erteleme.",
          "İş-yaşam sınırını zayıflık sayma.",
          "Dijital araçları iş akışında lüksmüş gibi görme."
        ],
        joke: "Y Kuşağı'na amacı anlat, koşar; 'ben öyle dedim' de, LinkedIn'i açar."
      },
      genz: {
        dos: [
          "Doğrudan, nazik ve hızlı ol.",
          "Beklentini yazıya dök ve bir kez tekrarla.",
          "Geri bildirimi nasıl almak istediğini sor.",
          "Küçük kazanımlar ve hızlı öğrenme döngüleri sun.",
          "Kısıtlar ve ödünler konusunda şeffaf ol."
        ],
        donts: [
          "Uzun monologları yönetim tarzı hâline getirme.",
          "Açık sözlülüğü kabalıkla karıştırma.",
          "Sessizliği onay sayma.",
          "Yeni araçları ya da formatları küçümseme.",
          "Zihinsel yükü ve sürekli konu değiştirmeyi yok sayma."
        ],
        joke: "Güncellemen kısa bir videodan uzun sürüyorsa, Z Kuşağı özetini ister."
      },
      alpha: {
        dos: [
          "Görsel örnek ve somut demo kullan.",
          "İşi kısa ve net adımlara böl.",
          "Her denemeye anında geri bildirim ver.",
          "Kuralları açıkça söyle ve tutarlı uygula.",
          "Merakı güvenli sınırlar içinde teşvik et."
        ],
        donts: [
          "Söylenmemiş kurallara güvenme; hepsini açıkça söyle.",
          "Yavaş araçlara ya da yavaş kararlara sabır bekleme.",
          "Soruyu bölücülük sayıp cezalandırma.",
          "Korkuyla motive etmeye çalışma.",
          "Öncelikleri havadan sezeceğini varsayma."
        ],
        joke: "Alfa Kuşağı kılavuz istemiyor; jeneriği atlayan eğitim videosunu istiyor."
      },
      beta: {
        dos: [
          "Sakin odaklanmayı ve düzenli rutini kendin örnekle.",
          "Eleştirel düşünmeyi basit kontrollerle öğret.",
          "Kısa, dostane yönlendirmeler ve örnekler kullan.",
          "Yoğunluğu değil, istikrarı ödüllendir.",
          "Kararların nasıl alındığını ve nasıl değiştiğini anlat."
        ],
        donts: [
          "Aynı anda seçenek yağmuruna tutma.",
          "Sahipliğin belirsiz kalmasına katlanacağını sanma.",
          "Kafası karıştığında açıklamayı erteleme.",
          "Her şeyi otomatik olarak yarışa çevirme.",
          "Dikkatini sınırsız sanma."
        ],
        joke: "Yetişkinler yazı tipini tartışmayı bitiremeden Beta Kuşağı yayına hazır olur."
      }
    },

    boomer: {
      silent: {
        dos: [
          "Resmi nezaketi ve net sınırları koru.",
          "Değişiklik önerirken kanıtı ve geçmişi de getir.",
          "Tartışmaya girmeden önce görüşünü sor.",
          "Zor konuları baş başa konuş.",
          "Güvenilirliğini düzenli takiple göster."
        ],
        donts: [
          "Düşünme fırsatı vermeden karara zorlama.",
          "'Modernleştirilmek' istediklerini varsayma.",
          "Sert yüzleşmeyi dürüstlük diye sunma.",
          "Somut bilgi yerine moda terimlere sığınma.",
          "Yıllara yayılan katkıyı teşekkürsüz bırakma."
        ],
        joke: "Sessiz Kuşak'ın yanında yapabileceğin en gürültülü hamle, hazırlıklı gelmektir."
      },
      genx: {
        dos: [
          "Hedefi söyle, rotayı kendisi seçsin.",
          "Durum güncellemelerini kısa ve amaçlı tut.",
          "Şüpheciliğine saygı göster, olgularla cevap ver.",
          "Hak ettiğinde emeğini herkesin önünde teslim et.",
          "Saat üzerinden değil, sonuç üzerinden anlaş."
        ],
        donts: [
          "Tek gerekçen yetkin olmasın.",
          "Her konuyu toplantıya çevirme.",
          "Çok söz verip az teslim etme.",
          "Bağımsızlığını saygısızlıkla karıştırma.",
          "Emirle coşku talep etme."
        ],
        joke: "X Kuşağı'na motivasyon konuşması değil, önündeki engelin kaldırılması lazım."
      },
      geny: {
        dos: [
          "Görevi etkiyle ve öğrenmeyle ilişkilendir.",
          "Geri bildirimi erken ve somut ver.",
          "Sonuçlar iyi gittiği sürece esneklik tanı.",
          "İş birliğine çağır, sonra bir karara bağlan.",
          "Terfi kriterlerinde şeffaf ol."
        ],
        donts: [
          "Uzun mesaiyi bağlılık sayma.",
          "Soruyu otoriteye meydan okuma olarak görme.",
          "Bilgiyi güç diye kendine saklama.",
          "Araç iyileştirme taleplerini görmezden gelme.",
          "Sadece görünen işi ödüllendirip işe yarayan işi atlama."
        ],
        joke: "Y Kuşağı zor işi kaldırır; yeter ki buna ömür boyu 'çıraklık' deme."
      },
      genz: {
        dos: [
          "Beklentiyi net söyle, kısa aralıklarla durum sor.",
          "Doğrudan geri bildirim ver, düzeltme yolunu da göster.",
          "Samimi ol; kurumsal tiyatroyu bırak.",
          "Eşzamansız çalışmayı yazılı netlikle destekle.",
          "Erken yardım istemeyi normalleştir."
        ],
        donts: [
          "Sınır koymasını tembellik sanma.",
          "Küçük sorunlar için haftalarca bekleme.",
          "İğnelemeyi öğretme yöntemi yapma.",
          "Kamerayı açmayı sadakat testine çevirme.",
          "Ruh sağlığını 'işle ilgisi yok' diye geçiştirme."
        ],
        joke: "Z Kuşağı unvanına daha çok saygı duyar — yeter ki Wi-Fi'ın kopmasın."
      },
      alpha: {
        dos: [
          "Önce göstererek öğret, sonra hemen denemesine izin ver.",
          "Basit kurallar koy, anında pekiştir.",
          "Öğrenmeyi oyunlu ama hedefli tut.",
          "Yönergeleri kısa ve görsel tut.",
          "Önce korkulukları kur, sonra keşfetmesine izin ver."
        ],
        donts: [
          "Önce uzun yönergeleri okuyacağını varsayma.",
          "Herkesin önünde başarısız olduğunda utandırma.",
          "Molasız ve tekdüze bir akışta odak bekleme.",
          "Teknolojiyi peşinen dikkat dağıtıcı sayma.",
          "Her küçük hatayı düzeltmeye kalkma."
        ],
        joke: "Alfa Kuşağı 'prosedür' kelimesini duyar duymaz 'atla' düğmesini arar."
      },
      beta: {
        dos: [
          "Öngörülebilir rutinler ve net roller kur.",
          "Merakı güvenli denemelerle destekle.",
          "Basit kontrol listeleri ve hatırlatıcılar kullan.",
          "Saygılı itirazı kendin örnekle.",
          "Sorumlu teknoloji alışkanlıklarını erken öğret."
        ],
        donts: [
          "Kuralları kendiliğinden öğreneceğini varsayma.",
          "Bildirim ve uyarı yağmuruna tutma.",
          "Her seferinde doğruluğun önüne hızı koyma.",
          "Her görevi bir gösteriye çevirme.",
          "Uyumu korkuyla sağlamaya çalışma."
        ],
        joke: "Beta Kuşağı gerçek hayat için de 'sürüm geçmişi' isteyecek."
      }
    },

    genx: {
      silent: {
        dos: [
          "Saygıyla ve sakin bir tonla başla.",
          "Sadece eleştiri değil, çözüm de getir.",
          "Anlaşmayı yazılı olarak teyit et.",
          "Dakik ve tutarlı ol.",
          "Yaşadıklarını ve çıkardığı dersleri sor."
        ],
        donts: [
          "Resmi anlarda sivri espriler yapma.",
          "Kanıt olmadan hızlı değişim isteyeceğini varsayma.",
          "İşi hızlandırmak için sözünü kesme.",
          "Geleneği akıl dışıymış gibi görme.",
          "Anlaşmazlığı çözümsüz bırakıp sürüncemede tutma."
        ],
        joke: "Sessiz Kuşak senin keskin yorumunu değil, planını ve takvimini istiyor."
      },
      boomer: {
        dos: [
          "Sonuçlarını ve geçmiş sicilini göster.",
          "İyileştirme önerirken süreci de gözet.",
          "Net ve kendinden emin bir dille konuş.",
          "Sorunu erken bildir, yanında seçenekleri de getir.",
          "Hâlihazırda iyi işleyeni teslim et."
        ],
        donts: [
          "'Eski usul' deyip gözlerini devirme.",
          "Kararları kulis konuşmalarıyla zayıflatma.",
          "Unvanı yüzünden dinlemeyeceğini sanma.",
          "Paydaş yönetimini es geçme.",
          "Sorumluluktan kaçmak için muğlaklığa sığınma."
        ],
        joke: "Baby Boomer'lar yeniliğe bayılır — pilot uygulaması, metrikleri ve sunumu olduktan sonra."
      },
      geny: {
        dos: [
          "Açık konuş ama empatiyi de ekle.",
          "Özgürlük ver, hesap verebilirliği net tut.",
          "Sorunu birlikte çözme yöntemini kullan.",
          "Karar kriterlerini açıkça paylaş.",
          "Sadece çıktıyı değil, inisiyatifi de takdir et."
        ],
        donts: [
          "İyimserliğini saflık sanma.",
          "Ortam gerilmesin diye geri bildirimi saklama.",
          "Esnekliği canın istediğinde geri alabileceğin bir ayrıcalık sanma.",
          "Değerler üzerine konuşmayı 'lüks mesele' diye geçiştirme.",
          "Kariyer yolunun netleşmesi ihtiyacını görmezden gelme."
        ],
        joke: "Y Kuşağı vizyonunu sorar; X Kuşağı teslim tarihini."
      },
      genz: {
        dos: [
          "Mesajları kısa tut, yapılacak şeyi net yaz.",
          "Doğrudan geri bildirim ver, hızlı tur at.",
          "Sınırlarına ve eşzamansız iletişime saygı göster.",
          "Ödünleri tepeden bakmadan anlat.",
          "Soru sormasını teşvik et, bahane etiketi yapıştırma."
        ],
        donts: [
          "'Sen de sertleş' demeyi koçluk sanma.",
          "Yazılı olmayan kuralları bildiğini varsayma.",
          "Bilgiyi 'çilesini çeksin' diye saklama.",
          "Her bildirime acil muamelesi yapma.",
          "Araçlarını ya da iletişim tarzını alaya alma."
        ],
        joke: "X Kuşağı 'kendin çöz' der; Z Kuşağı 'tamam, dokümanın linkini at' der."
      },
      alpha: {
        dos: [
          "Etkileşimli örneklerle öğret.",
          "Kısa döngülerle ilerle: dene, gözden geçir, ayarla.",
          "Net sınır koy ve nedenini açıkla.",
          "Sadece kazanmayı değil, öğrenmeyi de kutla.",
          "Yapı kur ama katılaştırma."
        ],
        donts: [
          "Tek formatta uzun süre odak bekleme.",
          "Sonuç güvenliyken denemeyi cezalandırma.",
          "'Profesyonel ol' gibi muğlak yönergeler verme.",
          "Sessizliği anladı sanma.",
          "Uygulama yerine nutuk çekmeyi alışkanlık yapma."
        ],
        joke: "Alfa Kuşağı 'en iyi uygulamalar' lafını bir meydan okuma olarak görür."
      },
      beta: {
        dos: [
          "Sistemleri basit ve tekrarlanabilir tut.",
          "Odaklanmayı tek işe ayrılmış net anlarla öğret.",
          "Dostane kontrol listeleri ve ritüeller kullan.",
          "Sorunu sakin çözmeyi kendin örnekle.",
          "Bilgiyi hızlıca nasıl doğrulayacağını göster."
        ],
        donts: [
          "Aynı anda çok araçla işi karmaşıklaştırma.",
          "Sürekli hareketi ilerleme sanma.",
          "Geri bildirimi yalnızca sonuca indirgeyip alışkanlıkları atlama.",
          "Sürekli açık olmayı normalleştirme.",
          "Merakı düzen bozma sayma."
        ],
        joke: "Sen sabah kahveni bitirmeden Beta Kuşağı rutinini baştan yazmış olur."
      }
    },

    geny: {
      silent: {
        dos: [
          "Kibar bir resmiyet ve sakin bir tempo kullan.",
          "Yol göstermesini iste ve tavsiyesine uyduğunu göster.",
          "Verdiğin sözleri sıkı ve tutarlı tut.",
          "Geri bildirimi baş başa alıp ver.",
          "Sadece ideal değil, uygulanabilir öneri getir."
        ],
        donts: [
          "Resmi ortamlarda kişisel hayatını fazla anlatma.",
          "Her şeyin anında olmasının makbul sayıldığını varsayma.",
          "Her kararı beyin fırtınasına çevirme.",
          "Hassas konularda senli benli bir dil kullanma.",
          "Dinlenildiğini hissetmeden konuyu kapatmaya çalışma."
        ],
        joke: "Sessiz Kuşak motivasyon sözü istemiyor; dediğini yapmanı istiyor."
      },
      boomer: {
        dos: [
          "Önce saygını göster, sonra iyileştirme öner.",
          "Veriyi ve müşteriye etkisini getir.",
          "Hedefler ve sahiplik konusunda net şekilde hizalan.",
          "Ültimatom değil, seçenek sun.",
          "Ardından kısa bir yazılı özet gönder."
        ],
        donts: [
          "Esnekliğe karşı olduklarını varsayma; müzakere et.",
          "Sonuçları tercüme etmeden jargon kullanma.",
          "Hiyerarşiyi kötü adam hikâyesine çevirme.",
          "Riski kabul etmeden değişimi dayatma.",
          "İlk konuşmada anında onay bekleme."
        ],
        joke: "Baby Boomer'lar fikrine, canlıda iki kez çalıştığını gördükten hemen sonra güvenir."
      },
      genx: {
        dos: [
          "Verimli ve hazırlıklı ol.",
          "Bağımsızlığına saygı göster, işine karışma.",
          "Mizahı gösteriye dönüştürmeden, dozunda kullan.",
          "Görüşünü erken al, sonra harekete geç.",
          "Hatanı hızlıca kabul et ve yoluna devam et."
        ],
        donts: [
          "Coşkuyu yetkinlik diye pazarlama.",
          "Geri bildirimi uzun bir koçluk seansına çevirme.",
          "Sürekli hizalanma toplantısı istediğini varsayma.",
          "Sessizliğini umursamazlık sanma.",
          "'Yakında bir ara' gibi muğlak tarihler verme."
        ],
        joke: "X Kuşağı yol haritanı değil, engeller listeni istiyor."
      },
      genz: {
        dos: [
          "Beklentileri net yaz ve 'bitti'nin tanımını yap.",
          "Geri bildirimi hızlı ve somut ver.",
          "Araçlar ve iş akışı için önerilerini iste.",
          "'Bilmiyorum' demeyi ve öğrenmeyi normalleştir.",
          "Odak zamanını eşzamansız güncellemelerle koru."
        ],
        donts: [
          "Belirsiz önceliklere katlanacağını varsayma.",
          "Açıkça istemek yerine imalı laf sokma.",
          "Sınırlarını peşinen pazarlık konusu sayma.",
          "Görünürlük olsun diye toplantıya boğma.",
          "Açık sözlülüğünü saygısızlık diye etiketleme."
        ],
        joke: "Z Kuşağı sürecini kabul eder — daha az toplantı ve daha iyi doküman geliyorsa."
      },
      alpha: {
        dos: [
          "Kısa yönergeler ver ve hemen uygulamaya geç.",
          "Geri bildirimi sık ver, önce olumluyu söyle.",
          "Seçenek sun ama birkaç taneyle sınırla.",
          "Nutuk yerine görsel ve örnek kullan.",
          "Alışkanlığı küçük günlük rutinlerle kur."
        ],
        donts: [
          "Yavaş ödül döngülerine sabredeceğini varsayma.",
          "Her seferinde anında düzeltmeye kalkma.",
          "Kuralları günden güne değiştirme.",
          "Suçluluk duygusuyla motive etme.",
          "Teknoloji kullanımını tamamen iyi ya da tamamen kötü diye görme."
        ],
        joke: "Alfa Kuşağı çoklu iş yapmıyor; aynı beyin sekmesinde birden fazla uygulama çalıştırıyor."
      },
      beta: {
        dos: [
          "İyi soru sormayı öğret.",
          "Güvenlik ve odak için basit korkuluklar koy.",
          "İstikrarı ve nezaketi pekiştir.",
          "Kaynakları hızlıca nasıl doğrulayacağını göster.",
          "Hedefleri küçük tut, ilerlemeyi görünür şekilde takip et."
        ],
        donts: [
          "Sinyali gürültüden tek başına ayıracağını varsayma.",
          "Sadece hızı ve yeniliği ödüllendirme.",
          "Her dakikasını programa boğma.",
          "Hatasını herkesin önünde ders malzemesi yapma.",
          "Ekranların gerçek iletişimin yerini almasına izin verme."
        ],
        joke: "Beta Kuşağı'nın ilk kelimesi 'güncelleme' olabilir; çünkü artık her şeyin bir güncellemesi var."
      }
    },

    genz: {
      silent: {
        dos: [
          "Saygılı bir dil ve ölçülü bir ton kullan.",
          "Dobra geri bildirim vermeden önce izin iste.",
          "Güvenilir ol; güveni en hızlı istikrar inşa eder.",
          "Seri atışlı tartışma yerine düzenli sohbeti tercih et.",
          "Takdirini somut şekilde göster."
        ],
        donts: [
          "Ciddi konularda sivri espriler yapma.",
          "Senli benli olmayı samimiyet sanma.",
          "Tartışmayı hızlandırmak için sözünü kesme.",
          "Yılların tecrübesini modası geçmiş sayma.",
          "Yardım istedikten sonra ortadan kaybolma."
        ],
        joke: "Sessiz Kuşak mesajını sonuna kadar okur; asıl hüner buna değecek bir mesaj yazmaktır."
      },
      boomer: {
        dos: [
          "Sonuçlarla ve iş değeriyle başla.",
          "Doğrudan konuş ama saygıyı elden bırakma.",
          "Net metrikleri olan bir pilot plan sun.",
          "İlerlemeyi sorulmadan paylaş.",
          "Esneklik istemeden önce sorumluluk aldığını göster."
        ],
        donts: [
          "Yeni araçlardan nefret ettiklerini varsayma; faydayı kanıtla.",
          "İtiraz ederken iğneleyici olma.",
          "Paydaşlarla hizalanmayı atlama.",
          "Teslim tarihlerini isteğe bağlı sayma.",
          "Puan toplamak için onları herkesin önünde düzeltme."
        ],
        joke: "Baby Boomer'lar aracını daha hızlı benimser — adını 'yeni standart' koyarsan."
      },
      genx: {
        dos: [
          "Kısa konuş, gereksizi at.",
          "Beklentileri açıkça sor.",
          "İnisiyatif al ama her ayrıntıyı anlatma.",
          "Dobra geri bildirimi kabul et ve gereğini yap.",
          "Eşzamansız güncelleme gönder, sonraki adımı net yaz."
        ],
        donts: [
          "İğneleyici tavrını üstüne alınma.",
          "Bütün düşünce sürecini uzun uzun anlatma.",
          "Sürekli onay ve teselli isteme.",
          "Küçük anlaşmazlıkları duygusal olarak büyütme.",
          "Bağımsızlığını soğukluk sanma."
        ],
        joke: "X Kuşağı 'harika iş' demez ama aynı işi bir daha yapmana da engel olmaz."
      },
      geny: {
        dos: [
          "Birlikte çalış ve emeği açıkça paylaş.",
          "Dürüst geri bildirimi incelikle ver.",
          "Sınırlar ve yanıt süreleri konusunda anlaş.",
          "Modern araçları kullan ama iş akışını sabit tut.",
          "Mentorluk isterken somut hedef belirt."
        ],
        donts: [
          "Hem sosyal hem mesleki olarak 7/24 ulaşılabilir olmak istediğini varsayma.",
          "Anlam üzerine konuşmasını gösteriş sanma.",
          "Konuşmayı yarıda bırakıp güvenin süreceğini sanma.",
          "Daha iyisini önermeden süreci reddetme.",
          "Her şeyi değerler tartışmasına çevirme."
        ],
        joke: "Y Kuşağı hırsına bayılır — ta ki mesajla halledilecek bir şey için toplantı kurana kadar."
      },
      alpha: {
        dos: [
          "Hızlı demolar ve tekrarla öğret.",
          "Basit bir dil ve net sınırlar kullan.",
          "Yaratıcılığı güvenli kısıtlarla teşvik et.",
          "Geri bildirimi anında ve uygulanabilir ver.",
          "Oturumları kısa ve çeşitli tut."
        ],
        donts: [
          "Bir kez izleyerek öğreneceğini varsayma.",
          "Aynı anda çok kuralla boğma.",
          "Hatayı utandırarak düzeltmeye çalışma.",
          "Molasız uzun odak bekleme.",
          "Soruları bölücülük sayma."
        ],
        joke: "Alfa Kuşağı sen anlatmayı bitiremeden öğrenir, sonra da anlatımının neden bu kadar yavaş olduğunu sorar."
      },
      beta: {
        dos: [
          "Sağlıklı dikkat alışkanlıklarını ve mola vermeyi kendin örnekle.",
          "Basit sistemler öğret: bak, doğrula, karar ver.",
          "Kısa yönlendirmeler ve tutarlı rutinler kullan.",
          "Nezaketi ve iş birliğini ödüllendir.",
          "Erken yardım istemeyi nasıl yapacağını göster."
        ],
        donts: [
          "Sürekli bildirimi normalleştirme.",
          "Her işi içeriğe ya da gösteriye çevirme.",
          "Anlamak yerine kestirme yolları ödüllendirme.",
          "Yanlış bilgiyi sorgusuz geçiştirme.",
          "Teknolojiye hâkim olmasını sağduyu sanma."
        ],
        joke: "Beta Kuşağı'nın dijital hijyeni, bu karmaşayı icat eden yetişkinlerinkinden iyi olacak."
      }
    },

    alpha: {
      silent: {
        dos: [
          "Kibar bir dil kullan ve tempoyu düşür.",
          "Saygını dinleyerek ve sabrederek göster.",
          "Fikrinden önce niyetini anlat.",
          "Ardından net bir yazılı özet gönder.",
          "Nasıl iletişim kurmayı tercih ettiğini sor."
        ],
        donts: [
          "Hızlı cevabın zorunlu olduğunu varsayma.",
          "Resmi ortamlarda argo kullanma.",
          "Eğlence olsun diye herkesin önünde meydan okuma.",
          "Geleneği şakaya çevirme.",
          "Geçiş yapmadan konudan konuya atlama."
        ],
        joke: "Sessiz Kuşak konuşmadan önce düşünür; Alfa Kuşağı üç yeni sekme açarken düşünür."
      },
      boomer: {
        dos: [
          "Saygılı ol ve hedefleri net söyle.",
          "Yaptığın işi ve mantığını kısaca göster.",
          "Yapıyı kabul et, sonra onun içinde iyileştir.",
          "Geri bildirimi küçük ve sık dozlarda iste.",
          "Karışıklığı önlemek için ortak dokümanlar kullan."
        ],
        donts: [
          "Kuralların konuşulmadan esneyeceğini varsayma.",
          "Tecrübeyi konuyla ilgisiz sayma.",
          "Ciddi bir şeyi anlatmak için mizah görselleri kullanma.",
          "Kimseye danışmadan her hafta araç değiştirme.",
          "Teslim tarihlerini öneri sayma."
        ],
        joke: "Baby Boomer'lar bir plan ister; Alfa Kuşağı kendini güncelleyen bir plan."
      },
      genx: {
        dos: [
          "Verimli ol ve kendi başına yürü.",
          "Genel değil, net sorular sor.",
          "Küçük sonuçları erken teslim et.",
          "'Toplantı yok' tercihine saygı göster.",
          "Geri bildirimi dramatize etmeden al."
        ],
        donts: [
          "Her küçük kararı tek tek anlatma.",
          "Sürekli teşvik bekleme.",
          "Moda terimleri kanıt yerine koyma.",
          "Sahipliğin belirsiz kalmasına katlanacağını sanma.",
          "İşi sosyal bir gösteriye çevirme."
        ],
        joke: "X Kuşağı beş adımlık planına bakar ve hangi adımın gerçekten işi çıkardığını sorar."
      },
      geny: {
        dos: [
          "Yaptığın işi etkiyle ve öğrenmeyle ilişkilendir.",
          "Birlikte çalış ve emeği doğal biçimde paylaş.",
          "Mentorluk iste ve koçluğu kabul et.",
          "Herkesin işini kolaylaştıran araçlar kullan.",
          "Beklentileri ve takvimi baştan netleştir."
        ],
        donts: [
          "Her değişikliği acil sayma.",
          "Bağlamı atlayıp doğrudan çözüme atlama.",
          "Esnekliği hiç yapı yok sanma.",
          "Geri bildirimi 'eski kafa' diye geçiştirme.",
          "Güvenilirliğin önüne yeniliği koyma."
        ],
        joke: "Y Kuşağı gelişimine sırtını verir; yeter ki onu tam zamanlı takvimin hâline getirme."
      },
      genz: {
        dos: [
          "Hızlı geri bildirim döngüleri ve kısa turlar kullan.",
          "İletişimi kısa ve açık tut.",
          "Sınırlar üzerinde anlaşın ve bunlara uy.",
          "Kaynakları ve şablonları açıkça paylaş.",
          "Erken yardım istemeyi normalleştir."
        ],
        donts: [
          "Kimin daha dobra olduğunu yarıştırma.",
          "Aynı argoyu kullanmanızı aynı şeyi anlamak sanma.",
          "Her anlaşmazlığı kimlik meselesi yapma.",
          "Birbirinizi sürekli bildirim yağmuruna tutma.",
          "Yavaş geliyor diye dokümantasyonu atlama."
        ],
        joke: "Alfa ve Z Kuşağı projeyi bir günde bitirebilir — sonra hangi araçla yapacaklarını seçmek için bir hafta harcarlar."
      },
      beta: {
        dos: [
          "Odak ve sabır konusunda sakin bir örnek ol.",
          "Basit rutinler kur ve bunları tekrarla.",
          "Doğrulama alışkanlığını erken öğret.",
          "Rekabet yerine iş birliğini teşvik et.",
          "Hedefleri küçük tut ve istikrarı kutla."
        ],
        donts: [
          "Sürekli konu değiştirerek aşırı uyarma.",
          "Her şeyi yarışa çevirme.",
          "Öğrenmenin yerine dikkat çekmeyi ödüllendirme.",
          "Temelleri atlamayı normalleştirme.",
          "Hataları eğlence malzemesi yapma."
        ],
        joke: "Alfa Kuşağı Beta'ya kestirme yolu öğretir, Beta da bunu kimin onayladığını sorar."
      }
    },

    beta: {
      silent: {
        dos: [
          "Saygılı bir dil ve net bir yapı kullan.",
          "Cevap vermeden önce sonuna kadar dinle.",
          "Tutarlı ol ve söylediğini yap.",
          "Kuralları ve beklentileri açıkça sor.",
          "Yardımını pratik ve somut biçimde sun."
        ],
        donts: [
          "Konudan konuya atlayarak sohbeti aceleye getirme.",
          "Senli benli olmanın her zaman hoş karşılandığını varsayma.",
          "Tecrübeyi isteğe bağlı bir ayrıntı sayma.",
          "Ciddi konuşmaların ortasında espri yapma.",
          "Akıl danıştıktan sonra ortadan kaybolma."
        ],
        joke: "Sessiz Kuşak sabra değer verir; Beta Kuşağı ise bu kavramı hâlâ yüklüyor."
      },
      boomer: {
        dos: [
          "Kibar, net ve sonuç odaklı ol.",
          "Sorumluluk al ve teslim tarihlerine uy.",
          "Geri bildirim iste ve hızlıca uygula.",
          "Herkesi aynı sayfada tutan basit araçlar kullan.",
          "Mantığını savunmaya geçmeden anlat."
        ],
        donts: [
          "Kuralları baskı sayma.",
          "Paydaşlara haber vermeden rota değiştirme.",
          "Netliğin yerine moda terimler koyma.",
          "Davet edildiğin toplantıyı isteğe bağlı sayma.",
          "Alternatif önermeden itiraz etme."
        ],
        joke: "Baby Boomer'lar süreci getirir; Beta Kuşağı da o süreci bir kez bozan otomatik güncellemeyi."
      },
      genx: {
        dos: [
          "Kısa konuş ve hazırlıklı gel.",
          "Bağımsızlığını güvenilir iş çıkararak göster.",
          "Somut sorular sor ve kısa cevapları kabul et.",
          "Sınırlara ve az toplantı kültürüne saygı göster.",
          "Önce sonucu teslim et, sonra sessizce geliştir."
        ],
        donts: [
          "Sürekli övgü ve onay bekleme.",
          "Zeki görünmek için planı karmaşıklaştırma.",
          "Dobra geri bildirimi üstüne alınma.",
          "İşi popülerlik yarışına çevirme.",
          "Yeni bir bilgi yokken üst üste mesaj atma."
        ],
        joke: "X Kuşağı uzun mesajını okumaz ama içinde anlattığın sorunu çözer."
      },
      geny: {
        dos: [
          "Önce amaçta anlaş, sonra metrikleri belirle.",
          "İş birliğine dayalı bir ton ve ortak sahiplik kullan.",
          "Kapasiten ve engeller konusunda şeffaf ol.",
          "Koçluk iste ve hızlıca uygula.",
          "Esnekliğe saygı göster ama hesap verebilir kal."
        ],
        donts: [
          "Havanın net önceliklerin yerini tutacağını sanma.",
          "Geri bildirimi kişisel bir not sayma.",
          "Ekibin kurallarını ve araçlarını görmezden gelme.",
          "Hevesli görünmek için kaldıramayacağın kadar iş alma.",
          "Emin değilken belirsizliği öylece bırakma."
        ],
        joke: "Y Kuşağı gelişmene yardım eder; Beta Kuşağı'nın da toplantı davet listesini büyütmeyi bırakması yeter."
      },
      genz: {
        dos: [
          "Mesajları kısa tut, sonraki adımı net yaz.",
          "Sınırlara ve yanıt sürelerine saygı göster.",
          "Hızlı geri bildirim döngüleri kur ve hızlı ayarla.",
          "Kararları ortak bir yerde kayda geçir.",
          "Bir şey belirsizse baştan dürüstçe söyle."
        ],
        donts: [
          "Hızın netlikten önemli olduğunu varsayma.",
          "Dobralığı yarışa çevirme.",
          "Küçük anlaşmazlıklara aşırı tepki verme.",
          "Sohbeti sürekli güncellemeyle doldurma.",
          "Hizalanmayı atlayıp işin kendiliğinden yürümesini bekleme."
        ],
        joke: "Beta ve Z Kuşağı tek bir konuda hemfikir: yazılmadıysa olmamıştır."
      },
      alpha: {
        dos: [
          "Rutinleri basit ve tutarlı tut.",
          "Kısa ve etkileşimli öğrenme anları kullan.",
          "Sakin dikkati ve sıra almayı kendin örnekle.",
          "Merakı güvenli sınırlar içinde teşvik et.",
          "Düzeltmelerini anında ve nazikçe yap."
        ],
        donts: [
          "Sürekli konu değiştirerek aşırı uyarma.",
          "Her şeyi rekabete çevirme.",
          "Öğretirken iğnelemeyi espri yerine koyma.",
          "Molasız uzun odak bekleme.",
          "Sinirlendiğinde duygularını yok sayma."
        ],
        joke: "Beta Kuşağı Alfa'dan yardım ister, Alfa da cümlenin ortasında çektiği bir eğitim videosuyla cevap verir."
      }
    }
  }
};
