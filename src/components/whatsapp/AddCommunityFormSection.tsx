import { useRef } from "react";
import { Sparkles } from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { categoryOptions, languageOptions, originOptions, platformOptions } from "@/lib/whatsapp-landing-options";
import type { GroupFormState } from "@/lib/whatsapp-landing-form";
import type { LandingCategory, LandingLanguage, LandingOrigin } from "@/lib/whatsapp-landings";

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
  heroImageFile,
  onHeroImageFileChange,
  oauthSubmitting,
  submitting,
  onStartGoogleAuth,
  onSubmit,
}: AddCommunityFormSectionProps) {
  const heroImageInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="mt-8 rounded-[1.9rem] border border-emerald-200/70 bg-[linear-gradient(135deg,rgba(236,253,245,0.96)_0%,rgba(255,255,255,0.98)_42%,rgba(239,246,255,0.94)_100%)] p-3 shadow-[0_20px_60px_rgba(15,23,42,0.08)] ring-1 ring-white/80 backdrop-blur-sm">
      <div className="rounded-[1.45rem] bg-white/55 p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3 text-left">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ecfdf5_0%,#d1fae5_100%)] shadow-[0_10px_24px_rgba(16,185,129,0.16)] ring-1 ring-emerald-200/80">
              <Sparkles className="h-4.5 w-4.5 text-emerald-700" />
            </span>
            <div className="space-y-1">
              <h2 className="text-base font-bold tracking-[0.01em] text-slate-900 md:text-lg">Topluluk eklemek istiyorum</h2>
              <p className="text-sm text-slate-600">
                Mevcut toplulukları herkes görebilir. Yeni topluluk eklemek için Google hesabınla giriş yap.
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
                ? "Topluluk formunu aç"
                : "Google ile topluluk ekle"}
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
            {open ? "Topluluk formunu kapat" : "Topluluk formunu aç"}
          </AccordionTrigger>
          <AccordionContent className="border-t border-emerald-100 px-5 pb-5 pt-4">
            <div className="mb-5">
              <h3 className="text-left text-xl font-bold text-slate-900">Topluluk Ekle</h3>
              <p className="mt-1 text-left text-sm text-slate-600">
                Formu doldurup topluluğunu hemen incelemeye gönderebilirsin.
              </p>
            </div>

            <div className="space-y-5">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">1. Grup Bilgileri</h3>
              <div>
                <Label>Başvuru Tipi</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={form.submitterRole === "member" ? "default" : "outline"}
                    onClick={() => onFieldChange("submitterRole", "member")}
                    className={form.submitterRole === "member" ? "border-orange-500 bg-orange-500 text-white hover:bg-orange-600" : ""}
                  >
                    Topluluk Üyesiyim
                  </Button>
                  <Button
                    type="button"
                    variant={form.submitterRole === "manager" ? "default" : "outline"}
                    onClick={() => onFieldChange("submitterRole", "manager")}
                    className={form.submitterRole === "manager" ? "border-orange-500 bg-orange-500 text-white hover:bg-orange-600" : ""}
                  >
                    Topluluk Yöneticisiyim
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="platform">Platform *</Label>
                <Select value={form.platform} onValueChange={(value) => onFieldChange("platform", value)}>
                  <SelectTrigger id="platform" className={`mt-1 ${formFieldInsetClass}`}>
                    <SelectValue placeholder="Platform seç" />
                  </SelectTrigger>
                  <SelectContent>
                    {platformOptions.map((platform) => (
                      <SelectItem key={platform} value={platform}>
                        {platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category">Kategori</Label>
                <Select value={form.category} onValueChange={(value) => onFieldChange("category", value as LandingCategory)}>
                  <SelectTrigger id="category" className={`mt-1 ${formFieldInsetClass}`}>
                    <SelectValue placeholder="İsteğe bağlı kategori seç" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                <Label htmlFor="whatsapp-link">Topluluk Linki *</Label>
                <Input
                  id="whatsapp-link"
                  className={formFieldInsetClass}
                  value={form.whatsappLink}
                  onChange={(event) => onFieldChange("whatsappLink", event.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label htmlFor="country">Ülke *</Label>
                <Input
                  id="country"
                  className={formFieldInsetClass}
                  lang="tr"
                  spellCheck
                  value={form.country}
                  onChange={(event) => onFieldChange("country", event.target.value)}
                  placeholder="Global veya ülke adı giriniz"
                />
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

              <div>
                <Label htmlFor="member-count">Topluluk Üye Sayısı</Label>
                <Input
                  id="member-count"
                  type="number"
                  className={formFieldInsetClass}
                  value={form.memberCount}
                  onChange={(event) => onFieldChange("memberCount", event.target.value)}
                  placeholder="Örn: 250"
                  min={0}
                />
              </div>

              <div>
                <Label htmlFor="language">Topluluk Dili</Label>
                <Select value={form.language} onValueChange={(value) => onFieldChange("language", value as LandingLanguage)}>
                  <SelectTrigger id="language" className={formFieldInsetClass}>
                    <SelectValue placeholder="Dil seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {languageOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="origin">Köken / Bölge</Label>
                <Select value={form.origin} onValueChange={(value) => onFieldChange("origin", value as LandingOrigin)}>
                  <SelectTrigger id="origin" className={formFieldInsetClass}>
                    <SelectValue placeholder="Bölge seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {originOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.submitterRole === "manager" ? (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  2. Topluluk Kartı Özelliklerini Belirtin (Sadece Yöneticiler İçindir.)
                </h3>

                <div>
                  <Label htmlFor="hero-image-file">Topluluk Kartı İçin Görsel Yükle</Label>
                  <input
                    ref={heroImageInputRef}
                    id="hero-image-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(event) => onHeroImageFileChange(event.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    onClick={() => heroImageInputRef.current?.click()}
                    className="ml-3 inline-flex h-11 items-center gap-2 rounded-xl border border-orange-200 bg-orange-500 px-4 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(249,115,22,0.22)] transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-[0_16px_36px_rgba(249,115,22,0.28)]"
                  >
                    Dosya Seç
                  </button>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {heroImageFile
                      ? `Seçilen dosya: ${heroImageFile.name}`
                      : "Dosya tipi: JPG, PNG, WEBP, GIF. Önerilen oran: 16:9 yatay. Maksimum dosya boyutu: 5 MB."}
                  </p>
                </div>

                <div>
                  <Label htmlFor="cta-text">Yeni üyeler için mesaj</Label>
                  <Textarea
                    id="cta-text"
                    className={formFieldInsetClass}
                    lang="tr"
                    spellCheck
                    rows={4}
                    value={form.callToActionText}
                    onChange={(event) => onFieldChange("callToActionText", event.target.value)}
                    placeholder="Yeni üyelere çağrı amacıyla metin yaz."
                  />
                </div>

                <div>
                  <Label htmlFor="conditions">Topluluk Kuralları</Label>
                  <Textarea
                    id="conditions"
                    className={formFieldInsetClass}
                    lang="tr"
                    spellCheck
                    rows={4}
                    value={form.conditions}
                    onChange={(event) => onFieldChange("conditions", event.target.value)}
                    placeholder={"Her satıra bir kural yazın\nÖrn: Grup içi reklam yasak"}
                  />
                </div>

                <div>
                  <Label htmlFor="admin-name">Topluluk Yöneticisi Adı Soyad *</Label>
                  <Input
                    id="admin-name"
                    className={formFieldInsetClass}
                    lang="tr"
                    spellCheck
                    value={form.adminName}
                    onChange={(event) => onFieldChange("adminName", event.target.value)}
                    placeholder="Ad Soyad"
                  />
                </div>

                <div>
                  <Label htmlFor="admin-email">Topluluk Yöneticisi Mail Adresi *</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    className={formFieldInsetClass}
                    value={form.adminEmail}
                    onChange={(event) => onFieldChange("adminEmail", event.target.value)}
                    placeholder="ornek@email.com"
                  />
                </div>

                <div>
                  <Label htmlFor="admin-phone">Topluluk Yöneticisi Telefon *</Label>
                  <Input
                    id="admin-phone"
                    className={formFieldInsetClass}
                    value={form.adminPhone}
                    onChange={(event) => onFieldChange("adminPhone", event.target.value)}
                    placeholder="+49 ..."
                  />
                </div>
              </div>
            ) : null}

            <Button
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={onSubmit}
              disabled={submitting}
            >
              {submitting ? "Gönderiliyor..." : "Başvuruyu Gönder"}
            </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
