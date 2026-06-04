import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { createReferralGroup, listReferralGroups, updateReferralGroup } from "@/lib/admin";
import { validateReferralCodeToken, type ReferralGroupRow } from "@/lib/referral-codes";
import { normalizeTurkishText } from "@/lib/text-normalization";

const AdminReferralGroupsPage = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<ReferralGroupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listReferralGroups(false);
      setItems(data);
      setDraftNames(Object.fromEntries(data.map((item) => [item.id, item.name])));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bilinmeyen hata";
      toast({ title: "Group listesi yüklenemedi", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      await createReferralGroup({
        name: normalizeTurkishText(name),
        code: validateReferralCodeToken(code),
      });
      toast({ title: "Group eklendi" });
      setName("");
      setCode("");
      await refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Eklenemedi";
      toast({ title: "Group eklenemedi", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteGroup = async (id: string) => {
    try {
      const updated = await updateReferralGroup({ id, is_active: false });
      setItems((current) => current.map((item) => (item.id === id ? updated : item)));
      toast({ title: "Group silindi" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Güncellenemedi";
      toast({ title: "Group güncellenemedi", description: message, variant: "destructive" });
    }
  };

  const renameGroup = async (id: string) => {
    try {
      const nextName = normalizeTurkishText(draftNames[id] ?? "");
      if (!nextName) return;
      const updated = await updateReferralGroup({ id, name: nextName });
      setItems((current) => current.map((item) => (item.id === id ? updated : item)));
      setDraftNames((current) => ({ ...current, [id]: updated.name }));
      toast({ title: "Group güncellendi" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Güncellenemedi";
      toast({ title: "Group güncellenemedi", description: message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Group Management</CardTitle>
          <CardDescription>Code alanı 2 harf, uppercase ve immutable kabul edilir.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[2fr_1fr_auto]">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Group adı" />
          <Input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="Code (OK)" maxLength={2} />
          <Button onClick={() => void handleCreate()} disabled={submitting || !name || !code}>
            {submitting ? "Ekleniyor..." : "Group Ekle"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mevcut Group Kayıtları</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5}>Yükleniyor...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={5}>Kayıt yok.</TableCell></TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Input
                        value={draftNames[item.id] ?? item.name}
                        onChange={(event) => setDraftNames((current) => ({ ...current, [item.id]: event.target.value }))}
                      />
                    </TableCell>
                    <TableCell className="font-mono">{item.code}</TableCell>
                    <TableCell>{item.is_active ? "Aktif" : "Silindi"}</TableCell>
                    <TableCell>{new Date(item.created_at).toLocaleDateString("tr-TR")}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => void renameGroup(item.id)}>
                        Kaydet
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => void deleteGroup(item.id)} disabled={!item.is_active}>
                        Sil
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReferralGroupsPage;
