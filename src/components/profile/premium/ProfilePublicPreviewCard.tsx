import { ExternalLink, Eye } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ProfilePublicPreviewCardProps = {
  /** Real catalog slug; the CTA renders only when this exists. */
  slug: string | null;
  isLoading: boolean;
};

/**
 * Public preview CTA card. Never invents a slug: with no member catalog item
 * it shows a friendly passive state instead of a broken link.
 */
const ProfilePublicPreviewCard = ({ slug, isLoading }: ProfilePublicPreviewCardProps) => (
  <Card className="rounded-[22px] border-border bg-background/70">
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base font-semibold">
        <Eye className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden="true" />
        Public Önizleme
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <p className="text-xs leading-relaxed text-muted-foreground">
        Profilinin ziyaretçilere nasıl göründüğünü kontrol et. Görünür alanların public profilde
        anında yansır.
      </p>
      {isLoading ? (
        <p className="text-xs text-muted-foreground">Public profil bağlantısı hazırlanıyor...</p>
      ) : slug ? (
        <Button asChild className="min-h-[44px] w-full rounded-full sm:min-h-9">
          <Link to={`/directory/catalog/${slug}`}>
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Public Profili Görüntüle
          </Link>
        </Button>
      ) : (
        <p className="rounded-xl border border-dashed border-border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
          Public profilin henüz hazır değil. Katalog kaydın oluşturulduğunda bu alandan
          önizleyebileceksin.
        </p>
      )}
    </CardContent>
  </Card>
);

export default ProfilePublicPreviewCard;
