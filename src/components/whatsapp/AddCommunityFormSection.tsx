import { Sparkles } from "lucide-react";

import SearchableCitySelect from "@/components/SearchableCitySelect";
import SearchableCountrySelect from "@/components/SearchableCountrySelect";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  GROUP_PLEDGE_TEXT,
  MOTOR_CATEGORIES,
  MOTOR_PLATFORM_LABELS,
  detectMotorPlatform,
  previewBlocksSubmit,
  type GroupPreviewState,
} from "@/lib/group-submit";
import type { GroupFormState } from "@/lib/whatsapp-landing-form";

const formFieldInsetClass = "mx-0.5 w-[calc(100%-4px)]";

/** Politika §2 satır 5: kısa açıklama en fazla 160 karakter (DB CHECK'i de 160). */
const SHORT_DESCRIPTION_MAX = 160;

interface AddCommunityFormSectionProps {
  isSignedIn: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: GroupFormState;
  onFieldChange: <K extends keyof GroupFormState>(field: K, value: GroupFormState[K]) => void;
  preview: GroupPreviewState;
  onPreviewLink: () => void;
  banned: boolean;
  oauthSubmitting: boolean;
  submitting: boolean;
  onStartGoogleAuth: () => void;
  onSubmit: () => void;
  onOpenExistingGroup: (slug: string) => void;
}

