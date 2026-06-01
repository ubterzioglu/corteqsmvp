import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PublicProfileSummaryView from "@/components/profile/PublicProfileSummaryView";
import { supabase } from "@/integrations/supabase/client";
import { usePublicIndividualProfile } from "@/hooks/usePublicIndividualProfile";
import IndividualPublicView from "@/components/profile/IndividualPublicView";
import {
  buildPublicProfileViewModelFromSections,
  type PublicProfileSectionRow,
} from "@/lib/profile-view-model";

const DirectoryProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();

  // Individual profile (bireysel) — fetched in parallel with generic sections
  const { details: individualDetails, isLoading: isIndividualLoading } =
    usePublicIndividualProfile(userId);

  // Generic section-based profile (consultants, businesses, orgs, etc.)
  const [sections, setSections] = useState<PublicProfileSectionRow[]>([]);
  const [isSectionsLoading, setIsSectionsLoading] = useState(true);
  const [sectionsError, setSectionsError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let isMounted = true;

    void (async () => {
      setIsSectionsLoading(true);
      setSectionsError(null);
      const { data, error } = await (supabase as any).rpc("get_public_profile_sections", {
        target_user_id: userId,
      });
      if (!isMounted) return;
      if (error) {
        setSectionsError(error.message);
        setSections([]);
      } else {
        setSections((data ?? []) as PublicProfileSectionRow[]);
      }
      setIsSectionsLoading(false);
    })();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const previewSections = useMemo(
    () =>
      sections
        .filter((s) => s.section_area === "preview_card")
        .sort((a, b) => a.sort_order - b.sort_order),
    [sections],
  );
  const detailSections = useMemo(
    () =>
      sections
        .filter((s) => s.section_area === "detail_card")
        .sort((a, b) => a.sort_order - b.sort_order),
    [sections],
  );

  const displayName = previewSections.find(
    (s) => s.section_key === "preview.isim_kurulus_adi",
  )?.content?.text;
  const locationSection = previewSections.find((s) => s.section_key === "preview.konum");
  const imageSection = previewSections.find((s) => s.section_key === "preview.profil_logo_gorseli");
  const categorySection = previewSections.find(
    (s) => s.section_key === "preview.kategori_sektor_etiketi",
  );
  const imageUrl =
    typeof imageSection?.content?.url === "string" ? imageSection.content.url : null;
  const locationLabel = [locationSection?.content?.city, locationSection?.content?.country]
    .filter(Boolean)
    .join(" • ");
  const taxonomyLabels = Array.isArray(categorySection?.content?.taxonomy)
    ? categorySection.content.taxonomy.filter((item): item is string => typeof item === "string")
    : [];
  const primaryLabel =
    typeof categorySection?.content?.primary_label === "string"
      ? categorySection.content.primary_label
      : null;
  const genericProfileModel = useMemo(
    () => buildPublicProfileViewModelFromSections(userId, sections),
    [sections, userId],
  );

  if (!userId) {
    return <Navigate to="/directory" replace />;
  }

  const isLoading = isIndividualLoading && isSectionsLoading;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="mb-4">
        <Button asChild variant="outline">
          <Link to="/directory">Directory'ye Dön</Link>
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Profil yükleniyor...</p>
      ) : null}

      {/* Individual (bireysel) profile view */}
      {!isIndividualLoading && individualDetails ? (
        <IndividualPublicView details={individualDetails} />
      ) : null}

      {/* Generic section-based profile (non-individual types) */}
      {!isIndividualLoading && !individualDetails && !isSectionsLoading ? (
        <Card className="border-slate-200 bg-white/90 shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-muted">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={String(displayName ?? "Profil görseli")}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">Görsel yok</span>
                )}
              </div>
              <div className="min-w-0 space-y-2">
                <CardTitle>{String(displayName ?? "Profil")}</CardTitle>
                <CardDescription>
                  {locationLabel || "Public profile section renderer"}
                </CardDescription>
                <div className="flex flex-wrap gap-1.5">
                  {primaryLabel ? (
                    <Badge variant="secondary">{primaryLabel}</Badge>
                  ) : null}
                  {taxonomyLabels.map((label) => (
                    <Badge key={label} variant="outline">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {sectionsError ? (
              <p className="text-sm text-destructive">Profil alınamadı: {sectionsError}</p>
            ) : null}
            {!sectionsError && sections.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Bu profil görünür değil veya yayınlanmış public section içermiyor.
              </p>
            ) : null}
            {!sectionsError && sections.length > 0 ? <PublicProfileSummaryView model={genericProfileModel} /> : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default DirectoryProfilePage;
