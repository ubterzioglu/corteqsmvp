import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { EntityCatalogItem } from "./types";

const KIND_CODE: Record<EntityCatalogItem["kind"], string> = {
  attribute: "ATR",
  feature: "FTR",
  section: "SCT",
};

interface Props {
  items: EntityCatalogItem[];
  isLoading?: boolean;
}

const EntityCatalogPanel = ({ items, isLoading }: Props) => (
  <Card className="flex flex-col h-full">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-semibold">
        Attribute / Feature / Section
        {!isLoading && <Badge variant="secondary" className="ml-2">{items.length}</Badge>}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-0 flex-1 overflow-auto">
      {isLoading ? (
        <p className="px-4 py-6 text-xs text-muted-foreground">Yükleniyor...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Tür</TableHead>
              <TableHead className="text-xs">Label</TableHead>
              <TableHead className="text-xs">Key</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={`${item.kind}:${item.key}`} className="hover:bg-muted/50">
                <TableCell className="py-1.5">
                  <Badge variant="outline" className="text-[10px] font-mono">{KIND_CODE[item.kind]}</Badge>
                </TableCell>
                <TableCell className="text-xs py-1.5">{item.label}</TableCell>
                <TableCell className="text-[10px] text-muted-foreground py-1.5">{item.key}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </CardContent>
  </Card>
);

export default EntityCatalogPanel;
