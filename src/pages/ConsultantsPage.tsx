/**
 * Uzmanlar — public liste (gerçek veri).
 *
 * Ana sayfadaki "Sistemin 6 Katmanı" bloğundaki Uzmanlar kartı buraya gelir.
 * Daha önce `/directory`'ye gidiyordu — hem İşletmeler kartıyla AYNI sayfaya
 * düşüyordu (ayırt edilemiyordu) hem de o sayfa giriş yapmamış ziyaretçiye
 * içerik değil giriş duvarı gösteriyor.
 *
 * ⚠️ DEMO DEĞİLDİR, mock veri KULLANMAZ. Ölçüm 2026-09-20: `Consultant_*` +
 * kişi niteliğindeki `Healthcare_*` rollerinde **20** yayında + herkese açık
 * kayıt var. `mock.ts`'teki `consultants` BİLEREK kullanılmadı: uydurma KİŞİ
 * adları ve puanları taşıyor, ziyaretçi var olmayan bir avukata/doktora
 * ulaşmaya çalışabilir. Bu, uydurma işletme göstermekten farklı bir risktir.
 *
 * ⚠️ AÇIK İŞ: 61 gerçek uzman kaydı `status`/`visibility` yüzünden vitrine
 * çıkmıyor (ör. `Consultant_LawTax`'ın 20 kaydının 20'si). Bu sayfa onları
 * gösteremez — kod kusuru değil, yayın durumu. Ayrıntı ve liste için oturum
 * raporuna bak; yayına alınınca sayfa kendiliğinden dolar.
 */

import { Sparkles } from "lucide-react";
import PublicListingPage from "@/components/directory-listing/PublicListingPage";
import { CONSULTANT_ROLE_GROUPS } from "@/lib/directory-role-groups";
import { useSeo } from "@/lib/seo";
import { PAGE_SEO } from "@/lib/page-seo";

const ConsultantsPage = () => {
  useSeo(PAGE_SEO.consultants);

  return (
    <PublicListingPage
      title="Uzmanlar"
      intro="Vize, şirket kuruluşu, hukuk, relocation ve sağlık alanlarında güvenilir Türk uzmanlara ve danışmanlara ulaş."
      eyebrow={
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-teal/30 bg-brand-teal/10 px-3.5 py-1.5 text-xs font-semibold text-brand-teal">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Uzman & Danışman Dizini
        </span>
      }
      groups={CONSULTANT_ROLE_GROUPS}
      searchPlaceholder="Uzmanlık, ad veya şehir ara…"
      countNoun="uzman"
      emptyDataMessage="Bu alanda henüz yayınlanmış uzman kaydı yok. Uzmansan ağa katılarak ilk sen listelenebilirsin."
      emptyFilterMessage="Bu filtrelerde uzman bulunamadı. Alan, ülke veya şehir seçimini genişletmeyi dene."
    />
  );
};

export default ConsultantsPage;
