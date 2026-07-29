import { useEffect, useState } from "react";
import { AdminPageShell, AdminStatsGrid } from "@/components/admin/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileText,
  Layers,
  Loader2,
  Megaphone,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

// ── Live status metrics (from get_rebuild_status_report RPC) ──────────────────
interface StatusReport {
  generated_at: string;
  roles_total: number;
  roles_active: number;
  legacy_roles: number;
  afs_attributes: number;
  afs_features: number;
  afs_sections: number;
  role_attributes: number;
  role_features: number;
  role_sections: number;
  catalog_items_total: number;
  placeholders: number;
  item_role_links: number;
  items_without_primary_role: number;
  legacy_tables_remaining: number;
  family_columns_remaining: number;
  old_table_names_remaining: number;
}

// Expected targets for the rebuild (used to color metrics green/red).
// roles_total pasif rolleri de sayar (satır silinmez); roles_active 2026-06-11
// User_Standard konsolidasyonundan beri 75'tir.
const TARGETS = {
  roles_total: 76,
  roles_active: 75,
  legacy_roles: 0,
  afs_attributes: 53,
  afs_features: 42,
  afs_sections: 7,
  placeholders: 76,
  legacy_tables_remaining: 0,
  family_columns_remaining: 0,
  old_table_names_remaining: 0,
} as const;

// ── Son güncellemeler (günlük dille, en yenisi üstte) ─────────────────────────
interface UpdateNote {
  date: string;
  title: string;
  lines: string[];
}