export function AddCommunityFormSection({
  isSignedIn,
  open,
  onOpenChange,
  form,
  onFieldChange,
  preview,
  onPreviewLink,
  banned,
  oauthSubmitting,
  submitting,
  onStartGoogleAuth,
  onSubmit,
  onOpenExistingGroup,
}: AddCommunityFormSectionProps) {
  const platform = detectMotorPlatform(form.link);
  const submitDisabled =
    submitting || banned || !form.pledgeAccepted || previewBlocksSubmit(preview);

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
                Linki yapıştır, gerisi otomatik dolsun. Admin onayından sonra listede yayınlanacak.
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
                Fiilen üç şey yazarsın: link, açıklama, şehir. Grup adı ve görsel linkten otomatik gelir.
              </p>
            </div>

            {banned ? (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-semibold text-red-700"
              >
                Grup ekleme yetkin askıya alınmış. Bir ihlal kaydı sonrası bu engel uygulanır;
                detay için ekiple iletişime geç.
              </div>
            ) : null}

            <div className="space-y-5">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Grup Bilgileri</h3>

                {/* Satır 1 — Davet linki (platform OTOMATİK; seçim YOK, tasarım §3.A adım 2) */}
                <div>
                  <Label htmlFor="group-link">Grup Davetiye Linki *</Label>
                  <Input
                    id="group-link"
                    className={formFieldInsetClass}
                    value={form.link}
                    onChange={(event) => onFieldChange("link", event.target.value)}
                    onBlur={onPreviewLink}
                    placeholder="https://chat.whatsapp.com/... · https://t.me/... · https://discord.gg/..."
                    aria-describedby="group-link-help"
                  />
                  <p id="group-link-help" className="mt-1 text-left text-xs text-slate-500">
                    Yalnızca WhatsApp, Telegram ve Discord davet linkleri kabul edilir.
                    {platform ? ` Platform: ${MOTOR_PLATFORM_LABELS[platform]} (linkten otomatik algılandı).` : ""}
                  </p>
                </div>

                {/* Önizleme durumu (tasarım §3.A 3-4): dedup + ad/görsel ön doldurma */}
                {preview.status === "loading" ? (
                  <p className="text-left text-sm text-slate-600" role="status">
                    Davet sayfası okunuyor...
                  </p>
                ) : null}
                {preview.status === "unsupported" ? (
                  <p className="text-left text-sm font-semibold text-red-600">
                    Bu link desteklenmiyor — WhatsApp, Telegram veya Discord davet linki yapıştır.
                  </p>
                ) : null}
                {preview.status === "failed" ? (
                  <p className="text-left text-sm text-slate-600">
                    Önizleme alınamadı ({preview.message}). Alanları elle doldurabilirsin — form buna takılmaz.
                  </p>
                ) : null}
                {preview.status === "done" && preview.data.exists ? (
                  <div
                    role="alert"
                    className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-800"
                  >
                    <p className="font-bold">Bu grup zaten listede{preview.data.group_name ? `: ${preview.data.group_name}` : ""}.</p>
                    <p className="mt-1">
                      Sahibi misin? Grup sayfasından sahiplik doğrulamayı başlatabilirsin.
                    </p>
                    {preview.data.slug ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => onOpenExistingGroup(preview.data.slug as string)}
                      >
                        Grubu gör
                      </Button>
                    ) : null}
                  </div>
                ) : null}
                {preview.status === "done" && !preview.data.exists && preview.data.read_result === "invalid" ? (
                  <p className="text-left text-sm font-semibold text-red-600" role="alert">
                    Davet sayfası geçersiz görünüyor (grup dolu, kapalı ya da link uydurma olabilir).
                    Gönderim bu linkle yapılamaz.
                  </p>
                ) : null}
                {preview.status === "done" && !preview.data.exists && preview.data.read_result === "unknown" ? (
                  <p className="text-left text-sm text-slate-600">
                    Davet sayfası okunamadı — sorun değil, alanları elle doldur.
                  </p>
                ) : null}
                {preview.status === "done" && !preview.data.exists && preview.data.read_result === "ok" ? (
                  <p className="text-left text-sm font-semibold text-emerald-700" role="status">
                    Davet sayfası okundu{preview.data.name ? `: ${preview.data.name}` : ""}. Ad ve görsel otomatik dolduruldu.
                  </p>
                ) : null}

                {/* Satır 2 — Grup adı (otomatik dolar, düzeltilebilir) */}
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

                {/* Satır 3 — Kategori: politika §5, 7 anahtar, TEK seçim ("Diğer" YOK) */}
                <div>
                  <Label htmlFor="group-category">Kategori *</Label>
                  <Select
                    value={form.category || undefined}
                    onValueChange={(value) => onFieldChange("category", value as GroupFormState["category"])}
                  >
                    <SelectTrigger id="group-category" className={formFieldInsetClass}>
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOTOR_CATEGORIES.map((category) => (
                        <SelectItem
                          key={category.value}
                          value={category.value}
                          disabled={"locked" in category && category.locked === true}
                        >
                          {category.label}
                          {"locked" in category && category.locked === true
                            ? " — yakında (doğrulanmış kuruluşlara açık)"
                            : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Satır 4 — Konum: geo_* autocomplete + Global (serbest metin YOK) */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="group-is-global"
                    checked={form.isGlobal}
                    onCheckedChange={(checked) => {
                      onFieldChange("isGlobal", checked === true);
                      if (checked === true) onFieldChange("cityName", "");
                    }}
                  />
                  <Label htmlFor="group-is-global" className="cursor-pointer font-medium">
                    Global grup (şehre bağlı değil — hedef ülke seçilir)
                  </Label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="group-country">{form.isGlobal ? "Hedef Ülke *" : "Ülke *"}</Label>
                    <SearchableCountrySelect
                      id="group-country"
                      name="group-country"
                      className={formFieldInsetClass}
                      value={form.countryName}
                      onChange={(value) => {
                        onFieldChange("countryName", value);
                        onFieldChange("cityName", "");
                      }}
                      placeholder="Ülke seçin"
                    />
                  </div>

                  <div>
                    <Label htmlFor="group-city">Şehir {!form.isGlobal ? "*" : "(Global — gerekmez)"}</Label>
                    <SearchableCitySelect
                      id="group-city"
                      name="group-city"
                      className={formFieldInsetClass}
                      value={form.cityName}
                      onChange={(value) => onFieldChange("cityName", value)}
                      countryName={form.countryName}
                      disabled={form.isGlobal}
                      placeholder={form.isGlobal ? "Global grup" : "Şehir seçin"}
                    />
                  </div>
                </div>

                {/* Satır 5 — Kısa açıklama: zorunlu, ≤160 (politika §2) */}
                <div>
                  <Label htmlFor="group-short-description">Kısa Açıklama *</Label>
                  <Textarea
                    id="group-short-description"
                    className={formFieldInsetClass}
                    lang="tr"
                    spellCheck
                    rows={3}
                    maxLength={SHORT_DESCRIPTION_MAX}
                    value={form.shortDescription}
                    onChange={(event) => onFieldChange("shortDescription", event.target.value)}
                    placeholder="Grup hakkında 1-2 cümle (en fazla 160 karakter)"
                    aria-describedby="group-short-description-count"
                  />
                  <p
                    id="group-short-description-count"
                    className="mt-1 text-right text-xs tabular-nums text-slate-500"
                  >
                    {form.shortDescription.length}/{SHORT_DESCRIPTION_MAX}
                  </p>
                </div>

                {/* Satır 6 — "Bu grubun admini misin?" (Evet/Hayır, cevapsız gitmez) */}
                <div>
                  <Label className="text-left font-medium">Bu grubun admini misin? *</Label>
                  <RadioGroup
                    className="mt-1 flex gap-6"
                    value={form.claimsAdmin}
                    onValueChange={(value) => onFieldChange("claimsAdmin", value as GroupFormState["claimsAdmin"])}
                    aria-label="Bu grubun admini misin?"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="yes" id="claims-admin-yes" />
                      <Label htmlFor="claims-admin-yes" className="cursor-pointer font-normal">Evet</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="no" id="claims-admin-no" />
                      <Label htmlFor="claims-admin-no" className="cursor-pointer font-normal">Hayır</Label>
                    </div>
                  </RadioGroup>
                  <p className="mt-1 text-left text-xs text-slate-500">
                    "Evet" dersen sahipliğini doğrulamanı isteyeceğiz (grup adına geçici bir kod
                    ekleyerek ya da ekran görüntüsüyle).
                  </p>
                </div>

                {/* Satır 7 — Grup Sözü (politika §10: metin BİREBİR, kısaltılamaz) */}
                <div className="rounded-xl border border-emerald-200 bg-white/70 px-4 py-3">
                  <p className="text-left text-xs font-bold uppercase tracking-wide text-emerald-700">Grup Sözü</p>
                  <p className="mt-1 text-left text-sm text-slate-700">{GROUP_PLEDGE_TEXT}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Checkbox
                      id="group-pledge"
                      checked={form.pledgeAccepted}
                      onCheckedChange={(checked) => onFieldChange("pledgeAccepted", checked === true)}
                    />
                    <Label htmlFor="group-pledge" className="cursor-pointer font-medium">
                      Grup Sözü'nü okudum, kabul ediyorum *
                    </Label>
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={onSubmit}
                disabled={submitDisabled}
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
