import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  compactList,
  formatDateShort,
  formatDateTime,
  formatLabel,
  getKindCode,
  getStatusCode,
  getStatusLabel,
  getVerificationCode,
  getVerificationLabel,
  kindLabel,
} from "@/lib/admin-catalog-display";
import type { UnifiedRecord } from "@/lib/catalog-types";

const CatalogRecordsTable = ({
  records,
  isLoading,
  roleLabelByKey,
  onSelectRecord,
}: {
  records: UnifiedRecord[];
  isLoading: boolean;
  roleLabelByKey: Map<string, string>;
  onSelectRecord: (record: UnifiedRecord) => void;
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Başlık / Kaynak</TableHead>
          <TableHead>Tür</TableHead>
          <TableHead>Tip</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead>Doğrulama</TableHead>
          <TableHead>Kaynak / Özet</TableHead>
          <TableHead>Lokasyon</TableHead>
          <TableHead>Tarih</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={9} className="py-14 text-center text-sm text-muted-foreground">
              Admin kayıtları yükleniyor...
            </TableCell>
          </TableRow>
        ) : null}

        {!isLoading && records.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="py-14 text-center text-sm text-muted-foreground">
              Bu filtrelerle eşleşen kayıt bulunamadı.
            </TableCell>
          </TableRow>
        ) : null}

        {!isLoading
          ? records.map((record) => (
              <TableRow key={`${record.kind}-${record.id}`} className="cursor-pointer" onClick={() => onSelectRecord(record)}>
                <TableCell className="min-w-[200px] max-w-[240px]">
                  <div className="flex flex-col gap-0.5">
                    <div className="truncate font-medium text-slate-950 leading-tight">{record.title}</div>
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[10px] text-muted-foreground">{record.slug ?? record.email ?? record.id}</span>
                      <span className="shrink-0 text-[10px] text-slate-400">{formatDateShort(record.createdAt)}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" title={kindLabel(record.kind)} aria-label={`Tür: ${kindLabel(record.kind)}`}>
                    {getKindCode(record.kind)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{record.itemType ? formatLabel(record.itemType) : record.profileType ? formatLabel(record.profileType) : "-"}</Badge>
                </TableCell>
                <TableCell className="max-w-[130px]">
                  <div
                    className="truncate text-[11px] font-medium text-slate-700"
                    title={roleLabelByKey.get(record.platformRoleKey ?? "") ?? record.platformRoleKey ?? "-"}
                  >
                    {roleLabelByKey.get(record.platformRoleKey ?? "") ?? record.platformRoleKey ?? "-"}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" title={getStatusLabel(record.status)} aria-label={`Durum: ${getStatusLabel(record.status)}`}>
                    {getStatusCode(record.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    title={getVerificationLabel(record.verificationStatus)}
                    aria-label={`Doğrulama: ${getVerificationLabel(record.verificationStatus)}`}
                  >
                    {getVerificationCode(record.verificationStatus)}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[160px]">
                  <div
                    className="truncate text-[11px] text-muted-foreground"
                    title={
                      record.kind === "catalog_item"
                        ? compactList([...record.categoryLabels, ...record.sourceTypes.map((value) => formatLabel(value))].slice(0, 5))
                        : (record.email ?? "-")
                    }
                  >
                    {record.kind === "catalog_item"
                      ? compactList(
                          [...record.categoryLabels, ...record.sourceTypes.map((value) => formatLabel(value))].slice(0, 3),
                        )
                      : record.email ?? "-"}
                  </div>
                </TableCell>
                <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {[record.primaryCity, record.primaryCountryCode].filter(Boolean).join(", ") || "-"}
                </TableCell>
                <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap" title={formatDateTime(record.createdAt)}>
                  {formatDateShort(record.createdAt)}
                </TableCell>
              </TableRow>
            ))
          : null}
      </TableBody>
    </Table>
  </div>
);

export default CatalogRecordsTable;
