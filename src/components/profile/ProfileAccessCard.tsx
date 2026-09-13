import { ChevronDown } from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CurrentUserDashboardFeature } from "@/hooks/useCurrentUserDashboard";
import type { FlatRoleOption } from "@/lib/flat-roles-api";
import type { PendingApprovalSummary, ProfileFeatureState } from "@/lib/member-profile";
import { REQUESTABLE_FEATURES } from "@/lib/profile-requestable-features";

import {
  AMBER_BUTTON_OUTLINE,
  AMBER_BUTTON_PRIMARY,
  GOOGLE_SOFT_CARD_RED_SECTION,
  GOOGLE_SOFT_CARD_SUBTLE,
} from "./profile-card-styles";

export type ProfileAccessCardProps = {
  open: boolean;
  onOpenToggle: () => void;
  roleRequestTarget: string;
  onRoleRequestTargetChange: (value: string) => void;
  roleRequestNote: string;
  onRoleRequestNoteChange: (value: string) => void;
  availableRoleTargets: FlatRoleOption[];
  flatRolesLoading: boolean;
  submittingRoleRequest: boolean;
  onSubmitRoleRequest: () => void;
  featureMap: Map<string, ProfileFeatureState>;
  pendingRequests: PendingApprovalSummary[];
  featureRequestingKey: string | null;
  onRequestFeature: (featureKey: string) => void;
  isDashboardLoading: boolean;
  dashboardItems: CurrentUserDashboardFeature[];
};

/** Rol başvurusu, feature talepleri, açık dashboard erişimleri ve bekleyen talepler. */
export const ProfileAccessCard = ({
  open,
  onOpenToggle,
  roleRequestTarget,
  onRoleRequestTargetChange,
  roleRequestNote,
  onRoleRequestNoteChange,
  availableRoleTargets,
  flatRolesLoading,
  submittingRoleRequest,
  onSubmitRoleRequest,
  featureMap,
  pendingRequests,
  featureRequestingKey,
  onRequestFeature,
  isDashboardLoading,
  dashboardItems,
}: ProfileAccessCardProps) => {
  return (
    <Card className={`overflow-hidden ${GOOGLE_SOFT_CARD_RED_SECTION}`}>
      <CardHeader className="p-0">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 rounded-[30px] px-6 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-expanded={open}
          aria-controls="access-card-content"
          onClick={onOpenToggle}
        >
          <div className="space-y-1">
            <CardTitle className="text-[11px]">Başvurular & Erişimler</CardTitle>
            <CardDescription className="text-[11px]">
              Rol başvurularını, feature taleplerini, açık erişimlerini ve bekleyen süreçlerini tek kartta yönet.
            </CardDescription>
          </div>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </CardHeader>
      {open ? (
        <CardContent id="access-card-content" className="pt-0">
          <Accordion type="multiple" className="space-y-2">
            <AccordionItem value="role-request" className={`overflow-hidden rounded-lg px-3 ${GOOGLE_SOFT_CARD_SUBTLE}`}>
              <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                Rol Başvurusu
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pb-3">
                <p className="text-xs text-muted-foreground">Tek aktif rol modeli korunur. Yeni rol için başvuru admin onayına düşer.</p>
                <Select value={roleRequestTarget} onValueChange={onRoleRequestTargetChange}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder={flatRolesLoading ? "Roller yükleniyor..." : "Başvurmak istediğin rolü seç"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoleTargets.map((option) => (
                      <SelectItem key={option.key} value={option.key}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  value={roleRequestNote}
                  onChange={(event) => onRoleRequestNoteChange(event.target.value)}
                  placeholder="Kısa bir açıklama veya ek bilgi yazabilirsin."
                  className="min-h-[60px] text-sm"
                />
                <Button size="sm" className={`w-full ${AMBER_BUTTON_PRIMARY}`} disabled={!roleRequestTarget || submittingRoleRequest} onClick={onSubmitRoleRequest}>
                  {submittingRoleRequest ? "Gönderiliyor..." : "Rol Başvurusu Gönder"}
                </Button>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="feature-requests" className={`overflow-hidden rounded-lg px-3 ${GOOGLE_SOFT_CARD_SUBTLE}`}>
              <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                Özellik Talepleri
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pb-3">
                <p className="text-xs text-muted-foreground">Kapalı veya onay gerektiren akışlar için tek tıkla talep bırak.</p>
                {REQUESTABLE_FEATURES.map((item) => {
                  const state = featureMap.get(item.key);
                  const isPending = pendingRequests.some((request) => request.targetFeatureKey === item.key);
                  return (
                    <div key={item.key} className={`rounded-lg p-2 ${GOOGLE_SOFT_CARD_SUBTLE}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">Kaynak: {state?.source ?? "fallback"}</Badge>
                            {isPending ? <Badge variant="outline" className="text-[10px] px-1.5 py-0">Beklemede</Badge> : null}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className={`shrink-0 text-xs h-7 px-2 ${AMBER_BUTTON_OUTLINE}`}
                          disabled={Boolean(state?.isEnabled) || isPending || featureRequestingKey === item.key}
                          onClick={() => onRequestFeature(item.key)}
                        >
                          {featureRequestingKey === item.key ? "Gönderiliyor..." : state?.isEnabled ? "Aktif" : "Talep Et"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="dashboard-access" className={`overflow-hidden rounded-lg px-3 ${GOOGLE_SOFT_CARD_SUBTLE}`}>
              <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                Açık Dashboard Erişimleri
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pb-3">
                <p className="text-xs text-muted-foreground">
                  Rolün ve override kayıtlarınla şu anda açık olan dashboard tabları.
                </p>
                {isDashboardLoading ? <p className="text-xs text-muted-foreground">Dashboard erişimleri yükleniyor...</p> : null}
                {!isDashboardLoading && dashboardItems.length ? (
                  dashboardItems.map((item) => (
                    <div key={item.feature_key} className={`rounded-lg p-2 ${GOOGLE_SOFT_CARD_SUBTLE}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.description ?? item.feature_key}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {item.source}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : null}
                {!isDashboardLoading && dashboardItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Açık dashboard modülü bulunamadı.</p>
                ) : null}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="pending-requests" className={`overflow-hidden rounded-lg px-3 ${GOOGLE_SOFT_CARD_SUBTLE}`}>
              <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                Bekleyen Talepler
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pb-3">
                <p className="text-xs text-muted-foreground">
                  Admin değerlendirmesi bekleyen son işlemler burada görünür.
                </p>
                {pendingRequests.length ? (
                  pendingRequests.map((request) => (
                    <div key={request.id} className={`rounded-lg p-2 ${GOOGLE_SOFT_CARD_SUBTLE}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{request.requestType}</p>
                          <p className="text-xs text-muted-foreground">{new Date(request.createdAt).toLocaleString("tr-TR")}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">Pending</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">Şu anda bekleyen talebin yok.</p>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      ) : null}
    </Card>
  );
};

export default ProfileAccessCard;
