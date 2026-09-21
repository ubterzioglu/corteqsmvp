// Taşınma Planlayıcı — ana sayfa. Wizard → move oluştur → öneri sekmeleri (veri-tabanlı).
// Eski mock RelocationEngine'in yerini alır (karar: ayrı modül, eski silindi).
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
  getMove,
  listMoves,
  recordInteraction,
} from "@/lib/relocation-api";
import { MoveSelector } from "@/components/relocation/MoveSelector";
import { useRelocationMoveContent } from "@/hooks/useRelocationMoveContent";
import { LivingCostsPanel } from "@/components/relocation/tabs/LivingCostsPanel";
import { RequiredDocumentsPanel } from "@/components/relocation/tabs/RequiredDocumentsPanel";
import { RelocationChatPanel } from "@/components/relocation/tabs/RelocationChatPanel";
import { RelocationDemoPanel } from "@/components/relocation/tabs/RelocationDemoPanel";
import { SavedDocumentsPanel } from "@/components/relocation/tabs/SavedDocumentsPanel";
import { relocationKeys } from "@/lib/relocation-query-keys";
import { getRelocationDict } from "@/lib/relocation-i18n";
import { useGeoCountries } from "@/hooks/useGeo";
import { trCompare } from "@/lib/text-normalization";
import type { MoveCreateInput } from "@/lib/relocation-schemas";
import type {
  RelocationServiceCategory,
  RelocationStepTrigger,
} from "@/lib/relocation-types";
import { RelocationWizard } from "@/components/relocation/RelocationWizard";
import { buildCountryOptions } from "@/lib/relocation-country-options";
import { CityComparisonTable } from "@/components/relocation/CityComparisonTable";
import { ServiceRecommendationCard } from "@/components/relocation/ServiceRecommendationCard";
import { BureaucracyTimeline } from "@/components/relocation/BureaucracyTimeline";
import { EmergencyContactsPanel } from "@/components/relocation/EmergencyContactsPanel";
import { isDemoRoute } from "@/lib/demo-pages";
import {
  DEMO_BUSINESSES,
  DEMO_SCHOOLS,
  DEMO_WELCOME_PACK,
} from "@/lib/relocation-demo-content";

 
const db = supabase;

const SERVICE_CATEGORIES: RelocationServiceCategory[] = [
  "housing",
  "airline",
  "gsm_operator",
  "doctor",
  "community_hub",
];

/**
 * İş & İşletmeler · Okullar · Hoşgeldin Paketi sekmeleri örnek içerik taşır ve
 * YALNIZ sayfa demo işaretliyken çizilir. Kaynak tek: `DEMO_ROUTES`.
 * `/relocation` oradan silindiğinde üç sekme de kendiliğinden kaybolur — demo
 * içeriğin canlıda unutulması bu yüzden mümkün değildir.
 */
const SHOW_DEMO_TABS = isDemoRoute("/relocation");

/** Aktif lokasyonlardaki distinct ISO alpha-2 ülke kodları. */
async function fetchCountryCodes(): Promise<string[]> {
  const { data, error } = await db
    .from("relocation_locations")
    .select("country_code")
    .eq("is_active", true);
  if (error) throw error;
  const codes = new Set<string>();
  for (const row of (data ?? []) as Array<{ country_code: string | null }>) {
    const code = row.country_code?.trim();
    if (code) codes.add(code);
  }
  return Array.from(codes);
}

