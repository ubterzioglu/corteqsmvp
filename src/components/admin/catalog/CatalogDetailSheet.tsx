import { MapPin } from "lucide-react";

import CatalogClaimRequestsPanel from "@/components/admin/catalog/CatalogClaimRequestsPanel";
import CatalogEntityProfilePanel from "@/components/admin/catalog/CatalogEntityProfilePanel";
import CatalogItemEditorsPanel from "@/components/admin/catalog/CatalogItemEditorsPanel";
import ImportReviewSection from "@/components/admin/catalog/ImportReviewSection";
import MetadataRow from "@/components/admin/catalog/MetadataRow";
import RoleChangeSection from "@/components/admin/catalog/RoleChangeSection";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AdminCatalogDetail, AdminCatalogRoleOption } from "@/lib/admin-catalog";
import { formatDateTime, formatLabel, kindLabel } from "@/lib/admin-catalog-display";
import type { ReviewDecision } from "@/lib/catalog-import-schemas";

const CatalogDetailSheet = ({
  detail,
  creatorEmail,
  roles,
  onRoleChange,
  onReview,
}: {
  detail: AdminCatalogDetail;
  creatorEmail: string | null;
  roles: AdminCatalogRoleOption[];
  onRoleChange: (roleKey: string | null) => void;
  onReview: (decision: ReviewDecision, note: string | null) => void;
}) => {
  const isPendingImport =
    detail.status === "pending_review" &&
    typeof (detail.attributes as Record<string, unknown>)?.import_source === "string";

  return (
  <div className="space-y-6">
    <SheetHeader>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{formatLabel(detail.itemType)}</Badge>
        <Badge variant="outline">Katalog</Badge>
        <Badge variant="secondary">{formatLabel(detail.status)}</Badge>
        <Badge variant="outline">{formatLabel(detail.verificationStatus)}</Badge>
      </div>
      <SheetTitle>{detail.title}</SheetTitle>
      <SheetDescription>
        <code>{detail.slug}</code> kaydının özet, attribute, claim ve düzenleyici detayları.
      </SheetDescription>
    </SheetHeader>

    <Tabs defaultValue="general" className="space-y-5">
      <TabsList className="h-auto w-full flex-wrap justify-start">
        <TabsTrigger value="general">Özet</TabsTrigger>
        <TabsTrigger value="profile">Attribute Değerleri</TabsTrigger>
        <TabsTrigger value="claims">Talepler</TabsTrigger>
        <TabsTrigger value="editors">Düzenleyiciler</TabsTrigger>
        <TabsTrigger value="sources">Kaynaklar</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-5">
        {isPendingImport ? <ImportReviewSection onReview={onReview} /> : null}

        <RoleChangeSection
          currentRoleKey={detail.platformRoleKey}
          roles={roles}
          onRoleChange={onRoleChange}
          isClearable
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Temel Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <MetadataRow label="Tür" value={kindLabel("catalog_item")} />
              <MetadataRow label="Görünürlük" value={formatLabel(detail.visibility)} />
              <MetadataRow label="Platform Rolü" value={detail.platformRoleKey ?? "-"} />
              <MetadataRow label="Oluşturulma" value={formatDateTime(detail.createdAt)} />
              <MetadataRow label="Güncellenme" value={formatDateTime(detail.updatedAt)} />
              <MetadataRow label="Yayına Alınma" value={formatDateTime(detail.publishedAt)} />
              <MetadataRow label="Oluşturan Kullanıcı" value={detail.createdByUserId ?? "-"} />
              <MetadataRow label="Oluşturan E-posta" value={creatorEmail ?? "-"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Görünür Özet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>{detail.headline ?? "Başlık altı açıklama yok."}</p>
              <p>{detail.shortDescription ?? "Kısa açıklama yok."}</p>
              <p>{detail.longDescription ?? "Uzun açıklama yok."}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Kategori ve Lokasyon</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Kategoriler</div>
              <div className="flex flex-wrap gap-2">
                {detail.categories.length ? (
                  detail.categories.map((category) => (
                    <Badge
                      key={`${category.slug}-${category.isPrimary ? "primary" : "secondary"}`}
                      variant={category.isPrimary ? "secondary" : "outline"}
                    >
                      {category.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Kategori yok.</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <MapPin className="h-3.5 w-3.5" />
                Lokasyonlar
              </div>
              <div className="space-y-2">
                {detail.locations.length ? (
                  detail.locations.map((location, index) => (
                    <div key={`${location.city}-${location.countryCode}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      <div>{[location.city, location.countryCode].filter(Boolean).join(", ") || "Lokasyon bilgisi eksik"}</div>
                      <div className="text-xs text-muted-foreground">{location.addressLine ?? "-"}</div>
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Lokasyon kaydı yok.</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="profile">
        <CatalogEntityProfilePanel itemId={detail.id} />
      </TabsContent>

      <TabsContent value="claims">
        <CatalogClaimRequestsPanel itemId={detail.id} />
      </TabsContent>

      <TabsContent value="editors">
        <CatalogItemEditorsPanel itemId={detail.id} />
      </TabsContent>

      <TabsContent value="sources" className="space-y-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Kaynak Kayıtları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {detail.sources.length ? (
              detail.sources.map((source) => (
                <div key={`${source.sourceType}-${source.externalId}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{formatLabel(source.sourceType)}</Badge>
                    <span className="text-sm font-medium text-slate-900">{source.externalId}</span>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <div>Import: {formatDateTime(source.importedAt)}</div>
                    <div>Last seen: {formatDateTime(source.lastSeenAt)}</div>
                    <div className="break-all">URL: {source.sourceUrl ?? "-"}</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Bu kayıt için source record bulunamadı.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Attributes JSON</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-950 p-4 text-xs leading-6 text-slate-100">
              {JSON.stringify(detail.attributes, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
  );
};

export default CatalogDetailSheet;
