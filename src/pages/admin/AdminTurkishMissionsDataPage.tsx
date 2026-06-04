import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Plus, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  ADMIN_TURKISH_MISSION_TYPES,
  createTurkishMissionAsAdmin,
  getAdminTurkishMissionTypeLabel,
  listTurkishMissionsAsAdmin,
  slugifyTurkishMission,
  updateTurkishMissionAsAdmin,
  type AdminTurkishMissionType,
  type TurkishMissionAdminInput,
  type TurkishMissionAdminRecord,
} from "@/lib/turkish-missions-admin";

type FormState = {
  slug: string;
  missionType: AdminTurkishMissionType;
  missionName: string;
  country: string;
  countryCode: string;
  city: string;
  cityNormalized: string;
  parentMissionSlug: string;
  address: string;
  phonesText: string;
  emailsText: string;
  faxesText: string;
  emergencyPhonesText: string;
  websiteUrl: string;
  appointmentUrl: string;
  jurisdiction: string;
  workingHours: string;
  officeHoursStructuredText: string;
  consularCallCenter: string;
  parserConfidence: string;
  dataCompletenessScore: string;
  status: "active" | "inactive" | "needs_review";
  verificationStatus: string;
  sourceHash: string;
  sourceUrl: string;
  scrapedAt: string;
  lastVerifiedAt: string;
  contactFieldsText: string;
  rawSnapshotText: string;
};

const DEFAULT_MISSION_TYPE: AdminTurkishMissionType = "embassy";

const MISSION_TYPE_ROUTE_MAP: Record<string, AdminTurkishMissionType> = {
  buyukelcilik: "embassy",
  baskonsolosluk: "consulate_general",
  konsolosluk: "consulate",
  "konsolosluk-ofisi": "consular_office",
};

const MISSION_TYPE_PATHNAME_MAP: Record<AdminTurkishMissionType, string> = {
  embassy: "/admin/data/buyukelcilik",
  consulate_general: "/admin/data/baskonsolosluk",
  consulate: "/admin/data/konsolosluk",
  consular_office: "/admin/data/konsolosluk-ofisi",
};

const EMPTY_FORM: FormState = {
  slug: "",
  missionType: DEFAULT_MISSION_TYPE,
  missionName: "",
  country: "",
  countryCode: "",
  city: "",
  cityNormalized: "",
  parentMissionSlug: "",
  address: "",
  phonesText: "[]",
  emailsText: "[]",
  faxesText: "[]",
  emergencyPhonesText: "[]",
  websiteUrl: "",
  appointmentUrl: "https://www.konsolosluk.gov.tr/",
  jurisdiction: "",
  workingHours: "",
  officeHoursStructuredText: "{}",
  consularCallCenter: "",
  parserConfidence: "0",
  dataCompletenessScore: "0",
  status: "active",
  verificationStatus: "official_source_scraped",
  sourceHash: "",
  sourceUrl: "",
  scrapedAt: "",
  lastVerifiedAt: "",
  contactFieldsText: "{}",
  rawSnapshotText: "{}",
};

const stringifyPretty = (value: unknown) => JSON.stringify(value, null, 2);

const recordToFormState = (record: TurkishMissionAdminRecord): FormState => ({
  slug: record.slug,
  missionType: record.missionType,
  missionName: record.missionName,
  country: record.country ?? "",
  countryCode: record.countryCode ?? "",
  city: record.city ?? "",
  cityNormalized: record.cityNormalized ?? "",
  parentMissionSlug: record.parentMissionSlug ?? "",
  address: record.address ?? "",
  phonesText: stringifyPretty(record.phones),
  emailsText: stringifyPretty(record.emails),
  faxesText: stringifyPretty(record.faxes),
  emergencyPhonesText: stringifyPretty(record.emergencyPhones),
  websiteUrl: record.websiteUrl ?? "",
  appointmentUrl: record.appointmentUrl ?? "",
  jurisdiction: record.jurisdiction ?? "",
  workingHours: record.workingHours ?? "",
  officeHoursStructuredText: stringifyPretty(record.officeHoursStructured),
  consularCallCenter: record.consularCallCenter ?? "",
  parserConfidence: String(record.parserConfidence),
  dataCompletenessScore: String(record.dataCompletenessScore),
  status: record.status,
  verificationStatus: record.verificationStatus,
  sourceHash: record.sourceHash ?? "",
  sourceUrl: record.sourceUrl,
  scrapedAt: record.scrapedAt,
  lastVerifiedAt: record.lastVerifiedAt,
  contactFieldsText: stringifyPretty(record.contactFields),
  rawSnapshotText: stringifyPretty(record.rawSnapshot),
});