const UPDATES: UpdateNote[] = [
  {
    date: "29 Temmuz 2026",
    title:
      "Sessiz arıza yakalandı: siteden gelen form başvurularının bildirim maili bir süredir hiç gönderilmiyormuş",
    lines: [
      "Bildirim sistemini kurarken tesadüfen ortaya çıktı. Mail gönderen servislerimizin çalışabilmesi için mail sağlayıcımızın anahtarının 'sunucu tarafına' ayrıca tanımlanmış olması gerekiyor. Kontrol edildi: bu anahtar orada hiç yokmuş.",
      "Sonucu şu: /form sayfasından biri başvuru yaptığında bize gelmesi gereken 'yeni başvuru var' maili gönderilmiyormuş. Üstelik sistem hata da vermiyormuş — başvuruyu sessizce kaydedip 'tamam' diyormuş. Bu yüzden bugüne kadar kimse fark etmemiş.",
      "ÖNEMLİ: Başvurular KAYBOLMADI. Hepsi veritabanında duruyor ve admin panelinden görülebiliyor; eksik olan yalnızca 'yeni başvuru geldi' uyarı maili.",
      "Eksik anahtarlar bugün tanımlandı. Yeni bildirim sistemi artık sağlıklı çalışıyor, ancak form başvuru mailinin de düzeldiği bir test başvurusuyla henüz DOĞRULANMADI — sıradaki iş bu.",
      "Ne kadar süredir gitmediği de bilinmiyor. Geçmiş başvuruların kayıtlarına bakılarak çıkarılabilir.",
    ],
  },
  {
    date: "29 Temmuz 2026",
    title:
      "Yeni üye kaydı da artık mail olarak gelebiliyor — ve iki bildirimi de panelden açıp kapatabiliyorsun",
    lines: [
      "Bugüne kadar yalnızca 'admin güncellemeleri' maili vardı; o da kodun içine gömülü 3 sabit adrese gidiyordu, sadece geliştirici bilgisayarından commit atılınca çalışıyordu ve aynı güne birden fazla kayıt girildiğinde yalnızca en üsttekini yolluyordu.",
      "Artık iki ayrı bildirim var: (1) siteye yeni bir üye kaydolup e-postasını doğruladığında, (2) buraya yeni bir güncelleme kaydı girildiğinde. İkisi de e-posta olarak gidiyor.",
      "Yeni sayfa: Sistem > Bildirim Ayarları. Burada iki tür bildirimin GENEL anahtarı (tüm platform için aç/kapa — yalnız admin) ve KİŞİSEL aboneliğin (sadece senin hesabın için — 'yeni üye kaydolduğunda bana mail gelsin' / 'yeni güncelleme yayınlandığında bana mail gelsin') ayrı ayrı yönetiliyor. Aynı sayfada son 20 gönderimin durumu ve alıcı sayısı da görünüyor.",
      "Kimin mail alacağı artık koddan değil, herkesin kendi tercihinden belirleniyor. Yetkisi alınan bir yönetici, tercihi açık kalsa bile mail almayı otomatik olarak durduruyor.",
      "Güvenlik notu: genel anahtarların ikisi de KAPALI başlıyor. Bildirimler ancak bir admin bu sayfadan anahtarı açtıktan sonra akmaya başlar.",
      "Durum: veritabanı değişikliği canlıya UYGULANDI, mail gönderen servis yayına alındı ve uçtan uca test edildi — çalıştığı doğrulandı. Kod da ana koda alındı. Geriye yalnız sitenin yeni sürümünün yayınlanması (deploy) kaldı; ondan sonra sayfa ve üst çubuktaki zarf ikonu panelde görünür olacak.",
      "Güvenlik gereği iki genel anahtar da KAPALI durumda duruyor. Yani deploy sonrası sen açana kadar kimseye tek bir mail bile gitmiyor.",
    ],
  },
  {
    date: "29 Temmuz 2026",
    title:
      "Taşınma araçlarının sonuç ekranındaki butonlar düzeltildi: eşit boyutlu 2×2 ızgara + çalışmayanlara 'Yakında' rozeti",
    lines: [
      "Bir aracı çözüp sonuç ekranına geldiğinde alttaki yönlendirme butonları farklı farklı boyutlardaydı; etiketi uzun olan buton kocaman, kısa olan minicik görünüyordu. Artık hepsi 2 sütunlu bir ızgarada, birbirine eşit genişlik ve yükseklikte duruyor — en uzun etiket hepsini birlikte büyütüyor.",
      "Daha önemlisi: bu butonların bir kısmı aslında var olmayan sayfalara götürüyordu, yani tıklayan kullanıcı boş ekranla karşılaşıyordu. Şimdi bunlar 'Yakında' rozetiyle ve tıklanamaz halde gösteriliyor — kullanıcı neyin hazır olmadığını görüyor, hataya düşmüyor.",
      "Sonuç ekranına ayrıca 'Tekrar Çöz' butonu eklendi; o her zaman aktif ve rozetsiz.",
      "Hedef sayfalar yayına girdiğinde tek yapılacak iş rozetleri kaldırmak — buton düzeni hazır bekliyor.",
      "Durum: bu iş henüz ana koda alınmadı, geliştirici bilgisayarında duruyor.",
    ],
  },
  {
    date: "29 Temmuz 2026",
    title:
      "Sosyal paylaşım deposunda 'sütun bulunamadı' hatası çözüldü — sebebi kayıp bir kurulum kaydıydı",
    lines: [
      "Sosyal paylaşım deposuna ait bir veritabanı güncellemesi canlıda zaten tam olarak uygulanmıştı, ama sistemin 'hangi güncellemeler yapıldı' defterine işlenmemişti. Yani iş bitmişti, kaydı tutulmamıştı.",
      "Bu yüzden güncelleme yapılmamış sanılıp elle tekrar çalıştırıldı ve hata verdi: silinmiş bir sütunu arıyordu. Ekranda 'column item_tab does not exist' yazıyordu.",
      "Düzeltme: güncelleme dosyası artık önce 'bu adım daha önce yapılmış mı' diye kontrol ediyor, yapılmışsa atlıyor. Yani ikinci kez çalıştırılsa bile hata vermiyor. Eksik defter kaydı da canlıya elle eklendi.",
      "Bilinmesi gereken kural: bir tablo ya da sütunun canlıda var olması, o güncellemenin deftere işlendiği anlamına gelmiyor. İkisi ayrı ayrı kontrol edilmeli.",
    ],
  },
  {
    date: "28 Temmuz 2026",
    title:
      "Muhasebe modülüne yıllık 'Bütçe' sekmesi geliyor — tasarımı, planı ve kodunun büyük bölümü bugün hazırlandı",
    lines: [
      "Amaç: departman departman (ör. yazılım, pazarlama) 12 aylık gider bütçesini, gelir beklentisini ve ikisinin birleştiği nakit akışını tek ekrandan planlayabilmek. Ekranın üstünde 'eldeki para bu gidişle kaç ay yeter' özeti (runway) yer alıyor.",
      "Bugün önce bir tasarım dokümanı, ardından adım adım uygulama planı yazıldı. Sonra kodun temel katmanları çıkarıldı: veritabanı tablosu, hesaplama mantığı (aylık toplamlar, bakiye, runway), Supabase bağlantısı, veri çekme kancaları, yazarken kendiliğinden kaydeden otomatik kayıt mekanizması, üç ana panel (Departman Bütçesi, Gelirler, Konsolide Nakit Akışı) ve CSV olarak dışa aktarma. Her parça için testleri de yazıldı.",
      "Durum: bu iş ayrı bir çalışma dalında duruyor. Henüz ana koda alınmadı, admin menüsüne 'Bütçe' sekmesi olarak bağlanmadı ve veritabanı değişikliği canlıya UYGULANMADI — yani panelde şu an görünmüyor. Bir sonraki adım: sekmeyi menüye bağlamak, ana koda birleştirmek ve veritabanı değişikliğini canlıya almak.",
    ],
  },
  {
    date: "28 Temmuz 2026",
    title:
      "Google '236 sayfayı keşfettim ama indekslemedim' diyordu — sebebi bulundu, site haritası gerçek içeriğe indirildi",
    lines: [
      "Google Search Console 236 sayfa için 'Keşfedildi – şu anda dizine eklenmedi' uyarısı veriyordu. Kök neden bulundu: Google'a bildirdiğimiz sayfa listesinde (sitemap) gerçek profillerin yanında ~205 adet içi boş 'rol şablonu' kaydı ve 'hakkında' metni boş üye profilleri de vardı. Google bu içi boş sayfaları düşük değerli görüp, gerçek profillere ayıracağı tarama kaynağını onlara harcıyordu.",
      "Düzeltme: listeye artık yalnızca yayınlanmış, herkese açık, şablon olmayan ve 'hakkında' metni dolu profiller giriyor. Liste 312 adresten 107 adrese indi; katalog profili sayısı ~225'ten 20 gerçek profile düştü.",
      "Bilinmesi gereken kural: bir üye/kurum profilinin Google'a bildirilen listeye girebilmesi için 'hakkında' (uzun açıklama) metninin dolu olması gerekiyor. Bu alan boş bırakılırsa profil yayında olsa bile listeye hiç girmiyor — profil sahiplerinden bu metni istemekte fayda var.",
      "Değişiklik ana koda alındı. Google'ın görebilmesi için bir sonraki yayın (deploy) ve ardından Search Console'dan site haritasının yeniden gönderilmesi gerekiyor.",
    ],
  },
  {
    date: "28 Temmuz 2026",
    title:
      "Google'ın '16 araç sayfası noindex ile hariç tutuldu' uyarısı incelendi: hata değil, bilinçli tercih",
    lines: [
      "Search Console 25 Temmuz'dan beri 16 taşınma aracı sayfasını (ör. /tools/sehir-eslestirme) 'noindex etiketiyle hariç tutuldu' diye raporluyor. İncelendi: bu bir hata değil. Araç sayfaları üyelere özel olduğu için giriş yapmamış bir ziyaretçi — ve Google — o adreste giriş ekranını görüyor; giriş ekranının arama motorlarına 'beni dizine ekleme' demesi de zaten doğru davranış.",
      "Karar: araçlar üyeye özel kalıyor, giriş duvarı yerinde duruyor. Aramada görünürlük /tools ana sayfası üzerinden sağlanıyor — o sayfa herkese açık, dizine eklenebiliyor ve 17 aracın tamamının başlığını ve özetini gösteriyor.",
      "ÖNEMLİ: Search Console'da bu rapordaki 'Doğrulamayı başlat / Sorun giderildi mi?' düğmesine BASILMAMALI. O düğme Google'dan 'noindex kalkmış mı' diye kontrol etmesini ister; sayfalar bilerek öyle kaldığı için doğrulama başarısız olur ve rapor geri döner. Aynı şekilde robots.txt ile engellemek de durumu daha kötü hale getirir. Bu rapor bilgi amaçlıdır, zaman zaman tekrar görünmesi normaldir.",
      "İleriye not: 5 adet Almanya hesaplayıcısı (maaş, vize vb.) tamamen tarayıcı içinde çalışıyor; istenirse bunları herkese açmak, veritabanına dokunmadan yapılabilecek en ucuz SEO kazancı olarak masada duruyor. Şimdilik kapsam dışı bırakıldı.",
      "Karar ve gerekçeleri docs/audits/2026-07-28-tools-noindex-karari.md dosyasına yazıldı.",
    ],
  },
  {
    date: "28 Temmuz 2026",
    title:
      "Sosyal Medya Paylaşım Deposu'nun görsel envanteri çıkarıldı: 100 kartın 70'i hâlâ görselsiz",
    lines: [
      "Canlı veritabanı tek tek sorgulanıp hangi kartta görsel var hangisinde yok listelendi: 100 karttan 30'unda görsel var, 70'i tamamen boş.",
      "İyi haber: panelin ilk 12 sırası (BURAK BURAYA BAK kartları) neredeyse tamamlanmış durumda; eksik olan yalnızca birkaç çok varyantlı kartın ek varyantı (ör. item-98'in 3. varyantı).",
      "Bekleyen kısım 13–100 arası: Test Araçları, Diaspora Postları ve Araç Tanıtımları kartlarının neredeyse tamamı hâlâ görsel bekliyor.",
      "Küçük bir uyumsuzluk not edildi: repo klasöründe 34 karta ait 74 dosya varken veritabanında 30 kart görünüyor — yani klasöre eklenmiş ama henüz panele işlenmemiş birkaç dosya olabilir; ayrıca kontrol edilip yüklenecek.",
      "Hangi kartın eksik olduğunun tam listesi docs/social-share-outputs/eksik-gorsel-raporu-2026-07-28.md dosyasında.",
    ],
  },
  {
    date: "23 Temmuz 2026",
    title: "İkinci profil talebi (admin onaylı) için tasarım, uygulama planı ve veritabanı altyapısı hazırlandı",
    lines: [
      "Bir kullanıcının mevcut profiline dokunmadan, admin onayıyla başka bir rol için ikinci bir profil açabilmesi talebi için önce bir tasarım dokümanı, ardından ayrıntılı bir uygulama planı yazıldı.",
      "Veritabanı tarafında, mevcut onay kuyruğuna (approval_requests) 'new_profile' adında yeni bir talep türü eklendi ve request_new_catalog_item adlı yeni bir güvenli RPC yazıldı — mevcut submit_role_change_request deseninin bir kopyası, tek fark kullanıcının bugünkü rolüne dokunmaması.",
      "Bu iş ayrı bir çalışma dalında hazırlandı; migration henüz canlı veritabanına uygulanmadı ve arayüz tarafı henüz yazılmadı — sadece temel/plan hazır.",
    ],
  },
  {
    date: "23 Temmuz 2026",
    title: "Burak'ın paylaşım görselleri için numaralandırma şeması güçlendirildi, eski görseller yedeklendi",
    lines: [
      "docs/social-share-outputs/ altındaki bazı araçlar için dosya adlandırma şeması, sırayı/varyantı/prompt numarasını daha net kodlayan 3 haneli bir düzene güncellendi.",
      "Eski 2 haneli isimlendirmeyle yüklenmiş görseller silinmeden docs/backup/ altına referans yedek olarak taşındı — docs/social-share-outputs/ artık tek doğru kaynak, dosya bir daha silinmeyecek, sadece eklenecek.",
      "İlgili sosyal paylaşım veritabanı kayıtları yeni şemaya göre güncellenip canlıda doğrulandı.",
    ],
  },
  {
    date: "21 Temmuz 2026",
    title: "Google'ın sitemizi neden bazı sayfalarda indekslemediği araştırıldı: çoğu aslında sorun değilmiş, bir gerçek eksik bulunup düzeltildi",
    lines: [
      "Google Search Console'daki 4 farklı 'indekslenmedi' raporu tek tek incelendi. İkisi aslında sorun değil, Google'ın doğru çalıştığının kanıtı: bir sayfa başka bir sayfaya yönleniyorsa veya doğru bir canonical etiketi başka bir adrese işaret ediyorsa, Google bunu bilerek indekslemiyor — bu istenen davranış.",
      "Gerçek bir eksik bulundu: /addwa adresi şimdiye kadar yalnızca tarayıcı içinde (JavaScript ile) başka bir sayfaya yönlendiriliyordu, sunucu seviyesinde gerçek bir yönlendirme (HTTP 301) yoktu. Artık sunucu da bu adresi doğrudan 301 ile doğru sayfaya yönlendiriyor.",
      "13 sayfanın (ör. /iletisim, /kariyer, /anket, yasal sayfalar) Google tarafından henüz hiç ziyaret edilmediği görüldü — hepsi zaten site haritasında yer alıyor, kodda eksik bir şey yok; zamanla ya da Search Console'dan tek tek 'dizine ekleme' istenerek çözülür.",
      "Daha önemli bir bulgu: eski mvp.corteqs.net adresi hâlâ canlı ve aynı siteyi yönlendirmeden gösteriyor. Bunu çözecek kod aslında zaten yazılmış (server.mjs), ama canlıda mvp.corteqs.net bu kodu çalıştırmıyor gibi görünüyor — bir kod eksikliği değil, bir sunucu/deploy (Coolify) konusu.",
    ],
  },
  {
    date: "21 Temmuz 2026",
    title: "Sosyal Medya Paylaşım Deposu'nda görsellerin yanlış karta düşme sorunu kökten çözüldü",
    lines: [
      "Bir kartın görseli olduğu halde görselsiz göründüğü fark edildi (ör. 'Annenin sesi' diaspora postu) — kök neden bulundu: eski yükleme script'i, BURAK BURAYA BAK sekmesinin kendi 1-12 numaralandırmasını diğer sekmelerin numaralandırmasıyla karıştırıp bazı görselleri yanlış karta yazmıştı.",
      "Kalıcı çözüm: kartların hangi sekmeden geldiği artık veritabanı kimliğinin bir parçası değil. Her kalem, sekmeden bağımsız, hiç değişmeyen tek bir numara taşıyor (item-1'den item-100'e) — bu sayede aynı karışıklık bir daha oluşamaz.",
      "Bunun sonucunda sayfanın üstündeki filtre butonları (Tümü/Araç Tanıtımları/Diaspora/Test/Burak) kaldırıldı; artık tüm kalemler karışık ama sabit bir sırada tek liste halinde görünüyor.",
      "Mevcut 16 görsel + 16 ek görsel + 1 paylaşım notu yeni numaralandırmaya taşındı, canlı veritabanında doğrulandı — hiçbir görsel veya not kaybolmadı. Kalan ~84 kartın görseli henüz gelmedi.",
    ],
  },
  {
    date: "21 Temmuz 2026",
    title: "Haber Radarı'ndaki haberler artık görselsiz kalmıyor (aynı gün içinde bir yanlış bağlantı da düzeltildi)",
    lines: [
      "Haber Radarı'nda onaylanan bazı haberler görselsiz ya da renkli bir placeholder ile görünüyordu, çünkü dış kaynaktan görsel çekmek bilinçli olarak kapalı. Artık böyle durumlarda önceden hazırlanmış bir görsel havuzundan sabit bir görsel otomatik atanıyor.",
      "İlk yazılan haliyle bu havuz yanlışlıkla Hizmet Bulucu'daki mekan kayıtlarına da bağlanmıştı; sadece Haber Radarı için istenmesi üzerine bu bağlantı aynı gün içinde geri alındı — mekan için eklenen 50 görsel havuzdan silindi, veritabanı bir daha yanlışlıkla açılamayacak şekilde kilitlendi. Hiçbir mekan kaydı bu görselle canlıya çıkmamıştı, geri alma tamamen risksiz oldu.",
    ],
  },
  {
    date: "21 Temmuz 2026",
    title: "Hizmet Bulucu'nun 0 aday üretme sorunu bulundu ve düzeltildi",
    lines: [
      "Bir deneme taramasında 34 kaynak incelendi ama tek bir aday bile üretilmedi. Sebep bulundu: yapay zeka bazen izin verilenden (6) fazla alıntı döndürüyordu ve bu tek fazlalık, adayın tamamen elenmesine yol açıyordu.",
      "Artık fazla alıntı yüzünden aday tamamen silinmiyor — sadece fazla alıntılar izin verilen sayıya kırpılıp aday korunuyor. Veri kalitesi için 6 alıntı sınırı kaldırılmadı, sadece elenme yerine kırpma tercih edildi.",
    ],
  },
  {
    date: "20 Temmuz 2026",
    title: "Burak'ın 32 görseli canlıya yüklendi; bir yükleme hatası tespit edilip düzeltildi; haber tarayıcı elle tetiklenebilir hale getirildi",
    lines: [
      "Daha önce sadece koda hazır bekleyen görsel yükleme script'i bugün gerçekten canlı veritabanına karşı çalıştırıldı: 32 görselin tamamı (14 değil, sayı 32'ye çıkmıştı) doğru araç/varyant/prompt slotuna, 'burak-share' Storage deposuna ve ilgili tablolara başarıyla yüklendi. Artık BURAK BURAYA BAK bölümündeki ilgili kartların altında bu görseller görünüyor.",
      "İlk çalıştırmada script'in 'tekrar çalıştırınca aynı görseli iki kez ekleme' korumasında gerçek bir hata bulundu: ek görseller doğru tanınamıyordu, test sırasında bazı görseller yanlışlıkla 2-3 kez eklendi (18 fazladan kayıt). Fazlalıklar tespit edilip her slotta en eski kayıt tutularak temizlendi — hiçbir görsel kaybolmadı. Script'teki hata kalıcı olarak düzeltildi ve canlıda tekrar test edilerek artık güvenle tekrar tekrar çalıştırılabildiği doğrulandı.",
      "Haber Radarı'nın arka plandaki tarama işlemini istenildiğinde elle tetikleyebilmek için bir erişim anahtarı yeniden oluşturulup kaydedildi; test taramasında 6 kaynaktan 65 yeni haber bulunup kuyruğa eklendi.",
      "Ayrıca proje için kullanılan bir yapay zeka servis anahtarı (Gemini) ve Supabase yönetim erişim anahtarı güncellendi — eskisi süresi dolmuş/geçersiz durumdaydı.",
    ],
  },
  {
    date: "20 Temmuz 2026",
    title: "Burak'ın 14 görseli otomatik yükleme script'i yazıldı ve idempotency hatası giderildi",
    lines: [
      "Bir önceki kayıtta sadece hazırlık aşamasında olan toplu yükleme script'i (scripts/seed-burak-share-images.mjs) bugün gerçekten yazıldı: 14 görseli dosya adından çözüp doğru araç/varyant/prompt slotuna, Supabase Storage'a ve ilgili tablolara otomatik yüklüyor.",
      "Dosya adı çözücüde bir kenar durumu hatası düzeltildi: 2 haneli araç sırası ile açık varyant hanesi karışabiliyordu; artık açık varyant hanesi öncelikli okunuyor.",
      "Script'i tekrar çalıştırınca aynı görseli iki kez eklemesi gereken idempotency kontrolünde hata bulunup düzeltildi (dosya yolu karşılaştırması eksikti) — script artık güvenle birden fazla kez çalıştırılabilir.",
      "Script'in canlı veritabanına karşı gerçek çalıştırılması bu adımda yapılmadı — sadece kod yazıldı ve testlerle doğrulandı.",
    ],
  },
  {
    date: "20 Temmuz 2026",
    title: "BURAK BURAYA BAK bölümü için 14 görsel repoya eklendi + otomatik yükleme script'inin altyapısı hazırlandı",
    lines: [
      "Burak'ın hazırladığı 14 ChatGPT görseli (dosya adı olarak hangi araç/varyant/prompt'a ait olduğunu kodlayan sayısal isimlerle) depoya eklendi. Görseller henüz veritabanına/admin paneline yüklenmedi — sadece kaynak dosyalar hazır bekliyor.",
      "Sayısal dosya adlarını (araç, varyant, prompt numarası) otomatik çözen bir yardımcı fonksiyon (parseBurakImageFilename) yazıldı ve 12 senaryoyla test edildi. Bu, bir sonraki adımda yazılacak toplu yükleme script'inin temeli.",
      "14 görseli Supabase Storage'a ve ilgili tablolara otomatik işleyecek script için ayrıntılı bir uygulama planı hazırlandı — script'in kendisi henüz yazılmadı, bu tamamen hazırlık aşaması. Kullanıcıya görünen bir değişiklik yok, deploy gerekmiyor.",
    ],
  },
  {
    date: "20 Temmuz 2026",
    title: "Sosyal Medya Paylaşım Deposu'na birden fazla görsel desteği geldi + kartlar kompaktlaştı",
    lines: [
      "Her kalem/varyanta artık kapak görselinin yanına sınırsız sayıda ek görsel eklenebiliyor (küçük resim galerisi, tek tek silinebilir). Yeni social_share_asset_images tablosu canlıda oluşturuldu ve doğrulandı; mevcut tekli kapak görseli sistemiyle birlikte çalışıyor.",
      "Görsel eklendiği artık çok daha belirgin: akordeon kapalıyken bile başlıkta yeşil '🖼️ N' rozeti görünüyor; açık kartta 'Görsel'/'Video' butonları medya varsa dolu yeşile dönüyor ve sayı gösteriyor.",
      "Görsel Promptu kutuları tek satıra indirildi (kompakt kart), dosya adı etiketi sadeleştirildi (ör. '52', '521').",
      "tsc/ESLint temiz, migration canlıda doğrulandı. Sitede görünmesi için bir sonraki yayın (deploy) gerekiyor.",
    ],
  },
  {
    date: "20 Temmuz 2026",
    title: "Sosyal paylaşım görsel promptları insan-merkezli sembolik illüstrasyon tarzına çevrildi + kartlara dosya adı etiketi eklendi",
    lines: [
      "Sosyal Medya Paylaşım Deposu'ndaki (/admin/social-share-vault) 4 kaynağın (Araç Tanıtımları, Diaspora, Test Araçları, Burak — 100 kalem, 288 görsel promptu) tamamı ultra-fotogerçekçi tarzdan yeni bir görsel dile çevrildi: insan figürü kompozisyonun merkezinde, etrafında sahneyi anlatan basit sembolik ikonlar bir hâle düzeninde. LinkedIn/Instagram metinleri değişmedi.",
      "Kanonik referans dosyası (docs/social-share-outputs/prompt-katalogu.html) yeni promptlarla senkronlandı. Her 'Görsel Promptu' kartına, üretilen görselin kaydedileceği gerçek dosya adını gösteren küçük bir etiket eklendi (ör. tool-1_p1.png).",
      "Aynı 4 kaynaktaki 144 Reddit postunun sonuna WhatsApp topluluk linki ve https://corteqs.net/tools eklendi — mevcut kısa link satırı korunarak.",
      "tsc/ESLint/UTF-8 metin denetimi/production build temiz. Sitede görünmesi için bir sonraki yayın (deploy) gerekiyor.",
    ],
  },
  {
    date: "19 Temmuz 2026",
    title: "Revizyon İstekleri listesindeki 51 madde tek tek gözden geçirildi: 10 tanesi kapatıldı",
    lines: [
      "/admin/revision-requests sayfasındaki 51 açık madde (12 Haziran + 17-18 Temmuz listeleri) kod üzerinden tek tek kontrol edildi: hâlâ geçerli mi, zaten çözülmüş mü, yoksa artık var olmayan bir ekrana mı ait.",
      "6 madde 'Yapıldı' işaretlendi — kodda zaten karşılanmışlardı: Cadde paylaşım etiketi, Hoşgeldin Paketi formu, 'Ağın 6 Katmanı' başlığı, kategori sıralaması, ana sayfa 'Şehir Elçileri' kartının doğru filtreye gitmesi, Çarşı boş-kategori metni.",
      "4 madde 'İptal' işaretlendi — 18 Haziran'da değişen eski ana sayfa tasarımına (Index.tsx/DiasporaSearchBar) aitlerdi ve yeni ana sayfada (LandingTrialPage) o ekranlar artık yok: eski Şehir Elçisi arama bug'ı, Taşınma Motoru yönlendirme bug'ı, '8 Kıta' metni, HERO klişesi.",
      "Kalan 34 madde hâlâ açık ve geçerli olarak doğrulandı (Cadde kafe kapasitesi, kafe tema alanı, WhatsApp geri bildirim linki, foto/video paylaşım eksikliği vb.); 7 madde görsel/manuel test gerektirdiği için şimdilik değerlendirilemedi. Bu iş sadece veritabanı durumunu güncelledi, deploy gerekmiyor.",
    ],
  },
  {
    date: "19 Temmuz 2026",
    title: "Brainstorming sayfası tek sütun akışa döndü + build'i kıran iki hata giderildi",
    lines: [
      "/admin/brainstorming sayfasındaki ayrı sol bölüm seçim paneli kaldırıldı; artık her bölüm başlığı, konu satırları ve yorum akışı eski /statusreport3006 sayfasındaki gibi tek sütunda art arda akıyor. Sıralama/düzenleme/silme/yorum aksiyonları aynen çalışıyor. Akordeon kartların kapalı başlaması gerektiği netleştirildi (kod doğruydu, canlıda eski build çalıştığı için görünmüyordu — yeni bir yayın tetiklendi).",
      "Build'i her seferinde başarısız kılan iki teknik sorun düzeltildi: Türkçe metin denetimi docs/reference-clones/ altındaki dondurulmuş üçüncü parti kodu tarayıp Almanca karakterleri mojibake sanıyordu (artık taramanın dışında); görsel optimizasyon eklentisi eksik svgo paketi yüzünden hata basıyordu (bağımlılık eklendi). Kullanıcıya görünen bir değişiklik yok, build'ler artık güvenilir tamamlanıyor.",
    ],
  },
  {
    date: "18 Temmuz 2026",
    title: "Sosyal paylaşım görsel prompt kataloğu CorteQS'e özel içerikle güncellendi, mükerrer dosyalar temizlendi",
    lines: [
      "docs/social-share-outputs/prompt-katalogu.html içindeki 288 görsel promptunun tamamı CorteQS terminolojisiyle (Dizin, AI Eşleştirme, Cadde, Çarşı, diaspora ağı vb.) yeniden yazılmış sürümle değiştirildi — dosya adları ve repo eşleştirme düzeni korundu.",
      "Mükerrer/eskimiş dosyalar kaldırıldı: docs/corteqs-repo-uyumlu-prompt-katalogu.html (artık aynı içerikti) ve içeriği zaten /admin/revision-requests'e taşınmış docs/MVP DÜZELTMELER TEXT.docx + .xlsx kaynak dosyaları. Kod/veritabanı etkilenmedi, sadece depo hijyeni.",
    ],
  },
  {
    date: "18 Temmuz 2026",
    title: "Sosyal Medya Paylaşım Deposu 100 kaleme çıktı: günlük tarih etiketi, günlük karışan sıra, tek sütun kart",
    lines: [
      "Kalem sayısı 82'den 100'e çıktı — Diaspora Postları bölümüne 18 yeni post eklendi (site özellikleri: Cadde/Çarşı/Radar/Blog/Referans + genel diaspora konuları: ikinci kuşak, uzaktan çalışma, yalnızlık, dil kaybı, öğrencilik, mentorluk, kadın dayanışması, ambasadörlük). Toplam: 10 Araç Tanıtımı + 68 Diaspora + 10 Test + 12 Burak = 100.",
      "Her kartın başlığına 20 Temmuz'dan başlayan sabit bir tarih rozeti eklendi (20 Tem, 21 Tem...) — kartın listedeki sabit sırasına göre atanıyor, filtre/sıralamadan etkilenmiyor. Kartların görünüm sırası ise artık günlük olarak karışıyor: aynı gün F5'te herkes aynı sırayı görüyor, ertesi gün sıra değişiyor.",
      "Kart açıldığında içindeki kutular (Görsel Promptu, LinkedIn, Instagram, Reddit) artık 2 sütun yerine tek sütun/tek satır halinde diziliyor — dört bölümün (Araç Tanıtımları, Diaspora, Test, Burak) hepsinde geçerli, ortak bileşen kullanıldığı için. Veritabanı değişikliği gerekmedi.",
    ],
  },
  {
    date: "18 Temmuz 2026",
    title: "Sosyal Medya Paylaşım Deposu'na Reddit postu eklendi + görsel/video yükleme artık dört bölümde de var",
    lines: [
      "82 kalemin (Araç Tanıtımları/Diaspora/Test/Burak) her varyantına LinkedIn ve Instagram'ın yanına üçüncü bir hazır metin eklendi: Reddit postu (soru/tartışma tonu, hashtag yok, çıplak link). 'Tüm Reddit Postları' toplu kopyalama butonu da eklendi.",
      "Görsel/video yükleme özelliği önceden yalnızca 'Burak' bölümündeydi; artık dört bölümün de her varyantında küçük Görsel/Video butonlarıyla açılıp kapanan bir panel olarak var. Aynı ortak depo/tablo kullanılıyor, veritabanı değişikliği gerekmedi.",
      "'Tümü' filtresinde kartlar 1'den 82'ye sürekli numaralanıyor; bir bölüme filtrelenince o bölümün kendi sırasına dönüyor. Kaynak filtresinin altına bölüme özel kategori/tema alt filtreleri eklendi (Araç Tanıtımları'nda Keşfet/Bağlan/Kullan/Koru, Diaspora'da 26 tema).",
    ],
  },
  {
    date: "18 Temmuz 2026",
    title: "Sosyal Medya Paylaşım Deposu'nda Canva kaldırıldı, yerine ChatGPT promptu + Instagram postu geldi",
    lines: [
      "82 kalemin her varyantındaki eski Canva görsel promptları kaldırıldı; yerine ChatGPT'ye doğrudan yapıştırılabilecek 2 İngilizce görsel promptu geldi (kare format, tutarlı görsel kimlik, görselde yazı/logo yok).",
      "Her varyanta ayrıca LinkedIn'in yanına Instagram'a özgü kendi üslubuyla yazılmış bir Instagram postu eklendi. Toplu kopyalama butonları buna göre güncellendi.",
    ],
  },
  {
    date: "18 Temmuz 2026",
    title: "Sosyal Medya Paylaşım Deposu'ndaki 4 sekme kaldırıldı, tek liste oldu + Burak'ın bölümüne de paylaşım rozetleri geldi",
    lines: [
      "Admin panelindeki Sosyal Medya Paylaşım Deposu (/admin/social-share-vault) sayfasında daha önce ayrı sekmeler halinde duran dört bölüm (Araç Tanıtımları, Diaspora Postları, Test Araçları, BURAK BURAYA BAK) artık sekmesiz — tek sayfada, başlıklarıyla art arda sıralı tek liste halinde görünüyor. Toplu kopyalama butonları da artık tüm bölümlerdeki kalemleri birden kapsıyor.",
      "Diğer üç bölümde zaten var olan LinkedIn / Instagram / Reddit / X / Facebook / Threads paylaşım durumu rozetleri artık Burak'ın bölümündeki 12 araç için de görünüyor. Migration canlı veritabanına uygulandı ve doğrulandı.",
    ],
  },
  {
    date: "18 Temmuz 2026",
    title: "Depo temizliği: otomatik üretilen 36 görsel + kullanılmayan referans klonlar kaldırıldı",
    lines: [
      "LinkedIn için otomatik üretilen 36 tanıtım görseli (12 araç × 3 varyant) artık git deposunda tutulmuyor — npm run social:generate ile istendiğinde yeniden üretilebiliyor. Admin panelindeki otomatik görsel önizlemesi etkilenmedi.",
      "Geliştirme sürecinde referans amaçlı klonlanmış üç eski proje klasörü (ref/, ref101/, reference/) kökten docs/reference-clones/ altına taşındı. Bu bir kod/özellik değişikliği değil, tamamen depo hijyeni — kullanıcı tarafında görünür fark yok.",
    ],
  },
  {
    date: "18 Temmuz 2026",
    title: "MVP Revizyon Listesi'ndeki 51 madde artık /admin/revision-requests içinde",
    lines: [
      "Excel ve Word dosyalarında biriken 51 revizyon/düzeltme notu tek tek Revizyon İstekleri sayfasına (/admin/revision-requests) kayıt olarak eklendi. Her madde kendi bölüm etiketiyle (HERO, CADDE, RADAR, ARAÇLAR vb.) geldi; hepsi 'Açık' durumda başlıyor.",
      "Mevcut Revizyon İstekleri sisteminin üzerine veri eklemekten ibaret — sayfa, formlar, yorum thread'i ve görsel ekleme özelliği zaten vardı, yeni kod yazılmadı.",
      "Sonradan yapılan kontrolde kaynak dosyalardaki 5 ekran görüntüsünden 4'ü, ilk seed'de atlanmış olduğu için ilgili maddelere sonradan eklendi (Süper Admin arama bug'ı + Cadde paylaşım formu görselleri).",
    ],
  },
  {
    date: "18 Temmuz 2026",
    title: "Dünya Kupası kampanyası tamamen kaldırıldı",
    lines: [
      "Kampanya sona erdi: /dunya-kupasi, /dunya-kupasi/kayit ve /admin/dunya-kupasi sayfaları, ilgili worldcup_* RPC'leri, world_cup_registrations/world_cup_campaign_settings tabloları ve world-cup-images bucket'ı silindi.",
      "Kampanyaya özel 3 mekân rolü (Bar/Pub, Çay Bahçesi, Nargile) deaktif edildi; canlıdaki tek onaylı kayıt yönetici test hesabına aitti (rol ataması yapılmamıştı), gerçek kullanıcı etkisi olmadı.",
    ],
  },
  {
    date: "11 Haziran 2026",
    title: "Dünya Kupası işletme kampanyası açıldı",
    lines: [
      "Maç yayını yapan işletmeler için geçici bir kampanya başlattık: işletme /dunya-kupasi/kayit sayfasından Google veya e-posta hesabıyla başvuru bırakıyor.",
      "Başvurular /admin/dunya-kupasi panelinde toplanıyor (sol menüde “Dünya Kupası”). Onayla'ya bastığınızda kullanıcının hesabı seçtiği işletme kategorisiyle otomatik olarak işletme profiline dönüşüyor ve dizinde işletme olarak görünüyor.",
      "Onaylanan işletmeler herkese açık /dunya-kupasi sayfasında “Maç Yayını” rozetiyle, şehir/ülke filtresiyle listeleniyor — kampanyanın vitrini burası.",
      "Güvenlik: başvuranın mevcut rolü Danışman/Kuruluş gibi farklı bir rolse onay yine çalışır ama rolü değiştirmez; panel sizi uyarır. Admin rollerine asla dokunulmaz.",
      "Kampanya bittiğinde tek ayarla kapatılır (kayıt durur, vitrin boşalır); işletme profilleri platformda kalıcı kalır.",
    ],
  },
  {
    date: "11 Haziran 2026",
    title: "“Standart Kullanıcı” ve “Diaspora Üyesi” rolleri birleştirildi",
    lines: [
      "İki rol kâğıt üstünde ayrı görünse de pratikte birebir aynıydı: aynı yetkiler, aynı profil görünümü, aynı Cadde hakları. İki ayrı isim sadece kafa karıştırıyordu.",
      "Bu yüzden ikisini tek rolde birleştirdik: artık herkes “Diaspora Üyesi”. “Standart Kullanıcı” rolü kapatıldı ve hiçbir ekranda seçilemez.",
      "Eski roldeki az sayıda kayıt (demo üye dahil 2 katalog kaydı) otomatik olarak “Diaspora Üyesi”ne taşındı. Hiçbir üyenin yetkisi veya profili değişmedi.",
      "Yeni üyeler zaten “Diaspora Üyesi” olarak başlıyordu; bu davranış aynen devam ediyor. Aktif rol sayısı 76'dan 75'e indi (kapatılan rolün kaydı geçmişe dönük izlenebilirlik için silinmedi).",
    ],
  },
];

