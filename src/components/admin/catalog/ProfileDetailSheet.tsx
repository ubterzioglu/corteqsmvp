import { UserRound } from "lucide-react";

import MetadataRow from "@/components/admin/catalog/MetadataRow";
import RoleChangeSection from "@/components/admin/catalog/RoleChangeSection";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { AdminCatalogRoleOption } from "@/lib/admin-catalog";
import { formatDateTime, formatLabel } from "@/lib/admin-catalog-display";
import type { UnifiedRecord } from "@/lib/catalog-types";

const ProfileDetailSheet = ({
  profile,
  roles,
  onRoleChange,
}: {
  profile: UnifiedRecord;
  roles: AdminCatalogRoleOption[];
  onRoleChange: (roleKey: string) => void;
}) => (
  <div className="space-y-6">
    <SheetHeader>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">Kullanıcı</Badge>
        <Badge variant="outline">{profile.profileType ? formatLabel(profile.profileType) : "-"}</Badge>
        <Badge variant="secondary">{formatLabel(profile.status)}</Badge>
      </div>
      <SheetTitle>{profile.title}</SheetTitle>
      <SheetDescription>Kullanıcı profiline ait unified admin özeti.</SheetDescription>
    </SheetHeader>

    <RoleChangeSection
      currentRoleKey={profile.platformRoleKey}
      roles={roles}
      onRoleChange={(roleKey) => roleKey && onRoleChange(roleKey)}
    />

    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Profil Özeti</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <MetadataRow label="Tür" value="Kullanıcı" />
        <MetadataRow label="Profil Tipi" value={profile.profileType ? formatLabel(profile.profileType) : "-"} />
        <MetadataRow label="Platform Rolü" value={profile.platformRoleKey ?? "-"} />
        <MetadataRow label="E-posta" value={profile.email ?? "-"} />
        <MetadataRow label="Şehir" value={profile.primaryCity ?? "-"} />
        <MetadataRow label="Ülke" value={profile.primaryCountryCode ?? "-"} />
        <MetadataRow label="Oluşturulma" value={formatDateTime(profile.createdAt)} />
        <MetadataRow label="Güncellenme" value={formatDateTime(profile.updatedAt)} />
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Admin Notu</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <UserRound className="h-4 w-4" />
          Bu görünüm profile-uygun özet sunar. Kataloga özel rol, claim ve editor panelleri yalnız katalog item kayıtlarında açılır.
        </div>
      </CardContent>
    </Card>
  </div>
);

export default ProfileDetailSheet;
