// Referral kod oluşturma formu — `AdminReferralPage`'den ayrıldı (C02).
//
// ⚠️ Bu saf bir SUNUM bileşenidir: kendi state'i, veri çağrısı ve `toast`'u YOKTUR.
// Tüm değerler ve geri çağırımlar prop olarak gelir. Böylece sayfa state'i tek yerde
// kalır (18 `useState` orada) ve bu dosya render dışında hiçbir şey yapmaz.
//
// Doğrulama ve önizleme metni `@/lib/admin/referral-page-logic` içindedir ve testlidir;
// buraya mantık taşıma.

import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

/** Select'lerde gösterilen en dar satır şekli. */
export type ReferralOption = { id: string; name: string; code: string };

export interface ReferralCreateFormProps {
  sources: readonly ReferralOption[];
  groups: readonly ReferralOption[];
  types: readonly ReferralOption[];
  sourceId: string;
  groupId: string;
  typeId: string;
  validFrom: string;
  validUntil: string;
  note: string;
  /** `buildReferralCodePreview` çıktısı. */
  summary: string;
  lastCreatedCode: string | null;
  creating: boolean;
  loading: boolean;
  onSourceChange: (value: string) => void;
  onGroupChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onValidFromChange: (value: string) => void;
  onValidUntilChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onCreate: () => void;
  onCopyCode: (code: string) => void;
}

const ReferralCreateForm = ({
  sources,
  groups,
  types,
  sourceId,
  groupId,
  typeId,
  validFrom,
  validUntil,
  note,
  summary,
  lastCreatedCode,
  creating,
  loading,
  onSourceChange,
  onGroupChange,
  onTypeChange,
  onValidFromChange,
  onValidUntilChange,
  onNoteChange,
  onCreate,
  onCopyCode,
}: ReferralCreateFormProps) => (
  // ⚠️ `id` KORUNMALI: sayfa `?action=create` ile gelindiğinde buraya kaydırıyor.
  <Card id="referral-create-form">
    <CardHeader>
      <CardTitle>Referral Kod Oluştur</CardTitle>
      <CardDescription>Format: [SOURCE][GROUP][TYPE]-[RAND]</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Select value={sourceId} onValueChange={onSourceChange}>
          <SelectTrigger><SelectValue placeholder="Source seçin" /></SelectTrigger>
          <SelectContent>
            {sources.map((source) => (
              <SelectItem key={source.id} value={source.id}>
                {source.name} ({source.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={groupId} onValueChange={onGroupChange}>
          <SelectTrigger><SelectValue placeholder="Group seçin" /></SelectTrigger>
          <SelectContent>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.name} ({group.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeId} onValueChange={onTypeChange}>
          <SelectTrigger><SelectValue placeholder="Type seçin" /></SelectTrigger>
          <SelectContent>
            {types.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name} ({type.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" value={validFrom} onChange={(event) => onValidFromChange(event.target.value)} placeholder="Başlangıç" />
        <Input type="date" value={validUntil} onChange={(event) => onValidUntilChange(event.target.value)} placeholder="Bitiş" />
      </div>
      <Button onClick={onCreate} disabled={creating || loading}>
        {creating ? "Üretiliyor..." : "Generate + Save"}
      </Button>
      <Textarea value={note} onChange={(event) => onNoteChange(event.target.value)} placeholder="Not (opsiyonel)" rows={3} />
      <div className="rounded-md border bg-muted/20 p-3">
        <p className="text-xs text-muted-foreground">Önizleme</p>
        <p className="font-mono text-lg font-semibold">{summary}</p>
        <p className="mt-1 text-xs text-muted-foreground">Valid: {validFrom} - {validUntil}</p>
      </div>
      {lastCreatedCode && (
        <div className="flex items-center justify-between rounded-md border bg-primary/5 p-3">
          <div>
            <p className="text-xs text-muted-foreground">Son üretilen kod</p>
            <p className="font-mono text-base font-semibold">{lastCreatedCode}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => onCopyCode(lastCreatedCode)}>
            Kopyala
          </Button>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm"><Link to="/admin/referral/sources">Source Yönetimi</Link></Button>
        <Button asChild variant="outline" size="sm"><Link to="/admin/referral/groups">Group Yönetimi</Link></Button>
        <Button asChild variant="outline" size="sm"><Link to="/admin/referral/types">Type Yönetimi</Link></Button>
      </div>
    </CardContent>
  </Card>
);

export default ReferralCreateForm;