// ── Phase / report summaries (static — mirrors docs/catalog-role-afs-rebuild/00-14) ──
interface ReportSummary {
  id: string;
  title: string;
  summary: string;
}

const REPORTS: ReportSummary[] = [
  { id: "00", title: "Preflight Uzlaştırma", summary: "İki tutarsızlık çözüldü: rol sayısı 82→76 (6 legacy çıkarıldı), attribute '55' başlık hatası → gerçek 53. Push-blocker'lar temizlendi." },
  { id: "01", title: "Mevcut Sistem Denetimi", summary: "~45 tablo, ~100 RPC, 62 trigger, ~80 RLS politikası envanteri. Legacy teardown hedefleri belirlendi." },
  { id: "02", title: "Flat Rol Envanteri", summary: "76 bağımsız flat rol + silinecek 6 legacy rol. Rol ailesi/parent-child YOK." },
  { id: "03", title: "AFS Katalog Envanteri", summary: "53 attribute / 42 feature / 7 section. Normalizasyon-mükerrer çiftleri haritalandı (silinmedi)." },
  { id: "04", title: "Rol↔AFS Matrisi", summary: "Canlı matris %100 uniform: her rol aynı 24 attr / 30 feat / 7 section. Option A ile aynen üretildi." },
  { id: "05", title: "Yeni Veritabanı Tasarımı", summary: "Rename stratejisi: 9 tablo yeni isimlere; family kolonları kaldırıldı; catalog_item_roles eklendi." },
  { id: "06", title: "ER Diyagramı", summary: "CATALOG ITEMS → FLAT ROLES → (Attributes, Features, Sections). Family/parent yok." },
  { id: "07", title: "Backend Entegrasyonu", summary: "44+ DB fonksiyonu rename edilmiş tablolara rewire edildi (010c programatik + 010d/010e elle onarım)." },
  { id: "08", title: "Frontend Entegrasyonu", summary: "Frontend zaten flat çalışıyordu; .from() ve embedded-join referansları yeni isimlere güncellendi; types.ts yenilendi." },
  { id: "09", title: "Admin Menü/Guide/Infogram", summary: "Admin Veritabanı menüsü + new-member guide + infogram family'den arındırıldı, flat'e güncellendi." },
  { id: "10", title: "Legacy Cleanup Manifest", summary: "Drop edilenler: 6 legacy rol, catalog_item_types + item_type_*, role_taxonomy_rules, ilgili FK'lar. Satellite'ler korundu." },
  { id: "11", title: "E2E / Test Raporu", summary: "DB verify PASSED; build PASS; 287/288 unit test geçti (1 alakasız UI-nav fail)." },
  { id: "12", title: "Migration Push", summary: "18 rebuild migration Management API ile prod'a uygulandı. Prod-only FK blocker'ları için 016 iteratif güçlendirildi." },
  { id: "13", title: "Cleanup Grep", summary: "Runtime'da 0 eski tablo ismi + 0 rol-family kavramı. Landing submissions kategorileri bilinçli istisna." },
  { id: "14", title: "Değişen Dosyalar", summary: "19 migration, ~20 src dosyası, infogram, 15 rapor. catalog_items.title & managers.role rename'leri geri alındı." },
];

