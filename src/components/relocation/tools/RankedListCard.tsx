// Sıralı liste kartı — ranked_list result_kind.
//
// KAPSAM (ölçüldü 2026-10-01, canlı `relocation_tools`): `ranked_list` DÖRT aktif
// araçta kullanılıyor — `country_match` · `city_match` · `banka_secim_almanya` ·
// `sigorta_secim_almanya`. Bu bileşen dördünün de sonuç ekranıdır. #REV-034 yalnız
// "Hangi Ülke Sana Uygun" (`country_match`) için açılmıştı; araç anahtarını prop
// olarak geçirip tek araca özel bir görünüm üretmek YERİNE dördü birden
// güncellendi: aynı `result_kind` için iki ayrı grafik dili tutarsızlık olurdu.
// Tek araca özel görünüm istenirse `toolKey` prop'u eklenmeli (karar commit'te).
//
// #REV-034: öğeler artık "görselli kutu" — bant rengini taşıyan başlık şeridi +
// kalınlaşmış renkli barlar. Önceki hâli ince (`h-1`) gri çerçeveli satırlardı.
//
// ⚠️ Renk TEK BAŞINA bilgi taşımaz (`relocation-score-bands` kuralı): başlık şeridi
// renkliyken bandın Türkçe etiketi de YAZILI durur ve sayı her zaman görünür.
// Renk körlüğünde, tek renkli baskıda ve forced-colors'ta bilgi metinden okunur.
//
// ⚠️ `ScoreBandBar`'ın `progressbar` rolü/aria sözleşmesi (revizyon a275f131)
// DEĞİŞMEDİ — buradan yalnız `className` geçilir, bileşenin kendisine dokunulmaz.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreBandBar } from "@/components/relocation/tools/ScoreBand";
import {
  SCORE_BAND_LABELS,
  SCORE_BAND_STYLES,
  scoreBand,
} from "@/lib/relocation-score-bands";
import { cn } from "@/lib/utils";

interface RankedItem {
  key?: string;
  title?: string;
  score?: number;
  detail?: string;
  sub_scores?: Record<string, number>;
  [extra: string]: unknown;
}

interface RankedListCardProps {
  title: string;
  items: RankedItem[];
  /** sub_scores boyut anahtarı → görünen etiket. */
  dimensionLabels?: Record<string, string>;
}

/** Nötr şerit: puanı olmayan öğe bant rengi ALMAZ — yoksa 0 puan "zayıf kırmızı" sanılır. */
const UNSCORED_HEADER = "border-border bg-muted/60 text-foreground";

export function RankedListCard({ title, items, dimensionLabels = {} }: RankedListCardProps) {
  if (items.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, idx) => {
          const hasScore = typeof item.score === "number" && Number.isFinite(item.score);
          // Öğe puanı 0..100, `scoreBand` 0..1 bekler.
          const band = hasScore ? scoreBand((item.score as number) / 100) : null;
          return (
            <div
              key={item.key ?? idx}
              className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
            >
              <div
                className={cn(
                  "flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-3 py-2.5",
                  band ? SCORE_BAND_STYLES[band].chip : UNSCORED_HEADER,
                )}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background/70 text-xs font-bold tabular-nums">
                  {idx + 1}
                </span>
                <span className="min-w-0 flex-1 font-semibold">{item.title ?? item.key}</span>
                {band && <span className="text-xs font-medium">{SCORE_BAND_LABELS[band]}</span>}
                {hasScore && (
                  <span className="text-sm font-bold tabular-nums">
                    {Math.round(item.score as number)}
                    <span className="text-xs font-normal opacity-70">/100</span>
                  </span>
                )}
              </div>
              {item.sub_scores && Object.keys(item.sub_scores).length > 0 && (
                <div className="space-y-2 p-3">
                  {Object.entries(item.sub_scores).map(([dim, value]) => {
                    const value01 = value ?? 0;
                    const pct = Math.round(value01 * 100);
                    const dimBand = scoreBand(value01);
                    return (
                      <div key={dim} className="flex items-center gap-2">
                        <span className="w-32 shrink-0 text-xs text-muted-foreground">
                          {dimensionLabels[dim] ?? dim}
                        </span>
                        {/* Bant rengi burada da geçerli: sıralı listede zayıf boyut
                            bir bakışta ayırt edilebilmeli. Rozet YOK — satır dar ve
                            etiket zaten solda; renk + sayı yeterli, rozet satırı kırardı. */}
                        <ScoreBandBar
                          value01={value01}
                          ariaLabel={dimensionLabels[dim] ?? dim}
                          className="h-2.5"
                        />
                        <span
                          className={cn(
                            "w-8 shrink-0 text-right text-xs font-medium tabular-nums",
                            SCORE_BAND_STYLES[dimBand].text,
                          )}
                        >
                          {pct}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
