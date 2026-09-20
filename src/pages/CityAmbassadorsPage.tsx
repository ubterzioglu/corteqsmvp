/**
 * Şehir Elçileri — public liste + program tanıtımı + başvuru.
 *
 * Ana sayfadaki "Sistemin 6 Katmanı" bloğundaki Şehir Elçileri kartı buraya
 * gelir. Daha önce `/directory?role=User_CityAmbassador` adresine gidiyordu;
 * o sayfa giriş yapmamış ziyaretçiye içerik DEĞİL giriş duvarı gösteriyor
 * (`search_directory_catalog` anonim çağrıda 42501 ile patlar), yani kartı
 * tıklayan yeni ziyaretçi hiçbir elçi göremiyordu.
 *
 * ⚠️ Bu sayfa DEMO DEĞİLDİR ve mock veri KULLANMAZ. Veri canlı `catalog_items`'tan
 * gelir (ölçüm 2026-09-20: 9 yayında + herkese açık elçi kaydı). `DEMO_ROUTES`'a
 * eklenmez, sitemap'e ise EKLENİR (üç kriteri de geçiyor).
 *
 * Mock elçi EKLENMEMESİ bilinçli bir karardır: `mock.ts`'teki `cityAmbassadors`
 * uydurma KİŞİ adları, puanlar ve "127 üye kazandırdı" gibi sayılar taşır. Gerçek
 * 9 kayıt sayfayı zaten dolduruyor; uydurma kişileri gerçeklerin arasına koymak
 * ziyaretçinin var olmayan biriyle iletişim kurmaya çalışmasına yol açar.
 * (İşletmeler sayfasında durum farklıdır — orada gerçek kayıt SIFIR.)
 */

import { MapPin } from "lucide-react";
import PublicListingPage from "@/components/directory-listing/PublicListingPage";
import AmbassadorProgramSection from "@/components/ambassadors/AmbassadorProgramSection";
import AmbassadorApplicationForm from "@/components/ambassadors/AmbassadorApplicationForm";
import { CITY_AMBASSADOR_ROLE_GROUPS } from "@/lib/directory-role-groups";
import { useSeo } from "@/lib/seo";
import { PAGE_SEO } from "@/lib/page-seo";

const CityAmbassadorsPage = () => {
  useSeo(PAGE_SEO.cityAmbassadors);

  return (
    <PublicListingPage
      title="Şehir Elçileri"
      intro="Bulunduğun şehirde güveni inşa eden, yeni gelenleri karşılayan ve yerel ağı büyüten elçilerle tanış."
      eyebrow={
        <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/15 px-3.5 py-1.5 text-xs font-semibold text-gold">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Şehir Elçisi Programı
        </span>
      }
      groups={CITY_AMBASSADOR_ROLE_GROUPS}
      // Tek rollü sayfa — taksonomi yalnız kart rozeti için taşınır.
      showGroups={false}
      searchPlaceholder="Elçi adı veya şehir ara…"
      countNoun="elçi"
      emptyDataMessage="Henüz yayınlanmış şehir elçisi kaydı yok. İlk elçi sen olabilirsin — aşağıdan başvur."
      emptyFilterMessage="Bu filtrelerde elçi bulunamadı. Ülke veya şehir seçimini genişletmeyi dene."
    >
      <AmbassadorProgramSection />

      <div className="mx-auto mt-10 max-w-2xl" id="basvuru">
        <AmbassadorApplicationForm />
      </div>
    </PublicListingPage>
  );
};

export default CityAmbassadorsPage;
