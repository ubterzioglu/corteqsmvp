import { Info } from "lucide-react";
import { Link } from "react-router-dom";

import type { PublicProfileProvenanceViewModel } from "@/lib/public-catalog-profile-view-model";

interface PublicProfileProvenanceCardProps {
  provenance: PublicProfileProvenanceViewModel | null;
}

/**
 * Sahibi olmayan, toplu içe aktarmayla gelen kayıtların kaynak künyesi (B15/B16).
 *
 * Kart YALNIZ gerçekten bilineni söyler: derleme anahtarı, içe aktarma tarihi ve
 * kaydın kişi tarafından oluşturulmadığı. "Şu siteden alındı" gibi bir iddia
 * üretilmez — kayıt bazında kaynak URL'i saklanmamıştır.
 *
 * Kaldırma talebi yolu bu kartın ZORUNLU parçasıdır; B15 kararı yayını buna
 * bağladı. Kaldırırsan karar da bozulur.
 */
const PublicProfileProvenanceCard = ({ provenance }: PublicProfileProvenanceCardProps) => {
  if (!provenance) return null;

  return (
    <aside className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
      <p className="flex items-start gap-2 font-medium">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Bu profili kişinin kendisi oluşturmadı
      </p>
      <p className="mt-1.5 leading-relaxed">
        Kayıt, CorteQS&apos;in{" "}
        {provenance.importedAt ? <strong>{provenance.importedAt}</strong> : "daha önce"} tarihli{" "}
        <code className="rounded bg-amber-100 px-1 py-0.5 text-xs dark:bg-amber-900/50">
          {provenance.sourceKey}
        </code>{" "}
        derlemesinden geldi ve{" "}
        {provenance.isVerified ? "doğrulandı" : <strong>henüz doğrulanmadı</strong>}.
      </p>
      <p className="mt-1.5 leading-relaxed">
        Bu kayıt size aitse sayfanın üstünden düzenleme yetkisi talep edebilir,
        kaldırılmasını istiyorsanız{" "}
        <Link to="/iletisim" className="font-medium underline underline-offset-2">
          iletişim sayfasından
        </Link>{" "}
        bize yazabilirsiniz.
      </p>
    </aside>
  );
};

export default PublicProfileProvenanceCard;