const MetricCard = ({
  label,
  value,
  target,
  invert = false,
}: {
  label: string;
  value: number | undefined;
  target?: number;
  invert?: boolean;
}) => {
  const ok =
    target === undefined
      ? true
      : invert
        ? value === target
        : value === target;
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-2xl font-bold tabular-nums">
        {value ?? "—"}
        {target !== undefined && (
          <span className="ml-2 text-xs font-normal text-muted-foreground">/ {target}</span>
        )}
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
        {target !== undefined &&
          (ok ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          ))}
        {label}
      </div>
    </div>
  );
};

const AdminDurumRaporuPage = () => {
  const { toast } = useToast();
  const [report, setReport] = useState<StatusReport | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_rebuild_status_report");
      if (error) throw error;
      setReport(data as unknown as StatusReport);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Durum raporu alınamadı";
      toast({ title: "Hata", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allGreen =
    report &&
    report.roles_total === TARGETS.roles_total &&
    report.roles_active === TARGETS.roles_active &&
    report.legacy_roles === 0 &&
    report.afs_attributes === TARGETS.afs_attributes &&
    report.afs_features === TARGETS.afs_features &&
    report.afs_sections === TARGETS.afs_sections &&
    report.placeholders === TARGETS.placeholders &&
    report.legacy_tables_remaining === 0 &&
    report.family_columns_remaining === 0 &&
    report.old_table_names_remaining === 0;

  return (
    <AdminPageShell
      title="Catalog / Flat-Role / AFS Rebuild — Durum Raporu"
      description="Rol ailesi sistemi kaldırıldı; tekil flat roller + AFS (Attributes / Features / Sections) mimarisi canlıda. Aşağıdaki metrikler veritabanından gerçek zamanlı çekilir."
      icon={ShieldCheck}
      accent="emerald"
      actions={
        <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Yenile
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Overall status banner */}
        {report && (
          <Card className={allGreen ? "border-emerald-500/40 bg-emerald-500/5" : "border-amber-500/40 bg-amber-500/5"}>
            <CardContent className="flex items-center gap-3 py-4">
              {allGreen ? (
                <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-8 w-8 shrink-0 text-amber-500" />
              )}
              <div>
                <div className="font-semibold">
                  {allGreen ? "Rebuild doğrulandı — tüm hedefler tutuyor." : "Rebuild uygulandı — bazı hedefler dikkat istiyor."}
                </div>
                <div className="text-sm text-muted-foreground">
                  Son güncelleme:{" "}
                  {report.generated_at ? new Date(report.generated_at).toLocaleString("tr-TR") : "—"}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent updates — plain language changelog for admins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Megaphone className="h-5 w-5" /> Son Güncellemeler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {UPDATES.map((u) => (
              <div key={`${u.date}-${u.title}`} className="rounded-lg border p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {u.date}
                  </Badge>
                  <span className="font-medium">{u.title}</span>
                </div>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {u.lines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Live metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5" /> Canlı Metrikler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AdminStatsGrid columns={4}>
              <MetricCard label="Toplam Rol (pasif dahil)" value={report?.roles_total} target={TARGETS.roles_total} />
              <MetricCard label="Aktif Rol" value={report?.roles_active} target={TARGETS.roles_active} />
              <MetricCard label="Legacy Rol (0 olmalı)" value={report?.legacy_roles} target={0} />
              <MetricCard label="AFS Attribute" value={report?.afs_attributes} target={TARGETS.afs_attributes} />
              <MetricCard label="AFS Feature" value={report?.afs_features} target={TARGETS.afs_features} />
              <MetricCard label="AFS Section" value={report?.afs_sections} target={TARGETS.afs_sections} />
              <MetricCard label="Placeholder Item" value={report?.placeholders} target={TARGETS.placeholders} />
              <MetricCard label="Legacy Tablo (0)" value={report?.legacy_tables_remaining} target={0} />
              <MetricCard label="Family Kolon (0)" value={report?.family_columns_remaining} target={0} />
              <MetricCard label="Eski Tablo İsmi (0)" value={report?.old_table_names_remaining} target={0} />
              <MetricCard label="Rol-Attr Bağlantısı" value={report?.role_attributes} />
              <MetricCard label="Rol-Feature Bağlantısı" value={report?.role_features} />
              <MetricCard label="Rol-Section Bağlantısı" value={report?.role_sections} />
              <MetricCard label="Toplam Item" value={report?.catalog_items_total} />
              <MetricCard label="Item-Rol Bağlantısı" value={report?.item_role_links} />
            </AdminStatsGrid>
          </CardContent>
        </Card>

        {/* Follow-up: items without primary role */}
        {report && report.items_without_primary_role > 0 && (
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5" /> Açık Takip İşi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="font-semibold tabular-nums">{report.items_without_primary_role}</span> gerçek
                katalog kaydının (placeholder olmayan) atanmış bir <strong>primary flat rolü yok</strong>.
              </p>
              <p className="text-muted-foreground">
                Legacy roller silinirken (016), onlara bağlı 127 üye kaydının rol linki koparıldı
                (<code>platform_role_key</code> null'landı, <code>catalog_item_roles</code> legacy bağlantıları temizlendi).
                Bu kayıtlar korundu ancak uygun bir flat role (örn. <code>User_DiasporaMember</code>) yeniden bağlanmalı.
                Detay: <code>docs/catalog-role-afs-rebuild/12-migration-push-report.md §5</code>.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Report summaries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" /> Rapor Özetleri (00–14)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {REPORTS.map((r) => (
                <div key={r.id} className="rounded-lg border p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {r.id}
                    </Badge>
                    <span className="font-medium">{r.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{r.summary}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Layers className="h-3.5 w-3.5" />
              Tam raporlar: <code>docs/catalog-role-afs-rebuild/00-14</code> · İnfografik:{" "}
              <code>docs/roles-infogram.html</code>
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminPageShell>
  );
};

export default AdminDurumRaporuPage;
