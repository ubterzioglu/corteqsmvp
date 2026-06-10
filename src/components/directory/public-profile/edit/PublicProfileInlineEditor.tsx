import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { publicCatalogProfileKeys } from "@/hooks/usePublicCatalogProfile";
import { useToast } from "@/hooks/use-toast";
import {
  parseDraftValue,
  readDraftValue,
  type CatalogAttributeDraftValue,
} from "@/lib/catalog-attribute-draft";
import {
  getCatalogItemProfile,
  updateCatalogItemAttribute,
  type CatalogEntityProfileAttribute,
} from "@/lib/catalog-entity-api";

import InlineAttributeField, { type AttributeVisibilityDraft } from "./InlineAttributeField";

export const catalogItemEditorKeys = {
  detail: (itemId: string) => ["catalog-item-editor", itemId] as const,
};

interface PublicProfileInlineEditorProps {
  itemId: string;
  slug: string;
}

/**
 * Owner edit mode of the public profile: lists the AFS attributes the item's
 * role allows (editor_can_edit) and saves each one through
 * update_catalog_item_attribute, then refreshes the public payload.
 */
const PublicProfileInlineEditor = ({ itemId, slug }: PublicProfileInlineEditorProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [draftValues, setDraftValues] = useState<Record<string, CatalogAttributeDraftValue>>({});
  const [draftVisibility, setDraftVisibility] = useState<Record<string, AttributeVisibilityDraft>>({});

  const profileQuery = useQuery({
    queryKey: catalogItemEditorKeys.detail(itemId),
    queryFn: () => getCatalogItemProfile(itemId),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!profileQuery.data) return;
    setDraftValues(
      Object.fromEntries(
        profileQuery.data.attributes.map((attribute) => [
          attribute.attribute_key,
          readDraftValue(attribute),
        ]),
      ),
    );
    setDraftVisibility(
      Object.fromEntries(
        profileQuery.data.attributes.map((attribute) => [
          attribute.attribute_key,
          attribute.visibility,
        ]),
      ),
    );
  }, [profileQuery.data]);

  const editableAttributes = useMemo(
    () =>
      (profileQuery.data?.attributes ?? []).filter((attribute) => attribute.editor_can_edit),
    [profileQuery.data],
  );

  const saveMutation = useMutation({
    mutationFn: (attribute: CatalogEntityProfileAttribute) =>
      updateCatalogItemAttribute(
        itemId,
        attribute.attribute_key,
        parseDraftValue(attribute, draftValues[attribute.attribute_key] ?? ""),
        draftVisibility[attribute.attribute_key],
      ),
    onSuccess: (_result, attribute) => {
      toast({ title: "Alan kaydedildi", description: `${attribute.label} güncellendi.` });
      void queryClient.invalidateQueries({ queryKey: publicCatalogProfileKeys.detail(slug) });
      void queryClient.invalidateQueries({ queryKey: catalogItemEditorKeys.detail(itemId) });
    },
    onError: (error) => {
      toast({
        title: "Alan kaydedilemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const savingKey = saveMutation.isPending
    ? (saveMutation.variables as CatalogEntityProfileAttribute | undefined)?.attribute_key ?? null
    : null;

  if (profileQuery.isLoading) {
    return (
      <section className="rounded-[22px] border border-border bg-card p-6 shadow-card">
        <p className="text-sm text-muted-foreground">Düzenleme formu yükleniyor...</p>
      </section>
    );
  }

  if (profileQuery.isError) {
    return (
      <section className="rounded-[22px] border border-destructive/30 bg-destructive/5 p-6">
        <p className="text-sm text-destructive">
          Düzenleme formu yüklenemedi:{" "}
          {profileQuery.error instanceof Error ? profileQuery.error.message : "Beklenmeyen hata"}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[22px] border border-border bg-card p-5 shadow-card md:p-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">Profil Bilgilerini Düzenle</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Alanları tek tek kaydedebilir, görünürlük anahtarıyla bir alanı public profilden
          gizleyebilirsin. Değişiklikler kaydedildiği anda profilde görünür.
        </p>
      </div>

      {editableAttributes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Bu profil için düzenlenebilir alan bulunamadı.
        </p>
      ) : (
        <div className="space-y-3">
          {editableAttributes.map((attribute) => (
            <InlineAttributeField
              key={attribute.attribute_key}
              attribute={attribute}
              value={draftValues[attribute.attribute_key] ?? ""}
              visibility={draftVisibility[attribute.attribute_key] ?? attribute.visibility}
              isSaving={savingKey === attribute.attribute_key}
              onValueChange={(value) =>
                setDraftValues((current) => ({ ...current, [attribute.attribute_key]: value }))
              }
              onVisibilityChange={(visibility) =>
                setDraftVisibility((current) => ({
                  ...current,
                  [attribute.attribute_key]: visibility,
                }))
              }
              onSave={() => saveMutation.mutate(attribute)}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default PublicProfileInlineEditor;