const parseStringArray = (label: string, raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  let parsed: unknown;

  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error(`${label} alanı geçerli JSON olmalı.`);
  }

  if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
    throw new Error(`${label} alanı yalnızca string array olmalı.`);
  }

  return parsed as string[];
};

const parseObject = (label: string, raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) return {};

  let parsed: unknown;

  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error(`${label} alanı geçerli JSON olmalı.`);
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${label} alanı JSON object olmalı.`);
  }

  return parsed as Record<string, unknown>;
};

const buildInputFromForm = (form: FormState): TurkishMissionAdminInput => ({
  slug: slugifyTurkishMission(form.slug || form.missionName),
  missionType: form.missionType,
  missionName: form.missionName.trim(),
  country: form.country.trim() || null,
  countryCode: form.countryCode.trim() || null,
  city: form.city.trim() || null,
  cityNormalized: form.cityNormalized.trim() || null,
  parentMissionSlug: form.parentMissionSlug.trim() || null,
  address: form.address.trim() || null,
  phones: parseStringArray("Telefonlar JSON", form.phonesText),
  emails: parseStringArray("E-postalar JSON", form.emailsText),
  faxes: parseStringArray("Fakslar JSON", form.faxesText),
  emergencyPhones: parseStringArray("Acil telefonlar JSON", form.emergencyPhonesText),
  websiteUrl: form.websiteUrl.trim() || null,
  appointmentUrl: form.appointmentUrl.trim() || null,
  jurisdiction: form.jurisdiction.trim() || null,
  workingHours: form.workingHours.trim() || null,
  officeHoursStructured: parseObject("Office hours JSON", form.officeHoursStructuredText),
  consularCallCenter: form.consularCallCenter.trim() || null,
  parserConfidence: Number(form.parserConfidence || 0),
  dataCompletenessScore: Number(form.dataCompletenessScore || 0),
  status: form.status,
  verificationStatus: form.verificationStatus.trim(),
  sourceHash: form.sourceHash.trim() || null,
  sourceUrl: form.sourceUrl.trim(),
  scrapedAt: form.scrapedAt.trim() || undefined,
  lastVerifiedAt: form.lastVerifiedAt.trim() || undefined,
  contactFields: parseObject("Contact fields JSON", form.contactFieldsText),
  rawSnapshot: parseObject("Raw snapshot JSON", form.rawSnapshotText),
});

export default function AdminTurkishMissionsDataPage() {
  const { toast } = useToast();
  const { category = "buyukelcilik" } = useParams<{ category?: string }>();
  const routeMissionType = MISSION_TYPE_ROUTE_MAP[category] ?? DEFAULT_MISSION_TYPE;

  const [records, setRecords] = useState<TurkishMissionAdminRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM, missionType: routeMissionType });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const selectedRecord = useMemo(
    () => records.find((record) => record.id === selectedId) ?? null,
    [records, selectedId],
  );

  const pageTitle = `${getAdminTurkishMissionTypeLabel(routeMissionType)} Verisi`;

  const loadRecords = async (nextSelectedId?: string | null) => {
    setIsLoading(true);

    try {
      const nextRecords = await listTurkishMissionsAsAdmin(routeMissionType);
      setRecords(nextRecords);

      const effectiveId = nextSelectedId === undefined ? selectedId : nextSelectedId;
      if (effectiveId) {
        const nextSelectedRecord = nextRecords.find((record) => record.id === effectiveId) ?? null;
        setSelectedId(nextSelectedRecord?.id ?? null);
        setForm(
          nextSelectedRecord
            ? recordToFormState(nextSelectedRecord)
            : { ...EMPTY_FORM, missionType: routeMissionType },
        );
      } else {
        setForm({ ...EMPTY_FORM, missionType: routeMissionType });
      }
    } catch (error) {
      toast({
        title: "Data kayıtları yüklenemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setSelectedId(null);
    setForm({ ...EMPTY_FORM, missionType: routeMissionType });
    void loadRecords(null);
  }, [routeMissionType]);

  const updateForm = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSelect = (record: TurkishMissionAdminRecord) => {
    setSelectedId(record.id);
    setForm(recordToFormState(record));
  };

  const handleNew = () => {
    setSelectedId(null);
    setForm({ ...EMPTY_FORM, missionType: routeMissionType });
  };

  const handleSave = async () => {
    if (!form.missionName.trim() || !form.sourceUrl.trim()) {
      toast({
        title: "Eksik bilgi",
        description: "Temsilcilik adı ve source URL zorunlu.",
        variant: "destructive",
      });
      return;
    }

    const payload = buildInputFromForm(form);

    if (payload.parserConfidence < 0 || payload.parserConfidence > 100) {
      toast({
        title: "Geçersiz parser skoru",
        description: "Parser confidence 0 ile 100 arasında olmalı.",
        variant: "destructive",
      });
      return;
    }

    if (payload.dataCompletenessScore < 0 || payload.dataCompletenessScore > 100) {
      toast({
        title: "Geçersiz completeness skoru",
        description: "Data completeness score 0 ile 100 arasında olmalı.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      if (selectedRecord) {
        const saved = await updateTurkishMissionAsAdmin(selectedRecord.id, payload);
        await loadRecords(saved.id);
        toast({ title: "Data kaydı güncellendi" });
      } else {
        const saved = await createTurkishMissionAsAdmin(payload);
        await loadRecords(saved.id);
        toast({ title: "Yeni data kaydı oluşturuldu" });
      }
    } catch (error) {
      toast({
        title: "Kayıt kaydedilemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{pageTitle}</h2>
          <p className="text-sm text-muted-foreground">
            <code>turkish_missions</code> tablosundaki ham resmi kayıtları kategori bazlı görüntüle ve düzenle.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ADMIN_TURKISH_MISSION_TYPES.map((missionType) => (
            <Button
              key={missionType}
              asChild
              variant={routeMissionType === missionType ? "default" : "outline"}
              size="sm"
            >
              <Link to={MISSION_TYPE_PATHNAME_MAP[missionType]}>{getAdminTurkishMissionTypeLabel(missionType)}</Link>
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>{getAdminTurkishMissionTypeLabel(routeMissionType)}</CardTitle>
                <CardDescription>Filtrelenmiş kaynak kayıtlar</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={handleNew}>
                <Plus className="h-4 w-4" />
                Yeni
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? <p className="text-sm text-muted-foreground">Kayıtlar yükleniyor...</p> : null}
            {!isLoading && records.length === 0 ? (
              <p className="text-sm text-muted-foreground">Bu kategori için kayıt bulunamadı.</p>
            ) : null}
            {records.map((record) => (
              <button
                key={record.id}
                type="button"
                onClick={() => handleSelect(record)}
                className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                  selectedId === record.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{record.missionName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[record.city, record.country].filter(Boolean).join(", ") || "Lokasyon yok"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[11px] text-muted-foreground">{record.status}</p>
                    <p className="text-[11px] text-muted-foreground">%{record.dataCompletenessScore}</p>
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{selectedRecord ? "Data Kaydını Düzenle" : "Yeni Data Kaydı"}</CardTitle>
            <CardDescription>
              JSON alanları doğrudan DB yapısına kaydedilir. Ham temas verilerine ve scrape snapshot’ına admin edit yetkisiyle erişebilirsin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Kategori">
                <Select value={form.missionType} onValueChange={(value) => updateForm("missionType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kategori seç" />
                  </SelectTrigger>
                  <SelectContent>
                    {ADMIN_TURKISH_MISSION_TYPES.map((missionType) => (
                      <SelectItem key={missionType} value={missionType}>
                        {getAdminTurkishMissionTypeLabel(missionType)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Slug">
                <Input value={form.slug} onChange={(event) => updateForm("slug", event.target.value)} placeholder="tc-berlin-buyukelcilik" />
              </Field>
              <Field label="Temsilcilik Adı">
                <Input value={form.missionName} onChange={(event) => updateForm("missionName", event.target.value)} placeholder="T.C. Berlin Büyükelçiliği" />
              </Field>
              <Field label="Parent Mission Slug">
                <Input value={form.parentMissionSlug} onChange={(event) => updateForm("parentMissionSlug", event.target.value)} placeholder="tc-berlin-buyukelcilik" />
              </Field>
              <Field label="Ülke">
                <Input value={form.country} onChange={(event) => updateForm("country", event.target.value)} placeholder="Almanya" />
              </Field>
              <Field label="Ülke Kodu">
                <Input value={form.countryCode} onChange={(event) => updateForm("countryCode", event.target.value)} placeholder="DE" />
              </Field>
              <Field label="Şehir">
                <Input value={form.city} onChange={(event) => updateForm("city", event.target.value)} placeholder="Berlin" />
              </Field>
              <Field label="Şehir Normalized">
                <Input value={form.cityNormalized} onChange={(event) => updateForm("cityNormalized", event.target.value)} placeholder="berlin" />
              </Field>
              <Field label="Website URL">
                <Input value={form.websiteUrl} onChange={(event) => updateForm("websiteUrl", event.target.value)} placeholder="https://..." />
              </Field>
              <Field label="Randevu URL">
                <Input value={form.appointmentUrl} onChange={(event) => updateForm("appointmentUrl", event.target.value)} placeholder="https://www.konsolosluk.gov.tr/" />
              </Field>
              <Field label="Verification Status">
                <Input value={form.verificationStatus} onChange={(event) => updateForm("verificationStatus", event.target.value)} placeholder="official_source_scraped" />
              </Field>
              <Field label="Source Hash">
                <Input value={form.sourceHash} onChange={(event) => updateForm("sourceHash", event.target.value)} placeholder="sha256..." />
              </Field>
              <Field label="Source URL">
                <Input value={form.sourceUrl} onChange={(event) => updateForm("sourceUrl", event.target.value)} placeholder="https://..." />
              </Field>
              <Field label="Status">
                <Select value={form.status} onValueChange={(value) => updateForm("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Durum seç" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">active</SelectItem>
                    <SelectItem value="inactive">inactive</SelectItem>
                    <SelectItem value="needs_review">needs_review</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Parser Confidence">
                <Input type="number" min="0" max="100" value={form.parserConfidence} onChange={(event) => updateForm("parserConfidence", event.target.value)} />
              </Field>
              <Field label="Completeness Score">
                <Input type="number" min="0" max="100" value={form.dataCompletenessScore} onChange={(event) => updateForm("dataCompletenessScore", event.target.value)} />
              </Field>
              <Field label="Consular Call Center">
                <Input value={form.consularCallCenter} onChange={(event) => updateForm("consularCallCenter", event.target.value)} placeholder="+90 ..." />
              </Field>
              <Field label="Working Hours">
                <Input value={form.workingHours} onChange={(event) => updateForm("workingHours", event.target.value)} placeholder="Hafta içi 09:00 - 17:00" />
              </Field>
              <Field label="Jurisdiction">
                <Textarea value={form.jurisdiction} onChange={(event) => updateForm("jurisdiction", event.target.value)} className="min-h-[88px]" />
              </Field>
              <Field label="Adres">
                <Textarea value={form.address} onChange={(event) => updateForm("address", event.target.value)} className="min-h-[88px]" />
              </Field>
              <Field label="Scraped At">
                <Input value={form.scrapedAt} onChange={(event) => updateForm("scrapedAt", event.target.value)} placeholder="2026-06-02T10:30:00+00:00" />
              </Field>
              <Field label="Last Verified At">
                <Input value={form.lastVerifiedAt} onChange={(event) => updateForm("lastVerifiedAt", event.target.value)} placeholder="2026-06-02T10:30:00+00:00" />
              </Field>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Field label="Telefonlar JSON">
                <Textarea value={form.phonesText} onChange={(event) => updateForm("phonesText", event.target.value)} className="min-h-[160px] font-mono text-xs" />
              </Field>
              <Field label="Acil Telefonlar JSON">
                <Textarea value={form.emergencyPhonesText} onChange={(event) => updateForm("emergencyPhonesText", event.target.value)} className="min-h-[160px] font-mono text-xs" />
              </Field>
              <Field label="E-postalar JSON">
                <Textarea value={form.emailsText} onChange={(event) => updateForm("emailsText", event.target.value)} className="min-h-[160px] font-mono text-xs" />
              </Field>
              <Field label="Fakslar JSON">
                <Textarea value={form.faxesText} onChange={(event) => updateForm("faxesText", event.target.value)} className="min-h-[160px] font-mono text-xs" />
              </Field>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Field label="Office Hours JSON">
                <Textarea value={form.officeHoursStructuredText} onChange={(event) => updateForm("officeHoursStructuredText", event.target.value)} className="min-h-[220px] font-mono text-xs" />
              </Field>
              <Field label="Contact Fields JSON">
                <Textarea value={form.contactFieldsText} onChange={(event) => updateForm("contactFieldsText", event.target.value)} className="min-h-[220px] font-mono text-xs" />
              </Field>
              <Field label="Raw Snapshot JSON">
                <Textarea value={form.rawSnapshotText} onChange={(event) => updateForm("rawSnapshotText", event.target.value)} className="min-h-[220px] font-mono text-xs" />
              </Field>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => void handleSave()} disabled={isSaving}>
                <Save className="h-4 w-4" />
                {isSaving ? "Kaydediliyor..." : selectedRecord ? "Kaydı Güncelle" : "Kaydı Oluştur"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
