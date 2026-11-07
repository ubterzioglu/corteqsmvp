// Ürün güncellemeleri — Kasım 2026 kayıtları (en yeniden eskiye).
// Tek kaynak barrel: ../admin-updates.ts — ekranlar oradan okur, buradan DEĞİL.

import type { AdminUpdateEntry } from "./types.ts";

export const ADMIN_UPDATES_2026_11: AdminUpdateEntry[] = [
  {
    id: "20261107-genel-temizlik-ve-guvenlik",
    date: "7 Kasım 2026",
    title:
      "Büyük temizlik günü: bir güvenlik sızıntısı kapandı, otomatik kontroller 1 aydır ilk kez çalışıyor, dokümanlar toparlandı",
    items: [
      "KISACA: Projenin kodu ve dokümanları baştan sona elden geçirildi. Üç önemli sonuç var: (1) sitedeki yapay zekâ asistanı üyelere göstermemesi gereken iç dokümanları gösteriyordu, kapatıldı; (2) her değişiklikte koşması gereken otomatik kontroller 4 Ekim'den beri hiç çalışmıyordu, yeniden çalışıyor; (3) ülke/şehir seçicilerde 'istanbul' yazınca 'İstanbul' bulunmuyordu, düzeltildi.",
      "GÜVENLİK — ASİSTAN: Site asistanı, 'rehberler' klasöründeki 19 dokümanın hepsini üyelere açıyordu; aralarında başında 'üyelere gösterilmez' yazan iki taslak ve iç teknik rehberler vardı. Artık üyeye yalnız açıkça onaylanmış 1 rehber gidiyor (Belgelerimi Nereye Yüklerim). Eski/arşiv dokümanları da asistandan çıkarıldı; asistan artık bayat bilgiyle cevap vermiyor. Bu değişiklik canlıda uygulandı.",
      "GÜVENLİK — 🔴 SİZİN ACİL İŞİNİZ: Hesap sahibinin yapması gereken, ertelenmemesi gereken bir anahtar yenileme işi var (KALANLAR'da GB1). Ayrıntı bilerek buraya yazılmadı; hazır adım adım plan: docs/plans/2026-10-06-gb1-secret-rotasyonu-plani.md.",
      "OTOMATİK KONTROLLER: Her değişiklikte koşan kalite kontrolü (yazım, test, derleme) 4 Ekim'den beri ilk adımda takılıyordu — yani bir ay boyunca hiçbir değişiklik otomatik denetlenmedi. Neden bulundu ve düzeltildi; bugün iki kez üst üste tamamen yeşil geçti. Ayrıca yeni kontroller eklendi: kod biçimi, kullanılmayan paketler, aşırı karmaşık kod ve doküman düzeni.",
      "DÜZELTİLEN HATALAR: Ülke/şehir seçicide büyük 'İ' ile başlayan yerler küçük harfle aranınca bulunmuyordu (İstanbul, İzmir); Łódź, København gibi Avrupa şehirleri de aksansız yazılınca bulunmuyordu. Yönetici panelindeki etkinlik ve revizyon aramalarında aynı sorun vardı. Lansman listesindeki baş harfler Türkçe kurala uymuyordu (ilker → I yerine İ). Hepsi düzeltildi. Kullanılmayan 16 yazılım paketi kaldırıldı.",
      "İŞARETLER: İş İlanları sayfasındaki 6 ilanın 6'sı da örnek; sayfaya artık 'Demo' bandı çıkıyor. Cadde gönderilerinin genel aramada görünmemesi kararı (6 Ekim) kodda da tamamlandı.",
      "DOKÜMANLAR: 36 kopya doküman silindi, 25 dosyadaki bozuk bağlantı onarıldı. Kalan işler listesi (KALANLAR) 1 Ekim'den beri güncellenmemişti; sonradan yazılan planlardaki 27 açık iş geri alındı. 85 plan dosyasına 'aktif / tamamlandı / yerini başkası aldı' işareti kondu. Ajan kurallar dosyası (CLAUDE.md) bayat rakamlardan arındırıldı.",
      "SİZDEN BEKLENEN: (1) 🔴 Yukarıdaki anahtar yenileme işi. (2) Sitenin yeni sürümünü Coolify'dan yayına almak — arama düzeltmeleri ancak yayına alınınca üyelere görünür. (3) Karar bekleyen maddeler KALANLAR dosyasında §1.9 başlığı altında toplandı (beş güvenlik kapısı, eksik migration kayıtları, WhatsApp bağlantı adresi vb.). Ayrıntılı devir notu: docs/handover/2026-11-07-clean-code-devir-notu.md",
    ],
  },
];
