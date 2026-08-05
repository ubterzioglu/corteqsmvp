import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import type { AppFeatureKey } from "@/lib/features";

type RequireFeatureProps = {
  feature: AppFeatureKey;
  children: ReactNode;
  fallback?: ReactNode;
};

/**
 * Özellik kapısı.
 *
 * ÜÇ durum vardır ve üçü AYRI ele alınır — ikisini birleştirmek 05.08.2026'da canlıda
 * yaşandı: Postgres örneği düştü, `get_current_user_features` RPC'si hata verdi,
 * `isFeatureEnabled` her şeye `false` döndü ve kullanıcı hiçbir açıklama görmeden
 * ana sayfaya atıldı (`/cadde` → `/`). "Altyapı çöktü" ile "bu yetkin yok" aynı
 * muameleyi görüyordu.
 *
 *   1. yükleniyor  → bekleme metni
 *   2. HATA        → hata + "Tekrar dene" (fallback'e DÜŞMEZ, yönlendirme YAPMAZ)
 *   3. yetki yok   → fallback (çağıran taraf genelde <Navigate to="/" /> verir)
 *
 * Hata durumunda fallback'e düşmek, geçici bir ağ/arka uç sorununu kalıcı bir
 * "yetkin yok" kararına çevirir. Gerçek yetki zorlaması zaten DB'de (RLS + RPC);
 * bu bileşen yalnız yönlendirme amaçlıdır — aynı gerekçeyle CaddeProfileGate de
 * bilinçli olarak fail-open davranır.
 */
const RequireFeature = ({ feature, children, fallback = null }: RequireFeatureProps) => {
  const { isLoading, isFeatureEnabled, errorMessage, refreshFeatures } = useFeatureFlags(true);

  if (isLoading) {
    return <div className="flex min-h-[120px] items-center justify-center text-sm text-muted-foreground">Yetki yükleniyor...</div>;
  }

  if (errorMessage) {
    return (
      <div
        data-testid="require-feature-error"
        className="mx-auto flex min-h-[240px] w-full max-w-md flex-col items-center justify-center gap-3 px-4 text-center"
      >
        <p className="text-base font-semibold text-foreground">Bağlantı kurulamadı</p>
        <p className="text-sm text-muted-foreground">
          Yetki bilgin alınamadı, bu yüzden sayfayı açamıyoruz. Sorun büyük ihtimalle geçici.
        </p>
        <Button variant="outline" onClick={() => void refreshFeatures()}>
          Tekrar dene
        </Button>
      </div>
    );
  }

  if (!isFeatureEnabled(feature)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default RequireFeature;
