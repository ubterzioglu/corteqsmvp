// ZGEN — Nesil Bulucu ana panel. DB/oturum YOK; hesap tamamen istemci tarafında (src/lib/zgen).
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ZgenProfileCard } from "@/components/relocation/tools/zgen/ZgenProfileCard";
import { ZgenCompatibilityAccordion } from "@/components/relocation/tools/zgen/ZgenCompatibilityAccordion";
import { ZgenGenerationChart } from "@/components/relocation/tools/zgen/ZgenGenerationChart";
import { ZGEN_MAX_YEAR, ZGEN_MIN_YEAR, getZgenGenerationByYear } from "@/lib/zgen/zgen-helpers";

export function ZgenPanel() {
  const [birthYearInput, setBirthYearInput] = useState("");

  const youGen = useMemo(() => {
    const raw = birthYearInput.trim();
    const year = Number(raw);
    const valid = raw.length === 4 && Number.isInteger(year) && year >= ZGEN_MIN_YEAR && year <= ZGEN_MAX_YEAR;
    return valid ? getZgenGenerationByYear(year) : null;
  }, [birthYearInput]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Doğum yılın</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="zgen-birth-year" className="sr-only">
            Doğum yılı
          </Label>
          <Input
            id="zgen-birth-year"
            inputMode="numeric"
            maxLength={4}
            autoComplete="off"
            placeholder={`Desteklenen yıllar: ${ZGEN_MIN_YEAR}–${ZGEN_MAX_YEAR}`}
            value={birthYearInput}
            onChange={(e) => setBirthYearInput(e.target.value.replace(/[^0-9]/g, ""))}
            className="max-w-xs"
          />
          <p className="text-xs text-muted-foreground">
            Yazdıkça anında güncellenir — {ZGEN_MIN_YEAR}–{ZGEN_MAX_YEAR} arası desteklenir.
          </p>
        </CardContent>
      </Card>

      {youGen && (
        <>
          <ZgenProfileCard gen={youGen} />
          <ZgenCompatibilityAccordion youGen={youGen} />
        </>
      )}

      <ZgenGenerationChart />
    </div>
  );
}
