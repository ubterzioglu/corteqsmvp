import { ArrowRight, Building2, ShieldCheck, UserCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { EditableCatalogItemSummary } from "@/lib/member-catalog";

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

const EditableProfilesSelector = ({ items, onSelect }: EditableProfilesSelectorProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Duzenlemek istedigin profili sec.</h1>
        <p className="text-sm text-muted-foreground">
          Hesabina bagli birden fazla profil var. Kisisel profiline veya yonettigin katalog profillerinden birine devam edebilirsin.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => {
          const Icon = iconByItemType[item.itemType] ?? UserCircle2;
          return (
            <Card key={item.itemId} className="border-slate-200 bg-white/90 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>
                      {item.roleKey ?? item.itemType} • {item.accessLevel}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-xs text-muted-foreground">
                  {item.itemType === "member"
                    ? "Bu secenek mevcut profil editorunu acar."
                    : "Bu secenek katalog tabanli profil editorunu acar."}
                </div>
                <Button type="button" className="w-full justify-between" onClick={() => onSelect(item)}>
                  Profili Ac
                  <ArrowRight className="h-4 w-4" />
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
