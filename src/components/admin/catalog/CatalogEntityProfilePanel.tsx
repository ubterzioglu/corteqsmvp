import { useCallback, useEffect, useState } from "react";

import {
  adminSetCatalogItemAttribute,
  adminSetCatalogItemFeatureOverride,
  getCatalogItemProfile,
  type CatalogEntityProfile,
  type CatalogEntityProfileAttribute,
  type CatalogEntityProfileFeature,
} from "@/lib/catalog-entity-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type CatalogEntityProfilePanelProps = {
  itemId: string;
};

const isJsonAttribute = (attribute: CatalogEntityProfileAttribute) =>
  !["text", "textarea", "select", "url", "phone"].includes(attribute.data_type);

const serializeAttributeValue = (attribute: CatalogEntityProfileAttribute) => {
  if (isJsonAttribute(attribute)) {
    return attribute.value_json == null ? "" : JSON.stringify(attribute.value_json, null, 2);
  }

  return attribute.value_text ?? "";
};

const parseAttributeValue = (attribute: CatalogEntityProfileAttribute, rawValue: string) => {
  if (!isJsonAttribute(attribute)) {
    return rawValue;
  }

  if (!rawValue.trim()) {
    return null;
  }

  return JSON.parse(rawValue);
};

const CatalogEntityProfilePanel = ({ itemId }: CatalogEntityProfilePanelProps) => {
  const [profile, setProfile] = useState<CatalogEntityProfile | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [featureDrafts, setFeatureDrafts] = useState<Record<string, boolean>>({});
  const [visibilityDrafts, setVisibilityDrafts] = useState<Record<string, CatalogEntityProfileAttribute["visibility"]>>({});
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const nextProfile = await getCatalogItemProfile(itemId);
      setProfile(nextProfile);
      setDrafts(
        Object.fromEntries(nextProfile.attributes.map((attribute) => [attribute.attribute_key, serializeAttributeValue(attribute)])),
      );
      setVisibilityDrafts(
        Object.fromEntries(nextProfile.attributes.map((attribute) => [attribute.attribute_key, attribute.visibility])),
      );
      setFeatureDrafts(
        Object.fromEntries(nextProfile.features.map((feature) => [feature.feature_key, feature.is_enabled])),
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Katalog profil verisi alınamadı.");
    } finally {
      setIsLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const saveAttribute = async (attribute: CatalogEntityProfileAttribute) => {
    setPendingKey(`attribute:${attribute.attribute_key}`);
    setErrorMessage(null);

    try {
      const value = parseAttributeValue(attribute, drafts[attribute.attribute_key] ?? "");
      await adminSetCatalogItemAttribute(
        itemId,
        attribute.attribute_key,
        value,
        visibilityDrafts[attribute.attribute_key] ?? attribute.visibility,
      );
      await loadProfile();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Attribute kaydedilemedi.");
    } finally {
      setPendingKey(null);
    }
  };

  const saveFeature = async (feature: CatalogEntityProfileFeature) => {
    setPendingKey(`feature:${feature.feature_key}`);
    setErrorMessage(null);

    try {
      await adminSetCatalogItemFeatureOverride(itemId, feature.feature_key, featureDrafts[feature.feature_key] ?? feature.is_enabled);
      await loadProfile();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Feature override kaydedilemedi.");
    } finally {
      setPendingKey(null);
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Catalog Profili</CardTitle>
          <CardDescription>
            Member bridge ve yeni catalog attribute/feature katmanini buradan yonetebilirsin.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2">
          <MetadataRow label="Item Type" value={profile?.item_type ?? "-"} />
          <MetadataRow label="Slug" value={profile?.slug ?? "-"} />
          <MetadataRow label="Status" value={profile?.status ?? "-"} />
          <MetadataRow label="Visibility" value={profile?.visibility ?? "-"} />
          <MetadataRow label="Linked User" value={profile?.linked_user_id ?? "-"} />
          <MetadataRow label="Title" value={profile?.title ?? "-"} />
        </CardContent>
      </Card>

      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
      {isLoading ? <p className="text-sm text-muted-foreground">Catalog profil detaylari yukleniyor...</p> : null}

      {!isLoading ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Attributes</CardTitle>
            <CardDescription>Item type kurallarina gore attribute degerleri ve gorunurlukleri.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile?.attributes.length ? (
              profile.attributes.map((attribute) => {
                const fieldKey = attribute.attribute_key;
                const isSaving = pendingKey === `attribute:${fieldKey}`;
                const isJson = isJsonAttribute(attribute);

                return (
                  <div key={fieldKey} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-medium text-slate-950">{attribute.label}</div>
                          <Badge variant="outline">{fieldKey}</Badge>
                          <Badge variant="outline">{attribute.data_type}</Badge>
                          {attribute.is_required ? <Badge variant="secondary">Required</Badge> : null}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>Approval: {attribute.approval_status}</span>
                          <span>Default: {attribute.is_public_default ? "public" : "private"}</span>
                        </div>
                      </div>

                      <Select
                        value={visibilityDrafts[fieldKey] ?? attribute.visibility}
                        onValueChange={(value) =>
                          setVisibilityDrafts((current) => ({
                            ...current,
                            [fieldKey]: value as CatalogEntityProfileAttribute["visibility"],
                          }))
                        }
                        disabled={isSaving}
                      >
                        <SelectTrigger className="w-full lg:w-[180px]" aria-label={`${fieldKey} visibility`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                          <SelectItem value="admin_only">Admin Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="mt-4 space-y-3">
                      {isJson ? (
                        <Textarea
                          value={drafts[fieldKey] ?? ""}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [fieldKey]: event.target.value,
                            }))
                          }
                          className="min-h-28 font-mono text-xs"
                          disabled={isSaving}
                        />
                      ) : (
                        <Input
                          value={drafts[fieldKey] ?? ""}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [fieldKey]: event.target.value,
                            }))
                          }
                          disabled={isSaving}
                        />
                      )}
                      <div className="flex justify-end">
                        <Button type="button" size="sm" onClick={() => void saveAttribute(attribute)} disabled={isSaving}>
                          {isSaving ? "Kaydediliyor..." : "Attribute Kaydet"}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">Bu item type icin attribute kuralı bulunmuyor.</p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {!isLoading ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Features</CardTitle>
            <CardDescription>Default feature durumu ve item bazli override yonetimi.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile?.features.length ? (
              profile.features.map((feature) => {
                const fieldKey = feature.feature_key;
                const isSaving = pendingKey === `feature:${fieldKey}`;

                return (
                  <div key={fieldKey} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-medium text-slate-950">{fieldKey}</div>
                          <Badge variant={feature.source === "override" ? "secondary" : "outline"}>{feature.source}</Badge>
                        </div>
                        {feature.reason ? <div className="text-xs text-muted-foreground">{feature.reason}</div> : null}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <span>Aktif</span>
                          <Switch
                            checked={featureDrafts[fieldKey] ?? feature.is_enabled}
                            onCheckedChange={(checked) =>
                              setFeatureDrafts((current) => ({
                                ...current,
                                [fieldKey]: checked,
                              }))
                            }
                            disabled={isSaving}
                            aria-label={`${fieldKey} aktif`}
                          />
                        </div>
                        <Button type="button" size="sm" onClick={() => void saveFeature(feature)} disabled={isSaving}>
                          {isSaving ? "Kaydediliyor..." : "Feature Kaydet"}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">Bu item type icin feature default tanimi yok.</p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

const MetadataRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</span>
    <span className="break-all text-right text-sm text-slate-900">{value}</span>
  </div>
);

export default CatalogEntityProfilePanel;
