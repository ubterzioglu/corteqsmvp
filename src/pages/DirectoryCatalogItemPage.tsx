import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

import ProfileHeroCard from "@/components/directory/ProfileHeroCard";
import { useAuth } from "@/components/auth/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type CatalogDetailRow = {
  id: string;
  item_type: string;
  platform_role_key: string | null;
  slug: string;
  title: string;
  headline: string | null;
  short_description: string | null;
  long_description: string | null;
  verification_status: string;
  attributes: Record<string, unknown> | null;
  catalog_item_contacts?: Array<{
    contact_type: string;
    contact_value: string;
    label: string | null;
    is_primary: boolean;
  }> | null;
  catalog_item_locations?: Array<{
    country_code: string | null;
    city: string | null;
    region: string | null;
    address_line: string | null;
    is_primary: boolean;
  }> | null;
  catalog_item_services?: Array<{
    service_name: string;
    description: string | null;
  }> | null;
  catalog_item_languages?: Array<{
    language_code: string;
    proficiency: string | null;
  }> | null;
  catalog_item_categories?: Array<{
    is_primary: boolean;
    catalog_categories?: { slug: string; name: string } | { slug: string; name: string }[] | null;
  }> | null;
};

type SupabaseError = { message: string };

type CatalogClaimRpcClient = {
  rpc: (
    functionName: "get_catalog_item_public_profile" | "submit_catalog_claim_request",
    args: Record<string, unknown>,
  ) => Promise<{ data: CatalogDetailRow | null; error: SupabaseError | null }>;
};

const catalogClient = supabase as unknown as CatalogClaimRpcClient;

const countryLabels: Record<string, string> = {
  DE: "Almanya",
  GB: "İngiltere",
  US: "ABD",
  FR: "Fransa",
  QA: "Katar",
  AE: "BAE",
};

const readTextAttribute = (attributes: Record<string, unknown> | null | undefined, key: string) => {
  const value = attributes?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
};

const normalizeCategoryRows = (rows: CatalogDetailRow["catalog_item_categories"]) =>
  (rows ?? [])
    .flatMap((row) => {
      const category = row.catalog_categories;
      if (!category) return [];
      return Array.isArray(category) ? category : [category];
    })
    .filter((category): category is { slug: string; name: string } => Boolean(category?.slug && category?.name));

const DirectoryCatalogItemPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const [item, setItem] = useState<CatalogDetailRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [claimStatus, setClaimStatus] = useState<"idle" | "submitting" | "submitted">("idle");
  const [claimError, setClaimError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;

    void (async () => {
      setIsLoading(true);
      setErrorMessage(null);

      const { data, error } = await catalogClient.rpc("get_catalog_item_public_profile", {
        p_slug: slug,
      });

      if (!isMounted) return;

      if (error) {
        setErrorMessage(error.message);
        setItem(null);
      } else if (!data || !data.id) {
        setItem(null);
      } else {
        setItem(data);
      }

      setIsLoading(false);
    })();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const primaryLocation = useMemo(
    () => item?.catalog_item_locations?.find((location) => location.is_primary) ?? item?.catalog_item_locations?.[0] ?? null,
    [item],
  );
  const categories = useMemo(() => normalizeCategoryRows(item?.catalog_item_categories), [item]);
  const roleLabel =
    readTextAttribute(item?.attributes, "platform_role_label") ??
    item?.platform_role_key ??
    readTextAttribute(item?.attributes, "platform_role_key") ??
    item?.item_type;
  const locationLabel = [
    primaryLocation?.city,
    primaryLocation?.country_code ? countryLabels[primaryLocation.country_code] ?? primaryLocation.country_code : null,
  ]
    .filter(Boolean)
    .join(" • ");
  const canClaim = item && item.verification_status !== "claimed";
  const loginHref = `/login?mode=signup&next=${encodeURIComponent(`/directory/catalog/${slug ?? ""}`)}`;

  const submitClaim = async () => {
    if (!item || !user) return;
    setClaimStatus("submitting");
    setClaimError(null);

    const { error } = await catalogClient.rpc("submit_catalog_claim_request", {
      target_item_id: item.id,
      claim_type: "editor_access",
      evidence: { source: "directory_catalog_page", slug: item.slug },
      note: "Directory catalog item editor access request",
    });

    if (error) {
      setClaimStatus("idle");
      setClaimError(error.message);
      return;
    }

    setClaimStatus("submitted");
  };

  if (!slug) {
    return <Navigate to="/directory" replace />;
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="mb-4">
        <Button asChild variant="outline">
          <Link to="/directory">Directory'ye Dön</Link>
        </Button>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Katalog kaydı yükleniyor...</p> : null}
      {errorMessage ? <p className="text-sm text-destructive">Kayıt alınamadı: {errorMessage}</p> : null}
      {!isLoading && !errorMessage && !item ? (
        <p className="text-sm text-muted-foreground">Bu katalog kaydı bulunamadı veya bu hesap için görünür değil.</p>
      ) : null}

      {item ? (
        <ProfileHeroCard
          title={item.title}
          subtitle={item.headline ?? null}
          roleLabel={roleLabel ?? null}
          locationLabel={locationLabel || null}
          imageUrl={null}
          badges={[
            ...categories.map((category) => ({
              label: category.name,
              variant: "outline" as const,
            })),
            item.verification_status === "claimed"
              ? { label: "Claimed", variant: "default" as const }
              : { label: "Claimable", variant: "outline" as const },
          ]}
          actions={
            canClaim && !authLoading ? (
              user ? (
                <Button onClick={() => void submitClaim()} disabled={claimStatus !== "idle"}>
                  {claimStatus === "submitted"
                    ? "Talep Gonderildi"
                    : claimStatus === "submitting"
                      ? "Gonderiliyor..."
                      : "Bu Sayfayi Duzenlemek Istiyorum"}
                </Button>
              ) : (
                <Button asChild>
                  <Link to={loginHref}>Duzenleme Yetkisi Icin Giris Yap</Link>
                </Button>
              )
            ) : null
          }
        >
          {claimError ? <p className="text-sm text-destructive">Claim talebi gönderilemedi: {claimError}</p> : null}
          {claimStatus === "submitted" ? (
            <p className="text-sm text-emerald-700">Düzenleme yetkisi talebiniz admin onayına gönderildi.</p>
          ) : null}

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>{item.short_description ?? item.long_description ?? "Açıklama eklenmedi."}</p>
            {canClaim ? (
              <p>
                Bu katalog kaydının sahibi ya da yetkili temsilcisiyseniz içeriği düzenleyebilmek için başvurabilirsiniz.
              </p>
            ) : null}
            {locationLabel ? <p>{locationLabel}</p> : null}
            {primaryLocation?.address_line ? <p>{primaryLocation.address_line}</p> : null}
          </div>

          {item.catalog_item_contacts?.length ? (
            <section className="space-y-2">
              <h2 className="text-base font-semibold">İletişim</h2>
              <div className="grid gap-2 text-sm text-muted-foreground">
                {item.catalog_item_contacts.map((contact) => (
                  <p key={`${contact.contact_type}-${contact.contact_value}`}>
                    <span className="font-medium text-foreground">{contact.label ?? contact.contact_type}:</span>{" "}
                    {contact.contact_type === "website" || contact.contact_type === "appointment_url" ? (
                      <a className="text-primary underline-offset-4 hover:underline" href={contact.contact_value} target="_blank" rel="noreferrer">
                        {contact.contact_value}
                      </a>
                    ) : (
                      contact.contact_value
                    )}
                  </p>
                ))}
              </div>
            </section>
          ) : null}

          {item.catalog_item_services?.length ? (
            <section className="space-y-2">
              <h2 className="text-base font-semibold">Hizmetler</h2>
              <div className="flex flex-wrap gap-2">
                {item.catalog_item_services.map((service) => (
                  <Badge key={service.service_name} variant="outline">
                    {service.service_name}
                  </Badge>
                ))}
              </div>
            </section>
          ) : null}
        </ProfileHeroCard>
      ) : null}
    </div>
  );
};

export default DirectoryCatalogItemPage;
