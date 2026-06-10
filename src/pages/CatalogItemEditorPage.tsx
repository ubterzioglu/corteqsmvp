import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  parseDraftValue,
  readDraftValue,
  type CatalogAttributeDraftValue as DraftValue,
} from "@/lib/catalog-attribute-draft";
import {
  getCatalogItemProfile,
  updateCatalogItemAttribute,
  type CatalogEntityProfile,
  type CatalogEntityProfileAttribute,
} from "@/lib/catalog-entity-api";

const CatalogItemEditorPage = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const { toast } = useToast();
  const [profile, setProfile] = useState<CatalogEntityProfile | null>(null);
  const [draftValues, setDraftValues] = useState<Record<string, DraftValue>>({});
  const [draftVisibility, setDraftVisibility] = useState<Record<string, "public" | "private" | "admin_only">>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingKey, setIsSavingKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!itemId) return;
    let isMounted = true;

    void (async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const nextProfile = await getCatalogItemProfile(itemId);
        if (!isMounted) return;

        setProfile(nextProfile);
        setDraftValues(
          Object.fromEntries(nextProfile.attributes.map((attribute) => [attribute.attribute_key, readDraftValue(attribute)])),
        );
        setDraftVisibility(
          Object.fromEntries(nextProfile.attributes.map((attribute) => [attribute.attribute_key, attribute.visibility])),
        );
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(error instanceof Error ? error.message : "Profil yüklenemedi.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [itemId]);

  const editableAttributes = useMemo(
    () => (profile?.attributes ?? []).filter((attribute) => attribute.editor_can_edit),
    [profile],
  );

  const saveAttribute = async (attribute: CatalogEntityProfileAttribute) => {
    if (!itemId) return;
    setIsSavingKey(attribute.attribute_key);

    try {
      await updateCatalogItemAttribute(
        itemId,
        attribute.attribute_key,
        parseDraftValue(attribute, draftValues[attribute.attribute_key] ?? ""),
        draftVisibility[attribute.attribute_key],
      );

      toast({
        title: "Alan kaydedildi",
        description: `${attribute.label} guncellendi.`,
      });
    } catch (error) {
      toast({
        title: "Alan kaydedilemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsSavingKey(null);
    }
  };

  if (!itemId) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {profile?.title ?? "Katalog Profili"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Yetkili oldugun katalog profilinin attribute degerlerini buradan duzenleyebilirsin.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/profile">Profil Secimine Don</Link>
        </Button>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Profil yukleniyor...</p> : null}
      {errorMessage ? <p className="text-sm text-destructive">Profil alinamadi: {errorMessage}</p> : null}

      {profile ? (
        <Card>
          <CardHeader>
            <CardTitle>{profile.title}</CardTitle>
            <CardDescription>
              {profile.item_type} • {profile.slug}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {editableAttributes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Bu profil için düzenlenebilir attribute bulunamadı.</p>
            ) : (
              editableAttributes.map((attribute) => {
                const isSaving = isSavingKey === attribute.attribute_key;
                const currentValue = draftValues[attribute.attribute_key];
                const visibility = draftVisibility[attribute.attribute_key] ?? attribute.visibility;

                return (
                  <div key={attribute.attribute_key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{attribute.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {attribute.attribute_key} • {attribute.data_type}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Public</span>
                        <Switch
                          checked={visibility === "public"}
                          disabled={!attribute.editor_can_hide || isSaving}
                          onCheckedChange={(checked) =>
                            setDraftVisibility((current) => ({
                              ...current,
                              [attribute.attribute_key]: checked ? "public" : "private",
                            }))
                          }
                        />
                      </div>
                    </div>

                    {attribute.data_type === "textarea" || attribute.data_type === "json" ? (
                      <Textarea
                        rows={attribute.data_type === "json" ? 5 : 3}
                        value={typeof currentValue === "string" ? currentValue : ""}
                        onChange={(event) =>
                          setDraftValues((current) => ({
                            ...current,
                            [attribute.attribute_key]: event.target.value,
                          }))
                        }
                      />
                    ) : attribute.data_type === "boolean" ? (
                      <div className="flex items-center justify-between rounded-xl border bg-white px-3 py-2">
                        <span className="text-sm text-foreground">{attribute.label}</span>
                        <Switch
                          checked={currentValue === true}
                          onCheckedChange={(checked) =>
                            setDraftValues((current) => ({
                              ...current,
                              [attribute.attribute_key]: checked,
                            }))
                          }
                        />
                      </div>
                    ) : (
                      <Input
                        value={typeof currentValue === "string" ? currentValue : ""}
                        onChange={(event) =>
                          setDraftValues((current) => ({
                            ...current,
                            [attribute.attribute_key]: event.target.value,
                          }))
                        }
                      />
                    )}

                    <div className="mt-3 flex justify-end">
                      <Button type="button" size="sm" onClick={() => void saveAttribute(attribute)} disabled={isSaving}>
                        {isSaving ? "Kaydediliyor..." : "Kaydet"}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default CatalogItemEditorPage;
