import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  grantCatalogItemEditor,
  listCatalogItemEditors,
  revokeCatalogItemEditor,
  searchAdminProfiles,
} from "@/lib/admin-catalog";
import type { AdminProfileSearchResult, CatalogItemEditor } from "@/lib/catalog-types";

type CatalogItemEditorsPanelProps = {
  itemId: string;
};

const CatalogItemEditorsPanel = ({ itemId }: CatalogItemEditorsPanelProps) => {
  const [editors, setEditors] = useState<CatalogItemEditor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AdminProfileSearchResult[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<AdminProfileSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
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

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    let isMounted = true;
    setIsSearching(true);

    const timer = window.setTimeout(() => {
      void searchAdminProfiles(searchQuery)
        .then((results) => {
          if (isMounted) setSearchResults(results);
        })
        .catch((error) => {
          if (isMounted) {
            setErrorMessage(error instanceof Error ? error.message : "Profil araması yapılamadı.");
          }
        })
        .finally(() => {
          if (isMounted) setIsSearching(false);
        });
    }, 250);

    return () => {
      isMounted = false;
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  const grantEditor = async () => {
    if (!selectedProfile) return;
    setIsSaving(true);
    setErrorMessage(null);

    try {
      await grantCatalogItemEditor(itemId, selectedProfile.id);
      setSelectedProfile(null);
      setSearchQuery("");
      setSearchResults([]);
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
          Bu liste item&apos;i kimin düzenleyebileceğini belirler. Claim onayı veya manuel atama kullanıcıya `editor`
          üyeliği verir; platform rolünü değiştirmez.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white">
          <Command>
            <CommandInput
              value={searchQuery}
              onValueChange={setSearchQuery}
              placeholder="İsim veya e-posta ile kullanıcı ara..."
            />
            <CommandList>
              {searchQuery.trim() ? <CommandEmpty>{isSearching ? "Aranıyor..." : "Kullanıcı bulunamadı."}</CommandEmpty> : null}
              <CommandGroup heading="Arama Sonuçları">
                {searchResults.map((result) => (
                  <CommandItem
                    key={result.id}
                    value={`${result.fullName} ${result.email ?? ""} ${result.id}`.trim()}
                    onSelect={() => setSelectedProfile(result)}
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">{result.fullName}</span>
                      <span className="truncate text-xs text-muted-foreground">{result.email ?? result.id}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>

        {selectedProfile ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="truncate font-medium text-slate-950">{selectedProfile.fullName}</div>
                <div className="truncate text-sm text-muted-foreground">{selectedProfile.email ?? selectedProfile.id}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={grantEditor} disabled={isSaving}>
                  {isSaving ? "Ekleniyor..." : "Düzenleyici Ekle"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setSelectedProfile(null)} disabled={isSaving}>
                  Seçimi Temizle
                </Button>
              </div>
            </div>
          </div>
        ) : null}

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
