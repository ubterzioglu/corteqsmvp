// Mevcut taşınma dosyalarını listeler ("Araştırmalarım" karşılığı).
//
// Referans uygulamada bu liste localStorage'daydı ve sekme/cihaz değişince kaybolurdu.
// Burada relocation_moves'tan gelir. Ayrıca sayfa yenilendiğinde kullanıcının planına
// geri dönmesini sağlar — eskiden moveId yalnız bileşen state'indeydi ve her yenileme
// sihirbazı sıfırdan açıp YENİ kayıt oluşturuyordu.

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RelocationMoveRow } from "@/lib/relocation-types";

interface MoveSelectorProps {
  moves: RelocationMoveRow[];
  countryLabel: (code: string) => string;
  onSelect: (moveId: string) => void;
  onStartNew: () => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(date);
}

export function MoveSelector({
  moves,
  countryLabel,
  onSelect,
  onStartNew,
}: MoveSelectorProps) {
  if (moves.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Kayıtlı taşınma planlarınız</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {moves.map((move) => {
          const countries = move.target_country_codes.map(countryLabel).join(", ");
          return (
            <button
              key={move.id}
              type="button"
              onClick={() => onSelect(move.id)}
              className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors hover:bg-muted/50"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {countries || "Hedef belirtilmedi"}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {formatDate(move.created_at)} · {move.household?.adults ?? 1} yetişkin
                  {(move.household?.children ?? 0) > 0
                    ? `, ${move.household?.children} çocuk`
                    : ""}
                </span>
              </span>
              <span className="ml-3 shrink-0 text-xs text-primary">Devam et →</span>
            </button>
          );
        })}

        <Button type="button" variant="outline" size="sm" className="mt-2" onClick={onStartNew}>
          Yeni plan oluştur
        </Button>
      </CardContent>
    </Card>
  );
}
