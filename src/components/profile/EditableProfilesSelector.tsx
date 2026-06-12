import { ArrowRight, Building2, ShieldCheck, Sparkles, UserCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { EditableCatalogItemSummary } from "@/lib/member-catalog";
import {
  isExperimental2Presentation,
  resolveProfilePresentation,
} from "@/lib/profile-presentation";
import { getUiProfileType, roleMetaByLegacyKey } from "@/lib/profile-types";

type EditableProfilesSelectorProps = {
  items: EditableCatalogItemSummary[];
  onSelect: (item: EditableCatalogItemSummary) => void;
};

const iconByItemType: Record<string, typeof UserCircle2> = {
  member: UserCircle2,
  advisor: ShieldCheck,
  business: Building2,
  organization: Building2,
  community_group: Building2,
};

const ACCESS_LEVEL_LABELS: Record<EditableCatalogItemSummary["accessLevel"], string> = {
  owner: "Sahip",
  manager: "Yönetici",
  editor: "Editör",
};

const EditableProfilesSelector = ({ items, onSelect }: EditableProfilesSelectorProps) => {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Düzenlemek istediğin profili seç
        </h1>
        <p className="text-sm text-muted-foreground">
          Hesabına bağlı birden fazla profil var. Kişisel profiline veya yönettiğin katalog
          profillerinden birine devam edebilirsin.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => {
          const Icon = iconByItemType[item.itemType] ?? UserCircle2;
          const isPilotProfile = isExperimental2Presentation(
            resolveProfilePresentation(item.roleKey),
          );
          return (
            <Card
              key={item.itemId}
              className="rounded-[22px] border-border bg-card/90 shadow-sm transition-shadow hover:shadow-md motion-reduce:transition-none"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl border border-border bg-muted/50 p-3">
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="break-words text-lg">{item.title}</CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-1.5">
                      <span>
                        {item.roleKey
                          ? roleMetaByLegacyKey[getUiProfileType(item.roleKey)].adminLabel
                          : item.itemType}
                      </span>
                      <span aria-hidden="true">•</span>
                      <span>{ACCESS_LEVEL_LABELS[item.accessLevel] ?? item.accessLevel}</span>
                      {isPilotProfile ? (
                        <Badge className="gap-1 rounded-full border-violet-500/30 bg-violet-500/15 text-[11px] font-medium text-violet-700 dark:text-violet-400">
                          <Sparkles className="h-3 w-3" aria-hidden="true" />
                          Premium Pilot
                        </Badge>
                      ) : null}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  {item.itemType === "member"
                    ? "Bu seçenek kişisel profil editörünü açar."
                    : "Bu seçenek katalog tabanlı profil editörünü açar."}
                </p>
                <Button
                  type="button"
                  className="min-h-[44px] w-full justify-between rounded-full sm:min-h-10"
                  onClick={() => onSelect(item)}
                >
                  Profili Aç
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default EditableProfilesSelector;
