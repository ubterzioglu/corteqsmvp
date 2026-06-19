// Taşınma Planlayıcı — ana sayfa. Wizard → move oluştur → öneri sekmeleri (veri-tabanlı).
// Eski mock RelocationEngine'in yerini alır (karar: ayrı modül, eski silindi).
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  createMove,
  getCityRecommendations,
  getServiceRecommendations,
  getChecklist,
  getEmergencyContacts,
  recordInteraction,
} from "@/lib/relocation-api";
import { relocationKeys } from "@/lib/relocation-query-keys";
import { getRelocationDict } from "@/lib/relocation-i18n";
import type { MoveCreateInput } from "@/lib/relocation-schemas";
import type {
  RelocationServiceCategory,
  RelocationStepTrigger,
} from "@/lib/relocation-types";
import { RelocationWizard, type CountryOption } from "@/components/relocation/RelocationWizard";
import { CityComparisonTable } from "@/components/relocation/CityComparisonTable";
import { ServiceRecommendationCard } from "@/components/relocation/ServiceRecommendationCard";
import { BureaucracyTimeline } from "@/components/relocation/BureaucracyTimeline";
import { EmergencyContactsPanel } from "@/components/relocation/EmergencyContactsPanel";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const SERVICE_CATEGORIES: RelocationServiceCategory[] = [
  "housing",
  "airline",
  "gsm_operator",
  "doctor",
  "community_hub",
];

/** Aktif lokasyonlardan distinct (country_code, ilk şehir adı) seçenekleri. */
async function fetchCountryOptions(): Promise<CountryOption[]> {
  const { data, error } = await db
    .from("relocation_locations")
    .select("country_code, city_name")
    .eq("is_active", true);
  if (error) throw error;
  const seen = new Map<string, string>();
  for (const row of (data ?? []) as Array<{ country_code: string; city_name: string }>) {
    if (!seen.has(row.country_code)) seen.set(row.country_code, row.country_code);
  }
  return Array.from(seen.entries()).map(([code]) => ({ code, label: code }));
}

export default function RelocationHomePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const dict = getRelocationDict("tr-TR");
  const [moveId, setMoveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("cities");
  const [serviceCategory, setServiceCategory] = useState<RelocationServiceCategory>("housing");

  const countryOptionsQuery = useQuery({
    queryKey: [...relocationKeys.all, "country-options"],
    queryFn: fetchCountryOptions,
  });

  const createMoveMutation = useMutation({
    mutationFn: (input: MoveCreateInput) => createMove(input),
    onSuccess: (res) => {
      setMoveId(res.move_id);
      queryClient.invalidateQueries({ queryKey: relocationKeys.all });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Beklenmeyen hata";
      toast({ title: "Plan oluşturulamadı", description: message, variant: "destructive" });
    },
  });

  const citiesQuery = useQuery({
    queryKey: moveId ? relocationKeys.locationRecommendations(moveId) : ["relocation", "noop"],
    queryFn: () => getCityRecommendations(moveId as string),
    enabled: !!moveId,
  });

  const servicesQuery = useQuery({
    queryKey: moveId
      ? relocationKeys.serviceRecommendations(moveId, serviceCategory)
      : ["relocation", "noop-svc"],
    queryFn: () => getServiceRecommendations(moveId as string, serviceCategory),
    enabled: !!moveId && activeTab === "services",
  });

  const checklistQuery = useQuery({
    queryKey: moveId ? relocationKeys.checklist(moveId) : ["relocation", "noop-chk"],
    queryFn: () => getChecklist(moveId as string),
    enabled: !!moveId && activeTab === "checklist",
  });

  // Event instrumentation (Faz 3): şehir önerileri görüntülenince impression yaz.
  // Eğitim veri havuzu (relocation_interactions) → ileride LTR feature extraction.
  const cityCount = citiesQuery.data?.length ?? 0;
  useEffect(() => {
    if (!moveId || cityCount === 0) return;
    void recordInteraction({
      move_id: moveId,
      entity_type: "location",
      event_type: "impression",
      context: { count: cityCount },
    }).catch(() => {
      /* instrumentation kritik değil — sessizce yut */
    });
  }, [moveId, cityCount]);

  // İlk şehir önerisinin ülkesinden acil iletişim (move'un ilk hedefi).
  const firstCountry = citiesQuery.data?.[0]?.country_code;
  const emergencyQuery = useQuery({
    queryKey: firstCountry
      ? relocationKeys.emergencyContacts(firstCountry)
      : ["relocation", "noop-emg"],
    queryFn: () => getEmergencyContacts(firstCountry as string),
    enabled: !!firstCountry && activeTab === "emergency",
  });

  const triggerLabels = useMemo(
    (): Record<RelocationStepTrigger, string> => ({
      before_departure: dict.checklist.before_departure,
      after_arrival: dict.checklist.after_arrival,
      ongoing: dict.checklist.ongoing,
    }),
    [dict],
  );

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 text-center">
        <span className="mb-1 block text-3xl">🌍</span>
        <h1 className="text-2xl font-extrabold text-foreground">{dict.title}</h1>
        <p className="text-sm text-muted-foreground">{dict.subtitle}</p>
      </div>

      {!moveId ? (
        <RelocationWizard
          countryOptions={countryOptionsQuery.data ?? []}
          labels={{
            targets: dict.wizard.targets,
            window: dict.wizard.window,
            budget: dict.wizard.budget,
            household: dict.wizard.household,
            adults: dict.wizard.adults,
            children: dict.wizard.children,
            mustHaves: dict.wizard.mustHaves,
            submit: dict.wizard.submit,
          }}
          onSubmit={(input) => createMoveMutation.mutate(input)}
          isSubmitting={createMoveMutation.isPending}
        />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="cities">{dict.tabs.cities}</TabsTrigger>
            <TabsTrigger value="services">{dict.tabs.services}</TabsTrigger>
            <TabsTrigger value="checklist">{dict.tabs.checklist}</TabsTrigger>
            <TabsTrigger value="emergency">{dict.tabs.emergency}</TabsTrigger>
          </TabsList>

          <TabsContent value="cities">
            <CityComparisonTable
              recommendations={citiesQuery.data ?? []}
              emptyLabel={dict.cities.empty}
              whyLabel={dict.cities.why}
            />
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {SERVICE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setServiceCategory(cat)}
                  className={`rounded-full px-3 py-1 text-xs transition-colors ${
                    serviceCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  }`}
                >
                  {dict.services[cat]}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {(servicesQuery.data ?? []).map((service) => (
                <ServiceRecommendationCard key={service.id} service={service} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="checklist">
            <BureaucracyTimeline
              steps={checklistQuery.data ?? []}
              triggerLabels={triggerLabels}
              documentsLabel={dict.checklist.documents}
              deadlineLabel={dict.checklist.deadline}
              emptyLabel={dict.checklist.empty}
            />
          </TabsContent>

          <TabsContent value="emergency">
            <EmergencyContactsPanel
              contacts={emergencyQuery.data ?? []}
              emptyLabel={dict.emergency.empty}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
