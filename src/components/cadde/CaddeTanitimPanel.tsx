// Tanıtım kampanya paneli (spec §15.3 — /profile?tab=tanitim karşılığı; ProfilePage'e
// CaddeInterestsCard gibi tek satırla monte edilir). Görünürlük persona string'i ile
// DEĞİL feature ile: cadde.promotion.create veya cadde.city.highlight_free yoksa ve
// kullanıcının mevcut kampanyası da yoksa panel render edilmez (spec §15.1).
// Kampanya 'pending' oluşur; admin onayıyla aktifleşir (admin_review RPC).

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";

import { useAuth } from "@/components/auth/useAuth";
import { useCaddeActorContext } from "@/hooks/cadde/useCaddeActorContext";
import { useCaddeDiasporaKey } from "@/hooks/cadde/useCaddeDiasporaKey";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  CADDE_PROMOTION_STATUS_LABELS,
  CADDE_PROMOTION_TYPE_LABELS,
  createPromotionCampaign,
  listMyPromotionCampaigns,
  listPromotionPlacementOptions,
} from "@/lib/cadde-tanitim-api";
import { caddeQueryKeys } from "@/lib/cadde-query-keys";
import type { CaddePromotionStatus, CaddePromotionType } from "@/lib/cadde-types";

const STATUS_BADGE_VARIANTS: Record<CaddePromotionStatus, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
};

const emptyForm = {
  campaignType: "business" as CaddePromotionType,
  title: "",
  description: "",
  targetUrl: "",
  imageUrl: "",
  placementKeys: [] as string[],
};

const CaddeTanitimPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const actorContextQuery = useCaddeActorContext(Boolean(user));
  const featureKeys = actorContextQuery.data?.featureKeys;
  const canCreatePaid = featureKeys?.has("cadde.promotion.create") ?? false;
  const canCreateHighlight = featureKeys?.has("cadde.city.highlight_free") ?? false;
  const canCreate = canCreatePaid || canCreateHighlight;

  const myCampaignsQuery = useQuery({
    queryKey: caddeQueryKeys.myPromotions(user?.id ?? null),
    queryFn: () => listMyPromotionCampaigns(user?.id ?? ""),
    enabled: Boolean(user?.id),
  });

  const placementsQuery = useQuery({
    queryKey: caddeQueryKeys.promotionPlacements,
    queryFn: listPromotionPlacementOptions,
    enabled: formOpen,
    staleTime: 1000 * 60 * 60,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createPromotionCampaign({
        campaignType: form.campaignType,
        title: form.title,
        description: form.description,
        targetUrl: form.targetUrl,
        imageUrl: form.imageUrl.trim() || undefined,
        placements: form.placementKeys.map((key) => ({ key, diaspora: diasporaKey })),
      }),
    onSuccess: async () => {
      setFormOpen(false);
      setForm(emptyForm);
      await queryClient.invalidateQueries({ queryKey: caddeQueryKeys.promotionsRoot });
      toast({ title: "Kampanya onaya gönderildi" });
    },
    onError: (error) => {
      toast({ title: "Kampanya oluşturulamadı", description: error instanceof Error ? error.message : "Bilinmeyen hata", variant: "destructive" });
    },
  });

  const campaigns = myCampaignsQuery.data ?? [];
  if (!user || (!canCreate && campaigns.length === 0)) return null;

  // Elçi yalnız ücretsiz highlight tipi/placement'ı görür (spec §15.1).
  const availableTypes = (Object.keys(CADDE_PROMOTION_TYPE_LABELS) as CaddePromotionType[]).filter((type) =>
    type === "city_highlight" ? canCreateHighlight || canCreatePaid : canCreatePaid,
  );
  const availablePlacements = (placementsQuery.data ?? []).filter((placement) =>
    form.campaignType === "city_highlight" ? placement.key === "city-ambassador-highlight" : true,
  );

  const togglePlacement = (key: string) => {
    setForm((current) => ({
      ...current,
      placementKeys: current.placementKeys.includes(key)
        ? current.placementKeys.filter((item) => item !== key)
        : [...current.placementKeys, key],
    }));
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-[11px]">
              <Megaphone className="h-3.5 w-3.5 text-orange-500" />
              Tanıtım Kampanyalarım
            </CardTitle>
            <CardDescription className="text-[11px]">
              Sponsorlu görünürlük kampanyaların; onaylanınca Cadde'de yayınlanır.
            </CardDescription>
          </div>
          {canCreate ? (
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
              <DialogTrigger asChild>
                <Button size="sm">Yeni Kampanya</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Yeni Tanıtım Kampanyası</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Kampanya tipi</Label>
                    <Select
                      value={form.campaignType}
                      onValueChange={(value) =>
                        setForm((current) => ({ ...current, campaignType: value as CaddePromotionType, placementKeys: [] }))
                      }
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {availableTypes.map((type) => (
                          <SelectItem key={type} value={type}>{CADDE_PROMOTION_TYPE_LABELS[type]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Başlık *</Label>
                    <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label>Açıklama *</Label>
                    <Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={3} maxLength={500} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hedef URL *</Label>
                    <Input value={form.targetUrl} onChange={(event) => setForm((current) => ({ ...current, targetUrl: event.target.value }))} placeholder="https://... veya /commercial/..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Görsel URL</Label>
                    <Input value={form.imageUrl} onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))} placeholder="https://..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Placementler * <span className="font-normal text-slate-500">(en az 1)</span></Label>
                    <div className="space-y-1.5">
                      {availablePlacements.map((placement) => {
                        const selected = form.placementKeys.includes(placement.key);
                        return (
                          <button
                            key={placement.key}
                            type="button"
                            onClick={() => togglePlacement(placement.key)}
                            className={`w-full rounded-xl border px-3 py-2 text-left text-xs transition ${
                              selected ? "border-orange-500 bg-orange-50" : "border-slate-200 bg-white hover:bg-slate-50"
                            }`}
                          >
                            <span className="font-medium text-slate-900">{placement.labelTr}</span>
                            {placement.description ? <span className="block text-slate-500">{placement.description}</span> : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Gönderiliyor..." : "Onaya Gönder"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {campaigns.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">Henüz kampanyan yok.</p>
        ) : (
          campaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold text-slate-900">{campaign.title}</p>
                  <Badge variant={STATUS_BADGE_VARIANTS[campaign.status]} className="text-[10px]">
                    {CADDE_PROMOTION_STATUS_LABELS[campaign.status]}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">{CADDE_PROMOTION_TYPE_LABELS[campaign.campaignType]}</Badge>
                </div>
                <p className="text-[11px] text-slate-500">{campaign.impressionCount} gösterim • {campaign.clickCount} tıklama</p>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">{campaign.placementKeys.join(", ")}</p>
              {campaign.status === "rejected" && campaign.reviewNote ? (
                <p className="mt-1 text-[11px] text-red-600">Red notu: {campaign.reviewNote}</p>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default CaddeTanitimPanel;
