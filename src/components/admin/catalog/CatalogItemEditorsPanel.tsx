import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  grantCatalogItemEditor,
  listCatalogItemEditors,
  revokeCatalogItemEditor,
} from "@/lib/admin-catalog";
import type { CatalogItemEditor } from "@/lib/catalog-types";

type CatalogItemEditorsPanelProps = {
  itemId: string;
};

const CatalogItemEditorsPanel = ({ itemId }: CatalogItemEditorsPanelProps) => {
  const [editors, setEditors] = useState<CatalogItemEditor[]>([]);
  const [targetUserId, setTargetUserId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadEditors = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      setEditors(await listCatalogItemEditors(itemId));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Düzenleyiciler alınamadı.");
    } finally {
      setIsLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    void loadEditors();
  }, [loadEditors]);

  const grantEditor = async () => {
    if (!targetUserId.trim()) return;
    setIsSaving(true);
    setErrorMessage(null);

    try {
      await grantCatalogItemEditor(itemId, targetUserId.trim());
      setTargetUserId("");
      await loadEditors();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Düzenleyici eklenemedi.");
    } finally {
      setIsSaving(false);
    }
  };

  const revokeEditor = async (userId: string) => {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      await revokeCatalogItemEditor(itemId, userId);
      await loadEditors();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Yetki kaldırılamadı.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Düzenleyiciler</CardTitle>
        <CardDescription>
          Bu liste item'i kimin düzenleyebileceğini belirler. Kullanıcının kendi platform rolü değişmez.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <Input
            value={targetUserId}
            onChange={(event) => setTargetUserId(event.target.value)}
            placeholder="Kullanıcı UUID"
            aria-label="Düzenleyici kullanıcı id"
          />
          <Button type="button" onClick={grantEditor} disabled={isSaving || !targetUserId.trim()}>
            Düzenleyici Ekle
          </Button>
        </div>

        {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
        {isLoading ? <p className="text-sm text-muted-foreground">Düzenleyiciler yükleniyor...</p> : null}

        <div className="space-y-2">
          {editors.map((editor) => (
            <div key={`${editor.userId}-${editor.membershipRole}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-950">{editor.fullName}</div>
                  <div className="truncate text-xs text-muted-foreground">{editor.email || editor.userId}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={editor.status === "active" ? "secondary" : "outline"}>{editor.status}</Badge>
                  <Badge variant="outline">{editor.membershipRole}</Badge>
                  {editor.membershipRole === "editor" && editor.status === "active" ? (
                    <Button type="button" size="sm" variant="outline" onClick={() => revokeEditor(editor.userId)} disabled={isSaving}>
                      Yetkiyi Kaldır
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
          {!isLoading && editors.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz aktif owner/manager/editor bağlantısı yok.</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

export default CatalogItemEditorsPanel;
