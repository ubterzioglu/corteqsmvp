import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RoleListItem } from "./types";

interface Props {
  roles: RoleListItem[];
  selectedRoleKey: string | null;
  onSelectRole: (roleKey: string) => void;
  isLoading?: boolean;
}

const RoleListPanel = ({ roles, selectedRoleKey, onSelectRole, isLoading }: Props) => (
  <Card className="flex flex-col h-full">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-semibold">
        Roller
        {!isLoading && <Badge variant="secondary" className="ml-2">{roles.length}</Badge>}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-0 flex-1 overflow-auto">
      {isLoading ? (
        <p className="px-4 py-6 text-xs text-muted-foreground">Yükleniyor...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Rol</TableHead>
              <TableHead className="text-xs">Key</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow
                key={role.id}
                className={`cursor-pointer ${selectedRoleKey === role.key ? "bg-muted font-medium" : "hover:bg-muted/50"}`}
                onClick={() => onSelectRole(role.key)}
              >
                <TableCell className="text-xs py-1.5">{role.label}</TableCell>
                <TableCell className="text-[10px] text-muted-foreground py-1.5">{role.key}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </CardContent>
  </Card>
);

export default RoleListPanel;
