// Admin Panel V2 — tek kaynaklı navigasyon registry'si.
// Desktop sidebar, mobil drawer, command palette, breadcrumb ve dashboard
// hızlı navigasyonu BU dosyadan beslenir; başka yerde link listesi tutulmaz.
// URL path'leri App.tsx'teki mevcut route ağacıyla birebir aynıdır ve
// değiştirilemez (masterplan §4.3). Görünür isim ve gruplama değişebilir.
//
// Gruplar `admin-navigation-registry/` altındaki dosyalarda tutulur; bu dosya
// yalnız onları sıraya dizer. AŞAĞIDAKİ SIRA = menüde görünen sıra; yeni bir
// grup eklerken hem grup dosyasını oluştur hem de bu listeye doğru yere ekle.

import type { AdminNavGroup } from "./admin-shell-types";
import { overviewNavGroup } from "./admin-navigation-registry/overview";
import { membersNavGroup } from "./admin-navigation-registry/members";
import { rolesAfsNavGroup } from "./admin-navigation-registry/roles-afs";
import { communitiesNavGroup } from "./admin-navigation-registry/communities";
import { contentNavGroup } from "./admin-navigation-registry/content";
import { workspaceNavGroup } from "./admin-navigation-registry/workspace";
import { workshopNavGroup } from "./admin-navigation-registry/workshop";
import { muhasebeNavGroup } from "./admin-navigation-registry/muhasebe";
import { serviceFinderNavGroup } from "./admin-navigation-registry/service-finder";
import { relocationIngestionNavGroup } from "./admin-navigation-registry/relocation-ingestion";
import { radarNavGroup } from "./admin-navigation-registry/radar";
import { kadroNavGroup } from "./admin-navigation-registry/kadro";
import { linksNavGroup } from "./admin-navigation-registry/links";
import { systemNavGroup } from "./admin-navigation-registry/system";

export const adminNavGroups: AdminNavGroup[] = [
  overviewNavGroup,
  membersNavGroup,
  rolesAfsNavGroup,
  communitiesNavGroup,
  contentNavGroup,
  workspaceNavGroup,
  workshopNavGroup,
  muhasebeNavGroup,
  serviceFinderNavGroup,
  relocationIngestionNavGroup,
  radarNavGroup,
  kadroNavGroup,
  linksNavGroup,
  systemNavGroup,
];