export default function RelocationHomePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const dict = getRelocationDict("tr-TR");
  const [searchParams, setSearchParams] = useSearchParams();
  // Dosya kimliği URL'de yaşar: sayfa yenilenince plan kaybolmasın ve kullanıcı
  // linki paylaşamasa bile geri dönebilsin. Eskiden yalnız bileşen state'indeydi,
  // her yenileme sihirbazı sıfırlayıp YENİ kayıt açıyordu.
  const moveId = searchParams.get("move");
  const setMoveId = (next: string | null) => {
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);
        if (next) params.set("move", next);
        else params.delete("move");
        return params;
      },
      { replace: true },
    );
  };

  const [forceWizard, setForceWizard] = useState(false);
  const [activeTab, setActiveTab] = useState("cities");
  const [serviceCategory, setServiceCategory] = useState<RelocationServiceCategory>("housing");

  const countryCodesQuery = useQuery({
    queryKey: [...relocationKeys.all, "country-codes"],
    queryFn: fetchCountryCodes,
  });
  const geoCountriesQuery = useGeoCountries(true);
  const countryOptions = useMemo(
    () => buildCountryOptions(countryCodesQuery.data ?? [], geoCountriesQuery.data ?? []),
    [countryCodesQuery.data, geoCountriesQuery.data],
  );

  const movesQuery = useQuery({
    queryKey: relocationKeys.moves(),
    queryFn: listMoves,
    enabled: !moveId,
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

  // Taşınma dosyasının kendisi — hedef ülkeler, hane ve bütçe buradan gelir.
  // Şehir önerilerinden TÜREMEZ: öneri listesi boş olabilir (relocation_locations
  // eşleşmeyebilir) ama dosyanın hedef ülkesi her zaman bellidir.
  const moveQuery = useQuery({
    queryKey: moveId ? relocationKeys.move(moveId) : ["relocation", "noop-move"],
    queryFn: () => getMove(moveId as string),
    enabled: !!moveId,
  });

  const move = moveQuery.data;
  const targetCountryCodes = useMemo(() => move?.target_country_codes ?? [], [move]);
  const targetCountryNames = useMemo(
    () =>
      targetCountryCodes.map(
        (code) => countryOptions.find((option) => option.code === code)?.label ?? code,
      ),
    [targetCountryCodes, countryOptions],
  );

  const adults = move?.household?.adults ?? 1;
  const children = move?.household?.children ?? 0;
  // `?? []` her render YENİ dizi üretir ve aşağıdaki useMemo'ları geçersiz kılar.
  const mustHaves = useMemo(() => move?.must_haves ?? [], [move]);

  const content = useRelocationMoveContent({
    moveId,
    targetCountryCodes,
    targetCountryNames,
    adults,
    children,
    budgetMonthly: move?.budget_monthly ?? null,
    currency: move?.currency ?? "EUR",
    moveWindowStart: move?.move_window_start ?? null,
    moveWindowEnd: move?.move_window_end ?? null,
    mustHaves,
    onError: (message) =>
      toast({ title: "İşlem tamamlanamadı", description: message, variant: "destructive" }),
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
        <>
          {!forceWizard && (
            <MoveSelector
              moves={movesQuery.data ?? []}
              countryLabel={(code) =>
                countryOptions.find((option) => option.code === code)?.label ?? code
              }
              onSelect={(id) => setMoveId(id)}
              onStartNew={() => setForceWizard(true)}
            />
          )}
          <RelocationWizard
          countryOptions={countryOptions}
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
        </>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="cities">{dict.tabs.cities}</TabsTrigger>
            <TabsTrigger value="services">{dict.tabs.services}</TabsTrigger>
            <TabsTrigger value="checklist">{dict.tabs.checklist}</TabsTrigger>
            {/* Maliyet ve belge sekmeleri yalnızca VERİ VARSA çizilir — boş sekme,
                kullanıcıya "burada bir şey olmalıydı" hissi verir. */}
            {content.livingCosts.length > 0 && (
              <TabsTrigger value="costs">{dict.tabs.costs}</TabsTrigger>
            )}
            {content.requiredDocuments.length > 0 && (
              <TabsTrigger value="documents">{dict.tabs.documents}</TabsTrigger>
            )}
            {SHOW_DEMO_TABS && (
              <>
                <TabsTrigger value="businesses">{dict.tabs.businesses}</TabsTrigger>
                <TabsTrigger value="schools">{dict.tabs.schools}</TabsTrigger>
                <TabsTrigger value="welcome">{dict.tabs.welcome}</TabsTrigger>
              </>
            )}
            <TabsTrigger value="assistant">{dict.tabs.assistant}</TabsTrigger>
            <TabsTrigger value="emergency">{dict.tabs.emergency}</TabsTrigger>
            <TabsTrigger value="saved">{dict.tabs.saved}</TabsTrigger>
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

          <TabsContent value="costs">
            <LivingCostsPanel
              rows={content.livingCosts}
              householdSize={adults + children}
              countryLabel={(code) =>
                countryOptions.find((option) => option.code === code)?.label ?? code
              }
              isLoading={content.isContentLoading}
            />
          </TabsContent>

          <TabsContent value="documents">
            <RequiredDocumentsPanel
              documents={content.requiredDocuments}
              doneKeys={content.doneDocumentKeys}
              onToggle={content.toggleDocument}
              isLoading={content.isContentLoading}
              isSaving={content.isProgressSaving}
            />
          </TabsContent>

          {SHOW_DEMO_TABS && (
            <>
              <TabsContent value="businesses">
                <RelocationDemoPanel items={DEMO_BUSINESSES} note={dict.demo.businesses} />
              </TabsContent>
              <TabsContent value="schools">
                <RelocationDemoPanel items={DEMO_SCHOOLS} note={dict.demo.schools} />
              </TabsContent>
              <TabsContent value="welcome">
                <RelocationDemoPanel items={DEMO_WELCOME_PACK} note={dict.demo.welcome} />
              </TabsContent>
            </>
          )}

          <TabsContent value="assistant">
            <RelocationChatPanel
              messages={content.chatMessages}
              isSending={content.isChatSending}
              onSend={content.sendChatMessage}
              onSaveTranscript={content.saveChatTranscript}
              hasPlatformData={content.hasPlatformData}
            />
          </TabsContent>

          <TabsContent value="emergency">
            <EmergencyContactsPanel
              contacts={emergencyQuery.data ?? []}
              emptyLabel={dict.emergency.empty}
            />
          </TabsContent>

          <TabsContent value="saved">
            <SavedDocumentsPanel
              documents={content.savedDocuments}
              onDelete={content.deleteDocument}
              isLoading={content.isDocumentsLoading}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
