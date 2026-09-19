import { Sparkles } from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { GROUP_PLATFORM_OPTIONS, type GroupFormState, type GroupPlatform } from "@/lib/whatsapp-landing-form";
import { PlatformLogo } from "@/components/whatsapp/PlatformLogo";

const formFieldInsetClass = "mx-0.5 w-[calc(100%-4px)]";

interface AddCommunityFormSectionProps {
  isSignedIn: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: GroupFormState;
  onFieldChange: <K extends keyof GroupFormState>(field: K, value: GroupFormState[K]) => void;
  heroImageFile: File | null;
  onHeroImageFileChange: (file: File | null) => void;
  oauthSubmitting: boolean;
  submitting: boolean;
  onStartGoogleAuth: () => void;
  onSubmit: () => void;
}

export function AddCommunityFormSection({
  isSignedIn,
  open,
  onOpenChange,
  form,
  onFieldChange,
  oauthSubmitting,
  submitting,
  onStartGoogleAuth,
  onSubmit,
}: AddCommunityFormSectionProps) {
  return (
    <div className="mt-8 rounded-[1.9rem] border border-emerald-200/70 bg-[linear-gradient(135deg,rgba(236,253,245,0.96)_0%,rgba(255,255,255,0.98)_42%,rgba(239,246,255,0.94)_100%)] p-3 shadow-[0_20px_60px_rgba(15,23,42,0.08)] ring-1 ring-white/80 backdrop-blur-sm">
      <div className="rounded-[1.45rem] bg-white/55 p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3 text-left">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ecfdf5_0%,#d1fae5_100%)] shadow-[0_10px_24px_rgba(16,185,129,0.16)] ring-1 ring-emerald-200/80">
              <Sparkles className="h-4.5 w-4.5 text-emerald-700" />
            </span>
            <div className="space-y-1">
              <h2 className="text-base font-bold tracking-[0.01em] text-slate-900 md:text-lg">Dijital Grup Eklemek İstiyorum</h2>
              <p className="text-sm text-slate-600">
                Grubunu ekle, admin onayından sonra listede yayınlanacak.
              </p>
            </div>
          </div>

          <Button
            type="button"
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700 md:w-auto"
            onClick={onStartGoogleAuth}
            disabled={oauthSubmitting || submitting}
          >
            {oauthSubmitting
              ? "Google'a yönlendiriliyor..."
              : isSignedIn
                ? "Grup ekleme formunu aç"
                : "Google ile grup ekle"}
          </Button>
        </div>
      </div>
      <Accordion
        type="single"
        collapsible
        value={open ? "group-form" : ""}
        onValueChange={(value) => onOpenChange(value === "group-form")}
        className="mt-3"
      >
        <AccordionItem
          value="group-form"
          className="overflow-hidden rounded-[1.45rem] border border-emerald-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(236,253,245,0.92)_100%)]"
        >
          <AccordionTrigger className="px-5 py-4 text-left text-base font-bold text-slate-900 hover:no-underline">
            {open ? "Formu kapat" : "Formu aç"}
          </AccordionTrigger>
          <AccordionContent className="border-t border-emerald-100 px-5 pb-5 pt-4">
            <div className="mb-5">
              <h3 className="text-left text-xl font-bold text-slate-900">Grup Ekle</h3>
              <p className="mt-1 text-left text-sm text-slate-600">
                Aşağıdaki bilgileri doldur. Grup admin onayından sonra listede görünecek.
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Grup Bilgileri</h3>

                <div>
                  <Label htmlFor="group-name">Grup Adı *</Label>
                  <Input
                    id="group-name"
                    className={formFieldInsetClass}
                    lang="tr"
                    spellCheck
                    value={form.groupName}
                    onChange={(event) => onFieldChange("groupName", event.target.value)}
                    placeholder="Örn: Berlin Türk Girişimciler"
                  />
                </div>

                <div>
                  <Label htmlFor="group-link">Grup Davetiye Linki *</Label>
                  <Input
                    id="group-link"
                    className={formFieldInsetClass}
                    value={form.whatsappLink}
                    onChange={(event) => onFieldChange("whatsappLink", event.target.value)}
                    placeholder={
                      form.platform === "WhatsApp"
                        ? "https://chat.whatsapp.com/..."
                        : form.platform === "Facebook"
                          ? "https://facebook.com/groups/..."
                          : form.platform === "Instagram"
                            ? "https://instagram.com/..."
                            : form.platform === "LinkedIn"
                              ? "https://linkedin.com/groups/..."
                              : form.platform === "Reddit"
                                ? "https://reddit.com/r/..."
                                : form.platform === "YouTube"
                                  ? "https://youtube.com/..."
                                  : "https://..."
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="platform">Platform *</Label>
                  <Select
                    value={form.platform}
                    onValueChange={(value) => onFieldChange("platform", value as GroupPlatform)}
                  >
                    <SelectTrigger id="platform" className={formFieldInsetClass}>
                      <SelectValue placeholder="Platform seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {GROUP_PLATFORM_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-2">
                            <PlatformLogo platform={opt.value} size="card" />
                            {opt.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="country">Ülke *</Label>
                    <Input
                      id="country"
                      className={formFieldInsetClass}
                      lang="tr"
                      spellCheck
                      value={form.country}
                      onChange={(event) => onFieldChange("country", event.target.value)}
                      placeholder="Örn: Almanya"
                    />
                  </div>

                  <div>
                    <Label htmlFor="city">Şehir *</Label>
                    <Input
                      id="city"
                      className={formFieldInsetClass}
                      lang="tr"
                      spellCheck
                      value={form.city}
                      onChange={(event) => onFieldChange("city", event.target.value)}
                      placeholder="Örn: Berlin"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Kısa Açıklama</Label>
                  <Textarea
                    id="description"
                    className={formFieldInsetClass}
                    lang="tr"
                    spellCheck
                    rows={3}
                    value={form.description}
                    onChange={(event) => onFieldChange("description", event.target.value)}
                    placeholder="Grup hakkında 1-2 cümle"
                  />
                </div>
              </div>

              <Button
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={onSubmit}
                disabled={submitting}
              >
                {submitting ? "Gönderiliyor..." : "Grubu Gönder"}
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
