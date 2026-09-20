/**
 * İşletmeler — public liste.
 *
 * Ana sayfadaki "Sistemin 6 Katmanı" bloğundaki İşletmeler kartı buraya gelir.
 * Daha önce `/directory`'ye gidiyordu, yani Uzmanlar kartıyla AYNI sayfaya —
 * iki kart ayırt edilemiyordu. Burak'ın bildirdiği kusurun çekirdeği buydu.
 *
 * ⚠️ BU SAYFANIN İÇERİĞİ DEMODUR. Ölçüldü 2026-09-20: `Business_*` rollerinde
 * canlıda 25 satırın 25'i de `is_placeholder` — gerçek işletme kaydı SIFIR.
 * Bu yüzden sayfa `DEMO_ROUTES`'ta yer alır; üstündeki kapatılamaz bant
 * `SiteHeader` tarafından rotadan çizilir, sayfaya elle yazılmaz.
 *
 * ⚠️ Sitemap'e EKLENMEZ — `generate-sitemap.mjs`'in (c) kriterini (thin content
 * değil) demo içerik geçmez. Notu o dosyada da duruyor.
 *
 * Gerçek kayıtlar geldiğinde `PublicListingPage` onları kendiliğinden üstte ve
 * rozetsiz gösterir; yapılacak iş `BUSINESS_DEMO_ROWS`'u ve `DEMO_ROUTES`
 * satırını kaldırmaktır.
 */

import { Briefcase } from "lucide-react";
import PublicListingPage from "@/components/directory-listing/PublicListingPage";
import CategoryListingBanner from "@/components/CategoryListingBanner";
import InterestForm from "@/components/InterestForm";
import { BUSINESS_ROLE_GROUPS } from "@/lib/directory-role-groups";
import { BUSINESS_DEMO_ROWS } from "@/lib/business-demo-rows";
import { useSeo } from "@/lib/seo";
import { PAGE_SEO } from "@/lib/page-seo";

const BusinessesPage = () => {
  useSeo(PAGE_SEO.businesses);

  return (
    <PublicListingPage
      title="İşletmeler"
      intro="Yurt dışındaki Türk işletmelerini keşfet ve destekle. Kendi işletmen de bu dizinde yer alabilir."
      eyebrow={
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-blue/30 bg-brand-blue/10 px-3.5 py-1.5 text-xs font-semibold text-brand-blue">
          <Briefcase className="h-3.5 w-3.5" aria-hidden="true" /> İşletme Dizini
        </span>
      }
      groups={BUSINESS_ROLE_GROUPS}
      demoRows={BUSINESS_DEMO_ROWS}
      searchPlaceholder="İşletme adı, sektör veya şehir ara…"
      countNoun="işletme"
      emptyDataMessage="Bu dizinde henüz işletme yok. İlk kaydı sen ekleyebilirsin."
      emptyFilterMessage="Bu filtrelerde işletme bulunamadı. Sektör, ülke veya şehir seçimini genişletmeyi dene."
    >
      <div className="mt-12">
        <CategoryListingBanner categoryLabel="İşletmeler" />
      </div>

      {/* Burak'ın "veriyi gelen kayıtlardan başlatarak koy" isteğinin gereği:
          sayfa yalnız vitrin değil, gerçek kayıt TOPLAYAN yüzey de olmalı.
          Kuruluşlar sayfasındaki aynı form ve aynı çapa (`#kayit-form`) —
          `DemoPageBanner`'ın "Kayıt Ol" düğmesi de bu çapaya gelir. */}
      <div className="mx-auto mt-10 max-w-2xl" id="kayit-form">
        <InterestForm
          modal={false}
          context="genel"
          defaultCategory="isletme"
          title="İşletme Olarak Ön Kayıt Ol"
          description="İşletmeni CorteQS dizinine ekle. Sunum, katalog ve tanıtım dökümanlarını da yükleyebilirsin."
          source="businesses-listing"
        />
      </div>
    </PublicListingPage>
  );
};

export default BusinessesPage;
