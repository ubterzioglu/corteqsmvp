// Yaşam masrafları sekmesi.
//
// Referans Lovable uygulamasında bu sekme bileşenin içine gömülü 2 ülkelik bir
// nesneden besleniyordu ve verisi olmayan ülke SESSİZCE Almanya rakamını görüyordu.
// Burada veri DB'den gelir; veri yoksa rakam UYDURULMAZ, durum açıkça söylenir.

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  COST_ITEM_ORDER,
  formatCostAmount,
  formatCostRange,
  groupCostsByScope,
  pickRowForHousehold,
  sumMonthlyCosts,
} from "@/lib/relocation-content-format";
import { COST_ITEM_LABELS } from "@/lib/relocation-chat-context";
import type { RelocationLivingCostRow } from "@/lib/relocation-content-types";

const ITEM_ICONS: Record<string, string> = {
  rent: "🏠",
  groceries: "🛒",
  transport: "🚇",
  insurance: "🏥",
  utilities: "💡",
  childcare: "👶",
};

/**
 * Rakamların NİTELİĞİ (B28, karar: seçenek D).
 *
 * Bu tutarlar ölçülmüş fiyat değildir. Onları yazan seed dosyası
 * (`docs/operations/2026-09-21-relocation-icerik-seed.sql`) bunu açıkça söylüyor:
 * "büyük şehirler için tipik aylık aralıklar · genel piyasa bilgisi · resmî bir fiyat
 * endeksinden TÜRETİLMEMİŞTİR". Kullanıcı bunu bilmezse geniş aralığı ölçülmüş bir
 * fiyat sanar.
 *
 * ⚠️ Burada **tarih gösterilmez**. `freshness_at` canlıda 192/192 dolu ama hepsi tek
 * an — verinin tazeliği değil, içe aktarma günü. Tek başına bir tarih, hiç ölçülmemiş
 * bir rakama ölçülmüşlük havası verir. Gerçek bir fiyat endeksi kaynağı edinilirse
 * (karar paketinde seçenek E) tarih o zaman anlam kazanır.
 */
const CostQualifierNote = () => (
  <p className="text-xs leading-relaxed text-muted-foreground">
    Bu tutarlar, ilgili ülkenin büyük şehirleri için <strong>tipik aylık aralıklardır</strong>;
    genel piyasa bilgisine dayanır ve resmî bir fiyat endeksinden türetilmemiştir. Kendi
    durumunuz bu aralığın dışında olabilir.
  </p>
);

interface LivingCostsPanelProps {
  rows: RelocationLivingCostRow[];
  householdSize: number;
  /** ISO kodu görünen ada çevirir; verilmezse kod gösterilir. */
  countryLabel?: (code: string) => string;
  isLoading?: boolean;
}

export function LivingCostsPanel({
  rows,
  householdSize,
  countryLabel,
  isLoading,
}: LivingCostsPanelProps) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Yaşam masrafları yükleniyor…</p>;
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Hedef ülkeniz için yaşam masrafı verisi henüz girilmedi.
          <br />
          Veri eklendiğinde bu sekme kendiliğinden dolar.
        </CardContent>
      </Card>
    );
  }

  // Kapsam kapsam çizilir (ülke + şehir). Tek grupta birleştirmek, hedefte iki ülke
  // varken iki ülkenin aynı kalemini çakıştırır ve yalnız biri görünürdü — üstelik AI
  // bağlamı ikisini de anlattığı için kullanıcı çelişen iki rakam görürdü. Aynısı şehir
  // ekseninde de geçerlidir: "Berlin kirası" ile "Almanya geneli kira" ayrı kapsamdır.
  const scopes = groupCostsByScope(rows);

  return (
    <div className="space-y-4">
      {scopes.map((country) => {
        // Toplam yalnızca haneye uyan satırlar üzerinden hesaplanır — tüm satırları
        // toplamak aynı kalemi birden çok hane büyüklüğü için sayardı.
        const pickedRows = country.groups
          .map((group) => pickRowForHousehold(group.rows, householdSize))
          .filter((row): row is RelocationLivingCostRow => row !== null);
        const total = sumMonthlyCosts(pickedRows);

        return (
          <Card key={`${country.country_code}|${country.city_code ?? ""}`}>
            <CardHeader>
              <CardTitle className="text-lg">
                💰 Aylık yaşam masrafları
                {scopes.length > 1 && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {countryLabel ? countryLabel(country.country_code) : country.country_code}
                    {/* Şehir kapsamı ülke genelinden AYRI karttır; etiket ikisini
                        karıştırmamak için açıkça yazılır. */}
                    {country.city_code ? ` · ${country.city_code}` : " · ülke geneli"}
                  </span>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {householdSize} kişilik hane için platform verisi.
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {COST_ITEM_ORDER.map((itemKey) => {
                const group = country.groups.find((g) => g.item_key === itemKey);
                if (!group) return null;
                const picked = pickRowForHousehold(group.rows, householdSize);
                if (!picked) return null;

                return (
                  <div
                    key={itemKey}
                    className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <span aria-hidden>{ITEM_ICONS[itemKey] ?? "•"}</span>
                      {COST_ITEM_LABELS[itemKey] ?? itemKey}
                      {picked.household_size !== householdSize && (
                        <span className="text-xs text-muted-foreground">
                          ({picked.household_size} kişilik veri)
                        </span>
                      )}
                    </span>
                    <span className="text-sm font-semibold">{formatCostRange(picked)}</span>
                  </div>
                );
              })}

              {total ? (
                <div className="mt-3 flex items-center justify-between border-t pt-3">
                  <span className="text-sm font-semibold">Toplam (aylık)</span>
                  <span className="text-lg font-extrabold text-primary">
                    {total.min === total.max
                      ? formatCostAmount(total.min, total.currency)
                      : `${formatCostAmount(total.min, total.currency)} – ${formatCostAmount(
                          total.max,
                          total.currency,
                        )}`}
                  </span>
                </div>
              ) : (
                <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
                  Kalemler farklı para birimlerinde olduğu için toplam hesaplanmadı.
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}

      <CostQualifierNote />
    </div>
  );
}
