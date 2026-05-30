import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type PublicProfileSectionRow = {
  section_key: string;
  section_area: "preview_card" | "detail_card";
  label: string;
  component_name: string | null;
  sort_order: number;
  content: Record<string, unknown> | null;
};

const DirectoryProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const [sections, setSections] = useState<PublicProfileSectionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let isMounted = true;

    void (async () => {
      setIsLoading(true);
      setErrorMessage(null);
      const { data, error } = await (supabase as any).rpc("get_public_profile_sections", { target_user_id: userId });

      if (!isMounted) return;

      if (error) {
        setErrorMessage(error.message);
        setSections([]);
        setIsLoading(false);
        return;
      }

      setSections((data ?? []) as PublicProfileSectionRow[]);
      setIsLoading(false);
    })();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const previewSections = useMemo(
    () => sections.filter((section) => section.section_area === "preview_card").sort((left, right) => left.sort_order - right.sort_order),
    [sections],
  );
  const detailSections = useMemo(
    () => sections.filter((section) => section.section_area === "detail_card").sort((left, right) => left.sort_order - right.sort_order),
    [sections],
  );

  const displayName =
    previewSections.find((section) => section.section_key === "preview.isim_kurulus_adi")?.content?.text;
  const locationSection = previewSections.find((section) => section.section_key === "preview.konum");
  const imageSection = previewSections.find((section) => section.section_key === "preview.profil_logo_gorseli");
  const categorySection = previewSections.find((section) => section.section_key === "preview.kategori_sektor_etiketi");
  const imageUrl = typeof imageSection?.content?.url === "string" ? imageSection.content.url : null;
  const locationLabel = [locationSection?.content?.city, locationSection?.content?.country].filter(Boolean).join(" • ");
  const taxonomyLabels = Array.isArray(categorySection?.content?.taxonomy)
    ? categorySection.content.taxonomy.filter((item): item is string => typeof item === "string")
    : [];
  const primaryLabel = typeof categorySection?.content?.primary_label === "string" ? categorySection.content.primary_label : null;

  if (!userId) {
    return <Navigate to="/directory" replace />;
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="mb-4">
        <Button asChild variant="outline">
          <Link to="/directory">Directory'ye Dön</Link>
        </Button>
      </div>

      <Card className="border-slate-200 bg-white/90 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-muted">
              {imageUrl ? <img src={imageUrl} alt={String(displayName ?? "Profil görseli")} className="h-full w-full object-cover" /> : null}
              {!imageUrl ? <span className="text-xs text-muted-foreground">Görsel yok</span> : null}
            </div>
            <div className="min-w-0 space-y-2">
              <CardTitle>{String(displayName ?? "Profil")}</CardTitle>
              <CardDescription>{locationLabel || "Public profile section renderer"}</CardDescription>
              <div className="flex flex-wrap gap-1.5">
                {primaryLabel ? <Badge variant="secondary">{primaryLabel}</Badge> : null}
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
          {isLoading ? <p className="text-sm text-muted-foreground">Profil yükleniyor...</p> : null}
          {errorMessage ? <p className="text-sm text-destructive">Profil alınamadı: {errorMessage}</p> : null}

          {!isLoading && !errorMessage && sections.length === 0 ? (
            <p className="text-sm text-muted-foreground">Bu profil görünür değil veya yayınlanmış public section içermiyor.</p>
          ) : null}

          {detailSections.map((section) => (
            <ProfileSectionRenderer key={section.section_key} section={section} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

const ProfileSectionRenderer = ({ section }: { section: PublicProfileSectionRow }) => {
  const content = section.content ?? {};

  if (section.component_name === "rich_text") {
    const text = typeof content.text === "string" ? content.text : null;
    if (!text) return null;

    return (
      <div className="rounded-xl border p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{section.label}</p>
        <p className="mt-2 whitespace-pre-wrap text-base">{text}</p>
      </div>
    );
  }

  if (section.component_name === "badges") {
    const groups = content.groups as Record<string, Array<{ key: string; label: string }>> | undefined;
    const allLabels = groups
      ? Object.values(groups).flatMap((items) => items.map((item) => item.label))
      : Array.isArray(content.taxonomy)
        ? content.taxonomy.filter((item): item is string => typeof item === "string")
        : [];

    if (!allLabels.length) return null;

    return (
      <div className="rounded-xl border p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{section.label}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {allLabels.map((label) => (
            <Badge key={label} variant="outline">
              {label}
            </Badge>
          ))}
        </div>
      </div>
    );
  }

  if (section.component_name === "links") {
    const links = Array.isArray(content.links)
      ? content.links.filter(
          (item): item is { label: string; url: string } =>
            Boolean(item) && typeof item === "object" && typeof item.label === "string" && typeof item.url === "string",
        )
      : [];

    if (!links.length) return null;

    return (
      <div className="rounded-xl border p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{section.label}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {links.map((link) => (
            <a
              key={`${link.label}:${link.url}`}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border px-3 py-1.5 text-sm text-primary transition hover:bg-primary/5"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default DirectoryProfilePage;
