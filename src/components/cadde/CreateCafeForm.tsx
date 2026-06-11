// Cadde 3.0 Faz 4 — TEK cafe oluşturma formu (spec §13.1: rol/premium farkı yeni
// varyant üretmez, aynı form policy'ye göre davranır). Legacy
// src/components/feed/CreateCafeForm.tsx'ten alan seti port edildi (freeze'deki dosyaya
// DOKUNULMADI); useIsPremium/kıta bağımlılıkları bilinçli taşınmadı. Entry policy,
// süre/kapasite limitleri ve davet kodu hash'i DB'de (create_cadde_cafe_v1) enforce edilir.

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Coffee } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createCaddeCafe, listCaddeCities, listCaddeCountries } from "@/lib/cadde-api";
import { useCaddeDiasporaKey } from "@/hooks/cadde/useCaddeDiasporaKey";
import { caddeQueryKeys } from "@/lib/cadde-query-keys";
import { moderateCaddeCafeName } from "@/lib/cadde-rules";
import type { CaddeCafeEntryMode } from "@/lib/cadde-types";

const THEME_SUGGESTIONS = ["IT", "Hekimler", "Profesyoneller", "İşletmeler", "Kuruluşlar", "Blogger/Vlogger", "Genel"] as const;
const DURATION_OPTIONS = [1, 2, 3, 4, 6] as const;

const ENTRY_MODE_LABELS: Record<CaddeCafeEntryMode, string> = {
  open: "Açık (herkes katılır)",
  approval: "Onaylı (soru + sahip onayı)",
  referral: "Davet kodlu",
};

interface CreateCafeFormProps {
  trigger?: React.ReactNode;
}

const emptyForm = {
  title: "",
  theme: "Genel",
  summary: "",
  isBridge: false,
  country: "",
  city: "",
  entryMode: "open" as CaddeCafeEntryMode,
  referralCode: "",
  entryQuestion: "",
  durationHours: 2,
  capacity: "",
  externalLink: "",
};

const CreateCafeForm = ({ trigger }: CreateCafeFormProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const diasporaKey = useCaddeDiasporaKey();

  const countriesQuery = useQuery({ queryKey: caddeQueryKeys.countries(), queryFn: listCaddeCountries, enabled: open });
  const citiesQuery = useQuery({
    queryKey: caddeQueryKeys.cities(form.country ? [form.country] : []),
    queryFn: () => listCaddeCities(form.country ? [form.country] : []),
    enabled: open && Boolean(form.country),
  });

  const update = <K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const createMutation = useMutation({
    mutationFn: async () => {
      const moderation = moderateCaddeCafeName(form.title);
      if (!moderation.ok) throw new Error(moderation.reason);
      const starts = new Date();
      const ends = new Date(starts.getTime() + form.durationHours * 60 * 60 * 1000);
      return createCaddeCafe({
        title: form.title,
        summary: form.summary,
        themeKey: form.theme,
        country: form.isBridge ? undefined : form.country || undefined,
        city: form.isBridge ? undefined : form.city || undefined,
        isBridge: form.isBridge,
        entryMode: form.entryMode,
        referralCode: form.entryMode === "referral" ? form.referralCode : undefined,
        entryQuestion: form.entryMode === "approval" ? form.entryQuestion : undefined,
        startsAt: starts.toISOString(),
        endsAt: ends.toISOString(),
        capacity: form.capacity.trim() ? Number(form.capacity) : undefined,
        externalLinks: form.externalLink.trim() ? [form.externalLink.trim()] : undefined,
        diasporaKey,
      });
    },
    onSuccess: async (cafeId) => {
      setOpen(false);
      setForm(emptyForm);
      await queryClient.invalidateQueries({ queryKey: caddeQueryKeys.cafesRoot });
      toast({ title: "Cafe açıldı" });
      navigate(`/cadde/cafe/${cafeId}`);
    },
    onError: (error) => {
      toast({ title: "Cafe açılamadı", description: error instanceof Error ? error.message : "Bilinmeyen hata", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="w-full justify-between rounded-2xl">
            Cafe Aç
            <Coffee className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni Cafe</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Cafe adı *</Label>
            <Input value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="Örn. Berlin IT Sohbeti" maxLength={80} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tema *</Label>
              <Select value={form.theme} onValueChange={(value) => update("theme", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {THEME_SUGGESTIONS.map((theme) => (
                    <SelectItem key={theme} value={theme}>{theme}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Süre</Label>
              <Select value={String(form.durationHours)} onValueChange={(value) => update("durationHours", Number(value))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((hours) => (
                    <SelectItem key={hours} value={String(hours)}>{hours} saat</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Özet *</Label>
            <Textarea value={form.summary} onChange={(event) => update("summary", event.target.value)} placeholder="Bu odada ne konuşulacak?" rows={3} maxLength={500} />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-emerald-950">Köprü cafe</p>
              <p className="text-xs text-emerald-700">TR-Diaspora ortak odası; ülke/şehir kapsamı olmaz.</p>
            </div>
            <Switch checked={form.isBridge} onCheckedChange={(checked) => update("isBridge", checked)} />
          </div>

          {!form.isBridge ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Ülke</Label>
                <Select value={form.country || "__none__"} onValueChange={(value) => { update("country", value === "__none__" ? "" : value); update("city", ""); }}>
                  <SelectTrigger><SelectValue placeholder="Global" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Global</SelectItem>
                    {(countriesQuery.data ?? []).map((country) => (
                      <SelectItem key={country.id} value={country.name}>{country.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Şehir</Label>
                <Select value={form.city || "__none__"} onValueChange={(value) => update("city", value === "__none__" ? "" : value)} disabled={!form.country}>
                  <SelectTrigger><SelectValue placeholder="Tüm şehirler" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Tüm şehirler</SelectItem>
                    {(citiesQuery.data ?? []).map((city) => (
                      <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Giriş tipi</Label>
            <Select value={form.entryMode} onValueChange={(value) => update("entryMode", value as CaddeCafeEntryMode)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(ENTRY_MODE_LABELS) as CaddeCafeEntryMode[]).map((mode) => (
                  <SelectItem key={mode} value={mode}>{ENTRY_MODE_LABELS[mode]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.entryMode === "referral" ? (
            <div className="space-y-2">
              <Label>Davet kodu * <span className="font-normal text-slate-500">(plain saklanmaz, hash'lenir)</span></Label>
              <Input value={form.referralCode} onChange={(event) => update("referralCode", event.target.value)} placeholder="Örn. BERLIN2026" />
            </div>
          ) : null}

          {form.entryMode === "approval" ? (
            <div className="space-y-2">
              <Label>Giriş sorusu *</Label>
              <Input value={form.entryQuestion} onChange={(event) => update("entryQuestion", event.target.value)} placeholder="Katılımcıya sorulacak soru" maxLength={200} />
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Kapasite</Label>
              <Input type="number" min={1} value={form.capacity} onChange={(event) => update("capacity", event.target.value)} placeholder="Sınırsız" />
            </div>
            <div className="space-y-2">
              <Label>Dış link</Label>
              <Input value={form.externalLink} onChange={(event) => update("externalLink", event.target.value)} placeholder="https://..." />
            </div>
          </div>

          <Button className="w-full" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Açılıyor..." : "Cafe'yi Aç"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCafeForm;
