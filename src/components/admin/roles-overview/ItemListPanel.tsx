import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ItemListEntry } from "./types";

interface Props {
  items: ItemListEntry[];
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
  totalCount: number;
  isLoading?: boolean;
}

const ItemListPanel = ({ items, selectedItemId, onSelectItem, totalCount, isLoading }: Props) => (
  <Card className="flex flex-col h-full">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-semibold">
        Katalog / Genel Item
        {!isLoading && <Badge variant="secondary" className="ml-2">{totalCount}</Badge>}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-0 flex-1 overflow-auto">
      {isLoading ? (
        <p className="px-4 py-6 text-xs text-muted-foreground">Yükleniyor...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Başlık</TableHead>
              <TableHead className="text-xs">Tür</TableHead>
              <TableHead className="text-xs">Rol</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow
                key={item.id}
                className={`cursor-pointer ${selectedItemId === item.id ? "bg-muted font-medium" : "hover:bg-muted/50"}`}
                onClick={() => onSelectItem(item.id)}
              >
                <TableCell className="text-xs py-1.5 max-w-[160px] truncate">{item.title}</TableCell>
                <TableCell className="py-1.5">
                  <Badge variant="outline" className="text-[10px]">
                    {item.kind === "catalog_item" ? "KTG" : item.kind === "member_profile" ? "MEM" : "KUL"}
                  </Badge>
                </TableCell>
                <TableCell className="text-[10px] text-muted-foreground py-1.5">{item.platformRoleKey ?? "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </CardContent>
  </Card>
);

export default ItemListPanel;
