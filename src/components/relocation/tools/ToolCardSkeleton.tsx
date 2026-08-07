// Araç kartı iskeleti — hub yüklenirken gösterilir.
// Geometri ToolLandingCard ile birebir aynı (1.5px şerit + 16/9 görsel + gövde):
// veri gelince kart yerinde büyümez, düzen kaymaz (CLS).
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ToolCardSkeleton() {
  return (
    <Card className="flex h-full flex-col overflow-hidden border-border/50" aria-hidden="true">
      <Skeleton className="h-1.5 w-full rounded-none" />
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      <CardContent className="flex flex-1 flex-col gap-2 pt-4">
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-auto h-3 w-1/3" />
      </CardContent>
    </Card>
  );
}
