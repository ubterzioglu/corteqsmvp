import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Search } from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  createReferralCode,
  deleteReferralCodeHard,
  listReferralGroups,
  listReferralSources,
  listReferralTypes,
  setReferralCodeActive,
  updateReferralCodeEditableFields,
} from "@/lib/admin";
import type { ReferralCodeRow, ReferralGroupRow, ReferralSourceRow, ReferralTypeRow } from "@/lib/referral-codes";
import { supabase } from "@/integrations/supabase/client";
import { useAdminOutletContext } from "@/components/admin/AdminLayout";

type ReferralUsageRow = {
  id: string;
  referral_code_id: string;
  used_at: string;
  full_name: string | null;
  email: string | null;
};

const AdminReferralPage = () => {
  const { session } = useAdminOutletContext();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [sources, setSources] = useState<ReferralSourceRow[]>([]);
  const [groups, setGroups] = useState<ReferralGroupRow[]>([]);
  const [types, setTypes] = useState<ReferralTypeRow[]>([]);
  const [referralCodes, setReferralCodes] = useState<ReferralCodeRow[]>([]);
  const [usageMap, setUsageMap] = useState<Record<string, ReferralUsageRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [lastCreatedCode, setLastCreatedCode] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState("");
  const [editingValidFrom, setEditingValidFrom] = useState("");
  const [editingValidUntil, setEditingValidUntil] = useState("");
  const [busyById, setBusyById] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const filteredReferralCodes = useMemo(() => {
    if (!searchQuery.trim()) return referralCodes;
    const q = searchQuery.toLowerCase();
    return referralCodes.filter((referral) => {
      const note = (referral.note ?? "").toLowerCase();
      const code = referral.code.toLowerCase();
      const sourceGroupType = `${referral.source_code}/${referral.group_code}/${referral.type_code}`.toLowerCase();
      return note.includes(q) || code.includes(q) || sourceGroupType.includes(q);
    });
  }, [referralCodes, searchQuery]);

  const now = new Date();
  const defaultFrom = now.toISOString().slice(0, 10);
  const nextYear = new Date(now);
  nextYear.setFullYear(now.getFullYear() + 1);

  const [sourceId, setSourceId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [validFrom, setValidFrom] = useState(defaultFrom);
  const [validUntil, setValidUntil] = useState(nextYear.toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [sourceData, groupData, typeData, codeData] = await Promise.all([
          listReferralSources(true),
          listReferralGroups(true),
          listReferralTypes(true),
          supabase.from("referral_codes").select("*").order("created_at", { ascending: false }).limit(100),
        ]);
        if (cancelled) return;
        setSources(sourceData);
        setGroups(groupData);
        setTypes(typeData);
        setReferralCodes(codeData.data ?? []);
        setSourceId((current) => current || sourceData[0]?.id || "");
        setGroupId((current) => current || groupData[0]?.id || "");
        setTypeId((current) => current || typeData[0]?.id || "");
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Bilinmeyen hata";
        toast({ title: "Referral verileri yüklenemedi", description: message, variant: "destructive" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  useEffect(() => {
    let cancelled = false;

    const loadUsage = async () => {
      const ids = referralCodes.map((item) => item.id);
      if (!ids.length) {
        setUsageMap({});
        return;
      }

      const { data, error } = await supabase
        .from("referral_code_usages")
        .select("id,referral_code_id,used_at,full_name,email")
        .in("referral_code_id", ids)
        .order("used_at", { ascending: false });

      if (cancelled || error) return;

      const grouped: Record<string, ReferralUsageRow[]> = {};
      for (const usage of (data ?? []) as ReferralUsageRow[]) {
        if (!grouped[usage.referral_code_id]) grouped[usage.referral_code_id] = [];
        grouped[usage.referral_code_id].push(usage);
      }
      setUsageMap(grouped);
    };

    void loadUsage();
    return () => {
      cancelled = true;
    };
  }, [referralCodes]);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      const element = document.getElementById("referral-create-form");
      element?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [searchParams]);

  const summary = useMemo(() => {
    const source = sources.find((item) => item.id === sourceId)?.code ?? "??";
    const group = groups.find((item) => item.id === groupId)?.code ?? "??";
    const type = types.find((item) => item.id === typeId)?.code ?? "??";
    return `${source}${group}${type}-XXXXXX`;
  }, [groupId, groups, sourceId, sources, typeId, types]);

  const handleCreate = async () => {
    if (!sourceId || !groupId || !typeId) {
      toast({ title: "Source, Group ve Type gerekli", variant: "destructive" });
      return;
    }

    if (!validFrom || !validUntil) {
      toast({ title: "Başlangıç ve bitiş tarihi gerekli", variant: "destructive" });
      return;
    }

    if (new Date(validUntil) < new Date(validFrom)) {
      toast({ title: "Tarih aralığı geçersiz", description: "Bitiş tarihi başlangıçtan önce olamaz.", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const created = await createReferralCode({
        sourceId,
        groupId,
        typeId,
        validFrom,
        validUntil,
        note,
        createdBy: session.user.id,
      });
      setReferralCodes((current) => [created, ...current].slice(0, 100));
      setLastCreatedCode(created.code);
      setNote("");
      const next = new URLSearchParams(searchParams);
      next.delete("action");
      setSearchParams(next, { replace: true });
      toast({ title: "Referral kodu oluşturuldu", description: created.code });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Referral kodu oluşturulamadı.";
      toast({ title: "Oluşturma başarısız", description: message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const copyCode = async (code: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = code;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      toast({ title: "Kopyalandı", description: code });
    } catch {
      toast({ title: "Kopyalama başarısız", description: "Kod panoya kopyalanamadı.", variant: "destructive" });
    }
  };

  const setBusy = (id: string, busy: boolean) => {
    setBusyById((current) => ({ ...current, [id]: busy }));
  };

  const startEdit = (referral: ReferralCodeRow) => {
    setEditingId(referral.id);
    setEditingNote(referral.note ?? "");
    setEditingValidFrom(referral.valid_from);
    setEditingValidUntil(referral.valid_until);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingNote("");
    setEditingValidFrom("");
    setEditingValidUntil("");
  };

  const saveEdit = async (id: string) => {
    if (!editingValidFrom || !editingValidUntil) {
      toast({ title: "Geçerlilik tarihleri zorunlu", variant: "destructive" });
      return;
    }
    if (new Date(editingValidUntil) < new Date(editingValidFrom)) {
      toast({ title: "Tarih aralığı geçersiz", description: "Bitiş tarihi başlangıçtan önce olamaz.", variant: "destructive" });
      return;
    }

    setBusy(id, true);
    try {
      const updated = await updateReferralCodeEditableFields({
        id,
        note: editingNote.trim() ? editingNote : null,
        valid_from: editingValidFrom,
        valid_until: editingValidUntil,
      });
      setReferralCodes((current) => current.map((item) => (item.id === id ? updated : item)));
      cancelEdit();
      toast({ title: "Referral kodu güncellendi" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Referral kodu güncellenemedi.";
      toast({ title: "Güncelleme başarısız", description: message, variant: "destructive" });
    } finally {
      setBusy(id, false);
    }
  };

  const toggleActive = async (referral: ReferralCodeRow) => {
    setBusy(referral.id, true);
    try {
      const updated = await setReferralCodeActive({ id: referral.id, is_active: !referral.is_active });
      setReferralCodes((current) => current.map((item) => (item.id === referral.id ? updated : item)));
      toast({ title: updated.is_active ? "Referral kodu aktifleşti" : "Referral kodu pasifleşti" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Durum değiştirilemedi.";
      toast({ title: "İşlem başarısız", description: message, variant: "destructive" });
    } finally {
      setBusy(referral.id, false);
    }
  };

  const hardDelete = async (referral: ReferralCodeRow) => {
    const confirmed = window.confirm(
      `${referral.code} kodu hard delete edilecek. Bu işlem geri alınamaz. Devam edilsin mi?`,
    );
    if (!confirmed) return;

    setBusy(referral.id, true);
    try {
      await deleteReferralCodeHard(referral.id);
      setReferralCodes((current) => current.filter((item) => item.id !== referral.id));
      setUsageMap((current) => {
        const next = { ...current };
        delete next[referral.id];
        return next;
      });
      if (editingId === referral.id) cancelEdit();
      toast({ title: "Referral kodu hard delete edildi" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Referral kodu silinemedi.";
      toast({ title: "Hard delete başarısız", description: message, variant: "destructive" });
    } finally {
      setBusy(referral.id, false);
    }
  };

  return (
    <div className="space-y-6">
      <Card id="referral-create-form">
        <CardHeader>
          <CardTitle>Referral Kod Oluştur</CardTitle>
          <CardDescription>Format: [SOURCE][GROUP][TYPE]-[RAND]</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Select value={sourceId} onValueChange={setSourceId}>
              <SelectTrigger><SelectValue placeholder="Source seçin" /></SelectTrigger>
              <SelectContent>
                {sources.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.name} ({source.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={groupId} onValueChange={setGroupId}>
              <SelectTrigger><SelectValue placeholder="Group seçin" /></SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name} ({group.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeId} onValueChange={setTypeId}>
              <SelectTrigger><SelectValue placeholder="Type seçin" /></SelectTrigger>
              <SelectContent>
                {types.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name} ({type.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={validFrom} onChange={(event) => setValidFrom(event.target.value)} placeholder="Başlangıç" />
            <Input type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} placeholder="Bitiş" />
          </div>
          <Button onClick={() => void handleCreate()} disabled={creating || loading}>
            {creating ? "Üretiliyor..." : "Generate + Save"}
          </Button>
          <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Not (opsiyonel)" rows={3} />
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
              <Button variant="outline" size="sm" onClick={() => void copyCode(lastCreatedCode)}>
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

      <Card>
        <CardHeader>
          <CardTitle>Üretilen Referral Kodları</CardTitle>
          <CardDescription>Son 100 kod, kullanım ve kayıt raporu. Hard delete sadece kullanılmamış kodlarda çalışır.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Not, kod veya kaynak ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Yükleniyor...</p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {filteredReferralCodes.length === 0 && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {searchQuery.trim() ? "Aramanızla eşleşen kayıt bulunamadı." : "Henüz referral kodu yok."}
                </div>
              )}
              {filteredReferralCodes.map((referral) => {
                const today = new Date().toISOString().slice(0, 10);
                const isExpired = referral.valid_until < today;
                const usages = usageMap[referral.id] ?? [];
                return (
                  <AccordionItem key={referral.id} value={referral.id}>
                    <AccordionTrigger className="text-left">
                      <div className="flex w-full items-center justify-between gap-3 pr-2">
                        <div className="flex flex-col">
                          <span className="font-mono text-sm font-semibold">{referral.code}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(referral.created_at).toLocaleString("tr-TR")} · {referral.source_code}/{referral.group_code}/{referral.type_code}
                          </span>
                          <span className="max-w-[70ch] truncate text-xs text-muted-foreground">
                            Not: {referral.note?.trim() || "Yok"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={referral.is_active ? "outline" : "secondary"}>{referral.is_active ? "Aktif" : "Pasif"}</Badge>
                          <Badge variant={isExpired ? "secondary" : "outline"}>{isExpired ? "Expired" : "Valid"}</Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                        <div className="md:col-span-2 flex items-center gap-2">
                          <span className="font-mono text-foreground">{referral.code}</span>
                          <Button variant="outline" size="sm" onClick={() => void copyCode(referral.code)}>
                            Kopyala
                          </Button>
                        </div>
                        <div>Source/Group/Type: <span className="font-mono text-foreground">{referral.source_code}/{referral.group_code}/{referral.type_code}</span></div>
                        <div>Valid Window: <span className="text-foreground">{referral.valid_from} - {referral.valid_until}</span></div>
                        <div>Random: <span className="font-mono text-foreground">{referral.random_part}</span></div>
                        <div>Usage Count: <span className="text-foreground">{referral.usage_count}</span></div>
                        <div>Son Kullanım: <span className="text-foreground">{referral.used_at ? new Date(referral.used_at).toLocaleString("tr-TR") : "-"}</span></div>
                        <div className="md:col-span-2">Not: <span className="text-foreground">{referral.note || "Yok"}</span></div>
                        <div className="md:col-span-2 flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void toggleActive(referral)}
                            disabled={Boolean(busyById[referral.id])}
                          >
                            {referral.is_active ? "Pasif Yap" : "Aktif Yap"}
                          </Button>
                          {editingId === referral.id ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => void saveEdit(referral.id)}
                                disabled={Boolean(busyById[referral.id])}
                              >
                                Kaydet
                              </Button>
                              <Button variant="secondary" size="sm" onClick={cancelEdit} disabled={Boolean(busyById[referral.id])}>
                                Vazgeç
                              </Button>
                            </>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => startEdit(referral)} disabled={Boolean(busyById[referral.id])}>
                              Duzenle
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => void hardDelete(referral)}
                            disabled={Boolean(busyById[referral.id])}
                          >
                            Sil (Hard Delete)
                          </Button>
                        </div>
                        {editingId === referral.id && (
                          <div className="md:col-span-2 grid gap-2 rounded-md border p-3">
                            <p className="text-xs text-muted-foreground">
                              Sadece açıklama ve geçerlilik tarihleri düzenlenebilir.
                            </p>
                            <div className="grid gap-2 md:grid-cols-2">
                              <Input
                                type="date"
                                value={editingValidFrom}
                                onChange={(event) => setEditingValidFrom(event.target.value)}
                              />
                              <Input
                                type="date"
                                value={editingValidUntil}
                                onChange={(event) => setEditingValidUntil(event.target.value)}
                              />
                            </div>
                            <Textarea
                              value={editingNote}
                              onChange={(event) => setEditingNote(event.target.value)}
                              placeholder="Açıklama (opsiyonel)"
                              rows={3}
                            />
                          </div>
                        )}
                        <div className="md:col-span-2">
                          Kayıtlar:
                          <span className="text-foreground">
                            {usages.length
                              ? ` ${usages.map((usage) => usage.full_name || usage.email || "Isimsiz").join(", ")}`
                              : " -"}
                          </span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReferralPage;
