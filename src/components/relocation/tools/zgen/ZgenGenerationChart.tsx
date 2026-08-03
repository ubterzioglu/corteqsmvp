// ZGEN — kuşak referans tablosu. Doğum yılı girilmeden önce de her zaman görünür.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ZGEN_DATA } from "@/lib/zgen/zgen-data";

export function ZgenGenerationChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Kuşak tablosu</CardTitle>
        <p className="text-sm text-muted-foreground">Hızlı referans: isimler, yıl aralıkları ve avatarlar.</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {ZGEN_DATA.generations.map((gen) => (
            <div
              key={gen.id}
              className="flex flex-col items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-center"
            >
              <div className="flex -space-x-2">
                <img
                  src={gen.avatars.m}
                  alt=""
                  loading="lazy"
                  className="h-12 w-12 rounded-full border-2 border-background object-cover"
                />
                <img
                  src={gen.avatars.f}
                  alt=""
                  loading="lazy"
                  className="h-12 w-12 rounded-full border-2 border-background object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{gen.name}</p>
                <p className="text-xs text-muted-foreground">
                  {gen.range[0]}–{gen.range[1]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
